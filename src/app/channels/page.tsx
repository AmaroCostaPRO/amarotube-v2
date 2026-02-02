"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Channel } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Tv, Loader2, Info, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChannelCard } from '@/components/features/channel/ChannelCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AddChannelModal } from '@/components/modals';

export default function ChannelsPage() {
  const { user, session } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const fetchChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });

        if (error) throw error;
        setChannels((data as Channel[]) || []);
      } else {
        setChannels([]);
      }
    } catch (error: unknown) {
      console.error('Error fetching channels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newChannels = [...channels];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= channels.length) return;

    const [removed] = newChannels.splice(index, 1);
    newChannels.splice(targetIndex, 0, removed);
    setChannels(newChannels);
  };

  const saveOrder = async () => {
    if (!user) return;
    setIsSavingOrder(true);
    try {
      const updates = channels.map((channel, index) => ({
        id: channel.id,
        user_id: user.id,
        youtube_channel_id: channel.youtube_channel_id,
        name: channel.name,
        position: index + 1
      }));

      const { error } = await supabase
        .from('channels')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Ordem salva com sucesso!');
      setIsOrganizing(false);
    } catch (err: unknown) {
      toast.error('Erro ao salvar nova ordem.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div className="pb-20 transition-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6 sm:mb-10 transition-none" data-aos="fade-right">
        <div className="space-y-1 transition-none">
          <div className="flex items-center gap-4 transition-none">
            <h1 className="text-4xl font-black tracking-tight text-contrast-bg transition-none">Criadores</h1>
            {session && channels.length > 0 && !isOrganizing && (
              <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest transition-none">
                {channels.length} Ativos
              </div>
            )}
          </div>
          <p className="font-bold opacity-60 text-contrast-bg transition-none">
            {isOrganizing ? 'Mova os cards usando as setas para reordenar seu feed' : 'Gerencie seus criadores favoritos e receba atualizações automáticas.'}
          </p>
        </div>

        {session && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {channels.length > 1 && (
              <Button
                variant={isOrganizing ? "default" : "outline"}
                onClick={() => isOrganizing ? saveOrder() : setIsOrganizing(true)}
                disabled={isSavingOrder}
                className={cn(
                  "rounded-xl h-12 px-6 font-black gap-2 transition-all shadow-lg",
                  isOrganizing
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/20 border-none"
                    : "glass-panel border-none text-foreground"
                )}
              >
                {isSavingOrder ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isOrganizing ? (
                  <><CheckCircle2 className="h-5 w-5" /> Salvar Ordem</>
                ) : (
                  <><LayoutGrid className="h-5 w-5" /> Organizar</>
                )}
              </Button>
            )}

            {!isOrganizing && (
              <AddChannelModal>
                <Button className="rounded-xl h-12 px-6 neo-button font-black gap-2 flex-1 sm:flex-none transition-none shadow-primary/20 bg-primary text-primary-foreground">
                  <PlusCircle className="h-5 w-5 transition-none" /> Adicionar Canal
                </Button>
              </AddChannelModal>
            )}

            {isOrganizing && (
              <Button
                variant="outline"
                onClick={() => { setIsOrganizing(false); fetchChannels(); }}
                className="glass-panel border-none rounded-xl h-12 px-6 font-black text-black dark:text-white shadow-lg transition-all"
              >
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>

      {!session && (
        <div className="mb-10 p-6 glass-panel border-white/10 rounded-xl sm:rounded-3xl flex flex-col md:flex-row items-center gap-4 bg-primary/5 transition-none">
          <div className="flex items-center gap-4 w-full transition-none">
            <Info className="h-6 w-6 text-primary shrink-0 transition-none" />
            <p className="font-bold opacity-80 text-contrast-bg transition-none">Conecte sua conta para sincronizar seus canais favoritos do YouTube diretamente no feed do AmaroTube.</p>
          </div>
          <Link href="/login" className="w-full md:w-auto md:ml-auto transition-none">
            <Button className="rounded-xl font-black px-6 w-full transition-none">Entrar Agora</Button>
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-none">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl sm:rounded-[2rem] transition-none" />)}
        </div>
      ) : channels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 transition-none">
          {channels.map((channel, index) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onRefresh={fetchChannels}
              isOrganizing={isOrganizing}
              onMove={(dir) => handleMove(index, dir)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] opacity-30 border-dashed border-2 bg-transparent border-white/10 transition-none">
          <Tv className="h-20 w-20 mx-auto mb-6 text-contrast-bg transition-none" />
          <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg transition-none">Nenhum canal ativo</p>
          <p className="font-medium px-4 text-contrast-bg opacity-70 transition-none">Adicione canais para que o sistema busque vídeos novos automaticamente.</p>
        </div>
      )}
    </div>
  );
}
