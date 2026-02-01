import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, SkipForward, PlusCircle, Info, MoreVertical, Flag, Minimize2, X, Check } from 'lucide-react';
import { VideoActions } from '@/components/features/video/VideoActions';
import { VideoKarma } from '@/components/features/video/VideoKarma';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReportDialog } from '@/components/features/social/ReportDialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WatchInfoProps {
  video: Video;
  isSummarizing: boolean;
  summary: string | null;
  showSummary: boolean;
  onSummarize: () => void;
  onCloseSummary: () => void;
  onNextVideo?: () => void;
  onToggleFloating?: () => void;
}

export function WatchInfo({
  video,
  isSummarizing,
  summary,
  showSummary,
  onSummarize,
  onCloseSummary,
  onNextVideo,
  onToggleFloating
}: WatchInfoProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isPromoting, setIsPromoting] = useState(false);
  const [wasPromoted, setWasPromoted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // O vídeo é considerado "automático" se veio de um canal (auto-feed) ou se é uma importação de playlist, e ainda não foi recomendado ("efetivado")
  const isAutomatic = (video.is_from_channel_update || video.origin === 'playlist') && !wasPromoted;

  const handleAddToFeed = async () => {
    if (!session) return;
    setIsPromoting(true);
    try {
      // Regra de Atualização:
      // 1. origin: 'upload' -> Faz aparecer no feed principal (filtro de upload)
      // 2. is_from_channel_update: false -> Protege contra limpeza automática
      // 3. created_at: NOW -> Traz para o topo do feed como "novo"
      
      const { error } = await supabase
        .from('videos')
        .update({ 
          origin: 'upload',
          is_from_channel_update: false,
          created_at: new Date().toISOString()
        })
        .eq('id', video.id);
        
      if (error) throw error;

      toast.success('Vídeo recomendado! Ele agora aparece no topo do feed.');
      setWasPromoted(true);
      // Invalida o feed para que a mudança apareça ao voltar para a home
      queryClient.invalidateQueries({ queryKey: ['hybridFeed'] });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao recomendar o vídeo.');
    } finally {
      setIsPromoting(false);
    }
  };


  const btnClass = "font-bold rounded-xl transition-none flex-1 min-w-[calc(50%-8px)] sm:min-w-0 sm:flex-none";

  return (
    <div className="space-y-6 transition-none">
      {/* 1. Caixa de Informações e Botões */}
      <div className="glass-panel p-6 sm:p-8 rounded-xl sm:rounded-[2.5rem] shadow-xl border-none relative z-30 transition-none" data-aos="fade-up">
        <div className="flex justify-between items-start mb-6 sm:mb-8 gap-4 transition-none">
          <div className="flex-1 min-w-0 transition-none">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight line-clamp-2 transition-none">{video.title}</h1>
            <div className="flex items-center gap-2 mt-1 transition-none">
              <p className="text-[10px] sm:text-sm font-bold opacity-50 uppercase tracking-widest transition-none">
                Postado {video.created_at ? formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: ptBR }) : 'N/A'}
              </p>
              {video.is_from_channel_update && !wasPromoted && (
                <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter transition-none">Sincronizado via Canal</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 transition-none">
            {onToggleFloating && (
              <Button
                onClick={onToggleFloating}
                className="rounded-xl h-10 px-4 font-black gap-2 neo-button bg-primary text-white shadow-lg shadow-primary/20 hidden sm:flex transition-none"
              >
                <Minimize2 className="h-4 w-4 transition-none" /> Miniplayer
              </Button>
            )}

            {session && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-black/5 dark:hover:bg-white/10 transition-none">
                    <MoreVertical className="h-5 w-5 transition-none" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-panel border-white/20 rounded-xl w-48 shadow-2xl p-1 z-[100] transition-none">
                  <ReportDialog targetId={video.id} targetType="video">
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl gap-2 font-bold cursor-pointer focus:bg-destructive/10 focus:text-destructive text-muted-foreground transition-colors">
                      <Flag className="h-4 w-4" /> Denunciar Vídeo
                    </DropdownMenuItem>
                  </ReportDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 transition-none">
          {session ? (
            <>
              <VideoActions video={video} />

              {isAutomatic && (
                <Button
                  onClick={handleAddToFeed}
                  disabled={isPromoting}
                  className={cn(btnClass, "h-10 px-4 neo-button bg-primary text-primary-foreground transition-none")}
                >
                  {isPromoting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-1" />
                  )}
                  Recomendar
                </Button>
              )}

              {wasPromoted && (
                <div className={cn(btnClass, "h-10 px-4 flex items-center justify-center gap-1.5 text-primary bg-primary/10 rounded-xl font-black text-xs uppercase transition-none animate-in fade-in zoom-in-95")}>
                  <Check className="h-4 w-4" /> Recomendado
                </div>
              )}

              <Button
                onClick={onSummarize}
                disabled={isSummarizing}
                variant="outline"
                className={cn(btnClass, "h-10 px-4 transition-none")}
              >
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-primary transition-none" />}
                Resumir IA
              </Button>

              <div className="flex items-center gap-2 transition-none flex-1 sm:flex-none justify-between sm:justify-start min-w-full sm:min-w-0 sm:ml-auto pt-2 sm:pt-0">
                <VideoKarma videoId={video.id} initialScore={video.karma_score || 0} />
                {onNextVideo && (
                  <Button onClick={onNextVideo} variant="outline" className={cn(btnClass, "h-10 px-4 gap-2 transition-none")}>
                    <SkipForward className="h-4 w-4 transition-none" /> Próximo
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 transition-none">
              <span className="text-sm font-bold opacity-70 transition-none">
                <Link href="/login" className="text-primary hover:underline transition-none">Faça login</Link> para interagir.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Caixa do Resumo (Entre Informações e Descrição) */}
      <AnimatePresence>
        {(isSummarizing || (summary && showSummary)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="transition-none"
          >
            <Card className="glass-panel rounded-xl sm:rounded-[2.5rem] overflow-hidden border-primary/20 shadow-xl transition-all relative">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                <CardTitle className="flex items-center gap-2 text-primary font-black text-lg">
                  <Sparkles className="h-5 w-5" /> Resumo do Vídeo
                </CardTitle>
                {!isSummarizing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    onClick={onCloseSummary}
                  >
                    <X size={18} />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="text-base opacity-90 leading-relaxed whitespace-pre-wrap font-medium p-6 pt-2 pb-8">
                {isSummarizing ? (
                  <div className="flex flex-col items-center py-6 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-black text-[10px] uppercase tracking-widest opacity-40">Extraindo dados e gerando resumo...</p>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-500">
                    {summary}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Descrição do Vídeo */}
      <div className="p-8 glass-panel rounded-xl sm:rounded-[2.5rem] shadow-xl border-none relative z-10 transition-none">
        <h2 className="font-black text-xl mb-4 transition-none">{video.channel_name || 'Canal Desconhecido'}</h2>
        <div className={cn(
          "text-base leading-relaxed opacity-70 whitespace-pre-wrap font-medium transition-none",
          !isExpanded && "line-clamp-3"
        )}>
          {video.description || 'Nenhuma descrição fornecida.'}
        </div>
        {video.description && video.description.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-none"
          >
            {isExpanded ? 'Mostrar menos' : 'Mostrar mais'}
          </button>
        )}
      </div>
    </div>
  );
}