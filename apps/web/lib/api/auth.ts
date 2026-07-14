import { apiClient } from './client';

export const registerUser = (data: {
  displayName: string;
  email: string;
  country: string;
}) => apiClient.post('/v1/auth/register', data);

export const getMe = () => apiClient.get('/v1/auth/me');

export const verifyEmailOTP = (code: string) =>
  apiClient.post('/v1/auth/verify-email', { code });

export const resendVerificationEmail = () =>
  apiClient.post('/v1/auth/resend-verification', {});

export const createGuestSession = async () => {
  const { data } = await apiClient.post('/v1/auth/guest', {});
  return data.data; // { guestId, displayName, elo, expiresAt }
};
