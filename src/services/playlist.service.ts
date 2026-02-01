/**
 * Playlist Service - Camada de abstração para operações de playlists
 * 
 * Centraliza todas as operações relacionadas a playlists,
 * eliminando chamadas diretas ao Supabase nos componentes.
 */

import { supabase } from '@/integrations/supabase/client';
import { Playlist, Video } from '@/types';
import { PAGINATION } from '@/constants';

export interface PlaylistWithVideos extends Playlist {
    videos?: Video[];
}

export interface PlaylistVideo {
    playlist_video_id: number;
    video: Video;
    position: number;
}

class PlaylistService {
    /**
     * Busca playlists do usuário (minhas playlists)
     */
    async getMyPlaylists(userId: string): Promise<Playlist[]> {
        const { data, error } = await supabase.rpc('get_playlists_with_videos', {
            p_user_id: userId,
            p_include_public: false,
            p_limit: PAGINATION.PLAYLIST_LIMIT,
            p_offset: 0,
        });

        if (error) {
            console.error('[PlaylistService] getMyPlaylists error:', error);
            throw new Error(error.message);
        }

        return data || [];
    }

    /**
     * Busca playlists onde o usuário é colaborador
     */
    async getCollaboratedPlaylists(userId: string): Promise<Playlist[]> {
        const { data, error } = await supabase.rpc('get_playlists_with_videos', {
            p_user_id: userId,
            p_include_public: false,
            p_limit: 100,
            p_offset: 0,
        });

        if (error) {
            console.error('[PlaylistService] getCollaboratedPlaylists error:', error);
            throw new Error(error.message);
        }

        // Filtra apenas as que ele é colaborador (user_id diferente)
        return (data || []).filter((p: Playlist) => p.user_id !== userId);
    }

    /**
     * Busca playlists públicas (excluindo as do usuário atual)
     */
    async getPublicPlaylists(excludeUserId?: string): Promise<Playlist[]> {
        const { data, error } = await supabase.rpc('get_playlists_with_videos', {
            p_user_id: null,
            p_include_public: true,
            p_limit: PAGINATION.PLAYLIST_LIMIT,
            p_offset: 0,
        });

        if (error) {
            console.error('[PlaylistService] getPublicPlaylists error:', error);
            throw new Error(error.message);
        }

        // Filtra para não mostrar as do usuário atual na aba "explorar"
        return data ? data.filter((p: Playlist) => p.user_id !== excludeUserId) : [];
    }

    /**
     * Busca uma playlist específica por ID
     */
    async getById(playlistId: string): Promise<Playlist | null> {
        const { data, error } = await supabase
            .from('playlists')
            .select('*, profiles(username, avatar_url, avatar_border, name_color)')
            .eq('id', playlistId)
            .single();

        if (error) {
            console.error('[PlaylistService] getById error:', error);
            return null;
        }

        return data as Playlist;
    }

    /**
     * Busca vídeos de uma playlist ordenados por posição
     */
    async getPlaylistVideos(playlistId: string): Promise<PlaylistVideo[]> {
        const { data, error } = await supabase
            .from('playlist_videos')
            .select('id, position, videos(*)')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true });

        if (error) {
            console.error('[PlaylistService] getPlaylistVideos error:', error);
            return [];
        }

        return (data || []).map((item: { id: number; position: number; videos: Video | Video[] }) => ({
            playlist_video_id: item.id,
            video: Array.isArray(item.videos) ? item.videos[0] : item.videos,
            position: item.position,
        }));
    }

    /**
     * Cria uma nova playlist
     */
    async create(userId: string, title: string, description?: string, isPublic: boolean = true): Promise<Playlist | null> {
        const { data, error } = await supabase
            .from('playlists')
            .insert({
                user_id: userId,
                title,
                description: description || null,
                is_public: isPublic,
            })
            .select()
            .single();

        if (error) {
            console.error('[PlaylistService] create error:', error);
            return null;
        }

        return data as Playlist;
    }

    /**
     * Atualiza uma playlist
     */
    async update(playlistId: string, updates: Partial<Pick<Playlist, 'title' | 'description' | 'is_public'>>): Promise<boolean> {
        const { error } = await supabase
            .from('playlists')
            .update(updates)
            .eq('id', playlistId);

        if (error) {
            console.error('[PlaylistService] update error:', error);
            return false;
        }

        return true;
    }

    /**
     * Deleta uma playlist
     */
    async delete(playlistId: string): Promise<boolean> {
        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', playlistId);

        if (error) {
            console.error('[PlaylistService] delete error:', error);
            return false;
        }

        return true;
    }

    /**
     * Adiciona um vídeo a uma playlist
     */
    async addVideo(playlistId: string, videoId: string): Promise<boolean> {
        // Primeiro, busca a maior posição atual
        const { data: maxPosData } = await supabase
            .from('playlist_videos')
            .select('position')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

        const nextPosition = (maxPosData?.position ?? 0) + 1;

        const { error } = await supabase
            .from('playlist_videos')
            .insert({
                playlist_id: playlistId,
                video_id: videoId,
                position: nextPosition,
            });

        if (error) {
            console.error('[PlaylistService] addVideo error:', error);
            return false;
        }

        return true;
    }

    /**
     * Remove um vídeo de uma playlist
     */
    async removeVideo(playlistVideoId: number): Promise<boolean> {
        const { error } = await supabase
            .from('playlist_videos')
            .delete()
            .eq('id', playlistVideoId);

        if (error) {
            console.error('[PlaylistService] removeVideo error:', error);
            return false;
        }

        return true;
    }

    /**
     * Verifica se o usuário pode editar uma playlist
     */
    async canUserEdit(playlistId: string, userId: string): Promise<boolean> {
        // Verifica se é owner
        const { data: playlist } = await supabase
            .from('playlists')
            .select('user_id, is_collaborative')
            .eq('id', playlistId)
            .single();

        if (!playlist) return false;
        if (playlist.user_id === userId) return true;

        // Se for colaborativa, verifica se é colaborador
        if (playlist.is_collaborative) {
            const { data: collab } = await supabase
                .from('playlist_collaborators')
                .select('id')
                .eq('playlist_id', playlistId)
                .eq('user_id', userId)
                .single();

            return !!collab;
        }

        return false;
    }
}

// Singleton export
export const playlistService = new PlaylistService();
