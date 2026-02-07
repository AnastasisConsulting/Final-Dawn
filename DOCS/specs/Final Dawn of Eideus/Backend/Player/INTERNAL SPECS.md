

**Subsystem:** Character Progression + XP Economy + Bestiary + Flight-One Integration  
**Status:** Canonical / Internal Only  
**Audience:** Engine, Simulation, Content Tools, LLM orchestration  
**Do Not Publish**

---

## 0) Core Design Intent (Authoritative)

This progression system must:

1. Support **4-phase identity growth** (Core → Sub → Cross → Mastery).
    
2. Enforce a **strict XP economy**:
    
    - no infinite leveling via farming
        
    - deterministic replay stability
        
    - predictable tuning knobs
        
3. Integrate a **3D arcade space fighter** (Flight-One) as a major XP source without destabilizing leveling.
    
4. Scale content across the universe with **fractal invariants** (3×3×7 logic).
    

---


    

---

## 3) XP Ladder (Level 1–21)

### 3.1 Level XP Table

The following leveling curve is canonical:

- Total XP to reach **Level 21 = 63,000**
    
- XP per level increases non-linearly; progression is intentionally:
    
    - fast early
        
    - slower midgame
        
    - slowest late
        

(Use the table exactly as provided in your internal docs.)

### 3.2 Era Pacing Confirmation

The curve matches the eras:

- 0–7: fast ramp
    
- 7–14: slower
    
- 14–21: slowest
    

---

## 4) Quest XP Economy (Story)

### 4.1 Story Quest Count / Total

**49 story quests**, strictly increasing awards, total XP:

- Story total = **31,500** (exact)
    

### 4.2 Segmentation Scalars

Quests are split into thirds:

- Quests 1–16: scalar **0.2** (segment total 6,109)
    
- Quests 17–32: scalar **0.3** (segment total 9,164)
    
- Quests 33–49: scalar **0.5** (segment total 16,227)
    

**Audit requirement:** totals must match exactly.

---

## 5) Combat XP Economy (Non-story)

### 5.1 50/50 Split Rule

Total XP required to hit 21 is 63,000.

**XP source policy:**

- **50% Story XP** = 31,500
    
- **50% Combat/Side XP** = 31,500
    

Therefore story completion alone lands the player around ~Level 15; remaining levels are earned through combat systems (world + flight).

---

## 6) XP Budget Ledger System (Anti-Farm Core Mechanic)

### 6.1 3-Level Grouping

Levels 1–21 are split into **7 groups** of **3 levels each**.

Each group `g` has:

- `ΔXP_g` = XP required to clear those 3 levels
    

### 6.2 Combat Budget per Group

For each group:

- `CombatBudget_g = 0.5 * ΔXP_g`
    

This budget is the **total allowed XP from combat/side content** for that group.

### 6.3 Split into On-World vs Space Flight

Combat budget is divided evenly between:

- `WorldBudget_g = 0.5 * CombatBudget_g`
    
- `FlightBudget_g = 0.5 * CombatBudget_g`
    

**Invariant:** Flight-One cannot exceed its ledger cap for the group.

---

## 7) Combat Tier Distribution (Inside Each Budget)

### 7.1 Tier Weights

Each mode budget (WorldBudget_g and FlightBudget_g) is divided into tiers:

- Tier 1 (Common): **2/10 = 0.2**
    
- Tier 2 (Medium): **3/10 = 0.3**
    
- Tier 3 (Hard): **5/10 = 0.5**
    
- Tier 4 (Legendary): **0 XP** (loot/flags only)
    

So for mode budget `MBudget_g`:

- `Tier1Budget = 0.2 * MBudget_g`
    
- `Tier2Budget = 0.3 * MBudget_g`
    
- `Tier3Budget = 0.5 * MBudget_g`
    

---

## 8) Enemy-Type Budgeting (Per Tier)

### 8.1 “10 enemy types” rule

Each tier budget is subdivided into **10 enemy types**:

- `EnemyTypeBudget = TierBudget / 10`
    

### 8.2 “10 kills per enemy type” completion rule

Each enemy type is designed such that:

- player needs to defeat **10** of that type to consume its allocated XP
    
- meaning:
    

`XP_per_kill(enemyType) = EnemyTypeBudget / 10`

### 8.3 Budget Caps

Each “bucket” hard-caps:

Bucket key:  
`(group g, mode ∈ {WORLD, FLIGHT}, tier ∈ {T1,T2,T3}, enemyTypeId)`

Once:  
`xpEarned[bucket] >= xpCap[bucket]`

then XP is no longer granted from that bucket, except under null-factor rules.

---

## 9) Null-Factor XP (Post-cap Farming Suppression)

### 9.1 Intent

Any farming beyond the allocated XP ledger must become **inconsequential**.

### 9.2 Null Factor Rule

When a bucket cap is reached, apply:

`xpAward = xpAward * nullFactor`

Where:

- `nullFactor` is extremely small (recommended: **0.001 to 0.01**)
    
- result should effectively be “near-zero”
    
- allow loot + difficulty scaling to remain rewarding
    

### 9.3 Behavior Requirement

- “Inconsequential XP” must be consistent and deterministic.
    
- Players cannot bypass via relog, seed cycling, etc.
    

---

## 10) Enemy XP Tier Table (Reference Ranges)

Use these tier ranges as conceptual averages/spreads:

- Common avg 200 ±25 → [175..225]
    
- Medium avg 300 ±50 → [250..350]
    
- Hard avg 500 ±75 → [425..575]
    
- Legendary: 0 XP
    

**But note:** Under the ledger system, the _final XP per kill_ becomes budget-derived, not purely tier-range derived. Tier ranges can be used as “flavor variance,” but the ledger governs totals.

---

## 11) Star-System Bestiary Specs (Unique Per System)

### 11.1 Requirement

**Every star system owns a unique bestiary file**, themed + keyed to that system.

### 11.2 Canonical Structure (Fractal)

Each star system bestiary contains:

- **1 Legendary**
    
- **3 Archetypes × 7 Variants** (21 enemies)
    
- **3 Rares**
    
- **1 Master Loot Table**
    

This structure is canonical and repeated across all 9 star systems.

### 11.3 Example (Aura-507)

Aura-507 bestiary defines:

- `system_id: "G1-S1"`
    
- theme: radiation/industrial decay/mutation
    
- Legendary boss: The Isotope King
    
- 3 archetypes: Beasts/Constructs/Humanoids with 7 variants each
    
- Rares and loot table
    

---

## 12) Flight-One Encounter System (Between Worlds)

### 12.1 Encounter Ladder

Space flight has exactly:

1. **Common spawns** (waves)
    
2. **Elite spawns** (spikes)
    
3. **Boss-level spawn** (capstone)
    

### 12.2 Escalation Mechanic

The longer the player remains between worlds:

- spawn rate increases
    
- enemy difficulty increases
    
- pressure increases (risk)
    

### 12.3 XP Hard Cap Integration

Flight XP is restricted by the **FlightBudget_g** ledger.

**Critical invariant:**  
Flight difficulty can rise indefinitely, but **XP payout cannot**.

### 12.4 Spawn Pools Bound to Star System

Flight spawn selection must be pulled from the current star system’s bestiary (by `system_id`).

Tier mapping recommendation:

- Common spawns: system tiers `Fodder/Common/Uncommon`
    
- Elite spawns: system tier `Elite`
    
- Boss spawn:
    
    - either a “flight boss” composed from elite templates, OR
        
    - the system Legendary (recommended: very rare / quest-gated, 0 XP)
        

---

## 13) Determinism Requirements

### 13.1 Deterministic XP award selection

If any randomness remains inside a tier range, award must be deterministic using a seed hash:

`seed = hash(sagaKey + encounterSeed + enemyId + groupIndex + mode + tier)`

### 13.2 Replay invariance

Same saga + same encounter sequence must produce:

- same spawns
    
- same XP outcomes
    
- same loot rolls (unless loot is intentionally non-deterministic)
    

---

## 14) Canonical Data Objects (Engine Contract)

### 14.1 XP Ledger Object

Per saga:

```ts
XpLedger = {
  sagaKey: string,
  groupIndex: 1..7,
  buckets: {
    [bucketKey: string]: {
      cap: number,
      earned: number,
      nullFactorApplied: boolean
    }
  }
}
```

Bucket key format:  
`G{g}|{MODE}|{TIER}|{ENEMYTYPE}`

### 14.2 Star System Bestiary Object

See `system_beastiary.json` example for Aura-507

---

## 15) Non-negotiable Invariants (Summary)

1. Level 21 total XP = **63,000**
    
2. Story XP = **31,500** total (49 quests)
    
3. Combat XP = **31,500** total
    
4. Combat XP is ledgered by 3-level groups (7 groups)
    
5. Combat budgets split: world 50% / flight 50%
    
6. Tier weights: 20/30/50
    
7. Legendary XP = 0
    
8. Enemy-type distribution: 10 types per tier, 10 kills each
    
9. Post-cap XP reduced by null factor to inconsequential
    

---

