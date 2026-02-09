
---

**Project:** Final Dawn of Eideus  
**Subsystem:** Fractal Memory Visualization (Memory-Viz)

### 1. Purpose and Scope

The Memory-Viz system is a deterministic, navigable visualization and indexing structure for all in-world memories across galaxies, star systems, planets, civilizations, regions, and temporal events.

It presents memory as a **fractal, recursive 7×7×7 hypercubic structure** with controlled superposition and axis-dependent semantic meaning. The visualization is not decorative; it is a direct projection of the underlying memory index.

The system must support:

- Superposition and separation of recursive layers
    
- Axis-dependent semantic remapping
    
- Lossless navigation from macro (galaxies) to micro (single memory event)
    
- Stable voxel addressing across all scales
    

---

### 2. Top-Level Structure

#### 2.1 Root Hypercube

The root object is a **7×7×7 hypercube**, referred to as the **Unified Memory Cube (UMC)**.

- The UMC represents _Eideus Dawn as a whole_.
    
- It exists in a **superposed state** containing **three recursive child hypercubes**.
    
- These child hypercubes occupy the same spatial volume until explicitly separated.
    

Formally:

```
UMC = { H₀, H₁, H₂ }  // superposed
```

Each `Hₙ` is itself a 7×7×7 hypercube with identical internal structure.

---

### 3. Recursive Hypercubes (Galaxies)

#### 3.1 Galaxy Separation

Activating **Expand Layers** transitions the system from superposition to separation:

- The three recursive hypercubes are visually separated along a **designated vertical axis**.
    
- Each separated hypercube corresponds to **one galaxy**.
    

```
H₀ → Galaxy 0
H₁ → Galaxy 1
H₂ → Galaxy 2
```

No data transformation occurs during separation; this is a pure visual/state transition.

---

### 4. Axis Semantics Within a Galaxy

Each galaxy hypercube reinterprets its internal axes semantically.

#### 4.1 Axis Assignment

Within a galaxy cube:

- X-axis → Star System A
    
- Y-axis → Star System B
    
- Z-axis → Star System C
    

All three axes are treated as **simultaneously vertical for slicing purposes**. This is a semantic verticality, not a geometric one.

---

### 5. Slicing Model

#### 5.1 Primary Slices (Planets)

Each axis is sliced into 7 discrete layers.

- Each slice along an axis represents **one planetary object** within that star system.
    
- Total planetary slices per galaxy:
    

```
3 axes × 7 slices = 21 planetary slices
```

These slices exist in **superposition across axes**, meaning a single visual slice represents the intersection of:

- One X-axis slice
    
- One Y-axis slice
    
- One Z-axis slice
    

---

### 6. Civilization Layers

#### 6.1 Layer Multiplicity

Each planetary slice contains **three internal layers**, also superposed.

- Each layer corresponds to **one civilization** present on that planet.
    
- Civilization layers are orthogonal to axis slicing and do not alter slice position.
    

```
Planet Slice → { Civ₀, Civ₁, Civ₂ }
```

Selecting a civilization layer resolves the superposition and exposes the civilization’s surface map.

---

### 7. Civilization Surface Map

#### 7.1 Sector Grid

Each civilization layer reveals a **7×7 2D grid**, defined externally in `sector_map.json`.

This grid represents:

- 3 cities per civilization
    
- Each city containing 7 regions
    

The mapping from grid cell → city → region is deterministic and data-driven.

Each grid cell corresponds to a **single voxel address** within the larger hypercubic structure.

---

### 8. Voxel Resolution and Memory Storage

#### 8.1 Voxel Definition

A voxel is the smallest addressable spatial unit in the Memory-Viz system.

A voxel uniquely represents:

- Galaxy
    
- Star system
    
- Planet
    
- Civilization
    
- City
    
- Region
    

#### 8.2 Memory Indexing

Each voxel contains an **indexed list of memory records**, ordered strictly by time.

Memories are addressed using a **temporal key sequence**:

```
sX.bX.cX.pX
```

Where:

- `sX` = star system index
    
- `bX` = planetary body index
    
- `cX` = civilization index
    
- `pX` = temporal position (monotonic, sequential)
    

The list is append-only. No reordering is permitted.

---

### 9. Navigation Contract

The visualization must guarantee the following invariant:

> Any visual selection path corresponds to exactly one and only one voxel address and memory list.

Transitions (expand, slice, layer select, grid select) are **state-revealing**, not state-mutating.

No operation may:

- Duplicate memory records
    
- Collapse distinct voxels
    
- Alter temporal ordering
    

---

### 10. Conceptual Model Summary

In compressed form:

- One universe
    
- Three galaxies (recursive hypercubes)
    
- Three star systems per galaxy (axes)
    
- Seven planets per star system (slices)
    
- Three civilizations per planet (layers)
    
- Seven by seven regions per civilization (surface grid)
    
- One voxel per region
    
- One ordered memory list per voxel
    

The structure is fractal, but the indexing is absolute.

---

This spec treats your system the way physics treats spacetime: strange, layered, but brutally consistent. It should be stable enough to drive rendering, storage, and tooling without re-interpretation drift.

If you want, the next natural step is a **formal coordinate schema** (single tuple representation that collapses all of this into one address) or a **render-state machine** that defines allowed transitions without ambiguity.