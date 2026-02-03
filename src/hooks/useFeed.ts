import { useCallback, useRef } from 'react';
import { useInfiniteQuery, useQueryClient, UseInfiniteQueryOptions, InfiniteData, QueryFunctionContext } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GetHybridFeedParams, FeedItem, FeedVideo } from '@/types';
import { PAGINATION, SORT_MODES } from '@/constants';

// Define o tipo da chave da query explicitamente como readonly
type FeedQueryKey = readonly ['hybridFeed', string, string | undefined, string | undefined];

const fetchFeed = async ({ pageParam, queryKey }: QueryFunctionContext<FeedQueryKey, number>): Promise<FeedItem[]> => {
  const [, sortMode, searchTerm, userId] = queryKey;
  
  // pageParam vem como number direto do QueryFunctionContext
  const actualPage = pageParam || 1;

  const { data, error } = await supabase.rpc('get_hybrid_feed', {
    page_number: actualPage,
    page_size: PAGINATION.PAGE_SIZE,
    sort_mode: sortMode as GetHybridFeedParams['sort_mode'],
    search_term_param: searchTerm || null,
    p_user_id_filter: userId || null,
  });

  if (error) {
    console.error("Error fetching feed:", error);
    throw new Error(error.message);
  }
  
  return (data || []) as unknown as FeedItem[];
};

export const useFeed = (
  sortMode: string = SORT_MODES.RECENT,
  searchTerm?: string,
  userId?: string,
  options?: Partial<UseInfiniteQueryOptions<FeedItem[], Error, InfiniteData<FeedItem[], number>, FeedQueryKey, number>>
) => {
  const queryClient = useQueryClient(undefined);
  const observer = useRef<IntersectionObserver | null>(null);

  const queryKey: FeedQueryKey = ['hybridFeed', sortMode, searchTerm, userId];

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: fetchFeed,
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // lastPageParam agora é inferido corretamente como number
      return lastPage.length === PAGINATION.PAGE_SIZE ? lastPageParam + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });

  const feedItems = data?.pages?.flatMap((page) => page)
    .filter(item => {
      // FIX 2: Feed Pollution - Filter out playlist imports from main feed
      if (item.item_type === 'video' && item.origin === 'playlist') {
        return false;
      }
      return true;
    }) ?? [];

  const updateVideoItem = useCallback((videoId: string, updates: Partial<FeedVideo>) => {
    queryClient.setQueriesData(
      { queryKey: ['hybridFeed'] },
      (oldData: InfiniteData<FeedItem[], number> | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: FeedItem[]) =>
            page.map(item => {
              if (item.item_type === 'video' && item.id === videoId) {
                return { ...item, ...updates } as FeedVideo;
              }
              return item;
            })
          ),
        };
      }
    );
  }, [queryClient]);

  const removeVideoItem = useCallback((videoId: string) => {
    queryClient.setQueriesData(
      { queryKey: ['hybridFeed'] },
      (oldData: InfiniteData<FeedItem[], number> | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: FeedItem[]) =>
            page.filter(item => item.id !== videoId)
          ),
        };
      }
    );
  }, [queryClient]);

  const lastElementRef = useCallback((node: Element | null) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetching) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, fetchNextPage, hasNextPage, isFetching]);

  return {
    data: feedItems,
    error,
    isLoading: !data && !error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    lastElementRef,
    updateVideoItem,
    removeVideoItem,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['hybridFeed'] }),
  };
};