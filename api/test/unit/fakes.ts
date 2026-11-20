import type { User, UserRepository } from "../../src/modules/users/user.repository";

export const createFakeUserRepo = () => {
  const rows = new Map<string, User>();

  const repo: UserRepository = {
    findById: async (id) => rows.get(id) ?? null,
    findByEmail: async (email) =>
      [...rows.values()].find((u) => u.email === email) ?? null,
    create: async (data) => {
      const now = new Date();
      const user: User = {
        id: crypto.randomUUID(),
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        role: data.role ?? "USER",
        createdAt: now,
        updatedAt: now,
      };
      rows.set(user.id, user);
      return user;
    },
    list: async (page) => ({ ...page, items: [...rows.values()], total: rows.size }),
    updateRole: async (id, role) => {
      const user = { ...rows.get(id)!, role };
      rows.set(id, user);
      return user;
    },
  };

  return { repo, rows };
};
