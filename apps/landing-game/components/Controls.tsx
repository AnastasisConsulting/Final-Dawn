import { useEffect, useRef } from 'react';

export interface FlightInput {
  move: { x: number; y: number; z: number }; // x: strafe, y: vertical, z: forward/back
  mouse: { x: number; y: number };
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
    active: false,
    firePrimary: false,
    fireSecondary: false,
    boost: false,
    mediumSpeed: false,
    flightAssist: true, // Default ON
    barrelRoll: 0,
    verticalFlip: false,
    dropChaff: false
  });

  useEffect(() => {
    const keys = new Set<string>();

    const updateMoveVector = () => {
      input.current.move.x = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
      input.current.move.y = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0);
      input.current.move.z = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
      input.current.boost = keys.has('ShiftLeft') || keys.has('ShiftRight');
      
      // Maneuvers
      input.current.barrelRoll = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
      input.current.verticalFlip = keys.has('ArrowUp');
      input.current.dropChaff = keys.has('ArrowDown');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.code);
      if (e.code === 'KeyZ') {
          input.current.flightAssist = !input.current.flightAssist;
      }
      updateMoveVector();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
      updateMoveVector();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        input.current.mouse.x += e.movementX;
        input.current.mouse.y += e.movementY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        if (e.button === 0) input.current.firePrimary = true;
        if (e.button === 2) input.current.fireSecondary = true;
        if (e.button === 1) { // Middle Mouse
            e.preventDefault();
            input.current.mediumSpeed = true;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) input.current.firePrimary = false;
      if (e.button === 2) input.current.fireSecondary = false;
      if (e.button === 1) {
          e.preventDefault();
          input.current.mediumSpeed = false;
      }
    };

    const handlePointerLockChange = () => {
      input.current.active = !!document.pointerLockElement;
      if (!input.current.active) {
          input.current.mouse = { x: 0, y: 0 }; 
          input.current.firePrimary = false;
          input.current.fireSecondary = false;
          input.current.mediumSpeed = false;
          keys.clear(); // Clear keys on unlock to prevent stuck movement
          updateMoveVector();
      }
    };

    const handlePointerLockError = (e: Event) => {
        console.warn("Pointer lock error:", e);
    };

    // Prevent context menu for right click
    const handleContextMenu = (e: Event) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, []);

  return input;
};

export const requestPointerLock = async () => {
  const canvas = document.querySelector('canvas');
  if (canvas && !document.pointerLockElement) {
    try {
        // @ts-ignore
        await canvas.requestPointerLock({
            unadjustedMovement: true // Better for FPS if supported
        });
    } catch (e) {
        console.debug("Pointer lock failed (likely cancelled by user):", e);
    }
  }
};