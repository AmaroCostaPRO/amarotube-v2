"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { Video } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PlaylistHeroAccordionProps {
  videos: Video[];
  playlistId: string;
}

const VISIBLE_COUNT = 8;

export function PlaylistHeroAccordion({ videos, playlistId }: PlaylistHeroAccordionProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // Reseta o index caso a playlist mude drasticamente
  useEffect(() => {
    setStartIndex(0);
    setActiveIndex(0);
  }, [playlistId]);

  if (!videos || videos.length === 0) return null;

  // Lógica de Preparação dos Vídeos (Cenário A vs B)
  const isSmallPlaylist = videos.length < VISIBLE_COUNT;

  const displayVideos = isSmallPlaylist
    ? Array.from({ length: VISIBLE_COUNT }, (_, i) => videos[i % videos.length])
    : videos.slice(startIndex, startIndex + VISIBLE_COUNT);

  // Controles de Navegação
  const canGoBack = startIndex > 0 && !isSmallPlaylist;
  const canGoForward = startIndex + VISIBLE_COUNT < videos.length && !isSmallPlaylist;

  const handleNext = () => setStartIndex((prev) => prev + 1);
  const handlePrev = () => setStartIndex((prev) => Math.max(0, prev - 1));

  const navBtnClasses =
    "absolute z-50 bg-black/50 backdrop-blur-md text-white border-white/10 hover:bg-primary hover:text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-2xl disabled:hidden";

  return (
    <div className="relative w-full group transition-none" data-aos="zoom-in">
      {/* Botões de Navegação - Desktop (Laterais) */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        disabled={!canGoBack}
        className={cn(navBtnClasses, "hidden md:flex left-4 top-1/2 -translate-y-1/2 h-12 w-12")}
      >
        <ChevronLeft size={24} />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={!canGoForward}
        className={cn(navBtnClasses, "hidden md:flex right-4 top-1/2 -translate-y-1/2 h-12 w-12")}
      >
        <ChevronRight size={24} />
      </Button>

      {/* Botões de Navegação - Mobile (Topo/Base) */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        disabled={!canGoBack}
        className={cn(navBtnClasses, "md:hidden flex top-2 left-1/2 -translate-x-1/2 h-10 w-10")}
      >
        <ChevronUp size={20} />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={!canGoForward}
        className={cn(navBtnClasses, "md:hidden flex bottom-2 left-1/2 -translate-x-1/2 h-10 w-10")}
      >
        <ChevronDown size={20} />
      </Button>

      {/* Container Principal */}
      <div
        className={cn(
          "relative w-full flex flex-col gap-2 h-[700px]", // Mobile: vertical mais alto para 8 itens
          "md:flex-row md:h-[400px]" // Desktop: Horizontal
        )}
      >
        {displayVideos.map((video, index) => {
          const isActive = activeIndex === index;
          // O index real na playlist original (para o link correto)
          const actualPlaylistIndex = isSmallPlaylist ? index % videos.length : startIndex + index;

          return (
            <div
              key={`${video.id}-${index}`} // Usando index como chave para permitir repetições
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative overflow-hidden rounded-2xl transition-[flex] duration-500 ease-out cursor-pointer group/item",
                isActive ? "flex-[3.5]" : "flex-[1]"
              )}
            >
              {/* Imagem de Fundo */}
              <img
                src={video.thumbnail_url || "/placeholder.svg"}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
              />

              {/* Overlay de Sombra */}
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-500",
                  isActive ? "bg-black/40 opacity-100" : "bg-black/20 opacity-40 hover:opacity-10"
                )}
              />

              {/* Conteúdo Expandido */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/95 via-black/20 to-transparent"
                  >
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1"
                        >
                          Vídeo #{actualPlaylistIndex + 1}
                        </motion.p>
                        <motion.h3
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.05 }}
                          className="text-white text-lg md:text-2xl font-black tracking-tight leading-tight truncate"
                        >
                          {video.title}
                        </motion.h3>
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1 truncate"
                        >
                          {video.channel_name}
                        </motion.p>
                      </div>

                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, type: "spring" }}
                        className="shrink-0"
                      >
                        <Link
                          href={`/watch/${video.id}?playlist=${playlistId}&index=${actualPlaylistIndex}`}
                          className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Play size={24} fill="currentColor" />
                        </Link>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicador de Número em fatias contraídas (PC) */}
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:block hidden">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 font-black text-2xl group-hover/item:text-white/40 transition-colors">
                    {actualPlaylistIndex + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
