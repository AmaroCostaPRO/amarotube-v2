"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ParticleBackground } from '@/components/auth/ParticleBackground';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

export default function SignupPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect dark mode after mount to avoid hydration mismatch
  const isDark = useMemo(() => {
    if (!mounted || typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  }, [mounted]);

  useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session, router]);

  const getURL = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    return url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  };

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500">
      <ParticleBackground />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="bg-white/[0.02] dark:bg-black/10 backdrop-blur-sm border border-black/[0.05] dark:border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden p-8 sm:p-10 relative">
          {/* Header Identity */}
          <div className="flex flex-col items-center mb-8 space-y-4">
            <Link href="/" className="group flex items-center gap-3">
              <img src="/favicon.ico" alt="AmaroTube" className="w-12 h-12 transition-transform group-hover:scale-110" />
              <span className="text-3xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 bg-clip-text text-transparent">
                AmaroTube
              </span>
            </Link>
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Criar Conta</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Junte-se à comunidade AmaroTube</p>
            </div>
          </div>

          {/* Supabase Auth Component */}
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              className: {
                container: 'space-y-6',
                button: 'w-full h-12 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-base',
                input: 'w-full h-12 px-4 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-black/10 dark:border-white/10 text-zinc-900 dark:text-white font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none',
                label: 'text-xs font-black uppercase text-zinc-500 dark:text-zinc-500 tracking-widest ml-1 mb-2 block',
                anchor: 'text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-white transition-colors text-center block mt-4',
                message: 'text-xs font-bold text-red-500 dark:text-red-400 text-center mt-4 bg-red-400/10 p-3 rounded-lg border border-red-400/20',
              },
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb', 
                    brandAccent: '#1d4ed8',
                    inputText: isDark ? 'white' : '#09090b',
                    inputPlaceholder: '#71717a',
                  }
                }
              }
            }}
            providers={[]}
            view="sign_up"
            theme={isDark ? "dark" : "light"}
            redirectTo={getURL()}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar Agora',
                  loading_button_label: 'Entrando...',
                  link_text: 'Já possui uma conta? Entre aqui',
                },
                sign_up: {
                  email_label: 'E-mail',
                  password_label: 'Crie sua senha',
                  button_label: 'Criar Minha Conta',
                  loading_button_label: 'Criando...',
                  link_text: 'Não tem conta? Cadastre-se',
                },
                forgotten_password: {
                  email_label: 'E-mail cadastrado',
                  button_label: 'Recuperar Senha',
                  loading_button_label: 'Enviando...',
                  link_text: 'Esqueceu sua senha?',
                }
              }
            }}
          />
          
          <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/5 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
               Versão 2.0 • AMAROTUBE
             </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
