"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Video } from '@/types';
import { WatchParty, PartyMember } from '@/types/party';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users2, Play, Loader2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface WatchPartyManagerProps {
  video: Video;
  onSyncAction: (action: 'play' | 'pause' | 'seek', time?: number) => void;
  isCurrentPlaying: boolean;
  currentTime: number;
}

export function WatchPartyManager({ video, onSyncAction, isCurrentPlaying, currentTime }: WatchPartyManagerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeParty, setActiveParty] = useState<WatchParty | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchActiveParty = useCallback(async () => {
    const { data } = await supabase
      .from('watch_parties')
      .select('*')
      .eq('video_id', video.id)
      .eq('status', 'active')
      .maybeSingle();

    if (data) setActiveParty(data as WatchParty);
  }, [video.id]);

  const fetchMembers = useCallback(async (partyId: string) => {
    const { data } = await supabase
      .from('watch_party_members')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('party_id', partyId);

    if (data) setMembers(data as unknown as PartyMember[]);
  }, []);

  useEffect(() => {
    fetchActiveParty();
  }, [fetchActiveParty]);

  useEffect(() => {
    if (!activeParty) return;
    fetchMembers(activeParty.id);
  }, [activeParty, fetchMembers]);

  const handleStartParty = async () => {
    if (!user) return toast.error("Faça login.");
    setIsLoading(true);
    try {
      // REGRA: Início em Lobby Mode (Start Paused)
      const { data, error } = await supabase
        .from('watch_parties')
        .insert({
          video_id: video.id,
          host_id: user.id,
          playback_time: currentTime,
          is_playing: false // Sempre começa pausado
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('watch_party_members').insert({ party_id: data.id, user_id: user.id });
      toast.success("Watch Party iniciada em modo Lobby!");
      router.push(`/party/${data.id}`);
    } catch (err: unknown) {
      toast.error("Erro ao iniciar festa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-2xl transition-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", activeParty ? "bg-green-500/20 text-green-500" : "bg-primary/20 text-primary")}>
              <Users2 size={20} />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">Watch Party</h4>
              <p className="text-[10px] font-bold opacity-40 uppercase">{activeParty ? 'Sessão em andamento' : 'Assista em grupo'}</p>
            </div>
          </div>
          {activeParty && (
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m, i) => (
                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={m.profiles?.avatar_url} />
                  <AvatarFallback className="text-[8px] font-black">{m.profiles?.username?.[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>

        {!activeParty ? (
          <Button
            onClick={handleStartParty}
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-black gap-2 neo-button bg-primary text-white"
          >
            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            Iniciar Sessão
          </Button>
        ) : (
          <Button
            onClick={() => router.push(`/party/${activeParty.id}`)}
            className="w-full h-11 rounded-xl font-black gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <ExternalLink size={16} /> Entrar na Sala
          </Button>
        )}
      </CardContent>
    </Card>
  );
}