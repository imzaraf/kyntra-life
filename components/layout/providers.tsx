"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/auth/auth-provider";
import { ServiceWorkerRegistrar } from "@/lib/notifications/sw-registrar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        <ServiceWorkerRegistrar />
      </AuthProvider>
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast:
              "!bg-popover !text-popover-foreground !border-border !rounded-2xl !shadow-[var(--shadow-lg)] !font-sans",
          },
        }}
      />
    </ThemeProvider>
  );
}
