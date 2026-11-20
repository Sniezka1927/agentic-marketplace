import { createApp } from "./app";
import { config } from "./config";
import { createContainer } from "./container";
import { db } from "./db/client";
import { startScheduler } from "./scheduler/scheduler";

const container = createContainer(db);
const app = createApp(container).listen(config.port);

startScheduler([
  {
    name: "x-marketplace-sync",
    intervalMs: config.xMarketplace.syncIntervalMinutes * 60_000,
    run: () => container.syncService.runNow(),
  },
]);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
