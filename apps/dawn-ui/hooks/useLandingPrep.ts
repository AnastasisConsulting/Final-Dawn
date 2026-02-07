import { useEffect, useState } from 'react';

export interface LandingPrepEvent {
  targetId: string;
  targetName?: string;
  at: number;
}

/**
 * Listens for landing-prep events (emitted when descent starts) to pre-generate world data.
 */
export function useLandingPrep(): LandingPrepEvent | null {
  const [landing, setLanding] = useState<LandingPrepEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ targetId: string; targetName?: string }>;
      const detail = custom.detail || { targetId: 'unknown' };
      setLanding({ targetId: detail.targetId, targetName: detail.targetName, at: Date.now() });
    };
    window.addEventListener('landing-prep', handler as EventListener);
    return () => window.removeEventListener('landing-prep', handler as EventListener);
  }, []);

  return landing;
}
