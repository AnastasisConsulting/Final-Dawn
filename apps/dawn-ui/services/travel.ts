export interface TravelCounter {
  [objectKey: string]: number;
}

const KEY = 'eideus.travelCounts';

export function loadTravelCounts(): TravelCounter {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTravelCounts(counts: TravelCounter) {
  try {
    localStorage.setItem(KEY, JSON.stringify(counts));
  } catch {
    // ignore
  }
}

export function bumpTravel(counts: TravelCounter, objectKey: string): TravelCounter {
  const next = { ...counts, [objectKey]: (counts[objectKey] || 0) + 1 };
  saveTravelCounts(next);
  return next;
}
