"use client";

import React from 'react';
import { Heart, ShoppingBag, Zap, Shield, Star, Lock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HolographicBadge } from '@/components/ui/HolographicBadge';
import { BadgeDeck } from '@/components/ui/BadgeDeck';

interface UserBadgesProps {
  badges: string[];
  className?: string;
}

const BADGE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  'video_likes_10': { 
    label: 'Criador Popular', 
    icon: <Heart className="text-red-600" fill="currentColor" />, 
    color: '#FF9999' 
  },
  'forum_upvotes_10': { 
    label: 'Líder de Opinião', 
    icon: <Flame className="text-orange-600" fill="currentColor" />, 
    color: '#F97316' 
  },
  'store_collector': { 
    label: 'Colecionador', 
    icon: <ShoppingBag className="text-purple-700" fill="currentColor" />, 
    color: '#D8B4FE' 
  },
  'streak_7': { 
    label: 'Fiel à Causa', 
    icon: <Zap className="text-yellow-600" fill="currentColor" />, 
    color: '#FDE047' 
  },
  'total_logins_30': { 
    label: 'Veterano', 
    icon: <Shield className="text-zinc-700" fill="currentColor" />, 
    color: '#E4E4E7' 
  },
  'playlist_star_50': { 
    label: 'Curador Elite', 
    icon: <Star className="text-blue-600" fill="currentColor" />, 
    color: '#93C5FD' 
  },
};

export function UserBadges({ badges, className }: UserBadgesProps) {
  const allBadgeTypes = Object.keys(BADGE_CONFIG);

  return (
    <BadgeDeck className={className}>
      {allBadgeTypes.map((badgeType) => {
        const config = BADGE_CONFIG[badgeType];
        const isEarned = badges.includes(badgeType);

        return (
          <HolographicBadge
            key={badgeType}
            label={config.label}
            color={config.color}
            icon={isEarned ? config.icon : <Lock size={20} />}
            isLocked={!isEarned}
          />
        );
      })}
    </BadgeDeck>
  );
}