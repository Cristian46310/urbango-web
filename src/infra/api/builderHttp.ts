import Http from "./http";

export const httpMsSecurity = Http(import.meta.env.VITE_URL_MS_SECURITY as string);
export const httpMsBussines = Http(import.meta.env.VITE_URL_MS_BUSSINES as string);
export const httpMsMessages = Http(import.meta.env.VITE_URL_MS_MESSAGES as string);