// packages/eideus-ollama-orchestrator/src/landmark/LandmarkGenerator.ts
// Procedural landmark scaffolding - generates location/object cards from narrative context

import type { OllamaClient } from "../ollama/client.js";
import type { SpatialKey } from "eideus-memory-lattice-api";
import {
    LandmarkProfile,
    LandmarkType,
    LandmarkGenerationTemplate,
    GeneratedLandmark,
    LandmarkRef,
} from "./landmark.types.js";

/**
 * Generates a unique landmark ID based on spatial coordinates.
 * Format: G1-S1-O7-C2-CT2-R4-LOC or G1-S1-O7-C2-CT2-R4-OBJ
 */
const landmarkCounters = new Map<string, number>();

function generateLandmarkId(spatial: SpatialKey, type: LandmarkType): string {
    const base = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c + 1}-CT${spatial.ct + 1}-R${spatial.r + 1}`;
    const suffix = type === "OBJECT" ? "OBJ" : type === "VEHICLE" ? "VEH" : "LOC";

    const key = `${base}-${suffix}`;
    const count = (landmarkCounters.get(key) || 0) + 1;
    landmarkCounters.set(key, count);

    return count === 1 ? key : `${key}${count}`;
}

/**
 * Detects potential landmark/location mentions from narration text.
 */
export function detectLandmarks(narration: string): Array<{
    name: string;
    type: LandmarkType;
    description: string;
}> {
    const landmarks: Array<{ name: string; type: LandmarkType; description: string }> = [];

    // Patterns for different landmark types
    const patterns: Array<{ regex: RegExp; type: LandmarkType }> = [
        // Structures: "the ancient temple", "a crumbling factory"
        { regex: /(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(temple|factory|tower|station|facility|complex|warehouse|bunker|fortress|citadel|spire|dome)/gi, type: "STRUCTURE" },

        // Locations: "enter the Dark Bazaar", "reaches the Neon District"
        { regex: /(?:enter|reach|approach|arrive at|discover|find)\s+(?:the|a|an)?\s*["']?([A-Z][a-zA-Z\s'-]+?)["']?(?:\s*[,.]|\s+and|\s+where)/gi, type: "LOCATION" },

        // POIs: "notice the flickering terminal", "spot the rusted console"
        { regex: /(?:notice|spot|see|observe|find)\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(terminal|console|panel|generator|reactor|beacon|monument|statue|altar|shrine)/gi, type: "POI" },

        // Objects: "pick up the data chip", "examine the ancient artifact"
        { regex: /(?:pick up|examine|inspect|grab|take|collect)\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?(?:\s+\w+)?)/gi, type: "OBJECT" },

        // Vehicles: "board the shuttle", "the abandoned freighter"
        { regex: /(?:board|enter|find|spot)\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s*(shuttle|ship|freighter|cruiser|transport|pod|mech|walker|tank)/gi, type: "VEHICLE" },

        // Quoted named locations: "The Corroded Terminal"
        { regex: /["']([A-Z][a-zA-Z\s'-]+?)["']/g, type: "POI" },
    ];

    for (const { regex, type } of patterns) {
        let match;
        while ((match = regex.exec(narration)) !== null) {
            const fullMatch = match[0];
            // Try to extract the name from capture groups
            let name = match[2] ? `${match[1]} ${match[2]}`.trim() : match[1]?.trim();

            // Clean up the name
            if (name && name.length > 2 && name.length < 50) {
                // Capitalize properly
                name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

                // Avoid duplicates
                if (!landmarks.some(l => l.name.toLowerCase() === name.toLowerCase())) {
                    landmarks.push({
                        name,
                        type,
                        description: fullMatch.trim(),
                    });
                }
            }
        }
    }

    return landmarks;
}

/**
 * Uses LLM to generate a full landmark profile from a detected mention.
 */
async function generateLandmarkCard(
    ollama: OllamaClient,
    template: LandmarkGenerationTemplate,
    landmarkHint: { name: string; type: LandmarkType; description: string },
    model: string = "llama3"
): Promise<LandmarkProfile> {
    const { locationContext, loreKey, narrativeContext } = template;

    const prompt = `You are a game master generating a location/object card for a cyberpunk sci-fi RPG.

CONTEXT:
- Parent Location: ${locationContext.locationName} (${locationContext.locationType})
- Lore Key: ${loreKey}
- Narrative Context: "${narrativeContext || landmarkHint.description}"

DETECTED LANDMARK:
- Name: ${landmarkHint.name}
- Type: ${landmarkHint.type}

Generate a landmark card with the following JSON format (respond ONLY with valid JSON):
{
  "name": "Full Proper Name",
  "type": "${landmarkHint.type}",
  "description": "2-3 sentence atmospheric description",
  "shortDescription": "One sentence summary",
  "interactionHints": ["What players can do here", "Another interaction option"],
  "tags": ["searchable", "keyword", "tags"],
  "secrets": ["Hidden information players might discover"]
}`;

    try {
        const res = await ollama.generate({
            model,
            prompt,
            options: { temperature: 0.7 },
        });

        // Extract JSON from response
        const jsonMatch = res.response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in LLM response");
        }

        const generated = JSON.parse(jsonMatch[0]);
        const landmarkId = generateLandmarkId(locationContext.spatial, landmarkHint.type);
        const now = new Date().toISOString();

        const profile: LandmarkProfile = {
            id: landmarkId,
            name: generated.name || landmarkHint.name,
            type: generated.type || landmarkHint.type,
            description: generated.description || landmarkHint.description,
            shortDescription: generated.shortDescription,
            spatial: locationContext.spatial,
            parentLoreKey: loreKey,
            interactionHints: generated.interactionHints || [],
            connectedLandmarks: [],
            secrets: generated.secrets || [],
            tags: generated.tags || [],
            isProcedural: true,
            createdAt: now,
        };

        return profile;
    } catch (err) {
        // Fallback: create a minimal profile from the hint
        console.warn("[LandmarkGenerator] LLM generation failed, using fallback:", err);
        const landmarkId = generateLandmarkId(locationContext.spatial, landmarkHint.type);
        const now = new Date().toISOString();

        return {
            id: landmarkId,
            name: landmarkHint.name,
            type: landmarkHint.type,
            description: landmarkHint.description,
            spatial: locationContext.spatial,
            parentLoreKey: loreKey,
            interactionHints: [],
            connectedLandmarks: [],
            secrets: [],
            tags: [landmarkHint.type.toLowerCase(), "procedural"],
            isProcedural: true,
            createdAt: now,
        };
    }
}

/**
 * Converts a LandmarkProfile to a LandmarkRef for memory voxel z- face.
 */
function profileToLandmarkRef(profile: LandmarkProfile): LandmarkRef {
    return {
        id: profile.id,
        name: profile.name,
        type: profile.type,
        description: profile.shortDescription || profile.description,
        tags: profile.tags,
        isProcedural: profile.isProcedural,
        parentLoreKey: profile.parentLoreKey,
    };
}

/**
 * Main landmark generation function.
 * Detects landmarks in narration and generates full profiles.
 */
export async function generateLandmarksFromNarration(
    ollama: OllamaClient,
    narration: string,
    template: Omit<LandmarkGenerationTemplate, "narrativeContext">,
    existingLandmarkIds: Set<string>,
    model: string = "llama3"
): Promise<GeneratedLandmark[]> {
    const detected = detectLandmarks(narration);
    const results: GeneratedLandmark[] = [];

    for (const landmarkHint of detected) {
        // Skip if already known
        const nameKey = landmarkHint.name.toLowerCase().replace(/\s+/g, "_");
        if (existingLandmarkIds.has(nameKey)) {
            continue;
        }

        const fullTemplate: LandmarkGenerationTemplate = {
            ...template,
            narrativeContext: narration,
        };

        const profile = await generateLandmarkCard(ollama, fullTemplate, landmarkHint, model);
        const landmarkRef = profileToLandmarkRef(profile);

        results.push({ profile, landmarkRef });
        existingLandmarkIds.add(nameKey);
    }

    return results;
}

/**
 * Creates the Landmark Generator service.
 */
export function createLandmarkGenerator(ollama: OllamaClient) {
    const knownLandmarks = new Set<string>();

    return {
        /**
         * Process narration and generate landmarks for any new locations/objects detected.
         */
        async processNarration(
            narration: string,
            locationContext: LandmarkGenerationTemplate["locationContext"],
            loreKey: string,
            options?: {
                model?: string;
            }
        ): Promise<GeneratedLandmark[]> {
            return generateLandmarksFromNarration(
                ollama,
                narration,
                { locationContext, loreKey },
                knownLandmarks,
                options?.model
            );
        },

        /**
         * Register an existing landmark so it won't be re-generated.
         */
        registerKnownLandmark(name: string): void {
            knownLandmarks.add(name.toLowerCase().replace(/\s+/g, "_"));
        },

        /**
         * Register multiple existing landmarks.
         */
        registerKnownLandmarks(names: string[]): void {
            for (const name of names) {
                this.registerKnownLandmark(name);
            }
        },

        /**
         * Clear known landmarks (for testing or session reset).
         */
        clearKnownLandmarks(): void {
            knownLandmarks.clear();
        },
    };
}
