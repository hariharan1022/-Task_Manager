const EVENT_NAME = "app:refresh-dashboard";

export function emitDashboardRefresh(source) {
  console.log("[refreshEvents] Emitting dashboard refresh from:", source);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { source, time: Date.now() } }));
}

export function listenDashboardRefresh(handler) {
  const wrapped = (e) => {
    console.log("[refreshEvents] Dashboard refresh event received:", e.detail);
    handler(e.detail);
  };
  window.addEventListener(EVENT_NAME, wrapped);
  return () => window.removeEventListener(EVENT_NAME, wrapped);
}

export function formatLastFetched(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
