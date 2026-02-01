import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, CheckCircle2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { useGamification } from '@/context/GamificationContext';

const STORE_ITEMS = [
  { id: 'border_gold', name: 'Borda Dourada', price: 500, description: 'Destaque seu perfil com uma borda luxuosa.', style: 'linear-gradient(45deg, #ffd700, #ff8c00)' },
  { id: 'border_yellow', name: 'Borda Amarela', price: 400, description: 'Um brilho solar para seu avatar.', style: 'linear-gradient(45deg, #facc15, #f59e0b)' },
  { id: 'border_neon', name: 'Borda Neon', price: 800, description: 'Um brilho futurista para o seu avatar.', style: 'linear-gradient(45deg, #00f2fe, #4facfe)' },
  { id: 'border_fire', name: 'Borda de Fogo', price: 1200, description: 'Intensidade pura em volta do seu perfil.', style: 'linear-gradient(45deg, #f093fb, #f5576c)' },
  { id: 'border_emerald', name: 'Borda Esmeralda', price: 1500, description: 'Elegância e poder da natureza.', style: 'linear-gradient(45deg, #43e97b, #38f9d7)' },
];

export function GamificationStore() {
  const { user } = useAuth();
  const { setAvatarBorder, avatarBorder } = useTheme();
  const { stats, unlockItem, refreshStats } = useGamification();
  const [isBuying, setIsBuying] = useState<string | null>(null);

  const buyItem = async (item: typeof STORE_ITEMS[0]) => {
    if (!user) return toast.error("Faça login para comprar.");
    
    setIsBuying(item.id);
    try {
      // Use centralized secure unlock method from context
      const success = await unlockItem(item.id, item.price);
      if (success) {
        // Automatically equip the new item
        await equipItem(item.style);
      }
    } catch (err) { 
      toast.error("Falha na compra."); 
    } finally { 
      setIsBuying(null); 
    }
  };

  const equipItem = async (style: string) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ avatar_border: style }).eq('id', user.id);
    if (!error) { 
      setAvatarBorder(style); 
      toast.success("Borda equipada!"); 
    }
  };

  const points = stats?.points || 0;
  const unlockedItems = stats?.unlocked_items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-primary h-6 w-6" />
          <h2 className="text-2xl font-black tracking-tight">Loja de Itens</h2>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-2xl">
          <Coins className="h-4 w-4 text-primary" />
          <span className="font-black text-primary">{points} Pontos</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STORE_ITEMS.map((item) => {
          const isUnlocked = unlockedItems.includes(item.id);
          const isEquipped = avatarBorder === item.style;
          return (
            <Card key={item.id} className="glass-panel border-none rounded-[2rem] overflow-hidden flex flex-col group shadow-xl transition-none">
              <div className="h-32 flex items-center justify-center bg-black/5 dark:bg-white/5 relative transition-none">
                <div className="w-16 h-16 rounded-full border-4 transition-none" style={{ background: item.style }} />
                {!isUnlocked && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full text-[10px] font-black transition-none">
                    <Coins size={10} /> {item.price}
                  </div>
                )}
              </div>
              <CardContent className="p-4 flex flex-col flex-1 transition-none">
                <h3 className="font-black text-sm mb-1 transition-none">{item.name}</h3>
                <p className="text-[10px] opacity-50 mb-4 line-clamp-2 transition-none">{item.description}</p>
                <div className="mt-auto transition-none">
                  {isUnlocked ? (
                    <Button 
                      variant={isEquipped ? "secondary" : "default"} 
                      onClick={() => equipItem(item.style)} 
                      className="w-full h-9 rounded-xl text-[10px] font-black uppercase transition-none"
                    >
                      {isEquipped ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Equipado</> : "Equipar"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => buyItem(item)} 
                      disabled={!!isBuying} 
                      className="w-full h-9 rounded-xl text-[10px] font-black uppercase neo-button transition-none"
                    >
                      {isBuying === item.id ? "Processando..." : "Comprar"}
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