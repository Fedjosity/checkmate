import { apiClient } from './client';

export const updateMe = (data: {
  displayName?: string;
  avatarUrl?: string;
  avatarFile?: File;
  country?: string;
}) => {
  if (data.avatarFile) {
    const formData = new FormData();
    if (data.displayName) formData.append('displayName', data.displayName);
    if (data.country) formData.append('country', data.country);
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
  apiClient.get(`/v1/users/${uid}`);
