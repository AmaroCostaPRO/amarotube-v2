/**
 * Testes Unitários - VideoService
 *
 * Testa a camada de abstração de vídeos com mock do Supabase.
 * Padrão AAA (Arrange, Act, Assert) seguido em todos os testes.
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { videoService, VideoMetrics, VideoWithMetrics } from '../video.service';
import { supabase } from '@/integrations/supabase/client';
import { Video, FeedItem } from '@/types';

// Mock do cliente Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
    },
}));

// Fixtures
const mockVideo: Video = {
    id: 'video-uuid-123',
    user_id: 'user-uuid-456',
    youtube_video_id: 'dQw4w9WgXcQ',
    channel_id: 'channel-123',
    title: 'Test Video Title',
    description: 'Test video description',
    thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    channel_name: 'Test Channel',
    channel_avatar_url: 'https://example.com/avatar.jpg',
    channel_description: 'Channel description',
    created_at: '2024-01-01T00:00:00Z',
    last_accessed_at: null,
    profiles: { username: 'testuser', avatar_url: null },
    is_from_channel_update: false,
    karma_score: 10,
};

const mockMetrics: VideoMetrics = {
    view_count: 1500,
    like_count: 100,
};

const mockFeedItems: FeedItem[] = [
    {
        ...mockVideo,
        item_type: 'video',
        view_count: 1500,
        like_count: 100,
        is_liked_by_user: false,
        app_like_count: 5,
        view_count_delta: 50,
        like_count_delta: 10,
    },
];

describe('VideoService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getById
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getById', () => {
        it('deve retornar o vídeo quando encontrado', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockVideo, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getById('video-uuid-123');

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('videos');
            expect(mockChain.eq).toHaveBeenCalledWith('id', 'video-uuid-123');
            expect(result).toEqual(mockVideo);
        });

        it('deve retornar null quando o vídeo não existe', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' },
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });

        it('deve retornar null quando ocorre erro no Supabase', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' },
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getById('video-uuid-123');

            // Assert
            expect(result).toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getMetrics
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getMetrics', () => {
        it('deve retornar métricas do vídeo', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockMetrics, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getMetrics('video-uuid-123');

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('youtube_metrics');
            expect(result).toEqual(mockMetrics);
        });

        it('deve retornar null quando não há métricas', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'No metrics' },
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getMetrics('video-uuid-123');

            // Assert
            expect(result).toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getByIdWithMetrics
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getByIdWithMetrics', () => {
        it('deve retornar vídeo com métricas combinados', async () => {
            // Arrange
            const mockVideoChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockVideo, error: null }),
            };

            const mockMetricsChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockMetrics, error: null }),
            };

            (supabase.from as Mock).mockImplementation((table: string) => {
                if (table === 'videos') return mockVideoChain;
                if (table === 'youtube_metrics') return mockMetricsChain;
                return mockVideoChain;
            });

            // Act
            const result = await videoService.getByIdWithMetrics('video-uuid-123');

            // Assert
            const expected: VideoWithMetrics = { ...mockVideo, metrics: mockMetrics };
            expect(result).toEqual(expected);
        });

        it('deve retornar null quando vídeo não existe', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' },
                }),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getByIdWithMetrics('non-existent');

            // Assert
            expect(result).toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getFeed
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getFeed', () => {
        it('deve retornar lista de itens do feed', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: mockFeedItems,
                error: null,
            });

            // Act
            const result = await videoService.getFeed({
                page_number: 1,
                page_size: 10,
                sort_mode: 'recent',
            });

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('get_hybrid_feed', {
                page_number: 1,
                page_size: 10,
                sort_mode: 'recent',
                search_term_param: null,
                p_user_id_filter: null,
            });
            expect(result).toEqual(mockFeedItems);
        });

        it('deve passar parâmetros de busca corretamente', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: mockFeedItems,
                error: null,
            });

            // Act
            await videoService.getFeed({
                page_number: 2,
                page_size: 20,
                sort_mode: 'popular',
                search_term_param: 'react tutorial',
                userId: 'user-123',
            });

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('get_hybrid_feed', {
                page_number: 2,
                page_size: 20,
                sort_mode: 'popular',
                search_term_param: 'react tutorial',
                p_user_id_filter: 'user-123',
            });
        });

        it('deve lançar erro quando RPC falha', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: { message: 'RPC Error' },
            });

            // Act & Assert
            await expect(
                videoService.getFeed({
                    page_number: 1,
                    page_size: 10,
                    sort_mode: 'recent',
                })
            ).rejects.toThrow('RPC Error');
        });

        it('deve retornar array vazio quando data é null', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: null,
            });

            // Act
            const result = await videoService.getFeed({
                page_number: 1,
                page_size: 10,
                sort_mode: 'recent',
            });

            // Assert
            expect(result).toEqual([]);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // registerView
    // ─────────────────────────────────────────────────────────────────────────────
    describe('registerView', () => {
        it('deve retornar true para nova visualização', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: true, error: null });

            // Act
            const result = await videoService.registerView('video-123', 'user-456');

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('touch_video', {
                video_id_to_update: 'video-123',
                viewer_user_id: 'user-456',
            });
            expect(result).toBe(true);
        });

        it('deve retornar false para visualização repetida', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: false, error: null });

            // Act
            const result = await videoService.registerView('video-123', 'user-456');

            // Assert
            expect(result).toBe(false);
        });

        it('deve retornar false quando ocorre erro', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: { message: 'Error' },
            });

            // Act
            const result = await videoService.registerView('video-123', 'user-456');

            // Assert
            expect(result).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getRelated
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getRelated', () => {
        it('deve retornar vídeos relacionados excluindo o atual', async () => {
            // Arrange
            const relatedVideos = [
                { ...mockVideo, id: 'related-1' },
                { ...mockVideo, id: 'related-2' },
            ];

            const mockChain = {
                select: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: relatedVideos, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getRelated('video-uuid-123', 2);

            // Assert
            expect(mockChain.neq).toHaveBeenCalledWith('id', 'video-uuid-123');
            expect(mockChain.limit).toHaveBeenCalledWith(2);
            expect(result).toHaveLength(2);
        });

        it('deve retornar array vazio em caso de erro', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Error' },
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await videoService.getRelated('video-uuid-123');

            // Assert
            expect(result).toEqual([]);
        });
    });
});
