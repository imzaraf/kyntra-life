import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { getFirebase } from "@/lib/firebase/client";
import { tokenRepo } from "@/lib/repositories";

export type PushSupport =
  | { state: "unsupported"; reason: string }
  | { state: "unconfigured"; reason: string }
  | { state: "denied" }
  | { state: "default" }
  | { state: "granted" };

export async function getPushSupport(): Promise<PushSupport> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {
    return {
      state: "unsupported",
      reason: "This browser doesn't support notifications.",
    };
  }
  if (!(await isSupported()))
    return {
      state: "unsupported",
      reason: "Push messaging isn't available in this browser.",
    };
  if (!getFirebase().env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    return {
      state: "unconfigured",
      reason: "Push isn't configured: NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing.",
    };
  }
  const p = Notification.permission;
  return { state: p === "granted" ? "granted" : p === "denied" ? "denied" : "default" };
}

async function tokenId(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Get (or refresh) this device's FCM token and store it under the user. Idempotent. */
export async function syncPushToken(uid: string): Promise<void> {
  const { app, env } = getFirebase();
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), {
    vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("No FCM token was issued.");
  await tokenRepo.createWithId(uid, await tokenId(token), {
    token,
    userAgent: navigator.userAgent.slice(0, 200),
  });
}

/** Must be called from a user action (click): requests permission, then registers the token. */
export async function enablePush(
  uid: string,
): Promise<"granted" | "denied" | "dismissed"> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "dismissed";
  await syncPushToken(uid);
  return "granted";
}

export async function disablePush(uid: string): Promise<void> {
  const { app } = getFirebase();
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(app), {
    vapidKey: getFirebase().env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  }).catch(() => null);
  if (token) await tokenRepo.remove(uid, await tokenId(token)).catch(() => undefined);
  await deleteToken(getMessaging(app)).catch(() => undefined);
}
