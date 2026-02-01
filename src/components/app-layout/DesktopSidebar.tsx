"use client";

/**
 * Desktop Sidebar Component
 * 
 * Sidebar expansível para desktop com hover effect.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SidebarContent } from './SidebarContent';
import { cn } from '@/lib/utils';

const sidebarSpring = { type: "spring", damping: 30, stiffness: 250 } as const;

export function DesktopSidebar() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isHovered ? 240 : 88 }}
            transition={sidebarSpring}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "isolate-gpu hidden lg:flex flex-col h-full bg-card z-[120] rounded-none border-none border-r border-border overflow-hidden shadow-2xl"
            )}
        >
            {/* Logo */}
            <div className="p-0 shrink-0 pt-10 mb-10 h-20 flex items-center overflow-hidden">
                <Link href="/" className="flex items-center pl-6 group shrink-0">
                    <img src="/favicon.ico" alt="AmaroTube Logo" className="w-10 h-10 transition-transform group-hover:scale-110 shrink-0" />
                    <motion.div
                        initial={false}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        className="ml-2 text-3xl font-black tracking-tighter overflow-hidden whitespace-nowrap text-foreground"
                    >
                        AmaroTube
                    </motion.div>
                </Link>
            </div>

            {/* Navigation */}
            <div className={cn(
                "flex-1 px-2 pb-5 scroll-smooth overflow-x-hidden",
                isHovered ? "overflow-y-auto" : "overflow-y-hidden hover:overflow-y-auto"
            )}>
                <SidebarContent isExpanded={isHovered} />
            </div>
        </motion.aside>
    );
}
