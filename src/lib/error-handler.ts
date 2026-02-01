import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/constants';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  const err = error as { code?: string; message?: string };

  // Erros comuns do Supabase
  if (err?.code === 'PGRST116') {
    return TOAST_MESSAGES.VIDEO_NOT_FOUND;
  }

  if (err?.code === '23505') {
    return 'Este item já existe.';
  }

  if (err?.code === '42501') {
    return TOAST_MESSAGES.AUTH_ERROR;
  }

  // Erros de rede
  if (err?.message?.includes('fetch')) {
    return TOAST_MESSAGES.NETWORK_ERROR;
  }

  // Erro genérico
  return err?.message || TOAST_MESSAGES.GENERIC_ERROR;
};

export const showErrorToast = (error: unknown) => {
  const message = handleApiError(error);
  toast.error(message);
};

export const showSuccessToast = (message: string = TOAST_MESSAGES.SUCCESS) => {
  toast.success(message);
};