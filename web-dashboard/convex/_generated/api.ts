import { makeFunctionReference } from "convex/server";

/**
 * Minimal manual replacement for Convex codegen output.
 * This exists so the Next.js web-dashboard can build on Vercel without running `convex codegen`.
 *
 * IMPORTANT: The strings must match your Convex function names: "module:function".
 */
export const api = {
  auth: {
    signIn: makeFunctionReference<"action">("auth:signIn"),
    signUp: makeFunctionReference<"action">("auth:signUp"),
  },
  preAuthCheck: {
    getPreAuthOrders: makeFunctionReference<"query">("preAuthCheck:getPreAuthOrders"),
    getPostAuthOrders: makeFunctionReference<"query">("preAuthCheck:getPostAuthOrders"),
  },
};
