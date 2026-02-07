import React from 'react';
import { useGameStore } from '../store';
import { GamePhase } from '../types';
import { Activity, Thermometer, Gauge, ShieldAlert, Radio, ArrowDownToLine } from 'lucide-react';

export const HUD: React.FC = () => {
  const { altitude, speed, hull, temperature, phase, message, isMessageLoading, landingGearDeployed } = useGameStore();

  const getPhaseColor = () => {
    switch (phase) {
      case GamePhase.ORBIT: return 'text-blue-400';
      case GamePhase.ENTRY: return 'text-orange-500 animate-pulse';
      case GamePhase.FLIGHT: return 'text-green-400';
      case GamePhase.LANDED: return 'text-green-600';
      case GamePhase.CRASHED: return 'text-red-600';
      default: return 'text-white';
    }
  };

  // Safe Speed: 0.9 (900km/h). Ideal Landing: 0.3 (300km/h)
  const isSafeToDeploy = speed < 0.9 && altitude < 1000;
  
  let gearColorClass = "bg-gray-700 text-gray-400 border-gray-600"; // Default Off
  
  if (landingGearDeployed) {
      gearColorClass = "bg-green-500/20 text-green-400 border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.5)]";
  } else if (isSafeToDeploy) {
      // Prompt user they can deploy
      gearColorClass = "bg-green-900/40 text-green-700 border-green-800"; 
  } else {
      // Unsafe
      gearColorClass = "bg-red-900/20 text-red-500 border-red-800";
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between hud-font text-white select-none">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-br-2xl border-l-4 border-t-4 border-cyan-500/50">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-cyan-400">Orbital Drop</h1>
          <div className={`text-xl font-mono mt-1 ${getPhaseColor()}`}>
             PHASE: {phase}
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-bl-2xl border-r-4 border-t-4 border-red-500/50 flex flex-col items-end">
            <div className="flex items-center gap-2 text-red-400 mb-1">
                <ShieldAlert size={20} />
                <span className="font-bold">INTEGRITY</span>
            </div>
            <div className="w-48 h-4 bg-gray-800 rounded overflow-hidden">
                <div 
                  className={`h-full ${hull < 30 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`} 
                  style={{ width: `${Math.max(0, hull)}%` }}
                />
            </div>
            <span className="text-lg">{Math.round(hull)}%</span>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
          <div className="w-8 h-8 border-2 border-cyan-500 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-500 rounded-full" />
          </div>
      </div>

      {temperature > 800 && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-red-500 font-bold text-2xl animate-bounce border-2 border-red-500 p-2 bg-black/50">
              WARNING: CRITICAL TEMPERATURE
          </div>
      )}

      {message && (
        <div className="absolute top-28 left-6 w-80">
             <div className="bg-slate-900/80 border border-cyan-500/30 p-3 rounded text-left">
                 <div className="flex items-center gap-2 text-cyan-400 text-xs uppercase mb-1">
                    <Radio size={14} className={isMessageLoading ? "animate-spin" : ""} />
                    Mission Control
                 </div>
                 <p className="text-cyan-100 font-mono text-sm leading-tight">
                    "{message}"
                 </p>
             </div>
        </div>
      )}

      {/* Landing Gear Indicator - New Addition */}
      <div className={`absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 rounded border-2 backdrop-blur-md transition-all duration-300 ${gearColorClass}`}>
          <ArrowDownToLine size={24} className={landingGearDeployed ? "" : "opacity-50"} />
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold tracking-widest uppercase">Landing Gear</span>
             <span className="text-lg font-mono font-bold">
                {landingGearDeployed ? "DEPLOYED" : (isSafeToDeploy ? "READY" : "LOCKED")}
             </span>
          </div>
          {!landingGearDeployed && !isSafeToDeploy && (
             <span className="text-xs text-red-500 font-bold animate-pulse absolute -bottom-5">SPEED WARNING</span>
          )}
          {!landingGearDeployed && isSafeToDeploy && (
             <span className="text-xs text-green-500 font-bold animate-pulse absolute -bottom-5">[SPACE] TO DEPLOY</span>
          )}
      </div>

      {/* Bottom Bar: Telemetry */}
      <div className="flex justify-between items-end">
         <div className="bg-black/40 backdrop-blur-sm p-4 rounded-tr-2xl border-l-4 border-b-4 border-yellow-500/50 min-w-[200px]">
            <div className="flex items-center gap-3 mb-2 text-yellow-400">
                <Gauge size={24} />
                <div className="flex flex-col">
                    <span className="text-xs uppercase opacity-70">Velocity</span>
                    <span className="text-2xl font-mono leading-none">{Math.round(speed * 1000)} <span className="text-sm">km/h</span></span>
                </div>
            </div>
            <div className="flex items-center gap-3 text-orange-400">
                <Thermometer size={24} />
                <div className="flex flex-col">
                    <span className="text-xs uppercase opacity-70">Heat Shield</span>
                    <span className="text-2xl font-mono leading-none">{Math.round(temperature)} <span className="text-sm">°C</span></span>
                </div>
            </div>
         </div>

         <div className="bg-black/40 backdrop-blur-sm p-4 rounded-tl-2xl border-r-4 border-b-4 border-blue-500/50 min-w-[200px] text-right">
            <div className="flex flex-col items-end text-blue-400">
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase opacity-70">Altitude</span>
                    <Activity size={20} />
                 </div>
                 <span className="text-4xl font-mono font-bold">{Math.round(altitude)} <span className="text-lg text-gray-400">m</span></span>
            </div>
            {altitude < 500 && altitude > 0 && (
                <div className="text-red-400 text-sm mt-1 animate-pulse font-bold">TERRAIN WARNING</div>
            )}
         </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono text-center">
          [MOUSE] Steer | [W/S] Throttle | [SPACE] Gear/Brake | [SHIFT] Boost
      </div>

    </div>
  );
};