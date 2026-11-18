import { Elysia } from "elysia";

const app = new Elysia()
  .get("/", () => "Agentic Marketplace API")
  .listen(Number(process.env.PORT ?? 3001));

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
