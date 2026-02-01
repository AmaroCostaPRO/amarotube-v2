import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/types';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Film, ListVideo, MessageSquare, ThumbsUp, Lock, Tv } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function InteractionFeed() {
  const { session } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!session) return;

    const fetchActivities = async () => {
      const { data } = await supabase
        .from('activities')
        .select('*, profiles(username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (data) setActivities(data as Activity[]);
    };
    fetchActivities();

    const channel = supabase
      .channel('feed-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_like': return <ThumbsUp className="h-5 w-5 text-red-500" />;
      case 'new_video': return <Film className="h-5 w-5 text-primary" />;
      case 'new_playlist': return <ListVideo className="h-5 w-5 text-green-500" />;
      case 'new_channel': return <Tv className="h-5 w-5 text-orange-500" />;
      default: return <MessageSquare className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const user = <span className="font-bold">@{activity.profiles?.username}</span>;
    switch (activity.type) {
      case 'new_like': 
        return <>{user} curtiu <span className="opacity-80 italic">{activity.metadata.video_title}</span></>;
      case 'new_video': 
        return <>{user} recomendou <span className="opacity-80 italic">{activity.metadata.video_title}</span></>;
      case 'new_playlist': 
        return <>{user} criou a playlist <span className="opacity-80 italic">{activity.metadata.playlist_title}</span></>;
      case 'new_channel': 
        return <>{user} adicionou o canal <span className="opacity-80 italic">{activity.metadata.channel_name}</span></>;
      default: 
        return <>{user} interagiu na plataforma</>;
    }
  };

  return (
    <div className="glass-panel rounded-[2rem] flex flex-col flex-1 overflow-hidden shadow-xl min-h-[300px]">
      <CardHeader className="pb-2 border-b border-white/5 bg-white/5">
        <CardTitle className="text-lg">Atividade Recente</CardTitle>
      </CardHeader>
      <div className="flex-1 p-4 overflow-hidden pt-0 relative">
        {!session ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-black/5 backdrop-blur-[2px]">
             <Lock className="h-8 w-8 text-primary opacity-20 mb-3" />
             <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-relaxed">Atividade restrita a membros da comunidade</p>
          </div>
        ) : (
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 pt-4">
              {activities.map(activity => (
                <Link key={activity.id} href={activity.metadata.video_id ? `/watch/${activity.metadata.video_id}` : '#'} className="group flex gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center flex-shrink-0 bg-white/5 border-white/10 shadow-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 leading-tight text-sm">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-[9px] font-black uppercase opacity-30 mt-1">{formatDistanceToNow(new Date(activity.created_at), { locale: ptBR, addSuffix: true })}</p>
                  </div>
                </Link>
              ))}
              {activities.length === 0 && (
                <div className="text-center py-10 opacity-30 italic text-xs">Nenhuma atividade recente por aqui.</div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}