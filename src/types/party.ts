export interface WatchParty {
  id: string;
  video_id: string;
  host_id: string;
  playback_time: number;
  is_playing: boolean;
  status: 'active' | 'finished';
  created_at: string;
  last_sync_at: string;
}

export interface PartyMember {
  id: string;
  party_id: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export interface PartyMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
    name_color?: string;
  };
}