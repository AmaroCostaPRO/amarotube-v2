"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { WatchParty, PartyMember } from '@/types/party';
import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Users, Power, Share2, MessageCircle, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartyChat } from '@/components/party/PartyChat';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function PartyRoomPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [party, setParty] = useState<WatchParty | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isHost = user?.id === party?.host_id;

  const fetchMembers = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('watch_party_members')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('party_id', id);
    if (data) setMembers(data as PartyMember[]);
  }, [id]);

  const fetchPartyData = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('watch_parties')
        .select('*, videos(*), profiles!watch_parties_host_id_fkey(username, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setParty(data as WatchParty);
      setVideo(Array.isArray(data.videos) ? data.videos[0] : (data.videos as Video));

      if (user && data.host_id !== user.id) {
        await supabase.from('watch_party_members').upsert({ party_id: id, user_id: user.id });
      }
      fetchMembers();
    } catch {
      router.push('/parties');
    } finally {
      setIsLoading(false);
    }
  }, [id, user, router, fetchMembers]);

  useEffect(() => {
    if (!id) return;
    fetchPartyData();

    const channel = supabase.channel(`party-metadata-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'watch_parties',
        filter: `id=eq.${id}`
      }, (payload) => {
        const updatedParty = payload.new as WatchParty;
        setParty(prev => prev ? { ...prev, status: updatedParty.status } : updatedParty);
        
        if (updatedParty.status === 'finished') {
          toast.info("A Watch Party foi encerrada pelo host.");
          router.push('/parties');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'watch_party_members', filter: `party_id=eq.${id}` }, fetchMembers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (user && id) supabase.from('watch_party_members').delete().match({ party_id: id, user_id: user.id });
    };
  }, [id, user, fetchMembers, fetchPartyData, router]);

  const handleEndParty = async () => {
    if (!party || !id) return;
    if (confirm("Encerrar esta Watch Party para todos?")) {
      await supabase.from('watch_parties').update({ status: 'finished' }).eq('id', id);
      router.push('/parties');
    }
  };

  if (isLoading) return <div className="p-20"><Skeleton className="h-96 w-full rounded-[3rem]" /></div>;
  if (!party || !video) return null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/parties" className="inline-flex items-center text-sm font-bold hover:text-primary transition-colors group text-contrast-bg">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar para Central
        </Link>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="rounded-xl h-10 px-6 font-black gap-2 bg-white/5 border-white/10" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link da sala copiado!"); }}>
            <Share2 size={16} /> Convidar
          </Button>
          {isHost && (
            <Button onClick={handleEndParty} variant="destructive" className="rounded-xl h-10 px-6 font-black gap-2">
              <Power size={16} /> Encerrar Sala
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <div className="glass-panel border-none rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-2xl relative aspect-video bg-black group/player">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              {isHost ? (
                <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                  <Crown size={12} className="fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {party.is_playing ? 'Você está transmitindo' : 'Prepare o vídeo e dê o Play'}
                  </span>
                </div>
              ) : (
                <>
                  <div className={cn("h-2 w-2 rounded-full animate-pulse", party.is_playing ? "bg-green-500" : "bg-orange-500")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", party.is_playing ? "text-green-500" : "text-orange-500")}>
                    {party.is_playing ? 'Sessão ao vivo' : 'Aguardando o Host (Lobby)'}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight">{video.title}</h1>
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={video.channel_avatar_url || ''} />
                <AvatarFallback>{video.channel_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-black text-sm">{video.channel_name}</p>
                <p className="text-[10px] uppercase font-bold opacity-40">Original no YouTube</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 flex flex-col h-[calc(100vh-250px)] lg:sticky lg:top-28">
          <Card className="glass-panel border-none rounded-2xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
            <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-black text-lg flex items-center gap-2">
                <MessageCircle size={20} className="text-primary" /> Chat da Sala
              </h3>
              <div className="flex items-center gap-1.5 opacity-40">
                <Users size={12} />
                <span className="text-[10px] font-black">{members.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PartyChat partyId={id} />
            </div>
          </Card>

          <Card className="glass-panel border-none rounded-2xl sm:rounded-[2rem] p-4 shrink-0">
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase opacity-40 tracking-widest px-1">Participantes</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m, i) => (
                  <Avatar key={i} className="h-8 w-8 border border-white/10 ring-2 ring-background">
                    <AvatarImage src={m.profiles?.avatar_url} title={m.profiles?.username} />
                    <AvatarFallback>{m.profiles?.username?.[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
