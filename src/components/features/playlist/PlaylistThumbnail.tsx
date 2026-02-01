import React from 'react';
import { ListVideo } from 'lucide-react';

interface PlaylistThumbnailProps {
  thumbnails: string[];
  playlistTitle: string;
}

export function PlaylistThumbnail({ thumbnails, playlistTitle }: PlaylistThumbnailProps) {
  const count = thumbnails.length;

  if (count === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <ListVideo className="h-12 w-12 text-muted-foreground" />
      </div>
    );
  }

  if (count === 1) {
    return <img src={thumbnails[0]} alt={playlistTitle} className="w-full h-full object-cover" />;
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 h-full">
        <img src={thumbnails[0]} alt={playlistTitle} className="w-full h-full object-cover" />
        <img src={thumbnails[1]} alt={playlistTitle} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 h-full">
        <img src={thumbnails[0]} alt={playlistTitle} className="w-full h-full object-cover row-span-2" />
        <img src={thumbnails[1]} alt={playlistTitle} className="w-full h-full object-cover" />
        <img src={thumbnails[2]} alt={playlistTitle} className="w-full h-full object-cover" />
      </div>
    );
  }

  // count >= 4
  return (
    <div className="grid grid-cols-2 grid-rows-2 h-full">
      {thumbnails.slice(0, 4).map((url, index) => (
        <img key={index} src={url} alt={playlistTitle} className="w-full h-full object-cover" />
      ))}
    </div>
  );
}