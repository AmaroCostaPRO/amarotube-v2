"use client";

/**
 * AppShell - Layout Principal da Aplicação
 * 
 * Wrapper centralizado que contém a estrutura de layout:
 * - DesktopSidebar para navegação desktop
 * - MobileHeader + MobileNav para navegação mobile
 * - BottomNav para navegação inferior mobile
 * - Footer integrado
 * - FloatingPlayer global
 */

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { FloatingPlayer } from '@/components/features/video/FloatingPlayer';
import { Footer } from '@/components/Footer';
import { DesktopSidebar, MobileHeader, MobileNav } from '@/components/app-layout';
import { BottomNav } from '@/components/BottomNav';

// Loading fallback para páginas lazy-loaded
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Touch navigation state
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);

  // Reset scroll e fecha menu on route change
  // Usa queueMicrotask para garantir que o fechamento ocorra após a navegação estabilizar
  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    queueMicrotask(() => setIsMobileMenuOpen(false));
  }, [pathname]);

  // Touch handlers for swipe navigation
  const onMainTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const onMainTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartPos.current.x;
    const deltaY = touch.clientY - touchStartPos.current.y;
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 15) {
      touchStartPos.current = null;
      return;
    }
    if (!isMobileMenuOpen && touchStartPos.current.x < 180 && deltaX > 70) {
      setIsMobileMenuOpen(true);
      touchStartPos.current = null;
      return;
    }
    if (isMobileMenuOpen && deltaX < -70) {
      setIsMobileMenuOpen(false);
      touchStartPos.current = null;
      return;
    }
  };

  const onMainTouchEnd = () => {
    touchStartPos.current = null;
  };

  return (
    <div
      className="fixed inset-0 w-full h-full flex overflow-hidden touch-pan-y isolate"
      onTouchStart={onMainTouchStart}
      onTouchMove={onMainTouchMove}
      onTouchEnd={onMainTouchEnd}
    >
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <main
        className="flex-1 flex flex-col min-w-0 relative h-full will-change-transform"
        style={{
          backfaceVisibility: 'hidden',
          transform: 'translate3d(0,0,0)',
          contain: 'layout size'
        }}
      >
        {/* Mobile Header */}
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Page Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:pl-8 sm:pr-4 pb-24 lg:pb-8 scroll-smooth pt-24 lg:pt-10 flex flex-col"
        >
          <div className="flex-1 flex flex-col min-h-full w-full">
            <div className="flex-1">
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            </div>
            <Footer />
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />

      <FloatingPlayer />
    </div>
  );
}
