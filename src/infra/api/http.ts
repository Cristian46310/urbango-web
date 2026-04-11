import axios, { AxiosHeaders, type AxiosInstance, type AxiosRequestConfig } from 'axios';

const AUTH_TOKEN_STORAGE_KEY = 'authToken';

type ErrorHandler = (statusCode: number) => void;

class HttpClient {
  private instance: AxiosInstance;

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
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          handler(error.response.status);
        }
        return Promise.reject(error);
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

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(endpoint, config);
    return response.data;
  }
}

const Http = (baseURL: string) => new HttpClient(baseURL);

export default Http;
