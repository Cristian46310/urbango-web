import Http from "./http";

export const httpMsSecurity = Http(import.meta.env.VITE_URL_MS_SECURITY as string);