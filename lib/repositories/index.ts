import type {
  Idea,
  JournalEntry,
  LearningItem,
  NotificationToken,
  Plan,
  Reminder,
  Routine,
  SavedResource,
  Task,
  TimeBlock,
} from "@/types/domain";
import { createRepository } from "./repository";

export const journalRepo = createRepository<JournalEntry>("journalEntries");
export const taskRepo = createRepository<Task>("tasks");
export const timeBlockRepo = createRepository<TimeBlock>("timeBlocks");
export const reminderRepo = createRepository<Reminder>("reminders");
export const routineRepo = createRepository<Routine>("routines");
export const learningRepo = createRepository<LearningItem>("learningItems");
export const resourceRepo = createRepository<SavedResource>("savedResources");
export const ideaRepo = createRepository<Idea>("ideas");
export const planRepo = createRepository<Plan>("plans");
export const tokenRepo = createRepository<NotificationToken>("notificationTokens");
