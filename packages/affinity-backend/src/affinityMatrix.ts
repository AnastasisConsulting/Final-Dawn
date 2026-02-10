
import { Affinity } from "./types.js";

export const affinityMatrix: Record<Affinity, Record<Affinity, number>> = {
  str: { str: 1, int: 0, dex: -1 },
  int: { str: -1, int: 1, dex: 0 },
  dex: { str: 0, int: -1, dex: 1 }
};
