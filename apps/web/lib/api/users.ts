import { apiClient } from './client';
import type { PublicUser, GameArchiveEntry, HeadToHeadStats } from '@checkmate/shared-types';

export const updateMe = (data: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  avatarFile?: File;
  country?: string;
}) => {
  if (data.avatarFile) {
    const formData = new FormData();
    if (data.displayName) formData.append('displayName', data.displayName);
    if (data.country) formData.append('country', data.country);
    if (data.bio) formData.append('bio', data.bio);
    if (data.avatarUrl) formData.append('avatarUrl', data.avatarUrl);
    formData.append('avatar', data.avatarFile);
    
    return apiClient.patch('/v1/users/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  return apiClient.patch('/v1/users/me', data);
};

export const getPublicProfile = (uid: string) =>
  apiClient.get<{ data: { user: PublicUser } }>(`/v1/users/${uid}`);

export const getUserGameHistory = (uid: string, limit = 15) =>
  apiClient.get<{ data: { games: GameArchiveEntry[]; total: number } }>(`/v1/users/${uid}/games`, {
    params: { limit },
  });

export const getHeadToHead = (uid: string, callerUid?: string) =>
  apiClient.get<{ data: { stats: HeadToHeadStats } }>(`/v1/users/${uid}/head-to-head`, {
    params: { callerUid },
  });
