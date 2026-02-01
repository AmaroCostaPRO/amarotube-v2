"use client";

import React from 'react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, MousePointer2, CheckCircle2, Upload, Loader2, Trash2, ShoppingBag, Type, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GamificationStats, StoreReward } from '@/types';
import { WallpaperState } from '@/context/ThemeContext';

const wallpapersPresets = [
  { name: 'Default', value: 'default' },
  { name: 'Arctic', value: 'linear-gradient(to bottom, #e0f2fe, #bae6fd)' },
  { name: 'Aurora', value: 'linear-gradient(to bottom right, #6a11cb, #2575fc)' },
  { name: 'Pastel', value: 'linear-gradient(to bottom right, #ff9a9e, #fad0c4)' },
  { name: 'Night', value: 'linear-gradient(to bottom right, #0f172a, #334155)' },
  { name: 'Energy', value: 'linear-gradient(to bottom right, #f093fb, #f5576c)' },
];

interface CustomizeTabProps {
  wallpaper: WallpaperState;
  setWallpaper: (val: string) => void;
  // addCustomWallpaper: (url: string) => void; // Removed - handled in parent via state update but usage here was direct in legacy? No, parent manages state.
  // Actually legacy passed addCustomWallpaper but it was only used in parent's handleWallpaperUpload usually.
  // Wait, legacy CustomizeTab used `removeCustomWallpaper` directly.
  removeCustomWallpaper: (url: string) => void;
  showCursor: boolean;
  setShowCursor: (val: boolean) => void;
  pointerColor: string;
  setPointerColor: (val: string) => void;
  avatarBorder: string;
  setAvatarBorder: (val: string) => void;
  stats: GamificationStats | null;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rewards: StoreReward[];
}

export function CustomizeTab({
  wallpaper, setWallpaper, removeCustomWallpaper, showCursor, setShowCursor,
  pointerColor, setPointerColor, avatarBorder, setAvatarBorder, stats,
  isUploading, handleFileUpload, rewards
}: CustomizeTabProps) {
  const { session, user, profile, refreshProfile } = useAuth();
  const isUnlocked = (rewardId: string) => stats?.unlocked_items?.includes(rewardId) || false;
  const sectionHeader = "text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 block";

  const purchasedWallpapers = rewards.filter(r => r.type === 'wallpaper' && isUnlocked(r.id));
  const purchasedNameColors = rewards.filter(r => r.type === 'name_color' && isUnlocked(r.id));

  const hasAurora = isUnlocked('wallpaper_aurora_realistic');
  const hasFluidTrail = isUnlocked('cursor_fluid_trail');

  const handleEquipNameColor = async (color: string) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ name_color: color }).eq('id', user.id);
    if (!error) {
      toast.success('Cor equipada!');
      await refreshProfile();
    }
  };

  const itemBoxClasses = "bg-black/[0.06] dark:bg-white/10 shadow-inner transition-all";

  return (
    <div className={cn(
      "grid grid-cols-1 gap-8 items-start transition-none",
      session ? "lg:grid-cols-[2fr_minmax(320px,1fr)]" : "max-w-2xl mx-auto"
    )}>
      <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-4 sm:p-8 space-y-10 transition-none shadow-xl">
        <div className="space-y-2 transition-none">
          <div className="flex items-center gap-2 transition-none"><ImageIcon className="w-5 h-5 text-primary transition-none" /><CardTitle className="text-2xl font-black transition-none">Ambiente</CardTitle></div>
          <CardDescription className="transition-none">Escolha um fundo visual para sua navegação.</CardDescription>
        </div>

        <div className="transition-none">
          <Label className={sectionHeader}>Presets de Fundo</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 transition-none">
            {wallpapersPresets.map((wp) => (
              <button
                key={wp.name}
                onClick={() => setWallpaper(wp.value)}
                aria-label={`Selecionar papel de parede ${wp.name}`}
                className={cn("aspect-video rounded-xl sm:rounded-2xl border-2 transition-all relative overflow-hidden group", wallpaper.selected === wp.value ? "border-primary scale-105 shadow-xl shadow-primary/20" : "border-white/5 opacity-60 hover:opacity-100")}
                style={{ background: wp.value === 'default' ? '#2d2e32' : wp.value }}
              >
                {wallpaper.selected === wp.value && <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>}
              </button>
            ))}
          </div>
        </div>

        <div className="transition-none pt-6 border-t border-white/5">
          <Label className={sectionHeader}>Papéis de Parede Animados</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 transition-none">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <button
                      onClick={() => hasAurora && setWallpaper('shader_aurora')}
                      disabled={!hasAurora}
                      aria-label="Selecionar Aurora Realista Animada"
                      className={cn(
                        "aspect-video rounded-xl sm:rounded-2xl border-2 transition-all relative overflow-hidden group flex flex-col items-center justify-center gap-2 w-full",
                        wallpaper.selected === 'shader_aurora' ? "border-primary scale-105 shadow-xl shadow-primary/20 bg-primary/10" : "border-white/5 bg-black/40 hover:opacity-100",
                        !hasAurora && "opacity-30 grayscale cursor-not-allowed"
                      )}
                    >
                      {hasAurora ? <Sparkles className={cn("h-6 w-6", wallpaper.selected === 'shader_aurora' ? "text-primary" : "text-white")} /> : <Lock className="h-6 w-6" />}
                      <span className="text-[10px] font-black uppercase tracking-tighter">Aurora Realista</span>
                      {wallpaper.selected === 'shader_aurora' && <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>}
                    </button>
                  </div>
                </TooltipTrigger>
                {!hasAurora && (
                  <TooltipContent className="bg-white border-zinc-200 shadow-xl p-3 rounded-xl z-[150]">
                    <p className="font-bold text-xs text-black">Exclusivo: Ganhe na AmaroBox</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {session && purchasedWallpapers.length > 0 && (
          <div className="transition-none pt-6 border-t border-white/5">
            <Label className={sectionHeader}>Sua Coleção (Adquiridos)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 transition-none">
              {purchasedWallpapers.filter(r => r.id !== 'wallpaper_aurora_realistic').map((r) => (
                <button
                  key={r.id}
                  onClick={() => setWallpaper(r.value)}
                  aria-label={`Selecionar fundo adquirido: ${r.name}`}
                  className={cn("aspect-video rounded-xl sm:rounded-2xl border-2 transition-all relative overflow-hidden group", wallpaper.selected === r.value ? "border-primary scale-105 shadow-xl" : "border-white/5 opacity-60 hover:opacity-100")}
                  style={{ background: r.value, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ShoppingBag className="text-white h-5 w-5" />
                  </div>
                  {wallpaper.selected === r.value && <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {session && (
          <div className="transition-none pt-6 border-t border-white/5">
            <Label className={sectionHeader}>Seus Uploads</Label>
            <div className="grid grid-cols-3 gap-4 transition-none">
              {wallpaper.custom.map((url: string) => (
                <div key={url} className="relative group transition-none">
                  <button
                    onClick={() => setWallpaper(url)}
                    aria-label="Selecionar upload personalizado"
                    className={cn("aspect-video rounded-xl sm:rounded-2xl border-2 transition-all overflow-hidden w-full", wallpaper.selected === url ? "border-primary scale-105" : "border-white/5 opacity-60 hover:opacity-100")}
                  >
                    <img src={url} className="w-full h-full object-cover" alt="Papel de parede personalizado" />
                  </button>
                  <Button size="icon" variant="destructive" aria-label="Remover este upload" className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeCustomWallpaper(url)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {wallpaper.custom.length < 6 && (
                <Label
                  htmlFor="wp-upload-tab"
                  aria-label="Fazer upload de papel de parede personalizado"
                  className="aspect-video rounded-xl sm:rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-white/5 transition-all"
                >
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 opacity-30" />}
                </Label>
              )}
              <input id="wp-upload-tab" type="file" accept="image/*" hidden onChange={handleFileUpload} disabled={isUploading} />
            </div>
          </div>
        )}
      </Card>

      {session && (
        <Card className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-4 sm:p-8 space-y-10 transition-none shadow-xl">
          <div className="space-y-2 transition-none">
            <div className="flex items-center gap-2 transition-none"><MousePointer2 className="w-5 h-5 text-primary transition-none" /><CardTitle className="text-2xl font-black transition-none">Interatividade</CardTitle></div>
            <CardDescription className="transition-none">Customização do cursor e identidade.</CardDescription>
          </div>

          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center justify-between p-6 rounded-xl sm:rounded-3xl border transition-all shadow-inner",
                    itemBoxClasses,
                    !hasFluidTrail ? "opacity-40 grayscale border-black/5 dark:border-white/5" : "border-black/10 dark:border-white/20"
                  )}>
                    <div className="space-y-0.5 transition-none">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="fluid-trail-switch" className="font-black text-sm transition-none text-foreground">Rastro de Fluido</Label>
                        {!hasFluidTrail && <Lock size={12} className="text-primary" />}
                      </div>
                      <p className="text-[10px] opacity-60 uppercase font-black transition-none text-foreground">Efeito Splash ao mover o mouse.</p>
                    </div>
                    <Switch
                      id="fluid-trail-switch"
                      aria-label="Ativar efeito visual de fluido no cursor"
                      checked={showCursor}
                      onCheckedChange={(v) => hasFluidTrail && setShowCursor(v)}
                      disabled={!hasFluidTrail}
                    />
                  </div>
                </TooltipTrigger>
                {!hasFluidTrail && (
                  <TooltipContent className="bg-white border-zinc-200 shadow-xl p-3 rounded-xl z-[150]">
                    <p className="font-bold text-xs text-black">Exclusivo: Ganhe na AmaroBox</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="transition-none pt-4">
            <Label className={sectionHeader}>Cores de Nome</Label>
            <div className="flex flex-wrap gap-3 transition-none">
              <button
                onClick={() => handleEquipNameColor('')}
                aria-label="Remover cor personalizada do nome"
                className={cn(
                  "h-11 w-11 rounded-xl transition-all flex items-center justify-center shadow-inner",
                  itemBoxClasses,
                  !profile?.name_color
                    ? "border-2 border-white scale-110 shadow-lg shadow-primary/20 bg-primary/10 opacity-100"
                    : "border border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Type size={18} />
              </button>
              {purchasedNameColors.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleEquipNameColor(r.value)}
                  aria-label={`Usar cor de nome: ${r.name}`}
                  className={cn(
                    "h-11 w-11 rounded-xl transition-all flex items-center justify-center shadow-inner",
                    itemBoxClasses,
                    profile?.name_color === r.value
                      ? "border-2 border-white scale-110 shadow-lg opacity-100"
                      : "border border-transparent opacity-70 hover:opacity-100"
                  )}
                  style={{ color: r.value }}
                >
                  <Type size={18} stroke="currentColor" fill={profile?.name_color === r.value ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="transition-none pt-4">
            <Label className={sectionHeader}>Ponteiros Adquiridos</Label>
            <div className="flex flex-wrap gap-4 transition-none">
              <button
                aria-label="Usar ponteiro padrão"
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-inner",
                  itemBoxClasses,
                  pointerColor === 'default'
                    ? "border-2 border-white scale-110 shadow-lg opacity-100"
                    : "border border-transparent opacity-70 hover:opacity-100"
                )}
                onClick={() => setPointerColor('default')}
              >
                <MousePointer2 size={18} />
              </button>
              {rewards.filter(r => r.type === 'cursor' && isUnlocked(r.id) && r.id !== 'cursor_fluid_trail').map(r => (
                <button
                  key={r.id}
                  aria-label={`Usar ponteiro: ${r.name}`}
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-inner",
                    itemBoxClasses,
                    pointerColor === r.value
                      ? "border-2 border-white scale-110 shadow-lg opacity-100"
                      : "border border-transparent opacity-70 hover:opacity-100"
                  )}
                  style={{ color: r.value }}
                  onClick={() => setPointerColor(r.value)}
                >
                  <MousePointer2 size={18} fill="currentColor" />
                </button>
              ))}
            </div>
          </div>

          <div className="transition-none pt-4">
            <Label className={sectionHeader}>Bordas Adquiridas</Label>
            <div className="flex flex-wrap gap-4 transition-none">
              <button
                aria-label="Remover borda de perfil"
                className={cn(
                  "h-11 w-11 rounded-full border flex items-center justify-center shadow-inner transition-all",
                  itemBoxClasses,
                  avatarBorder === 'transparent'
                    ? "border-2 border-white scale-110 shadow-lg"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
                onClick={() => setAvatarBorder('transparent')}
              >
                <Trash2 size={16} />
              </button>
              {rewards.filter(r => r.type === 'border' && isUnlocked(r.id)).map(r => (
                <button key={r.id} aria-label={`Usar borda: ${r.name}`} className={cn("h-12 w-12 rounded-full p-1 transition-all", avatarBorder === r.value ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110 shadow-lg" : "opacity-80 hover:opacity-100")} style={{ background: r.value }} onClick={() => setAvatarBorder(r.value)}>
                  <div className="h-full w-full rounded-full bg-white dark:bg-slate-900" />
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
