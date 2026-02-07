// packages/eideus-ollama-orchestrator/src/npc/NpcChatService.ts
// Adapted from candidates/NpcChatService.ts
// Handles NPC-specific conversation with personality injection

import type { OllamaClient } from "../ollama/client.js";
import type { NpcProfile, NpcChatState } from "./npc.types.js";

/**
 * Maps numeric disposition to a behavioral description for the LLM.
 */
function getDispositionDescriptor(disposition: number): string {
    if (disposition <= -50) return "Hostile, aggressive, and unwilling to help.";
    if (disposition < -10) return "Suspicious, guarded, and terse.";
    if (disposition <= 10) return "Neutral, transactional, and business-like.";
    if (disposition < 50) return "Friendly, open, and willing to chat.";
    return "Trusted ally, completely open, and helpful.";
}

/**
 * Message format for NPC chat history.
 */
export interface NpcChatMessage {
    role: "user" | "assistant";
    content: string;
}

/**
 * Builds the system prompt based on the NpcProfile.
 */
function generateSystemPrompt(profile: NpcProfile): string {
    // 1. Format Personality
    const personalityString = profile.personality
        .map(p => `- ${p.trait}: ${p.description}`)
        .join("\n");

    // 2. Format Memories/Knowledge (most recent 10)
    const recentMemories = profile.memory
        .slice(-10)
        .map(m => `- [${m.timestamp.slice(0, 10)}] ${m.memory}`)
        .join("\n");

    // 3. Format unlocked knowledge
    const unlockedKnowledge = Object.values(profile.knowledge)
        .filter(k => k.isUnlocked)
        .map(k => `- ${k.content}`)
        .join("\n");

    // 4. Determine Attitude
    const attitude = getDispositionDescriptor(profile.disposition);

    const prompt = [
        "### MASTER INSTRUCTIONS ###",
        `You are ${profile.name}.`,
        "You are a character in a dystopian cyberpunk space RPG.",
        "Respond *exactly* in character based on your personality traits.",
        "NEVER break character. NEVER mention you are an AI.",
        `Your current attitude towards the player is: ${attitude}`,

        "\n### YOUR IDENTITY ###",
        `Name: ${profile.name}`,
        `Title: ${profile.title}`,
        `Faction: ${profile.faction}`,

        "\n### YOUR PERSONALITY ###",
        personalityString || "No specific personality defined.",

        profile.voice ? `\n### YOUR VOICE ###\n${profile.voice}` : "",

        "\n### YOUR DESCRIPTION ###",
        profile.description || "No description available.",

        unlockedKnowledge
            ? `\n### KNOWLEDGE YOU POSSESS ###\n${unlockedKnowledge}`
            : "",

        "\n### RECENT MEMORIES ###",
        recentMemories || "No specific recent memories.",

        "\n### CONTEXT ###",
        `Current Location: ${profile.currentLocation}`,
    ];

    return prompt.filter(Boolean).join("\n");
}

/**
 * NPC Chat Service - handles conversations with specific NPCs.
 */
export class NpcChatService {
    private ollama: OllamaClient;
    private model: string;

    constructor(ollama: OllamaClient, model: string = "llama3") {
        this.ollama = ollama;
        this.model = model;
    }

    /**
     * Send a message to an NPC and get their response.
     */
    async sendMessage(
        profile: NpcProfile,
        message: string,
        history: NpcChatMessage[] = []
    ): Promise<{ response: string; updatedProfile: NpcProfile }> {
        // Check if NPC is completely hostile
        if (profile.disposition <= -100) {
            return {
                response: "[This character refuses to communicate.]",
                updatedProfile: profile,
            };
        }

        // Check if NPC is locked
        if (profile.chatState === "LOCKED") {
            return {
                response: "[You don't know this person.]",
                updatedProfile: profile,
            };
        }

        const systemPrompt = generateSystemPrompt(profile);

        try {
            // Build conversation context from history
            const contextMessages = history
                .map(h => `${h.role === "user" ? "Player" : profile.name}: ${h.content}`)
                .join("\n");

            const fullPrompt = contextMessages
                ? `${contextMessages}\n\nPlayer: ${message}\n\n${profile.name}:`
                : `Player: ${message}\n\n${profile.name}:`;

            const res = await this.ollama.generate({
                model: this.model,
                system: systemPrompt,
                prompt: fullPrompt,
                options: { temperature: 0.7 },
            });

            const response = res.response.trim();

            // Add this interaction to NPC memory
            const updatedProfile: NpcProfile = {
                ...profile,
                lastInteraction: new Date().toISOString(),
                memory: [
                    ...profile.memory,
                    {
                        timestamp: new Date().toISOString(),
                        memory: `Player said: "${message.slice(0, 100)}${message.length > 100 ? "..." : ""}"`,
                        tags: ["conversation", "player"],
                    },
                ].slice(-50), // Keep last 50 memories
            };

            return { response, updatedProfile };
        } catch (error) {
            console.error("[NpcChatService] Error:", error);
            return {
                response: "[Connection Lost]",
                updatedProfile: profile,
            };
        }
    }

    /**
     * Update NPC disposition based on player actions.
     */
    adjustDisposition(
        profile: NpcProfile,
        delta: number,
        reason: string
    ): NpcProfile {
        const newDisposition = Math.max(-100, Math.min(100, profile.disposition + delta));

        // Potentially update chat state based on new disposition
        let newChatState = profile.chatState;
        if (newDisposition <= -50 && profile.chatState !== "HOSTILE") {
            newChatState = "HOSTILE" as NpcChatState;
        } else if (newDisposition >= 50 && profile.chatState !== "ALLIED") {
            newChatState = "ALLIED" as NpcChatState;
        } else if (newDisposition >= 20 && profile.chatState === "UNKNOWN") {
            newChatState = "NEUTRAL" as NpcChatState;
        }

        return {
            ...profile,
            disposition: newDisposition,
            chatState: newChatState,
            memory: [
                ...profile.memory,
                {
                    timestamp: new Date().toISOString(),
                    memory: `Disposition changed by ${delta}: ${reason}`,
                    tags: ["disposition", delta > 0 ? "positive" : "negative"],
                },
            ].slice(-50),
        };
    }

    /**
     * Unlock a knowledge block for an NPC.
     */
    unlockKnowledge(profile: NpcProfile, knowledgeKey: string): NpcProfile {
        if (!profile.knowledge[knowledgeKey]) {
            return profile;
        }

        return {
            ...profile,
            knowledge: {
                ...profile.knowledge,
                [knowledgeKey]: {
                    ...profile.knowledge[knowledgeKey],
                    isUnlocked: true,
                },
            },
            memory: [
                ...profile.memory,
                {
                    timestamp: new Date().toISOString(),
                    memory: `Knowledge unlocked: ${knowledgeKey}`,
                    tags: ["knowledge", "unlock"],
                },
            ].slice(-50),
        };
    }
}

/**
 * Factory function to create the NPC chat service.
 */
export function createNpcChatService(
    ollama: OllamaClient,
    model?: string
): NpcChatService {
    return new NpcChatService(ollama, model);
}
