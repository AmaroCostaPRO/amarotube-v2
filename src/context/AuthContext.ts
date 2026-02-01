import { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types';

export interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isAdmin: boolean;
    isApproved: boolean;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
