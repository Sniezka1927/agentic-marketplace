import { beforeEach, describe, expect, it } from "bun:test";
import { call, createTestApp, createUser, resetDb } from "../helpers";

const app = createTestApp();

beforeEach(async () => {
  await resetDb();
});

const register = (body: Record<string, unknown>) =>
  call(app, "POST", "/auth/register", { body });

const validUser = {
  email: "Jan.Kowalski@Example.com",
  password: "secret-pass-1",
  displayName: "Jan",
};

describe("/auth", () => {
  it("registers a USER and returns token without password hash", async () => {
    const res = await register(validUser);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toBeString();
    expect(body.user).toMatchObject({ email: "jan.kowalski@example.com", role: "USER" });
    expect(body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email ignoring case", async () => {
    await register(validUser);
    const res = await register({ ...validUser, email: "jan.kowalski@example.com" });
    expect(res.status).toBe(409);
  });

  it("validates register payload", async () => {
    const res = await register({ email: "not-an-email", password: "short", displayName: "J" });
    expect(res.status).toBe(422);
  });

  it("logs in with correct credentials", async () => {
    await register(validUser);
    const res = await call(app, "POST", "/auth/login", {
      body: { email: validUser.email, password: validUser.password },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBeString();
  });

  it("returns 401 for wrong password and unknown email", async () => {
    await register(validUser);
    const wrong = await call(app, "POST", "/auth/login", {
      body: { email: validUser.email, password: "wrong-password" },
    });
    const unknown = await call(app, "POST", "/auth/login", {
      body: { email: "nobody@example.com", password: "whatever-123" },
    });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
  });

  it("returns current user for valid token", async () => {
    const { token } = await (await register(validUser)).json();
    const res = await call(app, "GET", "/auth/me", { token });
    expect(res.status).toBe(200);
    expect((await res.json()).email).toBe("jan.kowalski@example.com");
  });

  it("returns 401 for missing or invalid token", async () => {
    expect((await call(app, "GET", "/auth/me")).status).toBe(401);
    expect((await call(app, "GET", "/auth/me", { token: "garbage" })).status).toBe(401);
  });
});

describe("/users", () => {
  it("lets admin list users with pagination", async () => {
    const { token } = await createUser(app, "ADMIN");
    await createUser(app, "USER");
    await createUser(app, "USER");
    const res = await call(app, "GET", "/users?limit=2", { token });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(2);
  });

  it("forbids regular users", async () => {
    const { token } = await createUser(app, "USER");
    expect((await call(app, "GET", "/users", { token })).status).toBe(403);
  });

  it("lets admin promote a user but not change own role", async () => {
    const admin = await createUser(app, "ADMIN");
    const { user } = await createUser(app, "USER");

    const promoted = await call(app, "PATCH", `/users/${user.id}/role`, {
      body: { role: "ADMIN" },
      token: admin.token,
    });
    expect(promoted.status).toBe(200);
    expect((await promoted.json()).role).toBe("ADMIN");

    const self = await call(app, "PATCH", `/users/${admin.user.id}/role`, {
      body: { role: "USER" },
      token: admin.token,
    });
    expect(self.status).toBe(422);
  });

  it("applies role change to existing tokens immediately", async () => {
    const admin = await createUser(app, "ADMIN");
    const regular = await createUser(app, "USER");
    expect((await call(app, "GET", "/users", { token: regular.token })).status).toBe(403);

    await call(app, "PATCH", `/users/${regular.user.id}/role`, {
      body: { role: "ADMIN" },
      token: admin.token,
    });
    expect((await call(app, "GET", "/users", { token: regular.token })).status).toBe(200);
  });
});
