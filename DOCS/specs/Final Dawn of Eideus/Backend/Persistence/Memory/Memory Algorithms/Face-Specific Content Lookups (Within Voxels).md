  

These search the **faces themselves**, either at a location or globally.

# X Faces: I/O

## **Input-Face Keyword Search (x+)**

- Query: text keywords
- Scope: global or spatial subtree
- Output: voxel coordinates ranked by match

## **Output-Face Keyword Search (x−)**

### **Input/Output Combined Keyword Search (x±)**

### **I/O Pattern Lookup**

- Query: structured pattern (“attack → flee”, “trade → dispute”, etc.)
- Output: voxels where that transition signature appears

# Y Faces: Embeddings + Tags

## **Embedding Similarity Search (y+)**

- Query: embedding of user intent
- Output: voxel coordinates by cosine similarity (top-k)

## **Embedding Search Constrained to Location**

- Query: embedding + `[g.s.o...]` prefix
- Output: top-k within that spatial scope

## **Embedding Search Constrained to Time**

- Query: embedding + `[s.b.c...]` bounds
- Output: top-k within that temporal scope

## **Tag Keyword Search (y−)**

### **Tag Intersection Lookup**

- Query: tags A ∩ B ∩ C
- Output: voxels that contain all tags

### **Tag Union Lookup**

- Query: tags A ∪ B ∪ C
- Output: voxels containing any

### **Tag Exclusion Lookup**

- Query: include A, exclude B
- Output: voxels containing A but not B

### **Tag Co-occurrence Lookup**

- Query: “what tags commonly appear with X?”
- Output: ranked tags + pointers to representative voxels

# Z Faces: Entities + Lore

## **Entities Face Search (z+)**

- Query: entity name/type/id
- Output: voxels containing matching entity cards

### **Entities Relationship Lookup**

- Query: entity A + entity B
- Output: voxels where both appear (co-presence)

## **Lore Face Lookup (z−)**

- Query: lorekey exact or prefix
- Output: voxels referencing that lore address

### **Lore-to-Entity Join**

- Query: lorekey → which entities most present here?
- Output: entity list + voxel pointers