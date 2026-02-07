  

## **Face Integrity Read**

- Verify voxel has all required faces populated (x+, x−, y+, y−, z+, z−)

  

## **Index Backtrace**

- Input: a voxel id
- Output: all index entries that point to it (who/what indexes think it is)

## **Index Drift Detection**

- Query: entity/tag points to voxel but voxel missing corresponding face entry
- Output: inconsistencies

## **Determinism Audit Window**

- Input: voxel + replay seed/tick reference (if you store it)
- Output: compare expected x− vs stored x−