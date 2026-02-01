"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthProvider";
import { ThemeProvider } from "@/context/ThemeProvider";
import { GamificationProvider } from "@/context/GamificationProvider";
import { PlayerProvider } from "@/context/PlayerProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Cria uma instância do QueryClient para cada sessão do navegador (client-side)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
            <GamificationProvider>
              <PlayerProvider>
                <TooltipProvider>
                  {children}
                  <Toaster />
                </TooltipProvider>
              </PlayerProvider>
            </GamificationProvider>
          </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
