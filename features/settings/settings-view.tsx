"use client";

import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { DataSettings } from "./data-settings";
import { NotificationSettings } from "./notification-settings";

export function SettingsView() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Make it yours."
        description="Notifications, appearance, and your data."
      />
      <div className="max-w-2xl space-y-5">
        <Section title="Notifications">
          <NotificationSettings />
        </Section>
        <Section title="Appearance">
          <div className="flex gap-2" role="radiogroup" aria-label="Theme">
            {(["system", "light", "dark"] as const).map((t) => (
              <Button
                key={t}
                role="radio"
                aria-checked={theme === t}
                variant={theme === t ? "default" : "outline"}
                onClick={() => setTheme(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </Section>
        <Section title="Your data">
          <DataSettings />
        </Section>
        <Section title="Account">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut /> Sign out
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="paper p-5 md:p-6">
      <h2 className="mb-4 font-serif text-2xl">{title}</h2>
      {children}
    </section>
  );
}
