// packages/eideus-orchestrator-core/src/validators.ts
import { z } from 'zod';

export const AgentOutputSchema = z.object({
  thought: z.string().max(100, "Thought process too long"),
  dialogue: z.string().min(1, "Dialogue cannot be empty"),
  state_update: z.object({
    new_tags: z.array(z.string()).optional(),
    affinity_shift: z.object({
      M: z.number().optional(),
      O: z.number().optional(),
      S: z.number().optional(),
      S_prime: z.number().optional(),
    }).optional()
  }).optional()
});

export type ValidatedOutput = z.infer<typeof AgentOutputSchema>;