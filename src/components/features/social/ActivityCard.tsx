import { Activity } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Film, ListVideo, MessageSquare } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
}

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  switch (type) {
    case 'new_video':
      return <Film className="h-5 w-5 text-primary" />;
    case 'new_playlist':
      return <ListVideo className="h-5 w-5 text-green-500" />;
    case 'new_comment':
      return <MessageSquare className="h-5 w-5 text-purple-500" />;
    default:
      return null;
  }
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const { profiles, type, metadata, created_at } = activity;
  const username = profiles?.username || 'Alguém';

  const renderMessage = () => {
    switch (type) {
      case 'new_video':
        return (
          <>
            <Link href={`/profile/${username}`} className="font-bold hover:underline">{username}</Link> adicionou o vídeo: <span className="font-semibold">{metadata.video_title}</span>
          </>
        );
      case 'new_playlist':
        return (
          <>
            <Link href={`/profile/${username}`} className="font-bold hover:underline">{username}</Link> criou a playlist: <span className="font-semibold">{metadata.playlist_title}</span>
          </>
        );
      case 'new_comment':
        return (
          <>
            <Link href={`/profile/${username}`} className="font-bold hover:underline">{username}</Link> comentou em um <Link href={`/watch/${metadata.video_id}`} className="font-semibold hover:underline">vídeo</Link>.
          </>
        );
      default:
        return 'Nova atividade.';
    }
  };

  return (
    <Card className="bg-card/[var(--component-bg-opacity)] backdrop-blur-md shadow-neo-outset rounded-2xl p-4 h-full flex flex-col justify-center" data-aos="fade-up">
      <CardContent className="p-0 flex items-center gap-4">
        <Link href={`/profile/${username}`}>
          <Avatar>
            <AvatarImage src={profiles?.avatar_url || ''} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <p className="text-sm">{renderMessage()}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <ActivityIcon type={type} />
            <span>{formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ptBR })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}