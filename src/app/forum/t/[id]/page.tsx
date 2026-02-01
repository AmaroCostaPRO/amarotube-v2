"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { ForumPost, ForumComment } from '@/types/forum';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoteControls } from '@/components/forum/VoteControls';
import { ArrowLeft, MessageSquare, Send, Loader2, Trash2, Reply, AtSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TopicDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [memberUsernames, setMemberUsernames] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { data: p } = await supabase
        .from('forum_posts')
        .select('*, profiles:user_id(username, avatar_url, name_color), communities:community_id(id, name, avatar_url, owner_id)')
        .eq('id', id)
        .single();

      if (p) {
        // Buscar votos do post
        const { data: postVotes } = await supabase.from('forum_votes').select('*').eq('target_id', id);
        const postScore = (postVotes || []).reduce((acc, v) => acc + v.vote_type, 0);
        const userPostVote = (postVotes || []).find(v => v.user_id === user?.id)?.vote_type || 0;
        setPost({ ...p, vote_score: postScore, user_vote: userPostVote } as unknown as ForumPost);

        // Buscar membros para validar menções
        const { data: members } = await supabase
          .from('community_members')
          .select('profiles:user_id(username)')
          .eq('community_id', p.community_id);

        const usernames = (members || [])
          .map(m => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : (m.profiles as any);
            return profile?.username;
          })
          .filter(Boolean) as string[];
        setMemberUsernames(usernames);

        // Buscar comentários
        const { data: c } = await supabase
          .from('forum_comments')
          .select('*, profiles:user_id(username, avatar_url, name_color)')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (c && c.length > 0) {
          const commentIds = c.map(item => item.id);
          const { data: commentVotes } = await supabase.from('forum_votes').select('*').in('target_id', commentIds);

          const enrichedComments = c.map(comm => {
            const votes = (commentVotes || []).filter(v => v.target_id === comm.id);
            const score = votes.reduce((acc, v) => acc + v.vote_type, 0);
            const uVote = votes.find(v => v.user_id === user?.id)?.vote_type || 0;
            return { ...comm, vote_score: score, user_vote: uVote };
          });

          setComments(enrichedComments as unknown as ForumComment[]);
        } else {
          setComments([]);
        }
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, [id, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const rawContent = parentId ? replyContent : newComment;
    if (!user || !rawContent.trim()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('forum_comments').insert({
        post_id: id,
        user_id: user.id,
        content: rawContent.trim(),
        parent_id: parentId
      });

      if (error) throw error;
      if (parentId) { setReplyTo(null); setReplyContent(''); } else { setNewComment(''); }
      toast.success('Comentário enviado!');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error('Erro ao enviar: ' + msg);
    } finally { setIsSubmitting(false); }
  };

  const handleDeletePost = async () => {
    if (!post || !id) return;
    if (!confirm('Tem certeza que deseja excluir este tópico?')) return;

    try {
      const { error } = await supabase.from('forum_posts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Tópico excluído!');
      router.push(`/forum/c/${post.communities?.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error('Erro ao excluir: ' + msg);
    }
  };

  const startReply = (comment: ForumComment) => {
    setReplyTo(comment.id);
    setReplyContent(`@${comment.profiles?.username} `);
  };

  const renderFormattedContent = (text: string) => {
    const mentionRegex = /(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, i) => {
      if (part.match(mentionRegex)) {
        const username = part.slice(1);
        if (memberUsernames.includes(username)) {
          return (
            <Link
              key={i}
              href={`/profile/${username}`}
              className="text-primary font-black hover:underline transition-none"
            >
              {part}
            </Link>
          );
        }
      }
      return part;
    });
  };

  const renderComments = (parentId: string | null = null, depth = 0) => {
    return comments
      .filter(c => c.parent_id === parentId)
      // Ordenar por score (votos) de forma descendente
      .sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0))
      .map(comment => (
        <div key={comment.id} className={cn("space-y-4 transition-none", depth > 0 && "ml-4 sm:ml-8 pl-4 border-l border-white/10")}>
          <div className="flex gap-3 sm:gap-4 transition-none">
            <div className="flex flex-col items-center gap-1">
              <Link href={`/profile/${comment.profiles?.username}`} className="flex-shrink-0 hover:scale-110 transition-transform">
                <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                  <AvatarImage src={comment.profiles?.avatar_url} className="object-cover" />
                  <AvatarFallback>{comment.profiles?.username?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <VoteControls targetId={comment.id} targetType="comment" initialScore={comment.vote_score || 0} initialUserVote={comment.user_vote || 0} />
            </div>
            <div className="flex-1 space-y-2 transition-none pt-0.5">
              <div className="flex items-center gap-2 text-xs transition-none">
                <Link
                  href={`/profile/${comment.profiles?.username}`}
                  className="font-black hover:opacity-80 transition-opacity"
                  style={{ color: comment.profiles?.name_color || 'inherit' }}
                >
                  @{comment.profiles?.username}
                </Link>
                <span className="opacity-30">•</span>
                <span className="opacity-30">{formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}</span>
              </div>
              <p className="text-sm leading-relaxed opacity-90 transition-none">
                {renderFormattedContent(comment.content)}
              </p>

              <div className="flex items-center gap-4 transition-none">
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-black uppercase opacity-50 hover:opacity-100 gap-1 transition-none" onClick={() => startReply(comment)}>
                  <Reply size={12} /> Responder
                </Button>
              </div>

              {replyTo === comment.id && (
                <form onSubmit={(e) => handleComment(e, comment.id)} className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 transition-none">
                  <Textarea
                    name={`reply-${comment.id}`}
                    placeholder={`Respondendo a @${comment.profiles?.username}...`}
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    className="rounded-xl bg-black/10 dark:bg-white/5 border-none shadow-inner min-h-[80px] text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 transition-none">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(null)} className="rounded-lg h-8 text-xs font-bold transition-none">Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting || !replyContent.trim()} size="sm" className="rounded-lg h-8 px-4 font-bold text-xs neo-button transition-none text-white">Enviar</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
          {renderComments(comment.id, depth + 1)}
        </div>
      ));
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse opacity-50 font-bold">Sincronizando discussão...</div>;
  if (!post) return <div className="p-10 text-center opacity-50">Tópico não encontrado.</div>;

  const canDelete = user?.id === post.user_id || isAdmin || user?.id === post.communities?.owner_id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-20 transition-none">
      <div className="flex items-center justify-between transition-none">
        <Link href={`/forum/c/${post.communities?.name}`} className="inline-flex items-center text-sm font-bold hover:text-primary transition-colors group text-contrast-bg">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Voltar para c/{post.communities?.name}
        </Link>
        {canDelete && (
          <Button variant="ghost" size="sm" onClick={handleDeletePost} className="text-destructive hover:bg-destructive/10 rounded-xl font-bold h-9 px-4 gap-2 transition-none">
            <Trash2 size={16} /> Excluir Tópico
          </Button>
        )}
      </div>

      <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl p-4 sm:p-8 transition-none">
        <div className="flex gap-3 sm:gap-6 transition-none">
          <div className="transition-none shrink-0 pt-1">
            <VoteControls targetId={post.id} targetType="post" initialScore={post.vote_score || 0} initialUserVote={post.user_vote || 0} />
          </div>
          <div className="flex-1 space-y-6 transition-none min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-none">
              <Link href={`/profile/${post.profiles?.username}`} className="flex items-center gap-3 group transition-none">
                <Avatar className="h-10 w-10 border-2 border-background group-hover:scale-110 transition-transform shadow-md">
                  <AvatarImage src={post.profiles?.avatar_url} className="object-cover transition-none" />
                  <AvatarFallback className="transition-none">{post.profiles?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="transition-none">
                  <p
                    className="text-sm font-black hover:opacity-80 transition-opacity"
                    style={{ color: post.profiles?.name_color || 'inherit' }}
                  >
                    @{post.profiles?.username}
                  </p>
                  <p className="text-[10px] uppercase font-bold opacity-40 transition-none">{formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: true })}</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full transition-none w-fit">
                <AtSign size={12} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary transition-none">Mencione membros com @</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight transition-none break-words leading-tight">{post.title}</h1>
            {post.content && <div className="text-base sm:text-lg opacity-80 leading-relaxed whitespace-pre-wrap font-medium transition-none">{renderFormattedContent(post.content)}</div>}

            <div className="pt-8 border-t border-white/10 transition-none">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 transition-none"><MessageSquare className="h-5 w-5 text-primary" /> Discussão</h3>
              {user ? (
                <form onSubmit={(e) => handleComment(e)} className="space-y-4 mb-6 sm:mb-10 transition-none">
                  <Textarea
                    id="forum-comment-textarea"
                    name="new-topic-comment"
                    placeholder="Inicie uma conversa..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    className="rounded-xl bg-black/5 dark:bg-white/5 border-none shadow-inner min-h-[120px] focus-visible:ring-primary transition-none"
                  />
                  <div className="flex justify-end transition-none">
                    <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="rounded-xl h-11 px-8 font-bold neo-button gap-2 transition-none text-white">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Postar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-xl mb-10 border border-white/10 transition-none">
                  <p className="opacity-50 font-bold uppercase tracking-widest text-xs">Faça login para participar.</p>
                </div>
              )}

              <div className="space-y-10 transition-none">
                {renderComments(null)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
