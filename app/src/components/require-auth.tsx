"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { ErrorBox, Spinner } from "./ui";

export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated" || !user) return <Spinner />;
  if (role && user.role !== role) {
    return <ErrorBox message="You do not have access to this page." />;
  }
  return children;
}
