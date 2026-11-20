import { describe, expect, it } from "bun:test";
import { BusinessRuleError, NotFoundError } from "../../src/common/errors";
import { createUserService } from "../../src/modules/users/user.service";
import { createFakeUserRepo } from "./fakes";

const seed = async () => {
  const fake = createFakeUserRepo();
  const admin = await fake.repo.create({
    email: "admin@test.dev",
    passwordHash: "x",
    displayName: "Admin",
    role: "ADMIN",
  });
  const user = await fake.repo.create({
    email: "user@test.dev",
    passwordHash: "x",
    displayName: "User",
  });
  return { service: createUserService(fake.repo), admin, user };
};

describe("UserService.changeRole", () => {
  it("changes role of another user", async () => {
    const { service, admin, user } = await seed();
    expect((await service.changeRole(admin, user.id, "ADMIN")).role).toBe("ADMIN");
  });

  it("forbids changing own role", async () => {
    const { service, admin } = await seed();
    await expect(service.changeRole(admin, admin.id, "USER")).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });

  it("throws NotFoundError for unknown user", async () => {
    const { service, admin } = await seed();
    await expect(
      service.changeRole(admin, crypto.randomUUID(), "ADMIN"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
