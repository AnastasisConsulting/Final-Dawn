// cognition-engine.ts
// Fully working reference implementation

// ==============================
// 1. Core Types
// ==============================

type ArcName =
  | "essence"
  | "form"
  | "action"
  | "frame"
  | "intent"
  | "relation"
  | "value";

interface ArcInput {
  name: ArcName;
  text: string;
  magnitude: number;
}

interface TriadScore {
  coherence: number;  // -3..3
  polarity: number;   // -3..3
  alignment: number;  // -3..3
}

interface ModifierElement {
  arc: ArcName;
  semanticElement: string;
}

interface Modifier {
  elements: ModifierElement[];
}

interface Phase {
  modifiers: Modifier[];
}

interface VerticalTemplate {
  phases: Phase[];
}

interface PillarResult {
  phaseIndex: number;
  pillarIndex: number;
  score: number;
}

interface ArcComputation {
  arc: ArcName;
  rawSum: number;
  magnitude: number;
  finalScore: number;
  pillarResults: PillarResult[];
}

interface ArcTag {
  arc: ArcName;
  polarity: -1 | 0 | 1;
}

interface MemoryVector {
  arc: ArcName;
  triadicVector: number[];
  rawSum: number;
  polarity: -1 | 0 | 1;
}

interface EngineOutput {
  rankedArcs: ArcComputation[];
  tags: ArcTag[];
  memory: MemoryVector[];
}

// ==============================
// 2. Utilities
// ==============================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function collapseTriad(triad: TriadScore): number {
  const sum = triad.coherence + triad.polarity + triad.alignment;
  return clamp(sum, -3, 3);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// ==============================
// 3. Heuristic Arc Decomposition
// ==============================

function decomposeInput(input: string): ArcInput[] {
  const tokens = tokenize(input);
  const totalTokens = tokens.length || 1;

  const arcKeywords: Record<ArcName, string[]> = {
    essence: ["is", "are", "being", "exist", "identity"],
    form: ["shape", "structure", "design", "pattern", "format"],
    action: ["do", "act", "run", "build", "make", "create"],
    frame: ["context", "environment", "world", "system", "time"],
    intent: ["want", "goal", "purpose", "aim", "intend"],
    relation: ["between", "with", "connect", "relate", "link"],
    value: ["good", "bad", "better", "worse", "important", "worth"],
  };

  const arcs: ArcInput[] = Object.keys(arcKeywords).map(key => {
    const name = key as ArcName;
    const matches = tokens.filter(t =>
      arcKeywords[name].some(k => t.includes(k))
    );
    const magnitude = Math.round((matches.length / totalTokens) * 10);
    return {
      name,
      text: input,
      magnitude,
    };
  });

  return arcs;
}

// ==============================
// 4. Vertical Template Instance
// ==============================

const ARC_LIST: ArcName[] = [
  "essence",
  "form",
  "action",
  "frame",
  "intent",
  "relation",
  "value",
];

function createTemplate(): VerticalTemplate {
  const phases: Phase[] = [];

  for (let p = 0; p < 3; p++) {
    const modifiers: Modifier[] = [];
    for (let m = 0; m < 3; m++) {
      const elements: ModifierElement[] = ARC_LIST.map(arc => ({
        arc,
        semanticElement: `${arc}_phase${p}_pillar${m}`,
      }));
      modifiers.push({ elements });
    }
    phases.push({ modifiers });
  }

  return { phases };
}

// ==============================
// 5. Working Triad Evaluator
// ==============================

function triadEvaluator(
  arcText: string,
  semanticElement: string,
  phaseIndex: number,
  pillarIndex: number
): TriadScore {
  const tokens = tokenize(arcText);

  const coherence =
    tokens.length > 5 ? 1 : -1;

  const polarity =
    arcText.includes("not") || arcText.includes("bad")
      ? -1
      : 1;

  const alignment =
    semanticElement.includes("value") && arcText.includes("important")
      ? 2
      : 0;

  return {
    coherence: clamp(coherence, -3, 3),
    polarity: clamp(polarity, -3, 3),
    alignment: clamp(alignment, -3, 3),
  };
}

// ==============================
// 6. Arc Evaluation
// ==============================

function evaluateArc(
  arc: ArcInput,
  template: VerticalTemplate
): ArcComputation {
  let rawSum = 0;
  const pillarResults: PillarResult[] = [];

  template.phases.forEach((phase, phaseIndex) => {
    phase.modifiers.forEach((modifier, pillarIndex) => {
      const element = modifier.elements.find(e => e.arc === arc.name);
      if (!element) return;

      const triad = triadEvaluator(
        arc.text,
        element.semanticElement,
        phaseIndex,
        pillarIndex
      );

      const collapsed = collapseTriad(triad);
      rawSum += collapsed;

      pillarResults.push({
        phaseIndex,
        pillarIndex,
        score: collapsed,
      });
    });
  });

  const finalScore =
    rawSum >= 0
      ? rawSum + arc.magnitude
      : rawSum - arc.magnitude;

  return {
    arc: arc.name,
    rawSum,
    magnitude: arc.magnitude,
    finalScore,
    pillarResults,
  };
}

// ==============================
// 7. Engine Orchestrator
// ==============================

export function runFullPass(input: string): EngineOutput {
  const arcs = decomposeInput(input);
  const template = createTemplate();

  const computations = arcs.map(arc =>
    evaluateArc(arc, template)
  );

  const ranked = computations.sort(
    (a, b) => b.finalScore - a.finalScore
  );

  const tags: ArcTag[] = ranked.map(r => ({
    arc: r.arc,
    polarity:
      r.rawSum > 0
        ? 1
        : r.rawSum < 0
        ? -1
        : 0,
  }));

  const memory: MemoryVector[] = ranked.map(r => ({
    arc: r.arc,
    triadicVector: r.pillarResults.map(p => p.score),
    rawSum: r.rawSum,
    polarity:
      r.rawSum > 0
        ? 1
        : r.rawSum < 0
        ? -1
        : 0,
  }));

  return {
    rankedArcs: ranked,
    tags,
    memory,
  };
}

// ==============================
// 8. Example Usage
// ==============================

if (require.main === module) {
  const result = runFullPass(
    "I want to build a system that is important and better than others"
  );

  console.log(JSON.stringify(result, null, 2));
}
