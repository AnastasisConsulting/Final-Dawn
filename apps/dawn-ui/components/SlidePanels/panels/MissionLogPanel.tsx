
import React from "react";

export type MissionLogEntry = {
  id: string;
  locKey?: string;
  questId?: string;
  effect?: string;
  timestamp: number;
};

export const MissionLogPanel: React.FC<{ entries: MissionLogEntry[] }> = ({ entries }) => {
  const sorted = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-200 p-4 space-y-3">
      {sorted.length === 0 && <div className="text-slate-500 text-sm">No quest events recorded.</div>}
      {sorted.map((e) => (
        <div key={e.id} className="border border-slate-800 bg-slate-900 p-3 rounded">
          <div className="text-xs text-slate-500">{new Date(e.timestamp).toLocaleString()}</div>
          <div className="text-sm font-semibold text-cyan-200">
            {e.effect === "complete"
              ? "Quest Completed"
              : e.effect === "escalate"
              ? "Quest Escalated"
              : e.effect === "expire"
              ? "Quest Expired"
              : "Quest Update"}
          </div>
          <div className="text-xs text-slate-400">
            Quest: {e.questId || "unknown"} at {e.locKey || "n/a"}
          </div>
        </div>
      ))}
    </div>
  );
};
