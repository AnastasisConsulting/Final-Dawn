// PATH: src/services/ids/idValidator.ts
export function validateWorldIdFormat(id: string | undefined | null): { valid: boolean; error?: string } {
  if (!id) return { valid: false, error: "World ID is missing." };
  
  const regex = /^G(\d+)-S(\d+)-O(\d+)$/;
  const match = id.match(regex);
  
  if (!match) {
    return { valid: false, error: `ID "${id}" has invalid format. Expected Gx-Sy-Oz (e.g., G1-S1-O1).` };
  }
  
  const [_, gStr, sStr, oStr] = match;
  const g = parseInt(gStr, 10);
  const s = parseInt(sStr, 10);
  const o = parseInt(oStr, 10);
  
  if (g < 1 || g > 3) return { valid: false, error: `ID "${id}": Galaxy (G) must be 1-3.` };
  if (s < 1 || s > 3) return { valid: false, error: `ID "${id}": System (S) must be 1-3.` };
  if (o < 1 || o > 7) return { valid: false, error: `ID "${id}": Object (O) must be 1-7.` };
  
  return { valid: true };
}
