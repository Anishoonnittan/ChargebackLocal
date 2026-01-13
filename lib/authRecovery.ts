export type AuthRecoveryResult = {
  cleared: Array<string>;
  errors: Array<{ key: string; error: string }>;
};

const KNOWN_AUTH_STORAGE_KEYS: Array<string> = [
  // Common keys used by various Convex auth helpers / app code.
  "convexAuthToken",
  "convex-auth-token",
  "__convexAuthToken",
  "__convexAuth",
  "convexAuth",
  "convex_auth",

  // Additional keys we've seen in the wild during auth loops.
  "convex",
  "convex-token",
  "convexToken",
];

function isProbablyConvexAuthKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (KNOWN_AUTH_STORAGE_KEYS.includes(key)) return true;

  // Always treat explicit providers / Convex-related keys as auth-ish.
  if (lower.includes("convex")) return true;
  if (lower.includes("oidc")) return true;
  if (lower.includes("auth0")) return true;
  if (lower.includes("clerk")) return true;

  // Token/session keys can be broad; only clear them if they look auth-related.
  const mentionsTokenish =
    lower.includes("token") ||
    lower.includes("id_token") ||
    lower.includes("access_token") ||
    lower.includes("refresh_token");
  const mentionsSessionish = lower.includes("session");
  const mentionsAuthish = lower.includes("auth") || lower.includes("jwks") || lower.includes("jwt");

  return (mentionsAuthish && (mentionsTokenish || mentionsSessionish)) || (mentionsTokenish && mentionsSessionish);
}

function clearMatchingKeysFromStorage(storage: any, result: AuthRecoveryResult): void {
  const keys: Array<string> = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k) keys.push(k);
  }

  for (const key of keys) {
    if (!isProbablyConvexAuthKey(key)) continue;
    try {
      storage.removeItem(key);
      result.cleared.push(key);
    } catch (e: any) {
      result.errors.push({ key, error: e?.message ? String(e.message) : String(e) });
    }
  }
}

/**
 * Clears any persisted auth tokens that can cause an auth loop on web.
 *
 * Why: If a corrupted/expired token is stored, the client may repeatedly send it,
 * and the backend will reject it (e.g. "Could not verify OIDC token claim").
 * Clearing storage allows the app to reconnect unauthenticated and complete sign-in.
 */
export function clearWebAuthStorageIfAvailable(): AuthRecoveryResult {
  const result: AuthRecoveryResult = { cleared: [], errors: [] };

  // Only available on web.
  const local = (globalThis as any)?.localStorage as any;
  const session = (globalThis as any)?.sessionStorage as any;
  if (!local && !session) {
    return result;
  }

  try {
    if (local) clearMatchingKeysFromStorage(local, result);
    if (session) clearMatchingKeysFromStorage(session, result);
  } catch (e: any) {
    result.errors.push({ key: "__clear__", error: e?.message ? String(e.message) : String(e) });
  }

  return result;
}

const RECOVERY_FLAG_KEY = "__scamvigil_web_auth_recovery_attempted_v1";

/**
 * Runs *once per browser tab* to break the common "bad token stuck in storage" loop.
 *
 * - If we find auth-ish keys, we clear them and force a reload.
 * - Uses sessionStorage so it won't permanently block future recovery attempts.
 */
export function attemptWebAuthRecoveryReloadOnce(): void {
  try {
    const session = (globalThis as any)?.sessionStorage as any;
    const location = (globalThis as any)?.location as any;

    if (!session || !location) return;
    if (session.getItem(RECOVERY_FLAG_KEY) === "1") return;

    const result = clearWebAuthStorageIfAvailable();

    if (result.cleared.length > 0) {
      // Set flag BEFORE reload to avoid reload loops.
      session.setItem(RECOVERY_FLAG_KEY, "1");
      // Keep log terse but useful for debugging.
      console.log("[AuthRecovery] Cleared web auth tokens:", result.cleared);
      location.reload();
    }
  } catch {
    // Never crash the app due to a recovery helper.
  }
}