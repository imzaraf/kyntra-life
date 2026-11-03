import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="flex w-full flex-col items-center gap-8">
        {children}
        <p className="font-serif text-sm text-muted-foreground italic">
          Your life, collected.
        </p>
      </div>
    </main>
  );
}
