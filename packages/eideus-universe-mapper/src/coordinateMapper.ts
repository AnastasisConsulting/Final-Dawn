const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const hashStringToUint32 = (input: string): number => {
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
};

export const CoordinateMapper = {
  /**
   * Returns a deterministic 0-1 RNG that stays stable per world identifier.
   */
  createSeededRng(worldId: string): () => number {
    const seed = hashStringToUint32(worldId || 'eideus');
    return mulberry32(seed || 1);
  }
};
