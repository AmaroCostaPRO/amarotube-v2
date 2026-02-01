"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BadgeDeckProps {
  children: React.ReactNode[];
  className?: string;
}

export function BadgeDeck({ children, className }: BadgeDeckProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const validChildren = React.Children.toArray(children).filter(Boolean);
  const count = validChildren.length;
  if (count === 0) return null;

  const itemWidth = isMobile ? 160 : 212; 
  const itemHeight = isMobile ? 54 : 73; 
  const gap = 12;

  const cols = 2;
  const rows = Math.ceil(count / cols);
  
  const totalGridWidth = (cols * itemWidth) + ((cols - 1) * gap);
  const totalGridHeight = (rows * itemHeight) + ((rows - 1) * gap);

  // Offset vertical das badges mantido em 25px
  const mobileOffsetY = isMobile ? 25 : 0;

  return (
    <motion.div 
      className={cn("relative flex flex-col items-center select-none transition-none", className)}
      initial={false}
      animate={{ 
        // No mobile, expande 30px além da altura original para empurrar o conteúdo abaixo
        height: isMobile && isExpanded 
          ? itemHeight + 30 
          : itemHeight 
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <div 
        className="relative flex items-center justify-center w-full cursor-pointer"
        style={{ height: itemHeight }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {validChildren.map((child, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);

          const baseX = (col * (itemWidth + gap)) - (totalGridWidth / 2) + (itemWidth / 2);
          const baseY = (row * (itemHeight + gap)) - (totalGridHeight / 2) + (itemHeight / 2);

          const targetX = isExpanded ? baseX : 0;
          const targetY = isExpanded ? (baseY + mobileOffsetY) : 0;

          return (
            <motion.div
              key={index}
              initial={false}
              animate={{
                x: targetX,
                y: targetY,
                scale: isExpanded ? 1 : 1 - (index * 0.03),
                rotate: isExpanded ? 0 : (index * 2),
                zIndex: isExpanded ? 100 : 50 - index,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.5
              }}
              className="absolute"
              style={{ 
                width: itemWidth,
                height: itemHeight,
                pointerEvents: isExpanded || index === 0 ? 'auto' : 'none'
              }}
            >
              <div className="w-full h-full rounded-2xl overflow-hidden glass-panel-matte ring-1 ring-white/10">
                {child}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}