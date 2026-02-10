import { Affinity } from "./types";

export type FactionType = "CORP" | "REBEL" | "NET";

export class AffinityMatrix {
    // 3-Way Rock Paper Scissors:
    // CORP beats REBEL (Order crushes Chaos)
    // REBEL beats NET (Chaos disrupts Flow)
    // NET beats CORP (Flow outmaneuvers Order)
    private static matrix: Record<FactionType, Record<FactionType, number>> = {
        CORP: { CORP: 1.0, REBEL: 1.0, NET: 0.1 }, // Corp hates Net (0.1), Crushes Rebel
        REBEL: { CORP: 0.1, REBEL: 1.0, NET: 1.0 }, // Rebel hates Corp (0.1)
        NET: { CORP: 1.0, REBEL: 0.1, NET: 1.0 }  // Net hates Rebel (0.1)
    };

    /**
     * Resolves the affinity modifier between two factions.
     * @returns Multiplier (0.0 - 2.0)
     */
    static resolve(source: FactionType, target: FactionType): number {
        return this.matrix[source]?.[target] ?? 1.0;
    }

    /**
     * Maps player stats (STR/INT/DEX) to Factions.
     */
    static mapStatToFaction(stat: Affinity): FactionType {
        switch (stat) {
            case 'str': return 'CORP';
            case 'int': return 'NET';
            case 'dex': return 'REBEL';
            default: return 'CORP';
        }
    }
}
