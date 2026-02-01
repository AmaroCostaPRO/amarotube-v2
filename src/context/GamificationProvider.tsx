"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { gamificationService, GamificationStats } from '@/services';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { GamificationContext } from './GamificationContext';

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [stats, setStats] = useState<GamificationStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshStats = useCallback(async () => {
        if (!user?.id) return;
        try {
            // Usar gamificationService ao invés de supabase direto
            const data = await gamificationService.getStats(user.id);
            if (data) {
                setStats(data);
            }
        } catch (err) {
            console.error('[GamificationContext] Error fetching stats:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id) {
            setIsLoading(true);
            // Usar gamificationService para login diário
            gamificationService.handleDailyLogin().then(() => refreshStats());
        } else {
            setStats(null);
            setIsLoading(false);
        }
    }, [user?.id, refreshStats]);

    const addPoints = async (amount: number, type: string) => {
        if (!user?.id || !stats) return;

        // Usar gamificationService para adicionar pontos
        const success = await gamificationService.awardPoints(amount, type);

        if (success) {
            // Local state update for immediate UI feedback
            setStats(prev => prev ? ({ ...prev, points: prev.points + amount, [type]: (prev[type as keyof GamificationStats] as number) + 1 }) : null);
        } else {
            console.error('[GamificationContext] Failed to award points');
        }
    };

    const unlockItem = async (itemId: string, cost: number) => {
        if (!user?.id || !stats) return false;

        if (stats.unlocked_items.includes(itemId)) {
            toast.info('Você já possui este item!');
            return true;
        }

        if (stats.points < cost) {
            toast.error('Pontos insuficientes!');
            return false;
        }

        // Usar gamificationService para compra
        const result = await gamificationService.purchaseItem(itemId, cost);

        if (!result.success) {
            toast.error(result.error || 'Falha ao realizar compra');
            return false;
        }

        // Refresh data after successful purchase
        await refreshStats();

        toast.success('Item adquirido com sucesso!');
        return true;
    };

    return (
        <GamificationContext.Provider value={{ stats, isLoading, addPoints, unlockItem, refreshStats }}>
            {children}
        </GamificationContext.Provider>
    );
}
