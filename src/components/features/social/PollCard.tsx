"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Poll, PollBet } from '@/types/polls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Coins, Loader2, CheckCircle2, TrendingUp, Trash2, Trophy, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useGamification } from '@/context/GamificationContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PollCard({ poll, onBetPlaced, onDelete }: { poll: Poll, onBetPlaced?: () => void, onDelete?: () => void }) {
  const { user, isAdmin } = useAuth();
  const { stats, refreshStats } = useGamification();
  const [userBet, setUserBet] = useState<PollBet | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [optionWeights, setOptionWeights] = useState<number[]>([]);

  // Estado para o diálogo de confirmação
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingOptionIndex, setPendingOptionIndex] = useState<number | null>(null);

  const isOwner = user?.id === poll.creator_id || isAdmin;

  const fetchWeightsAndBet = useCallback(async () => {
    const { data: bets } = await supabase.from('poll_bets').select('option_index, amount').eq('poll_id', poll.id);

    if (bets) {
      const weights = poll.options.map((_, idx) =>
        bets.filter(b => b.option_index === idx).reduce((sum, b) => sum + b.amount, 0)
      );
      setOptionWeights(weights);
    }

    if (user) {
      const { data: myBet } = await supabase.from('poll_bets').select('*').eq('poll_id', poll.id).eq('user_id', user.id).maybeSingle();
      if (myBet) setUserBet(myBet as PollBet);
    }
  }, [poll.id, user, poll.options]);

  useEffect(() => {
    fetchWeightsAndBet();
  }, [fetchWeightsAndBet]);

  const initiateBet = (idx: number) => {
    if (!user) return toast.error('Faça login para apostar.');
    if (stats && stats.points < betAmount) return toast.error('Saldo insuficiente!');
    setPendingOptionIndex(idx);
    setShowConfirm(true);
  };

  const handleBet = async () => {
    if (pendingOptionIndex === null) return;

    setIsPlacingBet(true);
    setShowConfirm(false);

    try {
      const { error } = await supabase.rpc('place_poll_bet', {
        p_poll_id: poll.id,
        p_option_index: pendingOptionIndex,
        p_amount: betAmount
      });

      if (error) throw error;

      toast.success(`Aposta de ${betAmount} pontos registrada!`);
      refreshStats();
      fetchWeightsAndBet();
      if (onBetPlaced) onBetPlaced();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao apostar: ' + message);
    } finally {
      setIsPlacingBet(false);
      setPendingOptionIndex(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza? Se deletar agora, todos os créditos serão devolvidos aos apostadores.')) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('delete_poll_and_refund', { p_poll_id: poll.id });
      if (error) throw error;

      toast.success('Previsão excluída e créditos reembolsados.');
      if (onDelete) onDelete();
    } catch {
      toast.error('Erro ao excluir.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolve = async (winnerIndex: number) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('resolve_poll', {
        p_poll_id: poll.id,
        p_winner_index: winnerIndex
      });

      if (error) throw error;

      toast.success('Resultado publicado e prêmios distribuídos!');
      if (onDelete) onDelete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao resolver: ' + message);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalWeights = optionWeights.reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <Card className={cn(
        "glass-panel border-none rounded-xl sm:rounded-[2rem] shadow-2xl transition-all relative group/card",
        poll.status === 'resolved' && "opacity-80 grayscale-[0.5]"
      )}>
        <div className="absolute inset-0 rounded-xl sm:rounded-[2rem] border border-white/10 pointer-events-none z-20" />

        <CardHeader className="p-6 pb-2">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40 tracking-widest">
              {poll.status === 'resolved' ? <CheckCircle2 size={12} className="text-green-500" /> : <TrendingUp size={12} />}
              {poll.status === 'resolved' ? 'Desafio Encerrado' : 'Previsão Ativa'}
            </div>
            <div className="bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 text-primary text-[10px] font-black uppercase">
              <Coins size={10} /> Total: {poll.total_pool}
            </div>
          </div>
          <CardTitle className="text-xl font-black mt-3 leading-tight">{poll.question}</CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {poll.options.map((option, idx) => {
              const weight = optionWeights[idx] || 0;
              const percentage = (weight / totalWeights) * 100;
              const isSelected = userBet?.option_index === idx;
              const isWinner = poll.status === 'resolved' && poll.correct_option_index === idx;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold px-1">
                    <span className={cn("transition-colors", isSelected && "text-primary", isWinner && "text-green-500")}>
                      {option} {isSelected && "(Sua Aposta)"} {isWinner && "✓ VENCEDOR"}
                    </span>
                    <span className="opacity-40">{Math.round(percentage)}%</span>
                  </div>
                  <div className="relative group/btn overflow-hidden rounded-xl">
                    <Progress value={percentage} className={cn("h-10 rounded-xl bg-black/5 dark:bg-white/5", isSelected ? "border border-primary/30" : "border border-transparent")} />
                    {poll.status === 'open' && !userBet && (
                      <button
                        onClick={() => initiateBet(idx)}
                        disabled={isPlacingBet}
                        className="absolute inset-0 flex items-center justify-center bg-primary text-white opacity-0 group-hover/btn:opacity-100 transition-opacity font-black uppercase text-[10px] tracking-widest"
                      >
                        {isPlacingBet ? <Loader2 className="animate-spin" /> : `Apostar ${betAmount} PTS`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {poll.status === 'open' && !userBet ? (
                <>
                  <p className="text-[9px] font-black uppercase opacity-30">Valor:</p>
                  <div className="flex gap-2">
                    {[50, 100, 250].map(val => (
                      <button
                        key={val}
                        onClick={() => setBetAmount(val)}
                        className={cn("px-2 py-1 rounded-md text-[9px] font-black transition-all", betAmount === val ? "bg-primary text-white" : "bg-white/5 opacity-50 hover:opacity-100")}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </>
              ) : userBet ? (
                <p className="text-[10px] font-black uppercase text-primary animate-pulse">Aposta registrada.</p>
              ) : null}
            </div>

            <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-30">
              {isOwner && poll.status === 'open' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-green-500 hover:bg-green-500/10">
                      <Trophy size={14} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 glass-panel border-white/20 p-4 rounded-2xl shadow-2xl z-[100]" side="top">
                    <p className="text-[10px] font-black uppercase opacity-50 mb-3 text-center">Definir Vencedor</p>
                    <div className="grid gap-2">
                      {poll.options.map((opt, i) => (
                        <Button key={i} size="sm" onClick={() => handleResolve(i)} disabled={isProcessing} className="rounded-xl h-9 font-bold text-xs">
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="glass-panel border-white/20 rounded-xl sm:rounded-[2rem] p-8 max-w-sm">
          <AlertDialogHeader className="items-center text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
              <AlertCircle size={24} />
            </div>
            <AlertDialogTitle className="text-2xl font-black">Confirmar Aposta?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium opacity-70">
              Você está prestes a apostar <span className="font-black text-primary">{betAmount} pontos</span> na opção:
              <br />
              <span className="text-lg font-black text-foreground mt-2 block">
                "{pendingOptionIndex !== null ? poll.options[pendingOptionIndex] : ''}"
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="rounded-xl h-12 font-bold w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBet} className="rounded-xl h-12 font-black neo-button bg-primary text-white w-full sm:w-auto m-0">
              Confirmar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}