import { Elysia } from "elysia";

export const app = new Elysia().get("/", () => "Agentic Marketplace API");
