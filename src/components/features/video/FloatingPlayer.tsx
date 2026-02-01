import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { Button } from '@/components/ui/button';
import { X, Maximize2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { Rnd } from 'react-rnd';
import YouTube from 'react-youtube';
import type { YouTubePlayer } from 'react-youtube';

export function FloatingPlayer() {
  const { currentVideo, closePlayer, isFloating, toggleFloating, currentTime, setCurrentTime } = usePlayer();
  const playerRef = useRef<YouTubePlayer | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 340, height: 191 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isFloating) {
      // Tenta encontrar o container do player na Watch.tsx
      const videoContainer = document.getElementById('video-player-container');
      
      if (videoContainer) {
        const rect = videoContainer.getBoundingClientRect();
        
        // Centraliza horizontalmente em relação ao container do vídeo
        const newX = rect.left + (rect.width / 2) - (dimensions.width / 2);
        
        // Posiciona na parte inferior do container com um respiro (16px)
        const newY = rect.bottom + window.scrollY - (dimensions.height + 48) - 16;

        setPosition({ x: newX, y: newY });
      } else {
        // Fallback caso não esteja na página de Watch
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        setPosition({
          x: screenWidth - dimensions.width - 40,
          y: screenHeight - dimensions.height - 120,
        });
      }
    }
  }, [isFloating, dimensions.width, dimensions.height]); 

  if (!currentVideo || !isFloating) {
    return null;
  }

  const handleMaximize = async () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const time = await playerRef.current.getCurrentTime();
      setCurrentTime(time);
    }
    toggleFloating();
  };

  const handleClose = async () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const time = await playerRef.current.getCurrentTime();
      setCurrentTime(time);
    }
    closePlayer();
  };

  return (
    <Rnd
      size={{ width: dimensions.width, height: dimensions.height + 48 }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(e, d) => { setPosition({ x: d.x, y: d.y }) }}
      onResizeStop={(e, direction, ref, delta, pos) => {
        setDimensions({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10) - 48,
        });
        setPosition(pos);
      }}
      minWidth={280}
      minHeight={200}
      maxWidth={800}
      lockAspectRatio={16/9}
      bounds="window"
      className="z-100"
      dragHandleClassName="drag-handle"
      enableResizing={{
        bottom: true, bottomLeft: true, bottomRight: true,
        left: true, right: true,
        top: true, topLeft: true, topRight: true,
      }}
    >
      <div className="w-full h-full flex flex-col glass-panel rounded-3xl overflow-hidden shadow-2xl border-white/20 ring-1 ring-white/10 transition-shadow hover:shadow-primary/20">
        <div className="flex items-center justify-between px-4 h-12 bg-white/5 border-b border-white/10 drag-handle cursor-move select-none">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 opacity-30 shrink-0" />
            <Link href={`/watch/${currentVideo.id}`} className="truncate">
               <span className="text-[10px] font-black truncate opacity-60 uppercase tracking-widest hover:text-primary transition-colors">{currentVideo.title}</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/10 transition-transform active:scale-95" onClick={handleMaximize}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-transform active:scale-95" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-black overflow-hidden relative">
          <YouTube
            videoId={currentVideo.youtube_video_id}
            opts={{ 
              width: '100%',
              height: '100%',
              playerVars: { 
                autoplay: 1, 
                start: Math.floor(currentTime),
                modestbranding: 1,
                rel: 0,
                controls: 1
              } 
            }}
            onReady={(event) => { playerRef.current = event.target; }}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
      </div>
    </Rnd>
  );
}