import { TRPCError } from "@trpc/server";
import type { MiddlewareFunction } from "../_core/trpc";

export const requireUser: MiddlewareFunction = async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "User not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
};
