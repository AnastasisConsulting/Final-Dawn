// apps/dawn-ui/components/CharacterProgression/Adapter.ts
import { TEMPLATE } from '@eideus/class-skills';
import { Affinity, NodeData, Skill } from './types';

const mapAffinity = (a: any): Affinity => {
    const s = String(a).toUpperCase();
    if (s === 'STR') return Affinity.STR;
    if (s === 'INT') return Affinity.INT;
    if (s === 'DEX') return Affinity.DEX;
    return Affinity.NULL;
};

export const loadProgressionTree = (): NodeData[] => {
    const coreKeys = Object.keys(TEMPLATE.cores);

    return coreKeys.map(coreId => {
        const coreDef = TEMPLATE.cores[coreId];

        // Find all builds for this core to extract skills
        const builds = TEMPLATE.builds[coreId] || {};
        const buildKeys = Object.keys(builds);

        // Pick any build to get Core skills (E1, E2)
        const firstBuild = buildKeys.length > 0 ? builds[buildKeys[0]] : null;
        const coreSkills: Skill[] = [];
        if (firstBuild) {
            if (firstBuild.E1) coreSkills.push({ id: firstBuild.E1.name, name: firstBuild.E1.name, type: 'CORE', levelReq: 0, description: firstBuild.E1.desc });
            if (firstBuild.E2) coreSkills.push({ id: firstBuild.E2.name, name: firstBuild.E2.name, type: 'CORE', levelReq: 0, description: firstBuild.E2.desc });
        }

        // Subclasses for this core
        const subKeys = Object.keys(TEMPLATE.subs[coreId] || {});

        const subChildren = subKeys.map(subId => {
            const subDef = TEMPLATE.subs[coreId][subId];

            // Find the cross class that belongs to this sub
            // Logic: find a cross in TEMPLATE.crosses[coreId] where core_sub_key matches (coreAff/subAff)
            const coreAff = coreDef.affinity.toLowerCase();
            const subAff = subDef.affinity.toLowerCase();
            const targetKey = `${coreAff}/${subAff}`;

            const crossEntries = Object.entries(TEMPLATE.crosses[coreId] || {});
            const foundCross = crossEntries.find(([_, cDef]) => cDef.core_sub_key === targetKey);

            const subSkills: Skill[] = [];
            let children: NodeData[] = [];

            if (foundCross) {
                const [crossId, crossDef] = foundCross;

                // Locate the build for (sub -> cross)
                const buildLabel = `${subId} -> ${crossId}`;
                const build = builds[buildLabel];

                if (build) {
                    // Sub skills (E3, E4)
                    if (build.E3) subSkills.push({ id: build.E3.name, name: build.E3.name, type: 'SUB', levelReq: 7, description: build.E3.desc });
                    if (build.E4) subSkills.push({ id: build.E4.name, name: build.E4.name, type: 'SUB', levelReq: 7, description: build.E4.desc });

                    // Cross skills (E5, E6)
                    const crossSkills: Skill[] = [];
                    if (build.E5) crossSkills.push({ id: build.E5.name, name: build.E5.name, type: 'CROSS', levelReq: 14, description: build.E5.desc });
                    if (build.E6) crossSkills.push({ id: build.E6.name, name: build.E6.name, type: 'CROSS', levelReq: 14, description: build.E6.desc });

                    // Mastery skills (E7)
                    const masterSkills: Skill[] = [];
                    if (build.E7) masterSkills.push({ id: build.E7.name, name: build.E7.name, type: 'ULTIMATE', levelReq: 21, description: build.E7.desc });

                    const masteryNode: NodeData = {
                        id: `master-${coreId}-${subId}`,
                        name: `${crossId} Mastery`,
                        affinity: Affinity.NULL,
                        type: 'CLASS_MASTER',
                        skills: masterSkills,
                        children: []
                    };

                    const crossNode: NodeData = {
                        id: `cross-${coreId}-${subId}`,
                        name: crossId,
                        affinity: Affinity.NULL,
                        type: 'CLASS_CROSS' as const,
                        skills: crossSkills,
                        children: [masteryNode]
                    };

                    children = [crossNode];
                }
            }

            return {
                id: `sub-${coreId}-${subId}`,
                name: subId,
                affinity: mapAffinity(subDef.affinity),
                type: 'CLASS_SUB' as const,
                skills: subSkills,
                children
            };
        });

        return {
            id: `core-${coreId}`,
            name: coreId,
            affinity: mapAffinity(coreDef.affinity),
            type: 'CLASS_CORE' as const,
            skills: coreSkills,
            children: subChildren
        };
    });
};
