import { useEffect, useRef, useState } from "react";
import { getSocket } from "./useSocket.js";
import { listenDashboardRefresh } from "./refreshEvents.js";

const DEFAULT_POLL_MS = 5000;

export function useAutoRefresh({
  onRefresh,
  events = [],
  pollMs = DEFAULT_POLL_MS,
  source = "page",
}) {
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);

  const refresh = () => {
    console.log(`[autoRefresh:${source}] Refresh triggered at`, new Date().toISOString());
    setLastFetched(new Date().toISOString());
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    console.log(`[autoRefresh:${source}] Starting polling every ${pollMs}ms`);

    const interval = setInterval(() => {
      if (onRefresh) onRefresh();
      setLastFetched(new Date().toISOString());
    }, pollMs);

    const socket = getSocket();
    const handlers = {};
    for (const evt of events) {
      const handler = (p) => {
        console.log(`[autoRefresh:${source}] Socket event "${evt}":`, p);
        refresh();
      };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }

    const unlisten = listenDashboardRefresh(() => refresh());

    return () => {
      clearInterval(interval);
      for (const [evt, handler] of Object.entries(handlers)) socket.off(evt, handler);
      unlisten();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { lastFetched, refresh };
}
