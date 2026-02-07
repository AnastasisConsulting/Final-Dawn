# Eideus Universe Mapper (Galaxies_Folder → Spatial Keys)

This utility turns your on-disk universe tree into deterministic `[gX.sX.oX.cX.ctX.rX]` coordinates.

## Rule (matches your description)

- `g` = galaxy folder index (lexicographic)
- `s` = star system folder index within a galaxy (lexicographic)
- `o` = planetary object folder index within a star system (lexicographic)
- `c/ct/r` are *not* inferred here; they are applied later by on-world civ/city/region templates.
  - So the planetary object root address is emitted as `c=0, ct=0, r=0`.

## Usage (Windows)

1) Build
- `npm i`
- `npm run build`

2) Generate a map
- `node dist/cli.js --root "C:\Users\user\Desktop\to_map\Eideus_Merger\Eideus_Merger\Galaxies_Folder" --out "C:\Users\user\Desktop\to_map\universe.map.json" --expectedObjectsPerSystem 7`

If a system does not have exactly 7 objects, you’ll get warnings, but mapping still proceeds.

## Why lexicographic?
Because it’s deterministic across machines and doesn’t depend on creation times.

If you later want “authoritative order” instead of name-sort, we can switch to reading per-system `source_seed.json` or a manifest file and make that the ordering source.
