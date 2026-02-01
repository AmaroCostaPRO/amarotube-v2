/**
 * Gamification Service - Camada de abstração para operações de gamificação
 * 
 * Centraliza todas as operações críticas relacionadas a pontos, badges e lootbox.
 * IMPORTANTE: Este service lida com "economia" do app - tratamento de erro robusto.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GamificationStats {
    points: number;
    daily_streak: number;
    total_views: number;
    total_likes: number;
    received_likes: number;
    received_upvotes: number;
    total_logins: number;
    unlocked_items: string[];
}

export interface LootboxResult {
    success: boolean;
    reward?: {
        type: 'credit' | 'item';
        value: string | number;
        rarity: string;
        name?: string;
        isDuplicate?: boolean;
    };
    newBalance?: number;
    error?: string;
}

export interface TransferResult {
    success: boolean;
    newBalance?: number;
    error?: string;
}

export interface StoreItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    image_url: string;
    is_active: boolean;
    created_at: string;
}

class GamificationService {
    /**
     * Busca as estatísticas de gamificação do usuário
     */
    async getStats(userId: string): Promise<GamificationStats | null> {
        try {
            const { data, error } = await supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                console.error('[GamificationService] getStats error:', error);
                return null;
            }

            if (!data) return null;

            // Garante que unlocked_items é sempre um array
            const unlockedItems = Array.isArray(data.unlocked_items)
                ? data.unlocked_items
                : [];

            return {
                ...data,
                unlocked_items: unlockedItems,
            };
        } catch (err) {
            console.error('[GamificationService] getStats unexpected error:', err);
            return null;
        }
    }

    /**
     * Registra login diário e retorna se ganhou streak bonus
     */
    async handleDailyLogin(): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('handle_daily_login');

            if (error) {
                console.error('[GamificationService] handleDailyLogin error:', error);
                return false;
            }

            return true;
        } catch (err) {
            console.error('[GamificationService] handleDailyLogin unexpected error:', err);
            return false;
        }
    }

    /**
     * Adiciona pontos ao usuário por uma ação
     * SECURITY: Usa RPC para validação server-side
     */
    async awardPoints(amount: number, statColumn: string): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('award_points', {
                p_amount: amount,
                p_stat_column: statColumn,
            });

            if (error) {
                console.error('[GamificationService] awardPoints error:', error);
                return false;
            }

            return true;
        } catch (err) {
            console.error('[GamificationService] awardPoints unexpected error:', err);
            return false;
        }
    }

    /**
     * Compra um item da loja
     * SECURITY: Usa RPC para garantir atomicidade da transação
     */
    async purchaseItem(itemId: string, cost: number): Promise<{ success: boolean; error?: string }> {
        try {
            const { data, error } = await supabase.rpc('purchase_store_item', {
                p_item_id: itemId,
                p_cost: cost,
            });

            if (error) {
                console.error('[GamificationService] purchaseItem error:', error);
                return { success: false, error: error.message };
            }

            if (data === false) {
                return { success: false, error: 'Pontos insuficientes ou erro na transação' };
            }

            return { success: true };
        } catch (err: unknown) {
            console.error('[GamificationService] purchaseItem unexpected error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Compra uma lootbox (Edge Function)
     * CRÍTICO: Operação financeira - tratamento de erro robusto
     */
    async buyLootbox(): Promise<LootboxResult> {
        try {
            const { data, error } = await supabase.functions.invoke('buy-lootbox');

            if (error) {
                console.error('[GamificationService] buyLootbox error:', error);
                return {
                    success: false,
                    error: error.message || 'Erro ao abrir AmaroBox',
                };
            }

            if (data?.error) {
                return {
                    success: false,
                    error: data.error,
                };
            }

            return {
                success: true,
                reward: data.reward,
                newBalance: data.newBalance,
            };
        } catch (err: unknown) {
            console.error('[GamificationService] buyLootbox unexpected error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro inesperado ao abrir AmaroBox';
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Transfere pontos para outro usuário
     * CRÍTICO: Operação financeira - tratamento de erro robusto
     */
    async transferPoints(targetUserId: string, amount: number): Promise<TransferResult> {
        try {
            // Validações client-side para feedback rápido
            if (amount <= 0) {
                return { success: false, error: 'Valor deve ser maior que zero' };
            }

            if (amount > 10000) {
                return { success: false, error: 'Valor máximo por transferência: 10.000 pontos' };
            }

            const { data, error } = await supabase.rpc('transfer_points', {
                p_target_user_id: targetUserId,
                p_amount: amount,
            });

            if (error) {
                console.error('[GamificationService] transferPoints error:', error);
                return { success: false, error: error.message };
            }

            // RPC retorna novo saldo ou null em caso de falha
            if (data === null) {
                return { success: false, error: 'Saldo insuficiente' };
            }

            return {
                success: true,
                newBalance: data,
            };
        } catch (err: unknown) {
            console.error('[GamificationService] transferPoints unexpected error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Erro inesperado na transferência';
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Busca itens da loja disponíveis
     */
    async getStoreItems(): Promise<StoreItem[]> {
        try {
            const { data, error } = await supabase
                .from('store_items')
                .select('*')
                .eq('is_active', true)
                .order('cost', { ascending: true });

            if (error) {
                console.error('[GamificationService] getStoreItems error:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('[GamificationService] getStoreItems unexpected error:', err);
            return [];
        }
    }

    /**
     * Busca badges do usuário
     */
    async getUserBadges(userId: string): Promise<{ badge_type: string; unlocked_at: string }[]> {
        try {
            const { data, error } = await supabase
                .from('user_badges')
                .select('badge_type, unlocked_at')
                .eq('user_id', userId)
                .order('unlocked_at', { ascending: false });

            if (error) {
                console.error('[GamificationService] getUserBadges error:', error);
                return [];
            }

            return data || [];
        } catch (err) {
            console.error('[GamificationService] getUserBadges unexpected error:', err);
            return [];
        }
    }
}

// Singleton export
export const gamificationService = new GamificationService();
