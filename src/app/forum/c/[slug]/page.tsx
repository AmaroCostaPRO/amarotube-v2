"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Community, ForumPost } from '@/types/forum';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VoteControls } from '@/components/forum/VoteControls';
import { MessageSquare, Users2, Calendar, ArrowLeft, Trash2, Loader2, Crown, ShieldCheck, Settings, Edit3, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';
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

interface CommunityMember {
  id: string;
  username: string;
  avatar_url: string | null;
  name_color?: string;
  role: 'owner' | 'moderator' | 'member';
  joined_at: string;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const fetchCommunityData = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const { data: comm, error: commError } = await supabase.from('communities').select('*').eq('name', slug).single();
      if (commError) throw commError;
      if (comm) {
        setCommunity(comm);
        const { data: postsData } = await supabase.from('forum_posts').select('*, profiles:user_id(username, avatar_url, name_color)').eq('community_id', comm.id).order('created_at', { ascending: false });

        if (postsData && postsData.length > 0) {
          const postIds = postsData.map(p => p.id);
          const { data: allVotes } = await supabase.from('forum_votes').select('*').in('target_id', postIds);
          const { data: allComments } = await supabase.from('forum_comments').select('post_id').in('post_id', postIds);
          const processedPosts = postsData.map(post => {
            const postVotes = (allVotes || []).filter(v => v.target_id === post.id);
            const score = postVotes.reduce((acc, v) => acc + v.vote_type, 0);
            const userVote = postVotes.find(v => v.user_id === user?.id)?.vote_type || 0;
            const commentCount = (allComments || []).filter(c => c.post_id === post.id).length;
            return { ...post, vote_score: score, user_vote: userVote, comment_count: commentCount };
          });
          setPosts(processedPosts as unknown as ForumPost[]);
        } else { setPosts([]); }

        const { data: m } = await supabase
          .from('community_members')
          .select('role, joined_at, profiles:user_id(id, username, avatar_url, name_color)')
          .eq('community_id', comm.id)
          .order('joined_at', { ascending: true });

        const memberList = (m || []).map(item => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return { ...(profile as CommunityMember), role: item.role, joined_at: item.joined_at };
        });

        setMembers(memberList);
        setMemberCount(memberList.length);

        if (user) {
          const myMembership = (m || []).find(item => {
            const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            return (profile as CommunityMember)?.id === user.id;
          });
          setIsMember(!!myMembership);
          setMemberRole(myMembership?.role || null);
        }
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  }, [slug, user]);

  useEffect(() => { fetchCommunityData(); }, [fetchCommunityData]);

  const toggleJoin = async () => {
    if (!user || !community) return toast.error("Faça login.");
    if (isMember) {
      if (user.id === community.owner_id) {
        toast.error("Como líder, você não pode sair sem transferir a posse.");
        return;
      }
      setIsJoining(true);
      try {
        await supabase.from('community_members').delete().match({ community_id: community.id, user_id: user.id });
        setIsMember(false);
        setMemberRole(null);
        fetchCommunityData();
        toast.success("Você saiu da comunidade.");
      } catch (err) {
        toast.error("Erro ao sair.");
      } finally { setIsJoining(false); }
      return;
    }

    setIsJoining(true);
    try {
      await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id });
      setIsMember(true);
      fetchCommunityData();
      toast.success(`Bem-vindo a c/${community.name}!`);
    } catch (err) {
      toast.error("Erro ao entrar.");
    } finally { setIsJoining(false); }
  };

  const handleDeleteCommunity = async () => {
    if (!community || !user) return;
    try {
      const { error } = await supabase.from('communities').delete().eq('id', community.id);
      if (error) throw error;
      toast.success('Comunidade excluída.');
      router.push('/forum');
    } catch (err) {
      toast.error('Erro ao excluir comunidade.');
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse text-xl font-bold opacity-50">Sincronizando c/{slug}...</div>;
  if (!community) return <div className="p-20 text-center opacity-50">Comunidade não encontrada.</div>;

  const isActuallyOwner = user?.id === community.owner_id;
  const isLeader = isActuallyOwner || isAdmin;
  const canCustomize = isActuallyOwner || isAdmin;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 transition-none">
      <Link href="/forum" className="inline-flex items-center text-sm font-bold hover:text-primary transition-colors group text-contrast-bg">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar para o Fórum
      </Link>

      <div className="glass-panel rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative transition-none" data-aos="fade-up">
        <div className="h-48 sm:h-72 bg-primary/20 relative transition-none">
          {community.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.banner_url} className="w-full h-full object-cover" alt="Banner" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition-none" />
        </div>
        <div className="px-4 sm:px-8 pb-8 flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-24 gap-6 relative z-10 transition-none">
          <Avatar className="h-24 w-24 sm:h-48 sm:w-48 border-4 border-background shadow-2xl relative z-10 bg-background transition-none">
            <AvatarImage src={community.avatar_url || ''} className="object-cover transition-none" />
            <AvatarFallback className="text-6xl font-black bg-muted transition-none">{community.name[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left mb-4 transition-none min-w-0 w-full">
            <h1 className="text-3xl sm:text-6xl font-black tracking-tighter text-white drop-shadow-lg transition-none truncate">c/{community.name}</h1>
            <p className="text-sm sm:text-lg font-bold opacity-80 text-white mt-2 max-w-2xl line-clamp-2 transition-none mx-auto sm:mx-0">{community.description || 'Comunidade sem descrição.'}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mb-2 transition-none">
            {canCustomize && (
              <Button variant="outline" className="rounded-xl h-12 px-6 font-black gap-2 glass-panel border-none">
                <Settings size={16} /> Customizar
              </Button>
            )}

            {isLeader && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-12 w-12 rounded-xl shadow-lg transition-all hover:scale-105">
                    <Trash2 size={20} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass-panel border-white/20 rounded-xl sm:rounded-[2.5rem] w-[95vw] max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl font-black">Excluir Comunidade?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação é irreversível. Todos os tópicos e membros serão removidos permanentemente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteCommunity} className="bg-destructive rounded-xl font-black px-6">Confirmar Exclusão</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {isMember && (
              <Button className="rounded-xl h-12 px-6 font-black gap-2 neo-button bg-primary text-white">
                <Edit3 size={16} /> Criar Tópico
              </Button>
            )}
            <Button variant={isMember ? "outline" : "default"} onClick={toggleJoin} disabled={isJoining} className="rounded-xl h-12 px-10 font-black neo-button">
              {isJoining ? <Loader2 className="animate-spin" /> : isMember ? <><LogOut size={16} /> Sair</> : 'Entrar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 transition-none">
        <div className="space-y-4 transition-none">
          {posts.map((post, idx) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="transition-none">
              <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden group transition-none shadow-xl">
                <div className="flex gap-4 p-6 transition-none">
                  <div className="hidden sm:block transition-none">
                    <VoteControls targetId={post.id} targetType="post" initialScore={post.vote_score || 0} initialUserVote={post.user_vote || 0} />
                  </div>
                  <div className="flex-1 space-y-2 transition-none">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50 transition-none">
                      <Link href={`/profile/${post.profiles?.username}`} className="transition-transform hover:scale-110">
                        <Avatar className="h-5 w-5 border border-background">
                          <AvatarImage src={post.profiles?.avatar_url || ''} />
                          <AvatarFallback>{post.profiles?.username?.[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <Link
                        href={`/profile/${post.profiles?.username}`}
                        className="hover:opacity-80 transition-opacity font-black truncate max-w-[100px]"
                        style={{ color: post.profiles?.name_color || 'inherit' }}
                      >
                        @{post.profiles?.username}
                      </Link>
                      <span className="transition-none">•</span><span className="transition-none">{formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: true })}</span>
                    </div>
                    <Link href={`/forum/t/${post.id}`} className="transition-none"><h3 className="text-xl sm:text-2xl font-black group-hover:text-primary leading-tight transition-none">{post.title}</h3></Link>
                    <div className="flex items-center gap-4 pt-2 transition-none">
                      <Link href={`/forum/t/${post.id}`} className="flex items-center gap-2 text-xs font-bold opacity-70 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 hover:bg-white/10 transition-all">
                        <MessageSquare className="h-4 w-4 text-primary transition-none" /> {post.comment_count} Comentários
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          {posts.length === 0 && <div className="text-center py-20 opacity-30 italic transition-none">Nenhum tópico criado nesta comunidade ainda.</div>}
        </div>

        <aside className="space-y-6 transition-none">
          <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-6 lg:p-8 space-y-8 shadow-xl transition-none">
            <h3 className="font-black text-2xl tracking-tight transition-none">Sobre</h3>
            <div className="space-y-6 transition-none">
              <div className="flex items-center gap-4 text-sm transition-none">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-none shadow-sm"><Users2 className="h-5 w-5 transition-none" /></div>
                <div className="transition-none"><p className="font-black text-lg transition-none">{memberCount}</p><p className="text-[10px] opacity-40 uppercase font-black tracking-widest transition-none">Membros</p></div>
              </div>
              <div className="flex items-center gap-4 text-sm transition-none">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 transition-none shadow-sm"><Calendar className="h-5 w-5 transition-none" /></div>
                <div className="transition-none"><p className="font-black text-lg transition-none">{new Date(community.created_at).toLocaleDateString('pt-BR')}</p><p className="text-[10px] opacity-40 uppercase font-black tracking-widest transition-none">Criada em</p></div>
              </div>
            </div>
          </Card>

          <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl transition-none">
            <h3 className="font-black text-xl tracking-tight transition-none">Membros</h3>
            <div className="space-y-4 transition-none">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between group transition-none">
                  <Link href={`/profile/${member.username}`} className="flex items-center gap-3 transition-none min-w-0">
                    <div className="relative transition-none shrink-0">
                      <Avatar className="h-10 w-10 border-2 border-background hover:scale-110 transition-transform shadow-md">
                        <AvatarImage src={member.avatar_url || ''} className="transition-none" />
                        <AvatarFallback className="transition-none">{member.username?.[0]}</AvatarFallback>
                      </Avatar>
                      {member.id === community.owner_id ? (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full p-0.5 shadow-sm border border-background">
                          <Crown size={8} className="fill-current" />
                        </div>
                      ) : member.role === 'moderator' && (
                        <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-sm border border-background">
                          <ShieldCheck size={8} className="fill-current" />
                        </div>
                      )}
                    </div>
                    <span
                      className="font-black text-sm truncate hover:opacity-80 transition-opacity"
                      style={{ color: member.name_color || 'inherit' }}
                    >
                      @{member.username}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
