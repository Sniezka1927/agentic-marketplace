import { SignJWT, jwtVerify } from "jose";

export const createTokenService = (secret: string, expiresIn: string) => {
  const key = new TextEncoder().encode(secret);

  return {
    sign: (userId: string) =>
      new SignJWT()
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(key),

    async verify(token: string): Promise<string | null> {
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
        return payload.sub ?? null;
      } catch {
        return null;
      }
    },
  };
};

export type TokenService = ReturnType<typeof createTokenService>;
