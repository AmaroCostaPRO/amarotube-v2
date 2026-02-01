import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { YouTubePlayer, YouTubeEvent } from 'react-youtube';
import { toast } from 'sonner';

// Tipos do Protocolo de Sync
export type SyncPacket = {
  isPlaying: boolean;
  timestamp: number;
  sentAt: number;
  videoId: string;
  type: 'heartbeat' | 'action' | 'ROOM_CLOSED';
};

interface UseWatchPartySyncProps {
  partyId: string;
  videoId: string;
  isHost: boolean;
  onHostUpdateDB?: (time: number, isPlaying: boolean) => void;
  onRoomClosed?: () => void;
}

export const useWatchPartySync = ({ 
  partyId, 
  videoId, 
  isHost,
  onHostUpdateDB,
  onRoomClosed
}: UseWatchPartySyncProps) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Controle de latência e debug
  const [latency, setLatency] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'adjusting' | 'buffering'>('synced');
  
  const isRemoteUpdate = useRef(false);
  const isClosingRoomRef = useRef(false); // Nova Ref de Controle

  // --- HOST LOGIC: Emissor ---

  const broadcastState = useCallback(async (type: 'action' | 'heartbeat' | 'ROOM_CLOSED' = 'action') => {
    if (!playerRef.current || !channelRef.current || !isHost) return;

    try {
      const currentTime = playerRef.current.getCurrentTime();
      const playerState = playerRef.current.getPlayerState();
      const isPlaying = playerState === 1;

      const packet: SyncPacket = {
        isPlaying,
        timestamp: currentTime,
        sentAt: Date.now(),
        videoId,
        type
      };

      await channelRef.current.send({
        type: 'broadcast',
        event: 'sync',
        payload: packet
      });

      if (type === 'action' && onHostUpdateDB) {
         onHostUpdateDB(currentTime, isPlaying);
      }

    } catch (error) {
      console.error("Erro ao transmitir status:", error);
    }
  }, [isHost, videoId, onHostUpdateDB]);

  // Heartbeat loop do Host (3s)
  useEffect(() => {
    if (!isHost) return;

    const interval = setInterval(() => {
      if (!isClosingRoomRef.current) {
        broadcastState('heartbeat');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHost, broadcastState]);


  // --- GUEST LOGIC: Receptor Inteligente ---

  const handleSyncPacket = useCallback((packet: SyncPacket) => {
    // Se a sala foi fechada, ignoramos tudo e avisamos
    if (packet.type === 'ROOM_CLOSED') {

      toast.info("A sessão foi encerrada pelo Host. Redirecionando...");
      
      // Delay dramático de 2s para evitar stale data na listagem
      setTimeout(() => {
        if (onRoomClosed) onRoomClosed();
      }, 2000);
      return; 
    }

    if (!playerRef.current || isHost) return;

    const now = Date.now();
    const networkLatency = (now - packet.sentAt) / 1000;
    setLatency(Math.round(networkLatency * 1000));

    const hostRealTime = packet.timestamp + (packet.isPlaying ? networkLatency : 0);
    const localTime = playerRef.current.getCurrentTime();
    const diff = hostRealTime - localTime;
    const absDiff = Math.abs(diff);

    const localState = playerRef.current.getPlayerState();
    const isLocalPlaying = localState === 1;

    if (packet.isPlaying !== isLocalPlaying) {
      isRemoteUpdate.current = true;
      if (packet.isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
        playerRef.current.seekTo(hostRealTime, true);
      }
      setTimeout(() => { isRemoteUpdate.current = false; }, 500);
    }

    if (packet.isPlaying) {
      if (absDiff < 0.5) {
        setSyncStatus('synced');
        if (playerRef.current.getPlaybackRate() !== 1) playerRef.current.setPlaybackRate(1); 
        return;
      }

      if (absDiff >= 0.5 && absDiff < 2.0) {
        setSyncStatus('adjusting');
        const newRate = diff > 0 ? 1.05 : 0.95;
        playerRef.current.setPlaybackRate(newRate);
        return;
      }

      if (absDiff >= 2.0) {
        setSyncStatus('buffering');
        isRemoteUpdate.current = true;
        playerRef.current.seekTo(hostRealTime, true);
        playerRef.current.setPlaybackRate(1);
        setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
        return;
      }
    }
  }, [isHost, onRoomClosed]);


  // --- SETUP DO CANAL ---

  useEffect(() => {
    if (!partyId) return;

    const channel = supabase.channel(`party-sync-${partyId}`, {
      config: { broadcast: { self: false, ack: false } }
    });

    channel
      .on('broadcast', { event: 'sync' }, (payload) => {
        handleSyncPacket(payload.payload as SyncPacket);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId, handleSyncPacket]);


  // --- INTERFACE PÚBLICA (Para ser ligada ao Player) ---

  const onPlayerStateChange = (event: YouTubeEvent) => {
    if (isRemoteUpdate.current) return;

    if (isHost) {
      broadcastState('action');
    }
  };

  // --- HOST CLEANUP (Auto Pause on Leave) ---

  const emergencyHostPause = useCallback(() => {
    // GUARDA DA CORREÇÃO: Se estiver fechando a sala, NÃO envia pause
    if (!isHost || !channelRef.current || isClosingRoomRef.current) return;

    try {
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      const packet: SyncPacket = {
        isPlaying: false, 
        timestamp: currentTime,
        sentAt: Date.now(),
        videoId,
        type: 'action'
      };
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'sync',
        payload: packet
      });

      if (onHostUpdateDB) onHostUpdateDB(currentTime, false);
      
    } catch (e) {
      console.error("Erro no Emergency Pause:", e);
    }
  }, [isHost, videoId, onHostUpdateDB]);

  // Função para ser chamada explicitamente ao clicar em "Encerrar Sala"
  const notifyCloseRoom = useCallback(async () => {
    if (!isHost) return;
    
    isClosingRoomRef.current = true; // Ativa a flag

    // Envia broadcast de prioridade máxima
    await broadcastState('ROOM_CLOSED');

    // DELAY INTENCIONAL: Dá tempo do socket entregar a mensagem antes do componente desmontar
    await new Promise(resolve => setTimeout(resolve, 500));

  }, [isHost, broadcastState]);

  useEffect(() => {
    if (!isHost) return;

    const handleBeforeUnload = () => emergencyHostPause();
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      emergencyHostPause();
    };
  }, [isHost, emergencyHostPause]);

  return {
    playerRef,
    latency,
    syncStatus,
    onPlayerStateChange,
    broadcastState,
    notifyCloseRoom 
  };
};
