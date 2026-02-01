import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { FeedVideo } from '@/types';
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface VideoCardActionsProps {
  video: FeedVideo;
  onUpdate?: (updates: Partial<FeedVideo>) => void;
}

export function VideoCardActions({ video, onUpdate }: VideoCardActionsProps) {
  const { user } = useAuth();
  const { addPoints } = useGamification();
  const [isLiked, setIsLiked] = useState(video.is_liked_by_user);
  const [likeCount, setLikeCount] = useState(video.app_like_count);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLiked(video.is_liked_by_user);
    setLikeCount(video.app_like_count);
  }, [video.is_liked_by_user, video.app_like_count]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Você precisa estar logado para curtir.');
      return;
    }
    setIsLoading(true);

    const originalIsLiked = isLiked;
    const originalLikeCount = likeCount;

    try {
      if (originalIsLiked) {
        await supabase.from('likes').delete().match({ user_id: user.id, video_id: video.id });
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('likes').insert({ user_id: user.id, video_id: video.id });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Gamificação: Só conta se o vídeo for de outro autor
        if (user.id !== video.user_id) {
          await addPoints(5, 'total_likes');
        }
      }

      if (onUpdate) {
        onUpdate({ is_liked_by_user: !originalIsLiked, app_like_count: originalIsLiked ? originalLikeCount - 1 : originalLikeCount + 1 });
      }
    } catch {
      toast.error('Erro ao atualizar.');
      setIsLiked(originalIsLiked);
      setLikeCount(originalLikeCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleLike} 
        disabled={isLoading} 
        className="text-muted-foreground hover:text-primary"
      >
        <ThumbsUp className={`mr-2 h-4 w-4 ${isLiked ? 'fill-current text-primary' : ''}`} />
        {likeCount}
      </Button>
    </div>
  );
}