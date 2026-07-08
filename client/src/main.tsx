import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { DatingNotificationProvider } from "./contexts/DatingNotificationContext";
import "./index.css";

const queryClient = new QueryClient();

// OAuth redirect disabled - public access enabled
const redirectToLoginIfUnauthorized = (error: unknown) => {
  // Disabled: OAuth authentication removed
  // Users can now access the platform without login
  };

// Query cache error handling - OAuth disabled
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // OAuth redirect disabled - errors logged but not redirected
      }
});

// Mutation cache error handling - OAuth disabled
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    // OAuth redirect disabled - errors logged but not redirected
      }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <DatingNotificationProvider>
        <App />
      </DatingNotificationProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
