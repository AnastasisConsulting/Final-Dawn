/**
 * Navigation HUD
 * Displays speed, altitude, distance, heading, and warnings
 */

import React from 'react';
import { AtmosphericState } from '../../physics/atmosphericPhysics';

interface NavigationHUDProps {
    atmosphericState: AtmosphericState;
    targetDistance: number;
    targetDesignation: string;
    integrity: number;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
    atmosphericState,
    targetDistance,
    targetDesignation,
    integrity,
}) => {
    const { altitude, speed, heat, phase } = atmosphericState;

    // Convert m/s to km/h for display
    const speedKmh = speed * 3.6;

    // Warning states
    const heatWarning = heat > 70;
    const speedWarning = altitude < 2000 && speed > 50;
    const integrityWarning = integrity < 30;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Top Left - Phase & Target */}
            <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-black/60 border border-cyan-500/50 p-3 rounded">
                    <div className="text-cyan-400 text-xs uppercase tracking-wider mb-1">
                        Flight Phase
                    </div>
                    <div className="text-white font-mono text-sm">{phase.replace('_', ' ')}</div>
                </div>

                <div className="bg-black/60 border border-green-500/50 p-3 rounded">
                    <div className="text-green-400 text-xs uppercase tracking-wider mb-1">
                        Target Landing Pad
                    </div>
                    <div className="text-white font-mono text-lg font-bold">{targetDesignation}</div>
                    <div className="text-gray-400 text-xs">
                        {targetDistance < 1000
                            ? `${Math.round(targetDistance)}m`
                            : `${(targetDistance / 1000).toFixed(2)}km`}
                    </div>
                </div>
            </div>

            {/* Top Right - Telemetry */}
            <div className="absolute top-4 right-4 space-y-2">
                <TelemetryGauge label="ALTITUDE" value={altitude} max={100000} unit="m" color="cyan" />
                <TelemetryGauge
                    label="SPEED"
                    value={speedKmh}
                    max={500}
                    unit="km/h"
                    color={speedWarning ? 'amber' : 'green'}
                    warning={speedWarning}
                />
                <TelemetryGauge
                    label="HEAT"
                    value={heat}
                    max={100}
                    unit="%"
                    color={heatWarning ? 'red' : 'orange'}
                    warning={heatWarning}
                />
                <TelemetryGauge
                    label="INTEGRITY"
                    value={integrity}
                    max={100}
                    unit="%"
                    color={integrityWarning ? 'red' : 'emerald'}
                    warning={integrityWarning}
                />
            </div>

            {/* Center - Warnings */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 space-y-2">
                {heatWarning && (
                    <Warning message="⚠️ HEAT CRITICAL - REDUCE SPEED" color="red" />
                )}
                {speedWarning && (
                    <Warning message="⚠️ REDUCE SPEED FOR LANDING" color="amber" />
                )}
                {integrityWarning && (
                    <Warning message="⚠️ HULL INTEGRITY CRITICAL" color="red" />
                )}
                {altitude < 500 && speed < 15 && (
                    <div className="bg-green-900/90 border-2 border-green-500 text-green-200 px-6 py-3 rounded font-bold text-center">
                        ✓ LANDING CLEARANCE GRANTED
                    </div>
                )}
            </div>

            {/* Bottom - Speed Recommendation */}
            {altitude < 2000 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
                    <div className="bg-black/80 border border-yellow-500 px-4 py-2 rounded">
                        <div className="text-yellow-400 text-xs uppercase tracking-wider">
                            Approach Speed Limit
                        </div>
                        <div className="text-white font-mono text-2xl font-bold text-center">
                            20 km/h
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface TelemetryGaugeProps {
    label: string;
    value: number;
    max: number;
    unit: string;
    color: 'cyan' | 'green' | 'amber' | 'red' | 'orange' | 'emerald';
    warning?: boolean;
}

const TelemetryGauge: React.FC<TelemetryGaugeProps> = ({
    label,
    value,
    max,
    unit,
    color,
    warning,
}) => {
    const percentage = (value / max) * 100;

    const colors = {
        cyan: 'border-cyan-500 text-cyan-400',
        green: 'border-green-500 text-green-400',
        amber: 'border-amber-500 text-amber-400',
        red: 'border-red-500 text-red-400',
        orange: 'border-orange-500 text-orange-400',
        emerald: 'border-emerald-500 text-emerald-400',
    };

    const barColors = {
        cyan: 'bg-cyan-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        red: 'bg-red-500',
        orange: 'bg-orange-500',
        emerald: 'bg-emerald-500',
    };

    return (
        <div
            className={`bg-black/60 border ${colors[color]} p-3 rounded min-w-[200px] ${warning ? 'animate-pulse' : ''
                }`}
        >
            <div className={`${colors[color]} text-xs uppercase tracking-wider mb-1`}>
                {label}
            </div>
            <div className="text-white font-mono text-xl font-bold">
                {Math.round(value)} {unit}
            </div>
            <div className="w-full bg-gray-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                    className={`${barColors[color]} h-full rounded-full transition-all`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                />
            </div>
        </div>
    );
};

interface WarningProps {
    message: string;
    color: 'red' | 'amber';
}

const Warning: React.FC<WarningProps> = ({ message, color }) => {
    const bgColor = color === 'red' ? 'bg-red-900/90' : 'bg-amber-900/90';
    const borderColor = color === 'red' ? 'border-red-500' : 'border-amber-500';
    const textColor = color === 'red' ? 'text-red-200' : 'text-amber-200';

    return (
        <div
            className={`${bgColor} border-2 ${borderColor} ${textColor} px-6 py-3 rounded font-bold text-center animate-pulse`}
        >
            {message}
        </div>
    );
};
