export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  jwt: {
    secret: process.env.JWT_SECRET ?? "",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? "",
    password: process.env.ADMIN_PASSWORD ?? "",
  },
  xMarketplace: {
    url: process.env.X_MARKETPLACE_URL ?? "",
    token: process.env.X_MARKETPLACE_TOKEN ?? "",
  },
};
