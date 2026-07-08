import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function getLoginUrl(returnPath?: string) {
  const origin = window.location.origin;
  const state = btoa(JSON.stringify({ origin, returnPath }));
  return `${process.env.VITE_OAUTH_PORTAL_URL}?state=${state}`;
}
