// src/world/rng.ts
// Deterministic hashing + RNG utilities (xorshift32) for PCG.

export function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 0x6d2b79f5; // avoid stuck state
  }

  // xorshift32
  nextU32(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state;
  }

  float01(): number {
    return this.nextU32() / 0xffffffff;
  }

  int(minIncl: number, maxIncl: number): number {
    if (!Number.isInteger(minIncl) || !Number.isInteger(maxIncl) || maxIncl < minIncl) {
      throw new Error(`Invalid int range: ${minIncl}..${maxIncl}`);
    }
    const span = maxIncl - minIncl + 1;
    const v = this.nextU32() % span;
    return minIncl + v;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('pick() on empty array');
    return arr[this.int(0, arr.length - 1)];
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  chance(p: number): boolean {
    if (!(p >= 0 && p <= 1)) throw new Error(`chance() p must be 0..1, got ${p}`);
    return this.float01() < p;
  }
}

export function seededRng(worldSeed: string, key: string): RNG {
  return new RNG(fnv1a32(`${worldSeed}|${key}`));
}
