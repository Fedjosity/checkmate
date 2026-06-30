import { ApiResponse } from '@checkmate/shared-types';

export const success = <T>(data: T | null = null, message: string = 'Success'): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

export const error = (message: string = 'Error'): ApiResponse<null> => {
  return {
    success: false,
    message,
    data: null,
  };
};
