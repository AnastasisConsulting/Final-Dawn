# Eideus Dawn XP System (TypeScript)

Implements:

- Levels: 0..21 (21 level-up steps)
- Total XP to reach level 21: 63,000
- 7/7/7 segments: 0–7, 7–14, 14–21
- Segment weights: 0.2 / 0.3 / 0.5
- XP-to-next is strictly increasing (monotonic)
- Enemy XP is range-based using tier weights 0.2 / 0.3 / 0.5
- Legendary enemies grant 0 XP (reward via items/flags)

## Install

```bash
npm install
npm run build
```

## CLI

Generate XP tables:

```bash
npx eideus-xp table --out xp_table.json
```

Enemy XP ranges at a level:

```bash
npx eideus-xp enemy-xp --level 12 --out enemy_xp_ranges.json
```
