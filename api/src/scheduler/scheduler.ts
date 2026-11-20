export type ScheduledJob = {
  name: string;
  intervalMs: number;
  run: () => Promise<unknown>;
};

export const startScheduler = (
  jobs: ScheduledJob[],
  logger: Pick<Console, "info" | "error"> = console,
) => {
  const timers = jobs
    .filter((job) => job.intervalMs > 0)
    .map((job) => {
      const tick = async () => {
        try {
          await job.run();
          logger.info(`[scheduler] ${job.name} finished`);
        } catch (error) {
          logger.error(`[scheduler] ${job.name} failed`, error);
        }
      };
      void tick();
      return setInterval(tick, job.intervalMs);
    });

  return () => timers.forEach(clearInterval);
};
