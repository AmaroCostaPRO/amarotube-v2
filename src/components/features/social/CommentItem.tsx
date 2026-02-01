import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlayer } from '@/context/PlayerContext';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommentItemProps {
  comment: Comment;
  videoId: string;
  onCommentDeleted: () => void;
  onReplySubmitted: () => void;
  level?: number;
}

export function CommentItem({ comment, videoId, onCommentDeleted, onReplySubmitted, level = 0 }: CommentItemProps) {
  const { user } = useAuth();
  const { setCurrentTime } = usePlayer();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const isOwner = user && user.id === comment.user_id;

  const handleTimestampClick = (timeStr: string) => {
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    if (parts[0]) seconds += parseInt(parts[0], 10);
    if (parts[1]) seconds += parseInt(parts[1], 10) * 60;
    if (parts[2]) seconds += parseInt(parts[2], 10) * 3600;
    setCurrentTime(seconds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContentWithTimestamps = (text: string) => {
    const timestampRegex = /(\d{1,2}:)?\d{1,2}:\d{2}/g;
    const words = text.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.match(timestampRegex)) {
        return (
          <button 
            key={i} 
            onClick={() => handleTimestampClick(word)}
            className="text-primary font-black hover:underline transition-none"
          >
            {word}
          </button>
        );
      }
      return word;
    });
  };

  const handleDeleteComment = async () => {
    if (!user || user.id !== comment.user_id) return;
    const { error } = await supabase.from('comments').delete().eq('id', comment.id);
    if (!error) { toast.success('Excluído.'); onCommentDeleted(); }
  };

  return (
    <div className={cn("flex items-start gap-4", level > 0 && "ml-8 border-l border-white/10 pl-4")}>
      <Avatar className="flex-shrink-0 shadow-lg border-2 border-background">
        <AvatarImage src={comment.profiles?.avatar_url || ''} />
        <AvatarFallback>{comment.profiles?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p 
            className="font-black text-sm"
            style={{ 
              color: comment.profiles?.name_color || 'inherit',
              textShadow: comment.profiles?.name_color ? '0px 1px 1px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {comment.profiles?.username || 'Usuário'}
          </p>
          <p className="text-[10px] font-bold opacity-30 uppercase">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
        <div className="mt-1 text-foreground/90 text-sm leading-relaxed">
          {renderContentWithTimestamps(comment.content)}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {user && (
            <Button variant="ghost" size="sm" onClick={() => setIsReplying(prev => !prev)} className="h-7 px-2 text-[10px] font-black uppercase opacity-50 hover:opacity-100 gap-1">
              <MessageSquare size={12} /> Responder
            </Button>
          )}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-black uppercase text-destructive opacity-50 hover:opacity-100 gap-1">
                  <Trash2 size={12} /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-panel border-none rounded-3xl">
                <AlertDialogHeader><AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-white rounded-xl font-black">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {isReplying && user && (
          <form onSubmit={(e) => { e.preventDefault(); }} className="flex items-start gap-2 mt-4">
            <Textarea 
              name={`reply-${comment.id}`}
              placeholder="Responder..." 
              value={replyContent} 
              onChange={(e) => setReplyContent(e.target.value)} 
              className="flex-1 min-h-[40px] bg-black/5 dark:bg-white/5 border-none rounded-xl" 
            />
            <Button type="submit" size="icon" className="h-10 w-10 neo-button shrink-0"><Send size={16} /></Button>
          </form>
        )}
      </div>
    </div>
  );
}