/**
 * Video Service - Camada de abstração para operações de vídeo
 * 
 * Centraliza todas as operações relacionadas a vídeos,
 * eliminando chamadas diretas ao Supabase nos componentes.
 */

import { supabase } from '@/integrations/supabase/client';
import { Video, FeedItem, GetHybridFeedParams } from '@/types';
import { PAGINATION } from '@/constants';

export interface VideoMetrics {
    view_count: number;
    like_count: number;
}

export interface VideoWithMetrics extends Video {
    metrics?: VideoMetrics;
}

class VideoService {
    /**
     * Busca um vídeo pelo ID interno (UUID)
     */
    async getById(id: string): Promise<Video | null> {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[VideoService] getById error:', error);
            return null;
        }

        return data as Video;
    }

    /**
     * Busca as métricas mais recentes de um vídeo
     */
    async getMetrics(videoId: string): Promise<VideoMetrics | null> {
        const { data, error } = await supabase
            .from('youtube_metrics')
            .select('view_count, like_count')
            .eq('video_id', videoId)
            .order('fetched_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('[VideoService] getMetrics error:', error);
            return null;
        }

        return data as VideoMetrics;
    }

    /**
     * Busca um vídeo com suas métricas em uma única chamada
     */
    async getByIdWithMetrics(id: string): Promise<VideoWithMetrics | null> {
        const [video, metrics] = await Promise.all([
            this.getById(id),
            this.getMetrics(id),
        ]);

        if (!video) return null;

        return { ...video, metrics: metrics || undefined };
    }

    /**
     * Busca o feed híbrido de vídeos (paginado)
     */
    async getFeed(params: GetHybridFeedParams & { userId?: string }): Promise<FeedItem[]> {
        const { data, error } = await supabase.rpc('get_hybrid_feed', {
            page_number: params.page_number,
            page_size: params.page_size || PAGINATION.PAGE_SIZE,
            sort_mode: params.sort_mode,
            search_term_param: params.search_term_param || null,
            p_user_id_filter: params.userId || null,
        });

        if (error) {
            console.error('[VideoService] getFeed error:', error);
            throw new Error(error.message);
        }

        return data || [];
    }

    /**
     * Registra uma visualização do vídeo
     * Retorna true se for uma nova visualização (para gamificação)
     */
    async registerView(videoId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('touch_video', {
            video_id_to_update: videoId,
            viewer_user_id: userId,
        });

        if (error) {
            console.error('[VideoService] registerView error:', error);
            return false;
        }

        return data === true;
    }

    /**
     * Atualiza o karma de um vídeo
     */
    async updateKarma(videoId: string, diff: number): Promise<void> {
        const { error } = await supabase.rpc('increment_video_karma', {
            p_video_id: videoId,
            p_diff: diff,
        });

        if (error) {
            console.error('[VideoService] updateKarma error:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Atualiza o resumo de um vídeo
     */
    async updateSummary(videoId: string, summary: string): Promise<void> {
        const { error } = await supabase
            .from('videos')
            .update({ summary })
            .eq('id', videoId);

        if (error) {
            console.error('[VideoService] updateSummary error:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Deleta um vídeo (apenas owner ou admin)
     */
    async delete(videoId: string): Promise<void> {
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', videoId);

        if (error) {
            console.error('[VideoService] delete error:', error);
            throw new Error(error.message);
        }
    }

    /**
     * Busca vídeos relacionados (excluindo o atual)
     */
    async getRelated(currentVideoId: string, limit: number = 5): Promise<Video[]> {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .neq('id', currentVideoId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[VideoService] getRelated error:', error);
            return [];
        }

        return data as Video[];
    }
}

// Singleton export
export const videoService = new VideoService();
