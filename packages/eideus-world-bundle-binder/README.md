# World Bundle Binder

Builds deterministic bindings between:
- lorebook.json
- sector_map.json
- quests.json
- source_seed.json

Outputs:
- nav_bindings.json
- entity_index.json
- quest_bindings.json
- bootstrap_voxels.json
- binder_meta.json

Run:
node dist/cli.js --lorebook "<path>" --sectorMap "<path>" --quests "<path>" --sourceSeed "<path>" --outDir "<out>"

Notes:
- Exact spatial keys are only emitted when an ID includes C/CT/R (NPC pattern).
- Leaders/governors get placeTag only (no guessed CT/R).
- Nodes bind by (civIndex,x,y); if no exact district match, bind to nearest district (deterministic) and tag bound:nearest.
