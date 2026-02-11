// PATH: src/services/export/indexBuilders.ts
import { PlanetState } from '../../types';

export function buildEntityIndex(state: PlanetState) {
  const index: Record<string, any> = {};
  
  state.metadata?.civilizations.forEach(civ => {
    // Leader
    if (civ.leader) {
      index[civ.leader.id] = {
        type: 'LEADER',
        name: civ.leader.name,
        civId: civ.civId,
        tags: civ.leader.traits
      };
    }

    civ.cities.forEach(city => {
      // Governor
      if (city.governor) {
        index[city.governor.id] = {
          type: 'GOVERNOR',
          name: city.governor.name,
          civId: civ.civId,
          cityId: city.cityId,
          title: city.governor.title
        };

        // Subordinates
        city.governor.lieutenants.forEach(sub => {
          index[sub.id] = {
            type: 'SUBORDINATE',
            name: sub.name,
            civId: civ.civId,
            cityId: city.cityId,
            regionId: sub.regionId,
            role: sub.role
          };
        });
      }
    });
  });

  return index;
}

export function buildLocationIndex(state: PlanetState) {
  const index: Record<string, any> = {};

  state.metadata?.civilizations.forEach(civ => {
    civ.cities.forEach(city => {
      city.regionalLocales.forEach(region => {
        index[region.regionId] = {
          civId: civ.civId,
          cityId: city.cityId,
          name: region.name,
          tags: region.tags,
          position: region.position
        };
      });
    });
  });

  return index;
}
