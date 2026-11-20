import { t } from "elysia";
import { UserDto } from "../users/user.dto";

export const RegisterBody = t.Object({
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 128 }),
  displayName: t.String({ minLength: 2, maxLength: 100 }),
});

export const LoginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const AuthResponse = t.Object({
  token: t.String(),
  user: UserDto,
});
