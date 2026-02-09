  

These return **coordinate candidates** (spatial keys, sometimes paired with time bounds).

  

## **Location Index Lookup**

- Query: keywords
- Index: Location Entity Index
- Output: `[g.s.o.c.ct.r]` candidates

  

## **Personage Index Lookup**

- Query: person name / alias / handle
- Index: Personage Entity Index
- Output: coordinates where that entity appears

  

## **Proper Noun (Thing) Index Lookup**

- Query: item/ship/place artifact name
- Index: ProperNouns Index
- Output: coordinates where mentioned/used/seen

  

## **Associative Tag Index Lookup**

- Query: tag(s)
- Index: AssociativeTags Index
- Output: coordinates where those tags occur (optionally tag-intersection)

  

## **Lore Key Lookup**

- Query: lorekey or lorekey prefix
- Index: LoreKey → Spatial map
- Output: all coordinates attached to that lore address

  

## **Entity-ID Lookup**

- Query: entity unique id (if you have them)
- Index: Entities registry
- Output: coordinates + temporal spans where the entity exists/acts

  

## **Entity-Class Lookup**

- Query: “governor”, “pirate”, “medic”, “augmented”, etc.
- Index: entity cards by class/type
- Output: coordinate clusters + pages