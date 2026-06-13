import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "./useSocket.js";
import { listenDashboardRefresh } from "./refreshEvents.js";

const DEFAULT_POLL_MS = 5000;

export function useRealtime({
  fetcher,
  events = [],
  pollMs = DEFAULT_POLL_MS,
  onData = null,
  source = "unknown",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    console.log(`[realtime:${source}] Fetch started at`, new Date().toISOString());
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        const now = new Date().toISOString();
        setLastFetched(now);
        if (onData) onData(result);
        console.log(`[realtime:${source}] Fetch completed`, JSON.stringify(result).slice(0, 150));
      }
    } catch (err) {
      console.error(`[realtime:${source}] Fetch error:`, err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [fetcher, onData, source]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    intervalRef.current = setInterval(load, pollMs);
    console.log(`[realtime:${source}] Polling every ${pollMs}ms`);

    const socket = getSocket();
    const handlers = {};
    for (const evt of events) {
      const handler = (payload) => {
        console.log(`[realtime:${source}] Socket event "${evt}" received:`, payload);
        load();
      };
      socket.on(evt, handler);
      handlers[evt] = handler;
    }

    const unlisten = listenDashboardRefresh(() => {
      console.log(`[realtime:${source}] Dashboard refresh event received`);
      load();
    });

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      for (const [evt, handler] of Object.entries(handlers)) {
        socket.off(evt, handler);
      }
      unlisten();
    };
  }, [load, events, pollMs, source]);

  return { data, loading, lastFetched, refresh: load };
}
