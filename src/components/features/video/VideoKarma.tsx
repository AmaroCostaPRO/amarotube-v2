"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoKarmaProps {
  videoId: string;
  initialScore: number;
}

export function VideoKarma({ videoId, initialScore }: VideoKarmaProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number>(0);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from('video_votes').select('vote_type').eq('video_id', videoId).eq('user_id', user.id).maybeSingle()
        .then(({ data }) => { if (data) setUserVote(data.vote_type); });
    }
  }, [videoId, user]);

  const handleVote = async (type: number) => {
    if (!user) return toast.error('Faça login para votar.');
    if (isVoting) return;

    setIsVoting(true);
    const newVote = userVote === type ? 0 : type;
    const diff = newVote - userVote;

    setScore(prev => prev + diff);
    setUserVote(newVote);

    try {
      if (newVote === 0) {
        await supabase.from('video_votes').delete().match({ user_id: user.id, video_id: videoId });
      } else {
        await supabase.from('video_votes').upsert({ user_id: user.id, video_id: videoId, vote_type: newVote });
      }
      await supabase.rpc('increment_video_karma', { p_video_id: videoId, p_diff: diff });
    } catch (err) {
      toast.error('Erro ao registrar voto.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center bg-black/10 dark:bg-white/5 rounded-xl px-1 py-1 shadow-inner transition-none">
      <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg hover:bg-orange-500/20 transition-none", userVote === 1 && "text-orange-500")} onClick={() => handleVote(1)}>
        <ArrowBigUp className={cn("h-6 w-6 transition-none", userVote === 1 && "fill-current")} />
      </Button>
      <span className={cn("text-xs font-black min-w-[24px] text-center transition-none", userVote === 1 ? "text-orange-500" : userVote === -1 ? "text-blue-500" : "opacity-40")}>
        {score}
      </span>
      <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg hover:bg-blue-500/20 transition-none", userVote === -1 && "text-blue-500")} onClick={() => handleVote(-1)}>
        <ArrowBigDown className={cn("h-6 w-6 transition-none", userVote === -1 && "fill-current")} />
      </Button>
    </div>
  );
}