/**
 * Landing API Routes
 * Handles AI world generation for first-time landings
 */

import type { Request, Response } from 'express';
import { WorldDataWriter, type Destination } from './worldDataWriter';
import { AIWorldGenerator } from './aiWorldGenerator';
import { OllamaClient } from './ollama/client';

const worldWriter = new WorldDataWriter();
let aiGenerator: AIWorldGenerator | null = null;

// Initialize AI generator with Ollama client
const initAIGenerator = (ollama: OllamaClient) => {
    if (!aiGenerator) {
        aiGenerator = new AIWorldGenerator(ollama);
        console.log('[Landing API] AI Generator initialized with Ollama');
    }
    return aiGenerator;
};

/**
 * POST /api/landing/generate
 * Generate world content for a new location
 */
export async function handleLandingGeneration(req: Request, res: Response) {
    try {
        const { destination, ollama } = req.body as { destination: Destination; ollama?: any };

        if (!destination) {
            return res.status(400).json({ error: 'Missing destination' });
        }

        console.log('[Landing API] Generating world content for:', destination.name, destination.address);

        // Get Ollama client from request (passed by server middleware)
        const ollamaClient = (req as any).ollamaClient;
        if (!ollamaClient) {
            throw new Error('Ollama client not available');
        }

        // Initialize AI generator
        const generator = initAIGenerator(ollamaClient);

        // Step 1: Generate city map
        console.log('[Landing API] Generating city map...');
        const cityMap = await generator.generateCityMap(destination);
        const cityMapPath = await worldWriter.writeCityMap(destination, cityMap);

        // Step 2: Generate lorebook entries
        console.log('[Landing API] Generating lorebook...');
        const lorebookEntries = await generator.generateLorebook(destination);
        const lorebookPath = await worldWriter.writeLorebook(destination, lorebookEntries);

        // Step 3: Generate quests
        console.log('[Landing API] Generating quests...');
        const quests = await generator.generateQuests(destination, cityMap);
        const questsPath = await worldWriter.writeQuests(destination, quests);

        // Step 4: Update sector map
        console.log('[Landing API] Updating sector map...');
        await worldWriter.updateSectorMap(destination);

        // Success response
        const result = {
            success: true,
            generated: {
                cityMapPath,
                lorebookPath,
                questsPath,
                npcCount: cityMap.waypoints.reduce((sum, wp) => sum + (wp.npcs?.length || 0), 0),
                waypointCount: cityMap.waypoints.length,
                lorebookEntries: lorebookEntries.length,
                quests: quests.length,
            },
        };

        console.log('[Landing API] Generation complete:', result.generated);
        return res.json(result);

    } catch (error: any) {
        console.error('[Landing API] Generation failed:', error);
        return res.status(500).json({
            error: 'World generation failed',
            message: error.message,
        });
    }
}

/**
 * GET /api/landing/status/:address
 * Check if a location has been generated
 */
export async function handleLandingStatus(req: Request, res: Response) {
    try {
        const { address } = req.params;

        // Parse address (e.g., "G1-S1-O1")
        const parts = address.split('-');
        if (parts.length !== 3) {
            return res.status(400).json({ error: 'Invalid address format' });
        }

        // TODO: Check if files exist for this location
        // For now, return basic status
        return res.json({
            address,
            generated: false,
            message: 'Location status check not yet implemented',
        });

    } catch (error: any) {
        console.error('[Landing API] Status check failed:', error);
        return res.status(500).json({
            error: 'Status check failed',
            message: error.message,
        });
    }
}
