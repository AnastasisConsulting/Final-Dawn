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
    id: npc.id,
    type: "NPC",
    subtype: structuralRole,
    name: npc.name,
    title: flavorTitle,
    avatar_path: avatarPath || null,
    character_card: {
      system_prompt: augmentedPrompt,
      traits: npc.traits || [],
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
    id: q.id,
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
  // FILE 2: lorebook.json (Unified Structure)
  // =========================================================
  
  // Prepare Flat Lists for the 'cards' section
  const civCards: any[] = [];
  const cityCards: any[] = [];
  const leaderCards: any[] = [];
  const governorCards: any[] = [];
  const subordinateCards: any[] = [];

  const hierarchicalCivilizations = state.metadata?.civilizations.map((civ) => {
      const leaderAvatar = civ.leader ? avatarPaths[civ.leader.id] : undefined;
      
      // 1. Civilization Card
      civCards.push({
          id: civ.civId,
          type: "CIVILIZATION",
          name: civ.name,
          primary_attribute: civ.primaryAttribute,
          summary: civ.summary,
          themes: civ.themes,
          taboos: civ.taboos,
          conflict_drivers: civ.conflictDrivers
      });

      // 2. Leader Card
      if (civ.leader) {
          leaderCards.push({
              civ_id: civ.civId,
              ...formatCharacterCard(civ.leader, "Leader", leaderAvatar)
          });
      }

      const hierarchicalCities = civ.cities.map((city) => {
          const govAvatar = city.governor ? avatarPaths[city.governor.id] : undefined;

          // 3. City Card
          cityCards.push({
              id: city.cityId,
              civ_id: civ.civId,
              type: "CITY",
              name: city.name,
              description: city.description,
              tags: city.tags
          });

          // 4. Governor Card
          if (city.governor) {
              governorCards.push({
                  civ_id: civ.civId,
                  city_id: city.cityId,
                  ...formatCharacterCard(city.governor, "Governor", govAvatar)
              });

              // 5. Subordinate Cards
              (city.governor.lieutenants || []).forEach(lt => {
                  const ltAvatar = avatarPaths[lt.id];
                  subordinateCards.push({
                      civ_id: civ.civId,
                      city_id: city.cityId,
                      region_id: lt.regionId,
                      ...formatCharacterCard(lt, "Subordinate", ltAvatar)
                  });
              });
          }

          // Regions Hierarchical View
          const regions = (city.regionalLocales || []).map((region) => {
              const lieutenants = city.governor?.lieutenants || [];
              const localNpcs = lieutenants
                  .filter(lt => lt.regionId === region.regionId)
                  .map(lt => {
                      const ltAvatar = avatarPaths[lt.id];
                      return formatCharacterCard(lt, "Subordinate", ltAvatar);
                  });

              return {
                id: region.regionId,
                name: region.name,
                type: region.type,
                description: region.description,
                coordinates: region.position,
                inhabitants: localNpcs
              };
          });

          return {
            id: city.cityId,
            name: city.name,
            description: city.description,
            governor: city.governor ? formatCharacterCard(city.governor, "Governor", govAvatar) : null,
            districts: regions
          };
      });

      return {
        id: civ.civId,
        name: civ.name,
        attribute_key: civ.primaryAttribute,
        summary: civ.summary,
        leader: civ.leader ? formatCharacterCard(civ.leader, "Leader", leaderAvatar) : null,
        cities: hierarchicalCities
      };
  });

  const lorebook = {
    world_id: worldId,
    meta: {
      name: state.name,
      description: state.description,
      generated_at: new Date().toISOString()
    },
    history: state.metadata?.history,
    
    // Original Hierarchical Structure (for tree views)
    structure: hierarchicalCivilizations,

    // New Flat 'Deck' Structure (for game engine importing)
    cards: {
        civilizations: civCards,
        cities: cityCards,
        leaders: leaderCards,
        governors: governorCards,
        subordinates: subordinateCards
    }
  };
  
  zip.file("lorebook.json", JSON.stringify(lorebook, null, 2));

  // =========================================================
  // FILE 3: quests.json
  // =========================================================
  
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
      instruction: "Quests keyed by Primary Attribute (STR, DEX, INT).",
    },
    paths: {}
  };

  state.metadata?.civilizations.forEach(civ => {
    const attr = civ.primaryAttribute;
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

  const content = await zip.generateAsync({ type: "blob" });
  return { blob: content, filename: `${bundleName}.zip` };
}