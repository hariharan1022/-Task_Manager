/** Base path for GitHub Pages (e.g. /-Task_Manager/) or / for local dev */
export function routerBasename() {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") return undefined;
  return base.replace(/\/$/, "");
}

/** Public asset URL (logo, images in /public) */
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}

/** In-app hash link respecting GitHub Pages base path */
export function hashLink(id) {
  const base = import.meta.env.BASE_URL || "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${root}#${id}`;
}

/** Public verification page URL for documents */
export function verifyPageUrl(type, id) {
  const base = import.meta.env.BASE_URL || "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://hariharan1022.github.io";
  const path = `${root}/verify/${type}/${encodeURIComponent(id)}`.replace(/\/+/g, "/");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function verifySearchUrl(id) {
  const base = import.meta.env.BASE_URL || "/";
  const root = base.endsWith("/") ? base.slice(0, -1) : base;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://hariharan1022.github.io";
  const path = `${root}/verify?q=${encodeURIComponent(id)}`.replace(/\/+/g, "/");
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
