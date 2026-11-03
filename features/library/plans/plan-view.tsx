"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SectionTabs, useViewParam } from "@/components/shared/section-tabs";
import { PlannerPanel } from "@/features/planner/planner-panel";
import { RemindersPanel } from "@/features/reminders/reminders-panel";
import { RoutinesPanel } from "@/features/routines/routines-panel";
import { TasksPanel } from "@/features/tasks/tasks-panel";
import { PlansPanel } from "./plans-panel";

const KEYS = ["tasks", "planner", "reminders", "routines", "goals"] as const;
type Key = (typeof KEYS)[number];

export function PlanView() {
  const [view, setView] = useViewParam<Key>(KEYS, "tasks");
  return (
    <>
      <PageHeader
        eyebrow="Plan"
        title="Shape your time."
        description="Tasks, time blocks, reminders, routines and the goals behind them."
      />
      <div className="mb-6">
        <SectionTabs
          label="Plan sections"
          value={view}
          onChange={setView}
          tabs={[
            { key: "tasks", label: "Tasks" },
            { key: "planner", label: "Planner" },
            { key: "reminders", label: "Reminders" },
            { key: "routines", label: "Routines" },
            { key: "goals", label: "Goals" },
          ]}
        />
      </div>
      {view === "tasks" && <TasksPanel />}
      {view === "planner" && <PlannerPanel />}
      {view === "reminders" && <RemindersPanel />}
      {view === "routines" && <RoutinesPanel />}
      {view === "goals" && <PlansPanel mode="goals" />}
    </>
  );
}
