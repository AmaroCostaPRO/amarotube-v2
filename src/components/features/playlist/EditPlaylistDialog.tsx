import { useState, useEffect } from 'react';
import { Playlist } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Users } from 'lucide-react';

interface EditPlaylistDialogProps {
  playlist: Playlist;
  onPlaylistUpdated: () => void;
  children: React.ReactNode;
}

export function EditPlaylistDialog({ playlist, onPlaylistUpdated, children }: EditPlaylistDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description || '');
  const [isPublic, setIsPublic] = useState(playlist.is_public);
  const [isCollaborative, setIsCollaborative] = useState(playlist.is_collaborative || false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(playlist.title);
      setDescription(playlist.description || '');
      setIsPublic(playlist.is_public);
      setIsCollaborative(playlist.is_collaborative || false);
    }
  }, [isOpen, playlist]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('O título da playlist é obrigatório.');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('playlists')
      .update({
        title,
        description,
        is_public: isPublic,
        is_collaborative: isCollaborative,
      })
      .eq('id', playlist.id);

    if (error) {
      toast.error('Falha ao atualizar playlist.');
    } else {
      toast.success('Playlist atualizada!');
      onPlaylistUpdated();
      setIsOpen(false);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md glass-panel border-white/20 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-bold tracking-tight">Editar Playlist</DialogTitle>
          <DialogDescription className="opacity-70">
            Atualize as informações e configurações de privacidade.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-8 py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Título</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-none focus-visible:ring-primary shadow-inner"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider opacity-60 ml-1">Descrição</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Adicione uma descrição..."
              className="rounded-2xl bg-black/5 dark:bg-white/5 border-none focus-visible:ring-primary shadow-inner min-h-[100px]"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 shadow-inner">
            <div className="space-y-0.5">
              <Label htmlFor="is-public" className="text-sm font-bold">Privacidade</Label>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {isPublic ? 'Pública' : 'Privada'}
              </p>
            </div>
            <Switch 
              id="is-public" 
              checked={isPublic} 
              onCheckedChange={setIsPublic} 
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <Label htmlFor="is-collab" className="text-sm font-bold">Modo Colaborativo</Label>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                Outros podem adicionar vídeos
              </p>
            </div>
            <Switch 
              id="is-collab" 
              checked={isCollaborative} 
              onCheckedChange={setIsCollaborative} 
            />
          </div>
        </div>

        <DialogFooter className="p-8 pt-2 flex gap-3">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 h-12 rounded-2xl font-bold">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20 font-bold neo-button">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}