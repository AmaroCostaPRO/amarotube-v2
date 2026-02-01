"use client";

import { useAuth } from '@/context/AuthContext';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, ThumbsUp, History as HistoryIcon } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

interface ViewHistoryItem {
  id: string;
  viewed_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string;
  } | null;
}

interface LikeHistoryItem {
  id: string;
  created_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string;
  } | null;
}

export default function HistoryPage() {
  const { user } = useAuth();

  const { data: viewHistory, isLoading: isLoadingViews } = useQuery({
    queryKey: ['viewHistory', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('video_views')
        .select('id, viewed_at, videos(id, title, thumbnail_url)')
        .eq('user_id', user!.id)
        .order('viewed_at', { ascending: false })
        .limit(20);
      return (data?.map(i => ({ 
        ...i, 
        videos: Array.isArray(i.videos) ? i.videos[0] : i.videos 
      })) || []) as ViewHistoryItem[];
    },
    enabled: !!user,
  });

  const { data: likeHistory, isLoading: isLoadingLikes } = useQuery({
    queryKey: ['likeHistory', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('likes')
        .select('id, created_at, videos(id, title, thumbnail_url)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data?.map(i => ({ 
        ...i, 
        videos: Array.isArray(i.videos) ? i.videos[0] : i.videos 
      })) || []) as LikeHistoryItem[];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] opacity-50 border-dashed border-2 bg-transparent border-white/10">
        <HistoryIcon className="h-20 w-20 mx-auto mb-6 text-contrast-bg" />
        <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg">Faça Login</p>
        <p className="font-medium px-4 text-contrast-bg opacity-70 mb-6">
          Você precisa estar logado para ver seu histórico.
        </p>
        <Link href="/login">
          <Button className="rounded-xl h-12 font-black px-8">Entrar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 transition-none">
      <div className="space-y-1 transition-none" data-aos="fade-right">
        <h1 className="text-4xl font-black tracking-tight text-contrast-bg transition-none">Seu Histórico</h1>
        <p className="font-bold opacity-60 text-contrast-bg transition-none">
          Acesse rapidamente os vídeos que você assistiu e as curtidas que enviou.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 transition-none">
        <div className="glass-panel rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col h-[500px] transition-none shadow-xl">
          <CardHeader className="px-0 pt-0 pb-6 transition-none">
            <CardTitle className="flex items-center gap-3 text-xl font-bold transition-none">
              <Eye className="text-blue-500 transition-none" /> Vistos recentemente
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 pr-4 transition-none">
            {isLoadingViews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 transition-none">
                {viewHistory?.map(item => item.videos && (
                  <Link 
                    href={`/watch/${item.videos.id}`} 
                    key={item.id} 
                    className="flex gap-4 p-3 rounded-xl hover:bg-white/10 group transition-none"
                  >
                    <img 
                      src={item.videos.thumbnail_url} 
                      alt={item.videos.title}
                      className="w-24 aspect-video object-cover rounded-xl shadow-lg transition-none" 
                    />
                    <div className="flex-1 min-w-0 transition-none">
                      <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-none">
                        {item.videos.title}
                      </p>
                      <p className="text-[10px] opacity-50 mt-1 uppercase font-black transition-none">
                        {format(new Date(item.viewed_at), "dd MMM · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </Link>
                ))}
                {(!viewHistory || viewHistory.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">Nenhum vídeo assistido ainda.</p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="glass-panel rounded-xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col h-[500px] transition-none shadow-xl">
          <CardHeader className="px-0 pt-0 pb-6 transition-none">
            <CardTitle className="flex items-center gap-3 text-xl font-bold transition-none">
              <ThumbsUp className="text-red-500 transition-none" /> Curtidas recentes
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 pr-4 transition-none">
            {isLoadingLikes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 transition-none">
                {likeHistory?.map(item => item.videos && (
                  <Link 
                    href={`/watch/${item.videos.id}`} 
                    key={item.id} 
                    className="flex gap-4 p-3 rounded-xl hover:bg-white/10 group transition-none"
                  >
                    <img 
                      src={item.videos.thumbnail_url} 
                      alt={item.videos.title}
                      className="w-24 aspect-video object-cover rounded-xl shadow-lg transition-none" 
                    />
                    <div className="flex-1 min-w-0 transition-none">
                      <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-none">
                        {item.videos.title}
                      </p>
                      <p className="text-[10px] opacity-50 mt-1 uppercase font-black transition-none">
                        {format(new Date(item.created_at), "dd MMM · HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </Link>
                ))}
                {(!likeHistory || likeHistory.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma curtida ainda.</p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
