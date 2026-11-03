"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { clearIndexedDbPersistence, terminate } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase/client";
import { readPublicEnv } from "@/lib/firebase/env";

type AuthStatus = "loading" | "signed-out" | "signed-in" | "misconfigured";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  configError: string | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const envResult = useMemo(() => readPublicEnv(), []);
  const [status, setStatus] = useState<AuthStatus>(
    envResult.ok ? "loading" : "misconfigured",
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!envResult.ok) return;
    return onAuthStateChanged(getFirebase().auth, (u) => {
      setUser(u);
      setStatus(u ? "signed-in" : "signed-out");
    });
  }, [envResult]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebase().auth, email, password);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(
      getFirebase().auth,
      email,
      password,
    );
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(getFirebase().auth, new GoogleAuthProvider());
  }, []);

  const signOut = useCallback(async () => {
    const { auth, db } = getFirebase();
    await fbSignOut(auth);
    // Remove the on-device Firestore cache so the next person on a shared
    // device cannot read this user's offline data.
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
    } catch (error) {
      console.error("Could not clear local cache on sign-out", error);
    }
    // Full navigation (not router.push) so all in-memory state is discarded.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/sign-in");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      configError: envResult.ok ? null : envResult.message,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [status, user, envResult, signIn, signUp, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don't match.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Choose a password of at least 8 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "You appear to be offline. Check your connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled yet. In Firebase console → Authentication → Sign-in method, enable Email/Password (and Google).";
    case "auth/configuration-not-found":
      return "Authentication isn't set up for this Firebase project. In the console, open Authentication and click Get started.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "The Firebase API key is invalid or restricted. Check NEXT_PUBLIC_FIREBASE_API_KEY and its HTTP-referrer restrictions.";
    case "auth/unauthorized-domain":
      return "This domain isn't authorized. Add it under Authentication → Settings → Authorized domains.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      console.error("Unhandled auth error", code, error);
      return `Something went wrong signing you in${code ? ` (${code})` : ""}. Please try again.`;
  }
}
