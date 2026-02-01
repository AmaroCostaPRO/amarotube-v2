import React, { useState, useEffect } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Notification } from '@/types';

interface NotificationBellProps {
  onOpenChange?: (open: boolean) => void;
  hideBadge?: boolean;
  className?: string;
}

export function NotificationBell({ onOpenChange, hideBadge = false, className }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(error);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info("Nova notificação recebida!");
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markAsRead = async (id?: string) => {
    if (!user) return;
    const query = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    if (id) query.eq('id', id);
    const { error } = await query;
    if (!error) fetchNotifications();
  };

  const getNotificationLink = (n: Notification) => {
    const videoId = n.data?.video_id || n.data?.target_id;
    if (n.type === 'new_comment' || n.type === 'new_like') return videoId ? `/watch/${videoId}` : '#';
    if (n.type === 'new_member') return `/forum/c/${n.data.community_name || n.data.community_id}`;
    if (n.type === 'forum_reply' || n.type === 'forum_vote' || n.type === 'mention') {
      const id = n.data.post_id || n.data.target_id;
      return id ? `/forum/p/${id}` : '#';
    }
    return '#';
  };

  const getNotificationText = (n: Notification) => {
    if (n.type === 'new_comment') return `comentou no seu vídeo.`;
    if (n.type === 'new_like') return `curtiu seu vídeo.`;
    if (n.type === 'new_member') return `entrou na comunidade ${n.data.community_name || ''}.`;
    if (n.type === 'forum_reply') return `respondeu ao seu tópico.`;
    if (n.type === 'forum_vote') return `votou no seu post.`;
    if (n.type === 'mention') return `mencionou você em um tópico do fórum.`;
    return 'nova atividade.';
  };

  const getNotificationUser = (n: Notification) => {
    return n.data.author_username || n.data.commenter_username || n.data.liker_username || n.data.member_username || n.data.replier_username || n.data.voter_username || 'Alguém';
  };

  return (
    <Popover modal={true} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-8 w-8 rounded-full bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all shadow-sm border border-black/5 dark:border-white/10 active:scale-95",
            className
          )}
          aria-label={`Notificações. ${unreadCount} não lidas`}
        >
          <Bell className="h-4 w-4 text-foreground" />
          {unreadCount > 0 && !hideBadge && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-background shadow-lg animate-in zoom-in duration-300">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 glass-panel-matte border-white/20 rounded-xl overflow-hidden shadow-2xl z-[300]">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h3 className="font-black text-xs uppercase tracking-widest opacity-60 leading-none">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAsRead()} className="h-7 text-[9px] font-black uppercase tracking-widest hover:text-primary leading-none" aria-label="Marcar todas como lidas">
              Ler tudo
            </Button>
          )}
        </div>
        <ScrollArea className="h-[380px]">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin opacity-30" /></div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {notifications.map((n) => (
                <Link href={getNotificationLink(n)} key={n.id} onClick={() => markAsRead(n.id)} className={cn("flex gap-3 p-4 hover:bg-primary/5 transition-colors relative", !n.is_read && "bg-primary/[0.03]")}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-tight">
                      <span className="font-black">@{getNotificationUser(n)}</span> {getNotificationText(n)}
                    </p>
                    <p className="text-[9px] opacity-40 mt-1 uppercase font-bold">
                      {formatDistanceToNow(new Date(n.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                  {!n.is_read && <div className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 shrink-0 shadow-sm shadow-primary/50" />}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 opacity-30 text-center gap-3">
              <Bell size={40} strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}