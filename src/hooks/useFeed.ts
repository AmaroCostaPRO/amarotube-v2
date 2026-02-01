import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeedItem } from '@/types';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop';
const PLACEHOLDER_AVATAR = 'https://github.com/shadcn.png';


const ITEMS_PER_PAGE = 10;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed-videos'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      console.log('Fetching feed', { from, to });

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔥 Erro Supabase:', error);
        throw new Error(error?.message || 'Erro desconhecido ao buscar feed');
      }

      console.log('📦 DADOS DO SUPABASE:', data?.[0]);

      const videosWithMockChannel = ((data || []) as any[]).map((video) => ({
        id: video.id,
        title: video.title || 'Sem título',
        thumbnail_url: video.thumbnail_url || video.cover || PLACEHOLDER_IMG,
        views: video.views || video.view_count || 0,
        created_at: video.created_at || new Date().toISOString(),
        duration: video.duration || '0:00',
        channel: { 
          name: 'Canal Desconhecido', 
          avatar_url: PLACEHOLDER_AVATAR,
          ...video.channel // Tenta preservar se vier algo parcial
        },
        // Preserve other fields
        ...video,
        item_type: 'video' // Ensure item_type is set
      }));

      return videosWithMockChannel as FeedItem[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length;
    },
  });
}