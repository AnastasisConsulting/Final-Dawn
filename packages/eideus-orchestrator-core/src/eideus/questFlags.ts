export function renderQuestFlags(flags?: Record<string, boolean | string | number>): string {
  if (!flags) return "QUEST FLAGS: (none provided)";

  const entries = Object.entries(flags)
    .filter(([k]) => k.startsWith("q:") || k.startsWith("quest_") || k.includes("quest"))
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (entries.length === 0) return "QUEST FLAGS: (none set)";

  const lines: string[] = ["=== QUEST FLAGS (authoritative) ==="];
  for (const [k, v] of entries.slice(0, 80)) {
    lines.push(`- ${k} = ${String(v)}`);
  }
  if (entries.length > 80) lines.push(`- ... (${entries.length - 80} more)`);
  return lines.join("\n");
}

