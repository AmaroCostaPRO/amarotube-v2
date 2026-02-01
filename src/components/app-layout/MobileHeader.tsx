"use client";

/**
 * Mobile Header Component
 * 
 * Header responsivo para dispositivos móveis.
 * Contém botão de menu, logo e notificações.
 */

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/features/social/NotificationBell';

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
    return (
        <header className="h-20 flex items-center justify-between px-4 sm:px-8 z-[100] fixed top-0 left-0 right-0 lg:hidden glass-panel rounded-none border-none border-b border-white/5">
            <div className="flex items-center gap-2 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Abrir menu lateral"
                    onClick={onMenuClick}
                    className="rounded-xl h-10 w-10 active:scale-90 bg-black/5 dark:bg-white/5 border border-white/5 shadow-sm"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                <Link href="/" className="flex items-center gap-2 group">
                    <img src="/favicon.ico" alt="AmaroTube Logo" className="w-9 h-9 transition-transform group-active:scale-95" />
                    <span className="text-xl min-[380px]:text-3xl font-black tracking-tighter text-foreground hidden min-[340px]:block transition-all duration-300">
                        AmaroTube
                    </span>
                </Link>
            </div>

            <div className="flex items-center gap-1 z-20">
                <NotificationBell />
            </div>
        </header>
    );
}
