## **Direct Voxel Read**

- Input: exact `[g.s.o.c.ct.r] + [s.b.c.p]`
- Output: the single voxel + all 6 faces

  

## **Direct Spatial Slice**

- Input: exact `[g.s.o.c.ct.r]` (no time)
- Output: _all_ pages at that location (optionally filtered by saga/book/chapter)

  

## **Direct Temporal Slice**

- Input: exact `[s.b.c.p]` (no location)
- Output: voxel(s) at that time across locations (usually bounded to saga + book)

  

## **Range Read (Temporal)**

- Input: `[s.b.c.p0…pN]` or `[s.b.c0…cN.*]`
- Output: ordered voxel list

  

## **Range Read (Spatial Hierarchy)**

- Input: prefix keys like:
- `gX.*`
- `gX.sX.*`
- `gX.sX.oX.*`
- `gX.sX.oX.cX.*`
- `gX.sX.oX.cX.ctX.*`
- Output: all voxels under that subtree (time-filter optional)

  

## **Latest-at-Location**

- Input: `[g.s.o.c.ct.r]`
- Output: newest voxel(s) at that location (by max temporal key)

  

## **First-at-Location**

- Input: `[g.s.o.c.ct.r]`
- Output: oldest voxel(s) at that location