"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";
import { useAuth } from "./auth-provider";
import { Button, Card, ErrorBox, Field, Input } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register({ email, password, displayName: String(form.get("displayName")) });
      router.replace(next?.startsWith("/") ? next : "/");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <Card className="mx-auto w-full max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">{isLogin ? "Log in" : "Create account"}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {!isLogin && (
          <Field label="Display name">
            <Input name="displayName" required minLength={2} maxLength={100} />
          </Field>
        )}
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            required
            minLength={isLogin ? 1 : 8}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </Field>
        {error && <ErrorBox message={error} />}
        <Button type="submit" disabled={pending}>
          {pending ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-zinc-500">
        {isLogin ? "No account? " : "Already registered? "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </Card>
  );
}
