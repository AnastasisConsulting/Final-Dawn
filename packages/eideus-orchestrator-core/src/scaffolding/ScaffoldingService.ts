import type { Ollama } from "ollama";
import type { VoxelCoordinate } from "../types.js";
import type {
    GeneratedNpc,
    GeneratedLandmark,
    NpcGenerationTemplate,
    LandmarkGenerationTemplate,
    LandmarkType
} from "./types.js";

export class ScaffoldingService {
    private ollama: Ollama;
    private knownEntities: Set<string> = new Set();
    private knownLandmarks: Set<string> = new Set();
    private npcCounters: Map<string, number> = new Map();
    private landmarkCounters: Map<string, number> = new Map();

    constructor(ollama: Ollama) {
        this.ollama = ollama;
    }

    private generateNpcId(spatial: VoxelCoordinate): string {
        const base = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c + 1}-CT${spatial.ct + 1}-R${spatial.r + 1}`;
        const count = (this.npcCounters.get(base) || 0) + 1;
        this.npcCounters.set(base, count);
        return count === 1 ? `${base}-NPC` : `${base}-NPC${count}`;
    }

    private generateLandmarkId(spatial: VoxelCoordinate, type: LandmarkType): string {
        const base = `G${spatial.g}-S${spatial.s}-O${spatial.o}-C${spatial.c + 1}-CT${spatial.ct + 1}-R${spatial.r + 1}`;
        const suffix = type === "OBJECT" ? "OBJ" : type === "VEHICLE" ? "VEH" : "LOC";
        const key = `${base}-${suffix}`;
        const count = (this.landmarkCounters.get(key) || 0) + 1;
        this.landmarkCounters.set(key, count);
        return count === 1 ? key : `${key}${count}`;
    }

    /**
     * Detects entities in narration.
     */
    detectEntities(narration: string): Array<{ name: string; role: string; description: string }> {
        const entities: Array<{ name: string; role: string; description: string }> = [];
        const patterns = [
            /(?:a|an|the)\s+(\w+(?:\s+\w+)?)\s+(?:named|called)\s+["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?/gi,
            /["']?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)["']?,?\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?)/gi,
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(narration)) !== null) {
                const [, group1, group2] = match;
                const name = group2?.match(/^[A-Z]/) ? group2 : group1;
                const role = group2?.match(/^[A-Z]/) ? group1 : group2 || "NPC";
                if (name && !this.knownEntities.has(name.toLowerCase().replace(/\s+/g, "_"))) {
                    entities.push({ name: name.trim(), role: role?.trim() || "NPC", description: match[0].trim() });
                }
            }
        }
        return entities;
    }

    /**
     * Detects landmarks in narration.
     */
    detectLandmarks(narration: string): Array<{ name: string; type: LandmarkType; description: string }> {
        const landmarks: Array<{ name: string; type: LandmarkType; description: string }> = [];
        const patterns: Array<{ regex: RegExp; type: LandmarkType }> = [
            { regex: /(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(temple|factory|tower|station|facility|complex|warehouse|bunker|fortress|citadel|spire|dome)/gi, type: "STRUCTURE" },
            { regex: /(?:notice|spot|see|observe|find)\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(terminal|console|panel|generator|reactor|beacon|monument|statue|altar|shrine)/gi, type: "POI" },
            { regex: /(?:pick up|examine|inspect|grab|take|collect)\s+(?:the|a|an)\s+(\w+(?:\s+\w+)?(?:\s+\w+)?)/gi, type: "OBJECT" },
        ];

        for (const { regex, type } of patterns) {
            let match;
            while ((match = regex.exec(narration)) !== null) {
                let name = match[2] ? `${match[1]} ${match[2]}`.trim() : match[1]?.trim();
                if (name && name.length > 2 && !this.knownLandmarks.has(name.toLowerCase().replace(/\s+/g, "_"))) {
                    name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
                    landmarks.push({ name, type, description: match[0].trim() });
                }
            }
        }
        return landmarks;
    }

    async processNarration(
        narration: string,
        spatial: VoxelCoordinate,
        locationName: string,
        loreKey: string,
        model: string = "llama3"
    ): Promise<{ npcs: GeneratedNpc[], landmarks: GeneratedLandmark[] }> {
        const detectedNpcs = this.detectEntities(narration);
        const detectedLms = this.detectLandmarks(narration);

        const npcs: GeneratedNpc[] = [];
        const landmarks: GeneratedLandmark[] = [];

        // NPC Generation (Simplified for brevity in core, porting LLM call pattern)
        for (const hint of detectedNpcs) {
            const id = this.generateNpcId(spatial);
            const profile = {
                id, name: hint.name, role: hint.role,
                description: `First encountered at ${locationName}. ${hint.description}`,
                spatial, isProcedural: true
            };
            npcs.push({ profile, entityRef: { id, name: hint.name, class: hint.role, aliases: [] } });
            this.knownEntities.add(hint.name.toLowerCase().replace(/\s+/g, "_"));
        }

        // Landmark Generation
        for (const hint of detectedLms) {
            const id = this.generateLandmarkId(spatial, hint.type);
            const profile = {
                id, name: hint.name, type: hint.type,
                description: hint.description,
                spatial, isProcedural: true, parentLoreKey: loreKey
            };
            landmarks.push({ profile, landmarkRef: { id, name: hint.name, type: hint.type, description: hint.description, tags: [], isProcedural: true, parentLoreKey: loreKey } });
            this.knownLandmarks.add(hint.name.toLowerCase().replace(/\s+/g, "_"));
        }

        return { npcs, landmarks };
    }

    registerKnownEntities(names: string[]) {
        names.forEach(n => this.knownEntities.add(n.toLowerCase().replace(/\s+/g, "_")));
    }

    registerKnownLandmarks(names: string[]) {
        names.forEach(n => this.knownLandmarks.add(n.toLowerCase().replace(/\s+/g, "_")));
    }
}
