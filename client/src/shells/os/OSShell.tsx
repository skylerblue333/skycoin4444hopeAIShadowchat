/**
 * OSShell — Unified OS Shell
 * Wraps the entire app in the new AI OS interface.
 * Modes: Discover (feed) / Execute (chat+actions) / Identity (profile+wallet)
 * Legacy mode toggle switches to the old shell instantly.
 */
import { useAppStore } from "@/shared/state/appStore";
import { TopCommandBar } from "./TopCommandBar";
import { QuickLaunchBar } from "./QuickLaunchBar";
import { DiscoverMode } from "./modes/DiscoverMode";
import { ExecuteMode } from "./modes/ExecuteMode";
import { IdentityMode } from "./modes/IdentityMode";

export function OSShell() {
  const { mode } = useAppStore();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopCommandBar />
      <QuickLaunchBar />
      <main className="flex-1">
        {mode === "discover" && <DiscoverMode />}
        {mode === "execute" && <ExecuteMode />}
        {mode === "identity" && <IdentityMode />}
      </main>
    </div>
  );
}
