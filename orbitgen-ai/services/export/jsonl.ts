// PATH: services/export/jsonl.ts

export function toJSONL(items: any[]): string {
  return items.map(item => JSON.stringify(item)).join('\n');
}
