import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { FeedVideo } from '@/types';

interface DeleteVideoDialogProps {
  video: FeedVideo;
  onDeleteSuccess: () => void;
  children: React.ReactNode;
}

export function DeleteVideoDialog({ video, onDeleteSuccess, children }: DeleteVideoDialogProps) {
  const { user, isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!user || (!isAdmin && user.id !== video.user_id)) {
      toast.error('Você não tem permissão para excluir este vídeo.');
      return;
    }

    setIsLoading(true);
    try {
      let error;

      // Se o vídeo veio de um canal (tem channel_id), apenas "escondemos" do feed
      // Admins também podem "promover" ou remover do feed principal
      if (video.channel_id && !isAdmin) {
        const { error: updateError } = await supabase
          .from('videos')
          .update({ is_from_channel_update: true })
          .eq('id', video.id);
        error = updateError;
      } else {
        // Se for um vídeo manual ou se for o admin limpando conteúdo
        const { error: deleteError } = await supabase
          .from('videos')
          .delete()
          .eq('id', video.id);
        error = deleteError;
      }

      if (error) throw new Error(error.message);

      toast.success(isAdmin ? 'Conteúdo removido pela moderação.' : (video.channel_id ? 'Vídeo removido do seu feed.' : 'Vídeo excluído com sucesso!'));
      onDeleteSuccess();
    } catch (error: unknown) {
      console.error('Erro ao excluir vídeo:', error);
      toast.error(`Falha ao excluir vídeo: ${(error as Error).message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || (!isAdmin && user.id !== video.user_id)) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent className="glass-panel border-white/20 rounded-[2.5rem] p-8 shadow-2xl max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-2xl font-black tracking-tight">
            {isAdmin ? 'Remover como Moderador?' : 'Remover Vídeo?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base font-medium opacity-70 leading-relaxed">
            {isAdmin 
              ? "Como administrador, você está removendo este conteúdo permanentemente da plataforma."
              : video.channel_id 
                ? "Este vídeo será removido do Feed Principal, mas continuará visível na página do canal original."
                : "Esta ação não pode ser desfeita. Isso excluirá permanentemente o vídeo da plataforma."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
          <AlertDialogCancel disabled={isLoading} className="rounded-2xl h-12 px-6 font-bold bg-white/5 border-white/10 hover:bg-white/10 transition-all m-0">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isLoading} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl h-12 px-8 font-black shadow-lg shadow-destructive/20 m-0"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}