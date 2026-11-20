import { t, type Static } from "elysia";
import type { User } from "./user.repository";

export const RoleSchema = t.UnionEnum(["USER", "ADMIN"]);

export const UserDto = t.Object({
  id: t.String({ format: "uuid" }),
  email: t.String(),
  displayName: t.String(),
  role: RoleSchema,
  createdAt: t.String({ format: "date-time" }),
});

export const UpdateRoleBody = t.Object({ role: RoleSchema });

export const toUserDto = (user: User): Static<typeof UserDto> => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});
