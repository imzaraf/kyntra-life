import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  limit,
  type DocumentData,
  type FieldValue,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { SCHEMA_VERSION } from "@/types/domain";

export type CollectionName =
  | "journalEntries"
  | "tasks"
  | "timeBlocks"
  | "reminders"
  | "routines"
  | "learningItems"
  | "savedResources"
  | "ideas"
  | "plans"
  | "notificationTokens";

const DEFAULT_LIMIT = 500;

/** Convert Firestore Timestamps to Dates, recursively. */
function fromFirestore(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(fromFirestore);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        fromFirestore(v),
      ]),
    );
  }
  return value;
}

type Writable<T> = Omit<T, "id" | "createdAt" | "updatedAt" | "schemaVersion">;
type Patch<T> = {
  [K in keyof Writable<T>]?: Writable<T>[K] | null | FieldValue;
} & Record<string, unknown>;

/**
 * Typed data-access for one user-owned subcollection. UI code never touches
 * Firestore directly; it goes through repositories and the hooks built on them.
 */
export function createRepository<T extends { id: string }>(name: CollectionName) {
  const col = (uid: string) => collection(getFirebase().db, "users", uid, name);

  return {
    name,

    subscribe(
      uid: string,
      constraints: QueryConstraint[],
      onData: (items: T[]) => void,
      onError: (error: Error) => void,
    ) {
      const q = query(col(uid), ...constraints, limit(DEFAULT_LIMIT));
      return onSnapshot(
        q,
        (snap) =>
          onData(
            snap.docs.map(
              (d) =>
                ({
                  ...(fromFirestore(d.data({ serverTimestamps: "estimate" })) as object),
                  id: d.id,
                }) as unknown as T,
            ),
          ),
        onError,
      );
    },

    async list(uid: string, constraints: QueryConstraint[] = []): Promise<T[]> {
      const snap = await getDocs(query(col(uid), ...constraints, limit(DEFAULT_LIMIT)));
      return snap.docs.map(
        (d) =>
          ({
            ...(fromFirestore(d.data({ serverTimestamps: "estimate" })) as object),
            id: d.id,
          }) as unknown as T,
      );
    },

    /** A fresh document id, so callers can track a draft before its first save. */
    newId(uid: string): string {
      return doc(col(uid)).id;
    },

    /** Returns the new document id. Works offline (resolves id immediately). */
    create(uid: string, data: Writable<T> & Record<string, unknown>): string {
      const ref = doc(col(uid));
      void setDoc(ref, {
        ...data,
        schemaVersion: SCHEMA_VERSION,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ref.id;
    },

    /** Create with a caller-chosen stable id (idempotent upsert). */
    async createWithId(
      uid: string,
      id: string,
      data: Writable<T> & Record<string, unknown>,
    ) {
      await setDoc(
        doc(col(uid), id),
        {
          ...data,
          schemaVersion: SCHEMA_VERSION,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },

    async update(uid: string, id: string, patch: Patch<T>) {
      await updateDoc(doc(col(uid), id), {
        ...(patch as DocumentData),
        updatedAt: serverTimestamp(),
      });
    },

    async remove(uid: string, id: string) {
      await deleteDoc(doc(col(uid), id));
    },

    async add(uid: string, data: DocumentData) {
      return addDoc(col(uid), data);
    },
  };
}

export type Repository<T extends { id: string }> = ReturnType<typeof createRepository<T>>;
