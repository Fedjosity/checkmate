import { apiClient } from './client';
import type { Wallet } from '@checkmate/shared-types';

export const getBalance = () =>
  apiClient.get<{ wallet: Wallet }>('/v1/wallet/balance');
