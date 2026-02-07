/**
 * Landing Context Types
 * Defines the ship state and destination data passed from flight-one to landing-game
 */

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface ShipState {
    model: string;           // Ship type from flight-one (e.g., "fighter", "hauler")
    position: Vector3;       // Low orbit position
    velocity: Vector3;       // Entry velocity
    heading: number;         // Heading in degrees
    health: number;          // Current hull integrity
    shieldLevel: number;     // Shield percentage
}

export interface Destination {
    galaxy: string;          // G1, G2, etc.
    system: string;          // S1, S2, etc.
    object: string;          // O1, O2, etc. (planet)
    civ: number;             // Civilization index (1-3)
    city: number;            // City index (1-3)
    region: number;          // Region index (1-7)
    address?: string;        // Full address string (e.g., "G1-S1-O1")
    name?: string;           // Location name (e.g., "Neocortex Prime")
}

export interface LandingContext {
    id: string;              // Unique landing ID
    ship: ShipState;
    destination: Destination;
    firstVisit: boolean;     // Triggers AI generation
    timestamp: number;       // When landing was initiated
}

export interface LandingResult {
    success: boolean;
    skipped?: boolean;
    generatedData?: {
        mapFile?: string;
        lorebookFile?: string;
        questsFile?: string;
    };
}
