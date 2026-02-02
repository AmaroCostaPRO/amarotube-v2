"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/services/api";
import { ChannelMetadata, Video } from "@/types";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, Video as VideoIcon, ArrowLeft, Play, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import YouTube from "react-youtube";
import { motion } from "framer-motion";

export default function ChannelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const youtubeChannelId = params.id as string;

  const [channelMetadata, setChannelMetadata] = useState<ChannelMetadata | null>(null);
  const [channelVideos, setChannelVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTogglingFeed, setIsTogglingFeed] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const fetchChannelData = useCallback(async (showToast = false) => {
    if (!youtubeChannelId) return;

    try {
      const { data: metadata, error } = await supabase
        .from("channels")
        .select("*")
        .eq("youtube_channel_id", youtubeChannelId)
        .single();

      if (error) throw error;

      if (metadata) {
        setChannelMetadata(metadata as ChannelMetadata);
      } else {
        throw new Error("Canal não encontrado");
      }

      const { videos } = await apiService.fetchChannelVideos(youtubeChannelId, 10);
      setChannelVideos(videos);

      if (showToast) toast.success("Dados do canal atualizados!");
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Falha ao carregar dados: ${msg}`);
      setChannelMetadata(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [youtubeChannelId]);

  useEffect(() => {
    setIsLoading(true);
    fetchChannelData();
  }, [fetchChannelData]);

  const handleRefresh = async () => {
    if (!channelMetadata) return;
    setIsRefreshing(true);
    try {
      await apiService.syncSingleChannel(channelMetadata.id);
      await fetchChannelData(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao sincronizar canal.";
      toast.error(message);
      setIsRefreshing(false);
    }
  };

  const toggleAutoFeed = async (enabled: boolean) => {
    if (!channelMetadata) return;
    setIsTogglingFeed(true);
    try {
      const { error } = await supabase
        .from("channels")
        .update({ is_auto_feed_enabled: enabled })
        .eq("id", channelMetadata.id);

      if (error) throw error;

      setChannelMetadata((prev) => (prev ? { ...prev, is_auto_feed_enabled: enabled } : null));
      toast.success(enabled ? "Feed automático ativado para este canal!" : "Feed automático desativado.");
    } catch (err: unknown) {
      toast.error("Erro ao atualizar preferência.");
    } finally {
      setIsTogglingFeed(false);
    }
  };

  const isStatsLoading = isRefreshing;

  const getStatValue = (value: number | null | undefined, isSubscriberCount: boolean = false) => {
    if (isStatsLoading) return "...";
    if (isSubscriberCount && value === null) return "Oculto";
    if (value === undefined || value === null) return "0";
    return formatNumber(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 smart-container">
        <Skeleton className="h-64 w-full rounded-xl sm:rounded-[2.5rem]" />
        <Skeleton className="h-96 w-full rounded-xl sm:rounded-[2.5rem]" />
      </div>
    );
  }

  if (!channelMetadata) {
    return <div className="pt-4 text-center opacity-50">Canal não encontrado.</div>;
  }

  const details = channelMetadata;

  return (
    <div className="space-y-8 smart-container pb-12 transition-none">
      {/* Header com navegação */}
      <div className="flex items-center justify-between transition-none">
        <Link
          href="/channels"
          className="inline-flex items-center text-sm font-bold hover:text-primary group text-contrast-bg transition-none"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar para Canais
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="rounded-xl font-bold gap-2 bg-white/5 border-white/10 text-contrast-bg transition-none"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Atualizar Dados
        </Button>
      </div>

      {/* Card Principal com Banner */}
      <Card
        className="glass-panel rounded-xl sm:rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden relative transition-none"
        data-aos="fade-up"
      >
        {/* Banner Panorâmico */}
        <div className="relative w-full h-48 sm:h-64 bg-black/20 transition-none">
          {details.banner_url && (
            <img src={details.banner_url} className="w-full h-full object-cover opacity-90 transition-none" alt="" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 transition-none" />
        </div>

        {/* Info do Canal */}
        <div className="px-8 pb-8 relative z-10 transition-none">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 gap-6 transition-none">
            {/* Avatar Sobreposto */}
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-2xl relative z-20 bg-background transition-none">
              <AvatarImage src={details.avatar_url || ""} alt={details.name} className="object-cover transition-none" />
              <AvatarFallback className="text-4xl font-black bg-muted transition-none">
                {details.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Nome do Canal */}
            <div className="flex-1 text-center sm:text-left mb-2 transition-none">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter transition-none">{details.name}</h1>
            </div>

            {/* Toggle de Feed Automático */}
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl sm:rounded-3xl flex items-center gap-4 shadow-inner transition-none mb-2">
              <div className="space-y-0.5 transition-none">
                <Label
                  htmlFor="auto-feed-toggle"
                  className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-none"
                >
                  <Sparkles size={14} className="text-primary" /> Feed Automático
                </Label>
                <p className="text-[9px] font-bold opacity-50 uppercase transition-none">1 vídeo/dia no feed principal</p>
              </div>
              <Switch
                id="auto-feed-toggle"
                checked={details.is_auto_feed_enabled}
                onCheckedChange={toggleAutoFeed}
                disabled={isTogglingFeed}
                className="transition-none"
              />
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="mt-8 space-y-8 transition-none">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 transition-none">
              {[
                { label: "Inscritos", val: getStatValue(details.subscriber_count, true), icon: Users, color: "text-red-500" },
                { label: "Total de Views", val: getStatValue(details.view_count), icon: Eye, color: "text-blue-500" },
                { label: "Vídeos", val: getStatValue(details.video_count), icon: VideoIcon, color: "text-green-500" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-panel p-5 rounded-xl sm:rounded-[1.5rem] bg-white/5 border-white/10 flex items-center justify-between group transition-none"
                >
                  <div className="transition-none">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 transition-none">
                      {stat.label}
                    </p>
                    <p className="text-xl font-black flex items-center gap-2 transition-none">
                      {stat.val}
                      {isStatsLoading && stat.val === "..." && (
                        <Loader2 className="h-4 w-4 animate-spin opacity-50 transition-none" />
                      )}
                    </p>
                  </div>
                  <stat.icon className={cn("h-6 w-6 transition-none", stat.color)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de Vídeos */}
      <div className="space-y-6 transition-none">
        <h2 className="text-3xl font-black tracking-tight text-contrast-bg transition-none">Últimos Vídeos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 transition-none">
          {channelVideos.map((video) => (
            <motion.div
              key={video.youtube_video_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="glass-panel rounded-xl sm:rounded-3xl overflow-hidden group transition-all duration-300 hover:shadow-2xl border-none cursor-pointer transition-none"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video overflow-hidden transition-none">
                <img src={video.thumbnail_url || "/placeholder.svg"} className="w-full h-full object-cover transition-none" alt="" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transition-none">
                  <Play className="h-10 w-10 text-white fill-current transition-none" />
                </div>
              </div>
              <div className="p-4 transition-none">
                <h3 className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-none">
                  {video.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dialog de Preview */}
      <Dialog open={!!selectedVideo} onOpenChange={(isOpen) => !isOpen && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl w-full p-0 glass-panel border-white/20 rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl transition-none">
          {selectedVideo && (
            <div className="flex flex-col transition-none">
              <div className="py-3 px-6 border-b border-white/10 flex items-center justify-between gap-4 transition-none min-h-[60px]">
                <DialogTitle className="text-lg font-black line-clamp-1 flex-1 transition-none pr-8">
                  {selectedVideo.title}
                </DialogTitle>
                <div className="flex items-center gap-2 pr-8 transition-none">
                  <Link href={`/watch/${selectedVideo.id}`} className="transition-none">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-black gap-1.5 h-8 px-3 shrink-0 hover:bg-primary hover:text-white transition-none text-[10px] uppercase tracking-wider"
                    >
                      Abrir Página
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="aspect-video bg-black transition-none">
                <YouTube
                  videoId={selectedVideo.youtube_video_id}
                  opts={{ height: "100%", width: "100%", playerVars: { autoplay: 1 } }}
                  className="w-full h-full"
                  iframeClassName="w-full h-full"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
