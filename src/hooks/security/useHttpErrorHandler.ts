import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpMsBussines, httpMsSecurity } from '@/infra/api/builderHttp';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

/**
 * Hook to handle HTTP errors globally
 * - 401 Unauthorized: Token missing, expired, or invalid → redirect to login
 * - 403 Forbidden: User authenticated but lacks permission → redirect to access-denied
 */
export const useHttpErrorHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (statusCode: number) => {
      if (statusCode === 401) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        void navigate('/login', { replace: true });
      } else if (statusCode === 403) {
        void navigate('/access-denied', { replace: true });
      }
    };

    httpMsSecurity.setErrorHandler(handler);
    httpMsBussines.setErrorHandler(handler);
  }, [navigate]);
};
