"use client";

import { useEffect, useState } from "react";
import type { QueryConstraint } from "firebase/firestore";
import { useAuth } from "@/features/auth/auth-provider";
import type { Repository } from "@/lib/repositories/repository";

export interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Live subscription to a user's subcollection. `constraints` is a factory so
 * callers can pass a closure; `key` identifies the query (re-subscribes on change).
 */
export function useRepoQuery<T extends { id: string }>(
  repo: Repository<T>,
  constraints: () => QueryConstraint[],
  key: string,
): QueryState<T> {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<QueryState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = repo.subscribe(
      uid,
      constraints(),
      (data) => setState({ data, loading: false, error: null }),
      (error) => {
        // Keep the full message: for missing indexes Firestore includes a one-click creation link.
        console.error(`Firestore query failed (${repo.name}):`, error);
        setState((s) => ({ ...s, loading: false, error }));
      },
    );
    return unsubscribe;
    // `constraints` is intentionally keyed by `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, repo, key]);

  return uid ? state : { data: [], loading: true, error: null };
}
