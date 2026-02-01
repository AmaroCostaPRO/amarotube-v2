import React, { useRef, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchPlayerProps {
  videoId: string;
  thumbnailUrl?: string;
  isFloating: boolean;
  onToggleFloating: () => Promise<void>;
  onVideoEnd: () => void;
  onReady?: (event: { target: YouTubePlayer }) => void;
}

export function WatchPlayer({ videoId, thumbnailUrl, isFloating, onToggleFloating, onVideoEnd, onReady }: WatchPlayerProps) {
  const { currentTime, isTheaterMode } = usePlayer();
  const playerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    // Sincroniza o tempo se o player existir e não estiver flutuando
    if (playerRef.current && !isFloating && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(Math.floor(currentTime), true);
      } catch (e) {
        console.warn("[WatchPlayer] Erro ao sincronizar tempo:", e);
      }
    }
  }, [currentTime, isFloating]);

  const [origin, setOrigin] = React.useState("");

  useEffect(() => {
    // eslint-disable-next-line
    setOrigin(window.location.origin);
  }, []);

  return (
    <div
      className={cn(
        "w-full h-full relative transition-all duration-500",
        !isFloating && "rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]",
        isFloating && "bg-card/[var(--component-bg-opacity)] backdrop-blur-md flex items-center justify-center rounded-xl"
      )}
    >
      {/* Ambient Light Effect - Escondido no modo cinema para maior imersão */}
      <AnimatePresence>
        {!isFloating && thumbnailUrl && !isTheaterMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-20 z-0 pointer-events-none transition-opacity duration-1000 overflow-hidden"
          >
            <div 
              className="w-full h-full blur-[100px] opacity-100 scale-110"
              style={{ 
                backgroundImage: `url(${thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full h-full">
        {!isFloating ? (
          <YouTube
            key={`player-${videoId}`} // Garante que o player remonte corretamente ao trocar de vídeo
            videoId={videoId}
            opts={{ 
              width: '100%',
              height: '100%',
              playerVars: { 
                autoplay: 1, 
                start: Math.floor(currentTime),
                origin: origin,
                enablejsapi: 1,
                modestbranding: 1,
                rel: 0,
                controls: 1,
                host: 'https://www.youtube.com' // Fix: Ajuda na estabilidade da API
              } 
            }}
            onReady={(event) => { 
              playerRef.current = event.target;
              if (onReady) onReady(event);
            }}
            onEnd={onVideoEnd}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        ) : (
          <div className="text-center text-muted-foreground p-4">
            <PlayCircle className="h-12 w-12 mx-auto mb-2 text-primary" />
            <p className="text-sm font-bold">Vídeo em reprodução externa.</p>
            <Button variant="link" onClick={onToggleFloating} className="mt-2 text-primary font-black">
              Maximizar Player
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}