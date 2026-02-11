import React, { useEffect, useMemo, useState } from "react";
import {
  devLogClear,
  devLogEnable,
  devLogExportText,
  devLogIsEnabled,
  devLogSnapshot,
  DevLogEntry,
  DevLogLevel,
} from "../../../src/services/devLog";

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
}

function levelColor(level: DevLogLevel) {
  if (level === "error") return "text-red-300";
  if (level === "warn") return "text-yellow-200";
  if (level === "info") return "text-cyan-200";
  return "text-neutral-300";
}

export const DevTerminal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [enabled, setEnabled] = useState(devLogIsEnabled());
  const [entries, setEntries] = useState<DevLogEntry[]>(() => devLogSnapshot());
  const [level, setLevel] = useState<DevLogLevel | "all">("all");
  const [scope, setScope] = useState("");

  useEffect(() => {
    const onEntry = (e: any) => setEntries((prev) => [...prev, e.detail as DevLogEntry]);
    const onClear = () => setEntries([]);
    window.addEventListener("eideus-devlog", onEntry as any);
    window.addEventListener("eideus-devlog-clear", onClear as any);
    return () => {
      window.removeEventListener("eideus-devlog", onEntry as any);
      window.removeEventListener("eideus-devlog-clear", onClear as any);
    };
  }, []);

  useEffect(() => {
    devLogEnable(enabled);
  }, [enabled]);

  const filtered = useMemo(() => {
    const s = scope.trim().toLowerCase();
    return entries.filter((e) => {
      if (level !== "all" && e.level !== level) return false;
      if (!s) return true;
      return e.scope.toLowerCase().includes(s) || e.msg.toLowerCase().includes(s);
    });
  }, [entries, level, scope]);

  if (!open) return null;

  return (
    <div className="absolute bottom-4 left-4 z-[100] w-[520px] max-w-[calc(100vw-2rem)]">
      <div className="bg-black/80 border border-cyan-700/40 shadow-[0_0_30px_rgba(34,211,238,0.12)] rounded-md overflow-hidden backdrop-blur-sm font-mono">
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-700/30">
          <div className="text-xs tracking-[0.25em] uppercase text-cyan-200">Dev Terminal</div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 flex items-center gap-2">
              <span>Log</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-3.5 w-3.5 accent-cyan-400"
              />
            </label>
            <button
              onClick={() => {
                devLogClear();
              }}
              className="text-[10px] uppercase tracking-widest text-neutral-300 hover:text-white"
            >
              Clear
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(devLogExportText());
                } catch {
                  // ignore
                }
              }}
              className="text-[10px] uppercase tracking-widest text-neutral-300 hover:text-white"
            >
              Copy
            </button>
            <button
              onClick={onClose}
              className="text-[10px] uppercase tracking-widest text-neutral-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as any)}
            className="bg-black/40 border border-white/10 text-[10px] text-neutral-200 px-2 py-1 rounded"
          >
            <option value="all">ALL</option>
            <option value="debug">DEBUG</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </select>
          <input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="filter (scope/message)"
            className="flex-1 bg-black/40 border border-white/10 text-[10px] text-neutral-200 px-2 py-1 rounded outline-none"
          />
          <div className="text-[10px] text-neutral-500">{filtered.length}</div>
        </div>

        <div className="max-h-[320px] overflow-y-auto custom-scrollbar px-3 py-2 text-[10px] leading-relaxed">
          {filtered.slice(-250).map((e) => (
            <div key={e.id} className="py-1 border-b border-white/5">
              <div className="flex items-baseline gap-2">
                <span className="text-neutral-500">{fmtTime(e.ts)}</span>
                <span className={levelColor(e.level)}>[{e.level.toUpperCase()}]</span>
                <span className="text-fuchsia-200">{e.scope}</span>
                <span className="text-neutral-200">{e.msg}</span>
              </div>
              {e.data != null && (
                <pre className="mt-1 bg-black/30 border border-white/5 rounded p-2 overflow-x-auto text-neutral-300">
                  {(() => {
                    try {
                      return JSON.stringify(e.data, null, 2);
                    } catch {
                      return String(e.data);
                    }
                  })()}
                </pre>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="text-neutral-500">No entries.</div>}
        </div>
      </div>
    </div>
  );
};

