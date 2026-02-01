"use client";

/**
 * Sidebar Content Component
 * 
 * Conteúdo da sidebar com navegação e perfil do usuário.
 * Usado tanto na sidebar desktop quanto no menu mobile.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Tv, ListMusic, History, LayoutDashboard, Moon, Sun, Users, MessageSquare, LogIn, ShieldAlert, Users2, Gamepad2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
    onLinkClick?: () => void;
    isExpanded: boolean;
}

export function SidebarContent({ onLinkClick, isExpanded }: SidebarContentProps) {
    const { theme, toggleTheme } = useTheme();
    const { user, profile, session, isAdmin } = useAuth();
    const pathname = usePathname();

    const items = [
        { to: '/', icon: Home, label: 'Início' },
        { to: '/forum', icon: MessageSquare, label: 'Fórum' },
        { to: '/parties', icon: Users2, label: 'Watch Party' },
        { to: '/casino', icon: Gamepad2, label: 'Cassino Arcade' },
        { to: '/channels', icon: Tv, label: 'Canais' },
        { to: '/playlists', icon: ListMusic, label: 'Playlists' },
        { to: '/users', icon: Users, label: 'Usuários' },
        { to: '/history', icon: History, label: 'Histórico' },
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ];

    if (isAdmin) items.push({ to: '/admin', icon: ShieldAlert, label: 'Admin' });

    return (
        <div className="flex flex-col">
            <nav className="space-y-2">
                {items.map((item) => {
                    const isActive = pathname === item.to;
                    return (
                        <Link
                            key={item.to}
                            href={item.to}
                            onClick={onLinkClick}
                            className={cn(
                                "flex items-center rounded-2xl relative h-14 pl-6 group overflow-hidden transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-6 h-6 shrink-0 relative z-10" />
                            <motion.div
                                initial={false}
                                animate={{ opacity: isExpanded ? 1 : 0 }}
                                transition={{ duration: 0.15 }}
                                className="ml-6 flex items-center flex-1 whitespace-nowrap overflow-hidden relative z-10"
                            >
                                <span className="text-xl font-bold tracking-tight inline-block">
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-border space-y-4 mt-6 pb-8">
                <button
                    onClick={toggleTheme}
                    aria-label={`Mudar para ${theme === 'light' ? 'modo escuro' : 'modo claro'}`}
                    className="w-full flex items-center h-14 rounded-2xl font-bold hover:bg-secondary justify-start pl-6 text-muted-foreground hover:text-foreground relative overflow-hidden transition-colors"
                >
                    {theme === 'light' ? <Moon className="w-6 h-6 shrink-0 relative z-10" /> : <Sun className="w-6 h-6 shrink-0 relative z-10" />}
                    <motion.div
                        initial={false}
                        animate={{ opacity: isExpanded ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        className="ml-6 whitespace-nowrap text-base font-bold text-left overflow-hidden relative z-10"
                    >
                        {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                    </motion.div>
                </button>

                {session ? (
                    <Link
                        href={profile?.username ? `/profile/${profile.username}` : '#'}
                        onClick={onLinkClick}
                        aria-label="Ir para seu perfil"
                        className={cn(
                            "block group rounded-2xl overflow-hidden relative transition-colors",
                            pathname === `/profile/${profile?.username}`
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "bg-secondary border border-border hover:bg-secondary/80"
                        )}
                    >
                        <div className="flex items-center h-16 pl-4 relative z-10">
                            <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 border-2 border-background relative z-10 shrink-0">
                                    <AvatarImage src={profile?.avatar_url || ''} alt={`Avatar de ${profile?.username || 'usuário'}`} />
                                    <AvatarFallback className="font-bold">{profile?.username?.[0] || user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                            <motion.div
                                initial={false}
                                animate={{ opacity: isExpanded ? 1 : 0 }}
                                transition={{ duration: 0.15 }}
                                className="ml-4 flex-1 min-w-0 overflow-hidden"
                            >
                                <p
                                    className="text-base font-black truncate"
                                    style={{ color: profile?.name_color || 'inherit' }}
                                >
                                    @{profile?.username || 'Usuário'}
                                </p>
                                <p className={cn(
                                    "text-[10px] uppercase font-bold truncate tracking-widest",
                                    pathname === `/profile/${profile?.username}` ? "text-primary-foreground opacity-60" : "text-foreground opacity-40"
                                )}>Ver perfil</p>
                            </motion.div>
                        </div>
                    </Link>
                ) : (
                    <Link href="/login" onClick={onLinkClick} className="block group relative overflow-hidden rounded-2xl">
                        <div className="w-full h-14 flex items-center rounded-2xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 pl-6 hover:bg-primary/90 transition-colors relative z-10">
                            <LogIn className="w-6 h-6 shrink-0" />
                            <motion.div
                                initial={false}
                                animate={{ opacity: isExpanded ? 1 : 0 }}
                                transition={{ duration: 0.15 }}
                                className="ml-6 overflow-hidden whitespace-nowrap text-xl font-black"
                            >
                                Login
                            </motion.div>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
