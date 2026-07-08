import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // OAuth disabled - redirects are no longer enforced
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // OAuth disabled - auth.me query will fail gracefully for anonymous users
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    // Logout disabled - OAuth removed
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      // Suppress errors for anonymous users
      return;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);


  const state = useMemo(() => {
    // Store user info if available, otherwise allow anonymous access
    if (meQuery.data) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(meQuery.data)
      );
    }
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: null, // Suppress auth errors for anonymous users
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  // OAuth redirect disabled - public access enabled
  useEffect(() => {
    // Redirect behavior disabled
    // Users can now access the platform without authentication
  }, []);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
