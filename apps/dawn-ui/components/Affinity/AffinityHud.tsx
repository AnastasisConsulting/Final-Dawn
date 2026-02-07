
import React from 'react';
import { AffinityVector, useAffinitySnapshot } from '../../stubs/affinity';

interface AffinityHudProps {
    selectedId: string | null;
}

export const AffinityHud: React.FC<AffinityHudProps> = ({ selectedId }) => {
    const snapshot = useAffinitySnapshot();
    const vector = selectedId ? snapshot?.vectors?.[selectedId] ?? null : null;

    const dominant = vector
        ? (Object.entries(vector) as Array<[keyof AffinityVector, number]>).reduce((acc, cur) =>
            Math.abs(cur[1]) > Math.abs(acc[1]) ? cur : acc
        )[0]
        : 'None';

    const magnitude = vector
        ? Math.sqrt(vector.G ** 2 + vector.E ** 2 + vector.S ** 2)
        : 0;

    const bar = (label: keyof AffinityVector, color: string) => {
        const value = vector ? vector[label] : 0;
        const width = Math.min(100, Math.abs(value) * 40);
        return (
            <div className="flex items-center gap-2">
                <span className="w-4 text-[9px] text-slate-300">{label}</span>
                <div className="flex-1 h-1 bg-slate-800 rounded-sm overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
                </div>
                <span className="w-12 text-right text-[9px] text-slate-400 tabular-nums">
                    {value.toFixed(2)}
                </span>
            </div>
        );
    };

    return (
        <div className="absolute top-4 left-4 z-[60] pointer-events-none">
            <div className="bg-black/70 border border-cyan-700/40 px-3 py-2 text-[9px] font-mono uppercase tracking-widest text-cyan-200 shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                <div className="flex items-center justify-between gap-6">
                    <div>
                        <div className="text-[8px] text-cyan-500">Affinity Live</div>
                        <div className="text-[10px] text-cyan-100">
                            {selectedId || 'No Selection'} [OFFLINE]
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] text-cyan-500">Tick</div>
                        <div className="text-[10px] text-cyan-100">{snapshot?.tick ?? '--'}</div>
                    </div>
                </div>
                <div className="mt-2 space-y-1">
                    {bar('G', 'bg-emerald-400')}
                    {bar('E', 'bg-amber-400')}
                    {bar('S', 'bg-violet-400')}
                </div>
                <div className="mt-2 flex items-center justify-between text-[8px] text-cyan-400">
                    <span>Dominant</span>
                    <span className="text-cyan-100">{dominant}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[8px] text-cyan-400">
                    <span>Magnitude</span>
                    <span className="text-cyan-100">{magnitude.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};
