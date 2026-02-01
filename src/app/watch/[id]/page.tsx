import { supabase } from '@/integrations/supabase/client';
import { WatchView } from './WatchView';
import { Video } from '@/types';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  const { data: video } = await supabase
    .from('videos')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: video?.title ? `${video.title} - AmaroTube` : 'Assistir Vídeo - AmaroTube',
  };
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params;

  // Busca simplificada do vídeo
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] flex-col gap-4">
        <h1 className="text-2xl font-bold">Vídeo não encontrado</h1>
        <p className="text-muted-foreground">O vídeo que você está procurando não existe ou foi removido.</p>
        <p className="text-xs text-muted-foreground/50 font-mono">ID: {id}</p>
      </div>
    );
  }

  // Mock e cast de dados para evitar quebras na UI
  const videoData = {
    ...data,
    channel: { name: 'Desconhecido', avatar_url: '' }, // Fallback para channel
    channel_name: 'Desconhecido', // Fallback plano
  } as unknown as Video;

  return <WatchView video={videoData} />;
}
