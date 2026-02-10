import { Scale } from "./scaleTypes";

export const scaleSpeedModifier: Record<Scale, number> = {
    intergalactic: -3,
    interstellar: -2,
    interplanetary: -1,
    planetary: 0,
    civilizational: 1,
    city: 2,
    region: 3,
    inhabitant: 4
};

// converts modifier → tick multiplier
export function tickMultiplier(scale: Scale): number {
    return Math.pow(2, scaleSpeedModifier[scale]);
}
