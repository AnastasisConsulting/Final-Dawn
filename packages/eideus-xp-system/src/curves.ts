// PATH: src/curves.ts
export class PiecewiseGeometricCurve {
  constructor(
    public readonly segSteps: number,
    public readonly r1: number,
    public readonly r2: number,
    public readonly r3: number
  ) {
    if (!(r1 > 1 && r2 > 1 && r3 > 1)) {
      throw new Error("All ratios must be > 1 (strictly increasing).");
    }
  }

  private shapeSteps(): [number[], number[], number[]] {
    const s1: number[] = [1.0];
    for (let i = 1; i < this.segSteps; i++) s1.push(s1[s1.length - 1] * this.r1);

    const s2: number[] = [s1[s1.length - 1] * this.r2];
    for (let i = 1; i < this.segSteps; i++) s2.push(s2[s2.length - 1] * this.r2);

    const s3: number[] = [s2[s2.length - 1] * this.r3];
    for (let i = 1; i < this.segSteps; i++) s3.push(s3[s3.length - 1] * this.r3);

    return [s1, s2, s3];
  }

  private static scaleSegment(seg: number[], targetSum: number): number[] {
    const s = seg.reduce((a, b) => a + b, 0);
    if (s <= 0) throw new Error("Segment sum must be positive.");
    const k = targetSum / s;
    return seg.map((x) => x * k);
  }

  build(segTotals: [number, number, number]): number[] {
    const [s1, s2, s3] = this.shapeSteps();
    const [t1, t2, t3] = segTotals;
    return [
      ...PiecewiseGeometricCurve.scaleSegment(s1, t1),
      ...PiecewiseGeometricCurve.scaleSegment(s2, t2),
      ...PiecewiseGeometricCurve.scaleSegment(s3, t3),
    ];
  }
}

export function enforceMonotonicIntSteps(steps: number[], total: number): number[] {
  const ints = steps.map((x) => Math.round(x));

  for (let i = 1; i < ints.length; i++) {
    if (ints[i] <= ints[i - 1]) ints[i] = ints[i - 1] + 1;
  }

  let diff = total - ints.reduce((a, b) => a + b, 0);
  if (diff === 0) return ints;

  const n = ints.length;
  let idx = n - 1;

  while (diff !== 0) {
    if (diff > 0) {
      ints[idx] += 1;
      diff -= 1;
    } else {
      const minAllowed = idx > 0 ? ints[idx - 1] + 1 : 0;
      if (ints[idx] - 1 >= minAllowed) {
        ints[idx] -= 1;
        diff += 1;
      }
    }
    idx -= 1;
    if (idx < 0) idx = n - 1;
  }

  const sum2 = ints.reduce((a, b) => a + b, 0);
  if (sum2 !== total) throw new Error("Failed to match exact total after adjustment.");
  for (let i = 1; i < ints.length; i++) {
    if (ints[i] <= ints[i - 1]) throw new Error("Monotonicity violated after adjustment.");
  }
  return ints;
}
