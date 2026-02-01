import { z } from 'zod';
import { URL_PATTERNS } from '@/constants';

export const videoUrlSchema = z.object({
  url: z
    .string()
    .min(1, 'A URL do vídeo é obrigatória')
    .regex(URL_PATTERNS.YOUTUBE, 'URL do YouTube inválida'),
});

export const searchVideoSchema = z.object({
  query: z
    .string()
    .min(1, 'O termo de busca é obrigatório')
    .max(100, 'O termo de busca deve ter no máximo 100 caracteres'),
});

export const playlistSchema = z.object({
  title: z
    .string()
    .min(1, 'O título da playlist é obrigatório')
    .max(100, 'O título deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .max(500, 'A descrição deve ter no máximo 500 caracteres')
    .optional(),
  is_public: z.boolean().default(true),
});

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres')
    .max(30, 'O nome de usuário deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore são permitidos'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Schemas de Dados - Validação de Entidades
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema de validação para Video
 * Usado para validar dados vindos da API antes de processamento
 */
export const VideoSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  youtube_video_id: z.string().min(1),
  channel_id: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  thumbnail_url: z.string().url().nullable(),
  channel_name: z.string().nullable(),
  channel_avatar_url: z.string().url().nullable().optional(),
  channel_description: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  last_accessed_at: z.string().datetime().nullable(),
  is_from_channel_update: z.boolean().default(false),
  karma_score: z.number().int().optional(),
  is_nsfw: z.boolean().optional(),
  is_spoiler: z.boolean().optional(),
  summary: z.string().nullable().optional(),
});

/**
 * Schema de validação para UserProfile
 * Usado para validar dados de perfil do usuário
 */
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  username: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(30, 'Nome deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore')
    .nullable(),
  avatar_url: z.string().url().nullable(),
  avatar_border: z.string().nullable(),
  name_color: z.string().nullable(),
  role: z.enum(['user', 'admin']).nullable(),
  updated_at: z.string().datetime().nullable(),
  created_at: z.string().datetime().nullable().optional(),
  is_shadowbanned: z.boolean().optional(),
  is_approved: z.boolean().nullable(),
});

/**
 * Schema para validação de ações de gamificação
 */
export const GamificationActionSchema = z.object({
  amount: z.number().int().positive('Valor deve ser positivo'),
  statColumn: z.enum([
    'total_views',
    'total_likes',
    'received_likes',
    'received_upvotes',
    'total_logins',
  ]),
});

/**
 * Schema para transferência de pontos
 */
export const PointTransferSchema = z.object({
  targetUserId: z.string().uuid('ID de usuário inválido'),
  amount: z
    .number()
    .int()
    .positive('Valor deve ser positivo')
    .max(10000, 'Valor máximo: 10.000 pontos'),
});

export type VideoUrlForm = z.infer<typeof videoUrlSchema>;
export type SearchVideoForm = z.infer<typeof searchVideoSchema>;
export type PlaylistForm = z.infer<typeof playlistSchema>;
export type ProfileForm = z.infer<typeof profileSchema>;
export type VideoData = z.infer<typeof VideoSchema>;
export type UserProfileData = z.infer<typeof UserProfileSchema>;
export type GamificationAction = z.infer<typeof GamificationActionSchema>;
export type PointTransfer = z.infer<typeof PointTransferSchema>;
