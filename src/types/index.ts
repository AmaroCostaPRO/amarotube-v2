export interface Video {
  id: string;
  user_id: string;
  youtube_video_id: string;
  channel_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  channel_avatar_url: string | null;
  channel_description: string | null;
  created_at: string;
  last_accessed_at: string | null;
  profiles: { username: string | null; avatar_url: string | null; avatar_border?: string | null; name_color?: string | null } | null;
  is_from_channel_update: boolean;
  karma_score?: number;
  is_nsfw?: boolean;
  is_spoiler?: boolean;
  summary?: string | null;
  origin?: string;
  view_count?: number;
  views?: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_collaborative: boolean;
  user_id: string;
  video_count?: number;
  thumbnail_urls?: string[];
  username?: string | null;
  profiles?: { username: string | null; avatar_url: string | null; avatar_border?: string | null; name_color?: string | null } | null;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  video_id: string;
  parent_comment_id?: string | null;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    avatar_border?: string | null;
    name_color?: string | null;
  } | null;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  avatar_border: string | null;
  name_color: string | null;
  role: 'user' | 'admin' | null;
  updated_at: string | null;
  created_at?: string | null;
  is_shadowbanned?: boolean;
  is_approved: boolean | null;
  is_badges_public?: boolean;
  is_content_public?: boolean;
  allow_stranger_messages?: boolean;
}

export interface AdminMessage {
  id: string;
  created_at: string;
  content: string;
  is_read: boolean;
  user_id: string;
}

export interface Badge {
  badge_type: string;
  unlocked_at: string;
}

export interface Notification {
  id: string;
  is_read: boolean;
  created_at: string;
  type: 'new_comment' | 'new_like' | 'forum_reply' | 'new_member' | 'forum_vote' | 'mention';
  data: {
    video_id?: string;
    post_id?: string;
    target_id?: string;
    target_type?: string;
    community_id?: string;
    community_name?: string;
    comment_id?: string;
    commenter_username?: string;
    liker_username?: string;
    replier_username?: string;
    member_username?: string;
    voter_username?: string;
    author_username?: string;
  };
}

export interface GlobalChatMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
    avatar_border?: string | null;
    name_color?: string | null;
  } | null;
}

export interface Channel {
  id: string;
  user_id: string;
  youtube_channel_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  is_auto_feed_enabled: boolean; // Propriedade adicionada
}

export interface ChannelSearchResult {
  youtube_channel_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
}

export interface ChannelMetadata {
  id: string;
  user_id: string;
  youtube_channel_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  subscriber_count: number | null;
  view_count: number;
  video_count: number;
  is_auto_feed_enabled: boolean; // Propriedade adicionada
}

export type ActivityType = 'new_video' | 'new_playlist' | 'new_comment' | 'new_like' | 'new_channel';

export interface Activity {
  item_type: 'activity';
  id: string;
  created_at: string;
  user_id: string;
  type: ActivityType;
  metadata: {
    video_title?: string;
    playlist_title?: string;
    video_id?: string;
    comment_content?: string;
    thumbnail_url?: string;
    channel_name?: string;
  };
  profiles: {
    username: string | null;
    avatar_url: string | null;
    avatar_border?: string | null;
    name_color?: string | null;
  } | null;
}

export interface FeedVideo extends Video {
  item_type: 'video';
  view_count: number;
  like_count: number;
  is_liked_by_user: boolean;
  app_like_count: number;
  view_count_delta: number;
  like_count_delta: number;
}

export type FeedItem = FeedVideo | Activity;

export interface ViewHistoryItem {
  id: string;
  viewed_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
}

export interface LikeHistoryItem {
  id: string;
  created_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  } | null;
}

export interface GetHybridFeedParams {
  page_number: number;
  page_size: number;
  sort_mode: 'recent' | 'popular';
  search_term_param?: string | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface StoreReward {
  id: string;
  name: string;
  cost: number;
  type: string;
  value: string;
}

export interface GamificationStats {
  points: number;
  daily_streak: number;
  total_views: number;
  total_likes: number;
  received_likes: number;
  received_upvotes: number;
  total_logins: number;
  unlocked_items: string[];
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  friend?: Profile;
  requester?: Profile;
  profiles?: Profile;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  has_alert: boolean;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CalendarShare {
  id: string;
  owner_id: string;
  shared_with_id: string;
  share_type: 'full' | 'specific_day';
  target_date: string | null;
  owner?: { username: string | null; avatar_url: string | null } | null;
  shared_with?: { username: string | null; avatar_url: string | null } | null;
}

export interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_temporary: boolean;
  expires_at: string | null;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
  created_at: string;
  sender?: { username: string | null; avatar_url: string | null } | null;
  receiver?: { username: string | null; avatar_url: string | null } | null;
}

export interface ChatConversation {
  userId: string;
  user: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  lastMsg: PrivateMessage | { content: string };
}