import { ConflictError, UnauthorizedError } from "../../common/errors";
import type { User, UserRepository } from "../users/user.repository";
import type { TokenService } from "./token.service";

export type RegisterInput = {
  email: string;
  password: string;
  displayName: string;
};

export type LoginInput = { email: string; password: string };

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const createAuthService = (users: UserRepository, tokens: TokenService) => {
  const issue = async (user: User) => ({ token: await tokens.sign(user.id), user });

  return {
    async register(input: RegisterInput) {
      const email = normalizeEmail(input.email);
      if (await users.findByEmail(email)) {
        throw new ConflictError("Email is already registered");
      }
      const user = await users.create({
        email,
        displayName: input.displayName.trim(),
        passwordHash: await Bun.password.hash(input.password),
        role: "USER",
      });
      return issue(user);
    },

    async login(input: LoginInput) {
      const user = await users.findByEmail(normalizeEmail(input.email));
      const valid =
        user !== null && (await Bun.password.verify(input.password, user.passwordHash));
      if (!valid) throw new UnauthorizedError("Invalid email or password");
      return issue(user);
    },

    async authenticate(token: string) {
      const userId = await tokens.verify(token);
      const user = userId ? await users.findById(userId) : null;
      if (!user) throw new UnauthorizedError("Invalid or expired token");
      return user;
    },
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
