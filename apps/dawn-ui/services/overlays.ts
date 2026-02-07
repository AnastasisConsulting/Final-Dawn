// Lightweight overlay loader for browser/Vite builds using import.meta.glob.
// Pulls deepest-level object JSONs (excluding system_beastiary) from Galaxies_Folder.

export interface Overlay {
  objectKey: string; // e.g., G1-S2-O7
  name: string;
  path: string;
  data: any;
}

const modules = import.meta.glob('../../Galaxies_Folder/**/*.json', { eager: true }) as Record<string, any>;

function isObjectFile(p: string): boolean {
  return !p.includes('system_beastiary.json');
}

function extractObjectKey(data: any, filePath: string): string {
  if (data?.Object_Key) return data.Object_Key;
  // Fallback: derive from path segments if available (Gx-Sx-Ox pattern)
  const match = filePath.match(/G\\d-S\\d-O\\d/i) || filePath.match(/(G\\d-?S\\d-?O\\d)/i);
  return match ? match[0] : filePath;
}

export function loadOverlays(): Overlay[] {
  return Object.entries(modules)
    .filter(([p]) => isObjectFile(p))
    .map(([p, mod]) => {
      const data = (mod as any).default ?? mod;
      return {
        objectKey: extractObjectKey(data, p).replace(/_/g, '-'),
        name: data?.Object_Name || data?.name || p.split('/').pop() || 'Unknown',
        path: p,
        data,
      } as Overlay;
    });
}

export function pickOverlayForGalaxy(galaxyIndex: number): Overlay | undefined {
  const overlays = loadOverlays();
  const prefix = `G${galaxyIndex}-`;
  return overlays.find(o => o.objectKey.startsWith(prefix)) || overlays[0];
}

export function getOverlayByObjectKey(objectKey: string): Overlay | undefined {
  const overlays = loadOverlays();
  return overlays.find(o => o.objectKey === objectKey);
}
