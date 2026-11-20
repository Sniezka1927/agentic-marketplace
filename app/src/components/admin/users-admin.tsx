"use client";

import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useChangeRole, useUsers } from "@/lib/manage-queries";
import type { Role } from "@/lib/types";
import { useAuth } from "../auth-provider";
import { MutationError } from "../mutation-error";
import { Pagination } from "../pagination";
import { Button, ErrorBox, Input, Select, Spinner } from "../ui";

export function UsersAdmin() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const users = useUsers(page, q);
  const changeRole = useChangeRole();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setQ(search.trim());
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <MutationError error={changeRole.error} />
      <form onSubmit={submit} className="flex gap-2">
        <Input
          placeholder="Search by email or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {users.isPending ? (
        <Spinner />
      ) : users.isError ? (
        <ErrorBox message={errorMessage(users.error)} />
      ) : (
        <>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">User</th>
                <th className="py-2">Joined</th>
                <th className="py-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {users.data.items.map((user) => (
                <tr key={user.id}>
                  <td className="py-2">
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="py-2 text-zinc-500">{formatDate(user.createdAt)}</td>
                  <td className="py-2">
                    <Select
                      className="w-28"
                      aria-label={`Role of ${user.displayName}`}
                      value={user.role}
                      disabled={user.id === me?.id || changeRole.isPending}
                      onChange={(e) =>
                        changeRole.mutate({ id: user.id, role: e.target.value as Role })
                      }
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            limit={users.data.limit}
            total={users.data.total}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
