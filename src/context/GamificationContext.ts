import { createContext, useContext } from 'react';
import { GamificationStats } from '@/services';

export interface GamificationContextType {
    stats: GamificationStats | null;
    isLoading: boolean;
    addPoints: (amount: number, type: string) => Promise<void>;
    unlockItem: (itemId: string, cost: number) => Promise<boolean>;
    refreshStats: () => Promise<void>;
}

export const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
};
