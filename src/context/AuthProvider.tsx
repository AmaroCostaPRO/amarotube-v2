import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoad = useRef(true);

    const fetchProfile = useCallback(async (userId: string, isSilent = false) => {
        if (!isSilent) setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                setProfile(data as Profile);
            }
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id, !!profile);
        }
    };

    useEffect(() => {
        // Busca sessão inicial
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            const initialUser = initialSession?.user ?? null;
            setUser(initialUser);

            if (initialUser) {
                fetchProfile(initialUser.id).finally(() => {
                    setIsLoading(false);
                    isInitialLoad.current = false;
                });
            } else {
                setIsLoading(false);
                isInitialLoad.current = false;
            }
        });

        // Monitora mudanças na auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (!newSession) {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    useEffect(() => {
        // Só bloqueia a UI se for o carregamento inicial absoluto de um usuário novo detectado
        if (user && !profile && !isInitialLoad.current) {
            fetchProfile(user.id);
        }
    }, [user, profile, fetchProfile]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const isAdmin = profile?.role === 'admin';
    const isApproved = profile?.is_approved === true;

    return (
        <AuthContext.Provider value={{ session, user, profile, isAdmin, isApproved, isLoading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
