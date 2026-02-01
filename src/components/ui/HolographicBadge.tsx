"use client";

import React, { MouseEvent, useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HolographicBadgeProps {
  label: string;
  subLabel?: string;
  color: string;
  icon: ReactNode;
  isLocked?: boolean;
  className?: string;
}

const identityMatrix =
  "1, 0, 0, 0, " +
  "0, 1, 0, 0, " +
  "0, 0, 1, 0, " +
  "0, 0, 0, 1";

const maxRotate = 0.20;
const minRotate = -0.20;
const maxScale = 1.02;
const minScale = 0.98;

export const HolographicBadge = ({ 
  label, 
  subLabel = "AMAROTUBE", 
  color, 
  icon, 
  isLocked = false,
  className 
}: HolographicBadgeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [firstOverlayPosition, setFirstOverlayPosition] = useState<number>(0);
  const [matrix, setMatrix] = useState<string>(identityMatrix);
  const [currentMatrix, setCurrentMatrix] = useState<string>(identityMatrix);
  const [disableInOutOverlayAnimation, setDisableInOutOverlayAnimation] = useState<boolean>(true);
  const [disableOverlayAnimation, setDisableOverlayAnimation] = useState<boolean>(false);
  const [isTimeoutFinished, setIsTimeoutFinished] = useState<boolean>(false);
  
  const enterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout3 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getDimensions = () => {
    const rect = ref?.current?.getBoundingClientRect();
    return {
      left: rect?.left || 0,
      right: rect?.right || 0,
      top: rect?.top || 0,
      bottom: rect?.bottom || 0,
    };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - (maxScale - minScale) * Math.abs(xCenter - clientX) / (xCenter - left),
      maxScale - (maxScale - minScale) * Math.abs(yCenter - clientY) / (yCenter - top),
      maxScale - (maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / (xCenter - left + yCenter - top)
    ];

    const rotate = {
      x1: 0.15 * ((yCenter - clientY) / yCenter - (xCenter - clientX) / xCenter),
      x2: maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left),
      x3: 0,
      y0: 0,
      y2: maxRotate - (maxRotate - minRotate) * (top - clientY) / (top - bottom),
      y3: 0,
      z0: -(maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left)),
      z1: (0.2 - (0.2 + 0.6) * (top - clientY) / (top - bottom)),
      z3: 0
    };
    return `${scale[0]}, ${rotate.y0}, ${rotate.z0}, 0, ` +
      `${rotate.x1}, ${scale[1]}, ${rotate.z1}, 0, ` +
      `${rotate.x2}, ${rotate.y2}, ${scale[2]}, 0, ` +
      `${rotate.x3}, ${rotate.y3}, ${rotate.z3}, 1`;
  };

  const getOppositeMatrix = (_matrix: string, clientY: number, onMouseEnter?: boolean) => {
    const { top, bottom } = getDimensions();
    const oppositeY = bottom - clientY + top;
    const weakening = onMouseEnter ? 0.7 : 4;
    const multiplier = onMouseEnter ? -1 : 1;

    return _matrix.split(", ").map((item, index) => {
      if (index === 2 || index === 4 || index === 8) {
        return (-parseFloat(item) * multiplier / weakening).toString();
      } else if (index === 0 || index === 5 || index === 10) {
        return "1";
      } else if (index === 6) {
        return (multiplier * (maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening).toString();
      } else if (index === 9) {
        return ((maxRotate - (maxRotate - minRotate) * (top - oppositeY) / (top - bottom)) / weakening).toString();
      }
      return item;
    }).join(", ");
  };

  const onMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    if (leaveTimeout1.current) clearTimeout(leaveTimeout1.current);
    if (leaveTimeout2.current) clearTimeout(leaveTimeout2.current);
    if (leaveTimeout3.current) clearTimeout(leaveTimeout3.current);
    
    setDisableOverlayAnimation(true);
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setDisableInOutOverlayAnimation(false);
    enterTimeout.current = setTimeout(() => setDisableInOutOverlayAnimation(true), 350);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFirstOverlayPosition((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5);
      });
    });

    const mat = getMatrix(e.clientX, e.clientY);
    setMatrix(getOppositeMatrix(mat, e.clientY, true));
    setIsTimeoutFinished(false);
    setTimeout(() => setIsTimeoutFinished(true), 200);
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    setTimeout(() => setFirstOverlayPosition((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5), 150);

    if (isTimeoutFinished) {
      setCurrentMatrix(getMatrix(e.clientX, e.clientY));
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const oppositeMatrix = getOppositeMatrix(matrix, e.clientY);

    if (enterTimeout.current) clearTimeout(enterTimeout.current);

    setCurrentMatrix(oppositeMatrix);
    setTimeout(() => setCurrentMatrix(identityMatrix), 200);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setDisableInOutOverlayAnimation(false);
        leaveTimeout1.current = setTimeout(() => setFirstOverlayPosition(-firstOverlayPosition / 4), 150);
        leaveTimeout2.current = setTimeout(() => setFirstOverlayPosition(0), 300);
        leaveTimeout3.current = setTimeout(() => {
          setDisableOverlayAnimation(false);
          setDisableInOutOverlayAnimation(true);
        }, 500);
      });
    });
  };

  useEffect(() => {
    if (isTimeoutFinished) {
      setMatrix(currentMatrix);
    }
  }, [currentMatrix, isTimeoutFinished]);

  const overlayAnimations = [...Array(10).keys()].map((e) => (
    `@keyframes overlayAnimation${e + 1} {
      0% { transform: rotate(${e * 10}deg); }
      50% { transform: rotate(${(e + 1) * 10}deg); }
      100% { transform: rotate(${e * 10}deg); }
    }`
  )).join(" ");

  return (
    <div
      ref={ref}
      className={cn("relative block w-full max-w-[165px] md:max-w-[210px] transition-none group/badge select-none", className)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      <style>{overlayAnimations}</style>
      <div
        style={{
          transform: `perspective(800px) matrix3d(${matrix})`,
          transformOrigin: "center center",
          transition: "transform 250ms ease-out",
          willChange: "transform"
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 74" className="w-full h-auto drop-shadow-2xl">
          <defs>
            <filter id="badgeBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="badgeMaskInner">
              <rect width="220" height="74" fill="white" rx="16" />
            </mask>
          </defs>
          
          <rect width="220" height="74" rx="16" fill={isLocked ? "#3f3f46" : color} className="transition-colors duration-500" />
          <rect x="4" y="4" width="212" height="66" rx="14" fill="transparent" stroke="white" strokeOpacity={isLocked ? "0.1" : "0.2"} strokeWidth="1.5" />
          
          <text fontFamily="Outfit, sans-serif" fontSize="9" fontWeight="900" fill={isLocked ? "#71717a" : "#18181b"} fillOpacity={isLocked ? "0.6" : "0.5"} x="62" y="28" className="tracking-[0.15em] uppercase">
            {subLabel}
          </text>
          <text fontFamily="Outfit, sans-serif" fontSize="18" fontWeight="900" fill={isLocked ? "#a1a1aa" : "#18181b"} x="60" y="54" className="tracking-tight">
            {label}
          </text>

          <g transform="translate(16, 19)">
             <foreignObject width="36" height="36">
                <div className={cn(
                  "w-full h-full flex items-center justify-center transition-all duration-500",
                  isLocked ? "text-zinc-600" : ""
                )}>
                  {React.cloneElement(icon as React.ReactElement<{ size?: number; strokeWidth?: number }>, { 
                    size: 24,
                    ...(isLocked ? {} : { strokeWidth: 2.5 })
                  })}
                </div>
             </foreignObject>
          </g>

          {!isLocked && (
            <g style={{ mixBlendMode: "overlay" }} mask="url(#badgeMaskInner)">
              {[...Array(10).keys()].map((i) => (
                <g key={i} style={{
                  transform: `rotate(${firstOverlayPosition + (i * 10)}deg)`,
                  transformOrigin: "center center",
                  transition: !disableInOutOverlayAnimation ? "transform 200ms ease-out" : "none",
                  animation: disableOverlayAnimation ? "none" : `overlayAnimation${i + 1} ${4 + i * 0.2}s infinite ease-in-out`,
                  willChange: "transform"
                }}>
                  <polygon 
                    points="0,0 220,74 220,0 0,74" 
                    fill={`hsl(${i * 36}, 100%, 65%)`} 
                    filter="url(#badgeBlur)" 
                    opacity="0.45" 
                  />
                </g>
              ))}
            </g>
          )}
          
          {isLocked && (
            <rect width="220" height="74" rx="16" fill="black" fillOpacity="0.25" />
          )}
        </svg>
      </div>
    </div>
  );
};