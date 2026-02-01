import React, { useState } from 'react';
import Link from 'next/link';
import { Channel } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tv, RefreshCw, Loader2, ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChannelCardProps {
  channel: Channel;
  onRefresh?: () => void;
  onMove?: (direction: 'left' | 'right') => void;
  isOrganizing?: boolean;
}

export function ChannelCard({ channel, onRefresh, onMove, isOrganizing }: ChannelCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncIdentity = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSyncing(true);
    try {
      const details = await apiService.fetchChannelDetails(channel.youtube_channel_id);

      const { error } = await supabase
        .from('channels')
        .update({
          name: details.title,
          description: details.description,
          avatar_url: details.thumbnail,
          banner_url: details.banner
        })
        .eq('id', channel.id);

      if (error) throw error;

      toast.success('Identidade visual sincronizada!');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Erro ao excluir canal.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={cn(
      "glass-panel rounded-xl sm:rounded-[2rem] overflow-hidden p-4 group transition-all duration-300 relative border-none",
      isOrganizing ? "ring-2 ring-primary/20 shadow-neo-inset" : "hover:shadow-2xl hover:-translate-y-2"
    )}>
      <Link href={`/channel/${channel.youtube_channel_id}`} className="block transition-transform hover:scale-105">
        <div className="relative aspect-video rounded-xl overflow-hidden mb-8 bg-black/10 transition-none">
          {channel.banner_url ? (
            <img
              src={channel.banner_url}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              alt={channel.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20"><Tv size={48} /></div>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-20">
            {!isOrganizing && (
              <Button
                variant="secondary"
                size="icon"
                onClick={handleSyncIdentity}
                disabled={isSyncing}
                className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md text-white border-white/10 hover:bg-black/60"
              >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              </Button>
            )}
          </div>

          {isOrganizing && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-20">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full shadow-xl neo-button bg-white text-primary"
                  onClick={(e) => { e.preventDefault(); onMove?.('left'); }}
                >
                  <ChevronLeft size={24} />
                </Button>
                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                  <GripHorizontal size={20} />
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full shadow-xl neo-button bg-white text-primary"
                  onClick={(e) => { e.preventDefault(); onMove?.('right'); }}
                >
                  <ChevronRight size={24} />
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center -mt-12 relative z-10 px-2 transition-none">
          <Avatar className="h-20 w-20 border-4 border-background shadow-xl mb-3 transition-none">
            <AvatarImage src={channel.avatar_url || ''} className="transition-none" />
            <AvatarFallback className="transition-none">{channel.name[0]}</AvatarFallback>
          </Avatar>
          <h3 className="font-black text-center line-clamp-1 group-hover:text-primary transition-colors transition-none">{channel.name}</h3>
          <p className="text-[10px] font-bold text-center opacity-40 uppercase tracking-widest mt-2 h-4 overflow-hidden transition-none">
            {isOrganizing ? 'Modo Organização' : 'Acessar Canal'}
          </p>
        </div>
      </Link>
    </div>
  );
}