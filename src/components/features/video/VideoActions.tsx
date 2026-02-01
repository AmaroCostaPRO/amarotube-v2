import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { Video } from '@/types';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ListPlus, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { AddToPlaylistDialog } from '@/components/features/playlist/AddToPlaylistDialog';
import { SharePopover } from '@/components/features/social/SharePopover';

interface VideoActionsProps {
  video: Video;
}

export function VideoActions({ video }: VideoActionsProps) {
  const { user } = useAuth();
  const { addPoints } = useGamification();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchLikeStatus = useCallback(async () => {
    if (!video.id) return;

    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', video.id);
    
    setLikeCount(count || 0);

    if (user?.id) {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('video_id', video.id)
        .eq('user_id', user.id)
        .limit(1);
      
      setIsLiked(!!(data && data.length > 0));
    }
  }, [video.id, user?.id]);

  useEffect(() => {
    if (video.id) {
      fetchLikeStatus();
    }
  }, [video.id, fetchLikeStatus]);

  const toggleLike = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para curtir um vídeo.');
      return;
    }

    if (isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('video_id', video.id)
        .eq('user_id', user.id);
      
      if (!error) {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ video_id: video.id, user_id: user.id });

      if (!error) {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Lógica de Gamificação: Só conta como "Like Enviado" se o vídeo não for seu
        if (user.id !== video.user_id) {
          await addPoints(5, 'total_likes');
          toast.success('+5 pontos por interagir!');
        }
      }
    }
  };

  // Alterado para flex-1 com min-width de quase 50% para formar pares no mobile
  const btnClass = "font-bold rounded-xl transition-none flex-1 min-w-[calc(50%-8px)] sm:min-w-0 sm:flex-none h-10 px-4";

  return (
    <>
      <Button variant="outline" onClick={toggleLike} className={btnClass}>
        <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        {likeCount}
      </Button>
      <AddToPlaylistDialog video={video}>
        <Button variant="outline" className={btnClass}>
          <ListPlus className="mr-2 h-4 w-4" />
          Salvar
        </Button>
      </AddToPlaylistDialog>
      <SharePopover title={video.title} url={`/watch/${video.id}`}>
        <Button variant="outline" className={btnClass}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </Button>
      </SharePopover>
    </>
  );
}