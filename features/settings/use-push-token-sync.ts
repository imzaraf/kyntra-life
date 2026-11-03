"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { getPushSupport, syncPushToken } from "@/lib/notifications/fcm";

/**
 * Keeps this device registered for push whenever the user is signed in and has already
 * allowed notifications. Runs once per app start (tokens can rotate, so it's refreshed
 * each time), independent of whether the Settings page is ever opened.
 * It never asks for permission — that only happens from an explicit button press.
 */
export function usePushTokenSync() {
  const { user } = useAuth();
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void (async () => {
      try {
        const support = await getPushSupport();
        if (cancelled || support.state !== "granted") return;
        await syncPushToken(uid);
      } catch (error) {
        console.error("Push registration failed", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);
}
