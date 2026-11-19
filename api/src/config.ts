export const config = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  xMarketplace: {
    url: process.env.X_MARKETPLACE_URL ?? "",
    token: process.env.X_MARKETPLACE_TOKEN ?? "",
  },
};
