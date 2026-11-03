"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { authErrorMessage, useAuth } from "./auth-provider";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const signUpSchema = z.object({
  name: z.string().max(60).optional(),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

type Mode = "sign-in" | "sign-up";
type FormValues = { name?: string; email: string; password: string };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";

  const form = useForm<FormValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (auth.status === "signed-in") router.replace("/today");
  }, [auth.status, router]);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(authErrorMessage(e));
    }
  }

  const submit = form.handleSubmit((v) =>
    run(() =>
      isSignUp
        ? auth.signUp(v.name ?? "", v.email, v.password)
        : auth.signIn(v.email, v.password),
    ),
  );
  const { errors, isSubmitting } = form.formState;

  return (
    <div className="glass rise w-full max-w-md rounded-3xl p-8 sm:p-10">
      <Logo variant="stacked" className="mx-auto mb-6 h-36" />
      <h1 className="text-3xl leading-tight">
        {isSignUp ? "Begin your collection." : "Welcome back."}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSignUp
          ? "Create your private space for days, plans and everything worth keeping."
          : "Pick up where you left off."}
      </p>

      {auth.status === "misconfigured" && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-terracotta-soft p-3 text-sm text-foreground"
        >
          {auth.configError}
        </p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {isSignUp && (
          <Field label="Name (optional)" htmlFor="name">
            <Input
              id="name"
              autoComplete="name"
              placeholder="How should we greet you?"
              {...form.register("name")}
            />
          </Field>
        )}
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || auth.status === "misconfigured"}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="eyebrow">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={auth.status === "misconfigured"}
        onClick={() => run(auth.signInWithGoogle)}
      >
        Continue with Google
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isSignUp ? "Already have an account?" : "New to Kyntra Life?"}{" "}
        <Link
          href={isSignUp ? "/sign-in" : "/sign-up"}
          className="font-medium text-foreground underline underline-offset-4"
        >
          {isSignUp ? "Sign in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
