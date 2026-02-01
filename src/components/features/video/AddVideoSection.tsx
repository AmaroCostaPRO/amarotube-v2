import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, Link as LinkIcon, Lock, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { VideoSearchDropdown } from './VideoSearchDropdown';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { apiService, SearchResult } from '@/services/api';
import { videoUrlSchema, searchVideoSchema, VideoUrlForm, SearchVideoForm } from '@/lib/validations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AddVideoSection() {
  const { user, session } = useAuth();
  const [addMode, setAddMode] = useState<'url' | 'name'>('name');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const isGuest = !session;

  const urlForm = useForm<VideoUrlForm>({ resolver: zodResolver(videoUrlSchema) });
  const searchForm = useForm<SearchVideoForm>({ resolver: zodResolver(searchVideoSchema) });

  const handleAddByUrl = async (data: VideoUrlForm) => {
    if (isGuest) return;
    setIsLoading(true);
    try {
      await apiService.fetchVideoDetails(data.url);
      toast.success('Vídeo adicionado com sucesso!');
      urlForm.reset();
      queryClient.invalidateQueries({ queryKey: ['hybridFeed'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao adicionar vídeo.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addVideoToDatabase = async (videoDetails: SearchResult) => {
    if (!user?.id) return;
    setIsLoading(true);
    setIsPopoverOpen(false);
    try {
      await apiService.fetchVideoDetails(`https://www.youtube.com/watch?v=${videoDetails.youtube_video_id}`);
      toast.success('Vídeo adicionado ao feed!');
      searchForm.reset();
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ['hybridFeed'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (data: SearchVideoForm) => {
    if (isGuest || !data.query.trim()) return;
    setIsLoading(true);
    try {
      const response = await apiService.searchVideos(data.query);
      if (response.videos?.length > 0) {
        setSearchResults(response.videos);
        setIsPopoverOpen(true);
      } else {
        toast.info('Nenhum vídeo encontrado.');
        setSearchResults([]);
        setIsPopoverOpen(false);
      }
    } catch {
      toast.error('Erro na busca.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    searchForm.reset();
    setSearchResults([]);
    setIsPopoverOpen(false);
  };

  const toggleItemClasses = cn(
    "rounded-xl h-11 w-11 transition-all border-none bg-transparent shadow-none text-foreground/40",
    "data-[state=active]:bg-black/10 dark:data-[state=active]:bg-white/10",
    "data-[state=active]:text-primary"
  );

  const inputBaseClasses = "w-full h-full bg-transparent border-none outline-none text-sm font-normal text-black dark:text-white placeholder:text-black dark:placeholder:text-white placeholder:font-normal";

  return (
    <div className={cn(
      "w-full glass-panel rounded-xl sm:rounded-[1.5rem] p-5 shadow-2xl transition-none relative",
      isGuest && "opacity-60 cursor-not-allowed"
    )} data-aos="fade-down">
      <div className="space-y-4 transition-none">
        <Popover open={isPopoverOpen && searchResults.length > 0} onOpenChange={setIsPopoverOpen}>
          <PopoverAnchor asChild>
            <div className="flex items-center gap-3 transition-none">
              <div className="flex-1 relative transition-none">
                <div className="h-11 bg-black/5 dark:bg-black/20 rounded-xl shadow-inner flex items-center px-4 border border-white/5 transition-none focus-within:ring-2 focus-within:ring-primary/20">
                  {addMode === 'url' ? (
                    <form onSubmit={urlForm.handleSubmit(handleAddByUrl)} className="w-full h-full flex items-center">
                      <Label htmlFor="url-input" className="sr-only">URL do Vídeo</Label>
                      <input
                        id="url-input"
                        {...urlForm.register('url')}
                        placeholder={isGuest ? "Faça login para adicionar por URL" : "Cole a URL do YouTube..."}
                        className={inputBaseClasses}
                        disabled={isGuest || isLoading}
                      />
                    </form>
                  ) : (
                    <form onSubmit={searchForm.handleSubmit(handleSearch)} className="w-full h-full flex items-center gap-2">
                      <Label htmlFor="search-input" className="sr-only">Nome do Vídeo</Label>
                      <input
                        id="search-input"
                        {...searchForm.register('query')}
                        placeholder={isGuest ? "Faça login para pesquisar vídeos" : "Pesquisar vídeo por nome..."}
                        className={inputBaseClasses}
                        disabled={isGuest || isLoading}
                        autoComplete="off"
                        aria-expanded={isPopoverOpen && searchResults.length > 0}
                        aria-controls="video-search-results"
                        role="combobox"
                        onFocus={() => searchResults.length > 0 && setIsPopoverOpen(true)}
                      />
                      {searchForm.watch('query') && !isGuest && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </form>
                  )}
                </div>
              </div>

              <ToggleGroup
                type="single"
                value={addMode}
                onValueChange={(v: string) => {
                  if (v === 'url' || v === 'name') {
                    setAddMode(v);
                    setIsPopoverOpen(false);
                  }
                }}
                className="flex gap-1.5 shrink-0 transition-none"
                disabled={isGuest || isLoading}
              >
                <ToggleGroupItem
                  value="url"
                  className={toggleItemClasses}
                  aria-label="Adicionar por Link"
                >
                  <LinkIcon className="h-5 w-5 transition-none" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="name"
                  className={toggleItemClasses}
                  aria-label="Buscar por Nome"
                >
                  <Search className="h-5 w-5 transition-none" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </PopoverAnchor>

          <PopoverContent
            id="video-search-results"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="w-[var(--radix-popover-trigger-width)] p-0 glass-panel-matte border-white/20 rounded-2xl z-[100] transition-none overflow-hidden shadow-2xl"
          >
            <VideoSearchDropdown
              results={searchResults}
              onSelectVideo={addVideoToDatabase}
              onClose={() => setIsPopoverOpen(false)}
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={addMode === 'url' ? urlForm.handleSubmit(handleAddByUrl) : searchForm.handleSubmit(handleSearch)}
          disabled={isLoading || isGuest}
          className="w-full h-12 rounded-xl neo-button font-black text-lg transition-none shadow-lg shadow-primary/20"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            addMode === 'url' ? <LinkIcon className="h-5 w-5 mr-2" /> : <Search className="h-5 w-5 mr-2" />
          )}
          {isGuest ? 'Área restrita a membros' : (addMode === 'url' ? 'Adicionar Vídeo' : 'Pesquisar no YouTube')}
        </Button>
      </div>
    </div>
  );
}