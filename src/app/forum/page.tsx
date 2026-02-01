"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Community, ForumPost } from '@/types/forum';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { VoteControls } from '@/components/forum/VoteControls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, TrendingUp, Search, Compass, Grid, Loader2, ShieldCheck, Scale, Info, Lock, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ForumPage() {
  const { user, session } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: comms } = await supabase.from('communities').select('*').order('created_at', { ascending: false });
      setCommunities(comms || []);

      if (session) {
        const { data: postsData, error: postsError } = await supabase
          .from('forum_posts')
          .select('*, profiles:user_id(username, avatar_url, name_color), communities:community_id(name, avatar_url)')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        if (postsData) {
          const postIds = postsData.map(p => p.id);
          const { data: allVotes } = await supabase.from('forum_votes').select('*').in('target_id', postIds);
          const { data: allComments } = await supabase.from('forum_comments').select('post_id');

          const processed = postsData.map(post => {
            const postVotes = (allVotes || []).filter(v => v.target_id === post.id);
            const score = postVotes.reduce((acc, v) => acc + v.vote_type, 0);
            const userVote = postVotes.find(v => v.user_id === user?.id)?.vote_type || 0;
            const commentCount = (allComments || []).filter(c => c.post_id === post.id).length;

            return { ...post, vote_score: score, user_vote: userVote, comment_count: commentCount };
          });

          const sorted = [...processed].sort((a, b) => {
            if (sortBy === 'top') return (b.vote_score || 0) - (a.vote_score || 0);
            if (sortBy === 'active') return (b.comment_count || 0) - (a.comment_count || 0);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          setPosts(sorted);
        }
      }
    } catch (error) { console.error('Erro no fórum:', error); } finally { setIsLoading(false); }
  }, [sortBy, user?.id, session]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredCommunities = communities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const interactiveClasses = "bg-black/5 dark:bg-white/5 border-none shadow-inner transition-none";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 sm:gap-8 pb-20 transition-none">
      <div className="space-y-10 transition-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-none" data-aos="fade-down">
          <div className="space-y-1 transition-none">
            <h1 className="text-4xl font-black tracking-tight transition-none text-contrast-bg">Fórum AmaroTube</h1>
            <p className="font-bold opacity-60 text-contrast-bg transition-none">Participe de discussões, crie tópicos e interaja com a comunidade.</p>
          </div>
          {session && (
            <Button className="rounded-xl h-12 px-6 neo-button font-black gap-2 flex-1 sm:flex-none transition-none shadow-primary/20 bg-primary text-primary-foreground">
              <PlusCircle className="h-5 w-5 transition-none" /> Criar Comunidade
            </Button>
          )}
        </div>

        {!session && (
          <div className="p-4 sm:p-8 glass-panel border-white/10 rounded-xl sm:rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4 bg-primary/5 transition-none">
            <div className="flex items-center gap-4 w-full transition-none">
              <Info className="h-6 w-6 text-primary shrink-0 transition-none" />
              <p className="font-bold opacity-80 text-contrast-bg transition-none">Faça parte das discussões. O fórum é o espaço oficial para troca de ideias da comunidade.</p>
            </div>
            <Link href="/login" className="w-full md:w-auto md:ml-auto transition-none">
              <Button className="rounded-xl font-black px-6 w-full transition-none">Entrar Agora</Button>
            </Link>
          </div>
        )}

        {session && (
          <>
            <div className="p-3 glass-panel rounded-xl sm:rounded-[2.5rem] shadow-xl transition-none">
              <div className="relative transition-none">
                <Input
                  name="community-search"
                  placeholder="Buscar comunidades..."
                  className={`h-14 rounded-xl ${interactiveClasses} font-bold transition-none pl-12`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 h-5 w-5 transition-none" />
              </div>
            </div>

            <div className="space-y-6 transition-none">
              <div className="flex items-center gap-2 px-2 transition-none">
                <Grid className="text-primary h-5 w-5 transition-none" />
                <h2 className="text-xl font-black transition-none text-contrast-bg">{search ? 'Resultados' : 'Explorar'}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 transition-none">
                {filteredCommunities.slice(0, 6).map(comm => (
                  <Link key={comm.id} href={`/forum/c/${comm.name}`} className="transition-none">
                    <Card className="glass-panel border-none p-4 rounded-xl sm:rounded-[2rem] flex items-center gap-3 group shadow-xl transition-none">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-lg transition-none">
                        <AvatarImage src={comm.avatar_url || ''} className="transition-none" />
                        <AvatarFallback className="font-black bg-muted transition-none">{comm.name[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 transition-none">
                        <p className="font-black truncate group-hover:text-primary transition-none">c/{comm.name}</p>
                        <p className="text-[10px] opacity-40 uppercase font-black tracking-widest transition-none">Acessar</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="space-y-6 pt-4 transition-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 transition-none">
            <div className="flex items-center gap-2 transition-none">
              <Compass className="text-primary h-5 w-5 transition-none" />
              <h2 className="text-xl font-black transition-none text-contrast-bg">Feed Global</h2>
            </div>
            {session && (
              <div className="p-2 glass-panel rounded-xl transition-none">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={`w-full sm:w-[180px] rounded-xl ${interactiveClasses} font-bold h-10 transition-none`}>
                    <SelectValue placeholder="Ordenar por" className="transition-none" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel rounded-xl border-white/20 transition-none">
                    <SelectItem value="recent" className="transition-none">Mais Recentes</SelectItem>
                    <SelectItem value="top" className="transition-none">Mais Votados</SelectItem>
                    <SelectItem value="active" className="transition-none">Mais Comentados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4 transition-none">
            {isLoading && session ? (
              <div className="flex justify-center py-20 transition-none"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
            ) : !session ? (
              <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 transition-none">
                <Lock className="h-20 w-20 mx-auto mb-6 text-contrast-bg transition-none" />
                <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg transition-none">Discussão Privada</p>
                <p className="font-medium px-4 text-contrast-bg opacity-70 transition-none">O feed de tópicos e as comunidades são visíveis apenas para membros registrados.</p>
              </div>
            ) : posts.length > 0 ? posts.map((post, idx) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="transition-none">
                <Card className="glass-panel border-none rounded-xl sm:rounded-[2rem] overflow-hidden group shadow-xl transition-none">
                  <div className="flex gap-4 p-4 sm:p-5 transition-none">
                    <div className="hidden sm:block pt-1 transition-none">
                      <VoteControls targetId={post.id} targetType="post" initialScore={post.vote_score || 0} initialUserVote={post.user_vote || 0} />
                    </div>
                    <div className="flex-1 space-y-2 transition-none">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-50 transition-none">
                        <Link href={`/forum/c/${post.communities?.name}`} className="text-primary hover:underline transition-none">c/{post.communities?.name}</Link>
                        <span className="transition-none">•</span>
                        <Link
                          href={`/profile/${post.profiles?.username}`}
                          className="hover:opacity-80 transition-opacity font-black"
                          style={{ color: post.profiles?.name_color || 'inherit' }}
                        >
                          @{post.profiles?.username}
                        </Link>
                        <span className="transition-none">•</span>
                        <span className="transition-none">{formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: true })}</span>
                      </div>
                      <Link href={`/forum/t/${post.id}`} className="transition-none">
                        <h3 className="text-xl font-black group-hover:text-primary transition-none">{post.title}</h3>
                      </Link>
                      <div className="flex items-center gap-4 pt-1 transition-none">
                        <Link href={`/forum/t/${post.id}`} className="flex items-center gap-2 text-xs font-bold opacity-70 bg-black/5 dark:bg-white/5 px-4 py-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-none">
                          <MessageSquare className="h-4 w-4 text-primary transition-none" /> {post.comment_count} Comentários
                        </Link>
                        <div className="sm:hidden flex items-center gap-1.5 text-xs font-bold opacity-70 bg-black/5 dark:bg-white/5 px-4 py-1.5 rounded-full transition-none">
                          <TrendingUp className="h-4 w-4 text-primary transition-none" /> {post.vote_score} Votos
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )) : (
              <div className="text-center py-20 opacity-50 italic transition-none">Nenhum tópico encontrado.</div>
            )}
          </div>
        </div>
      </div>

      <aside className="space-y-8 transition-none">
        {session && (
          <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl transition-none">
            <div className="p-6 pb-4 bg-white/5 border-b border-white/5 transition-none">
              <h3 className="font-black text-lg flex items-center gap-2 transition-none">
                <TrendingUp className="h-5 w-5 text-primary transition-none" /> Sugeridas
              </h3>
            </div>
            <div className="p-6 space-y-5 transition-none">
              {communities.slice(0, 3).map(comm => (
                <Link key={comm.id} href={`/forum/c/${comm.name}`} className="flex items-center gap-3 group transition-none">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-lg transition-none">
                    <AvatarImage src={comm.avatar_url || ''} className="transition-none" />
                    <AvatarFallback className="font-bold transition-none">{comm.name[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-black text-sm group-hover:text-primary transition-none">c/{comm.name}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl transition-none">
          <div className="p-6 pb-4 bg-primary/10 border-b border-primary/10 transition-none">
            <h3 className="font-black text-xl flex items-center gap-2 text-primary transition-none">
              <ShieldCheck className="h-6 w-6 transition-none" /> Regras da Casa
            </h3>
          </div>
          <div className="p-6 space-y-8 transition-none">
            <div className="space-y-6 transition-none">
              <div className="flex gap-4 transition-none">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 transition-none">
                  <span className="text-xs font-black text-primary transition-none">01</span>
                </div>
                <div className="transition-none">
                  <p className="text-sm font-black uppercase tracking-tight mb-1.5 transition-none">Respeito Mútuo</p>
                  <p className="text-sm opacity-70 leading-relaxed font-medium transition-none">Trate todos com cortesia. Ataques pessoais, assédio ou discursos de ódio resultam em banimento imediato.</p>
                </div>
              </div>

              <div className="flex gap-4 transition-none">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 transition-none">
                  <span className="text-xs font-black text-primary transition-none">02</span>
                </div>
                <div className="transition-none">
                  <p className="text-sm font-black uppercase tracking-tight mb-1.5 transition-none">Conteúdo Relevante</p>
                  <p className="text-sm opacity-70 leading-relaxed font-medium transition-none">Mantenha os tópicos organizados em suas comunidades. Evite spam ou publicidade não solicitada.</p>
                </div>
              </div>

              <div className="flex gap-4 transition-none">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5 transition-none">
                  <span className="text-xs font-black text-primary transition-none">03</span>
                </div>
                <div className="transition-none">
                  <p className="text-sm font-black uppercase tracking-tight mb-1.5 transition-none">Sanções e Moderação</p>
                  <p className="text-sm opacity-70 leading-relaxed font-medium transition-none">Violações podem gerar advertências (strikes). 3 strikes resultam em suspensão temporária ou permanente da conta.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-start gap-3 opacity-60 transition-none">
              <Scale className="h-5 w-5 mt-0.5 shrink-0 transition-none" />
              <p className="text-xs font-bold uppercase tracking-wide leading-relaxed transition-none">Ao postar, você concorda com nossos termos de convivência e conduta ética.</p>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
