# **Temporal Window (Standard)**

## Rule: entry voxel ±3 pages

- Output: up to 7 voxels

  

## **Temporal Window (Configurable)**

- Rule: ±N pages

  

## **Chapter Window**

- Rule: all pages within `[s.b.c.*]`

## **Session-to-Session Window**

- Rule: `[s.b.c-1.*] + [s.b.c.*] + [s.b.c+1.*]`

  

## **Book Window**

- Rule: `[s.b.*.*]` bounded by world/book

  

## **Saga Window**

- Rule: all memories in `[s.*.*.*]`

  

## **Time-First then Spatial Filter**

- Rule: pick time window → filter by coordinate prefix or entity presence