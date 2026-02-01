import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Trophy, Coins, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '7️⃣'];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ADICIONADO setBalance NAS PROPS
export const SlotMachine = ({ userBalance, setBalance, onBalanceUpdate }: { userBalance: number, setBalance: React.Dispatch<React.SetStateAction<number>>, onBalanceUpdate: () => void }) => {
  const [isGameActive, setIsGameActive] = useState(false);
  const [reelsSpinning, setReelsSpinning] = useState([false, false, false]);
  
  // Removemos localBalance e usamos userBalance direto
  
  const [result, setResult] = useState<string[]>(['❓', '❓', '❓']);
  const [winAmount, setWinAmount] = useState(0);
  const { toast } = useToast();
  const BET_AMOUNT = 100;

  const handleSpin = async () => {
    if (isGameActive) return;

    if (userBalance < BET_AMOUNT) {
      toast({ title: "Saldo Insuficiente", description: "Recarregue suas moedas!", variant: "destructive" });
      return;
    }

    // 1. Débito Visual Imediato (Header)
    setIsGameActive(true);
    setReelsSpinning([true, true, true]); 
    setWinAmount(0);
    setBalance((prev: number) => prev - BET_AMOUNT); // <--- AQUI A MÁGICA

    try {
      const { data, error } = await supabase.functions.invoke('play-slot-machine', { body: { betAmount: BET_AMOUNT } });
      if (error) throw error;

      setResult(data.result);

      await delay(2000);
      setReelsSpinning([false, true, true]);
      await delay(500);
      setReelsSpinning([false, false, true]);
      await delay(500);
      setReelsSpinning([false, false, false]);

      setWinAmount(data.payout);
      
      // Sincroniza se o backend mandar saldo novo, senao busca
      if (data.newBalance) setBalance(data.newBalance);
      else onBalanceUpdate();

      if (data.payout > 0) {
        await delay(200);
        toast({ title: "VITÓRIA! 🎉", description: `+${data.payout} Moedas!`, className: "bg-green-600 text-white border-none" });
      }

    } catch (error) {
      console.error('Erro no Slot:', error);
      toast({ title: "Erro", description: "Falha ao processar aposta.", variant: "destructive" });
      // Rollback
      setBalance((prev: number) => prev + BET_AMOUNT);
      setReelsSpinning([false, false, false]); 
    } finally {
      setIsGameActive(false);
    }
  };

  // ... (RESTO DO CÓDIGO DE RENDERIZAÇÃO IGUAL - MANTENHA O QUE JÁ TEM)
  // Certifique-se apenas que a função principal comece com a assinatura atualizada acima.
  return (
    <Card className="p-4 md:p-8 flex flex-col items-center gap-8 
      bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 
      border-4 border-slate-200 dark:border-slate-800 
      shadow-[0_10px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.7)]
      rounded-3xl w-full max-w-md mx-auto relative overflow-hidden">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent blur-sm z-20" />
      
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6" />
            Neon Slots
          </h2>
          <p className="text-muted-foreground text-sm">Aposte {BET_AMOUNT} moedas para ganhar até 50x!</p>
        </div>

        {/* ÁREA DA ROLETA */}
        <div className="flex gap-2 sm:gap-4 p-4 rounded-2xl bg-muted/30 border border-border shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-20 h-28 sm:w-28 sm:h-32 bg-background rounded-xl overflow-hidden relative border-2 border-primary/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center">
              
              {reelsSpinning[i] ? (
                <motion.div
                  animate={{ y: [0, -640] }} 
                  transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }} 
                  className="flex flex-col items-center opacity-80 blur-[1px]"
                >
                  {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, k) => (
                    <div key={k} className="h-32 w-full flex items-center justify-center text-4xl sm:text-6xl">
                      {s}
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={result[i]} 
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-4xl sm:text-6xl drop-shadow-md"
                >
                  {result[i]}
                </motion.div>
              )}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/40 z-10 opacity-50" />
              <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] pointer-events-none" />
            </div>
          ))}
        </div>

        <div className="h-12 flex items-center justify-center w-full">
          {winAmount > 0 && !isGameActive ? (
            <motion.div 
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="px-6 py-2 bg-green-500/10 text-green-600 dark:text-green-400 font-black text-2xl rounded-lg border border-green-500/20 flex items-center gap-2"
            >
              <Trophy className="w-6 h-6" /> +{winAmount}
            </motion.div>
          ) : (
            <div className="text-muted-foreground text-sm font-medium">
              {isGameActive ? "Boa sorte..." : "Tente multiplicar sua aposta!"}
            </div>
          )}
        </div>

        <Button 
          size="lg" 
          onClick={handleSpin} 
          disabled={isGameActive} 
          className="w-full max-w-xs h-14 text-lg font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-70"
        >
          {isGameActive ? <Loader2 className="animate-spin mr-2" /> : 'GIRAR AGORA'}
        </Button>
      </div>
      <div className="mt-6 pt-4 border-t border-border w-full text-center">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          <span>Custo por rodada: <strong>100 Moedas</strong>.</span>
          <span className="opacity-50">|</span>
          <span>3 iguais = Prêmio.</span>
        </p>
      </div>
    </Card>
  );
};