export type AppEvents = {
  "template.installed": { templateId: string; userId: string };
  "template.uninstalled": { templateId: string; userId: string };
  "review.created": { templateId: string; reviewId: string };
  "review.updated": { templateId: string; reviewId: string };
  "review.deleted": { templateId: string; reviewId: string };
};

export type EventName = keyof AppEvents;
export type EventHandler<E extends EventName> = (payload: AppEvents[E]) => Promise<void> | void;

export interface EventPublisher {
  publish<E extends EventName>(event: E, payload: AppEvents[E]): void;
}

export const createEventBus = (logger: Pick<Console, "error"> = console) => {
  const handlers = new Map<EventName, EventHandler<EventName>[]>();
  const pending = new Set<Promise<void>>();

  const run = async <E extends EventName>(event: E, payload: AppEvents[E]) => {
    await new Promise((resolve) => setImmediate(resolve));
    for (const handler of handlers.get(event) ?? []) {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`Handler for "${event}" failed`, error);
      }
    }
  };

  return {
    subscribe<E extends EventName>(event: E, handler: EventHandler<E>) {
      const list = handlers.get(event) ?? [];
      list.push(handler as EventHandler<EventName>);
      handlers.set(event, list);
    },

    publish<E extends EventName>(event: E, payload: AppEvents[E]) {
      const task = run(event, payload).finally(() => pending.delete(task));
      pending.add(task);
    },

    async drain() {
      while (pending.size > 0) {
        await Promise.all(pending);
      }
    },
  };
};

export type EventBus = ReturnType<typeof createEventBus>;
