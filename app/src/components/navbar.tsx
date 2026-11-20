"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Button } from "./ui";

export function Navbar() {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
        <Link href="/templates" className="font-semibold">
          Agentic Marketplace
        </Link>
        <Link href="/templates" className="hover:underline">
          Templates
        </Link>
        {status === "authenticated" && (
          <Link href="/my/templates" className="hover:underline">
            My templates
          </Link>
        )}
        {user?.role === "ADMIN" && (
          <Link href="/admin" className="hover:underline">
            Admin
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {status === "authenticated" && user ? (
            <>
              <span className="text-zinc-500">
                {user.displayName}
                {user.role === "ADMIN" && " · admin"}
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  router.push("/templates");
                }}
              >
                Log out
              </Button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
