"use client";

import {
  Bookmark,
  CalendarRange,
  FilePlus2,
  GraduationCap,
  Lightbulb,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SectionTabs, useViewParam } from "@/components/shared/section-tabs";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { ideaRepo, learningRepo, planRepo, resourceRepo } from "@/lib/repositories";
import { IdeasPanel } from "./ideas/ideas-panel";
import { KnowledgePanel } from "./knowledge/knowledge-panel";
import { LearningPanel } from "./learning/learning-panel";
import { PlansPanel } from "./plans/plans-panel";
import { TemplatesPanel } from "./templates/templates-panel";

const KEYS = ["overview", "learning", "vault", "ideas", "trips", "templates"] as const;
type Key = (typeof KEYS)[number];

export function LibraryView() {
  const [view, setView] = useViewParam<Key>(KEYS, "overview");
  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Everything worth keeping."
        description="What you're learning, saving, imagining and planning — gathered in one quiet place."
      />
      <div className="mb-6">
        <SectionTabs
          label="Library sections"
          value={view}
          onChange={setView}
          tabs={[
            { key: "overview", label: "Overview" },
            { key: "learning", label: "Learning" },
            { key: "vault", label: "Vault" },
            { key: "ideas", label: "Ideas" },
            { key: "trips", label: "Trips" },
            { key: "templates", label: "Templates" },
          ]}
        />
      </div>
      {view === "overview" && <Overview />}
      {view === "learning" && <LearningPanel />}
      {view === "vault" && <KnowledgePanel />}
      {view === "ideas" && <IdeasPanel />}
      {view === "trips" && <PlansPanel mode="trips" />}
      {view === "templates" && <TemplatesPanel />}
    </>
  );
}

function Overview() {
  const learning = useRepoQuery(learningRepo, () => [], "all");
  const vault = useRepoQuery(resourceRepo, () => [], "all");
  const ideas = useRepoQuery(ideaRepo, () => [], "all");
  const plans = useRepoQuery(planRepo, () => [], "all");

  const cards = [
    {
      view: "learning",
      icon: GraduationCap,
      title: "Learning center",
      blurb: "Topics, notes and review dates.",
      stat: learning.loading ? "…" : `${learning.data.length} notes`,
      loading: learning.loading,
    },
    {
      view: "vault",
      icon: Bookmark,
      title: "Knowledge vault",
      blurb: "Links, articles, videos and docs.",
      stat: `${vault.data.length} saved`,
      loading: vault.loading,
    },
    {
      view: "ideas",
      icon: Lightbulb,
      title: "Ideas",
      blurb: "An inbox for sparks, ready to become tasks.",
      stat: `${ideas.data.filter((i) => i.status === "inbox").length} in inbox`,
      loading: ideas.loading,
    },
    {
      view: "trips",
      icon: MapPin,
      title: "Travel planning",
      blurb: "Destinations, itineraries, budgets.",
      stat: `${plans.data.filter((p) => p.kind === "trip").length} trips`,
      loading: plans.loading,
    },
    {
      view: "templates",
      icon: FilePlus2,
      title: "Templates",
      blurb: "Reflections, reviews and learning structures.",
      stat: "8 built in",
      loading: false,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ view, icon: Icon, title, blurb, stat, loading }) => (
        <Link
          key={view}
          href={`/library?view=${view}`}
          className="paper hover-lift group flex flex-col gap-4 p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-sage-soft text-forest">
            <Icon className="size-5" strokeWidth={1.6} />
          </span>
          <div>
            <h3 className="font-serif text-2xl">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
          </div>
          <p className="mt-auto text-xs text-muted-foreground tabular-nums">
            {loading ? "Loading…" : stat}
          </p>
        </Link>
      ))}
      <Link
        href="/plan?view=goals"
        className="paper hover-lift flex flex-col gap-4 p-6 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-terracotta-soft text-terracotta">
          <CalendarRange className="size-5" strokeWidth={1.6} />
        </span>
        <div>
          <h3 className="font-serif text-2xl">Goals &amp; future plans</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Live in Plan, alongside your tasks and calendar.
          </p>
        </div>
      </Link>
    </div>
  );
}
