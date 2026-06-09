/** All loading states: minimum 2s display, maximum 5s API wait */
export const MIN_LOADING_MS = 500;
export const MAX_API_TIMEOUT_MS = 5000;

export async function withMinLoading(promise, minMs = MIN_LOADING_MS) {
  const started = Date.now();
  const result = await promise;
  const remaining = minMs - (Date.now() - started);
  if (remaining > 0) {
    await new Promise((r) => setTimeout(r, remaining));
  }
  return result;
}

export function apiTimeout(override) {
  return override ?? MAX_API_TIMEOUT_MS;
}
