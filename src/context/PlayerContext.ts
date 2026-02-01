import { createContext, useContext } from 'react';
import { Video } from '@/types';

export interface PlayerContextType {
    currentVideo: Video | null;
    isPlaying: boolean;
    isFloating: boolean;
    isTheaterMode: boolean;
    currentTime: number;
    playVideo: (video: Video) => void;
    closePlayer: () => void;
    toggleFloating: () => void;
    toggleTheaterMode: (value?: boolean) => void;
    setCurrentTime: (time: number) => void;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
