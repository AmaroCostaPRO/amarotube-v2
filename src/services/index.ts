/**
 * Services Layer - Barrel Export
 * 
 * Centraliza todos os services para facilitar imports.
 * Exemplo: import { videoService, playlistService } from '@/services';
 */

// API Service (já existente - Edge Functions)
export { apiService } from './api';
export type { VideoDetails, SearchResult, LiveMetrics, VideoContext } from './api';

// Video Service
export { videoService } from './video.service';
export type { VideoMetrics, VideoWithMetrics } from './video.service';

// Comment Service
export { commentService } from './comment.service';

// Playlist Service
export { playlistService } from './playlist.service';
export type { PlaylistWithVideos, PlaylistVideo } from './playlist.service';

// Gamification Service
export { gamificationService } from './gamification.service';
export type { GamificationStats, LootboxResult, TransferResult } from './gamification.service';
