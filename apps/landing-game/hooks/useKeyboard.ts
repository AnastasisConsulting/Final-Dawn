import { useEffect, useRef } from 'react';
import { ShipControls } from '../types';

export const useKeyboard = (): ShipControls => {
  // We use a ref for state to avoid re-renders on every mouse move
  const controls = useRef<ShipControls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    rollLeft: false,
    rollRight: false,
    boost: false,
    brake: false,
    mouse: { x: 0, y: 0 }
  });

  // State-based return for React reactivity where needed? 
  // Actually, standard pattern in R3F flight sims is checking refs in useFrame.
  // But the existing `Spaceship.tsx` expects a reactive object or a ref?
  // `useKeyboard` currently returns `controls` state. `Spaceship.tsx` calls `const controls = useKeyboard();`.
  // If we return a REF, `Spaceship.tsx` logic needs to change to read `controls.current`.
  // Let's stick to the `flight-one` pattern where it returns the ref, 
  // BUT `landing-game`'s `Spaceship.tsx` expects values.
  // I will have to update `Spaceship.tsx` to usage `controls.current` essentially.
  // For this step, I'll return the ref object itself (typed as ShipControls, but actually a MutableRefObject if I change the signature).
  // Wait, `flight-one` returns `input` which is `MutableRefObject<FlightInput>`.
  // `landing-game` types `ShipControls` as a plain object.
  // I should change the hook to return a ref, and update the consumer.

  // Actually, to minimize friction, I'll keep the return type as the *current state value* mechanism 
  // OR verify how `Spaceship.tsx` generates the frame loop.
  // `Spaceship.tsx`: `const controls = useKeyboard();` then `if (controls.forward) ...` in `useFrame`.
  // If `useKeyboard` returns state, `useFrame` sees stale closure unless `controls` updates.
  // If `useKeyboard` returns a ref, `useFrame` acts on latest.
  // `flight-one` does: `const controlsRef = useFlightControls();` then `const input = controlsRef.current;` inside `useFrame`.
  // So I WILL change this hook to return a CONSTANT REF, and patch `Spaceship.tsx` to read it.

  // Implementation of useFlightControls logic:

  useEffect(() => {
    const keys = new Set<string>();

    const update = () => {
      const c = controls.current;
      c.forward = keys.has('KeyW');
      c.backward = keys.has('KeyS');
      c.left = keys.has('KeyA');
      c.right = keys.has('KeyD');
      c.rollLeft = keys.has('KeyQ');
      c.rollRight = keys.has('KeyE');
      c.boost = keys.has('ShiftLeft');
      c.brake = keys.has('Space');
    };

    const onKeyDown = (e: KeyboardEvent) => { keys.add(e.code); update(); };
    const onKeyUp = (e: KeyboardEvent) => { keys.delete(e.code); update(); };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        controls.current.mouse.x += e.movementX;
        controls.current.mouse.y += e.movementY;
      }
    };

    const startLock = () => {
      const canvas = document.querySelector('canvas');
      canvas?.requestPointerLock();
    };

    const onMouseDown = () => startLock();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  // Return the raw object so we don't break TS immediately, 
  // but really we want to return the Ref.
  // I will CAST it to any to satisfy the immediate file but `Spaceship.tsx` needs update.
  return controls.current;
};