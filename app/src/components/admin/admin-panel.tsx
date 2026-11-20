"use client";

import { useState } from "react";
import { Button, Card, PageTitle } from "../ui";
import { CategoriesAdmin } from "./categories-admin";
import { SyncAdmin } from "./sync-admin";
import { UsersAdmin } from "./users-admin";

const TABS = [
  { id: "categories", label: "Categories", Component: CategoriesAdmin },
  { id: "users", label: "Users", Component: UsersAdmin },
  { id: "sync", label: "X marketplace sync", Component: SyncAdmin },
] as const;

export function AdminPanel() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("categories");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <>
      <PageTitle>Admin</PageTitle>
      <div className="mb-4 flex gap-2" role="tablist">
        {TABS.map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={t.id === tab}
            variant={t.id === tab ? "primary" : "ghost"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <Card>
        <active.Component />
      </Card>
    </>
  );
}
