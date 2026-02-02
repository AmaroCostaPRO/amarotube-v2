"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { SlotMachine } from '@/components/casino/SlotMachine';
import { RouletteGame } from '@/components/casino/RouletteGame';
import { Predictions } from '@/components/casino/Predictions';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Gamepad2, Lock, Dices, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ArcadePage() {
  const { session } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('user_gamification')
      .select('points')
      .eq('user_id', user.id)
      .single();
      
    if (data) setBalance(data.points);
    setLoading(false);
  };

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    fetchBalance();
  }, [session]);

  // Guest Mode
  if (!session) {
    return (
      <div className="space-y-8 pb-20">
        {/* Header (Guest - No Balance) */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden w-full">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
                    <Gamepad2 className="w-10 h-10 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-md">
                        Cassino Arcade
                    </h1>
                    <p className="text-blue-100 font-medium text-lg mt-1 opacity-90">
                        Jogue, aposte e ganhe prêmios!
                    </p>
                </div>
            </div>
        </div>

        {/* CTA Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-100">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Faça login para acumular pontos e participar do ranking global.</span>
          </div>
          <Link href="/login">
            <Button className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white">
              Entrar Agora
            </Button>
          </Link>
        </div>

        {/* Locked Area */}
        <div className="w-full h-[400px] rounded-3xl bg-slate-100 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-8">
          <div className="p-6 rounded-full bg-slate-200 dark:bg-slate-800 mb-6">
            <Lock className="w-12 h-12 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Área de Apostas Exclusiva</h2>
          <p className="text-muted-foreground max-w-md">
            Os jogos de Slots, Roleta e Previsões valem pontos reais no sistema de gamificação. Acesso restrito a membros registrados.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 pt-8 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Gamepad2 className="w-5 h-5 text-purple-500" /> Neon Slots
            </div>
            <p className="text-sm text-muted-foreground">Tente a sorte na máquina caça-níqueis. Combine símbolos iguais e multiplique sua aposta em até 50x.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Dices className="w-5 h-5 text-green-500" /> Roleta Europeia
            </div>
            <p className="text-sm text-muted-foreground">Escolha sua cor ou número da sorte. Apostas clássicas com pagamentos instantâneos no saldo.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Previsões
            </div>
            <p className="text-sm text-muted-foreground">Use seu conhecimento para prever resultados de eventos reais e ganhe parte do pote da comunidade.</p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Mode
  return (
    <div className="space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden w-full">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
                    <Gamepad2 className="w-10 h-10 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-md">
                        Cassino Arcade
                    </h1>
                    <p className="text-blue-100 font-medium text-lg mt-1 opacity-90">
                        Jogue, aposte e ganhe prêmios!
                    </p>
                </div>
            </div>

            <Card className="flex items-center gap-4 px-6 py-4 bg-black/40 border border-white/10 shadow-xl backdrop-blur-md relative z-10 mt-6 md:mt-0 w-full md:w-auto transition-transform hover:scale-105">
                <div className="p-2 rounded-full bg-yellow-400/20 border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                    <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Saldo Atual</span>
                    <span className="text-3xl font-black text-white tabular-nums drop-shadow-sm leading-none mt-1">
                        {loading ? "..." : balance.toLocaleString()}
                    </span>
                </div>
            </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="slots" className="w-full space-y-8">
            <div className="flex justify-center">
                <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl mb-8">
                    <TabsTrigger value="slots" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Neon Slots</TabsTrigger>
                    <TabsTrigger value="predictions" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Previsões</TabsTrigger>
                    <TabsTrigger value="roulette" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Roleta</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="slots" className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid gap-8 place-items-center min-h-[500px]">
                    <SlotMachine userBalance={balance} setBalance={setBalance} />
                </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4 mt-8">
                <div className="min-h-[500px]">
                     <Predictions />
                </div>
            </TabsContent>

            <TabsContent value="roulette" className="space-y-4 mt-8">
                <div className="grid gap-8 place-items-center min-h-[500px]">
                    <RouletteGame userBalance={balance} setBalance={setBalance} />
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
