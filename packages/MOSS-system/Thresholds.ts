export enum TensionBand {
    Stable,
    Uneasy,
    Vocal,
    Defiant,
    Critical
}

export function getTensionBand(t: number): TensionBand {
    const v = Math.abs(t);

    if (v < 20) return TensionBand.Stable;
    if (v < 40) return TensionBand.Uneasy;
    if (v < 60) return TensionBand.Vocal;
    if (v < 80) return TensionBand.Defiant;
    return TensionBand.Critical;
}
