// Deterministic layout generator for civ/city/loc per GSO ID.

type Locale = { id: string; name: string };
type City = { id: string; name: string; locales: Locale[] };
type Civ = { id: string; name: string; cities: City[] };
export type Layout = { seed: number; civs: Civ[] };

const storeKey = (gso: string) => `eideus.layout.${gso}`;

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
};

export const buildLayoutForGSO = (gso: string): Layout => {
  const key = storeKey(gso);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }

  const seed = Math.abs(hashString(gso));
  rng(seed); // currently unused, but could be leveraged for future randomness

  const civs: Civ[] = [];
  for (let c = 1; c <= 3; c++) {
    const cities: City[] = [];
    for (let ci = 1; ci <= 3; ci++) {
      const locales: Locale[] = [];
      for (let l = 1; l <= 7; l++) {
        locales.push({ id: `loc${l}`, name: `Locale ${l}` });
      }
      cities.push({ id: `city${ci}`, name: `City ${ci}`, locales });
    }
    civs.push({ id: `civ${c}`, name: `Civ ${c}`, cities });
  }

  const layout: Layout = { seed, civs };
  try {
    localStorage.setItem(key, JSON.stringify(layout));
  } catch {
    // ignore
  }
  return layout;
};

export const pickDefaultLocSeg = (layout: Layout): string | null => {
  const civ = layout.civs[0];
  const city = civ?.cities[0];
  const loc = city?.locales[0];
  if (!civ || !city || !loc) return null;
  return `${civ.id}.${city.id}.${loc.id}`;
};

const hashString = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
};
