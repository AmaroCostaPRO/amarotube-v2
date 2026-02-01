"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, Loader2, Heart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/context/GamificationContext';
import { toast } from 'sonner';

interface TipUserDialogProps {
  targetUserId: string;
  targetUsername: string;
  children: React.ReactNode;
}

export function TipUserDialog({ targetUserId, targetUsername, children }: TipUserDialogProps) {
  const { stats, refreshStats } = useGamification();
  const [amount, setAmount] = useState<number>(50);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleTip = async () => {
    if (amount <= 0) return toast.error('Valor inválido.');
    if ((stats?.points || 0) < amount) return toast.error('Saldo insuficiente!');

    setIsSending(true);
    try {
      const { data, error } = await supabase.rpc('transfer_points', {
        p_target_user_id: targetUserId,
        p_amount: amount
      });

      if (error) throw error;
      if (data === false) throw new Error('Falha na transferência.');

      toast.success(`Você enviou ${amount} pontos para @${targetUsername}!`);
      setIsOpen(false);
      refreshStats();
    } catch {
      toast.error('Falha ao enviar gorjeta.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xs glass-panel border-none rounded-[2rem] shadow-2xl p-8">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Heart size={32} className="fill-current" />
          </div>
          <div>
             <DialogTitle className="text-2xl font-black">Enviar Gorjeta</DialogTitle>
             <DialogDescription className="font-medium text-xs">Reconheça o conteúdo de @{targetUsername}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-4">
           <div className="flex justify-between text-[10px] font-black uppercase opacity-40 px-1">
              <span>Seu Saldo</span>
              <span className="text-primary">{stats?.points || 0} PTS</span>
           </div>
           <div className="relative">
              <Label htmlFor="tip-amount-input" className="sr-only">Valor da Gorjeta</Label>
              <Input 
                id="tip-amount-input"
                name="tip-amount"
                type="number" 
                value={amount} 
                onChange={e => setAmount(Number(e.target.value))}
                className="h-14 rounded-2xl bg-black/5 dark:bg-white/5 border-none shadow-inner text-center text-2xl font-black focus-visible:ring-primary"
              />
              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" />
           </div>
           <div className="grid grid-cols-3 gap-2">
              {[10, 50, 100].map(val => (
                <Button key={val} variant="outline" size="sm" onClick={() => setAmount(val)} className="rounded-xl h-8 font-bold text-[10px]">{val} PTS</Button>
              ))}
           </div>
        </div>

        <DialogFooter>
           <Button onClick={handleTip} disabled={isSending} className="w-full h-12 rounded-2xl font-black neo-button shadow-lg shadow-primary/20">
              {isSending ? <Loader2 className="animate-spin" /> : 'Confirmar Doação'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}