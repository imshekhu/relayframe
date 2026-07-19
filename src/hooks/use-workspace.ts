"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { WorkspaceSnapshot } from "@/domain/workspace";

export type WorkspaceConnection = "online" | "refreshing" | "degraded";

export function useWorkspaceState(initialSnapshot: WorkspaceSnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [connection, setConnection] =
    useState<WorkspaceConnection>("online");
  const requestRef = useRef<AbortController | null>(null);

  const applySnapshot = useCallback((next: WorkspaceSnapshot) => {
    setSnapshot((current) =>
      new Date(next.snapshotAt).getTime() >=
      new Date(current.snapshotAt).getTime()
        ? next
        : current,
    );
  }, []);

  const refresh = useCallback(
    async (options?: { syncGenerations?: boolean }) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      setConnection("refreshing");
      try {
        const response = await fetch(
          options?.syncGenerations ? "/api/generations/sync" : "/api/demo",
          {
            method: options?.syncGenerations ? "POST" : "GET",
            headers: {
              "x-relayframe-organization": "org_demo",
            },
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("Workspace refresh failed");
        applySnapshot((await response.json()) as WorkspaceSnapshot);
        setConnection("online");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setConnection("degraded");
        throw error;
      }
    },
    [applySnapshot],
  );

  const hasLiveGenerations = snapshot.generations.some(
    (generation) =>
      !["completed", "failed", "rejected", "cancelled"].includes(
        generation.state,
      ),
  );

  useEffect(() => {
    if (!hasLiveGenerations) return;
    let cancelled = false;
    let timer: number | undefined;
    let delay = 900;

    const schedule = () => {
      if (cancelled) return;
      timer = window.setTimeout(tick, document.hidden ? 5_000 : delay);
    };
    const tick = async () => {
      if (cancelled) return;
      try {
        await refresh({ syncGenerations: true });
        delay = 900;
      } catch {
        delay = Math.min(delay * 1.8, 8_000);
      }
      schedule();
    };
    const visibility = () => {
      if (!document.hidden) {
        if (timer) window.clearTimeout(timer);
        void tick();
      }
    };

    schedule();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      requestRef.current?.abort();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [hasLiveGenerations, refresh]);

  return {
    snapshot,
    refresh,
    connection,
    hasLiveGenerations,
  };
}

export function useNotice(timeoutMs = 6_000) {
  const [notice, setNotice] = useState<string | null>(null);
  const notify = useCallback((message: string) => {
    setNotice(message);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [notice, timeoutMs]);
  return { notice, notify, dismiss: () => setNotice(null) };
}
