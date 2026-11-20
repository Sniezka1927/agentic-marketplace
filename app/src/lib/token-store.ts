const KEY = "agentic-marketplace.token";
const listeners = new Set<() => void>();

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const notify = () => listeners.forEach((listener) => listener());

export const tokenStore = {
  get: read,

  getServerSnapshot: () => null,

  set(token: string | null) {
    try {
      if (token) localStorage.setItem(KEY, token);
      else localStorage.removeItem(KEY);
    } catch {}
    notify();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};
