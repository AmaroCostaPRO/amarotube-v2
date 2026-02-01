import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar números com separador de milhar (ponto)
export const formatNumber = (num: number | string | undefined): string => {
  if (num === undefined || num === null) return 'N/A';
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  return n.toLocaleString('pt-BR');
};

// Função para formatar a variação (delta)
export const formatDelta = (delta: number | undefined): string => {
  if (delta === undefined || delta === null || delta === 0) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toLocaleString('pt-BR')}`;
};