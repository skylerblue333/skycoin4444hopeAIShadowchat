import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { UserRole } from '@shared/types';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { inferAsyncReturnType } from "@trpc/server";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export type MiddlewareFunction = Parameters<typeof t.middleware>[0];

// Define baseRequireUser middleware
const requireUserMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Define baseRequireRole middleware factory
const requireRoleMiddleware = (roles: UserRole[]) => t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: UNAUTHED_ERR_MSG });
  }
  if (!roles.includes(ctx.user.role as UserRole)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: NOT_ADMIN_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Export procedures
export const protectedProcedure = publicProcedure.use(requireUserMiddleware);
export const adminProcedure = protectedProcedure.use(requireRoleMiddleware(["admin"]));
export const merchantProcedure = protectedProcedure.use(requireRoleMiddleware(["admin", "merchant"])); // Assuming 'merchant' role exists or will be added
export const walletProcedure = protectedProcedure.use(requireRoleMiddleware(["admin", "user"])); // Assuming all authenticated users can access their wallet
export const treasuryProcedure = protectedProcedure.use(requireRoleMiddleware(["admin"])); // Assuming only admin can access treasury
