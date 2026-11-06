/**
 * The only place app code may touch `console` (enforced by ESLint's
 * `no-console`). Debug and warning output only appears in development, or
 * when NEXT_PUBLIC_DEBUG=1, so production pages keep a clean browser console.
 * Errors from server code always go to the server logs (e.g. Vercel), and
 * never reach visitors' browsers.
 */
const verbose = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG === "1";

/* eslint-disable no-console */
export const log = {
  debug: (...args: unknown[]) => {
    if (verbose) console.debug(...args);
  },
  warn: (...args: unknown[]) => {
    if (verbose) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (typeof window === "undefined" || verbose) console.error(...args);
  },
};
/* eslint-enable no-console */
