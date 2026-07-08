/**
 * AppShell — Universe UI Entry Point
 *
 * This is the world system connector:
 *
 *   <WorldProvider>        ← world state (entities, feed, trends)
 *     <EventProvider>      ← event bus (actions, notifications)
 *       <AppShell />       ← module router + OS shell
 *     </EventProvider>
 *   </WorldProvider>
 *
 * AppShell renders:
 * - OS Shell (Discover / Execute / Identity modes) when shell=os
 * - Legacy Router (all 184+ pages) when shell=legacy
 * - Ambient notification layer (always present)
 * - Voice command listener (always active)
 *
 * Every module plugs into the same world state.
 * No architectural rewrites needed as system grows.
 */
import { useEffect } from "react";
import { useAppStore } from "@/shared/state/appStore";
import { useEventBus } from "./EventContext";
import { useWorld } from "./WorldContext";
import { OSShell } from "@/shells/os/OSShell";

// Ambient notification toast for world events
function AmbientNotificationLayer() {
  const { subscribe } = useEventBus();
  const { tick } = useWorld();

  useEffect(() => {
    // Subscribe to key events for ambient notifications
    const unsubs = [
      subscribe("action:completed", (event) => {
              }),
      subscribe("payment:confirmed", (event) => {
              }),
      subscribe("match:new", (event) => {
              }),
    ];
    return () => unsubs.forEach(u => u());
  }, [subscribe]);

  // Emit world tick event when simulation advances
  const { emit } = useEventBus();
  useEffect(() => {
    if (tick > 0) {
      emit("world:tick", { tick }, "simulation");
    }
  }, [tick, emit]);

  return null;
}

export default function AppShell() {
  const { shell } = useAppStore();

  return (
    <>
      <AmbientNotificationLayer />
      {/* OS Shell handles both "os" and "legacy" modes internally */}
      <OSShell />
    </>
  );
}
