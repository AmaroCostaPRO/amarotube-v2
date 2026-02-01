import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Video, Playlist } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { PlusCircle, ListPlus, ChevronRight, X, Users } from 'lucide-react';

interface AddToPlaylistDialogProps {
  video: Video;
  children: React.ReactNode;
}

export function AddToPlaylistDialog({ video, children }: AddToPlaylistDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistIsPublic, setNewPlaylistIsPublic] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    if (!user?.id) return;
    
    const { data: mine } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    const { data: collabs } = await supabase
      .from('playlist_collaborators')
      .select('playlists(*)')
      .eq('user_id', user.id);

    const collabPlaylists = (collabs || [])
      .map(item => item.playlists)
      .filter(Boolean) as unknown as Playlist[];
    setPlaylists([...(mine || []), ...collabPlaylists]);
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchPlaylists();
    }
  }, [isOpen, user?.id, fetchPlaylists]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user?.id) return;

    const { data: existing } = await supabase
      .from('playlist_videos')
      .select('id')
      .eq('playlist_id', playlistId)
      .eq('video_id', video.id)
      .limit(1);

    if (existing && existing.length > 0) {
        toast.info('Este vídeo já está na playlist.');
        return;
    }

    const { error } = await supabase
      .from('playlist_videos')
      .insert({ playlist_id: playlistId, video_id: video.id, position: 0 });

    if (error) {
      toast.error('Falha ao adicionar vídeo.');
    } else {
      toast.success('Adicionado à playlist!');
      setIsOpen(false);
    }
  };

  const handleCreatePlaylistAndAdd = async () => {
    if (!user?.id || !newPlaylistTitle.trim()) return;

    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        title: newPlaylistTitle,
        is_public: newPlaylistIsPublic,
      })
      .select()
      .single();

    if (error) {
      toast.error('Falha ao criar playlist.');
    } else if (data) {
      await handleAddToPlaylist(data.id);
      setShowNewPlaylistForm(false);
      setNewPlaylistTitle('');
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" sideOffset={12} className="w-80 glass-panel-matte border-white/20 p-0 overflow-hidden rounded-[2rem] shadow-2xl z-[500]">
        <div className="p-6 pb-2 flex justify-between items-center">
          <h4 className="text-xl font-bold tracking-tight">Salvar em...</h4>
          {showNewPlaylistForm && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowNewPlaylistForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="px-2 pb-2">
          {!showNewPlaylistForm ? (
            <div className="space-y-1">
              <ScrollArea className="max-h-[250px] px-4">
                <div className="flex flex-col gap-1 py-2">
                  {playlists.map((playlist) => (
                    <Button 
                      key={playlist.id} 
                      variant="ghost" 
                      className="group justify-between h-12 rounded-2xl px-4 hover:bg-primary/10 hover:text-primary transition-all text-left" 
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      <div className="flex items-center min-w-0">
                        {playlist.user_id === user?.id ? (
                          <ListPlus className="mr-3 h-4 w-4 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                        ) : (
                          <Users className="mr-3 h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{playlist.title}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-white/10">
                <Button onClick={() => setShowNewPlaylistForm(true)} className="w-full h-11 rounded-2xl shadow-lg shadow-primary/20 gap-2 font-bold">
                  <PlusCircle className="h-4 w-4" /> Criar nova playlist
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              <Input
                placeholder="Título da Playlist"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                className="h-11 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner"
              />
              <div className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <Label className="text-xs font-bold">Pública</Label>
                <Switch checked={newPlaylistIsPublic} onCheckedChange={setNewPlaylistIsPublic} />
              </div>
              <Button onClick={handleCreatePlaylistAndAdd} className="w-full h-11 rounded-xl font-bold">Criar e Salvar</Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}