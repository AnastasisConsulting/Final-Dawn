// PATH: src/services/validation/worldValidator.ts
import { PlanetState } from '../../types';
import { validateWorldIdFormat } from '../ids/idValidator';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  counts: {
    civs: number;
    cities: number;
    regions: number;
    leaders: number;
    governors: number;
    subordinates: number;
    quests: number;
  };
}

export function validateWorldState(
    worldId: string, 
    state: PlanetState, 
    seedId?: string | null
): ValidationResult {
  const errors: string[] = [];
  const counts = {
    civs: 0, cities: 0, regions: 0,
    leaders: 0, governors: 0, subordinates: 0, quests: 0
  };

  // 1. World ID check (Format & Consistency)
  if (!worldId) {
      errors.push("World ID is missing.");
  } else {
      const fmt = validateWorldIdFormat(worldId);
      if (!fmt.valid) errors.push(fmt.error!);
  }

  if (state.ids?.node_key && state.ids.node_key !== worldId) {
    errors.push(`State ID (${state.ids.node_key}) mismatch with worldId (${worldId})`);
  }

  // Seed Consistency Check
  if (seedId && seedId !== worldId) {
      errors.push(`Critical: Workspace ID (${worldId}) does not match Seed ID (${seedId}).`);
  }

  // 2. Phase 1 Check
  if (!state.textureUrl) errors.push("Phase 1 incomplete: No texture URL.");

  // 3. Metadata presence
  if (!state.metadata || !state.metadata.civilizations) {
    errors.push("Phase 2 incomplete: No civilization metadata.");
    return { ok: false, errors, counts };
  }

  // 4. Civ Checks
  const civs = state.metadata.civilizations;
  counts.civs = civs.length;
  if (counts.civs !== 3) errors.push(`Invalid Civ count: ${counts.civs} (expected 3)`);

  const attributes = new Set<string>();

  civs.forEach((civ, idx) => {
    // Attribute uniqueness
    if (attributes.has(civ.primaryAttribute)) {
        errors.push(`Duplicate attribute ${civ.primaryAttribute} in Civ ${idx + 1}`);
    }
    attributes.add(civ.primaryAttribute);

    // Leader
    if (civ.leader) {
        counts.leaders++;
        if (!civ.leader.id.startsWith(worldId)) errors.push(`Leader ID ${civ.leader.id} not prefixed with ${worldId}`);
    } else {
        errors.push(`Civ ${civ.name} missing Leader`);
    }

    // Cities
    counts.cities += civ.cities.length;
    if (civ.cities.length !== 3) errors.push(`Civ ${civ.name} has ${civ.cities.length} cities (expected 3)`);

    civ.cities.forEach(city => {
        if (!city.cityId.startsWith(worldId)) errors.push(`City ID ${city.cityId} not prefixed`);
        if (city.civId !== civ.civId) errors.push(`City ${city.name} civId mismatch`);

        // Regions
        counts.regions += city.regionalLocales.length;
        if (city.regionalLocales.length !== 7) errors.push(`City ${city.name} has ${city.regionalLocales.length} regions (expected 7)`);
        
        city.regionalLocales.forEach(reg => {
             if (!reg.regionId.startsWith(worldId)) errors.push(`Region ID ${reg.regionId} not prefixed`);
             if (reg.cityId !== city.cityId) errors.push(`Region ${reg.name} cityId mismatch`);
        });

        // Governor
        if (city.governor) {
            counts.governors++;
            if (!city.governor.id.startsWith(worldId)) errors.push(`Governor ID ${city.governor.id} not prefixed`);
            if (city.governor.cityId !== city.cityId) errors.push(`Governor ${city.governor.name} cityId mismatch`);

            // Subordinates
            counts.subordinates += city.governor.lieutenants.length;
            if (city.governor.lieutenants.length !== 7) errors.push(`Governor ${city.governor.name} has ${city.governor.lieutenants.length} subordinates (expected 7)`);

            city.governor.lieutenants.forEach(sub => {
                if (!sub.id.startsWith(worldId)) errors.push(`Subordinate ID ${sub.id} not prefixed`);
                if (sub.governorId !== city.governor!.id) errors.push(`Subordinate ${sub.name} governorId mismatch`);
                // Check region link
                if (!city.regionalLocales.find(r => r.regionId === sub.regionId)) {
                    errors.push(`Subordinate ${sub.name} assigned to invalid region ${sub.regionId}`);
                }
            });
        } else {
            errors.push(`City ${city.name} missing Governor`);
        }
    });

    // Quests
    if (civ.quests) {
        counts.quests += civ.quests.length;
        if (civ.quests.length !== 7) errors.push(`Civ ${civ.name} has ${civ.quests.length} quests (expected 7)`);
        
        civ.quests.forEach(q => {
             if (!q.id.startsWith(worldId)) errors.push(`Quest ID ${q.id} not prefixed`);
             if (q.primaryAttribute !== civ.primaryAttribute) errors.push(`Quest ${q.name} attribute mismatch`);
             
             // Triad check
             const npcIds = new Set([q.giverNpcId, q.middleNpcId, q.completionNpcId]);
             if (npcIds.size !== 3) errors.push(`Quest ${q.name} does not have 3 distinct NPCs`);
        });
    }
  });

  if (attributes.size !== 3 || !attributes.has('STR') || !attributes.has('DEX') || !attributes.has('INT')) {
      errors.push("Civilizations must strictly cover {STR, DEX, INT}");
  }

  // 5. Global Count Checks
  if (counts.cities !== 9) errors.push(`Total cities ${counts.cities} != 9`);
  if (counts.regions !== 63) errors.push(`Total regions ${counts.regions} != 63`);
  if (counts.leaders !== 3) errors.push(`Total leaders ${counts.leaders} != 3`);
  if (counts.governors !== 9) errors.push(`Total governors ${counts.governors} != 9`);
  if (counts.subordinates !== 63) errors.push(`Total subordinates ${counts.subordinates} != 63`);
  if (counts.quests !== 21) errors.push(`Total quests ${counts.quests} != 21`);

  // Validation logic regarding blob URLs has been removed to allow export of active sessions with avatars.

  return {
    ok: errors.length === 0,
    errors,
    counts
  };
}