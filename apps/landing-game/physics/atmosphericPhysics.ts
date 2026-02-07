/**
 * Atmospheric Physics Engine
 * Handles 5-phase atmospheric entry simulation
 */

export enum AtmosphericPhase {
    LOW_ORBIT = 'LOW_ORBIT',           // 100km+ - Space physics, minimal drag
    ENTRY_INTERFACE = 'ENTRY_INTERFACE', // 80-100km - Heat buildup starts
    VIOLENT_ENTRY = 'VIOLENT_ENTRY',     // 30-80km - Maximum heat, turbulence, weather
    ATMOSPHERE = 'ATMOSPHERE',           // 10-30km - Navigate to city
    APPROACH = 'APPROACH',               // 0-10km - City visible, find landing pad
}

export interface AtmosphericState {
    phase: AtmosphericPhase;
    altitude: number;           // meters
    speed: number;              // m/s
    heat: number;               // 0-100
    turbulence: number;         // 0-1
    atmosphericDensity: number; // 0-1
    windForce: { x: number; y: number; z: number };
    visibility: number;         // 0-1 (fog/clouds)
}

export class AtmosphericPhysics {
    private state: AtmosphericState;

    // Physics constants
    private readonly GRAVITY = 9.81; // m/s²
    private readonly BASE_DRAG_COEFFICIENT = 0.47;
    private readonly HEAT_CAPACITY = 50; // How quickly heat builds
    private readonly COOLING_RATE = 30; // How quickly heat dissipates

    constructor(initialAltitude: number = 100000) {
        this.state = {
            phase: AtmosphericPhase.LOW_ORBIT,
            altitude: initialAltitude,
            speed: 0,
            heat: 0,
            turbulence: 0,
            atmosphericDensity: 0,
            windForce: { x: 0, y: 0, z: 0 },
            visibility: 1,
        };
    }

    /**
     * Update physics simulation
     */
    update(deltaTime: number, velocity: { x: number; y: number; z: number }): AtmosphericState {
        // Calculate current speed
        this.state.speed = Math.sqrt(
            velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
        );

        // Update phase based on altitude
        this.updatePhase();

        // Calculate atmospheric density (exponential model)
        this.state.atmosphericDensity = this.calculateAtmosphericDensity();

        // Calculate drag
        const drag = this.calculateDrag();

        // Calculate heat buildup
        this.updateHeat(deltaTime);

        // Calculate turbulence
        this.updateTurbulence();

        // Calculate wind forces
        this.updateWind();

        // Calculate visibility
        this.updateVisibility();

        return this.state;
    }

    private updatePhase(): void {
        const alt = this.state.altitude;

        if (alt > 100000) {
            this.state.phase = AtmosphericPhase.LOW_ORBIT;
        } else if (alt > 80000) {
            this.state.phase = AtmosphericPhase.ENTRY_INTERFACE;
        } else if (alt > 30000) {
            this.state.phase = AtmosphericPhase.VIOLENT_ENTRY;
        } else if (alt > 10000) {
            this.state.phase = AtmosphericPhase.ATMOSPHERE;
        } else {
            this.state.phase = AtmosphericPhase.APPROACH;
        }
    }

    /**
     * Atmospheric density using exponential model
     * ρ = ρ₀ * e^(-h/H)
     * where ρ₀ = 1.225 kg/m³ at sea level, H = 8500m (scale height)
     */
    private calculateAtmosphericDensity(): number {
        const seaLevelDensity = 1.225;
        const scaleHeight = 8500;
        const density = seaLevelDensity * Math.exp(-this.state.altitude / scaleHeight);
        return Math.min(1, density / seaLevelDensity); // Normalized 0-1
    }

    /**
     * Drag force calculation
     * F_drag = 0.5 * ρ * v² * C_d * A
     */
    private calculateDrag(): number {
        const area = 20; // m² - ship cross-sectional area
        const dragForce =
            0.5 *
            this.state.atmosphericDensity *
            this.state.speed ** 2 *
            this.BASE_DRAG_COEFFICIENT *
            area;

        return dragForce;
    }

    /**
     * Heat buildup from atmospheric friction
     */
    private updateHeat(deltaTime: number): void {
        const { speed, atmosphericDensity, phase } = this.state;

        // Heat generation increases with speed and atmospheric density
        const heatGeneration =
            (speed / 100) * atmosphericDensity * this.HEAT_CAPACITY * deltaTime;

        // Violent entry has maximum heat
        const phaseMultiplier = phase === AtmosphericPhase.VIOLENT_ENTRY ? 2.0 : 1.0;

        // Cooling happens when in safe zones or slow speed
        const isCooling = speed < 50 || atmosphericDensity < 0.1;
        const cooling = isCooling ? this.COOLING_RATE * deltaTime : 0;

        this.state.heat = Math.max(
            0,
            Math.min(100, this.state.heat + heatGeneration * phaseMultiplier - cooling)
        );
    }

    /**
     * Turbulence based on phase and atmospheric conditions
     */
    private updateTurbulence(): void {
        const { phase, speed, atmosphericDensity } = this.state;

        let turbulence = 0;

        switch (phase) {
            case AtmosphericPhase.LOW_ORBIT:
                turbulence = 0;
                break;
            case AtmosphericPhase.ENTRY_INTERFACE:
                turbulence = 0.2 + speed / 500;
                break;
            case AtmosphericPhase.VIOLENT_ENTRY:
                turbulence = 0.6 + (speed / 300) * atmosphericDensity;
                break;
            case AtmosphericPhase.ATMOSPHERE:
                turbulence = 0.3 * atmosphericDensity;
                break;
            case AtmosphericPhase.APPROACH:
                turbulence = 0.1;
                break;
        }

        this.state.turbulence = Math.min(1, turbulence);
    }

    /**
     * Wind forces (for lateral movement during descent)
     */
    private updateWind(): void {
        const { phase, atmosphericDensity } = this.state;

        // Wind varies by phase
        let windStrength = 0;
        switch (phase) {
            case AtmosphericPhase.VIOLENT_ENTRY:
                windStrength = 50 + Math.random() * 50; // 50-100 m/s
                break;
            case AtmosphericPhase.ATMOSPHERE:
                windStrength = 20 + Math.random() * 30; // 20-50 m/s
                break;
            case AtmosphericPhase.APPROACH:
                windStrength = 5 + Math.random() * 10; // 5-15 m/s
                break;
        }

        // Random wind direction with atmospheric density influence
        const angle = Math.random() * Math.PI * 2;
        this.state.windForce = {
            x: Math.cos(angle) * windStrength * atmosphericDensity,
            y: 0,
            z: Math.sin(angle) * windStrength * atmosphericDensity,
        };
    }

    /**
     * Visibility (fog/clouds during entry)
     */
    private updateVisibility(): void {
        const { phase, heat } = this.state;

        let visibility = 1;

        switch (phase) {
            case AtmosphericPhase.ENTRY_INTERFACE:
                visibility = 0.7 - heat / 200; // Plasma begins to obscure
                break;
            case AtmosphericPhase.VIOLENT_ENTRY:
                visibility = 0.3 - heat / 300; // Heavy plasma, clouds
                break;
            case AtmosphericPhase.ATMOSPHERE:
                visibility = 0.6 + Math.random() * 0.2; // Clouds
                break;
            case AtmosphericPhase.APPROACH:
                visibility = 0.8 + Math.random() * 0.2; // Clear
                break;
        }

        this.state.visibility = Math.max(0.1, Math.min(1, visibility));
    }

    /**
     * Get turbulence shake vector for camera
     */
    getTurbulenceShake(): { x: number; y: number; z: number } {
        const intensity = this.state.turbulence;
        return {
            x: (Math.random() - 0.5) * intensity * 2,
            y: (Math.random() - 0.5) * intensity * 2,
            z: (Math.random() - 0.5) * intensity * 0.5,
        };
    }

    /**
     * Check if ship is taking heat damage
     */
    isOverheating(): boolean {
        return this.state.heat > 85;
    }

    /**
     * Get heat damage per second
     */
    getHeatDamage(): number {
        if (this.state.heat < 85) return 0;
        return (this.state.heat - 85) * 2; // 0-30 damage/sec
    }

    /**
     * Get phase description for HUD
     */
    getPhaseDescription(): string {
        switch (this.state.phase) {
            case AtmosphericPhase.LOW_ORBIT:
                return 'LOW ORBIT - PREPARE FOR ENTRY';
            case AtmosphericPhase.ENTRY_INTERFACE:
                return 'ENTRY INTERFACE - HEAT RISING';
            case AtmosphericPhase.VIOLENT_ENTRY:
                return 'VIOLENT ENTRY - MAXIMUM STRESS';
            case AtmosphericPhase.ATMOSPHERE:
                return 'ATMOSPHERIC FLIGHT - NAVIGATE TO TARGET';
            case AtmosphericPhase.APPROACH:
                return 'FINAL APPROACH - LOCATE LANDING PAD';
            default:
                return '';
        }
    }

    getState(): AtmosphericState {
        return { ...this.state };
    }

    setAltitude(altitude: number): void {
        this.state.altitude = altitude;
    }
}
