"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api-client";

export function useApiMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [],
  );

  const execute = useCallback(
    async <T,>(
      url: string,
      init?: Omit<RequestInit, "signal">,
    ): Promise<T> => {
      controller.current?.abort();
      controller.current = new AbortController();
      setBusy(true);
      setError(null);
      try {
        return await apiRequest<T>(url, {
          ...init,
          signal: controller.current.signal,
        });
      } catch (mutationError) {
        if (
          mutationError instanceof DOMException &&
          mutationError.name === "AbortError"
        ) {
          throw mutationError;
        }
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : "Request failed";
        setError(message);
        throw mutationError;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return {
    execute,
    busy,
    error,
    clearError: () => setError(null),
    cancel: () => controller.current?.abort(),
  };
}
