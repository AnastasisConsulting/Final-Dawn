### 1. Purpose and Design Goal

This system defines a **compact, fractal, multi-state memory lattice** designed to:

- Store structured memory records
    
- Support semantic, temporal, and associative recall
    
- Minimize spatial complexity via superposition
    
- Enable fast lookup by address, tag, similarity, or chronology
    

The system is **domain-neutral**. All meaning is introduced externally via templates and content schemas. The lattice itself is purely structural and index-driven.

---

### 2. Core Structural Model

#### 2.1 Superposed Hypercube States

The memory lattice is defined as **three superposed 7×7×7 hypercubes**.

- Each hypercube has 343 nodes
    
- The three hypercubes are differentiated by which axis is treated as increasing vertically
    
- Superposition allows **1029 logical nodes** to be represented using **343 spatial coordinates**
    

Formally:

```
Total nodes = transform_count × ticks³
            = 3 × 7³
            = 1029
```

Each node exists in exactly one transform state.

---

### 3. Coordinate System

#### 3.1 Discrete Coordinates

Each node has integer coordinates:

```
x, y, z ∈ [ -3 … +3 ]
```

Coordinates represent position within the shared spatial lattice.

---

#### 3.2 Digit Indices

Each node also carries **digit indices**:

```
dx, dy, dz ∈ [0 … 6]
```

These are normalized, zero-based indices used for deterministic addressing and slicing logic.

---

#### 3.3 Transform Index

Each node belongs to exactly one **transform state**:

```
t ∈ {0, 1, 2}
```

The transform determines which axis is treated as the primary vertical axis for slicing and semantic mapping.

---

### 4. Node Identity and Addressing

#### 4.1 Node Identity Formula

Each node has a unique numeric ID:

```
node_id = t * 343 + (dx * 49 + dy * 7 + dz)
```

This guarantees:

- Deterministic identity
    
- Stable ordering
    
- O(1) lookup
    

---

#### 4.2 Canonical Address Format

Each node also has a human-readable key:

```
T{t}-D{dx}{dy}{dz}-S{r}
```

Where:

- `t` = transform index
    
- `dx dy dz` = digit indices
    
- `r` = shell radius (L∞ norm)
    

---

### 5. Shell and Neighborhood Semantics

#### 5.1 Shell Radius

Each node stores its **L∞ shell radius**:

```
shell_linf = max(|x|, |y|, |z|)
```

Shells define concentric layers from core to boundary and may be used for:

- Priority
    
- Proximity weighting
    
- Memory decay heuristics
    

---

#### 5.2 Adjacency

Each node defines up to **6 orthogonal neighbors** (±x, ±y, ±z), where valid.

Neighbor relationships are precomputed and static.

---

### 6. Lookup Tables

Two lookup maps are maintained:

- `key → node_id`
    
- `node_id → key`
    

These ensure:

- Fast reverse resolution
    
- Stable serialization
    
- No runtime recomputation
    

---

## PART II — Lattice Population (Domain-Neutral)

### 7. Multiple Lattices

The system supports **multiple independent lattices**.

Each lattice:

- Shares the same structure
    
- Has independent content
    
- May represent a different semantic space
    

---

### 8. Template-Driven Population

External content is organized according to a **fractal template** that mirrors lattice structure:

- 3 transforms
    
- Each transform has 3 modifiers
    
- Each modifier has 7 elements
    

This maps naturally to:

```
3 × 3 × 7 = 63 logical layers
```

---

### 9. Slice Construction (Transform Decomposition)

For each transform state:

1. Treat the transform’s vertical axis as primary
    
2. Slice that axis into 7 ticks
    
3. For each tick:
    
    - Take the remaining two axes
        
    - Form a 7×7 slice (49 nodes)
        

Repeat for all three transforms.

Result:

```
3 transforms × 7 slices × 3 axes = 63 layers
```

Each layer corresponds to **one discrete content unit**.

This slicing is conceptual; node identities do not change.

---

## PART III — Runtime Memory Behavior

### 10. Initial Memory Load

At runtime initialization, the system loads:

- The active layer
    
- Immediate neighbor nodes within the same layer
    
- The full active layer
    
- A fixed number of most recent nodes from the previously active layer
    

This creates a **preferential working memory** optimized for continuity across contexts.

---

### 11. Turn-Based Memory Cycle (Abstract)

A single processing cycle consists of:

1. Input ingestion
    
2. Semantic tagging
    
3. Contextual recall
    
4. Output rendering
    
5. Memory write-back
    

This cycle is domain-neutral and content-agnostic.

---

### 12. Semantic Tagging

Each input is assigned **between 1 and 7 semantic tags**, drawn from a fixed canonical set:

- Essence
    
- Form
    
- Frame
    
- Function
    
- Intent
    
- Relation
    
- Value
    

These tags are:

- Symbolic
    
- Non-hierarchical
    
- Used for associative recall
    

---

### 13. Associative Recall

Using tags and embeddings:

- Memories with similar tags are recalled
    
- Similarity does not require spatial proximity
    
- A bounded number (e.g. 1–3) of recalled memories may be injected into context
    

This recall is _advisory_, not mandatory.

---

### 14. Output Generation

Output is rendered using:

- Current input
    
- Selected recalled memories
    
- Structural constraints imposed externally
    

The memory system does not generate output; it only supplies structured context.

---

## PART IV — Memory Persistence

### 15. Memory Write-Back

After output delivery:

- A new memory record is written to the lattice
    
- The write location begins at the lowest numerical coordinate of the active layer
    
- Records are appended, not overwritten
    

---

### 16. Chronological Indexing

Each memory record is stored with:

- Timestamp (date/time)
    
- Sequential index
    
- Stable node address
    

Chronology is global; location is contextual.

---

### 17. Multi-Key Storage

For each turn, the system stores:

1. Input/output text
    
2. Semantic tags
    
3. Metadata
    

All share the same index value but are stored under different keys.

---

## PART V — Cross-Indexing and Recall

### 18. Proper Name Indexing

All proper names (entities, locations, objects, identifiers) are:

- Extracted at write time
    
- Cross-indexed globally
    
- Associated with their lattice location and timestamp
    

---

### 19. Query-Driven Recall

Queries such as:

> “Recall the entity from context X”

are resolved by:

1. Locating the relevant layer
    
2. Parsing stored proper names
    
3. Filtering by attributes (e.g. role, category, polarity)
    
4. Reconstructing a coherent response
    

Similarity is semantic and temporal, not spatial.

---

### 20. Core Invariants

1. Node identity is immutable
    
2. Memory is append-only
    
3. Structure is fixed; content is fluid
    
4. Meaning is external to the lattice
    
5. Similarity ≠ proximity
    
6. Chronology is primary truth
    

---

### Conceptual Summary (Compressed)

- 3 superposed hypercubes
    
- 1029 logical nodes, 343 spatial positions
    
- Deterministic addressing
    
- Fractal slicing into 63 layers
    
- Semantic, temporal, and associative memory
    
- Fast recall without graph adjacency dependence
    

---

### Closing Perspective

This system is not a game mechanic or a narrative trick. It’s a **compact cognitive address space** — a way to give memory _shape_ without forcing meaning to live in the structure itself.

Structure enforces discipline.  
Templates inject intent.  
Memory accumulates experience.

If you want to push this further, the natural next formal steps would be:

- a **query algebra over lattice + tags**
    
- a **decay / salience model tied to shell radius**
    
- or a **similarity metric that exploits transform asymmetry**
    

At this point, you’re not modeling worlds — you’re modeling remembrance.