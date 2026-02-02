"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, PlusCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface CreatePlaylistModalProps {
  children: React.ReactNode;
}

export function CreatePlaylistModal({ children }: CreatePlaylistModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = async () => {
    if (!user || !title.trim()) {
      toast.error("Por favor, insira um nome para a playlist.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("playlists").insert({
        title: title.trim(),
        description: description.trim() || null,
        is_public: !isPrivate,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Playlist criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["myPlaylists"] });
      setIsOpen(false);
      setTitle("");
      setDescription("");
      setIsPrivate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar playlist.";
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
            <PlusCircle className="text-primary" size={24} />
            Criar Playlist
          </DialogTitle>
          <DialogDescription className="opacity-60">
            Crie uma nova coleção para organizar seus vídeos favoritos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-title" className="font-bold">
              Nome da Playlist
            </Label>
            <Input
              id="playlist-title"
              placeholder="Minha coleção incrível..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="playlist-description" className="font-bold">
              Descrição (opcional)
            </Label>
            <Input
              id="playlist-description"
              placeholder="Uma breve descrição..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-xl bg-white/5 border-white/10"
            />
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <Checkbox
              id="is-private"
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            />
            <div className="space-y-0.5">
              <Label htmlFor="is-private" className="font-bold cursor-pointer">
                Playlist Privada
              </Label>
              <p className="text-xs opacity-50">Apenas você poderá ver esta playlist.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !title.trim()} className="rounded-xl font-black px-6 neo-button">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Criar Playlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
