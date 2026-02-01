"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, HelpCircle, FileText, Info } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto pt-10 pb-6 transition-none">
      <div className="glass-panel border-none rounded-xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-none">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10 transition-none">
          <div className="col-span-2 md:col-span-2 space-y-3 transition-none">
            <Link href="/" className="flex items-center gap-2 group transition-none">
              <img src="/favicon.ico" alt="Logo" className="w-6 h-6 transition-none" />
              <span className="text-xl font-black tracking-tighter transition-none">AmaroTube</span>
            </Link>
            <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed transition-none">
              Descubra e interaja. A rede social de curadoria de vídeos alimentada pela comunidade.
            </p>
          </div>

          <div className="space-y-4 transition-none col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 transition-none">Institucional</h4>
            <nav className="flex flex-col gap-2 transition-none">
              <Link href="/about" className="text-xs font-bold hover:text-primary flex items-center gap-2 transition-none">
                <Info size={12} className="opacity-50 transition-none" /> Sobre nós
              </Link>
              <Link href="/terms" className="text-xs font-bold hover:text-primary flex items-center gap-2 transition-none">
                <FileText size={12} className="opacity-50 transition-none" /> Termos de Uso
              </Link>
              <Link href="/privacy" className="text-xs font-bold hover:text-primary flex items-center gap-2 transition-none">
                <Shield size={12} className="opacity-50 transition-none" /> Privacidade
              </Link>
            </nav>
          </div>

          <div className="space-y-4 transition-none col-span-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 transition-none">Suporte</h4>
            <nav className="flex flex-col gap-2 transition-none">
              <Link href="/help" className="text-xs font-bold hover:text-primary flex items-center gap-2 transition-none">
                <HelpCircle size={12} className="opacity-50 transition-none" /> Central de Ajuda
              </Link>
              <a href="mailto:suporte@amarotube.com" className="text-xs font-bold hover:text-primary transition-none">
                suporte@amarotube.com
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-black uppercase tracking-widest opacity-40 transition-none">
          <p className="transition-none">© {currentYear} AmaroTube.</p>
          <div className="flex items-center gap-6 transition-none">
            <span className="transition-none">Feito com ❤️ para a comunidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
