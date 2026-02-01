import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';

interface CreatePlaylistDialogProps {
  onPlaylistCreated: () => void;
  children: React.ReactNode;
}

export function CreatePlaylistDialog({ onPlaylistCreated, children }: CreatePlaylistDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para criar uma playlist.');
      return;
    }
    if (!title.trim()) {
      toast.error('O título da playlist é obrigatório.');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        title,
        description,
        is_public: isPublic,
      });

    if (error) {
      toast.error('Falha ao criar a playlist.');
    } else {
      toast.success('Playlist criada com sucesso!');
      onPlaylistCreated();
      setIsOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setIsPublic(false);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md glass-panel border-white/20 p-0 overflow-hidden rounded-[2rem] shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black tracking-tight">Criar Nova Playlist</DialogTitle>
          <DialogDescription className="opacity-70 font-medium">
            Preencha os detalhes para sua nova playlist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-8 py-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new-playlist-title" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">Título</Label>
            <Input 
              id="new-playlist-title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Músicas para codificar" 
              className="h-12 rounded-2xl bg-black/5 dark:bg-white/5 border-none focus-visible:ring-primary shadow-inner font-bold"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-playlist-description" className="text-xs font-black uppercase tracking-widest opacity-60 ml-1">Descrição</Label>
            <Textarea 
              id="new-playlist-description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Adicione uma breve descrição..." 
              className="rounded-2xl bg-black/5 dark:bg-white/5 border-none focus-visible:ring-primary shadow-inner min-h-[100px] leading-relaxed"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 shadow-inner">
            <div className="space-y-0.5">
              <Label htmlFor="new-playlist-is-public" className="text-sm font-bold">Tornar playlist pública</Label>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                {isPublic ? 'Todos podem ver' : 'Apenas você pode ver'}
              </p>
            </div>
            <Switch 
              id="new-playlist-is-public" 
              checked={isPublic} 
              onCheckedChange={setIsPublic} 
            />
          </div>
        </div>

        <DialogFooter className="p-8 pt-2 flex gap-3">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 h-12 rounded-2xl font-bold">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20 font-black neo-button">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}