  

## **Entity Timeline**

- Input: entity id/name
- Output: all voxels containing entity, ordered by temporal key

  

## **Entity Local Timeline**

- Input: entity + location prefix
- Output: entity voxels within that place

  

## **Entity Encounter Window**

- Input: entity + a specific encounter voxel
- Output: that voxel ±3 pages + any neighboring voxels where entity persists

  

## **Co-Presence Graph**

- Input: entity A
- Output: entities most often co-occurring with A + example voxels

  

## **First Seen / Last Seen**

- Input: entity
- Output: earliest voxel, latest voxel

  

## **Entity Migration Trace**

- Input: entity
- Output: ordered list of spatial coordinates over time (movement path)