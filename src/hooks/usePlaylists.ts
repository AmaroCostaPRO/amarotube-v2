import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { playlistService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import { Playlist } from '@/types';

type PlaylistsResponse = Playlist[];

const fetchMyPlaylists = async (userId: string): Promise<PlaylistsResponse> => {
  return playlistService.getMyPlaylists(userId);
};

const fetchCollaboratedPlaylists = async (userId: string): Promise<PlaylistsResponse> => {
  return playlistService.getCollaboratedPlaylists(userId);
};

const fetchPublicPlaylists = async (userId?: string): Promise<PlaylistsResponse> => {
  return playlistService.getPublicPlaylists(userId);
};

export const useMyPlaylists = (options?: Partial<UseQueryOptions<PlaylistsResponse, Error>>) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['myPlaylists', user?.id],
    queryFn: () => fetchMyPlaylists(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCollaboratedPlaylists = (options?: Partial<UseQueryOptions<PlaylistsResponse, Error>>) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['collaboratedPlaylists', user?.id],
    queryFn: () => fetchCollaboratedPlaylists(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const usePublicPlaylists = (options?: Partial<UseQueryOptions<PlaylistsResponse, Error>>) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['publicPlaylists', user?.id],
    queryFn: () => fetchPublicPlaylists(user?.id),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useInvalidatePlaylists = () => {
  const queryClient = useQueryClient();
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['myPlaylists'] });
      queryClient.invalidateQueries({ queryKey: ['collaboratedPlaylists'] });
      queryClient.invalidateQueries({ queryKey: ['publicPlaylists'] });
    }
  };
};