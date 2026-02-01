"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Search, PlusCircle, Trash2, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CollaboratorManagerProps {
  playlistId: string;
  children: React.ReactNode;
}

interface SearchResult {
  id: string;
  username: string;
  avatar_url: string;
}

interface Collaborator {
  id: string;
  profiles: SearchResult | null;
}

export function CollaboratorManager({ playlistId, children }: CollaboratorManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCollaborators = useCallback(async () => {
    // Usando sintaxe simplificada e garantindo que o join ocorra
    const { data, error } = await supabase
      .from('playlist_collaborators')
      .select('id, profiles:user_id(id, username, avatar_url)')
      .eq('playlist_id', playlistId);
    
    if (error) {
      console.error('Fetch collaborators error:', error);
    } else {
      setCollaborators((data as unknown as Collaborator[]) || []);
    }
  }, [playlistId]);

  useEffect(() => {
    if (isOpen) fetchCollaborators();
  }, [isOpen, playlistId, fetchCollaborators]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${searchTerm}%`)
        .limit(5);
      
      setSearchResults((data as unknown as SearchResult[]) || []);
    } catch (err: unknown) {
      toast.error('Erro na busca.');
    } finally {
      setIsLoading(false);
    }
  };

  const addCollaborator = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_collaborators')
        .insert({ playlist_id: playlistId, user_id: userId });

      if (error) {
        if (error.code === '23505') {
          toast.info('Este usuário já é um colaborador.');
        } else {
          throw error;
        }
      } else {
        toast.success('Colaborador adicionado!');
        await fetchCollaborators();
        setSearchTerm('');
        setSearchResults([]);
      }
    } catch {
      toast.error('Erro ao adicionar colaborador.');
    }
  };

  const removeCollaborator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('playlist_collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Colaborador removido.');
      await fetchCollaborators();
    } catch (err) {
      toast.error('Erro ao remover.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md glass-panel border-none rounded-[2.5rem] shadow-2xl p-8">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Users className="text-primary" /> Colaboradores
          </DialogTitle>
          <DialogDescription className="font-medium opacity-60">
            Convide amigos para gerenciar esta playlist com você.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
           <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  placeholder="Buscar username..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="h-12 rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner pl-10"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} className="rounded-xl h-12 neo-button font-black">
                 {isLoading ? <Loader2 className="animate-spin" /> : 'Buscar'}
              </Button>
           </div>

           {searchResults.length > 0 && (
             <div className="bg-primary/5 rounded-2xl p-3 space-y-2 border border-primary/10">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-primary/5 rounded-xl transition-colors">
                     <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={user.avatar_url} /><AvatarFallback>{user.username?.[0]}</AvatarFallback></Avatar>
                        <span className="text-sm font-bold">@{user.username}</span>
                     </div>
                     <Button size="sm" onClick={() => addCollaborator(user.id)} className="h-8 rounded-lg font-black text-[10px] uppercase gap-1">
                        <UserPlus size={12} /> Adicionar
                     </Button>
                  </div>
                ))}
             </div>
           )}

           <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase opacity-40 tracking-widest px-1">Equipe Atual</Label>
              <ScrollArea className="h-48 pr-4 -mr-4">
                 <div className="space-y-3">
                    {collaborators.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 group">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={c.profiles?.avatar_url} />
                            <AvatarFallback>{c.profiles?.username?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-sm">@{c.profiles?.username}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeCollaborator(c.id)}
                          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {collaborators.length === 0 && (
                      <div className="text-center py-10 opacity-30 italic text-xs">Nenhum colaborador convidado.</div>
                    )}
                 </div>
              </ScrollArea>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}