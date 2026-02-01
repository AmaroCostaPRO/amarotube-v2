"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Coins,
  CheckCircle2,
  MousePointer2,
  Type,
  Image as ImageIcon,
  LayoutGrid,
  Circle,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LootboxOpeningModal } from './LootboxOpeningModal';
import { GamificationStats, StoreReward } from '@/types';

interface StoreTabProps {
  stats: GamificationStats | null;
  rewards: StoreReward[];
  onUnlock: (reward: StoreReward) => void;
  onUse: (reward: StoreReward) => void;
}

type CategoryType = 'all' | 'box' | 'border' | 'cursor' | 'wallpaper' | 'name_color';

const TYPE_PRIORITY: Record<string, number> = {
  'box': 0,
  'border': 1,
  'cursor': 2,
  'wallpaper': 3,
  'name_color': 4
};

export function StoreTab({ stats, rewards, onUnlock, onUse }: StoreTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);

  const isUnlocked = (rewardId: string) => stats?.unlocked_items?.includes(rewardId) || false;

  const categories = [
    { id: 'all', label: 'Tudo', icon: LayoutGrid },
    { id: 'box', label: 'AmaroBox', icon: Box },
    { id: 'border', label: 'Bordas', icon: Circle },
    { id: 'cursor', label: 'Ponteiros', icon: MousePointer2 },
    { id: 'wallpaper', label: 'Fundos', icon: ImageIcon },
    { id: 'name_color', label: 'Identidade', icon: Type },
  ];

  // Filtramos os itens lendários exclusivos que não devem ser comprados diretamente
  const EXCLUSIVE_ITEMS = ['wallpaper_aurora_realistic', 'cursor_fluid_trail'];

  const filteredRewards = rewards
    .filter(r => !EXCLUSIVE_ITEMS.includes(r.id))
    .filter(r => selectedCategory === 'all' || r.type === selectedCategory)
    .sort((a, b) => {
      if (selectedCategory === 'all') {
        const priorityA = TYPE_PRIORITY[a.type] || 99;
        const priorityB = TYPE_PRIORITY[b.type] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
      }
      return a.cost - b.cost;
    });

  return (
    <div className="space-y-10 transition-none">
      <LootboxOpeningModal isOpen={isBoxModalOpen} onOpenChange={setIsBoxModalOpen} />

      {/* Seletor de Categorias */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 p-1.5 glass-panel rounded-xl shadow-xl transition-none border-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as CategoryType)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
            )}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-none pb-10">
        {/* Card Especial da AmaroBox */}
        {(selectedCategory === 'all' || selectedCategory === 'box') && (
          <Card
            className="glass-panel rounded-xl sm:rounded-[2.5rem] overflow-hidden border-none transition-all duration-500 flex flex-col group bg-primary/10 border-primary/20 ring-2 ring-primary/20 shadow-2xl relative"
          >
            <div className="absolute top-4 left-4 z-20">
              <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">Novo</div>
            </div>
            <div className="relative h-44 w-full flex items-center justify-center bg-primary/5 overflow-hidden">
              <Box size={80} className="text-primary transition-transform group-hover:scale-110 duration-500" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            <CardContent className="p-6 flex flex-col flex-1 gap-4">
              <div className="space-y-1">
                <h4 className="font-black text-xl leading-tight">AmaroBox</h4>
                <p className="text-[10px] uppercase font-black opacity-40 tracking-[0.2em]">Lootbox Misteriosa</p>
              </div>
              <p className="text-xs font-medium opacity-70 leading-relaxed">Ganhe itens lendários, épicos ou jackpots de créditos.</p>
              <div className="mt-auto">
                <Button
                  onClick={() => setIsBoxModalOpen(true)}
                  className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest neo-button bg-primary text-white"
                >
                  <Coins className="mr-2 h-4 w-4" /> 500 C$ para Abrir
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredRewards.map((reward) => {
          const unlocked = isUnlocked(reward.id);
          const canAfford = (stats?.points || 0) >= reward.cost;

          return (
            <Card
              key={reward.id}
              className={cn(
                "glass-panel rounded-xl sm:rounded-[2.5rem] overflow-hidden border-none transition-all duration-500 flex flex-col group",
                unlocked ? "opacity-95 hover:opacity-100" : "hover:scale-[1.03] hover:shadow-2xl"
              )}
            >
              <div className="relative h-44 w-full flex items-center justify-center transition-none overflow-hidden bg-black/5 dark:bg-white/5">
                {reward.type === 'wallpaper' ? (
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110" style={{ background: reward.value, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                ) : reward.type === 'border' ? (
                  <div className="h-24 w-24 rounded-full p-1.5 transition-transform group-hover:rotate-12 duration-500 shadow-2xl" style={{ background: reward.value }}>
                    <div className="h-full w-full rounded-full bg-background" />
                  </div>
                ) : reward.type === 'cursor' ? (
                  <MousePointer2 className="h-16 w-16 transition-transform group-hover:-translate-y-2 duration-500" style={{ color: reward.value }} fill="currentColor" />
                ) : (
                  <div className="flex flex-col items-center gap-2 transition-transform group-hover:scale-110 duration-500">
                    <Type size={48} style={{ color: reward.value }} className="drop-shadow-lg" />
                  </div>
                )}

                <div className="absolute top-4 right-4 z-10">
                  {unlocked ? (
                    <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : (
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm shadow-xl transition-colors",
                      canAfford ? "bg-primary text-white" : "bg-black/40 text-white/40 backdrop-blur-md"
                    )}>
                      <Coins size={14} />
                      {reward.cost}
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-6 flex flex-col flex-1 gap-4 transition-none">
                <div className="space-y-1 transition-none">
                  <h4 className="font-black text-lg leading-tight truncate">{reward.name}</h4>
                  <p className="text-[10px] uppercase font-black opacity-30 tracking-[0.2em] transition-none">
                    {reward.type === 'cursor' ? 'Cursor Customizado' :
                      reward.type === 'border' ? 'Borda de Perfil' :
                        reward.type === 'name_color' ? 'Estilo de Nome' : 'Papel de Parede'}
                  </p>
                </div>

                <div className="mt-auto transition-none">
                  {unlocked ? (
                    <Button
                      onClick={() => onUse(reward)}
                      className="w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-white text-black hover:bg-white/90 border-none shadow-lg"
                    >
                      Equipar Agora
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onUnlock(reward)}
                      disabled={!canAfford}
                      className="w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest neo-button"
                    >
                      {canAfford ? 'Comprar Item' : 'Pontos Insuficientes'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
