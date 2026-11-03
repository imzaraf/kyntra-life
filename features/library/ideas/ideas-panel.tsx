"use client";

import { Lightbulb, ListPlus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorNotice, ListSkeleton } from "@/components/shared/empty-state";
import { SectionTabs } from "@/components/shared/section-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAuth } from "@/features/auth/auth-provider";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { ideaRepo, taskRepo } from "@/lib/repositories";
import type { Idea, IdeaStatus } from "@/types/domain";

const STATUSES: IdeaStatus[] = [
  "inbox",
  "exploring",
  "planned",
  "in_progress",
  "done",
  "archived",
];
const label = (s: string) => s.replace("_", " ").replace(/^./, (c) => c.toUpperCase());

export function IdeasPanel() {
  const { user } = useAuth();
  const ideas = useRepoQuery(ideaRepo, () => [], "all");
  const actions = useCollectionActions(ideaRepo, "the idea");
  const [filter, setFilter] = useState<IdeaStatus | "active">("active");
  const [draft, setDraft] = useState("");

  const list = useMemo(
    () =>
      ideas.data
        .filter((i) =>
          filter === "active"
            ? i.status !== "archived" && i.status !== "done"
            : i.status === filter,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [ideas.data, filter],
  );

  const add = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    void actions.create({ title, status: "inbox", tags: [] });
    setDraft("");
  };

  /** Turns the idea into a task while keeping the idea and linking the two. */
  const convert = async (idea: Idea) => {
    if (!user) return;
    try {
      const taskId = taskRepo.create(user.uid, {
        title: idea.title,
        description: idea.body,
        priority: "medium",
        status: "todo",
        tags: [...idea.tags, "from-idea"],
        subtasks: [],
        notes: `Converted from idea: “${idea.title}”`,
      });
      await ideaRepo.update(user.uid, idea.id, {
        convertedTaskId: taskId,
        status: idea.status === "inbox" ? "planned" : idea.status,
      });
      toast.success("Added to your tasks. The original idea is kept.");
    } catch (error) {
      console.error(error);
      toast.error("Couldn't convert the idea");
    }
  };

  return (
    <section aria-label="Ideas" className="space-y-5">
      <form onSubmit={add} className="flex gap-2">
        <Input
          aria-label="New idea"
          placeholder="Capture an idea…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={300}
        />
        <Button type="submit" disabled={!draft.trim()}>
          <Plus /> Capture
        </Button>
      </form>
      <SectionTabs
        label="Idea status"
        value={filter}
        onChange={setFilter}
        tabs={[
          { key: "active", label: "Active" },
          ...STATUSES.map((s) => ({ key: s, label: label(s) })),
        ]}
      />
      {ideas.error ? (
        <ErrorNotice error={ideas.error} />
      ) : ideas.loading ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas here"
          description="Ideas land in your inbox first. Explore them later."
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((i) => (
            <li key={i.id} className="paper flex flex-wrap items-center gap-3 p-4">
              <Lightbulb className="size-4 shrink-0 text-gold" strokeWidth={1.6} />
              <div className="min-w-0 flex-[1_1_calc(100%-2rem)] sm:flex-1">
                <p className="font-medium">{i.title}</p>
                {i.convertedTaskId && (
                  <Badge variant="secondary" className="mt-1 rounded-md font-normal">
                    Converted to task
                  </Badge>
                )}
              </div>
              <div className="w-36">
                <NativeSelect
                  aria-label={`Status for ${i.title}`}
                  value={i.status}
                  onChange={(e) =>
                    void actions.update(i.id, { status: e.target.value as IdeaStatus })
                  }
                  className="h-8 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {!i.convertedTaskId && (
                <Button variant="outline" size="sm" onClick={() => void convert(i)}>
                  <ListPlus /> To task
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${i.title}`}
                onClick={() => void actions.remove(i.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
