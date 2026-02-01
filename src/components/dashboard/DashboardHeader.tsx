"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Coins } from 'lucide-react';
import { Profile, GamificationStats } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface DashboardHeaderProps {
  profile: Profile | null;
  user: { email?: string } | null;
  stats: GamificationStats | null;
  avatarBorder: string;
  isUploadingAvatar: boolean;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingStats: boolean;
}

export function DashboardHeader({
  profile, user, stats, avatarBorder, isUploadingAvatar, handleAvatarUpload, isLoadingStats
}: DashboardHeaderProps) {
  const { session } = useAuth();

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center mb-6 sm:mb-10 p-3 sm:p-8 glass-panel rounded-xl sm:rounded-[2.5rem] transition-none shadow-2xl">
      <div className="relative group transition-none">
        {avatarBorder !== 'transparent' && (
          <div className="absolute -inset-2 rounded-full animate-pulse blur-sm opacity-50 transition-none" style={{ background: avatarBorder }} />
        )}
        <Avatar className="h-32 w-32 border-4 border-background relative z-10 transition-none">
          <AvatarImage src={profile?.avatar_url || ''} alt={`Foto de perfil de ${profile?.username || 'usuário'}`} className="transition-none" />
          <AvatarFallback className="text-4xl transition-none">{profile?.username?.[0]?.toUpperCase() || 'V'}</AvatarFallback>
        </Avatar>

        {session && (
          <>
            <Label
              htmlFor="avatar-upload"
              aria-label="Fazer upload de nova foto de perfil"
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer shadow-lg z-20 hover:scale-110 transition-transform"
            >
              {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </Label>
            <input id="avatar-upload" type="file" accept="image/*" hidden onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
          </>
        )}
      </div>
      <div className="flex-1 text-center md:text-left transition-none">
        <h1
          className="text-4xl font-black tracking-tight transition-none"
          style={{ color: profile?.name_color || 'inherit' }}
        >
          {profile?.username || 'Visitante'}
        </h1>
        <p className="text-muted-foreground font-medium transition-none">
          {session ? `@${user?.email?.split('@')[0]}` : 'Perfil de convidado'} · {stats?.daily_streak || 0} dias de ofensiva
        </p>
        <div className="flex justify-center md:justify-start gap-4 mt-6 transition-none">
          <div className="bg-primary/10 px-6 py-3 rounded-2xl flex items-center gap-2 border border-primary/20 transition-none shadow-sm">
            <Coins className="h-5 w-5 text-primary transition-none" />
            <span className="font-black text-xl text-primary transition-none">{isLoadingStats ? '...' : stats?.points || 0}</span>
            <span className="text-[10px] uppercase font-black opacity-40 ml-2 tracking-widest transition-none">Créditos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
