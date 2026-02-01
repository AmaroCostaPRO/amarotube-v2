"use client";

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
    ThemeContext,
    UserPreferences,
    AppTheme,
    WallpaperState
} from './ThemeContext';

const DEFAULT_PREFS: UserPreferences = {
    theme: 'light',
    wallpaper: { selected: 'default', custom: [] },
    showCursor: false,
    pointerColor: 'default',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { user, profile, refreshProfile } = useAuth();
    const hasLoadedRemote = useRef(false);
    const isSyncing = useRef(false);
    const [isDarkBg, setIsDarkBg] = useState(true);

    const [prefs, setPrefs] = useState<UserPreferences>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('app-prefs');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    return {
                        theme: parsed.theme || DEFAULT_PREFS.theme,
                        wallpaper: parsed.wallpaper || DEFAULT_PREFS.wallpaper,
                        showCursor: parsed.showCursor ?? DEFAULT_PREFS.showCursor,
                        pointerColor: parsed.pointerColor || DEFAULT_PREFS.pointerColor
                    };
                } catch {
                    return DEFAULT_PREFS;
                }
            }
            return {
                ...DEFAULT_PREFS,
                theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
            };
        }
        return DEFAULT_PREFS;
    });

    interface ThemePreferences {
        theme: AppTheme;
        wallpaper: WallpaperState;
        showCursor: boolean;
        pointerColor: string;
    }

    const analyzeBackground = useCallback((value: string) => {
        if (value.toLowerCase().includes('matrix') || value === 'shader_aurora') {
            setIsDarkBg(true);
            return;
        }

        if (value === 'default') {
            setIsDarkBg(prefs.theme === 'dark' || prefs.theme === 'matrix');
            return;
        }
        if (value.includes('#ff9a9e') || value.includes('pastel') || value.includes('#e0f2fe')) {
            setIsDarkBg(false);
            return;
        }
        if (value.includes('url(') || value.startsWith('http') || value.startsWith('data:')) {
            const imgUrl = value.includes('url(') ? value.match(/url\(["']?([^"']+)["']?\)/)?.[1] : value;
            if (!imgUrl) return;
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = imgUrl;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 1; canvas.height = 1;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                setIsDarkBg(brightness < 140);
            };
            return;
        }
        setIsDarkBg(true);
    }, [prefs.theme]);

    useEffect(() => {
        const fetchRemotePrefs = async () => {
            if (!user) return;
            try {
                const { data } = await supabase.from('user_settings').select('theme_preferences').eq('id', user.id).maybeSingle();
                if (data?.theme_preferences) {
                    const remote = data.theme_preferences as ThemePreferences;
                    setPrefs(prev => ({
                        theme: remote.theme || prev.theme,
                        wallpaper: remote.wallpaper || prev.wallpaper,
                        showCursor: remote.showCursor ?? prev.showCursor,
                        pointerColor: remote.pointerColor || prev.pointerColor
                    }));
                }
                hasLoadedRemote.current = true;
            } catch (err) { console.error(err); }
        };
        fetchRemotePrefs();
    }, [user]);

    // Efeito para sincronizar preferências DOM e analisar background
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const root = window.document.documentElement;
        const body = window.document.body;

        root.classList.remove('light', 'dark', 'matrix', 'pastel', 'retro-vaporwave');
        root.classList.add(prefs.theme);

        if (prefs.pointerColor !== 'default') {
            const encodedColor = encodeURIComponent(prefs.pointerColor);
            const svg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='${encodedColor}' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z'%3E%3C/path%3E%3C/svg%3E`;
            root.style.cursor = `url("${svg}"), auto`;
        } else {
            root.style.cursor = '';
        }

        if (prefs.wallpaper?.selected === 'default' || prefs.wallpaper?.selected === 'shader_aurora') {
            body.style.backgroundImage = '';
        } else {
            const val = prefs.wallpaper.selected;
            const isFormatted = val.includes('gradient') || val.startsWith('url(') || val.startsWith('data:');
            body.style.backgroundImage = isFormatted ? val : `url(${val})`;
            body.style.backgroundSize = 'cover';
            body.style.backgroundPosition = 'center';
            body.style.backgroundAttachment = 'fixed';
        }

        // Analisar background apenas se mudar o papel de parede
        const timeoutId = setTimeout(() => {
            analyzeBackground(prefs.wallpaper.selected);
        }, 0);
        
        // Logica de persistência local movida para depois da renderização do cliente
        if (typeof window !== 'undefined') {
            localStorage.setItem('app-prefs', JSON.stringify(prefs));
        }

        return () => clearTimeout(timeoutId);
    }, [prefs, prefs.theme, prefs.pointerColor, prefs.wallpaper.selected, analyzeBackground]); // Removido isDarkBg das deps para evitar loop

    // Efeito separado para sincronização remota
    useEffect(() => {
        if (user && hasLoadedRemote.current && !isSyncing.current) {
            const timer = setTimeout(async () => {
                isSyncing.current = true;
                await supabase.from('user_settings').upsert({
                    id: user.id,
                    theme_preferences: prefs,
                    updated_at: new Date().toISOString()
                });
                isSyncing.current = false;
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [prefs, user]);

    const setTheme = (theme: AppTheme) => setPrefs(p => ({ ...p, theme }));
    const toggleTheme = () => setPrefs(p => ({ ...p, theme: p.theme === 'light' ? 'dark' : 'light' }));
    const setWallpaper = (url: string) => setPrefs(p => ({ ...p, wallpaper: { ...p.wallpaper, selected: url } }));
    const addCustomWallpaper = (url: string) => setPrefs(p => ({ ...p, wallpaper: { ...p.wallpaper, custom: [...p.wallpaper.custom, url], selected: url } }));

    const removeCustomWallpaper = async (url: string) => {
        if (user) {
            try {
                const parts = url.split('/wallpapers/');
                if (parts.length > 1) {
                    const filePath = parts[1].split('?')[0];
                    await supabase.storage.from('wallpapers').remove([filePath]);
                }
            } catch (err) { console.error(err); }
        }

        setPrefs(p => ({
            ...p,
            wallpaper: {
                ...p.wallpaper,
                custom: p.wallpaper.custom.filter(u => u !== url),
                selected: p.wallpaper.selected === url ? 'default' : p.wallpaper.selected
            }
        }));
    };

    const setShowCursor = (showCursor: boolean) => setPrefs(p => ({ ...p, showCursor }));
    const setPointerColor = (pointerColor: string) => setPrefs(p => ({ ...p, pointerColor }));

    const setAvatarBorder = async (avatarBorder: string) => {
        if (user) {
            const { error } = await supabase.from('profiles').update({ avatar_border: avatarBorder }).eq('id', user.id);
            if (!error) {
                await refreshProfile();
            }
        }
    };

    return (
        <div className="isolate">
            <ThemeContext.Provider value={{
                ...prefs, setTheme, toggleTheme, setWallpaper,
                addCustomWallpaper, removeCustomWallpaper, setShowCursor,
                setPointerColor, setAvatarBorder,
                avatarBorder: profile?.avatar_border || 'transparent',
                isDarkBg
            }}>
                {children}
            </ThemeContext.Provider>
        </div>
    );
}
