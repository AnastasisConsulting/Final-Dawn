/**
 * World Generation Service
 * Frontend service for triggering AI world generation
 */

export interface Destination {
    galaxy: string;
    system: string;
    object: string;
    civ: number;
    city: number;
    region: number;
    name: string;
    address: string;
}

export interface WorldGenerationResult {
    success: boolean;
    generated?: {
        cityMapPath: string;
        lorebookPath: string;
        questsPath: string;
        npcCount: number;
        waypointCount: number;
        lorebookEntries: number;
        quests: number;
    };
    error?: string;
    message?: string;
}

const ORCHESTRATOR_URL = 'http://localhost:3003';

/**
 * Generate world content for a new location
 */
export async function generateWorldContent(destination: Destination): Promise<WorldGenerationResult> {
    try {
        console.log('[World Gen] Requesting generation for:', destination.name, destination.address);

        const response = await fetch(`${ORCHESTRATOR_URL}/api/landing/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ destination }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'World generation failed');
        }

        const result = await response.json();
        console.log('[World Gen] Generation complete:', result.generated);

        return result;
    } catch (error: any) {
        console.error('[World Gen] Failed:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Check if a location has already been generated
 */
export async function checkLocationStatus(address: string): Promise<{ generated: boolean }> {
    try {
        const response = await fetch(`${ORCHESTRATOR_URL}/api/landing/status/${address}`);

        if (!response.ok) {
            throw new Error('Status check failed');
        }

        const result = await response.json();
        return { generated: result.generated || false };
    } catch (error: any) {
        console.error('[World Gen] Status check failed:', error);
        return { generated: false };
    }
}
