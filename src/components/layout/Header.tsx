"use client";

import { Menu, LogOut, LogIn, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { supabase } from '@/integrations/supabase/client';
import { NotificationBell } from '@/components/features/social/NotificationBell';
import { User as UserIcon, Coins } from 'lucide-react';
import { useGamification } from '@/context/GamificationContext';
import { useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { session, user, profile } = useAuth();
  const { stats } = useGamification();
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 flex items-center px-4 sm:px-6 bg-background/[var(--component-bg-opacity)] backdrop-blur-md border-b z-50 shadow-neo-outset rounded-b-xl transition-all duration-300">
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={toggleSidebar}
            aria-label="Abrir menu lateral"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center gap-2 transition-colors duration-200" aria-label="Voltar para o início">
            <img src="/favicon.ico" alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold hidden sm:block">AmaroTube</h1>
          </Link>
        </div>

        {/* Barra de Busca */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Faça login para pesquisar vídeos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-10 pr-4 h-10 rounded-full bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-x-1 sm:gap-x-2 md:gap-x-4 flex-shrink-0">
          {session && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm">
              <Coins className="h-4 w-4" />
              {stats?.points || 0}
            </div>
          )}
          <ThemeSwitcher />
          <NotificationBell />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 transition-transform duration-200 hover:scale-[1.01]"
                  aria-label="Opções de usuário"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/[var(--component-bg-opacity)] backdrop-blur-md shadow-neo-outset rounded-xl">
                {profile?.username && (
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${profile.username}`} className="transition-colors duration-200 hover:bg-accent hover:text-accent-foreground">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="transition-colors duration-200 hover:bg-accent hover:text-accent-foreground">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="transition-colors duration-200 hover:bg-accent hover:text-accent-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 transition-transform duration-200 hover:scale-[1.01]"
              aria-label="Fazer login"
            >
              <Link href="/login">
                <LogIn className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
