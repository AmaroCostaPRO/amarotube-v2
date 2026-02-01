"use client";

import { useAuth } from '@/context/AuthContext';
import { ListMusic, PlusCircle, Info, LayoutGrid, Youtube, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Playlist {
  id: string;
  title: string;
  is_public: boolean;
  video_count?: number;
  thumbnail_urls?: string[];
  username?: string;
  profiles?: { username: string };
}

export default function PlaylistsPage() {
  const { session, user } = useAuth();

  const { data: myPlaylists, isLoading: isLoadingMyPlaylists } = useQuery({
    queryKey: ['myPlaylists', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('playlists')
        .select('*, profiles(username)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data as Playlist[] || [];
    },
    enabled: !!user,
  });

  const { data: publicPlaylists, isLoading: isLoadingPublicPlaylists } = useQuery({
    queryKey: ['publicPlaylists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('playlists')
        .select('*, profiles(username)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return data as Playlist[] || [];
    },
    enabled: !!session,
  });

  const renderPlaylistGrid = (playlists: Playlist[], loading: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (playlists.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">Nenhuma playlist encontrada.</p>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {playlists.map(playlist => (
          <Link
            key={playlist.id}
            href={`/playlists/${playlist.id}`}
            className="glass-panel rounded-2xl p-4 hover:scale-[1.02] transition-transform"
          >
            <div className="aspect-video bg-muted rounded-xl mb-3 flex items-center justify-center">
              <ListMusic className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-bold line-clamp-1">{playlist.title}</h3>
            <p className="text-xs text-muted-foreground">
              {playlist.profiles?.username || 'usuário'} • {playlist.video_count || 0} vídeos
            </p>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-16 pb-20 transition-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-none" data-aos="fade-down">
        <div className="space-y-1 transition-none">
          <h1 className="text-4xl font-black tracking-tight text-contrast-bg transition-none">Bibliotecas</h1>
          <p className="font-bold opacity-60 text-contrast-bg transition-none">
            Explore coleções exclusivas e organize suas curadorias favoritas.
          </p>
        </div>
        {session && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="rounded-2xl h-12 px-6 font-bold gap-2 w-full sm:w-auto transition-none border-white/10 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md"
            >
              <Youtube size={20} className="text-red-500 transition-none" /> Importar do YouTube
            </Button>
            <Button className="rounded-2xl h-12 px-6 neo-button font-black gap-2 w-full sm:w-auto transition-none bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <PlusCircle size={20} className="transition-none" /> Criar Playlist
            </Button>
          </div>
        )}
      </div>

      {!session && (
        <div className="p-8 glass-panel border-white/10 rounded-xl sm:rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 bg-primary/5 transition-none shadow-xl">
          <div className="flex items-center gap-4 w-full transition-none">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <Info className="h-6 w-6 transition-none" />
            </div>
            <p className="font-bold opacity-80 text-contrast-bg transition-none text-lg">
              Crie suas próprias listas de reprodução e salve suas curadorias favoritas registrando-se no AmaroTube.
            </p>
          </div>
          <Link href="/login" className="w-full md:w-auto md:ml-auto transition-none">
            <Button className="rounded-xl h-14 font-black px-10 w-full transition-none shadow-lg">Entrar Agora</Button>
          </Link>
        </div>
      )}

      {session && (
        <section className="space-y-8 transition-none">
          <div className="flex items-center gap-4 px-2 transition-none">
            <LayoutGrid className="text-primary h-6 w-6" />
            <h2 className="text-2xl font-black opacity-40 uppercase tracking-[0.2em] text-contrast-bg transition-none">
              Minha Coleção
            </h2>
          </div>
          {renderPlaylistGrid(myPlaylists || [], isLoadingMyPlaylists)}
        </section>
      )}

      <section className="space-y-8 transition-none pt-10">
        <div className="flex items-center gap-4 px-2 transition-none">
          <ListMusic className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-black opacity-40 uppercase tracking-[0.2em] text-contrast-bg transition-none">
            Explorar Curadorias
          </h2>
        </div>
        {session ? (
          renderPlaylistGrid(publicPlaylists || [], isLoadingPublicPlaylists)
        ) : (
          <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 transition-none">
            <ListMusic className="h-20 w-20 mx-auto mb-6 text-contrast-bg transition-none" />
            <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg transition-none">Curadorias Privadas</p>
            <p className="font-medium px-4 text-contrast-bg opacity-70 transition-none">
              A exploração de playlists públicas é exclusiva para membros registrados.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
