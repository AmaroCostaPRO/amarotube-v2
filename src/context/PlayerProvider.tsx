import { useState, useCallback, ReactNode } from 'react';
import { Video } from '@/types';
import { PlayerContext } from './PlayerContext';

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFloating, setIsFloating] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const playVideo = useCallback((video: Video) => {
        if (currentVideo?.id !== video.id) {
            setCurrentTime(0);
        }
        setCurrentVideo(video);
        setIsPlaying(true);
        setIsFloating(false);
    }, [currentVideo?.id]);

    const closePlayer = useCallback(() => {
        setIsPlaying(false);
        setIsFloating(false);
        setIsTheaterMode(false);
    }, []);

    const toggleFloating = useCallback(() => {
        setIsFloating(prev => !prev);
        // Se flutuar, sai do modo teatro obrigatoriamente
        setIsTheaterMode(false);
    }, []);

    const toggleTheaterMode = useCallback((value?: boolean) => {
        setIsTheaterMode(prev => value !== undefined ? value : !prev);
    }, []);

    const updateCurrentTime = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    return (
        <PlayerContext.Provider value={{
            currentVideo, isPlaying, isFloating, isTheaterMode, currentTime,
            playVideo, closePlayer, toggleFloating, toggleTheaterMode, setCurrentTime: updateCurrentTime
        }}>
            {children}
        </PlayerContext.Provider>
    );
};
