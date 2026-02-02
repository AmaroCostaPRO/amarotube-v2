"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WatchPlayer } from "@/components/features/video/WatchPlayer";
import { RelatedVideos } from "@/components/features/video/RelatedVideos";
import { WatchInfo } from "@/components/features/video/WatchInfo";
import { CommentsSection } from "@/components/features/social/CommentsSection";
import { WatchPartyManager } from "@/components/features/social/WatchPartyManager";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";
import { Video } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, ThumbsUp, Lock, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { videoService, VideoMetrics } from "@/services";
import { apiService, VideoContext } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { YouTubePlayer } from "react-youtube";

interface WatchViewProps {
  video: Video;
}

export function WatchView({ video }: WatchViewProps) {
  const { playVideo, currentVideo, isFloating, toggleFloating, currentTime, setCurrentTime, isPlaying, isTheaterMode, toggleTheaterMode } = usePlayer();
  const { session } = useAuth();

  const [metrics, setMetrics] = useState<VideoMetrics | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [videoContext, setVideoContext] = useState<VideoContext | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Sincronizar Player quando o vídeo mudar
  useEffect(() => {
    if (video && (!currentVideo || currentVideo.id !== video.id)) {
      playVideo(video);
    }
  }, [video, currentVideo, playVideo]);

  // Carregar métricas do vídeo
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!video.id) return;
      try {
        const metricsData = await videoService.getMetrics(video.id);
        setMetrics(metricsData);
        
        // Carregar resumo se já existir
        if (video.summary) {
          setSummary(video.summary);
        }
      } catch (error) {
        console.error("[WatchView] Erro ao carregar métricas:", error);
      }
    };
    fetchMetrics();
  }, [video.id, video.summary]);

  // Reset theater mode ao desmontar
  useEffect(() => {
    return () => toggleTheaterMode(false);
  }, [toggleTheaterMode]);

  const handleSummarizeVideo = async () => {
    if (!video || !session) return;
    if (summary) {
      setShowSummary(true);
      return;
    }
    setIsSummarizing(true);
    try {
      let currentCtx = videoContext;
      if (!currentCtx) {
        currentCtx = await apiService.getVideoContext(`https://www.youtube.com/watch?v=${video.youtube_video_id}`);
        setVideoContext(currentCtx);
      }
      const response = await apiService.summarizeVideo(currentCtx);
      setSummary(response.summary);
      setShowSummary(true);
      await supabase.from('videos').update({ summary: response.summary }).eq('id', video.id);
      toast.success("Resumo gerado!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro";
      toast.error("Falha ao gerar resumo: " + msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleToggleFloating = useCallback(async () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        const time = await playerRef.current.getCurrentTime();
        setCurrentTime(time);
      } catch (e) {
        console.warn("[WatchView] Falha ao capturar tempo antes de flutuar:", e);
      }
    }
    toggleFloating();
  }, [setCurrentTime, toggleFloating]);

  const handleVideoEnd = () => {
    console.log("Video finished");
  };

  return (
    <div className="relative min-h-screen">
      {/* Overlay do Modo Cinema */}
      <AnimatePresence>
        {isTheaterMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[80]"
            onClick={() => toggleTheaterMode(false)}
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "flex flex-col gap-8 transition-all duration-700 relative",
        isTheaterMode ? "max-w-none px-0 z-[90]" : "smart-container--wide z-10"
      )}>
        {/* Player Section - Expandido */}
        <div className={cn(
          "relative w-full overflow-visible transition-all duration-700 group",
          isTheaterMode ? "h-[85vh] flex items-center justify-center pt-10" : "aspect-video"
        )} id="video-player-container">
          
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 120, damping: 25, mass: 1 }}
            className={cn(
              "w-full h-full relative z-10",
              isTheaterMode ? "max-w-[95vw] max-h-[80vh] aspect-video" : "rounded-xl sm:rounded-[2rem]"
            )}
          >
            {/* Botão Modo Cinema - Apenas em Desktop */}
            {!isFloating && (
              <div className={cn(
                "hidden sm:block absolute z-[100] transition-all duration-300 pointer-events-auto",
                "left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100",
                "top-6"
              )}>
                <Button
                  variant="secondary"
                  className={cn(
                    "h-12 px-6 rounded-xl bg-black/60 backdrop-blur-md text-white border-none hover:bg-primary font-black text-xs gap-2 shadow-2xl transition-all",
                    isTheaterMode && "bg-primary scale-110"
                  )}
                  onClick={() => toggleTheaterMode()}
                >
                  {isTheaterMode ? <><Minimize2 size={18} /> Sair do Cinema</> : <><Maximize2 size={18} /> Modo Cinema</>}
                </Button>
              </div>
            )}

            <WatchPlayer
              videoId={video.youtube_video_id}
              thumbnailUrl={video.thumbnail_url || undefined}
              isFloating={isFloating}
              onToggleFloating={handleToggleFloating}
              onVideoEnd={handleVideoEnd}
              onReady={(event) => { playerRef.current = event.target; }}
            />
          </motion.div>
        </div>

        {/* Conteúdo Abaixo do Player - Grid 2 Colunas */}
        <AnimatePresence>
          {!isTheaterMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 gap-4 sm:gap-10 pb-20 lg:grid-cols-3"
            >
              {/* Coluna Principal - Info + Comentários */}
              <div className="lg:col-span-2 space-y-8">
                <WatchInfo
                  video={video}
                  isSummarizing={isSummarizing}
                  summary={summary}
                  showSummary={showSummary}
                  onSummarize={handleSummarizeVideo}
                  onCloseSummary={() => setShowSummary(false)}
                  onToggleFloating={session ? handleToggleFloating : undefined}
                />
                <CommentsSection videoId={video.id} />
              </div>

              {/* Sidebar - Métricas + WatchParty + Relacionados */}
              <div className="lg:col-span-1 space-y-8">
                {/* Card de Métricas Oficiais */}
                <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-2xl">
                  <CardHeader className="p-4 sm:p-6 pb-2 border-b border-white/5 bg-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-foreground">Métricas Oficiais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 p-4 sm:p-6">
                    <div className="p-5 bg-black/5 dark:bg-white/5 rounded-xl text-center border border-white/5">
                      <Eye className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                      <p className="text-xl font-black">{metrics?.view_count?.toLocaleString() || '---'}</p>
                      <p className="text-[9px] font-black uppercase opacity-30 mt-1">Visualizações</p>
                    </div>
                    <div className="p-5 bg-black/5 dark:bg-white/5 rounded-xl text-center border border-white/5">
                      <ThumbsUp className="h-5 w-5 mx-auto mb-2 text-red-500" />
                      <p className="text-xl font-black">{metrics?.like_count?.toLocaleString() || '---'}</p>
                      <p className="text-[9px] font-black uppercase opacity-30 mt-1">Curtidas</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Watch Party - Apenas Logado */}
                {session && (
                  <WatchPartyManager
                    video={video}
                    onSyncAction={() => {}}
                    isCurrentPlaying={isPlaying}
                    currentTime={currentTime}
                  />
                )}

                {/* Recomendações */}
                <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden shadow-2xl">
                  <CardHeader className="p-4 sm:p-6 pb-2 border-b border-white/5 bg-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-foreground">Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {session ? (
                      <RelatedVideos currentVideoId={video.id} />
                    ) : (
                      <div className="py-12 text-center glass-panel rounded-xl border-dashed border-2 bg-transparent border-white/10 flex flex-col items-center justify-center gap-3">
                        <Lock size={32} className="opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-40">Acesso exclusivo para membros</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
