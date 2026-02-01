"use client";

import { Users, Play, Lock, Sparkles, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PartiesPage() {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="space-y-6 sm:space-y-10">
        <div className="space-y-1" data-aos="fade-right">
          <h1 className="text-4xl font-black tracking-tight text-contrast-bg">Watch Parties</h1>
          <p className="font-bold opacity-60 text-contrast-bg">
            Assista junto com amigos em tempo real
          </p>
        </div>

        <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] border-dashed border-2 bg-transparent border-white/10">
          <Lock className="h-20 w-20 mx-auto mb-6 text-contrast-bg opacity-50" />
          <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg">Área Restrita</p>
          <p className="font-medium px-4 text-contrast-bg opacity-70 mb-6">
            Watch Parties são exclusivas para membros registrados.
          </p>
          <Link href="/login">
            <Button className="rounded-xl h-12 font-black px-8">Entrar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="space-y-1" data-aos="fade-right">
        <h1 className="text-4xl font-black tracking-tight text-contrast-bg">Watch Parties</h1>
        <p className="font-bold opacity-60 text-contrast-bg">
          Crie ou entre em sessões para assistir vídeos com amigos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <Play className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Criar Sala</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Inicie uma nova sessão e convide amigos.
          </p>
          <Button className="w-full rounded-xl font-bold">Criar Watch Party</Button>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <Users className="h-10 w-10 text-green-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Salas Ativas</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Veja sessões públicas acontecendo agora.
          </p>
          <Button variant="outline" className="w-full rounded-xl font-bold">Explorar</Button>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <Sparkles className="h-10 w-10 text-yellow-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Minhas Sessões</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Histórico de Watch Parties que você participou.
          </p>
          <Button variant="outline" className="w-full rounded-xl font-bold">Ver Histórico</Button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <Trophy className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Salas Populares</h2>
        </div>
        <p className="text-center text-muted-foreground py-8">
          Nenhuma sala ativa no momento. Seja o primeiro a criar uma!
        </p>
      </div>
    </div>
  );
}
