// PATH: dawn-ui/services/banterService.ts

export const NAVBOT_QUIPS = [
    "I hope you packed your radiation suit. Or a swimsuit. I can't tell the difference anymore.",
    "Docking clamps engaged. There is a 12% chance I crushed the fuel line. Oops.",
    "Atmosphere detected: Breathing is optional but recommended.",
    "Parking sensors offline. I'm just going to eyeball it. *Crunch.*"
];

export const VIZZY_FALLBACK_QUIPS = [
    "`RENDERING... ARTIFACTING...` \n\n**GPU TEMP CRITICAL**",
    "I can't see that. My lens is cracked. Or is it reality that is cracked?",
    "Processing visual query... Result: It looks like despair.",
    "`BUFFER_OVERFLOW` \n\nToo much ugliness in this sector."
];

/**
 * Logic for character banter based on affinity.
 * Can be triggered at the end of runTurn() in orchestrator.ts.
 */
export function generateBanter(affinityScore: number): string {
    // Legacy logic: random selection. 
    // Modern logic: inject into LLM prompt as "recent banter history" 
    // to let the characters respond to each other.
    return ""; 
}