// packages/eideus-combat/src/d10.ts

export interface RollResult {
    dice: number[];
    successes: number;
    isBotch: boolean;
    difficulty: number;
}

/**
 * White Wolf style d10 roll.
 * successes = count(roll >= difficulty)
 * 10s count as 2 successes
 * 1s subtract 1 success
 * If successes < 0 and at least one '1' was rolled, it's a botch.
 */
export function rollD10Pool(poolSize: number, difficulty: number = 8): RollResult {
    if (poolSize <= 0) {
        return { dice: [], successes: 0, isBotch: false, difficulty };
    }

    const dice: number[] = [];
    for (let i = 0; i < poolSize; i++) {
        dice.push(Math.floor(Math.random() * 10) + 1);
    }

    let successes = 0;
    let onesCount = 0;

    dice.forEach(die => {
        if (die === 10) {
            successes += 2;
        } else if (die >= difficulty) {
            successes += 1;
        } else if (die === 1) {
            onesCount++;
        }
    });

    const netSuccesses = successes - onesCount;
    const isBotch = netSuccesses < 0 && onesCount > 0;

    return {
        dice,
        successes: Math.max(0, netSuccesses),
        isBotch,
        difficulty
    };
}
