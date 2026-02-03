import React, { useState } from 'react';
import { FeedVideo } from '@/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, BarChart, CheckCircle2, ThumbsUp, TrendingUp, Trash2, ShieldAlert, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVideoWatchedStatus } from '@/hooks/useVideoHistory';
import { VideoMetricsDialog } from './VideoMetricsDialog';
import { DeleteVideoDialog } from './DeleteVideoDialog';
import { ChannelInfoDialog } from '@/components/features/channel/ChannelInfoDialog';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface VideoCardProps {
  video: FeedVideo;
  onDataUpdate?: (updates: Partial<FeedVideo>) => void;
  onVideoDeleted?: () => void;
}

export function VideoCard({ video, onDataUpdate, onVideoDeleted }: VideoCardProps) {
  const { user, session, isAdmin } = useAuth();
  const { data: isWatched } = useVideoWatchedStatus(video.id);
  const [showSensitive, setShowSensitive] = useState(false);

  const isOwner = user?.id === video.user_id;
  const canDelete = isOwner || isAdmin;
  const isSensitive = video.is_nsfw || video.is_spoiler;

  const handleMetricsUpdate = (latestMetrics: { views: number; likes: number; engagement: number } | null) => {
    if (latestMetrics && onDataUpdate) {
      onDataUpdate({
        view_count: latestMetrics.views,
        like_count: latestMetrics.likes,
      });
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col glass-panel rounded-xl sm:rounded-[2rem] overflow-hidden h-full shadow-lg border-none"
    >
      <div className="relative aspect-video overflow-hidden">
        <Link href={`/watch/${video.id}`} className="block w-full h-full">
          <img
            src={video.thumbnail_url || '/placeholder.svg'}
            alt={`Capa do vídeo: ${video.title}`}
            className={cn(
              "w-full h-full object-cover transition-none",
              isSensitive && !showSensitive && "blur-2xl scale-125 grayscale"
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-none" />
        </Link>

        {isSensitive && !showSensitive && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center bg-black/40 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
              {video.is_nsfw ? <ShieldAlert className="text-red-500 h-6 w-6" /> : <EyeOff className="text-orange-500 h-6 w-6" />}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-3">
              Conteúdo {video.is_nsfw ? 'Sensível' : 'com Spoiler'}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 rounded-xl font-bold text-[10px] uppercase px-4 transition-none"
              onClick={(e) => { e.preventDefault(); setShowSensitive(true); }}
            >
              Revelar
            </Button>
          </div>
        )}

        {isWatched && session && (
          <div className="absolute top-3 right-3 p-1.5 rounded-full bg-green-500 shadow-lg z-10 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        )}

        {canDelete && session && (
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-none z-20">
            <DeleteVideoDialog video={video} onDeleteSuccess={() => onVideoDeleted?.()}>
              <Button size="icon" variant="destructive" aria-label="Excluir este vídeo" className="h-8 w-8 rounded-full shadow-lg border-none hover:scale-110 transition-none">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteVideoDialog>
          </div>
        )}

        {session && (
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-none z-20">
            <VideoMetricsDialog video={video} onMetricsUpdate={handleMetricsUpdate}>
              <Button size="icon" variant="secondary" aria-label="Ver métricas em tempo real" className="h-8 w-8 rounded-full shadow-lg backdrop-blur-md bg-white/20 border-white/20 text-white hover:bg-white/40 transition-none">
                <BarChart className="h-4 w-4" />
              </Button>
            </VideoMetricsDialog>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-5 flex flex-col flex-1">
        <div className="flex gap-3 mb-4">
          <ChannelInfoDialog video={video}>
            <button aria-label={`Ver detalhes do canal ${video.channel_name}`} className="shrink-0 transition-transform active:scale-95">
              <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
                <AvatarImage src={video.channel_avatar_url || ''} alt={`Avatar de ${video.channel_name}`} />
                <AvatarFallback>{video.channel_name?.[0]}</AvatarFallback>
              </Avatar>
            </button>
          </ChannelInfoDialog>

          <div className="flex-1 min-w-0">
            <Link href={`/watch/${video.id}`}>
              <h3 className="font-bold text-sm leading-tight line-clamp-2 hover:text-primary transition-none">
                {video.title}
              </h3>
            </Link>
            <ChannelInfoDialog video={video}>
              <button aria-label={`Acessar canal ${video.channel_name}`} className="block text-[10px] font-black uppercase tracking-widest opacity-40 mt-1 truncate hover:text-primary hover:opacity-100 transition-all text-left">
                {video.channel_name}
              </button>
            </ChannelInfoDialog>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between text-[11px] font-black uppercase tracking-widest transition-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-blue-500" /> {formatCompactNumber(video.view_count)}</span>
            <span className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 text-red-500" /> {formatCompactNumber(video.like_count)}</span>
          </div>
          <div className="flex gap-1 items-center">
            {video.is_nsfw && <Badge variant="destructive" className="h-5 text-[8px] rounded-lg">NSFW</Badge>}
            {video.is_spoiler && <Badge variant="secondary" className="h-5 text-[8px] rounded-lg bg-orange-500/20 text-orange-500">SPOILER</Badge>}
            {video.view_count_delta > 0 && (
              <Badge variant="secondary" className="rounded-lg px-1.5 py-0 h-5 bg-blue-500/10 text-blue-500 border-none" title="Viral">
                <TrendingUp className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}