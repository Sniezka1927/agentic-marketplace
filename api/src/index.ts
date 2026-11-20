import { createApp } from "./app";
import { config } from "./config";
import { createContainer } from "./container";
import { db } from "./db/client";

const app = createApp(createContainer(db)).listen(config.port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
