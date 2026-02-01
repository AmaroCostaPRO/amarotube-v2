import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchResult } from '@/services/api';
import { PlusCircle } from 'lucide-react';

interface VideoSearchDropdownProps {
  results: SearchResult[];
  onSelectVideo: (video: SearchResult) => void;
  onClose: () => void;
}

export function VideoSearchDropdown({ results, onSelectVideo, onClose }: VideoSearchDropdownProps) {
  if (results.length === 0) return null;

  const handleSelect = (video: SearchResult) => {
    onSelectVideo(video);
    onClose();
  };

  return (
    <ScrollArea className="max-h-[32rem] w-full transition-none">
      <div className="grid gap-1 p-2 transition-none">
        {results.map((video, index) => (
          <div 
            key={video.youtube_video_id || index} 
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer group" 
            onClick={() => handleSelect(video)}
          >
            <div className="relative w-20 h-12 flex-shrink-0 overflow-hidden rounded-lg shadow-md border border-white/10 transition-none">
              <img 
                src={video.thumbnail_url || '/placeholder.svg'} 
                alt={video.title} 
                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[13px] line-clamp-2 leading-tight text-foreground group-hover:text-primary transition-colors">{video.title}</h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1 opacity-60 mt-0.5 font-medium">{video.channel_name}</p>
            </div>
            <div className="shrink-0 ml-1">
              <div 
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all bg-black/5 dark:bg-white/10"
              >
                <PlusCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}