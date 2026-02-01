/**
 * Comment Service - Camada de abstração para operações de comentários
 * 
 * Centraliza todas as operações relacionadas a comentários,
 * eliminando chamadas diretas ao Supabase nos componentes.
 */

import { supabase } from '@/integrations/supabase/client';
import { Comment } from '@/types';
import { filterContent } from '@/utils/wordFilter';

class CommentService {
    /**
     * Busca todos os comentários de um vídeo
     */
    async getByVideoId(videoId: string): Promise<Comment[]> {
        const { data, error } = await supabase
            .from('comments')
            .select('*, profiles(username, avatar_url, avatar_border, name_color)')
            .eq('video_id', videoId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[CommentService] getByVideoId error:', error);
            return [];
        }

        return data as Comment[];
    }

    /**
     * Cria um novo comentário
     * Aplica filtro de palavras automaticamente
     */
    async create(
        videoId: string,
        userId: string,
        content: string,
        parentCommentId?: string | null
    ): Promise<Comment | null> {
        // Sanitiza o conteúdo antes de salvar
        const sanitizedContent = filterContent(content.trim());

        const insertData: {
            video_id: string;
            user_id: string;
            content: string;
            parent_comment_id?: string;
        } = {
            video_id: videoId,
            user_id: userId,
            content: sanitizedContent,
        };

        if (parentCommentId) {
            insertData.parent_comment_id = parentCommentId;
        }

        const { data, error } = await supabase
            .from('comments')
            .insert(insertData)
            .select('*, profiles(username, avatar_url, avatar_border, name_color)')
            .single();

        if (error) {
            console.error('[CommentService] create error:', error);
            return null;
        }

        return data as Comment;
    }

    /**
     * Deleta um comentário
     */
    async delete(commentId: string): Promise<boolean> {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error('[CommentService] delete error:', error);
            return false;
        }

        return true;
    }

    /**
     * Conta o número de comentários de um vídeo
     */
    async countByVideoId(videoId: string): Promise<number> {
        const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('video_id', videoId);

        if (error) {
            console.error('[CommentService] countByVideoId error:', error);
            return 0;
        }

        return count || 0;
    }
}

// Singleton export
export const commentService = new CommentService();
