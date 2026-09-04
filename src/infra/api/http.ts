import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

type ErrorHandler = (statusCode: number) => void;

class HttpClient {
  private instance: AxiosInstance;
  private responseInterceptorId: number | null = null;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
    });

    this.instance.interceptors.request.use((config) => {
      if (typeof window === 'undefined') {
        return config;
      }

      const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const headers = AxiosHeaders.from(config.headers);
      if (!token || headers.has("Authorization")) {
        return config;
      }

      headers.set('Authorization', `Bearer ${token}`);
      config.headers = headers;

      return config;
    });
  }

  setErrorHandler(handler: ErrorHandler) {
    // Replace any previous handler so React StrictMode remounts don't stack interceptors.
    if (this.responseInterceptorId !== null) {
      this.instance.interceptors.response.eject(this.responseInterceptorId);
      this.responseInterceptorId = null;
    }

    this.responseInterceptorId = this.instance.interceptors.response.use(
      (response) => response,
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            handler(status);
          }

          throw error;
        }

        throw new Error('Unexpected HTTP client error');
      }
    );
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(endpoint, data, config);
    return response.data;
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(endpoint, data, config);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(endpoint, data, config);
    return response.data;
  }

  async delete<T = void>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(endpoint, config);
    // 204 No Content — do not parse body
    if (response.status === 204 || response.data == null || response.data === "") {
      return undefined as T;
    }
    return response.data;
  }
}

const Http = (baseURL: string) => new HttpClient(baseURL);

export default Http;
