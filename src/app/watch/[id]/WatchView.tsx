"use client";

import { useEffect } from "react";
import { WatchPlayer } from "@/components/features/video/WatchPlayer";
import { RelatedVideos } from "@/components/features/video/RelatedVideos";
import { usePlayer } from "@/context/PlayerContext";
import { Video } from "@/types";
import { Separator } from "@/components/ui/separator";

interface WatchViewProps {
  video: Video;
}

export function WatchView({ video }: WatchViewProps) {
  const { playVideo, isFloating, toggleFloating } = usePlayer();

  useEffect(() => {
    if (video) {
        // Inicializa o player com o vídeo atual
        playVideo(video);
    }
  }, [video, playVideo]);

  // Mock handlers since we're using the context mostly
  const handleToggleFloating = async () => {
    toggleFloating();
  };

  const handleVideoEnd = () => {
    console.log("Video finished");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 max-w-[1800px] mx-auto w-full">
      {/* Main Content - Player and Info */}
      <div className="flex-1 min-w-0">
        <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6" id="video-player-container">
           <WatchPlayer 
             videoId={video.youtube_video_id}
             thumbnailUrl={video.thumbnail_url || undefined}
             isFloating={isFloating}
             onToggleFloating={handleToggleFloating}
             onVideoEnd={handleVideoEnd}
           />
        </div>

        <div className="space-y-4">
            <div>
                <h1 className="text-xl md:text-2xl font-bold line-clamp-2">{video.title}</h1>
                <p className="text-muted-foreground mt-2 text-sm">{video.view_count || 0} visualizações • {new Date(video.created_at).toLocaleDateString()}</p>
            </div>
            
            <Separator className="bg-white/10" />

            {/* Channel Info Mock */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-bold text-primary">
                        {(video.channel_name || "C").charAt(0).toUpperCase()}
                    </span>
                </div>
                <div>
                     <h3 className="font-semibold">{video.channel_name || "Canal Desconhecido"}</h3>
                     <p className="text-xs text-muted-foreground">Inscritos oculto</p>
                </div>
            </div>

             <div className="bg-white/5 rounded-xl p-4 text-sm whitespace-pre-wrap">
                {video.description || "Sem descrição."}
            </div>
        </div>
      </div>

      {/* Sidebar - Related Videos */}
      <div className="lg:w-[400px] shrink-0 space-y-4">
        <h3 className="font-semibold text-lg">Relacionados</h3>
        <RelatedVideos currentVideoId={video.id} />
      </div>
    </div>
  );
}
