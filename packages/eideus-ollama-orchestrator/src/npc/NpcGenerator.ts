// packages/eideus-ollama-orchestrator/src/npc/NpcGenerator.ts
// Procedural NPC scaffolding - generates character cards from narrative context

import type { OllamaClient } from "../ollama/client.js";
import type { SpatialKey } from "eideus-memory-lattice-api";
import {
    NpcProfile,
    NpcChatState,
    NpcGenerationTemplate,
    GeneratedNpc,
    EntityRef,
    LorebookInhabitant,
} from "./npc.types.js";

/**
 * Generates a unique NPC ID based on spatial coordinates.
 * Format: G1-S1-O7-C2-CT2-R4-NPC (matches lorebook convention)
 * For procedural NPCs at the same location, appends a counter.
 */
const npcCounters = new Map<string, number>();

function generateNpcId(spatial: SpatialKey): string {
    // Full coordinate down to region level
    const base = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c + 1}-CT${spatial.ct + 1}-R${spatial.r + 1}`;

    // Track how many NPCs have been generated at this exact location
    const count = (npcCounters.get(base) || 0) + 1;
    npcCounters.set(base, count);

    // First NPC at location: G1-S1-O7-C2-CT2-R4-NPC
    // Subsequent NPCs: G1-S1-O7-C2-CT2-R4-NPC2, G1-S1-O7-C2-CT2-R4-NPC3, etc.
    return count === 1 ? `${base}-NPC` : `${base}-NPC${count}`;
}

/**
 * Extracts potential entity mentions from narration text.
 * Returns an array of detected entity hints.
 */
export function detectEntities(narration: string): Array<{
    name: string;
    role: string;
    description: string;
}> {
    const entities: Array<{ name: string; role: string; description: string }> = [];

    // Pattern: "A [adjective] [role] named [Name]" or "[Name], the [role]"
    const patterns = [
        /(?:a|an|the)\s+(\w+(?:\s+\w+)?)\s+(?:named|called)\s+["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?/gi,
        /["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?,?\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?)/gi,
        /(?:meet|see|notice|encounter)\s+(?:a|an|the)?\s*["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?/gi,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(narration)) !== null) {
            const [, group1, group2] = match;
            // Determine which group is name vs role based on capitalization
            const name = group2?.match(/^[A-Z]/) ? group2 : group1;
            const role = group2?.match(/^[A-Z]/) ? group1 : group2 || "NPC";

            if (name && !entities.some(e => e.name === name)) {
                entities.push({
                    name: name.trim(),
                    role: role?.trim() || "NPC",
                    description: match[0].trim(),
                });
            }
        }
    }

    return entities;
}

/**
 * Uses LLM to generate a full character card from a detected entity.
 */
async function generateCharacterCard(
    ollama: OllamaClient,
    template: NpcGenerationTemplate,
    entityHint: { name: string; role: string; description: string },
    model: string = "llama3"
): Promise<NpcProfile> {
    const { locationContext, factionHint, affinityKey, narrativeContext } = template;

    const prompt = `You are a game master generating an NPC character card for a cyberpunk sci-fi RPG (EIDEUS DAWN).

NPC BEHAVIOR RULES:
- NPCs have their own motives and agendas.
- NPCs can lie, be wrong, or withhold data.
- Aware of social hierarchy (Syndicate, Core, Outer Rim).
- Must obey world tech level (hard sci-fi). No magic.
- Not created to help the player.

CONTEXT:
- Location: ${locationContext.locationName} (${locationContext.locationType})
- Faction Hint: ${factionHint || "Unknown"}
- Affinity: ${affinityKey || "None"}
- Narrative Context: "${narrativeContext || entityHint.description}"

DETECTED ENTITY:
- Name: ${entityHint.name}
- Apparent Role: ${entityHint.role}

Generate a character card with the following JSON format (respond ONLY with valid JSON):
{
  "name": "Full Name",
  "title": "Job Title or Role",
  "personality": [
    { "trait": "TraitName", "description": "How this manifests" }
  ],
  "voice": "How they speak (e.g., 'gruff and terse', 'melodic and cryptic')",
  "systemPrompt": "[ROLE: X] [TITLE: Y]\\nYou are Name. NPCs have motives and can lie. No magic.",
  "traits": ["Trait1", "Trait2", "Trait3"],
  "backstory": "One sentence backstory"
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
        const npcId = generateNpcId(locationContext.spatial);
        const now = new Date().toISOString();

        const profile: NpcProfile = {
            id: npcId,
            name: generated.name || entityHint.name,
            role: "NPC",
            title: generated.title || entityHint.role,
            description: generated.backstory || entityHint.description,
            currentLocation: locationContext.objectKey,
            spatial: locationContext.spatial,
            faction: factionHint || "Unaffiliated",
            disposition: 0,
            chatState: NpcChatState.NEUTRAL,
            personality: generated.personality || [],
            voice: generated.voice,
            systemPrompt: generated.systemPrompt || `[ROLE: NPC] [TITLE: ${generated.title}]\nYou are ${generated.name}.`,
            traits: generated.traits || [],
            knowledge: {},
            memory: [
                {
                    timestamp: now,
                    memory: `First encountered at ${locationContext.locationName}.`,
                    tags: ["encounter", "origin"],
                },
            ],
            relationships: [],
            avatarPath: null,
            isProcedural: true,
            createdAt: now,
        };

        return profile;
    } catch (err) {
        // Fallback: create a minimal profile from the entity hint
        console.warn("[NpcGenerator] LLM generation failed, using fallback:", err);
        const npcId = generateNpcId(locationContext.spatial);
        const now = new Date().toISOString();

        return {
            id: npcId,
            name: entityHint.name,
            role: "NPC",
            title: entityHint.role,
            description: entityHint.description,
            currentLocation: locationContext.objectKey,
            spatial: locationContext.spatial,
            faction: factionHint || "Unaffiliated",
            disposition: 0,
            chatState: NpcChatState.NEUTRAL,
            personality: [
                { trait: "Unknown", description: "Not yet characterized." },
            ],
            voice: undefined,
            systemPrompt: `[ROLE: NPC] [TITLE: ${entityHint.role}]\nYou are ${entityHint.name}. Your personality is not yet defined; respond cautiously and observe the player.`,
            traits: [],
            knowledge: {},
            memory: [
                {
                    timestamp: now,
                    memory: `First encountered at ${locationContext.locationName}.`,
                    tags: ["encounter", "origin"],
                },
            ],
            relationships: [],
            avatarPath: null,
            isProcedural: true,
            createdAt: now,
        };
    }
}

/**
 * Converts an NpcProfile to the EntityRef format for memory voxel z+ face.
 */
function profileToEntityRef(profile: NpcProfile): EntityRef {
    return {
        id: profile.id,
        name: profile.name,
        class: profile.title,
        aliases: [],
        isProcedural: profile.isProcedural,
    };
}

/**
 * Converts an NpcProfile to the lorebook inhabitant format.
 */
function profileToLorebookEntry(profile: NpcProfile): LorebookInhabitant {
    return {
        name: profile.name,
        role: profile.role,
        title: profile.title,
        avatar_path: profile.avatarPath || null,
        character_card: {
            system_prompt: profile.systemPrompt,
            traits: profile.traits,
            id: profile.id,
        },
        isProcedural: profile.isProcedural,
    };
}

/**
 * Main NPC generation function.
 * Detects entities in narration and generates full character cards.
 */
export async function generateNpcsFromNarration(
    ollama: OllamaClient,
    narration: string,
    template: Omit<NpcGenerationTemplate, "narrativeContext">,
    existingEntityIds: Set<string>,
    model: string = "llama3"
): Promise<GeneratedNpc[]> {
    const detected = detectEntities(narration);
    const results: GeneratedNpc[] = [];

    for (const entityHint of detected) {
        // Skip if this entity name is already known
        const nameKey = entityHint.name.toLowerCase().replace(/\s+/g, "_");
        if (existingEntityIds.has(nameKey)) {
            continue;
        }

        const fullTemplate: NpcGenerationTemplate = {
            ...template,
            narrativeContext: narration,
        };

        const profile = await generateCharacterCard(ollama, fullTemplate, entityHint, model);
        const entityRef = profileToEntityRef(profile);
        const lorebookEntry = profileToLorebookEntry(profile);

        results.push({ profile, entityRef, lorebookEntry });
        existingEntityIds.add(nameKey); // Mark as known
    }

    return results;
}

/**
 * Creates the NPC Generator service.
 */
export function createNpcGenerator(ollama: OllamaClient) {
    const knownEntities = new Set<string>();

    return {
        /**
         * Process narration and generate NPCs for any new entities detected.
         */
        async processNarration(
            narration: string,
            locationContext: NpcGenerationTemplate["locationContext"],
            options?: {
                factionHint?: string;
                affinityKey?: "STR" | "INT" | "DEX";
                model?: string;
            }
        ): Promise<GeneratedNpc[]> {
            return generateNpcsFromNarration(
                ollama,
                narration,
                {
                    roleOptions: [
                        { value: "Subordinate", weight: 70 },
                        { value: "NPC", weight: 20 },
                        { value: "Governor", weight: 8 },
                        { value: "Leader", weight: 2 },
                    ],
                    locationContext,
                    factionHint: options?.factionHint,
                    affinityKey: options?.affinityKey,
                },
                knownEntities,
                options?.model
            );
        },

        /**
         * Register an existing entity so it won't be re-generated.
         */
        registerKnownEntity(name: string): void {
            knownEntities.add(name.toLowerCase().replace(/\s+/g, "_"));
        },

        /**
         * Register multiple existing entities.
         */
        registerKnownEntities(names: string[]): void {
            for (const name of names) {
                this.registerKnownEntity(name);
            }
        },

        /**
         * Clear known entities (for testing or session reset).
         */
        clearKnownEntities(): void {
            knownEntities.clear();
        },
    };
}
