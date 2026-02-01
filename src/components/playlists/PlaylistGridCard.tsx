"use client";

import React from "react";
import { motion } from "framer-motion";
import { Play, Lock, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PlaylistGridCardProps {
  id: string;
  title: string;
  videoCount: number;
  coverImages: string[];
  isPrivate: boolean;
  ownerName: string;
}

export function PlaylistGridCard({
  id,
  title,
  videoCount,
  coverImages,
  isPrivate,
  ownerName,
}: PlaylistGridCardProps) {
  // Pegamos até 8 imagens reais ou mantemos como null para mostrar o fundo do tema
  const displayImages = [...coverImages, ...Array(8).fill(null)].slice(0, 8);

  const privacyStyles = isPrivate
    ? "bg-red-500/10 text-red-500 border-red-500/20"
    : "bg-green-500/10 text-green-500 border-green-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col overflow-hidden rounded-xl sm:rounded-[2.5rem] glass-panel border-none shadow-xl hover:shadow-2xl"
    >
      {/* Seção Superior: Grid de Thumbs com Overlay de Ações */}
      <div className="relative p-4 overflow-hidden">
        {/* Grid de Imagens com desfoque no hover da div pai */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 aspect-[2/1] transition-all duration-500 group-hover:blur-md group-hover:scale-105">
          {displayImages.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5"
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* Overlay de Botões (Aparece apenas no Hover) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 backdrop-blur-[2px]">
          <Link href={`/playlists/${id}`}>
            <Button
              className="rounded-xl h-12 px-6 font-black text-xs uppercase gap-2 bg-white text-black hover:bg-white/90 shadow-2xl transition-transform active:scale-95"
            >
              Abrir <ExternalLink size={16} />
            </Button>
          </Link>
          <Link href={`/playlists/${id}?autoplay=true`}>
            <Button
              className="h-12 w-12 rounded-xl p-0 flex items-center justify-center neo-button bg-primary text-white shadow-2xl transition-transform active:scale-95"
            >
              <Play size={20} fill="currentColor" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Seção Inferior: Informações Estáticas (Sempre Visíveis) */}
      <div className="flex flex-col p-6 space-y-4 bg-white/5 dark:bg-black/20 border-t border-white/5">
        <div className="flex justify-between items-center">
          {/* Esquerda: Criador */}
          <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10 bg-white/5 text-foreground/40">
            @{ownerName}
          </div>

          {/* Direita: Tag de Privacidade */}
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5",
            privacyStyles
          )}>
            {isPrivate ? <Lock size={10} /> : <Globe size={10} />}
            {isPrivate ? "Privada" : "Pública"}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs font-bold opacity-40 uppercase tracking-tighter">
            {videoCount} Vídeos salvos
          </p>
        </div>
      </div>
    </motion.div>
  );
}
