"use client";

import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";
import { useCategoryMutations } from "@/lib/manage-queries";
import { useCategories } from "@/lib/queries";
import type { Category } from "@/lib/types";
import { ConfirmButton } from "../confirm-button";
import { MutationError } from "../mutation-error";
import { Button, ErrorBox, Input, Spinner } from "../ui";

function CategoryRow({ category }: { category: Category }) {
  const { update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);

  const save = (event: FormEvent) => {
    event.preventDefault();
    update.mutate(
      { id: category.id, name: name.trim(), description: description.trim() },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (editing) {
    return (
      <form onSubmit={save} className="grid gap-2 py-3 md:grid-cols-[1fr_2fr_auto]">
        <div className="md:col-span-3">
          <MutationError error={update.error} />
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex gap-2">
          <Button type="submit" disabled={update.isPending}>
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3">
      <MutationError error={remove.error} />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-zinc-500">
            /{category.slug}
            {category.description && ` · ${category.description}`}
          </p>
        </div>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <ConfirmButton
          disabled={remove.isPending}
          confirmLabel="Delete?"
          onConfirm={() => remove.mutate(category.id)}
        >
          Delete
        </ConfirmButton>
      </div>
    </div>
  );
}

export function CategoriesAdmin() {
  const categories = useCategories();
  const { create } = useCategoryMutations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <MutationError error={create.error} />
      <form onSubmit={submit} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
        <Input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" disabled={create.isPending}>
          Add
        </Button>
      </form>
      {categories.isPending ? (
        <Spinner />
      ) : categories.isError ? (
        <ErrorBox message={errorMessage(categories.error)} />
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {categories.data.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
