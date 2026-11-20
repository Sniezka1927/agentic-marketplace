import { beforeEach, describe, expect, it } from "bun:test";
import { ConflictError, UnauthorizedError } from "../../src/common/errors";
import { createAuthService, type AuthService } from "../../src/modules/auth/auth.service";
import { createTokenService } from "../../src/modules/auth/token.service";
import { createFakeUserRepo } from "./fakes";

const secret = crypto.getRandomValues(new Uint8Array(32)).toHex();

describe("AuthService", () => {
  let fake: ReturnType<typeof createFakeUserRepo>;
  let service: AuthService;

  beforeEach(() => {
    fake = createFakeUserRepo();
    service = createAuthService(fake.repo, createTokenService(secret, "1h"));
  });

  const input = { email: "  Ala@Example.COM ", password: "secret-pass", displayName: " Ala " };

  it("normalizes email, hashes password and always assigns USER role", async () => {
    const { user } = await service.register(input);
    expect(user.email).toBe("ala@example.com");
    expect(user.displayName).toBe("Ala");
    expect(user.role).toBe("USER");
    expect(user.passwordHash).not.toBe(input.password);
    expect(await Bun.password.verify(input.password, user.passwordHash)).toBe(true);
  });

  it("rejects duplicate email", async () => {
    await service.register(input);
    await expect(service.register({ ...input, email: "ala@example.com" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("rejects wrong password", async () => {
    await service.register(input);
    await expect(
      service.login({ email: "ala@example.com", password: "nope" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("issues a token that authenticates the user", async () => {
    const { token, user } = await service.register(input);
    expect((await service.authenticate(token)).id).toBe(user.id);
  });

  it("rejects token of a deleted user", async () => {
    const { token, user } = await service.register(input);
    fake.rows.delete(user.id);
    await expect(service.authenticate(token)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects token signed with another secret", async () => {
    const { user } = await service.register(input);
    const foreign = createTokenService(
      crypto.getRandomValues(new Uint8Array(32)).toHex(),
      "1h",
    );
    await expect(service.authenticate(await foreign.sign(user.id))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
