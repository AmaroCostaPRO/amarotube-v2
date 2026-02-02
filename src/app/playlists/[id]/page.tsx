"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Playlist, Video } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Edit, Trash2, ArrowLeft, Play, ListMusic, Users, UserPlus } from "lucide-react";
import { EditPlaylistDialog } from "@/components/features/playlist/EditPlaylistDialog";
import { CollaboratorManager } from "@/components/features/channel/CollaboratorManager";
import { PlaylistHeroAccordion } from "@/components/playlists/PlaylistHeroAccordion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PlaylistVideoItem extends Video {
  playlist_video_id: number;
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<PlaylistVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollaborator, setIsCollaborator] = useState(false);

  const fetchPlaylistData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", id)
      .single();

    if (playlistError || !playlistData) {
      console.error("Error fetching playlist:", playlistError);
      toast.error("Playlist não encontrada.");
      router.push("/playlists");
      return;
    }
    setPlaylist(playlistData);

    if (user && user.id !== playlistData.user_id) {
      const { data: collab } = await supabase
        .from("playlist_collaborators")
        .select("id")
        .eq("playlist_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsCollaborator(!!collab);
    }

    const { data: videoData, error: videoError } = await supabase
      .from("playlist_videos")
      .select("id, videos(*)")
      .eq("playlist_id", id)
      .order("position", { ascending: true });

    if (videoError) {
      console.error("Error fetching videos for playlist:", videoError);
    } else {
      const formattedVideos = videoData
        .map((item) => {
          const video = Array.isArray(item.videos) ? item.videos[0] : item.videos;
          return {
            ...(video as Video),
            playlist_video_id: item.id,
          };
        })
        .filter((video): video is PlaylistVideoItem => !!video.id);

      setVideos(formattedVideos);

      if (searchParams.get("autoplay") === "true" && formattedVideos.length > 0) {
        router.replace(`/watch/${formattedVideos[0].id}?playlist=${id}&index=0`);
      }
    }

    setLoading(false);
  }, [id, router, user, searchParams]);

  useEffect(() => {
    fetchPlaylistData();
  }, [fetchPlaylistData]);

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    const { error } = await supabase.from("playlists").delete().eq("id", playlist.id);

    if (error) {
      toast.error("Falha ao excluir playlist.");
    } else {
      toast.success("Playlist excluída.");
      router.push("/playlists");
    }
  };

  const handlePlayPlaylist = () => {
    if (videos.length > 0) {
      const firstVideo = videos[0];
      router.push(`/watch/${firstVideo.id}?playlist=${id}&index=0`);
    } else {
      toast.info("Esta playlist está vazia.");
    }
  };

  if (loading) {
    return (
      <div className="pt-10 text-center animate-pulse font-black opacity-50 transition-none">
        Carregando playlist...
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  const isOwner = user && user.id === playlist.user_id;

  return (
    <div className="space-y-8 pb-12 smart-container transition-none">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        onClick={() => router.push("/playlists")}
        className="group font-bold hover:text-primary transition-none text-contrast-bg"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar para Playlists
      </Button>

      {/* Header da Playlist */}
      <Card
        className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl p-0 transition-none"
        data-aos="fade-up"
      >
        <div className="p-6 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-none">
          <div className="space-y-3 transition-none w-full md:w-auto">
            <div className="flex items-center gap-3 transition-none">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg border border-primary/10 transition-none">
                <ListMusic className="w-5 h-5 sm:w-6 sm:h-6 transition-none" />
              </div>
              <div className="transition-none min-w-0">
                <CardTitle className="text-2xl sm:text-5xl font-black tracking-tighter transition-none truncate">
                  {playlist.title}
                </CardTitle>
                {playlist.is_collaborative && (
                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase text-primary tracking-widest mt-1">
                    <Users size={12} /> Playlist Colaborativa
                  </div>
                )}
              </div>
            </div>
            <CardDescription className="text-sm sm:text-lg font-medium opacity-70 max-w-2xl transition-none line-clamp-3">
              {playlist.description || "Nenhuma descrição fornecida."}
            </CardDescription>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4 transition-none">
              <Button
                onClick={handlePlayPlaylist}
                className="rounded-2xl h-12 sm:h-14 px-6 sm:px-10 font-black text-base sm:text-lg gap-2 neo-button shadow-lg shadow-primary/20 transition-none"
              >
                <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current transition-none" />
                Reproduzir Tudo
              </Button>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-black text-[10px] uppercase tracking-widest opacity-60 transition-none whitespace-nowrap">
                {videos.length} Vídeos
              </div>
            </div>
          </div>

          {/* Ações do Owner */}
          <div className="flex gap-2 sm:gap-3 transition-none shrink-0 w-full md:w-auto justify-end">
            {isOwner && (
              <>
                <CollaboratorManager playlistId={playlist.id}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/5 border-white/20 hover:bg-white/10 transition-none"
                  >
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 transition-none" />
                  </Button>
                </CollaboratorManager>
                <EditPlaylistDialog playlist={playlist} onPlaylistUpdated={fetchPlaylistData}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white/5 border-white/20 hover:bg-white/10 transition-none"
                  >
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 transition-none" />
                  </Button>
                </EditPlaylistDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl shadow-lg shadow-destructive/20 hover:scale-110 transition-transform"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 transition-none" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-panel border-white/20 rounded-xl sm:rounded-[2.5rem] transition-none w-[95vw] max-w-md">
                    <AlertDialogHeader className="transition-none">
                      <AlertDialogTitle className="text-2xl font-black transition-none">
                        Excluir Playlist?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="transition-none">
                        Esta ação é permanente. Todos os vídeos serão removidos desta lista.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="transition-none gap-2">
                      <AlertDialogCancel className="rounded-xl font-bold transition-none">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePlaylist}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-black px-6 transition-none"
                      >
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Accordion de Vídeos */}
      <div className="space-y-8 transition-none">
        <div className="flex items-center gap-4 px-2 transition-none">
          <h2 className="text-2xl font-black opacity-40 uppercase tracking-[0.2em] text-contrast-bg transition-none">
            Destaques da Curadoria
          </h2>
          <div className="h-[2px] flex-1 bg-white/5 rounded-full transition-none" />
        </div>

        {videos.length > 0 ? (
          <PlaylistHeroAccordion videos={videos} playlistId={id} />
        ) : (
          <div className="glass-panel p-10 sm:p-20 rounded-xl sm:rounded-[3rem] text-center opacity-30 border-dashed border-2 bg-transparent transition-none">
            <ListMusic className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 transition-none" />
            <p className="text-lg sm:text-xl font-bold italic transition-none">
              Esta playlist está vazia por enquanto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
