"use client";

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { VideoCard } from '@/components/features/video/VideoCard';
import { ActivityCard } from '@/components/features/social/ActivityCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddVideoSection } from '@/components/features/video/AddVideoSection';
import { SocialSidebar } from '@/components/SocialSidebar';
import { VideoCardSkeleton } from '@/components/ui/skeleton-grid';
import { useFeed } from '@/hooks/useFeed';
import { useDebounce } from '@/hooks/useDebounce';
import { SORT_MODES, DEBOUNCE_TIMES } from '@/constants';
import { FeedVideo } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [filterMode, setFilterMode] = useState<string>(SORT_MODES.RECENT);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, DEBOUNCE_TIMES.SEARCH);

  // Mapeia o modo de filtro para o parâmetro de ordenação do feed
  const getSortBy = () => {
    if (filterMode === 'my-videos') return SORT_MODES.RECENT;
    return filterMode;
  };

  const userIdFilter = filterMode === 'my-videos' ? user?.id : undefined;

  const {
    data: feedItems,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    lastElementRef,
    updateVideoItem,
    removeVideoItem,
  } = useFeed(getSortBy(), debouncedSearchTerm, userIdFilter); 

  const handleDataUpdate = (videoId: string, updates: Partial<FeedVideo>) => {
    updateVideoItem(videoId, updates);
  };

  const handleVideoDeleted = (videoId: string) => {
    removeVideoItem(videoId);
  };

  const selectorClasses = "bg-black/5 dark:bg-black/20 border-none shadow-inner focus-visible:ring-1 focus-visible:ring-primary/20";

  return (
    <div className="smart-container--wide">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8 transition-none">
        <div className="min-w-0"> {/* Main Feed Column */}
          <div className="relative z-20 mb-8 transition-none">
            <div className="flex justify-center transition-none">
              <div className="w-full lg:max-w-xl transition-none" data-add-video>
                <AddVideoSection />
              </div>
            </div>
          </div>

          <div className="relative z-10 transition-none">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-between items-center mb-6 transition-none">
              {/* Bloco de Título e Filtro */}
              <div className="flex items-center justify-between gap-4 p-4 glass-panel rounded-xl sm:rounded-3xl w-full sm:w-auto min-w-[320px] shadow-xl transition-none">
                <h2 className="text-xl font-black whitespace-nowrap tracking-tight pl-2 transition-none">Feed Principal</h2>
                <Select value={filterMode} onValueChange={(value: string) => setFilterMode(value)}>
                  <SelectTrigger
                    className={`w-[140px] ${selectorClasses} text-sm h-10 rounded-xl transition-none`}
                    aria-label="Filtrar vídeos por"
                  >
                    <SelectValue placeholder="Ordem" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel rounded-2xl border-white/20 transition-none">
                    <SelectItem value={SORT_MODES.RECENT} className="text-xs transition-none">Recentes</SelectItem>
                    <SelectItem value={SORT_MODES.POPULAR} className="text-xs transition-none">Tendências</SelectItem>
                    <SelectItem value={SORT_MODES.TOP} className="text-xs transition-none">Karma</SelectItem>
                    {user && <SelectItem value="my-videos" className="text-xs transition-none">Meus</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              {/* Busca do Feed */}
              <div className="p-4 glass-panel rounded-xl sm:rounded-3xl w-full sm:w-auto min-w-[320px] shadow-xl transition-none">
                <div className="flex items-center gap-3 transition-none">
                  <div className="flex-1 flex items-center h-10 bg-black/5 dark:bg-black/20 rounded-xl shadow-inner px-3 border border-white/5 transition-none">
                    <input
                      id="feed-search-input"
                      name="feed-search"
                      type="text"
                      placeholder="Buscar vídeos..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm font-normal text-black dark:text-white placeholder:text-black dark:placeholder:text-white placeholder:font-normal h-full"
                      aria-label="Pesquisar no feed"
                    />
                  </div>
                  <Search className="h-5 w-5 text-muted-foreground opacity-30 shrink-0 mr-1 transition-none" />
                </div>
              </div>
            </div>

            <div className="pt-2 transition-none">
              {isLoading ? (
                <VideoCardSkeleton />
              ) : error ? (
                <div className="text-center py-10 transition-none">
                  <p className="text-destructive mb-2 transition-none">Erro ao carregar o feed</p>
                  <p className="text-muted-foreground text-sm transition-none">{error.message}</p>
                </div>
              ) : (
                <div className="transition-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-4 sm:gap-y-6 sm:gap-x-6 lg:gap-x-8 transition-none">
                    {feedItems?.map((item, index) => {
                      const isLastElement = feedItems.length === index + 1;
                      const ref = isLastElement ? lastElementRef : null;

                      if (item.item_type === 'video') {
                        return (
                          <div ref={ref} key={`video-${item.id}-${index}`} className="transition-none">
                            <VideoCard
                              video={item}
                              onDataUpdate={(updates) => handleDataUpdate(item.id, updates)}
                              onVideoDeleted={() => handleVideoDeleted(item.id)}
                            />
                          </div>
                        );
                      }

                      return (
                        <div ref={ref} key={`activity-${item.id}-${index}`} className="transition-none">
                          <ActivityCard activity={item} />
                        </div>
                      );
                    })}
                  </div>
                  
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {!hasNextPage && feedItems && feedItems.length > 0 && (
                    <p className="text-center text-muted-foreground py-8">Você chegou ao fim!</p>
                  )}
                  {(!feedItems || feedItems.length === 0) && (
                    <div className="text-center py-20 text-muted-foreground">
                      Nenhum vídeo encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Social Sidebar Column */}
        <div className="hidden xl:block">
          <SocialSidebar />
        </div>
      </div>
    </div>
  );
}
