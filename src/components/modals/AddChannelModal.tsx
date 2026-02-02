"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Search, Tv, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

interface AddChannelModalProps {
  children: React.ReactNode;
}

interface ChannelPreview {
  id: string;
  name: string;
  thumbnail: string;
}

export function AddChannelModal({ children }: AddChannelModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [channelInput, setChannelInput] = useState("");
  const [channelPreview, setChannelPreview] = useState<ChannelPreview | null>(null);

  const extractChannelId = (input: string): string => {
    // Extrai de URLs como youtube.com/channel/UC... ou youtube.com/@handle
    const channelMatch = input.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) return channelMatch[1];
    
    const handleMatch = input.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) return `@${handleMatch[1]}`;
    
    // Retorna o input limpo
    return input.trim();
  };

  const handleSearch = async () => {
    if (!channelInput.trim()) {
      toast.error("Por favor, insira um ID ou URL do canal.");
      return;
    }

    const channelId = extractChannelId(channelInput);
    setIsSearching(true);
    setChannelPreview(null);

    try {
      // Buscar informações do canal via API
      const result = await apiService.fetchChannelDetails(channelId);
      setChannelPreview({
        id: channelId,
        name: result.title,
        thumbnail: result.thumbnail,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Canal não encontrado.";
      toast.error(msg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddChannel = async () => {
    if (!user || !channelPreview) return;

    setIsAdding(true);
    try {
      const { error } = await supabase.from("channels").insert({
        user_id: user.id,
        youtube_channel_id: channelPreview.id,
        name: channelPreview.name,
        avatar_url: channelPreview.thumbnail,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Este canal já está na sua lista.");
        }
        throw error;
      }

      toast.success("Canal adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      setIsOpen(false);
      setChannelInput("");
      setChannelPreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao adicionar canal.";
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel border-white/20 rounded-xl sm:rounded-[2.5rem] w-[95vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Tv className="text-primary" size={24} />
            Adicionar Canal
          </DialogTitle>
          <DialogDescription className="opacity-60">
            Busque um canal do YouTube para adicionar à sua lista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-input" className="font-bold">
              ID ou URL do Canal
            </Label>
            <div className="flex gap-2">
              <Input
                id="channel-input"
                placeholder="UC... ou youtube.com/channel/..."
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-12 rounded-xl bg-white/5 border-white/10 flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !channelInput.trim()}
                className="h-12 w-12 rounded-xl p-0"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search size={20} />}
              </Button>
            </div>
          </div>

          {channelPreview && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channelPreview.thumbnail}
                alt={channelPreview.name}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg truncate">{channelPreview.name}</p>
                <p className="text-xs text-green-500 font-bold">
                  Canal encontrado
                </p>
              </div>
              <CheckCircle className="text-green-500 h-6 w-6 shrink-0" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">
            Cancelar
          </Button>
          <Button
            onClick={handleAddChannel}
            disabled={isAdding || !channelPreview}
            className="rounded-xl font-black px-6 neo-button"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Adicionar Canal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
