"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Youtube, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ImportYouTubeModalProps {
  children: React.ReactNode;
}

export function ImportYouTubeModal({ children }: ImportYouTubeModalProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState("");

  const extractPlaylistId = (url: string): string | null => {
    const patterns = [
      /[?&]list=([a-zA-Z0-9_-]+)/,
      /playlist\?list=([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    // Se for apenas o ID
    if (/^[a-zA-Z0-9_-]{10,50}$/.test(url.trim())) {
      return url.trim();
    }
    return null;
  };

  const handleImport = async () => {
    if (!session || !playlistUrl.trim()) {
      toast.error("Por favor, insira uma URL de playlist válida.");
      return;
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      toast.error("URL inválida. Use o link completo da playlist do YouTube.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/import-playlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ playlistId }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao importar.");

      toast.success(`Playlist importada! ${data.videosAdded || 0} vídeos adicionados.`);
      queryClient.invalidateQueries({ queryKey: ["myPlaylists"] });
      setIsOpen(false);
      setPlaylistUrl("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao importar playlist.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel border-white/20 rounded-xl sm:rounded-[2.5rem] w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Youtube className="text-red-500" size={24} />
            Importar do YouTube
          </DialogTitle>
          <DialogDescription className="opacity-60">
            Cole a URL de uma playlist pública do YouTube para importar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-url" className="font-bold">
              URL da Playlist
            </Label>
            <Input
              id="playlist-url"
              placeholder="https://youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="h-12 rounded-xl bg-white/5 border-white/10"
            />
          </div>

          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold flex items-start gap-2">
            <ExternalLink size={16} className="shrink-0 mt-0.5" />
            <span>
              Apenas playlists públicas podem ser importadas. Os vídeos serão adicionados ao seu feed de biblioteca.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !playlistUrl.trim()}
            className="rounded-xl font-black px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Youtube size={18} className="mr-2" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
