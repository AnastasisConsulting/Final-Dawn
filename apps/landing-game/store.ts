import { create } from 'zustand';
import { GamePhase, GameState, Vector3 } from './types';

interface GameStore extends GameState {
  landingPadPosition: Vector3;
  setSpeed: (speed: number) => void;
  setAltitude: (alt: number) => void;
  setTemperature: (temp: number) => void;
  setHull: (hull: number) => void;
  setPhase: (phase: GamePhase) => void;
  setMessage: (msg: string) => void;
  setIsMessageLoading: (loading: boolean) => void;
  toggleLandingGear: () => void;
  resetGame: () => void;
}

const INITIAL_STATE: GameState = {
  speed: 0,
  altitude: 3000,
  temperature: 0,
  hull: 100,
  phase: GamePhase.ORBIT,
  message: "System initialized. Orbit established. Prepare for descent.",
  isMessageLoading: false,
  score: 0,
  sessionId: 0,
  landingGearDeployed: false,
};

// Target Location (Offset from center to force navigation)
const TARGET_POS: Vector3 = [1500, 0, -2500];

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL_STATE,
  landingPadPosition: TARGET_POS,
  setSpeed: (speed) => set({ speed }),
  setAltitude: (altitude) => set({ altitude }),
  setTemperature: (temperature) => set({ temperature }),
  setHull: (hull) => set({ hull }),
  setPhase: (phase) => set({ phase }),
  setMessage: (message) => set({ message }),
  setIsMessageLoading: (isMessageLoading) => set({ isMessageLoading }),
  toggleLandingGear: () => set((state) => ({ landingGearDeployed: !state.landingGearDeployed })),
  resetGame: () => set((state) => ({ 
      ...INITIAL_STATE, 
      sessionId: state.sessionId + 1 
  })),
}));