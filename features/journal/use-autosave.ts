"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "saved-offline" | "error";

/**
 * Debounced autosave with honest status. `save` must resolve only when the
 * write is acknowledged. Offline, Firestore queues writes locally and the
 * promise stays pending, so after a grace period we report "saved on device"
 * rather than pretending the server has it.
 */
export function useAutosave<T>(save: (value: T) => Promise<void>, delay = 900) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<T | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const value = latest.current;
    if (value === null) return;
    latest.current = null;
    setStatus("saving");
    try {
      const write = saveRef.current(value);
      const outcome = await Promise.race([
        write.then(() => "ok" as const),
        new Promise<"slow">((r) => setTimeout(() => r("slow"), 3000)),
      ]);
      setStatus(
        outcome === "ok" ? "saved" : navigator.onLine ? "saving" : "saved-offline",
      );
      if (outcome === "slow") {
        void write
          .then(() => setStatus((s) => (latest.current === null ? "saved" : s)))
          .catch(() => setStatus("error"));
      }
    } catch (error) {
      console.error("Autosave failed", error);
      setStatus("error");
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      latest.current = value;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), delay);
    },
    [delay, flush],
  );

  // Don't lose pending edits when the editor unmounts or the tab is hidden.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush]);

  return { status, schedule, flush };
}

export const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  "saved-offline": "Saved on this device · will sync",
  error: "Couldn't save — retrying on next edit",
};
