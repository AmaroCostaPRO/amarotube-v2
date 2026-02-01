export const PAGINATION = {
  PAGE_SIZE: 16,
  HISTORY_LIMIT: 20,
  PLAYLIST_LIMIT: 20,
  ACTIVITY_LIMIT: 10,
  GLOBAL_CHAT_LIMIT: 15,
} as const;

export const SORT_MODES = {
  RECENT: 'recent',
  POPULAR: 'popular',
  TOP: 'top',
} as const;

export const API_QUOTA = {
  DAILY_LIMIT: 10000,
  ALERT_THRESHOLD: 80,
} as const;

export const TOAST_MESSAGES = {
  NETWORK_ERROR: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  AUTH_ERROR: 'Sessão expirada. Por favor, faça login novamente.',
  GENERIC_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
  VIDEO_NOT_FOUND: 'Vídeo não encontrado.',
  PLAYLIST_NOT_FOUND: 'Playlist não encontrada.',
  SUCCESS: 'Operação realizada com sucesso!',
} as const;

export const URL_PATTERNS = {
  YOUTUBE: /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/,
} as const;

export const DEBOUNCE_TIMES = {
  SEARCH: 300,
  API_CALL: 1500,
  AUTO_SCROLL: 100,
} as const;