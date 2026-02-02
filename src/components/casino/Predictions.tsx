"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HelpCircle, Sparkles, Check, Plus } from 'lucide-react';

interface Prediction {
  id: string;
  question: string;
  options: { label: string; votes: number; userVoted: boolean }[];
  totalPool: number;
  status: 'active' | 'closed';
}

const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: '1',
    question: 'Quanto é 2+2?',
    options: [
      { label: '4 (Sua Aposta)', votes: 100, userVoted: true },
      { label: '5', votes: 0, userVoted: false }
    ],
    totalPool: 500,
    status: 'active'
  },
  {
    id: '2',
    question: 'Quem nasceu primeiro?',
    options: [
      { label: 'Ovo', votes: 50, userVoted: false },
      { label: 'Galinha (Sua Aposta)', votes: 50, userVoted: true }
    ],
    totalPool: 200,
    status: 'active'
  }
];

export function Predictions() {
  const [predictions] = useState<Prediction[]>(MOCK_PREDICTIONS);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black">Previsões</h2>
          <p className="text-muted-foreground">Desafie a comunidade e multiplique seus pontos.</p>
        </div>
        <Button className="rounded-xl font-bold gap-2">
          <Plus size={16} /> Novo Desafio
        </Button>
      </div>

      {/* Prediction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((pred) => {
          const totalVotes = pred.options.reduce((sum, opt) => sum + opt.votes, 0);
          
          return (
            <Card key={pred.id} className="p-6 space-y-4 glass-panel border-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <Check size={12} /> Previsão Ativa
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1">
                  <Sparkles size={12} /> Total: {pred.totalPool}
                </span>
              </div>

              <h3 className="text-xl font-black">{pred.question}</h3>

              <div className="space-y-3">
                {pred.options.map((opt, idx) => {
                  const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={opt.userVoted ? 'text-primary font-bold' : 'opacity-70'}>
                          {opt.label}
                        </span>
                        <span className="opacity-50">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-green-500">
                Aposta Registrada
              </p>
            </Card>
          );
        })}
      </div>

      {/* How It Works Section */}
      <Card className="p-8 glass-panel border-none bg-primary/5">
        <h3 className="text-xl font-black flex items-center gap-2 mb-6">
          <HelpCircle className="text-primary" /> Como funciona?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-black text-primary uppercase text-[10px] tracking-widest">1. Aposte</p>
            <p className="opacity-70">Escolha um resultado e coloque seus pontos em jogo. O total de pontos de todos forma o "Pote".</p>
          </div>
          <div className="space-y-2">
            <p className="font-black text-primary uppercase text-[10px] tracking-widest">2. Aguarde</p>
            <p className="opacity-70">Quando o criador confirmar o resultado real, o sistema verifica quem acertou.</p>
          </div>
          <div className="space-y-2">
            <p className="font-black text-primary uppercase text-[10px] tracking-widest">3. Lucre</p>
            <p className="opacity-70">O pote total é dividido entre os vencedores de acordo com o valor da aposta de cada um.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
