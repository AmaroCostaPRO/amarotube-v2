"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Calendar, LogOut, Eye, Flame, Heart, ThumbsUp, ShieldCheck, Globe, MessageSquare, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Profile, GamificationStats } from '@/types';
import { User } from '@supabase/supabase-js';

interface ProfileTabProps {
  user: User | null;
  profile: Profile | null;
  stats: GamificationStats | null;
  newUsername: string;
  setNewUsername: (val: string) => void;
  handleUpdateUsername: () => void;
  isSavingUsername: boolean;
  handleSignOut: () => void;
  onUpdatePrivacy: (key: string, value: boolean) => void;
}

export function ProfileTab({
  user, profile, stats, newUsername, setNewUsername, handleUpdateUsername,
  isSavingUsername, handleSignOut, onUpdatePrivacy
}: ProfileTabProps) {
  const privacyItemClass = "flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5";

  return (
    <div className="space-y-8 transition-none">
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-stretch transition-none">
        <Card className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 space-y-8 flex flex-col h-full transition-none shadow-xl">
          <CardHeader className="p-0 transition-none">
            <CardTitle className="text-3xl font-black tracking-tight transition-none">Dados Pessoais</CardTitle>
          </CardHeader>
          <div className="space-y-8 flex-1 transition-none">
            <div className="space-y-2 transition-none">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary transition-none">E-mail Principal</Label>
              <p className="font-black text-xl truncate opacity-90 transition-none">{user?.email}</p>
            </div>
            <div className="space-y-2 transition-none">
              <Label htmlFor="username-input" className="text-[10px] font-black uppercase tracking-widest text-primary transition-none">Identidade Digital</Label>
              <div className="flex gap-2 transition-none">
                <Input
                  id="username-input"
                  name="username-update"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="h-14 rounded-2xl bg-black/5 dark:bg-white/5 border-none shadow-inner font-bold text-lg transition-none"
                />
                <Button onClick={handleUpdateUsername} disabled={isSavingUsername || !newUsername.trim() || newUsername === profile?.username} className="h-14 w-14 rounded-2xl neo-button p-0 transition-none">
                  {isSavingUsername ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                </Button>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 space-y-2 transition-none">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 transition-none">Data de Ingresso</Label>
              <div className="flex items-center gap-2 font-bold opacity-80 transition-none">
                <Calendar size={14} className="text-primary transition-none" />
                {profile?.created_at ? format(new Date(profile.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Janeiro de 2025'}
              </div>
            </div>
          </div>
          <Button variant="destructive" className="w-full h-16 rounded-3xl gap-3 font-black text-lg shadow-lg shadow-destructive/20 mt-8 transition-none" onClick={handleSignOut}>
            <LogOut className="h-6 w-6 transition-none" /> Encerrar Sessão
          </Button>
        </Card>

        <Card className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 flex flex-col h-full transition-none shadow-xl">
          <CardHeader className="p-0 mb-8 transition-none">
            <CardTitle className="text-3xl font-black tracking-tight transition-none">Métricas de Engajamento</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 transition-none">
            <StatCard title="Vídeos Vistos" value={stats?.total_views || 0} icon={Eye} />
            <StatCard title="Combo Diário" value={stats?.daily_streak || 0} icon={Flame} color="text-orange-500" unit="dias" />
            <StatCard title="Likes Recebidos" value={stats?.received_likes || 0} icon={Heart} color="text-red-500" />
            <StatCard title="Likes Enviados" value={stats?.total_likes || 0} icon={ThumbsUp} color="text-primary" isAlt />
          </div>
        </Card>
      </div>

      <Card className="glass-panel rounded-xl sm:rounded-[2.5rem] p-8 shadow-xl border-none">
        <CardHeader className="p-0 mb-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary h-8 w-8" />
            <div>
              <CardTitle className="text-3xl font-black tracking-tight">Privacidade e Segurança</CardTitle>
              <CardDescription>Gerencie quem pode interagir com você e o que os outros veem no seu perfil.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={privacyItemClass}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Globe size={16} />
                <Label className="font-black text-sm uppercase tracking-tight">Perfil Público</Label>
              </div>
              <p className="text-[10px] font-bold opacity-40 uppercase">Exibir seus vídeos recomendados</p>
            </div>
            <Switch
              checked={profile?.is_content_public}
              onCheckedChange={(v) => onUpdatePrivacy('is_content_public', v)}
            />
          </div>

          <div className={privacyItemClass}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Award size={16} />
                <Label className="font-black text-sm uppercase tracking-tight">Badges Visíveis</Label>
              </div>
              <p className="text-[10px] font-bold opacity-40 uppercase">Exibir medalhas de conquista</p>
            </div>
            <Switch
              checked={profile?.is_badges_public}
              onCheckedChange={(v) => onUpdatePrivacy('is_badges_public', v)}
            />
          </div>

          <div className={privacyItemClass}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare size={16} />
                <Label className="font-black text-sm uppercase tracking-tight">Chat Aberto</Label>
              </div>
              <p className="text-[10px] font-bold opacity-40 uppercase">Receber DMs de desconhecidos</p>
            </div>
            <Switch
              checked={profile?.allow_stranger_messages}
              onCheckedChange={(v) => onUpdatePrivacy('allow_stranger_messages', v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  unit?: string;
  isAlt?: boolean;
}

function StatCard({ title, value, icon: Icon, color = "text-foreground", unit = "", isAlt = false }: StatCardProps) {
  return (
    <div className={cn("glass-panel border-none p-8 rounded-xl sm:rounded-[2.5rem] relative overflow-hidden bg-white/5 group shadow-inner transition-none", isAlt && "bg-primary/5")}>
      <div className="relative z-10 transition-none">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 transition-none">{title}</p>
        <p className={cn("text-6xl font-black tracking-tighter transition-none", color)}>
          {value} {unit && <span className="text-2xl opacity-60">{unit}</span>}
        </p>
      </div>
      <Icon className={cn("absolute right-6 top-1/2 -translate-y-1/2 h-24 w-24 opacity-10 -rotate-12 group-hover:opacity-20 transition-opacity", color)} />
    </div>
  );
}
