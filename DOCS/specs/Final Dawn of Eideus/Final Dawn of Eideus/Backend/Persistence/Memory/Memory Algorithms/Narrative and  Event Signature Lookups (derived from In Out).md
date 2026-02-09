  

## **Turn-Type Lookup**

- Query: “combat”, “dialogue”, “trade”, “travel”, “craft”, etc.
- Mechanism: classifier over x±
- Output: voxels of that class

## **Causal Delta Lookup**

- Query: “reputation decreased”, “faction hostility increased”, “inventory gained”
- Mechanism: search output face (x−) deltas
- Output: voxels where that delta occurred

  

## **Trigger-Like Lookup**

- Query: “first time landing”, “boss defeated”, “quest accepted”
- Mechanism: structured markers in x− or tags
- Output: event voxels + expansions

  

## **Goal/Quest Path Lookup**

- Query: quest id/path + index
- Output: all voxels attached to that quest progression