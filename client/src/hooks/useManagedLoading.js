import { useCallback, useRef, useState } from "react";
import { MIN_LOADING_MS, MAX_API_TIMEOUT_MS } from "../utils/loadingConfig.js";

/**
 * Page-level loading: enforces 2s minimum spinner, 5s max request time.
 */
export function useManagedLoading(initial = false) {
  const [loading, setLoading] = useState(initial);
  const startedRef = useRef(Date.now());

  const begin = useCallback(() => {
    startedRef.current = Date.now();
    setLoading(true);
  }, []);

  const end = useCallback(async () => {
    const elapsed = Date.now() - startedRef.current;
    const wait = Math.max(0, MIN_LOADING_MS - elapsed);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setLoading(false);
  }, []);

  const run = useCallback(
    async (promiseFactory) => {
      begin();
      try {
        const result = await Promise.race([
          promiseFactory(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), MAX_API_TIMEOUT_MS)
          ),
        ]);
        return result;
      } finally {
        await end();
      }
    },
    [begin, end]
  );

  return { loading, begin, end, run, setLoading };
}
