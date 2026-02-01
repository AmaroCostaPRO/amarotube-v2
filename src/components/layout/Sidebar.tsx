import { Home, ListVideo, History, X, LayoutDashboard, Users, User, Tv, MessageSquare, Users2, Sun, Moon, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useRef, useState, useEffect } from 'react';

import { useTheme } from '@/context/ThemeContext';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem = ({ to, icon: Icon, children, onClick }: { to?: string; icon: React.ElementType; children: React.ReactNode; onClick?: () => void }) => {
  const pathname = usePathname();
  
  const content = (
    <>
      <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
      <span className="tracking-wide">{children}</span>
    </>
  );

  if (to) {
    const isActive = pathname === to;
    return (
      <Link
        href={to}
        onClick={onClick}
        className={cn(
          'flex items-center gap-4 px-4 py-3 rounded-xl text-base transition-all duration-200 group',
          isActive
            ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20'
            : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground'
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-3 rounded-xl text-base transition-all duration-200 group',
        'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground text-left'
      )}
    >
      {content}
    </button>
  );
};

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const touchStartX = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  const closeSidebar = () => setIsOpen(false);

  // Implementação simples de swipe para fechar (deslizar para esquerda)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX.current - touchEndX;

    // Se o deslize para a esquerda for maior que 50px, fecha o menu
    if (deltaX > 50) {
      closeSidebar();
    }
    touchStartX.current = null;
  };

  const isDark = theme === 'dark' || theme === 'matrix';

  return (
    <>
      {/* Overlay para Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        />
      )}

      <aside
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 bg-background/[var(--component-bg-opacity)] backdrop-blur-md border-r z-[101] transition-transform duration-300 ease-in-out flex flex-col shadow-2xl rounded-r-xl',
          'lg:static lg:translate-x-0 lg:shadow-none lg:rounded-none lg:z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/5 lg:hidden">
          <Link href="/" className="flex items-center gap-2" onClick={closeSidebar}>
            <img src="/favicon.ico" alt="Logo" className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter">AmaroTube</h1>
          </Link>
          <button onClick={closeSidebar} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-6 overflow-y-auto flex-1">
          <NavItem to="/" icon={Home} onClick={closeSidebar}>Início</NavItem>
          <NavItem to="/forum" icon={MessageSquare} onClick={closeSidebar}>Fórum</NavItem>
          <NavItem to="/parties" icon={Users2} onClick={closeSidebar}>Watch Party</NavItem>
          <NavItem to="/casino" icon={Gamepad2} onClick={closeSidebar}>Cassino Arcade</NavItem>
          <NavItem to="/channels" icon={Tv} onClick={closeSidebar}>Canais</NavItem>
          <NavItem to="/playlists" icon={ListVideo} onClick={closeSidebar}>Playlists</NavItem>
          <NavItem to="/users" icon={Users} onClick={closeSidebar}>Usuários</NavItem>
          <NavItem to="/history" icon={History} onClick={closeSidebar}>Histórico</NavItem>
          <NavItem to="/dashboard" icon={LayoutDashboard} onClick={closeSidebar}>Dashboard</NavItem>
          {isAdmin && <NavItem to="/admin" icon={User} onClick={closeSidebar}>Admin</NavItem>}
        </nav>

        <div className="p-6 border-t border-white/5">
          <NavItem
            icon={!mounted ? () => <div className="w-6 h-6" /> : (isDark ? Sun : Moon)}
            onClick={toggleTheme}
          >
            {!mounted ? "Carregando..." : (isDark ? "Modo Claro" : "Modo Escuro")}
          </NavItem>
        </div>
      </aside>
    </>
  );
}