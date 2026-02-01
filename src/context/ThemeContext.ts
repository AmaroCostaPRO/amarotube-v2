import { createContext, useContext } from 'react';

export type AppTheme = 'light' | 'dark' | 'matrix' | 'pastel' | 'retro-vaporwave';

export interface WallpaperState {
    selected: string;
    custom: string[];
}

export interface UserPreferences {
    theme: AppTheme;
    wallpaper: WallpaperState;
    showCursor: boolean;
    pointerColor: string;
}

export interface ThemeProviderState extends UserPreferences {
    setTheme: (theme: AppTheme) => void;
    toggleTheme: () => void;
    setWallpaper: (url: string) => void;
    addCustomWallpaper: (url: string) => void;
    removeCustomWallpaper: (url: string) => Promise<void>;
    setShowCursor: (show: boolean) => void;
    setPointerColor: (color: string) => void;
    setAvatarBorder: (color: string) => void;
    avatarBorder: string;
    isDarkBg: boolean;
}

export const ThemeContext = createContext<ThemeProviderState | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
