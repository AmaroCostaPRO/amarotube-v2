"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Video } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, Flag, MoreVertical, Heart, Users, MessageSquare, ListMusic } from 'lucide-react';
import { UserBadges } from '@/components/features/social/UserBadges';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FriendsTab } from '@/components/profile/FriendsTab';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('username', username).single();
      if (p) {
        setProfile(p);
        const { data: b } = await supabase.from('user_badges').select('badge_type').eq('user_id', p.id);
        setBadges(b?.map(item => item.badge_type) || []);
        const { data: v } = await supabase.from('videos').select('*').eq('user_id', p.id).eq('is_from_channel_update', false).order('created_at', { ascending: false });
        setVideos(v || []);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (loading) return <div className="py-4 smart-container"><Skeleton className="h-64 w-full rounded-xl sm:rounded-[2.5rem]" /></div>;
  if (!profile) return <div className="p-8 text-center opacity-50 text-contrast-bg">Usuário não encontrado</div>;

  const isOwnProfile = user?.id === profile.id;
  const triggerClasses = "rounded-xl gap-2 font-bold transition-none h-full data-[state=active]:bg-black/[0.04] dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-inner data-[state=active]:text-primary relative";

  return (
    <div className="smart-container--wide py-4 transition-none pb-20 isolate">
      <div className="py-4 px-0 sm:p-10 flex flex-col md:flex-row items-center gap-4 sm:gap-6 lg:gap-10 relative z-10 transition-none mb-6 sm:mb-12">
        <div className="relative group shrink-0 transition-none">
          {profile.avatar_border && profile.avatar_border !== 'transparent' && (
            <div className="absolute -inset-2 rounded-full z-0 opacity-70 blur-[1px] transition-none" style={{ background: profile.avatar_border }} />
          )}
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 lg:h-44 lg:w-44 border-8 border-background shadow-2xl relative z-10 transition-none">
            <AvatarImage src={profile.avatar_url || ''} className="object-cover transition-none" />
            <AvatarFallback className="text-5xl font-black transition-none">{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center md:text-left transition-none min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2 transition-none">
            <h1
              className="text-5xl lg:text-7xl font-black tracking-tighter transition-none truncate"
              style={{ color: profile.name_color || 'inherit' }}
            >
              {profile.username}
            </h1>

            <div className="flex items-center justify-center md:justify-start gap-2 transition-none shrink-0">
              {session && !isOwnProfile && (
                <>
                  <Button className="rounded-xl h-10 px-6 font-black gap-2 neo-button bg-primary text-primary-foreground shadow-lg transition-none">
                    <Heart size={16} className="fill-current transition-none" /> Dar Gorjeta
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-black/5 transition-none text-contrast-bg">
                        <MoreVertical className="h-5 w-5 transition-none" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="glass-panel border-white/20 rounded-xl w-48 shadow-2xl p-1 transition-none">
                      <DropdownMenuItem className="rounded-xl gap-2 font-bold cursor-pointer focus:bg-destructive/10 focus:text-destructive text-muted-foreground transition-colors">
                        <Flag className="h-4 w-4 transition-none" /> Denunciar Perfil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-2 opacity-60 text-xs font-black uppercase tracking-widest transition-none text-contrast-bg">
            <CalendarIcon size={14} className="transition-none" /> Membro desde {profile.created_at ? new Date(profile.created_at).getFullYear() : 2025}
          </div>
        </div>

        <div className="flex justify-center md:justify-center shrink-0 transition-none w-full md:w-[420px] mt-8 md:mt-0">
          <div className="w-full flex justify-center items-center overflow-visible mb-10 md:mb-0 transition-none">
            {profile.is_badges_public || isOwnProfile ? (
              <UserBadges badges={badges} className="transition-none" />
            ) : (
              <div className="bg-black/5 p-4 rounded-xl flex items-center justify-center gap-2 opacity-40 text-contrast-bg"><Flag size={14} /> Badges Privadas</div>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full transition-none relative z-20">
        <TabsList
          className={cn(
            "grid mb-10 glass-panel p-1.5 h-auto md:h-16 rounded-xl transition-none border border-white/10 shadow-2xl gap-1",
            isOwnProfile ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3"
          )}
        >
          <TabsTrigger value="content" className={triggerClasses}><ListMusic size={18} /> Conteúdo</TabsTrigger>
          <TabsTrigger value="friends" className={triggerClasses}><Users size={18} /> Amigos</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="messages" className={triggerClasses}><MessageSquare size={18} /> Mensagens</TabsTrigger>}
          <TabsTrigger value="calendar" className={triggerClasses}><CalendarIcon size={18} /> Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="transition-none">
          <div className="space-y-6 transition-none">
            <h2 className="text-3xl font-black tracking-tight text-contrast-bg transition-none px-2">Vídeos Recomendados</h2>
            {(profile.is_content_public || isOwnProfile) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 transition-none">
                {videos.map(v => (
                  <Link href={`/watch/${v.id}`} key={v.id} className="transition-none">
                    <div className="glass-panel rounded-xl sm:rounded-[2rem] overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl group h-full border-none">
                      <div className="relative aspect-video overflow-hidden transition-none">
                        <img src={v.thumbnail_url || ''} alt={v.title} className={cn("object-cover w-full h-full transition-none", v.is_nsfw && "blur-xl")} />
                      </div>
                      <div className="p-4 transition-none">
                        <p className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors transition-none">{v.title}</p>
                        <p className="text-[10px] opacity-50 mt-1 uppercase font-black transition-none">{v.channel_name}</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {videos.length === 0 && <div className="col-span-full py-20 text-center opacity-40 italic transition-none text-contrast-bg">Nenhum vídeo adicionado ainda.</div>}
              </div>
            ) : (
              <div className="py-20 text-center glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 transition-none">
                <ListMusic className="h-20 w-20 mx-auto mb-4 transition-none text-contrast-bg" />
                <p className="text-xl font-black transition-none text-contrast-bg">Conteúdo Privado</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="friends" className="transition-none">
          <FriendsTab targetUserId={profile.id} isOwnProfile={isOwnProfile} />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="messages" className="transition-none">
            <div className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 shadow-xl text-center py-20">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-black opacity-50">Sistema de Mensagens</p>
              <p className="text-sm opacity-40">Funcionalidade completa disponível em breve.</p>
            </div>
          </TabsContent>
        )}

        <TabsContent value="calendar" className="transition-none">
          <div className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 shadow-xl text-center py-20">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-black opacity-50">Agenda Pessoal</p>
            <p className="text-sm opacity-40">Funcionalidade completa disponível em breve.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
