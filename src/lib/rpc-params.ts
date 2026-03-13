/**
 * Converts all undefined values in an RPC params object to null.
 * Supabase RPCs require null for missing optional params, not undefined.
 *
 * @see docs/specs/fix-rpc-param-null-guard.md
 */
export function sanitizeRpcParams<T extends Record<string, unknown>>(params: T): {
  [K in keyof T]: Exclude<T[K], undefined>
} {
  const sanitized = { ...params };
  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] === undefined) {
      (sanitized as Record<string, unknown>)[key] = null;
    }
  }
  return sanitized as { [K in keyof T]: Exclude<T[K], undefined> };
}
