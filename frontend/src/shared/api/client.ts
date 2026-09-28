import axios, { AxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""),
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      const detail: unknown = error.response?.data?.detail;
      return Promise.reject(
        new Error(
          typeof detail === "string"
            ? detail
            : `Ошибка API: ${error.response?.status ?? error.message}`,
        ),
      );
    }
    return Promise.reject(error);
  },
);

export const http = {
  get: async <T>(url: string): Promise<T> => (await apiClient.get<T>(url)).data,
  post: async <T, B>(url: string, body: B): Promise<T> =>
    (await apiClient.post<T>(url, body)).data,
};
