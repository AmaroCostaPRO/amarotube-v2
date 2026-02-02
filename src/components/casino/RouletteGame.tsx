"use client";

import { useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Info } from 'lucide-react';
import { toast } from 'sonner';

const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const SLICE_ANGLE = 360 / 37;

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface RouletteGameProps {
  userBalance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

export function RouletteGame({ userBalance, setBalance }: RouletteGameProps) {
  const [rotation, setRotation] = useState(0);
  const [betAmount, setBetAmount] = useState(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winData, setWinData] = useState<{ amount: number } | null>(null);
  const controls = useAnimation();

  const handleSpin = async (type: 'color' | 'number', selection: string | number) => {
    if (isSpinning) return;
    setWinData(null);

    if (userBalance < betAmount) {
      toast.error("Saldo Insuficiente! Recarregue suas moedas.");
      return;
    }

    setIsSpinning(true);
    setBalance((prev: number) => prev - betAmount); 

    try {
      // Simulate result (in production, call Supabase Edge Function)
      const resultNumber = Math.floor(Math.random() * 37); // 0-36
      
      // Calculate payout
      let payout = 0;
      if (type === 'number' && selection === 0 && resultNumber === 0) {
        payout = betAmount * 36;
      } else if (type === 'color') {
        const isRed = RED_NUMBERS.includes(resultNumber);
        if ((selection === 'red' && isRed) || (selection === 'black' && !isRed && resultNumber !== 0)) {
          payout = betAmount * 2;
        }
      }
      
      // Visual spin
      const winningIndex = WHEEL_ORDER.indexOf(resultNumber);
      const degreesPerSlice = 360 / 37;
      const targetAngleOnPlate = winningIndex * degreesPerSlice;
      
      const currentRotation = rotation;
      const currentAngle = currentRotation % 360;
      const visualTargetAngle = (360 - targetAngleOnPlate) % 360;
      
      let angleDiff = visualTargetAngle - currentAngle;
      if (angleDiff < 0) angleDiff += 360;
      
      const extraSpins = 5 * 360; 
      const newTotalRotation = currentRotation + extraSpins + angleDiff;

      await controls.start({
        rotate: newTotalRotation,
        transition: { duration: 4, ease: [0.25, 0.1, 0.25, 1] }
      });

      setRotation(newTotalRotation);
      
      if (payout > 0) {
        setWinData({ amount: payout });
        setBalance((prev: number) => prev + payout);
        toast.success(`VITÓRIA! 🎉 +${payout} Moedas!`);
      } else {
        toast.error("Derrota. Tente novamente!");
      }

    } catch {
      setBalance((prev: number) => prev + betAmount);
      toast.error("Falha na conexão.");
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      {/* MESA DE JOGO */}
      <div className="relative flex flex-col items-center justify-center py-6 px-2 sm:py-12 sm:px-4 rounded-[3rem] 
        bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900 via-green-950 to-black/80
        border border-white/5 shadow-2xl mb-8 w-full max-w-2xl mx-auto overflow-hidden">
        
        <div className="absolute inset-0 rounded-[3rem] shadow-[inset_0_0_60px_rgba(0,0,0,0.6)] pointer-events-none" />

        {/* Roda Giratória */}
        <div className="relative w-[80%] aspect-square max-w-sm">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none filter drop-shadow-md">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[24px] border-t-blue-500 translate-y-[-2px]" />
          </div>
          
          <motion.div
             animate={controls}
             initial={{ rotate: 0 }}
             style={{ rotate: rotation }}
             className="w-full h-full rounded-full relative shadow-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/roulette-body.png" 
              alt="Roulette" 
              className="w-full h-full object-cover rounded-full pointer-events-none"
            />
            {WHEEL_ORDER.map((num, i) => (
              <div
                key={num}
                className="absolute top-0 left-1/2 w-[1px] h-1/2 origin-bottom z-20"
                style={{ transform: `rotate(${i * SLICE_ANGLE}deg)` }}
              >
                <div className="absolute -left-4 top-2 w-8 text-center font-bold text-sm text-transparent">
                  {num}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Console de Apostas */}
      <div className="w-full max-w-lg p-6 rounded-2xl 
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md 
        border border-slate-200/50 dark:border-white/10 
        shadow-2xl flex flex-col gap-5 relative overflow-hidden">
        
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex gap-4 relative z-10">
           <Input 
               type="number" 
               value={betAmount} 
               onChange={(e) => setBetAmount(Number(e.target.value))} 
               className="bg-white/50 dark:bg-black/20 text-center font-bold text-lg border-slate-300 dark:border-slate-700 shadow-sm"
               disabled={isSpinning}
           />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
           <Info className="w-3 h-3" /> Aposta Mínima: 100 Moedas
        </div>

        <div className="flex gap-4 p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 justify-center shadow-inner relative z-10">
          <Button variant="destructive" className="flex-1 h-10 text-sm md:h-12 md:text-lg font-bold shadow-lg active:scale-95 transition-transform" onClick={() => handleSpin('color', 'red')} disabled={isSpinning}>Vermelho (x2)</Button>
          <Button variant="secondary" className="flex-1 h-10 text-sm md:h-12 md:text-lg font-bold bg-slate-900 text-white hover:bg-black shadow-lg active:scale-95 transition-transform" onClick={() => handleSpin('color', 'black')} disabled={isSpinning}>Preto (x2)</Button>
        </div>
        <Button className="w-full h-10 text-sm md:h-12 md:text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl active:scale-95 transition-transform relative z-10" onClick={() => handleSpin('number', 0)} disabled={isSpinning}>Apostar no Zero (x36)</Button>
      </div>

      <div className="w-full flex justify-center mt-6 min-h-[60px]">
        <AnimatePresence>
          {winData && !isSpinning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              className="px-8 py-3 bg-green-600 text-white text-xl font-bold rounded-full shadow-lg flex items-center gap-2 border-2 border-green-400"
            >
              🎉 GANHOU +{winData.amount}!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
