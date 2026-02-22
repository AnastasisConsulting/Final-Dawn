import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  devLogClear,
  devLogEnable,
  devLogExportText,
  devLogIsEnabled,
  devLogSnapshot,
  DevLogEntry,
  DevLogLevel,
} from "../../../src/services/devLog";

const LS_POS = "eideus.devterminal.pos.v1";
const LS_COLLAPSED = "eideus.devterminal.collapsed.v1";

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
  embedded?: boolean;
}> = ({ open, onClose, embedded = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(devLogIsEnabled());
  const [entries, setEntries] = useState<DevLogEntry[]>(() => devLogSnapshot());
  const [level, setLevel] = useState<DevLogLevel | "all">("all");
  const [scope, setScope] = useState("");
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_COLLAPSED) === "1";
    } catch {
      return false;
    }
  });

  const [copySuccess, setCopySuccess] = useState(false);

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(LS_POS);
      if (raw) {
        const v = JSON.parse(raw);
        if (Number.isFinite(v?.x) && Number.isFinite(v?.y)) return { x: Number(v.x), y: Number(v.y) };
      }
    } catch {
      // ignore
    }
    // Default: bottom-left-ish
    const x = 16;
    const y = typeof window !== "undefined" ? Math.max(16, window.innerHeight - 420) : 16;
    return { x, y };
  });

  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    dx: number;
    dy: number;
  }>({
    active: false,
    pointerId: -1,
    dx: 0,
    dy: 0,
  });

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

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_POS, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [pos]);

  useEffect(() => {
    const clampToViewport = () => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - r.width - 8);
      const maxY = Math.max(8, window.innerHeight - r.height - 8);
      setPos((p) => ({
        x: Math.min(Math.max(8, p.x), maxX),
        y: Math.min(Math.max(8, p.y), maxY),
      }));
    };
    if (embedded) return;
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [collapsed, open, embedded]);

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
    <div
      ref={containerRef}
      className={embedded ? "w-full h-full flex flex-col" : "fixed z-[100] w-[520px] max-w-[calc(100vw-1rem)] pointer-events-auto"}
      style={embedded ? {} : { left: pos.x, top: pos.y }}
    >
      <div className={`bg-black/80 border border-cyan-700/40 shadow-[0_0_30px_rgba(34,211,238,0.12)] rounded-md overflow-hidden backdrop-blur-sm font-mono flex flex-col ${embedded ? 'h-full border-none shadow-none bg-transparent' : ''}`}>
        <div
          className={`flex items-center justify-between px-3 py-2 border-b border-cyan-700/30 select-none ${embedded ? '' : 'cursor-move'}`}
          onDoubleClick={() => setCollapsed((c) => !c)}
          onPointerDown={(e) => {
            if (embedded) return;
            // Drag by title bar (ignore clicks on buttons/inputs)
            const t = e.target as HTMLElement | null;
            if (t && (t.closest("button") || t.closest("input") || t.closest("select"))) return;

            const el = containerRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            dragRef.current.active = true;
            dragRef.current.pointerId = e.pointerId;
            dragRef.current.dx = e.clientX - r.left;
            dragRef.current.dy = e.clientY - r.top;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragRef.current.active) return;
            if (e.pointerId !== dragRef.current.pointerId) return;
            const el = containerRef.current;
            if (!el) return;

            const r = el.getBoundingClientRect();
            const nextX = e.clientX - dragRef.current.dx;
            const nextY = e.clientY - dragRef.current.dy;
            const maxX = Math.max(8, window.innerWidth - r.width - 8);
            const maxY = Math.max(8, window.innerHeight - r.height - 8);

            setPos({
              x: Math.min(Math.max(8, nextX), maxX),
              y: Math.min(Math.max(8, nextY), maxY),
            });
          }}
          onPointerUp={(e) => {
            if (e.pointerId !== dragRef.current.pointerId) return;
            dragRef.current.active = false;
            dragRef.current.pointerId = -1;
            try {
              (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }}
          onPointerCancel={() => {
            dragRef.current.active = false;
            dragRef.current.pointerId = -1;
          }}
        >
          <div className="text-xs tracking-[0.25em] uppercase text-cyan-200">
            Dev Terminal{collapsed ? " (collapsed)" : ""}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="px-2 py-1 text-[9px] uppercase tracking-tighter text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors"
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <label className="text-[10px] uppercase tracking-widest text-neutral-400 flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors px-1">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[9px]">LOG</span>
            </label>
            <button
              onClick={() => {
                devLogClear();
              }}
              className="px-2 py-1 text-[9px] uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-red-500/20 rounded transition-colors"
            >
              Clear
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(devLogExportText());
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                } catch {
                  // ignore
                }
              }}
              className={`px-2 py-1 text-[9px] uppercase tracking-wider rounded transition-all ${copySuccess ? 'bg-green-500/40 text-green-100 border border-green-500/50' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
            >
              {copySuccess ? "COPIED!" : "Copy"}
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 text-[9px] uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-red-500/40 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
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
                  <div className={`flex items-baseline gap-2 ${embedded ? 'flex-col gap-0' : ''}`}>
                    {!embedded && <span className="text-neutral-500">{fmtTime(e.ts)}</span>}
                    <div className="flex gap-2 items-baseline">
                      <span className={levelColor(e.level)}>[{e.level.toUpperCase()}]</span>
                      <span className="text-fuchsia-200">{e.scope}</span>
                    </div>
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
          </>
        )}
      </div>
    </div>
  );
};
