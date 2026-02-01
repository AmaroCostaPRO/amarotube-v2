"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoteControlsProps {
  targetId: string;
  targetType: 'post' | 'comment';
  initialScore: number;
  initialUserVote: number;
  orientation?: 'vertical' | 'horizontal';
}

export function VoteControls({ targetId, targetType, initialScore, initialUserVote, orientation = 'vertical' }: VoteControlsProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (type: 1 | -1) => {
    if (!user) {
      toast.error('Você precisa estar logado para votar.');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    const newVote = userVote === type ? 0 : type;
    const diff = newVote - userVote;

    // Update UI optimistically
    setUserVote(newVote);
    setScore(prev => prev + diff);

    try {
      if (newVote === 0) {
        await supabase.from('forum_votes').delete().match({ user_id: user.id, target_id: targetId });
      } else {
        await supabase.from('forum_votes').upsert({
          user_id: user.id,
          target_id: targetId,
          target_type: targetType,
          vote_type: newVote
        });
      }
    } catch (err) {
      setUserVote(userVote);
      setScore(score);
      toast.error('Erro ao registrar voto.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={cn("flex items-center gap-1 transition-none", orientation === 'vertical' ? 'flex-col' : 'flex-row')}>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 hover:bg-orange-500/10 hover:text-orange-500 transition-none", userVote === 1 && "text-orange-500")}
        onClick={() => handleVote(1)}
      >
        <ArrowBigUp className={cn("h-6 w-6 transition-none", userVote === 1 && "fill-current")} />
      </Button>
      
      <span className={cn("text-xs font-black min-w-[20px] text-center transition-none", 
        userVote === 1 ? "text-orange-500" : userVote === -1 ? "text-blue-500" : "text-muted-foreground"
      )}>
        {score}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500 transition-none", userVote === -1 && "text-blue-500")}
        onClick={() => handleVote(-1)}
      >
        <ArrowBigDown className={cn("h-6 w-6 transition-none", userVote === -1 && "fill-current")} />
      </Button>
    </div>
  );
}
