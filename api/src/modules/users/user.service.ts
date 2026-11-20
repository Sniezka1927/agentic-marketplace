import { BusinessRuleError, NotFoundError } from "../../common/errors";
import type { PageRequest } from "../../common/pagination";
import type { Role, User, UserRepository } from "./user.repository";

export const createUserService = (repo: UserRepository) => ({
  list: (query: PageRequest & { q?: string }) => repo.list(query),

  async changeRole(actor: User, targetId: string, role: Role) {
    if (actor.id === targetId) {
      throw new BusinessRuleError("You cannot change your own role");
    }
    const target = await repo.findById(targetId);
    if (!target) throw new NotFoundError("User not found");
    return repo.updateRole(targetId, role);
  },
});

export type UserService = ReturnType<typeof createUserService>;
