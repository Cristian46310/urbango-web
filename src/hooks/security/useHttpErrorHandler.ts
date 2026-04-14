import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { httpMsSecurity } from '@/infra/api/builderHttp';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

export const useHttpErrorHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    httpMsSecurity.setErrorHandler((statusCode: number) => {
      if (statusCode === 401 || statusCode === 403) {
        // Limpiar token del localStorage
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        // Redirigir al login
        void navigate('/login', { replace: true });
      }
    });
  }, [navigate]);
};
