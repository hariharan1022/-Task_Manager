import axios from "axios";
import { getApiBaseUrl, usesRemoteApi } from "./apiConfig.js";
import { MAX_API_TIMEOUT_MS } from "./loadingConfig.js";

const REFRESH_KEY = "skyrovix_refresh_token";

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  timeout: MAX_API_TIMEOUT_MS,
});

let accessToken = null;
let onUnauthorized = null;
let onTokenRefreshed = null;
let isRefreshing = false;
let refreshQueue = [];

const isBrowser = typeof window !== "undefined";

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function setTokenRefreshedHandler(fn) {
  onTokenRefreshed = fn;
}

export function getStoredRefreshToken() {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token, remember = true) {
  if (!isBrowser) return;
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  if (token) {
    if (remember) localStorage.setItem(REFRESH_KEY, token);
    else sessionStorage.setItem(REFRESH_KEY, token);
  }
}

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status = err.response?.status;
    const isAuthEndpoint =
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/register") ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/forgot-password") ||
      original.url?.includes("/auth/reset-password") ||
      original.url?.includes("/auth/ping") ||
      original.url?.includes("/auth/me");

    if (status === 401 && !original._retry && !isAuthEndpoint) {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        onUnauthorized?.();
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, original });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { timeout: MAX_API_TIMEOUT_MS }
        );
        setAccessToken(data.accessToken);
        onTokenRefreshed?.(data.accessToken, data.refreshToken);
        accessToken = data.accessToken;

        refreshQueue.forEach(({ resolve, original: o }) => {
          o.headers = o.headers || {};
          o.headers.Authorization = `Bearer ${data.accessToken}`;
          resolve(api(o));
        });
        refreshQueue = [];

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];
        onUnauthorized?.();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      onUnauthorized?.();
    }
    return Promise.reject(err);
  }
);
