"use client";

/**
 * Mobile Navigation Drawer
 * 
 * Menu lateral para dispositivos móveis com overlay e animações.
 */

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarContent } from './SidebarContent';

interface MobileNavProps {
    isOpen: boolean;
    onClose: () => void;
}

const sidebarSpring = { type: "spring", damping: 30, stiffness: 250 } as const;

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm z-[200] lg:hidden isolate"
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={sidebarSpring}
                        className="isolate-gpu fixed top-0 left-0 bottom-0 w-[240px] bg-card z-[201] lg:hidden flex flex-col shadow-2xl rounded-r-[2.5rem] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between shrink-0">
                            <Link href="/" className="flex items-center gap-2">
                                <img src="/favicon.ico" alt="AmaroTube Logo" className="w-8 h-8" />
                                <span className="text-xl font-black tracking-tighter text-foreground">AmaroTube</span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Fechar menu lateral"
                                onClick={onClose}
                                className="rounded-full h-10 w-10"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 pb-10">
                            <SidebarContent onLinkClick={onClose} isExpanded={true} />
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
