"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/context/GamificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Coins, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LootboxResult {
  type: 'credit' | 'item';
  value: string | number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  name?: string;
  isDuplicate?: boolean;
}

export function LootboxOpeningModal({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { stats, refreshStats } = useGamification();
  const [isOpening, setIsOpening] = useState(false);
  const [result, setResult] = useState<LootboxResult | null>(null);

  const handleOpenBox = async () => {
    if (!stats || stats.points < 500) {
      toast.error("Saldo insuficiente!");
      return;
    }

    setIsOpening(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('buy-lootbox');
      if (error) throw error;

      // Simulamos um delay para a animação de "suspense"
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult(data.reward);
      refreshStats();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao abrir caixa.";
      toast.error(message);
      onOpenChange(false);
    } finally {
      setIsOpening(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
      case 'epic': return 'text-purple-500 bg-purple-500/10 border-purple-500/50';
      case 'rare': return 'text-blue-500 bg-blue-500/10 border-blue-500/50';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isOpening && onOpenChange(open)}>
      <DialogContent className="max-w-md glass-panel-matte border-white/20 rounded-[3rem] p-0 overflow-hidden shadow-2xl">
        <div className="p-10 flex flex-col items-center text-center space-y-8">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="opening"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="space-y-8 w-full"
              >
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <motion.div
                    animate={isOpening ? { 
                      rotate: [0, -10, 10, -10, 10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="relative z-10 text-primary will-change-transform"
                  >
                    <Box size={80} strokeWidth={1.5} />
                  </motion.div>
                  {isOpening && (
                    <motion.div 
                      className="absolute inset-0 bg-primary/20 blur-3xl rounded-full will-change-transform"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight">AmaroBox</h2>
                  <p className="text-sm font-medium opacity-60">Contém itens raros, épicos e lendários.</p>
                </div>

                <Button 
                  onClick={handleOpenBox} 
                  disabled={isOpening}
                  className="w-full h-16 rounded-2xl font-black text-xl neo-button bg-primary text-white shadow-lg shadow-primary/20"
                >
                  {isOpening ? <Loader2 className="animate-spin mr-2" /> : <Coins className="mr-2" />}
                  {isOpening ? 'Sorteando...' : 'Abrir (500 C$)'}
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="space-y-8 w-full"
              >
                <div className={cn(
                  "mx-auto w-24 h-24 rounded-3xl border-2 flex items-center justify-center shadow-2xl relative",
                  getRarityColor(result.rarity)
                )}>
                  {result.type === 'credit' && !result.isDuplicate ? <Coins size={40} /> : <Trophy size={40} />}
                  <motion.div 
                    className="absolute -inset-4 opacity-30 blur-xl rounded-full bg-current will-change-transform"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>

                <div className="space-y-2">
                  <div className={cn(
                    "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-2",
                    getRarityColor(result.rarity)
                  )}>
                    {result.rarity}
                  </div>
                  
                  {result.isDuplicate ? (
                    <>
                      <h3 className="text-2xl font-black tracking-tight opacity-60 line-through mb-1">{result.name}</h3>
                      <h3 className="text-5xl font-black tracking-tight text-primary">+{result.value} C$</h3>
                    </>
                  ) : (
                    <h3 className="text-4xl font-black tracking-tight">
                      {result.type === 'credit' ? `+${result.value} Créditos` : result.name}
                    </h3>
                  )}
                  
                  {result.isDuplicate && (
                    <p className="text-orange-500 font-bold text-xs uppercase tracking-tighter mt-4">
                      Item repetido! Recebeu reembolso de 50%.
                    </p>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    onClick={() => setResult(null)} 
                    variant="outline"
                    className="flex-1 h-14 rounded-2xl font-bold border-white/10"
                  >
                    Tentar Novamente
                  </Button>
                  <Button 
                    onClick={() => onOpenChange(false)} 
                    className="flex-1 h-14 rounded-2xl font-black bg-white text-black"
                  >
                    Fechar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
