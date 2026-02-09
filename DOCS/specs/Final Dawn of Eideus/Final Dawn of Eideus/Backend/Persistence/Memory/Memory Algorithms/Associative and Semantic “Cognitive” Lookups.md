  

## **Associative Jump**

- Entry: voxel
- Rule: follow one of its y− tags → retrieve other voxels sharing it

  

## **Tag-to-Embedding Bridge**

- Entry: tag result set
- Rule: rerank by y+ similarity to user intent

  

## **Embedding-to-Tag Bridge**

- Entry: embedding results
- Rule: extract dominant y− tags from top-k → expand by those tags

  

## **Concept Cluster Lookup**

- Query: semantic intent
- Rule: y+ top-k → cluster → return cluster centroids + representative voxels

  

## **Semantic Within Entity**

- Query: “about X” where X is entity
- Rule: entity timeline filtered/reranked by y+ similarity