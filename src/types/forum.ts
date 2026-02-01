import { Profile } from './index';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  owner_id: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface ForumPost {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  content: string | null;
  thumbnail_url: string | null;
  created_at: string;
  profiles: { username: string; avatar_url: string; name_color?: string } | null;
  communities: { id?: string; name: string; avatar_url: string; owner_id?: string } | null;
  vote_score?: number;
  user_vote?: number;
  comment_count?: number;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string; name_color?: string } | null;
  vote_score?: number;
  user_vote?: number;
  replies?: ForumComment[];
}