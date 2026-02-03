import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Função para formatar números com separador de milhar (ponto)
export const formatNumber = (num: number | string | undefined): string => {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  return n.toLocaleString('pt-BR');
};

/**
 * Formata números grandes em formato compacto legível
 * @example formatCompactNumber(1500) => "1,5k"
 * @example formatCompactNumber(1234567) => "1,2M"
 */
export const formatCompactNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace('.', ',')}k`;
  }
  return num.toString();
};

// Função para formatar a variação (delta)
export const formatDelta = (delta: number | undefined): string => {
  if (delta === undefined || delta === null || delta === 0) return '';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toLocaleString('pt-BR')}`;
};