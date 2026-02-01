import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Youtube } from "lucide-react";

interface ImportPlaylistDialogProps {
  children: React.ReactNode;
  onPlaylistImported: () => void;
}

export function ImportPlaylistDialog({ children, onPlaylistImported }: ImportPlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!url) {
      toast.error("Por favor, insira a URL da playlist.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-playlist", {
        body: {
          playlistUrl: url,
          visibility: visibility,
        },
      });

      if (error) {
        // Function errors might be returned as JSON in the body if status is 400/500, but invoke wraps it.
        // If the error comes from the edge function throwing, it might be in error property or data.error
        // My edge function returns { error: message } with status 400.
        // Supabase invoke should capture this.
        throw error;
      }
      
      // Check for application level error returned in data
      if (data && data.error) {
        throw new Error(data.error);
      }

      toast.success(data?.message || "Playlist importada com sucesso!");
      onPlaylistImported();
      setOpen(false);
      setUrl("");
      setVisibility("public");
    } catch (error) {
      console.error(error);
      // Try to parse the error message if it's from the function
      let msg = "Erro ao importar playlist.";
      
      if (error instanceof Error) {
        msg = error.message;
        try {
           // Sometimes error is a stringified JSON if Supabase client catches a 400
           const parsed = JSON.parse(msg);
           if (parsed.error) msg = parsed.error;
        } catch {
          // ignore
        }
      }
      
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-panel border-border text-foreground backdrop-blur-xl bg-background/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Youtube className="text-red-600 dark:text-red-500 h-6 w-6" />
            Importar do YouTube
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cole a URL de uma playlist pública do YouTube para importar seus vídeos.
            <br/><span className="text-xs opacity-70 text-muted-foreground">(Limite atual: 50 vídeos por importação)</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url" className="text-foreground font-medium">URL da Playlist</Label>
            <Input
              id="url"
              placeholder="https://youtube.com/playlist?list=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-red-500/50 h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visibility" className="text-foreground font-medium">Privacidade</Label>
            <Select
              value={visibility}
              onValueChange={(value: "public" | "private") => setVisibility(value)}
            >
              <SelectTrigger id="visibility" className="bg-background border-input text-foreground focus:ring-red-500/50 h-10">
                <SelectValue placeholder="Selecione a privacidade" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="public">Pública</SelectItem>
                <SelectItem value="private">Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={isLoading || !url}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-10 shadow-lg shadow-red-900/20 rounded-md transition-all"
          >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando...
                </>
            ) : (
                "Importar Playlist"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
