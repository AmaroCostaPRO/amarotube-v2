"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { WatchParty } from '@/types/party';
import { Video } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users2, Play, Loader2, Sparkles, Tv, Info, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface EnrichedParty extends WatchParty {
   videos: Video;
   profiles: { username: string; avatar_url: string };
   member_count: number;
}

export default function PartiesPage() {
   const { session } = useAuth();
   const router = useRouter();
   const [parties, setParties] = useState<EnrichedParty[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   const fetchParties = async () => {
      setIsLoading(true);
      try {
         const { data, error } = await supabase
            .from('watch_parties')
            .select(`
          *,
          videos (*),
          profiles!watch_parties_host_id_fkey (username, avatar_url),
          watch_party_members (count)
        `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

         if (error) throw error;

         const formatted = (data || []).map(p => ({
            ...p,
            videos: Array.isArray(p.videos) ? p.videos[0] : p.videos,
            profiles: p.profiles,
            member_count: p.watch_party_members?.[0]?.count || 0
         }));

         setParties(formatted as unknown as EnrichedParty[]);
      } catch {
         toast.error("Erro ao carregar sessões.");
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchParties();

      const channel = supabase
         .channel('public-parties')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'watch_parties' }, () => {
            fetchParties();
         })
         .subscribe();

      return () => { supabase.removeChannel(channel); };
   }, []);

   return (
      <div className="space-y-6 sm:space-y-10 pb-20 transition-none">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-none" data-aos="fade-down">
            <div className="space-y-1 transition-none">
               <h1 className="text-4xl font-black tracking-tight text-contrast-bg transition-none">Watch Parties</h1>
               <p className="font-bold opacity-60 text-contrast-bg transition-none">Assista sincronizado com a comunidade em tempo real.</p>
            </div>
         </div>

         {!session && (
            <div className="mb-10 p-6 glass-panel border-white/10 rounded-xl sm:rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4 bg-primary/5 transition-none">
               <div className="flex items-center gap-4 w-full transition-none">
                  <Info className="h-6 w-6 text-primary shrink-0 transition-none" />
                  <p className="font-bold opacity-80 text-contrast-bg transition-none">Participe de sessões coletivas e assista vídeos simultaneamente com outros membros.</p>
               </div>
               <Link href="/login" className="w-full md:w-auto md:ml-auto transition-none">
                  <Button className="rounded-xl font-black px-6 w-full transition-none">Entrar Agora</Button>
               </Link>
            </div>
         )}

         {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 transition-none">
               {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-[2rem] bg-white/5 animate-pulse transition-none" />)}
            </div>
         ) : !session ? (
            <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 transition-none">
               <Lock className="h-20 w-20 mx-auto mb-6 text-contrast-bg transition-none" />
               <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg transition-none">Sessões Privadas</p>
               <p className="font-medium px-4 text-contrast-bg opacity-70 transition-none">A visualização e participação em Watch Parties é exclusiva para membros registrados.</p>
            </div>
         ) : parties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 transition-none">
               {parties.map(party => (
                  <Card key={party.id} className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl transition-transform hover:-translate-y-2 group">
                     <div className="relative aspect-video overflow-hidden transition-none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={party.videos?.thumbnail_url || ''} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transition-none">
                           <Play className="h-12 w-12 text-white fill-current transition-none" />
                        </div>
                        <div className="absolute top-4 left-4 bg-green-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse transition-none">
                           <div className="h-1.5 w-1.5 rounded-full bg-white transition-none" /> Ao Vivo
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 transition-none">
                           <Users2 size={12} className="transition-none" /> {party.member_count} Pessoas
                        </div>
                     </div>
                     <CardHeader className="p-4 sm:p-6 pb-2 transition-none">
                        <div className="flex items-center gap-3 mb-3 transition-none">
                           <Avatar className="h-6 w-6 border border-white/10 transition-none">
                              <AvatarImage src={party.profiles?.avatar_url} className="transition-none" />
                              <AvatarFallback className="transition-none">{party.profiles?.username?.[0]}</AvatarFallback>
                           </Avatar>
                           <span className="text-[10px] font-black uppercase opacity-40 tracking-widest transition-none">Host: @{party.profiles?.username}</span>
                        </div>
                        <CardTitle className="text-xl font-black line-clamp-2 leading-tight group-hover:text-primary transition-colors transition-none">
                           {party.videos?.title}
                        </CardTitle>
                     </CardHeader>
                     <CardContent className="p-4 sm:p-6 pt-4 transition-none">
                        <Button
                           onClick={() => router.push(`/parties/${party.id}`)}
                           className="w-full h-12 rounded-xl font-black neo-button bg-primary text-white shadow-lg shadow-primary/20 transition-none"
                        >
                           Entrar na Sala
                        </Button>
                     </CardContent>
                  </Card>
               ))}
            </div>
         ) : (
            <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 transition-none">
               <Tv className="h-20 w-20 mx-auto mb-6 text-contrast-bg transition-none" />
               <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg transition-none">Nenhuma sessão ativa</p>
               <p className="font-medium px-4 text-contrast-bg opacity-70 transition-none">Inicie uma Watch Party em qualquer página de vídeo para convidar a galera.</p>
            </div>
         )}

         <div className="p-8 glass-panel rounded-xl sm:rounded-[2rem] border-none shadow-xl bg-primary/5 transition-none">
            <h3 className="text-xl font-black flex items-center gap-2 mb-4 transition-none">
               <Sparkles className="text-primary transition-none" /> Como funciona?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm font-medium opacity-70 transition-none">
               <div className="space-y-2 transition-none">
                  <p className="font-black text-primary uppercase text-[10px] tracking-widest transition-none">Sincronia Total</p>
                  <p className="transition-none">O vídeo roda ao mesmo tempo para todos. Se o host pausar, pausa para todos.</p>
               </div>
               <div className="space-y-2 transition-none">
                  <p className="font-black text-primary uppercase text-[10px] tracking-widest transition-none">Controle do Host</p>
                  <p className="transition-none">Apenas quem criou a sala pode mudar o tempo do vídeo ou pausar/iniciar.</p>
               </div>
               <div className="space-y-2 transition-none">
                  <p className="font-black text-primary uppercase text-[10px] tracking-widest transition-none">Interação</p>
                  <p className="transition-none">Chat exclusivo por sala para comentar as cenas e interagir em tempo real.</p>
               </div>
            </div>
         </div>
      </div>
   );
}
