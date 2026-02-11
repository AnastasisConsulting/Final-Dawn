// packages/eideus-orchestrator-core/src/prompts/templates.ts
import type { TurnContext, VoxelSnapshot } from '../types.js';
import { GLOBAL_INVARIANTS, ROLE_INSTRUCTIONS, MOSS_INJECTION } from '../prompts/system.js';

export function buildCharacterPrompt(role: string, snapshot: VoxelSnapshot, userIntent: string): string {
  const agentRole = String(role || "GM").toUpperCase() as TurnContext["agentRole"];
  const context: TurnContext = {
    agentRole,
    currentVoxel: snapshot,
    userIntent,
    allowedTools: [],
  };
  return buildDynamicSystemPrompt(context);
}

export function buildDynamicSystemPrompt(context: TurnContext): string {
  const roleInstruction =
    ROLE_INSTRUCTIONS[context.agentRole as keyof typeof ROLE_INSTRUCTIONS] ??
    ROLE_INSTRUCTIONS.GM;
  
  // 1. Build the Memory Block (The "Context Window")
  const voxelBlock = formatVoxelBlock(context.currentVoxel);
  
  // 2. Build the Quest Block (if applicable)
  const questBlock = context.activeQuestId 
    ? `### ACTIVE PROTOCOL: ${context.activeQuestId}\nFocus narration on advancing this objective.` 
    : "### STATE: Free Roam / Exploration";

  // 3. Assemble the prompt
  return `
${GLOBAL_INVARIANTS}

${roleInstruction}

${questBlock}

${voxelBlock}

### OUTPUT FORMAT
{
  "thought": "Internal reasoning about the player's intent and memory context.",
  "dialogue": "Your response as the character.",
  "state_update": { "affinity_shift": { "S": +1 } } // Optional
}
`;
}

function formatVoxelBlock(voxel: VoxelSnapshot): string {
  return `
### IMMEDIATE ENVIRONMENT (VOXEL DATA)
- COORDINATE: ${voxel.coordinate}
- LOCATION TRUTH (Z-): "${voxel.faces.z_minus}"
- ENTITIES PRESENT (Z+): ${voxel.faces.z_plus.join(', ')}
- RECENT EVENTS (X-): "${voxel.faces.x_minus}"
- KEYWORD TAGS (Y-): ${voxel.faces.y_minus.slice(0, 5).join(', ')}
`;
}
