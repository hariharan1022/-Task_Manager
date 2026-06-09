/** Live API (Render). Deploy once via render.yaml — see README GitHub Pages section. */
export const DEFAULT_PRODUCTION_API = "https://skyrovix-task-manager-api.onrender.com/api";

export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.PROD) return DEFAULT_PRODUCTION_API.replace(/\/$/, "");
  return "/api";
}

export function getHealthUrl() {
  const base = getApiBaseUrl();
  return `${base}/health`;
}

export function isHostedOnGitHubPages() {
  return (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("github.io")
  );
}

/** True when the app calls Render (or any external API), not the Vite /api proxy */
export function usesRemoteApi() {
  return getApiBaseUrl().startsWith("http");
}

export function isLocalDev() {
  return import.meta.env.DEV && !usesRemoteApi();
}
