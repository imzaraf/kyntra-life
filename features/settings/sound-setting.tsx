"use client";

import { Volume2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { isSoundEnabled, playChime, setSoundEnabled } from "@/lib/notifications/chime";

/** In-app reminder chime. Works whenever Kyntra is open or still alive in the background. */
export function SoundSetting() {
  const [on, setOn] = useState(() => isSoundEnabled());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/60 p-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-sage-soft text-forest">
          <Volume2 className="size-4" />
        </span>
        <div>
          <p className="font-medium">Reminder sound</p>
          <p className="text-muted-foreground">
            A soft chime when a reminder is due while Kyntra is open. Notification banners
            use your device&apos;s own sound settings.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void playChime({ force: true })}
        >
          Test sound
        </Button>
        <Switch
          checked={on}
          aria-label="Reminder sound"
          onCheckedChange={(v) => {
            setOn(v);
            setSoundEnabled(v);
          }}
        />
      </div>
    </div>
  );
}
