export type TemplateTarget = "journal" | "learning" | "idea" | "trip";

export interface Template {
  id: string;
  name: string;
  description: string;
  target: TemplateTarget;
  title: string;
  body: string;
}

/** Built-in templates. Personal, editable templates are the next increment (see docs/ROADMAP.md). */
export const TEMPLATES: readonly Template[] = [
  {
    id: "daily-journal",
    name: "Daily journal",
    description: "A calm page for the day.",
    target: "journal",
    title: "",
    body: "## Today\n\n\n## Highlights\n- \n\n## Gratitude\n- \n\n## Tomorrow\n- \n",
  },
  {
    id: "morning-reflection",
    name: "Morning reflection",
    description: "Set intention before the day starts.",
    target: "journal",
    title: "Morning reflection",
    body: "## How am I arriving today?\n\n\n## One thing that would make today good\n\n\n## What I'll protect time for\n- \n",
  },
  {
    id: "evening-reflection",
    name: "Evening reflection",
    description: "Close the day with perspective.",
    target: "journal",
    title: "Evening reflection",
    body: "## What went well\n- \n\n## What I learned\n- \n\n## What I'd do differently\n- \n\n## Let go of\n\n",
  },
  {
    id: "weekly-review",
    name: "Weekly review",
    description: "Look back, look ahead.",
    target: "journal",
    title: "Weekly review",
    body: "## Wins this week\n- \n\n## What drained me\n- \n\n## Loose ends\n- [ ] \n\n## Three priorities for next week\n1. \n2. \n3. \n",
  },
  {
    id: "learning-note",
    name: "Learning note",
    description: "Capture what you studied and what to review.",
    target: "learning",
    title: "New learning note",
    body: "## Key ideas\n- \n\n## In my own words\n\n\n## Examples\n\n\n## Questions to revisit\n- \n",
  },
  {
    id: "vocabulary",
    name: "Vocabulary",
    description: "Words, meanings and usage.",
    target: "learning",
    title: "Vocabulary",
    body: "| Word | Meaning | Example sentence |\n| --- | --- | --- |\n|  |  |  |\n",
  },
  {
    id: "idea",
    name: "Idea",
    description: "Problem, spark and a first step.",
    target: "idea",
    title: "New idea",
    body: "**The spark**\n\n**Who or what it helps**\n\n**A first small step**\n",
  },
  {
    id: "trip-plan",
    name: "Trip plan",
    description: "Destination, itinerary and budget.",
    target: "trip",
    title: "New trip",
    body: "Day 1 — \nDay 2 — \nDay 3 — \n\nMust see:\n- \n\nStay:\n- ",
  },
];
