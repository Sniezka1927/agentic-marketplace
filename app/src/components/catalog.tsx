"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";
import { useCategories, useTemplates } from "@/lib/queries";
import type { TemplateSort, TemplateSource } from "@/lib/types";
import { Pagination } from "./pagination";
import { TemplateCard } from "./template-card";
import { Button, ErrorBox, Input, PageTitle, Select, Spinner } from "./ui";

const LIMIT = 12;

const SORTS: { value: TemplateSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most installed" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name" },
];

export function Catalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const source = (searchParams.get("source") ?? "") as TemplateSource | "";
  const sort = (searchParams.get("sort") ?? "newest") as TemplateSort;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [search, setSearch] = useState(q);
  const categories = useCategories();
  const templates = useTemplates({
    page,
    limit: LIMIT,
    q: q || undefined,
    categoryId: categoryId || undefined,
    source: source || undefined,
    sort,
  });

  const update = (changes: Record<string, string | number>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === 1 && key === "page") next.delete(key);
      else next.set(key, String(value));
    }
    if (!("page" in changes)) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ q: search.trim() });
  };

  return (
    <>
      <PageTitle>Templates</PageTitle>
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
        <form onSubmit={onSearch} className="flex gap-2">
          <Input
            placeholder="Search by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select
          value={categoryId}
          onChange={(e) => update({ categoryId: e.target.value })}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select
          value={source}
          onChange={(e) => update({ source: e.target.value })}
          aria-label="Source"
        >
          <option value="">All sources</option>
          <option value="LOCAL">Community</option>
          <option value="X">X marketplace</option>
        </Select>
        <Select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {templates.isPending ? (
        <Spinner />
      ) : templates.isError ? (
        <ErrorBox message={errorMessage(templates.error)} />
      ) : templates.data.items.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">No templates match your filters.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-zinc-500">{templates.data.total} templates</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.data.items.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
          <Pagination
            page={page}
            limit={LIMIT}
            total={templates.data.total}
            onChange={(p) => update({ page: p })}
          />
        </>
      )}
    </>
  );
}
