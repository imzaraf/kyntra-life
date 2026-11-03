/** Current document schema version; bump with a migration when shapes change. */
export const SCHEMA_VERSION = 1;

interface Base {
  id: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done" | "archived";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task extends Base {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  /** Local day key yyyy-MM-dd */
  dueDate?: string;
  /** Local HH:mm */
  dueTime?: string;
  estimateMinutes?: number;
  tags: string[];
  notes?: string;
  subtasks: Subtask[];
  completedAt?: Date;
}

export interface TimeBlock extends Base {
  title: string;
  /** Local day key */
  date: string;
  /** Minutes since local midnight, 0..1439 */
  startMin: number;
  /** Minutes since local midnight, 1..1440, strictly > startMin */
  endMin: number;
  notes?: string;
  taskId?: string;
}

export type ReminderStatus = "pending" | "completed" | "dismissed";
export type DeliveryStatus = "sent" | "failed" | "skipped";

export interface ReminderDelivery {
  status: DeliveryStatus;
  attempts: number;
  lastAttemptAt?: Date;
  sentAt?: Date;
  reason?: string;
}

export interface Reminder extends Base {
  title: string;
  note?: string;
  scheduledAt: Date;
  status: ReminderStatus;
  /** User wants a push notification for this reminder. */
  notify: boolean;
  /** True while a push still needs to be delivered; cleared by Cloud Functions. */
  notifyPending: boolean;
  timeZone: string;
  taskId?: string;
  blockId?: string;
  /** Server-owned. Clients never write this. */
  delivery?: ReminderDelivery;
}

export interface JournalEntry extends Base {
  title?: string;
  date: string;
  body: string;
  mood?: number;
  energy?: number;
  focus?: number;
}

export type IdeaStatus =
  "inbox" | "exploring" | "planned" | "in_progress" | "done" | "archived";

export interface Idea extends Base {
  title: string;
  body?: string;
  status: IdeaStatus;
  tags: string[];
  convertedTaskId?: string;
}

export type ResourceStatus = "unread" | "in_progress" | "done";

export interface SavedResource extends Base {
  url: string;
  title: string;
  source?: string;
  notes?: string;
  tags: string[];
  collection?: string;
  status: ResourceStatus;
}

export type LearningStatus = "learning" | "reviewing" | "mastered";

export interface LearningItem extends Base {
  category: string;
  title: string;
  notes?: string;
  status: LearningStatus;
  tags: string[];
  nextReviewDate?: string;
  minutesStudied: number;
}

export type PlanKind = "goal" | "plan" | "someday" | "trip";
export type PlanStatus = "considering" | "planned" | "active" | "completed" | "canceled";

export interface Plan extends Base {
  kind: PlanKind;
  title: string;
  status: PlanStatus;
  targetDate?: string;
  notes?: string;
  destination?: string;
  budgetNotes?: string;
  links: string[];
}

export type RoutineMark = "done" | "skipped" | "rest";

export interface Routine extends Base {
  title: string;
  frequency: "daily" | "weekly";
  /** 0 = Sunday … 6 = Saturday; used for weekly routines. */
  days: number[];
  /** dayKey → mark */
  marks: Record<string, RoutineMark>;
  archived: boolean;
}

export interface NotificationToken {
  id: string;
  token: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}
