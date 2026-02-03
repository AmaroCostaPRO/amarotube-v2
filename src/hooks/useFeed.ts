import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeedItem } from '@/types';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop';
const PLACEHOLDER_AVATAR = 'https://github.com/shadcn.png';


const ITEMS_PER_PAGE = 12; // Adjusted for grid (2,3,4 cols)

// Interface para tipar o retorno flexível do RPC
type RPCResponse = {
  id: string;
  title?: string;
  thumbnail_url?: string;
  cover?: string;
  created_at?: string;
  duration?: string;
  view_count?: number;
  views?: number;
  like_count?: number;
  channel_name?: string;
  channel_avatar_url?: string;
  playlist_id?: string;
  origin?: string; // v1.1 compatibility
  // Permite outros campos que venham do banco
  [key: string]: any;
};

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed-videos'],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => { // Alterado default para 1 (RPC usually 1-based)
      // RPC Call para buscar métricas corretas (views, likes)
      const { data, error } = await supabase.rpc('get_hybrid_feed', {
        page_number: pageParam,
        page_size: ITEMS_PER_PAGE,
        sort_mode: 'recent',
        search_term_param: null,
        p_user_id_filter: null,
      });

      if (error) {
        console.error('🔥 Erro Supabase RPC:', error);
        throw new Error(error?.message || 'Erro desconhecido ao buscar feed');
      }

      // O RPC já retorna o objeto no formato esperado (FeedItem), mas precisamos garantir a tipagem
      // e adicionar fallbacks visuais caso o RPC retorne campos nulos
      const videosWithMockChannel = ((data || []) as unknown as RPCResponse[]).map((video) => ({
        ...video,
        id: video.id,
        title: video.title || 'Sem título',
        thumbnail_url: video.thumbnail_url || video.cover || PLACEHOLDER_IMG,
        created_at: video.created_at || new Date().toISOString(),
        duration: video.duration || '0:00',
        view_count: video.view_count ?? video.views ?? 0,
        like_count: video.like_count ?? 0,
        app_like_count: video.app_like_count ?? 0,
        view_count_delta: video.view_count_delta ?? 0,
        like_count_delta: video.like_count_delta ?? 0,
        is_liked_by_user: video.is_liked_by_user ?? false,
        avatar_url: video.channel_avatar_url || PLACEHOLDER_AVATAR, // RPC geralmente retorna channel_avatar_url
        channel: { 
          name: video.channel_name || 'Canal Desconhecido', 
          avatar_url: video.channel_avatar_url || PLACEHOLDER_AVATAR,
        },
        item_type: 'video' as const,
        origin: video.origin // Preserve origin for filtering
      }))
      // FIX: Feed Pollution - Filter out items that belong to a playlist (keep only root/manual videos)
      .filter(item => {
        if (item.item_type !== 'video') return true;
        // Verifica se o vídeo está associado a uma playlist (playlist_id não-nulo)
        const video = item as unknown as RPCResponse;
        
        // v1.1 Logic check: origin === 'playlist'
        if (video.origin === 'playlist') return false;
        
        return true; 
      });

      return videosWithMockChannel as unknown as FeedItem[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < ITEMS_PER_PAGE) return undefined;
      return allPages.length + 1;
    },
    // Client-side deduplication to ensure unique videos across pages
    select: (data) => {
      const seenIds = new Set<string>();
      return {
        ...data,
        pages: data.pages.map((page) => 
          page.filter((item) => {
            if (seenIds.has(item.id)) {
              return false;
            }
            seenIds.add(item.id);
            return true;
          })
        ),
      };
    },
  });
}