"use client";

/**
 * BottomNav - Navegação Inferior Mobile
 * 
 * Implementa Bottom Navigation Bar conforme Material Design e iOS HIG:
 * - Touch targets de 48px mínimo
 * - Ícones na "Thumb Zone" 
 * - Oculta ao scrollar para baixo, reaparece ao scrollar para cima
 * - Botão central "+" flutuante para adicionar conteúdo
 */

import { Home, MessageSquare, Plus, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
    const pathname = usePathname();
    const isActive = pathname === to ||
        (to === '/' && pathname === '/') ||
        (to !== '/' && pathname.startsWith(to));

    return (
        <Link
            href={to}
            className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] h-full px-3 transition-all duration-200',
                isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={label}
        >
            <Icon
                className={cn(
                    'h-6 w-6 transition-transform duration-200',
                    isActive && 'scale-110'
                )}
            />
            <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider transition-opacity',
                isActive ? 'opacity-100' : 'opacity-60'
            )}>
                {label}
            </span>
        </Link>
    );
};

export function BottomNav() {
    const { profile, session } = useAuth();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollContainerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // Encontra o container de scroll principal
        const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
        scrollContainerRef.current = scrollContainer;

        if (!scrollContainer) return;

        const handleScroll = () => {
            const currentScrollY = scrollContainer.scrollTop;
            const scrollDelta = currentScrollY - lastScrollY.current;

            // Oculta ao scrollar para baixo (delta positivo > 10px)
            // Mostra ao scrollar para cima (delta negativo < -10px)
            if (scrollDelta > 10 && currentScrollY > 100) {
                setIsVisible(false);
            } else if (scrollDelta < -10 || currentScrollY < 50) {
                setIsVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, []);

    // Determina a URL do perfil
    const profileUrl = profile?.username ? `/profile/${profile.username}` : '/login';

    return (
        <nav
            className={cn(
                'fixed bottom-0 left-0 right-0 z-[100] lg:hidden',
                'h-16 glass-panel rounded-t-3xl border-t-0',
                'flex items-center justify-around px-2',
                'transition-transform duration-300 ease-out',
                'safe-area-inset-bottom',
                !isVisible && 'translate-y-full'
            )}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
            role="navigation"
            aria-label="Navegação principal mobile"
        >
            {/* Home */}
            <NavItem to="/" icon={Home} label="Início" />

            {/* Fórum */}
            <NavItem to="/forum" icon={MessageSquare} label="Fórum" />

            {/* Botão Central - Adicionar (Flutuante) */}
            <div className="flex items-center justify-center -mt-6">
                <button
                    className={cn(
                        'flex items-center justify-center',
                        'w-14 h-14 rounded-2xl',
                        'bg-primary text-primary-foreground',
                        'shadow-lg shadow-primary/30',
                        'transition-all duration-200',
                        'hover:scale-105 hover:shadow-xl hover:shadow-primary/40',
                        'active:scale-95'
                    )}
                    aria-label="Adicionar novo vídeo"
                    onClick={() => {
                        // Scroll para o campo de adicionar vídeo na home
                        const addSection = document.querySelector('[data-add-video]');
                        if (addSection) {
                            addSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            window.location.href = '/';
                        }
                    }}
                >
                    <Plus className="h-7 w-7" strokeWidth={2.5} />
                </button>
            </div>

            {/* Busca */}
            <NavItem to="/channels" icon={Search} label="Canais" />

            {/* Perfil */}
            <NavItem
                to={session ? profileUrl : '/login'}
                icon={User}
                label={session ? 'Perfil' : 'Entrar'}
            />
        </nav>
    );
}
