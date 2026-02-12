// services/export/exportWorldBundle.ts
import JSZip from 'jszip';
import { PlanetState, TransformData, Civilization, City, Lieutenant } from '../../types';
import { validateWorldState } from '../validation/worldValidator';

// Helper to format an NPC for the Lorebook Character Card
const formatCharacterCard = (npc: any, structuralRole: 'Leader' | 'Governor' | 'Subordinate', avatarPath?: string) => {
  const flavorTitle = npc.title || npc.role || "Unknown";
  
  // Explicitly inject roles into system prompt for LLM consistency
  const augmentedPrompt = `[ROLE: ${structuralRole}] [TITLE: ${flavorTitle}]\n${npc.systemPrompt}`;

  return {
    name: npc.name,
    role: structuralRole, // Explicit Structural Role
    title: flavorTitle,   // Flavor Title (e.g. "High Commander")
    avatar_path: avatarPath || null,
    character_card: {
      system_prompt: augmentedPrompt,
      traits: npc.traits || [],
      // We include these IDs so the Quest system can link back to this card
      id: npc.id, 
    }
  };
};

// Helper to format a Quest for PCG
const formatQuestForLLM = (q: any, npcs: any[]) => {
  const giver = npcs.find(n => n.id === q.giverNpcId);
  const middle = npcs.find(n => n.id === q.middleNpcId);
  const end = npcs.find(n => n.id === q.completionNpcId);

  return {
    title: q.name,
    narrative_guidance: q.description, // Vague guidelines
    improvisation_points: q.steps, // Steps as vague beats
    cast: {
      giver: { name: giver?.name || "Unknown", id: q.giverNpcId },
      contact: { name: middle?.name || "Unknown", id: q.middleNpcId },
      target: { name: end?.name || "Unknown", id: q.completionNpcId }
    }
  };
};

export async function generateWorldZip(
  worldId: string, 
  state: PlanetState, 
  seedData: TransformData | null
): Promise<{ blob: Blob, filename: string }> {

  // 1. Validate State Integrity
  const validation = validateWorldState(worldId, state, seedData?.Object_Key);
  if (!validation.ok) {
    throw new Error(`Export Blocked: \n${validation.errors.join('\n')}`);
  }

  const zip = new JSZip();
  const bundleName = `WorldBundle_${worldId}`;
  
  // Helper to fetch and zip avatar assets
  const avatarPaths: Record<string, string> = {};
  
  const processAvatar = async (npcId: string, url?: string) => {
     if (!url || !url.startsWith('blob:')) return undefined;
     try {
         const resp = await fetch(url);
         const blob = await resp.blob();
         const fileName = `${npcId}.png`;
         zip.file(`assets/avatars/${fileName}`, blob);
         return `assets/avatars/${fileName}`;
     } catch (e) {
         console.warn(`Failed to export avatar for ${npcId}`, e);
         return undefined;
     }
  };

  // Pre-process all avatars
  // We need to iterate state to find all avatars before building lorebook
  if (state.metadata?.civilizations) {
     for (const civ of state.metadata.civilizations) {
         if (civ.leader?.avatarUrl) {
             avatarPaths[civ.leader.id] = await processAvatar(civ.leader.id, civ.leader.avatarUrl) || "";
         }
         for (const city of civ.cities) {
             if (city.governor?.avatarUrl) {
                 avatarPaths[city.governor.id] = await processAvatar(city.governor.id, city.governor.avatarUrl) || "";
             }
             for (const lt of city.governor?.lieutenants || []) {
                 if (lt.avatarUrl) {
                     avatarPaths[lt.id] = await processAvatar(lt.id, lt.avatarUrl) || "";
                 }
             }
         }
     }
  }

  // =========================================================
  // FILE 1: texture.png (2048x1024)
  // =========================================================
  if (state.textureUrl) {
    try {
        const resp = await fetch(state.textureUrl);
        const blob = await resp.blob();
        zip.file("texture.png", blob);
    } catch (e) {
        console.error("Failed to fetch texture for zip", e);
    }
  }

  // =========================================================
  // FILE 2: lorebook.json (Hierarchical)
  // Organization: Civilization -> City -> Region -> NPCs
  // =========================================================
  const lorebook = {
    world_id: worldId,
    meta: {
      name: state.name,
      description: state.description,
      generated_at: new Date().toISOString()
    },
    global_history: state.metadata?.history,
    civilizations: state.metadata?.civilizations.map((civ) => {
      
      const leaderAvatar = civ.leader ? avatarPaths[civ.leader.id] : undefined;
      
      return {
        name: civ.name,
        attribute_key: civ.primaryAttribute, // STR, DEX, or INT
        summary: civ.summary,
        culture_notes: {
          themes: civ.themes,
          taboos: civ.taboos,
          conflict: civ.conflictDrivers
        },
        leader: civ.leader ? formatCharacterCard(civ.leader, "Leader", leaderAvatar) : null,
        
        // Cities
        cities: civ.cities.map((city) => {
          
          const govAvatar = city.governor ? avatarPaths[city.governor.id] : undefined;

          // Organize Regions with their local NPCs
          // Guard against undefined regionalLocales or lieutenants
          const regions = (city.regionalLocales || []).map((region) => {
            
            const lieutenants = city.governor?.lieutenants || [];
            // Find NPCs assigned to this specific region
            const localNpcs = lieutenants
                .filter(lt => lt.regionId === region.regionId)
                .map(lt => {
                    const ltAvatar = avatarPaths[lt.id];
                    return formatCharacterCard(lt, "Subordinate", ltAvatar);
                });

            return {
              name: region.name,
              type: region.type,
              description: region.description, // summaryStub
              coordinates: region.position,
              inhabitants: localNpcs // NPCs live here in the JSON structure
            };
          });

          return {
            name: city.name,
            description: city.description,
            governor: city.governor ? formatCharacterCard(city.governor, "Governor", govAvatar) : null,
            districts: regions
          };
        })
      };
    })
  };
  
  zip.file("lorebook.json", JSON.stringify(lorebook, null, 2));

  // =========================================================
  // FILE 3: quests.json (PCG Ready)
  // Keyed by Attribute (STR/DEX/INT)
  // =========================================================
  
  // Flatten all NPCs for ID lookup during quest formatting
  let allNpcs: any[] = [];
  state.metadata?.civilizations.forEach(c => {
    if(c.leader) allNpcs.push(c.leader);
    c.cities.forEach(city => {
        if(city.governor) {
            allNpcs.push(city.governor);
            if (city.governor.lieutenants) {
                allNpcs = [...allNpcs, ...city.governor.lieutenants];
            }
        }
    });
  });

  const questbook: any = {
    meta: {
      instruction: "The player's chosen Primary Attribute (STR, DEX, or INT) determines their starting civilization and quest line.",
      usage: "Ingest the specific key matching the player's stat to retrieve the narrative path."
    },
    paths: {}
  };

  // Build the Attribute Keys
  state.metadata?.civilizations.forEach(civ => {
    const attr = civ.primaryAttribute; // STR, DEX, INT
    
    questbook.paths[attr] = {
      civilization_target: civ.name,
      civilization_id: civ.civId,
      campaign_outline: {
        quests: (civ.quests || []).map(q => formatQuestForLLM(q, allNpcs))
      }
    };
  });

  zip.file("quests.json", JSON.stringify(questbook, null, 2));

  // =========================================================
  // FILE 4: Raw State (Optional backup)
  // =========================================================
  if (seedData) {
      zip.file("source_seed.json", JSON.stringify(seedData, null, 2));
  }

  // Generate the zip blob
  const content = await zip.generateAsync({ type: "blob" });
  return { blob: content, filename: `${bundleName}.zip` };
}
