
// Stubbed Affinity System
// This file replaces the removed @eideus/affinity-system package
// It allows the UI to continue functioning without errors while disabling the backend simulation.

export interface AffinityVector {
    G: number;
    E: number;
    S: number;
}

export interface AffinityEntityRef {
    id: string;
    kind: string;
    scale: string;
    parentId?: string;
}

export type AffinitySeed = { id: string; vector: AffinityVector };

export interface AffinitySnapshot {
    tick: number;
    vectors: Record<string, AffinityVector>;
}

class MockAffinityRuntime {
    private tick = 0;

    async init(entities: any[], seeds: any[]) {
        console.log('[AffinityStub] Initialized with', entities.length, 'entities');
        return Promise.resolve();
    }

    start() {
        console.log('[AffinityStub] Started (No-op)');
    }

    stop() {
        console.log('[AffinityStub] Stopped (No-op)');
    }

    subscribe(cb: () => void) {
        return () => { };
    }

    getSnapshot(): AffinitySnapshot {
        return {
            tick: this.tick,
            vectors: {
                'Proxima Centauri': { G: 0.5, E: 0.5, S: 0.5 } // Static test value
            }
        };
    }

    async bumpEntity(id: string, delta: Partial<AffinityVector>) {
        console.log('[AffinityStub] Bumping entity', id, delta);
        return Promise.resolve();
    }
}

export const affinityRuntime = new MockAffinityRuntime();

export const useAffinitySnapshot = () => {
    return affinityRuntime.getSnapshot();
};
