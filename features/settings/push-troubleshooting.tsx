"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import {
  collectPushDiagnostics,
  syncPushToken,
  type PushDiagnostics,
} from "@/lib/notifications/fcm";
import { describePushError } from "./push-errors";

interface Row {
  ok: boolean;
  label: string;
  detail: string;
}

function rows(d: PushDiagnostics): Row[] {
  return [
    {
      ok: d.vapidConfigured,
      label: "Web Push key in this build",
      detail: d.vapidConfigured
        ? "Present."
        : "Missing. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY (Vercel → Environment Variables) and redeploy, then reinstall the app.",
    },
    {
      ok: d.fcmSupported,
      label: "Browser supports web push",
      detail: d.fcmSupported
        ? "Yes."
        : "No. Try Chrome on Android, or install the app to the Home Screen on iPhone.",
    },
    {
      ok: d.permission === "granted",
      label: "Notification permission",
      detail:
        d.permission === "granted"
          ? "Allowed."
          : `Currently “${d.permission}”. Allow notifications for this site/app in system settings.`,
    },
    {
      ok: d.serviceWorker === "active",
      label: "Service worker",
      detail:
        d.serviceWorker === "active"
          ? "Active."
          : d.serviceWorker === "installing"
            ? "Still starting. Wait a few seconds and run the check again."
            : "Not registered. Reload the page; if it persists, reinstall the app.",
    },
    {
      ok: (d.savedTokens ?? 0) > 0,
      label: "This account has a saved device",
      detail: d.tokenReadError
        ? `Couldn't read devices (${d.tokenReadError}). If this is permission-denied, publish firestore.rules.`
        : (d.savedTokens ?? 0) > 0
          ? `${d.savedTokens} device${d.savedTokens === 1 ? "" : "s"} saved.`
          : "None yet. Press “Register this device” above.",
    },
  ];
}

/** Shows each link in the push chain with ✓/✗, plus a one-tap retry that reports the real error. */
export function PushTroubleshooting() {
  const { user } = useAuth();
  const [diag, setDiag] = useState<PushDiagnostics | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (!user) return;
    setBusy(true);
    try {
      setDiag(await collectPushDiagnostics(user.uid));
    } finally {
      setBusy(false);
    }
  };

  const register = async () => {
    if (!user) return;
    setBusy(true);
    setMessage(null);
    try {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      await syncPushToken(user.uid);
      setMessage("Device registered. ✓");
    } catch (error) {
      console.error("Register device failed", error);
      setMessage(describePushError(error));
    } finally {
      setDiag(await collectPushDiagnostics(user.uid));
      setBusy(false);
    }
  };

  return (
    <details className="rounded-2xl border border-border bg-surface p-4 text-sm">
      <summary className="cursor-pointer font-medium">Troubleshooting push</summary>
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={check} disabled={busy}>
            Run check
          </Button>
          <Button size="sm" onClick={register} disabled={busy}>
            Register this device
          </Button>
        </div>
        {message && (
          <p role="status" className="rounded-xl bg-muted p-3">
            {message}
          </p>
        )}
        {diag && (
          <ul className="space-y-2">
            {rows(diag).map((r) => (
              <li key={r.label} className="flex gap-2.5">
                <span
                  className={
                    r.ok
                      ? "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-forest text-primary-foreground"
                      : "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-terracotta text-primary-foreground"
                  }
                >
                  {r.ok ? <Check className="size-3" /> : <X className="size-3" />}
                </span>
                <span>
                  <span className="block font-medium">{r.label}</span>
                  <span className="block text-muted-foreground">{r.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
