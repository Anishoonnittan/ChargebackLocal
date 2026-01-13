import { useEffect, useMemo, useState } from "react";
import { useConvex } from "convex/react";

/**
* useSafeConvexQuery
*
* Why this exists:
* - In this project, we sometimes ship UI ahead of Convex deployment.
* - If the backend function doesn't exist yet, `useQuery()` will throw a red-screen error.
* - This hook uses the lower-level convex client and catches errors, so the UI can
*   gracefully fall back (e.g., show "Coming soon" instead of crashing).
*
* Note:
* - This is intentionally "best-effort". It should never block core app workflows.
*/
export function useSafeConvexQuery<TResult>(
// `any` is intentional: Convex query references are typed but we want this hook reusable.
queryRef: any,
args: any
): {
data: TResult | undefined;
error: unknown;
status: "loading" | "success" | "error";
} {
const convex = useConvex();

const stableArgs = useMemo(() => args, [JSON.stringify(args ?? {})]);

const [data, setData] = useState<TResult | undefined>(undefined);
const [error, setError] = useState<unknown>(null);
const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

useEffect(() => {
let cancelled = false;

async function run() {
setStatus("loading");
setError(null);

try {
const result = await convex.query(queryRef, stableArgs);
if (cancelled) return;
setData(result as TResult);
setStatus("success");
} catch (err) {
if (cancelled) return;
// Important: do not throw. We want the UI to stay alive.
setData(undefined);
setError(err);
setStatus("error");
}
}

void run();

return () => {
cancelled = true;
};
}, [convex, queryRef, stableArgs]);

return { data, error, status };
}
