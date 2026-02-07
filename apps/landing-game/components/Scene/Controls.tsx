// flight-one/components/Controls.tsx

import { useEffect, useRef } from 'react';

export const FLIGHT_CANVAS_ID = 'flight-one-canvas';

export interface FlightInput {
  move: { x: number; y: number; z: number }; // x: strafe, y: vertical, z: forward/back
  mouse: { x: number; y: number };           // Raw delta accumulation
  steering: { pitch: number; yaw: number; roll: number }; // Normalized -1 to 1
  active: boolean;
  firePrimary: boolean;
  fireSecondary: boolean;
  boost: boolean;
  mediumSpeed: boolean;
  flightAssist: boolean;
  barrelRoll: number; // -1 Left, 1 Right, 0 None
  verticalFlip: boolean;
  dropChaff: boolean;
}

export const useFlightControls = () => {
  const input = useRef<FlightInput>({
    move: { x: 0, y: 0, z: 0 },
    mouse: { x: 0, y: 0 },
    steering: { pitch: 0, yaw: 0, roll: 0 },
    active: false,
    firePrimary: false,
    fireSecondary: false,
    boost: false,
    mediumSpeed: false,
    flightAssist: true,
    barrelRoll: 0,
    verticalFlip: false,
    dropChaff: false
  });

  // Sensitivity and damping constants for college-level flight physics
  const SENSITIVITY = 0.002;
  const STEERING_CLAMP = 1.0;

  useEffect(() => {
    const keys = new Set<string>();
    let rafId: number;

    const updateMoveVector = () => {
      input.current.move.x = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
      input.current.move.y = (keys.has('KeyR') ? 1 : 0) - (keys.has('KeyC') ? 1 : 0);
      input.current.move.z = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
      
      input.current.boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
      input.current.barrelRoll = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0);
      
      // Map steering roll to Q/E as well if not doing a dedicated maneuver
      input.current.steering.roll = input.current.barrelRoll;

      input.current.verticalFlip = keys.has('KeyF') || keys.has('Space');
      input.current.dropChaff = keys.has('KeyX');
    };

    // Frame-based processing to handle mouse steering decay or integration
    const updateSteering = () => {
      if (input.current.active) {
        // Transform mouse deltas into pitch and yaw
        // Pitch is typically inverted in flight sims: Mouse Up (negative Y) = Pitch Up
        input.current.steering.pitch = Math.max(-STEERING_CLAMP, Math.min(STEERING_CLAMP, input.current.mouse.y * SENSITIVITY));
        input.current.steering.yaw = Math.max(-STEERING_CLAMP, Math.min(STEERING_CLAMP, input.current.mouse.x * SENSITIVITY));

        // If Flight Assist is ON, you might want to auto-center these values 
        // when the mouse stops moving. For now, we assume direct rate control.
      }
      rafId = requestAnimationFrame(updateSteering);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === 'KeyZ') input.current.flightAssist = !input.current.flightAssist;
      updateMoveVector();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      updateMoveVector();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        // Accumulate deltas
        input.current.mouse.x += e.movementX;
        input.current.mouse.y += e.movementY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!document.pointerLockElement) {
        const disablePointerLock = document.body?.dataset?.pointerLockDisabled === 'true';
        if (!disablePointerLock) {
          requestPointerLock();
        }
      } else {
        if (e.button === 0) input.current.firePrimary = true;
        if (e.button === 2) input.current.fireSecondary = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) input.current.firePrimary = false;
      if (e.button === 2) input.current.fireSecondary = false;
    };

    const handlePointerLockChange = () => {
      const isLocked = !!document.pointerLockElement;
      input.current.active = isLocked;
      if (!isLocked) {
        input.current.mouse = { x: 0, y: 0 };
        input.current.steering = { pitch: 0, yaw: 0, roll: 0 };
        input.current.firePrimary = false;
        input.current.fireSecondary = false;
      }
    };

    const handleContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    rafId = requestAnimationFrame(updateSteering);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return input;
};

const getTargetCanvas = () =>
  (document.getElementById(FLIGHT_CANVAS_ID) as HTMLCanvasElement | null) ??
  (document.querySelector('canvas') as HTMLCanvasElement | null);

export const requestPointerLock = () => {
  const canvas = getTargetCanvas();
  canvas?.requestPointerLock();
};
