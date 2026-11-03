const PROMPTS = [
  "What would make today feel well spent?",
  "What is one thing you're quietly proud of this week?",
  "Describe a moment recently that you'd like to remember.",
  "What are you carrying that you could set down?",
  "Who made your life easier lately, and how?",
  "What does a good ordinary day look like for you right now?",
  "What are you curious about at the moment?",
];

export function promptForDay(date: Date): string {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}
