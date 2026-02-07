/**
 * Auto-Landing System
 * Handles autopilot takeover and smooth landing sequence
 */

import * as THREE from 'three';

export interface AutoLandingState {
    active: boolean;
    phase: 'approach' | 'descent' | 'flare' | 'touchdown' | 'complete';
    progress: number; // 0-1
    gearDeployed: boolean;
}

export class AutoLandingController {
    private state: AutoLandingState = {
        active: false,
        phase: 'approach',
        progress: 0,
        gearDeployed: false,
    };

    private targetPosition: THREE.Vector3;
    private startPosition: THREE.Vector3;
    private startTime: number = 0;

    constructor(targetPosition: THREE.Vector3) {
        this.targetPosition = targetPosition.clone();
        this.startPosition = new THREE.Vector3();
    }

    /**
     * Activate auto-landing sequence
     */
    activate(currentPosition: THREE.Vector3): void {
        this.state.active = true;
        this.state.phase = 'approach';
        this.state.progress = 0;
        this.startPosition.copy(currentPosition);
        this.startTime = Date.now();

        console.log('[Auto-Landing] Sequence activated');
    }

    /**
     * Update auto-landing sequence
     * Returns target position and velocity for autopilot
     */
    update(
        deltaTime: number,
        currentPosition: THREE.Vector3,
        currentVelocity: THREE.Vector3
    ): {
        position: THREE.Vector3;
        velocity: THREE.Vector3;
        state: AutoLandingState;
    } {
        if (!this.state.active) {
            return {
                position: currentPosition,
                velocity: currentVelocity,
                state: this.state,
            };
        }

        const elapsed = (Date.now() - this.startTime) / 1000; // seconds

        // Phase progression
        if (this.state.phase === 'approach' && elapsed > 2) {
            this.state.phase = 'descent';
            this.state.gearDeployed = true;
            console.log('[Auto-Landing] Landing gear deployed');
        } else if (this.state.phase === 'descent' && elapsed > 6) {
            this.state.phase = 'flare';
        } else if (this.state.phase === 'flare' && elapsed > 8) {
            this.state.phase = 'touchdown';
        } else if (this.state.phase === 'touchdown' && elapsed > 9) {
            this.state.phase = 'complete';
            this.state.active = false;
            console.log('[Auto-Landing] Landing complete');
        }

        // Calculate smooth trajectory
        const totalDuration = 9; // seconds
        this.state.progress = Math.min(1, elapsed / totalDuration);

        // Smooth interpolation with easing
        const t = this.easeInOutCubic(this.state.progress);

        const targetPos = new THREE.Vector3().lerpVectors(
            this.startPosition,
            this.targetPosition,
            t
        );

        // Calculate velocity for smooth approach
        const desiredVelocity = new THREE.Vector3()
            .subVectors(targetPos, currentPosition)
            .divideScalar(deltaTime);

        // Limit velocity based on phase
        let maxSpeed = 5; // m/s
        if (this.state.phase === 'flare') maxSpeed = 2;
        if (this.state.phase === 'touchdown') maxSpeed = 0.5;

        if (desiredVelocity.length() > maxSpeed) {
            desiredVelocity.normalize().multiplyScalar(maxSpeed);
        }

        return {
            position: targetPos,
            velocity: desiredVelocity,
            state: { ...this.state },
        };
    }

    /**
     * Easing function for smooth landing
     */
    private easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    getState(): AutoLandingState {
        return { ...this.state };
    }

    isActive(): boolean {
        return this.state.active;
    }

    isComplete(): boolean {
        return this.state.phase === 'complete';
    }
}
