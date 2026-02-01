"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
}

type ProfileWithFriendship = Profile & { friendship?: Friendship };

export default function UsersPage() {
  const { user, session } = useAuth();
  const [profiles, setProfiles] = useState<ProfileWithFriendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*').order('username', { ascending: true });
      if (user) { query = query.neq('id', user.id); }
      const { data } = await query;

      if (user && data) {
        // Buscar status de amizade para todos
        const { data: relations } = await supabase
          .from('friendships')
          .select('*')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        const enriched = data.map(p => {
          const rel = relations?.find(r => r.user_id === p.id || r.friend_id === p.id);
          return { ...p, friendship: rel } as ProfileWithFriendship;
        });
        setProfiles(enriched);
      } else {
        setProfiles(data || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleAddFriend = async (targetId: string) => {
    if (!session) return toast.error("Faça login para adicionar amigos.");
    setProcessingId(targetId);
    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: user?.id,
        friend_id: targetId,
        status: 'pending'
      });
      if (error) throw error;
      toast.success('Solicitação enviada!');
      fetchProfiles();
    } catch (err: unknown) {
      toast.error('Erro ao solicitar amizade.');
    } finally { setProcessingId(null); }
  };

  return (
    <div className="transition-none pb-20">
      <div className="space-y-1 mb-6 sm:mb-10 transition-none" data-aos="fade-right">
        <h1 className="text-4xl font-black tracking-tight text-contrast-bg transition-none">Explorar Comunidade</h1>
        <p className="font-bold opacity-60 text-contrast-bg transition-none">Descubra e conecte-se com outros membros da rede AmaroTube.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 transition-none">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3 transition-none">
              <Skeleton className="h-28 w-28 rounded-full transition-none" />
              <Skeleton className="h-6 w-24 transition-none" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 transition-none">
          {profiles.map(profile => (
            <motion.div
              key={profile.id}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group transition-none h-full"
            >
              <Card className="p-4 sm:p-8 flex flex-col items-center justify-center text-center transition-none shadow-xl hover:shadow-2xl glass-panel rounded-xl sm:rounded-[2.5rem] h-full border-none relative overflow-hidden">
                <Link href={`/profile/${profile.username}`} className="flex flex-col items-center w-full">
                  <div className="relative mb-6 transition-none">
                    {profile.avatar_border && profile.avatar_border !== 'transparent' && (
                      <div className="absolute -inset-2 rounded-full z-0 opacity-70 blur-[1px] transition-none" style={{ background: profile.avatar_border }} />
                    )}
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background relative z-10 shadow-xl transition-transform duration-300 group-hover:scale-105 transition-none">
                      <AvatarImage src={profile.avatar_url || ''} className="object-cover transition-none" />
                      <AvatarFallback className="text-4xl font-black transition-none">{profile.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <p
                    className="font-black text-xl tracking-tight truncate w-full group-hover:opacity-80 transition-opacity transition-none"
                    style={{ color: profile.name_color || 'inherit' }}
                  >
                    {profile.username}
                  </p>
                </Link>

                <div className="mt-6 w-full transition-none">
                  {!profile.friendship ? (
                    <Button
                      onClick={() => handleAddFriend(profile.id)}
                      disabled={processingId === profile.id || !session}
                      className="w-full h-10 rounded-xl font-black text-[10px] uppercase gap-2 neo-button"
                    >
                      {processingId === profile.id ? <Loader2 className="animate-spin h-3 w-3" /> : <UserPlus size={14} />} Adicionar
                    </Button>
                  ) : profile.friendship.status === 'pending' ? (
                    <Button variant="secondary" disabled className="w-full h-10 rounded-xl font-black text-[10px] uppercase gap-2 opacity-50">
                      <Clock size={14} /> Pendente
                    </Button>
                  ) : (
                    <Button variant="ghost" disabled className="w-full h-10 rounded-xl font-black text-[10px] uppercase gap-2 text-primary bg-primary/10">
                      <UserCheck size={14} /> Amigos
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
