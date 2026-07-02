import { apiClient } from './client';

export const updateMe = (data: {
  displayName?: string;
  avatarUrl?: string;
  country?: string;
}) => apiClient.patch('/v1/users/me', data);

export const getPublicProfile = (uid: string) =>
  apiClient.get(`/v1/users/${uid}`);
