/**
 * Testes Unitários - GamificationService
 *
 * Testa a camada de abstração de gamificação com mock do Supabase.
 * CRÍTICO: Este service lida com economia do app - testes robustos.
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
    gamificationService,
    GamificationStats,
    LootboxResult,
    TransferResult,
} from '../gamification.service';
import { supabase } from '@/integrations/supabase/client';

// Mock do cliente Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        rpc: vi.fn(),
        functions: {
            invoke: vi.fn(),
        },
    },
}));

// Fixtures
const mockStats: GamificationStats = {
    points: 1500,
    daily_streak: 7,
    total_views: 100,
    total_likes: 50,
    received_likes: 25,
    received_upvotes: 10,
    total_logins: 30,
    unlocked_items: ['item-1', 'item-2'],
};

const mockStoreItems = [
    { id: 'item-1', name: 'Avatar Gold', cost: 500, is_active: true },
    { id: 'item-2', name: 'Border Neon', cost: 1000, is_active: true },
];

describe('GamificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getStats
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getStats', () => {
        it('deve retornar estatísticas do usuário', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: mockStats, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getStats('user-123');

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('user_gamification');
            expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123');
            expect(result).toEqual(mockStats);
        });

        it('deve garantir unlocked_items como array mesmo quando null', async () => {
            // Arrange
            const statsWithNullItems = { ...mockStats, unlocked_items: null };
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: statsWithNullItems,
                    error: null,
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getStats('user-123');

            // Assert
            expect(result?.unlocked_items).toEqual([]);
        });

        it('deve retornar null quando usuário não existe', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getStats('non-existent');

            // Assert
            expect(result).toBeNull();
        });

        it('deve retornar null em caso de erro', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'DB Error' },
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getStats('user-123');

            // Assert
            expect(result).toBeNull();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // awardPoints
    // ─────────────────────────────────────────────────────────────────────────────
    describe('awardPoints', () => {
        it('deve adicionar pontos com sucesso', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: true, error: null });

            // Act
            const result = await gamificationService.awardPoints(10, 'total_views');

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('award_points', {
                p_amount: 10,
                p_stat_column: 'total_views',
            });
            expect(result).toBe(true);
        });

        it('deve retornar false quando RPC falha', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: { message: 'RPC Error' },
            });

            // Act
            const result = await gamificationService.awardPoints(10, 'total_views');

            // Assert
            expect(result).toBe(false);
        });

        it('deve capturar exceções inesperadas', async () => {
            // Arrange
            (supabase.rpc as Mock).mockRejectedValue(new Error('Network Error'));

            // Act
            const result = await gamificationService.awardPoints(10, 'total_views');

            // Assert
            expect(result).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // buyLootbox
    // ─────────────────────────────────────────────────────────────────────────────
    describe('buyLootbox', () => {
        it('deve retornar recompensa ao abrir lootbox com sucesso', async () => {
            // Arrange
            const mockReward = {
                reward: {
                    type: 'credit' as const,
                    value: 100,
                    rarity: 'epic',
                },
                newBalance: 1400,
            };
            (supabase.functions.invoke as Mock).mockResolvedValue({
                data: mockReward,
                error: null,
            });

            // Act
            const result = await gamificationService.buyLootbox();

            // Assert
            expect(supabase.functions.invoke).toHaveBeenCalledWith('buy-lootbox');
            expect(result.success).toBe(true);
            expect(result.reward).toEqual(mockReward.reward);
            expect(result.newBalance).toBe(1400);
        });

        it('deve retornar erro quando saldo insuficiente', async () => {
            // Arrange
            (supabase.functions.invoke as Mock).mockResolvedValue({
                data: { error: 'Pontos insuficientes' },
                error: null,
            });

            // Act
            const result = await gamificationService.buyLootbox();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Pontos insuficientes');
        });

        it('deve tratar erro de invocação da Edge Function', async () => {
            // Arrange
            (supabase.functions.invoke as Mock).mockResolvedValue({
                data: null,
                error: { message: 'Function unavailable' },
            });

            // Act
            const result = await gamificationService.buyLootbox();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Function unavailable');
        });

        it('deve capturar exceções inesperadas', async () => {
            // Arrange
            (supabase.functions.invoke as Mock).mockRejectedValue(
                new Error('Network failure')
            );

            // Act
            const result = await gamificationService.buyLootbox();

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network failure');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // transferPoints
    // ─────────────────────────────────────────────────────────────────────────────
    describe('transferPoints', () => {
        it('deve transferir pontos com sucesso', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: 1400, error: null });

            // Act
            const result = await gamificationService.transferPoints('target-user', 100);

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('transfer_points', {
                p_target_user_id: 'target-user',
                p_amount: 100,
            });
            expect(result.success).toBe(true);
            expect(result.newBalance).toBe(1400);
        });

        it('deve rejeitar valor zero ou negativo (client-side)', async () => {
            // Act
            const resultZero = await gamificationService.transferPoints('user', 0);
            const resultNegative = await gamificationService.transferPoints('user', -50);

            // Assert
            expect(resultZero.success).toBe(false);
            expect(resultZero.error).toBe('Valor deve ser maior que zero');
            expect(resultNegative.success).toBe(false);
            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('deve rejeitar valor acima do limite (client-side)', async () => {
            // Act
            const result = await gamificationService.transferPoints('user', 15000);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Valor máximo por transferência: 10.000 pontos');
            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('deve retornar erro quando saldo insuficiente', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: null, error: null });

            // Act
            const result = await gamificationService.transferPoints('target-user', 100);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Saldo insuficiente');
        });

        it('deve tratar erro do RPC', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({
                data: null,
                error: { message: 'Transaction failed' },
            });

            // Act
            const result = await gamificationService.transferPoints('target-user', 100);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Transaction failed');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // purchaseItem
    // ─────────────────────────────────────────────────────────────────────────────
    describe('purchaseItem', () => {
        it('deve comprar item com sucesso', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: true, error: null });

            // Act
            const result = await gamificationService.purchaseItem('item-1', 500);

            // Assert
            expect(supabase.rpc).toHaveBeenCalledWith('purchase_store_item', {
                p_item_id: 'item-1',
                p_cost: 500,
            });
            expect(result.success).toBe(true);
        });

        it('deve retornar erro quando pontos insuficientes', async () => {
            // Arrange
            (supabase.rpc as Mock).mockResolvedValue({ data: false, error: null });

            // Act
            const result = await gamificationService.purchaseItem('item-1', 500);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBe('Pontos insuficientes ou erro na transação');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getStoreItems
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getStoreItems', () => {
        it('deve retornar lista de itens ativos da loja', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockStoreItems, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getStoreItems();

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('store_items');
            expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
            expect(result).toEqual(mockStoreItems);
        });

        it('deve retornar array vazio em caso de erro', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Error' },
                }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getStoreItems();

            // Assert
            expect(result).toEqual([]);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // getUserBadges
    // ─────────────────────────────────────────────────────────────────────────────
    describe('getUserBadges', () => {
        it('deve retornar badges do usuário', async () => {
            // Arrange
            const mockBadges = [
                { badge_type: 'early_adopter', unlocked_at: '2024-01-01' },
                { badge_type: 'content_creator', unlocked_at: '2024-02-01' },
            ];
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockBadges, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getUserBadges('user-123');

            // Assert
            expect(supabase.from).toHaveBeenCalledWith('user_badges');
            expect(result).toEqual(mockBadges);
        });

        it('deve retornar array vazio quando não há badges', async () => {
            // Arrange
            const mockChain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
            (supabase.from as Mock).mockReturnValue(mockChain);

            // Act
            const result = await gamificationService.getUserBadges('user-123');

            // Assert
            expect(result).toEqual([]);
        });
    });
});
