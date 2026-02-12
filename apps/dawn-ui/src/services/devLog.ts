export type DevLogLevel = "debug" | "info" | "warn" | "error";

export type DevLogEntry = {
  id: string;
  ts: number;
  level: DevLogLevel;
  scope: string;
  msg: string;
  data?: any;
};

const STORAGE_ENABLED_KEY = "eideus-devlog-enabled";
const STORAGE_BUFFER_KEY = "eideus-devlog-buffer";
const MAX_ENTRIES = 800;

let enabled = (() => {
  try {
    return localStorage.getItem(STORAGE_ENABLED_KEY) === "1";
  } catch {
    return false;
  }
})();

const buffer: DevLogEntry[] = [];

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeJson(v: any): string | undefined {
  if (v == null) return undefined;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

let persistTimeout: any = null;
function persistBuffer() {
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    try {
      const trimmed = buffer.slice(-MAX_ENTRIES);
      localStorage.setItem(STORAGE_BUFFER_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }, 1000); // Persist at most once per second
}

function restoreBuffer() {
  try {
    const raw = localStorage.getItem(STORAGE_BUFFER_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      buffer.splice(0, buffer.length, ...parsed.slice(-MAX_ENTRIES));
    }
  } catch {
    // ignore
  }
}

restoreBuffer();

export function devLogEnable(next: boolean) {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_ENABLED_KEY, next ? "1" : "0");
  } catch {
    // ignore
  }
}

export function devLogIsEnabled() {
  return enabled;
}

export function devLogClear() {
  buffer.splice(0, buffer.length);
  persistBuffer();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("eideus-devlog-clear"));
  }
}

export function devLogSnapshot(): DevLogEntry[] {
  return buffer.slice();
}

export function devLog(level: DevLogLevel, scope: string, msg: string, data?: any) {
  if (!enabled) return;
  const entry: DevLogEntry = {
    id: nowId(),
    ts: Date.now(),
    level,
    scope,
    msg,
    data,
  };

  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
  persistBuffer();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("eideus-devlog", { detail: entry }));
  }
}

export function devLogTimer(scope: string, msg: string, data?: any) {
  const start = performance.now();
  devLog("debug", scope, `${msg} (start)`, data);
  return {
    end(extra?: any) {
      const ms = Math.round((performance.now() - start) * 10) / 10;
      devLog("debug", scope, `${msg} (end, ${ms}ms)`, extra);
      return ms;
    },
  };
}

export function devLogExportText(): string {
  const rows = buffer.map((e) => {
    const t = new Date(e.ts).toLocaleTimeString("en-US", { hour12: false });
    const d = safeJson(e.data);
    return `${t} [${e.level.toUpperCase()}] ${e.scope}: ${e.msg}${d ? ` | data=${d}` : ""}`;
  });
  return rows.join("\n");
}

