import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Link removed
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Video } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/lib/utils';
import { Users, Eye, Video as VideoIcon, Loader2, PlusCircle, ExternalLink, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

interface ChannelInfoDialogProps {
  video: Video;
  children: React.ReactNode;
}

interface ChannelStats {
  title: string;
  description: string;
  thumbnail: string;
  banner: string | null;
  subscriberCount: number | null;
  viewCount: number;
  videoCount: number;
  updated_at?: string;
}

export function ChannelInfoDialog({ video, children }: ChannelInfoDialogProps) {
  const { user, session } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [existingChannelId, setExistingChannelId] = useState<string | null>(null);

  const syncChannelMetadataAcrossVideos = useCallback(async (avatarUrl: string, description: string) => {
    if (!session || !video.channel_id) return;
    await supabase
      .from('videos')
      .update({ 
        channel_avatar_url: avatarUrl,
        channel_description: description 
      })
      .eq('channel_id', video.channel_id);
  }, [session, video.channel_id]);

  const fetchChannelData = useCallback(async () => {
    if (!video.channel_id || !session) return;
    setIsLoading(true);

    try {
      const { data: dbChannels } = await supabase
        .from('channels')
        .select('*')
        .eq('youtube_channel_id', video.channel_id)
        .or(`user_id.is.null,user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'}`)
        .order('user_id', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      const dbChannel = dbChannels?.[0];
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const isStale = !dbChannel?.created_at || new Date(dbChannel.created_at) < oneWeekAgo;

      if (dbChannel && !isStale) {
        setStats({
          title: dbChannel.name,
          description: dbChannel.description || '',
          thumbnail: dbChannel.avatar_url || '',
          banner: dbChannel.banner_url,
          subscriberCount: Number(dbChannel.subscriber_count),
          viewCount: Number(dbChannel.view_count),
          videoCount: dbChannel.video_count,
        });
        
        if (user && dbChannel.user_id === user.id) {
          setExistingChannelId(dbChannel.id);
        }
      } else {
        const { data, error } = await supabase.functions.invoke('get-channel-details', {
          body: { channelId: video.channel_id },
        });

        if (error) throw error;
        
        setStats(data);
        await syncChannelMetadataAcrossVideos(data.thumbnail, data.description);

        if (dbChannel) {
          await supabase.from('channels').update({
            name: data.title,
            description: data.description,
            avatar_url: data.thumbnail,
            banner_url: data.banner,
            subscriber_count: data.subscriberCount,
            view_count: data.viewCount,
            video_count: data.videoCount,
            created_at: new Date().toISOString()
          }).eq('id', dbChannel.id);
        } else {
          await supabase.from('channels').insert({
            user_id: null,
            youtube_channel_id: video.channel_id,
            name: data.title,
            description: data.description,
            avatar_url: data.thumbnail,
            banner_url: data.banner,
            subscriber_count: data.subscriberCount,
            view_count: data.viewCount,
            video_count: data.videoCount,
            is_auto_feed_enabled: false
          });
        }

        if (user) {
          const { data: follow } = await supabase.from('channels').select('id').eq('user_id', user.id).eq('youtube_channel_id', video.channel_id).maybeSingle();
          if (follow) setExistingChannelId(follow.id);
        }
      }
    } catch {
      toast.error('Falha ao sincronizar canal.');
    } finally {
      setIsLoading(false);
    }
  }, [video.channel_id, session, user, syncChannelMetadataAcrossVideos]);

  useEffect(() => {
    if (isOpen && session) {
      fetchChannelData();
    }
  }, [isOpen, session, fetchChannelData]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      e.stopPropagation();
      toast.info("Acesse sua conta para ver detalhes do canal.", {
        icon: <Lock className="h-4 w-4" />,
        action: {
          label: "Login",
          onClick: () => router.push('/login')
        }
      });
      return;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClickCapture={handleTriggerClick}>
        {children}
      </DialogTrigger>
      {session && (
        <DialogContent className="max-w-md glass-panel border-white/20 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          <div className="relative h-32 bg-primary/20">
            {stats?.banner && (
              <img src={stats.banner} className="w-full h-full object-cover opacity-80" alt="" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute -bottom-10 left-8">
              <Avatar className="h-24 w-24 border-4 border-background shadow-2xl bg-muted">
                <AvatarImage src={stats?.thumbnail || video.channel_avatar_url || ''} />
                <AvatarFallback className="text-2xl font-black">{video.channel_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-14 px-8 pb-8 space-y-6">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">{stats?.title || video.channel_name}</DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-primary">
                Dados extraídos do YouTube
              </DialogDescription>
              {existingChannelId && <span className="inline-block mt-1 bg-green-500/10 text-green-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Em seus Canais</span>}
            </div>

            <ScrollArea className="h-24">
              <p className="text-sm text-muted-foreground leading-relaxed pr-4 font-medium">
                {stats?.description || 'Nenhuma descrição disponível.'}
              </p>
            </ScrollArea>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass-panel p-3 rounded-2xl text-center bg-black/5 dark:bg-white/5 border-none shadow-inner">
                <Users className="h-4 w-4 mx-auto mb-1 text-red-500" />
                <p className="text-[8px] font-black uppercase opacity-40">Inscritos</p>
                <p className="text-xs font-black">{getStatValue(stats?.subscriberCount, true)}</p>
              </div>
              <div className="glass-panel p-3 rounded-2xl text-center bg-black/5 dark:bg-white/5 border-none shadow-inner">
                <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <p className="text-[8px] font-black uppercase opacity-40">Views</p>
                <p className="text-xs font-black">{getStatValue(stats?.viewCount)}</p>
              </div>
              <div className="glass-panel p-3 rounded-2xl text-center bg-black/5 dark:bg-white/5 border-none shadow-inner">
                <VideoIcon className="h-4 w-4 mx-auto mb-1 text-green-500" />
                <p className="text-[8px] font-black uppercase opacity-40">Vídeos</p>
                <p className="text-xs font-black">{getStatValue(stats?.videoCount)}</p>
              </div>
            </div>

            <div className="pt-2">
              {isLoading ? (
                <div className="flex justify-center py-2"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                existingChannelId ? (
                  <Button 
                    className="w-full h-12 rounded-2xl font-black gap-2 neo-button bg-primary text-white"
                    onClick={() => { setIsOpen(false);    router.push(`/channels/${video.channel_id}`); }}
                  >
                    <ExternalLink size={18} /> Acessar Página
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 rounded-2xl font-black gap-2 neo-button bg-primary text-white"
                    onClick={async () => {
                      setIsAdding(true);
                      try {
                        const { data, error } = await supabase.from('channels').insert({
                          user_id: user?.id,
                          youtube_channel_id: video.channel_id,
                          name: stats?.title,
                          description: stats?.description,
                          avatar_url: stats?.thumbnail,
                          banner_url: stats?.banner,
                          subscriber_count: stats?.subscriberCount,
                          view_count: stats?.viewCount,
                          video_count: stats?.videoCount,
                          is_auto_feed_enabled: false
                        }).select().single();
                        if (error) throw error;
                        toast.success('Adicionado!');
                        setExistingChannelId(data.id);
                        apiService.syncSingleChannel(data.id);
                      } catch { toast.error('Erro ao adicionar.'); } finally { setIsAdding(false); }
                    }}
                    disabled={isAdding}
                  >
                    {isAdding ? <Loader2 className="animate-spin h-5 w-5" /> : <PlusCircle size={18} />}
                    Adicionar aos meus Canais
                  </Button>
                )
              )}
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );

  function getStatValue(val: number | null | undefined, isSub: boolean = false) {
    if (val === undefined || isLoading) return '...';
    if (isSub && val === null) return 'Oculto';
    return formatNumber(val || 0);
  }
}