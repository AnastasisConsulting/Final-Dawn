export type SpatialComponents = {
  galaxy: number;
  system: number;
  object: number;
  civilization?: number;
  city?: number;
  region?: number;
};

export class AddressUtil {
  /**
   * Parses a standard registry key (G1-S1-O1) or a memory key (g1.s1.o1.c0.ct0.r0).
   */
  static parse(key: string): SpatialComponents | null {
    if (!key) return null;

    // Try Registry Format: G1-S1-O1
    if (key.includes('-')) {
      const parts = key.split('-');
      const g = parseInt(parts[0]?.substring(1) || '0');
      const s = parseInt(parts[1]?.substring(1) || '0');
      const o = parseInt(parts[2]?.substring(1) || '0');
      if (g && s && o) return { galaxy: g, system: s, object: o };
    }

    // Try Memory Dot Format: g1.s1.o1...
    if (key.includes('.')) {
      // simplified regex matching
      const g = key.match(/g(\d+)/i)?.[1];
      const s = key.match(/s(\d+)/i)?.[1];
      const o = key.match(/o(\d+)/i)?.[1];

      if (g && s && o) {
        return {
          galaxy: parseInt(g),
          system: parseInt(s),
          object: parseInt(o),
          civilization: parseInt(key.match(/c(\d+)/i)?.[1] || '0'),
          city: parseInt(key.match(/ct(\d+)/i)?.[1] || '0'),
          region: parseInt(key.match(/r(\d+)/i)?.[1] || '0'),
        };
      }
    }

    return null;
  }

  /**
   * Returns a clean Registry Key (G1-S1-O1) from any valid input.
   */
  static toRegistryKey(key: string | SpatialComponents): string {
    const p = typeof key === 'string' ? AddressUtil.parse(key) : key;
    if (!p) return 'G0-S0-O0';
    return `G${p.galaxy}-S${p.system}-O${p.object}`;
  }

  /**
   * Returns a Memory Spatial Key (g1.s1.o1.c0.ct0.r0).
   */
  static toMemoryKey(key: string | SpatialComponents): string {
    const p = typeof key === 'string' ? AddressUtil.parse(key) : key;
    if (!p) return 'g0.s0.o0.c0.ct0.r0';
    return `g${p.galaxy}.s${p.system}.o${p.object}.c${p.civilization || 0}.ct${p.city || 0}.r${p.region || 0}`;
  }

  /**
   * Updates the "local" resolution of an address.
   * If input is G1-S1-O1 and localId is "Bridge", ideally this maps to a sub-coordinate.
   * For now, it returns a UI-friendly string representation.
   */
  static updateLocal(full: string, localId: string): string {
    const reg = AddressUtil.toRegistryKey(full);
    if (!localId) return reg;
    return `${reg}::${localId}`;
  }
}
