export interface TurnPage {
  saga: string;
  book: string;
  chapter: string;
  page: number;
  objectKey?: string;
  coord?: { u: number; v: number };
  travelCount?: number;
  input?: string;
  outputSummary?: string;
  tags?: string[];
  timestamp: number;
}

const KEY = 'eideus.turnlog.v1';

export function appendTurn(page: TurnPage) {
  try {
    const raw = localStorage.getItem(KEY);
    const pages: TurnPage[] = raw ? JSON.parse(raw) : [];
    pages.push(page);
    localStorage.setItem(KEY, JSON.stringify(pages));
  } catch (err) {
    console.warn('Turn log append failed', err);
  }
}

export function loadTurns(): TurnPage[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
