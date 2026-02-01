"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Profile, Friendship } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserMinus, UserCheck, Clock, Search, UserPlus, Loader2, Inbox } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export function FriendsTab({
  targetUserId, isOwnProfile
}: { targetUserId: string, isOwnProfile: boolean }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const { data: accepted, error: acceptedError } = await supabase
        .from('friendships')
        .select(`
          status,
          friend:profiles!friendships_friend_id_fkey(id, username, avatar_url, avatar_border),
          requester:profiles!friendships_user_id_fkey(id, username, avatar_url, avatar_border)
        `)
        .or(`user_id.eq.${targetUserId},friend_id.eq.${targetUserId}`)
        .eq('status', 'accepted');

      if (acceptedError) throw acceptedError;

      const friendsList = (accepted || []).map(f => {
        const friendObj = Array.isArray(f.friend) ? f.friend[0] : f.friend;
        const requesterObj = Array.isArray(f.requester) ? f.requester[0] : f.requester;
        return (friendObj?.id === targetUserId ? requesterObj : friendObj) as Profile;
      });
      setFriends(friendsList.filter(Boolean));

      if (isOwnProfile) {
        const { data: pending, error: pendingError } = await supabase
          .from('friendships')
          .select('id, profiles!friendships_user_id_fkey(id, username, avatar_url)')
          .eq('friend_id', targetUserId)
          .eq('status', 'pending');

        if (pendingError) throw pendingError;

        const formattedPending = (pending || []).map((p) => ({
          ...p,
          profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        })) as Friendship[];
        setPendingRequests(formattedPending);
      }
    } catch (err: unknown) {
      console.error('Friends Fetch Error:', err);
    } finally { setLoading(false); }
  }, [targetUserId, isOwnProfile]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const handleAccept = async (requestId: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
    if (!error) { toast.success('Amizade confirmada!'); fetchFriends(); }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm('Remover amizade?')) return;
    const { error } = await supabase.from('friendships').delete().or(`and(user_id.eq.${user?.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user?.id})`);
    if (!error) { toast.success('Removido.'); fetchFriends(); }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin opacity-40" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-black flex items-center gap-2 px-2 text-contrast-bg"><UserCheck className="text-primary" /> Amigos ({friends.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {friends.map(friend => (
              <Card
                key={friend.id}
                className="p-4 rounded-xl sm:rounded-3xl flex items-center gap-3 group transition-all shadow-xl border-none bg-zinc-100/80 dark:bg-zinc-900/80 opacity-80 hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <Link href={`/profile/${friend.username}`} className="relative shrink-0">
                  {friend.avatar_border && friend.avatar_border !== 'transparent' && <div className="absolute -inset-1 rounded-full opacity-50 blur-[1px]" style={{ background: friend.avatar_border }} />}
                  <Avatar className="h-12 w-12 border-2 border-background relative z-10"><AvatarImage src={friend.avatar_url || ''} /><AvatarFallback>{friend.username?.[0]}</AvatarFallback></Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${friend.username}`} className="font-black truncate block hover:text-primary transition-colors text-sm">@{friend.username}</Link>
                  <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Amigo Ativo</p>
                </div>
                {isOwnProfile && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(friend.id)} className="opacity-0 group-hover:opacity-100 rounded-full text-destructive hover:bg-destructive/10 transition-all">
                    <UserMinus size={14} />
                  </Button>
                )}
              </Card>
            ))}
            {friends.length === 0 && (
              <div className="col-span-full py-16 text-center glass-panel rounded-xl sm:rounded-[2.5rem] opacity-30 border-dashed border-2 bg-transparent border-white/10">
                <Inbox className="h-12 w-12 mx-auto mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Nenhum amigo encontrado</p>
              </div>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <aside className="space-y-6">
            <Card className="glass-panel rounded-xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-fit border border-white/10">
              <div className="p-6 pb-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="font-black text-lg flex items-center gap-2"><Clock className="text-orange-500" /> Solicitações</h3>
                {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{pendingRequests.length}</span>}
              </div>

              <div className="p-6 space-y-4 min-h-[120px] flex flex-col justify-center">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0"><AvatarImage src={req.profiles?.avatar_url || ''} /><AvatarFallback>{req.profiles?.username?.[0]}</AvatarFallback></Avatar>
                      <span className="font-bold text-xs truncate">@{req.profiles?.username}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" onClick={() => handleAccept(req.id)} className="h-8 w-8 rounded-lg bg-primary text-white p-0"><UserPlus size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleRemove(req.profiles?.id || '')} className="h-8 w-8 rounded-lg text-destructive p-0"><UserMinus size={14} /></Button>
                    </div>
                  </div>
                ))}
                {pendingRequests.length === 0 && (
                  <div className="text-center space-y-2 opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest">Tudo em dia</p>
                    <p className="text-[9px] font-medium">Sem novas pendências.</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5 mt-auto">
                <Link href="/users">
                  <Button variant="outline" className="w-full h-12 rounded-xl font-black gap-2 border-white/10 hover:bg-white/10 transition-all text-xs uppercase tracking-widest">
                    <Search size={16} /> Buscar Amigos
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
