"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import {
  disablePush,
  enablePush,
  getPushSupport,
  syncPushToken,
  type PushSupport,
} from "@/lib/notifications/fcm";

export function NotificationSettings() {
  const { user } = useAuth();
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [busy, setBusy] = useState(false);
  const [localPerm, setLocalPerm] = useState<NotificationPermission | null>(null);

  const refresh = useCallback(async () => {
    setSupport(await getPushSupport());
    setLocalPerm(typeof Notification === "undefined" ? null : Notification.permission);
  }, []);

  useEffect(() => {
    void (async () => {
      const s = await getPushSupport();
      setSupport(s);
      setLocalPerm(typeof Notification === "undefined" ? null : Notification.permission);
      // Keep this device's token fresh (tokens can rotate) when permission already exists.
      if (s.state === "granted" && user)
        await syncPushToken(user.uid).catch((e) => console.error("Token sync failed", e));
    })();
  }, [user]);

  const enable = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const result = await enablePush(user.uid);
      if (result === "granted") toast.success("Notifications enabled on this device");
      else if (result === "denied")
        toast.error(
          "Notifications were blocked. You can allow them in your browser's site settings.",
        );
    } catch (error) {
      console.error(error);
      toast.error("Couldn't enable notifications. Check your Firebase push setup.");
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const disable = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await disablePush(user.uid);
      toast.success("Push notifications turned off for this device");
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const allowLocal = async () => {
    const result = await Notification.requestPermission();
    if (result === "granted") toast.success("Alerts allowed on this device");
    else
      toast.error(
        "Notifications were not allowed. You can change this in your phone's app settings.",
      );
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sage-soft text-forest">
            {support?.state === "granted" ? (
              <BellRing className="size-4" />
            ) : support?.state === "denied" ? (
              <BellOff className="size-4" />
            ) : (
              <Bell className="size-4" />
            )}
          </span>
          <div>
            <p className="font-medium">Push notifications</p>
            <p className="text-sm text-muted-foreground" role="status">
              {!support && "Checking…"}
              {support?.state === "granted" && "On for this device."}
              {support?.state === "default" &&
                "Off. Enable to be reminded when Kyntra is closed."}
              {support?.state === "denied" &&
                "Blocked in your browser. Allow notifications for this site in browser settings, then return."}
              {(support?.state === "unsupported" || support?.state === "unconfigured") &&
                support.reason}
            </p>
          </div>
        </div>
        {support?.state === "default" && (
          <Button onClick={enable} disabled={busy}>
            Enable notifications
          </Button>
        )}
        {support?.state === "granted" && (
          <Button variant="outline" onClick={disable} disabled={busy}>
            Turn off
          </Button>
        )}
      </div>
      {support?.state === "unconfigured" && (
        <div className="rounded-2xl bg-sage-soft/60 p-4 text-sm">
          <p className="font-medium">
            {localPerm === "granted"
              ? "Device alerts are allowed."
              : localPerm === "denied"
                ? "Device alerts are blocked."
                : "Device alerts are off."}
          </p>
          <p className="mt-1 text-muted-foreground">
            With permission, reminders show as phone notifications (with sound) while the
            app is open or recently used. Alerts when the app is fully closed need cloud
            push, which isn&apos;t set up yet (see docs/NOTIFICATIONS.md).
          </p>
          {localPerm === "default" && (
            <Button className="mt-3" size="sm" onClick={allowLocal}>
              Allow alerts on this device
            </Button>
          )}
          {localPerm === "denied" && (
            <p className="mt-2 text-muted-foreground">
              Open your phone&apos;s Settings → Apps → Kyntra Life → Notifications to
              allow them.
            </p>
          )}
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">
        In-app reminders always work, even without permission. Push delivery depends on
        your browser, operating system, device settings, network and Firebase
        infrastructure — it is best-effort, not guaranteed.
      </p>
    </div>
  );
}
