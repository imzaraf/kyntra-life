"use client";

import { FilePlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { todayKey } from "@/lib/date-time";
import { ideaRepo, journalRepo, learningRepo, planRepo } from "@/lib/repositories";
import { TEMPLATES, type Template } from "./templates";

const TARGET_LABEL = {
  journal: "Journal",
  learning: "Learning",
  idea: "Ideas",
  trip: "Trips",
} as const;

export function TemplatesPanel() {
  const { user } = useAuth();
  const router = useRouter();

  const use = async (t: Template) => {
    if (!user) return;
    try {
      switch (t.target) {
        case "journal": {
          const id = journalRepo.newId(user.uid);
          await journalRepo.createWithId(user.uid, id, {
            title: t.title || undefined,
            date: todayKey(),
            body: t.body,
          });
          router.push(`/journal?entry=${id}`);
          return;
        }
        case "learning":
          await learningRepo.create(user.uid, {
            category: "Templates",
            title: t.title,
            notes: t.body,
            status: "learning",
            tags: [],
            minutesStudied: 0,
          });
          router.push("/library?view=learning");
          return;
        case "idea":
          ideaRepo.create(user.uid, {
            title: t.title,
            body: t.body,
            status: "inbox",
            tags: [],
          });
          router.push("/library?view=ideas");
          return;
        case "trip":
          planRepo.create(user.uid, {
            kind: "trip",
            title: t.title,
            status: "considering",
            notes: t.body,
            links: [],
          });
          router.push("/library?view=trips");
          return;
      }
    } catch (error) {
      console.error(error);
      toast.error("Couldn't create from template");
    }
  };

  return (
    <section aria-label="Templates" className="space-y-4">
      <p className="max-w-lg text-sm text-muted-foreground">
        Start from a thoughtful structure. Using a template creates a new, editable copy —
        the template itself never changes.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <li key={t.id} className="paper hover-lift flex flex-col gap-3 p-5">
            <div>
              <p className="eyebrow mb-1">{TARGET_LABEL[t.target]}</p>
              <h3 className="font-serif text-xl">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-auto w-fit"
              onClick={() => void use(t)}
            >
              <FilePlus2 /> Use template
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
