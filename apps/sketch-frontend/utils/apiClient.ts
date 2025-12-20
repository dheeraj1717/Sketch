import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE } from "./urls";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Request interceptor to add the access token to the headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Don't retry refresh endpoint itself or if already retried
    if (
      originalRequest.url?.includes("/auth/refresh-token") ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // If error is 401, try to refresh
    if (error.response?.status === 401) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await apiClient.post("/auth/refresh-token");
        const { accessToken } = response.data;

        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          // Sync with AuthContext
          window.dispatchEvent(new CustomEvent("token-refreshed", { detail: accessToken }));
          
          processQueue();
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh failed, clear storage and maybe redirect
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          if (!window.location.pathname.includes("/login") && window.location.pathname !== "/") {
             window.location.href = "/";
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
