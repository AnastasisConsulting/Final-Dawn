  

# Given an entry voxel (same time unless stated):

## **2D Neighbor Lookup (4-neighbor)**

- N/S/E/W on the map plane

  

## **2D Neighbor Lookup (8-neighbor)**

- includes diagonals (if you allow it; still implied by grid logic)

  

## **3D Sparse Neighbor Lookup (6-neighbor)**

- ±X, ±Y, ±Z adjacencies

  

## **3D Full Neighbor Lookup (26-neighbor)**

- Moore neighborhood in 3D

  

## **Multi-Ring Spatial Expansion**

- Rule: k-hop BFS over 4/6/26 neighbors

  

## **Spatial Prefix Expansion**

- Rule: expand from region → city → civ → object → system → galaxy
- Output: “nearby by hierarchy” rather than grid adjacency