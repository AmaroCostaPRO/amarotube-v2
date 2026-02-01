import React, { useEffect, useState } from 'react';
import { videoService } from '@/services';
import { Video } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface RelatedVideosProps {
  currentVideoId: string;
}

export function RelatedVideos({ currentVideoId }: RelatedVideosProps) {
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedVideos = async () => {
      setLoading(true);
      try {
        // Usar videoService ao invés de supabase direto
        const videos = await videoService.getRelated(currentVideoId, 5);
        // Shuffle no cliente para aleatoriedade
        const shuffled = videos.sort(() => 0.5 - Math.random());
        setRelatedVideos(shuffled.slice(0, 3));
      } catch (error) {
        console.error('[RelatedVideos] Erro ao buscar vídeos:', error);
        setRelatedVideos([]);
      }
      setLoading(false);
    };

    fetchRelatedVideos();
  }, [currentVideoId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-start space-x-4">
            <Skeleton className="h-18 w-32 rounded-md flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 transition-none">
      {relatedVideos.length > 0 ? (
        relatedVideos.map(video => (
          <Link key={video.id} href={`/watch/${video.id}`} className="group flex items-start gap-3 p-2 rounded-xl hover:bg-accent transition-none">
            <div className="relative overflow-hidden rounded-md w-32 h-18 flex-shrink-0 transition-none">
              <img
                src={video.thumbnail_url || '/placeholder.svg'}
                alt={video.title}
                className="w-full h-full object-cover transition-none"
              />
            </div>
            <div className="flex flex-col overflow-hidden flex-1 transition-none">
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-none">
                {video.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate transition-none">
                {video.channel_name || 'Canal Desconhecido'}
              </p>
            </div>
          </Link>
        ))
      ) : (
        <p className="text-gray-500 italic transition-none text-center py-4">Nenhum vídeo relacionado encontrado.</p>
      )}
    </div>
  );
}