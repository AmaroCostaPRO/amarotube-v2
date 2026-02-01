import { supabase } from '@/integrations/supabase/client';
import { Video, Channel, ChannelSearchResult, ChannelMetadata } from '@/types';

export interface VideoDetails {
  id: string;
  user_id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  channel_name: string;
  channel_avatar_url: string;
  channel_description: string;
  created_at: string;
}

export interface SearchResult {
  youtube_video_id: string;
  channel_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  channel_name: string;
  channel_avatar_url: string;
  channel_description: string;
}

export interface LiveMetrics {
  view_count: number;
  like_count: number;
  comment_count: number;
}

export interface VideoContext {
  title: string;
  description: string;
  channel: string;
  content: string;
  hasTranscript: boolean;
}

class ApiService {
  private async callFunction<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
    try {
      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        body,
      });

      if (error) throw new Error(error.message);
      if (data && typeof data === 'object' && 'error' in data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((data as any).error);
      }

      return data as T;
    } catch (error: unknown) {
      console.error(`Error calling ${functionName}:`, error);
      throw error;
    }
  }

  async fetchVideoDetails(youtubeUrl: string): Promise<{ video: VideoDetails; message: string }> {
    return this.callFunction('fetch-youtube-video-details', { youtubeUrl });
  }

  async searchVideos(query: string): Promise<{ videos: SearchResult[] }> {
    return this.callFunction('search-youtube-videos', { query });
  }

  async fetchChannelMetadata(youtubeChannelId: string): Promise<ChannelMetadata> {
    const { data, error } = await supabase.rpc('get_channel_metadata', {
      p_youtube_channel_id: youtubeChannelId,
    }).single();

    if (error) throw new Error(error.message);
    return data as ChannelMetadata;
  }

  async fetchChannelDetails(channelId: string): Promise<{ title: string; description: string; thumbnail: string; banner: string | null }> {
    return this.callFunction('get-channel-details', { channelId });
  }

  async fetchLiveMetrics(videoId: string, youtubeVideoId: string): Promise<LiveMetrics> {
    return this.callFunction('get-live-metrics', {
      video_id: videoId,
      youtube_video_id: youtubeVideoId,
    });
  }

  async getVideoContext(videoUrl: string): Promise<VideoContext> {
    return this.callFunction<VideoContext>('get-video-context', { videoUrl });
  }

  async summarizeVideo(videoContext: VideoContext): Promise<{ summary: string }> {
    return this.callFunction('summarize-video', { videoContext });
  }

  async searchYoutubeChannels(query: string): Promise<{ channels: ChannelSearchResult[] }> {
    return this.callFunction('search-youtube-channels', { query });
  }

  async addChannelToDatabase(channelData: Omit<Channel, 'id' | 'created_at'>): Promise<Channel> {
    const { data, error } = await supabase
      .from('channels')
      .insert(channelData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Channel;
  }

  async fetchChannelVideos(channelId: string, maxResults: number = 5): Promise<{ videos: Video[] }> {
    const { data, error } = await supabase.rpc('get_videos_by_channel', {
      p_channel_id: channelId,
      p_limit: maxResults
    });

    if (error) throw error;
    return { videos: data as Video[] };
  }

  async syncSingleChannel(channelId: string): Promise<{ message: string }> {
    return this.callFunction('sync-single-channel-videos', { channelId });
  }
}

export const apiService = new ApiService();