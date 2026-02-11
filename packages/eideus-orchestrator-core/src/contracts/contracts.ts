// packages/eideus-orchestrator-core/src/contracts.ts
import { z } from "zod";

export const CharacterOutputSchema = z.object({
  thought: z.string().describe("Internal tactical reasoning (max 15 words)"),
  dialogue: z.string().describe("Character speech or action (max 30 words)"),
  intensity: z.number().min(0).max(1).describe("The emotional/operational weight of the turn")
});

export type CharacterOutput = z.infer<typeof CharacterOutputSchema>;

// NOTE: Voxel snapshots are defined in `src/types.ts` for the main pipeline.
// Keep this file focused on Zod contracts for model outputs.
