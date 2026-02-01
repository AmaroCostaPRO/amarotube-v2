"use client";

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useVideoWatchedStatus(videoId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['video-watched', videoId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('video_views')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .limit(1);

      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!user && !!videoId,
    staleTime: 5 * 60 * 1000,
  });
}