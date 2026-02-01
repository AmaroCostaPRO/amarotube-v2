"use client";

import { useSearchParams } from 'next/navigation';
import { useFeed } from '@/hooks/useFeed';
import { VideoCard } from '@/components/features/video/VideoCard';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { FeedVideo } from '@/types';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const { data, isLoading } = useFeed();
  
  // Filtro simples pelo termo de busca - só vídeos com item_type === 'video'
  const filteredVideos = (data?.pages
    .flatMap(page => page)
    .filter(item => {
      // Só pega itens que são vídeos
      if (item.item_type !== 'video') return false;
      
      const video = item as FeedVideo;
      if (!query) return true;
      
      const searchLower = query.toLowerCase();
      return (
        (video.title?.toLowerCase().includes(searchLower)) ||
        (video.channel_name?.toLowerCase().includes(searchLower))
      );
    }) || []) as FeedVideo[];

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-1" data-aos="fade-right">
        <h1 className="text-4xl font-black tracking-tight text-contrast-bg">
          {query ? `Resultados para &quot;${query}&quot;` : 'Busca'}
        </h1>
        <p className="font-bold opacity-60 text-contrast-bg">
          {query 
            ? `${filteredVideos.length} vídeo${filteredVideos.length !== 1 ? 's' : ''} encontrado${filteredVideos.length !== 1 ? 's' : ''}`
            : 'Digite um termo na barra de pesquisa para buscar vídeos.'
          }
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-24 glass-panel rounded-xl sm:rounded-3xl opacity-50 border-dashed border-2 bg-transparent border-white/10">
          <SearchIcon className="h-20 w-20 mx-auto mb-6 text-contrast-bg" />
          <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg">Nenhum resultado</p>
          <p className="font-medium px-4 text-contrast-bg opacity-70">
            Não encontramos vídeos para &quot;{query}&quot;. Tente termos diferentes.
          </p>
        </div>
      ) : (
        <div className="text-center py-24 glass-panel rounded-xl sm:rounded-3xl opacity-50 border-dashed border-2 bg-transparent border-white/10">
          <SearchIcon className="h-20 w-20 mx-auto mb-6 text-contrast-bg" />
          <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg">Faça uma busca</p>
          <p className="font-medium px-4 text-contrast-bg opacity-70">
            Use a barra de pesquisa acima para encontrar vídeos.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
