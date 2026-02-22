import { useState, useRef, useEffect } from 'react';

export type FlightState = 'idle' | 'retracting' | 'warping' | 'flying';

export function useWarpSequence(isWarping: boolean, onWarpComplete?: () => void) {
    const [flightState, setFlightState] = useState<FlightState>('idle');
    const [showFlight, setShowFlight] = useState(false);
    const [handoffToken, setHandoffToken] = useState<string | number | null>(null);
    const timersRef = useRef<number[]>([]);

    const clearTimers = () => {
        timersRef.current.forEach(t => window.clearTimeout(t));
        timersRef.current = [];
    };

    const initiateWarp = () => {
        const token = Date.now();
        clearTimers();
        setFlightState('warping');

        const t1 = window.setTimeout(() => {
            setHandoffToken(token);
            setShowFlight(true);
        }, 1500);

        const t2 = window.setTimeout(() => {
            setFlightState('flying');
            onWarpComplete?.();
        }, 4000);

        timersRef.current.push(t1, t2);
    };

    const abortWarp = () => {
        clearTimers();
        setFlightState('idle');
        setShowFlight(false);
        setHandoffToken(null);
    };

    useEffect(() => {
        if (isWarping && flightState === 'idle') {
            initiateWarp();
        }
    }, [isWarping]);

    useEffect(() => {
        return () => clearTimers();
    }, []);

    return {
        flightState,
        showFlight,
        handoffToken,
        initiateWarp,
        abortWarp,
        setFlightState,
        setShowFlight,
        setHandoffToken
    };
}
