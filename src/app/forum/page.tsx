"use client";

import { MessageSquare, Users, TrendingUp, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ForumPage() {
  const { session } = useAuth();

  if (!session) {
    return (
      <div className="space-y-6 sm:space-y-10">
        <div className="space-y-1" data-aos="fade-right">
          <h1 className="text-4xl font-black tracking-tight text-contrast-bg">Fórum</h1>
          <p className="font-bold opacity-60 text-contrast-bg">
            Discussões e comunidade AmaroTube
          </p>
        </div>

        <div className="text-center py-24 glass-panel rounded-xl sm:rounded-[3rem] border-dashed border-2 bg-transparent border-white/10">
          <Lock className="h-20 w-20 mx-auto mb-6 text-contrast-bg opacity-50" />
          <p className="text-2xl font-black tracking-tight mb-2 text-contrast-bg">Área Restrita</p>
          <p className="font-medium px-4 text-contrast-bg opacity-70 mb-6">
            O fórum é exclusivo para membros registrados.
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
        <h1 className="text-4xl font-black tracking-tight text-contrast-bg">Fórum</h1>
        <p className="font-bold opacity-60 text-contrast-bg">
          Participe das discussões da comunidade AmaroTube
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <MessageSquare className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Tópicos Recentes</h3>
          <p className="text-muted-foreground text-sm">
            Veja as discussões mais recentes da comunidade.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <TrendingUp className="h-10 w-10 text-green-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Em Alta</h3>
          <p className="text-muted-foreground text-sm">
            Tópicos populares desta semana.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <Users className="h-10 w-10 text-purple-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">Comunidades</h3>
          <p className="text-muted-foreground text-sm">
            Encontre grupos com interesses em comum.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">
          O fórum está em desenvolvimento. Em breve você poderá participar de discussões!
        </p>
      </div>
    </div>
  );
}
