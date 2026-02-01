import React, { useState, useEffect, useCallback } from 'react';
import { commentService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CommentItem } from './CommentItem';

interface CommentsSectionProps {
  videoId: string;
}

export function CommentsSection({ videoId }: CommentsSectionProps) {
  const { user, session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    // Usar commentService ao invés de supabase direto
    const data = await commentService.getByVideoId(videoId);
    setComments(data);
    setIsLoading(false);
  }, [videoId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCommentContent.trim()) return;
    setIsSubmitting(true);
    // commentService já aplica filterContent internamente
    const newComment = await commentService.create(videoId, user.id, newCommentContent);
    if (newComment) {
      setNewCommentContent('');
      toast.success('Postado!');
      fetchComments();
    } else {
      toast.error('Erro ao postar comentário');
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="mt-8 glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-xl">
      <CardHeader className="p-8 pb-4"><CardTitle className="text-xl font-black">{comments.length} Comentários</CardTitle></CardHeader>
      <CardContent className="p-8 pt-0">
        {user ? (
          <form onSubmit={handleSubmitComment} className="flex items-start gap-4 mb-10">
            <Avatar className="h-10 w-10 border-2 border-background">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Label htmlFor="main-comment-textarea" className="sr-only">Seu comentário</Label>
              <Textarea
                id="main-comment-textarea"
                name="new-video-comment"
                placeholder="O que você está pensando?"
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                disabled={isSubmitting}
                className="bg-black/5 dark:bg-white/5 border-none rounded-2xl min-h-[100px] focus-visible:ring-primary shadow-inner"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !newCommentContent.trim()} className="rounded-xl px-6 neo-button font-bold h-11">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Comentar
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center p-8 bg-black/5 dark:bg-white/5 shadow-inner rounded-3xl mb-8">
            <p className="text-muted-foreground font-bold">Faça login para interagir.</p>
          </div>
        )}

        <div className="space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary opacity-50" /></div>
          ) : session ? (
            comments.map(c => <CommentItem key={c.id} comment={c} videoId={videoId} onCommentDeleted={fetchComments} onReplySubmitted={fetchComments} />)
          ) : (
            <div className="py-20 text-center glass-panel rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 flex flex-col items-center justify-center gap-4">
              <Lock size={32} />
              <p className="text-sm font-black uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Discussões exclusivas para membros da comunidade</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}