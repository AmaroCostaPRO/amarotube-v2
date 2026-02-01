import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Loader2, PlusCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { ChannelSearchResult, Channel } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AddChannelDialogProps {
  onChannelAdded: () => void;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddChannelDialog({ onChannelAdded, children, isOpen, onOpenChange }: AddChannelDialogProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoadingSearch(true);
    setSearchResults([]);
    try {
      const { channels } = await apiService.searchYoutubeChannels(searchTerm);
      setSearchResults(channels);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro na busca: ' + message);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleAddChannel = async (channel: ChannelSearchResult) => {
    if (!user?.id) return;
    setIsAddingChannel(true);
    const loadingToastId = toast.loading('Sincronizando canal...');
    try {
      const fullChannelDetails = await apiService.fetchChannelDetails(channel.youtube_channel_id);

      const newChannelData: Omit<Channel, 'id' | 'created_at'> = {
        user_id: user.id,
        youtube_channel_id: channel.youtube_channel_id,
        name: fullChannelDetails.title,
        description: fullChannelDetails.description,
        avatar_url: fullChannelDetails.thumbnail,
        banner_url: fullChannelDetails.banner || null,
        is_auto_feed_enabled: false, // Por padrão desativado
      };
      
      const addedChannel = await apiService.addChannelToDatabase(newChannelData);
      await apiService.syncSingleChannel(addedChannel.id);
      
      toast.success('Canal adicionado com sucesso!', { id: loadingToastId });
      onChannelAdded();
      onOpenChange(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch {
      toast.error('Este canal já existe ou houve um erro.', { id: loadingToastId });
    } finally {
      setIsAddingChannel(false);
    }
  };

  const formatDescription = (desc: string | null) => {
    if (!desc) return 'Canal do YouTube';
    return desc.length > 40 ? desc.substring(0, 40) + '...' : desc;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg w-[95vw] h-[85vh] flex flex-col glass-panel-matte border-white/10 p-0 rounded-[2rem] shadow-2xl transition-none overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col flex-1 min-h-0 space-y-6">
          <DialogHeader className="space-y-2 shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight">Adicionar Canal</DialogTitle>
            <DialogDescription className="font-medium opacity-60 text-xs sm:text-sm">Sincronize criadores com seu feed.</DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Input
                placeholder="Nome do canal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-11 sm:h-12 rounded-xl bg-black/5 dark:bg-white/10 border-none shadow-inner font-bold pl-3 pr-10 text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30">
                 {isLoadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoadingSearch || !searchTerm.trim()} className="h-11 sm:h-12 px-4 sm:px-6 rounded-xl font-black neo-button transition-none text-xs sm:text-sm">Buscar</Button>
          </div>

          <div className="flex-1 min-h-0 bg-black/5 dark:bg-white/5 rounded-2xl border border-white/5 overflow-y-auto">
            <div className="p-2 space-y-1">
              {searchResults.map((channel) => (
                <div 
                  key={channel.youtube_channel_id} 
                  className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl hover:bg-white/10 transition-all group border border-transparent"
                >
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-background shadow-md shrink-0">
                    <AvatarImage src={channel.avatar_url || ''} className="object-cover" />
                    <AvatarFallback>{channel.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-xs sm:text-sm truncate group-hover:text-primary transition-colors">{channel.name}</p>
                    <p className="text-[9px] sm:text-[10px] opacity-40 font-bold uppercase truncate tracking-wider">
                      {formatDescription(channel.description)}
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleAddChannel(channel)}
                    disabled={isAddingChannel}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary hover:text-white shrink-0 shadow-sm border border-white/5 transition-none"
                  >
                    {isAddingChannel ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
                  </Button>
                </div>
              ))}
              
              {!isLoadingSearch && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center px-4">
                   <Search size={40} className="mb-4" />
                   <p className="font-black text-[10px] uppercase tracking-widest">Os resultados aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 sm:px-8 pb-6 shrink-0">
           <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-10 rounded-xl font-bold opacity-50 hover:opacity-100 transition-none text-xs">Fechar Janela</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}