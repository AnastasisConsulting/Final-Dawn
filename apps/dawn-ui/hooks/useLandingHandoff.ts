import { useEffect, useState } from 'react';

export interface LandingEvent {
  targetId: string;
  targetName?: string;
  at: number;
}

/**
 * Listens for landing-success events broadcast from the Flight app.
 * Flight emits: new CustomEvent('landing-success', { detail: { targetId, targetName } })
 */
export function useLandingHandoff(): LandingEvent | null {
  const [landing, setLanding] = useState<LandingEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ targetId: string; targetName?: string }>;
      const detail = custom.detail || { targetId: 'unknown' };
      setLanding({ targetId: detail.targetId, targetName: detail.targetName, at: Date.now() });
    };
    window.addEventListener('landing-success', handler as EventListener);
    return () => window.removeEventListener('landing-success', handler as EventListener);
  }, []);

  return landing;
}
