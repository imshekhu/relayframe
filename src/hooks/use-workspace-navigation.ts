"use client";

import { useCallback, useSyncExternalStore } from "react";

export type WorkspaceView =
  | "home"
  | "studio"
  | "projects"
  | "library"
  | "jobs"
  | "brand"
  | "billing";

const validViews = new Set<WorkspaceView>([
  "home",
  "studio",
  "projects",
  "library",
  "jobs",
  "brand",
  "billing",
]);

function viewFromUrl(): WorkspaceView {
  const value = new URLSearchParams(window.location.search).get("view");
  return value && validViews.has(value as WorkspaceView)
    ? (value as WorkspaceView)
    : "studio";
}

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

export function useWorkspaceNavigation() {
  const view = useSyncExternalStore(subscribe, viewFromUrl, () => "studio");
  const navigate = useCallback((next: WorkspaceView) => {
    const url = new URL(window.location.href);
    if (next === "studio") url.searchParams.delete("view");
    else url.searchParams.set("view", next);
    window.history.pushState({}, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
  return { view, navigate };
}
