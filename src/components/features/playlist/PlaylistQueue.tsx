import { Video } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ListMusic, Play } from 'lucide-react';

interface PlaylistQueueProps {
  videos: Video[];
  playlistId: string;
  currentIndex: number;
  playlistTitle: string;
}

export function PlaylistQueue({ videos, playlistId, currentIndex, playlistTitle }: PlaylistQueueProps) {
  if (!videos || videos.length === 0) return null;

  return (
    <Card className="glass-panel border-none rounded-[2rem] overflow-hidden shadow-2xl transition-none" data-aos="fade-left">
      <CardHeader className="p-6 pb-2 border-b border-white/5 bg-white/5 transition-none">
        <div className="flex items-center gap-2 mb-1 transition-none">
           <ListMusic className="h-4 w-4 text-primary transition-none" />
           <p className="text-[10px] font-black uppercase tracking-widest text-foreground transition-none">Playlist Atual</p>
        </div>
        <CardTitle className="text-xl font-black truncate leading-tight transition-none">{playlistTitle || 'Lista de Reprodução'}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 transition-none">
        <ScrollArea className="h-[400px] transition-none">
          <div className="flex flex-col p-2 transition-none">
            {videos.map((video, index) => {
              const isCurrent = index === currentIndex;
              const isNext = index === (currentIndex + 1) % videos.length;

              return (
                <Link
                  key={`${video.id}-${index}`}
                  href={`/watch/${video.id}?playlist=${playlistId}&index=${index}`}
                  className={cn(
                    'group flex items-center gap-3 p-3 rounded-[1.5rem] transition-none mb-1',
                    isCurrent 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 pointer-events-none' 
                      : 'hover:bg-white/10'
                  )}
                >
                  <div className="relative aspect-video w-24 flex-shrink-0 overflow-hidden rounded-xl shadow-md border border-white/10 transition-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnail_url || '/placeholder.svg'} alt={video.title} className="w-full h-full object-cover transition-none" />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px] flex items-center justify-center transition-none">
                         <Play className="h-6 w-6 fill-current transition-none" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden flex-1 transition-none">
                    {isNext && !isCurrent && (
                      <span className="text-[9px] font-black text-primary uppercase tracking-tighter mb-0.5 animate-pulse transition-none">A Seguir</span>
                    )}
                    <h3 className={cn(
                      'font-bold text-xs leading-tight line-clamp-2 transition-none',
                      isCurrent ? 'text-primary-foreground' : 'group-hover:text-primary'
                    )}>
                      {video.title}
                    </h3>
                    <p className={cn(
                      "text-[10px] mt-1 font-medium truncate uppercase tracking-widest transition-none",
                      isCurrent ? "opacity-70" : "opacity-40"
                    )}>
                      {video.channel_name || 'Canal Desconhecido'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}