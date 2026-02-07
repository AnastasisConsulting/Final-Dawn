
## 0) Core constants

- Level range: **L = 0..21**
    
- Total XP to reach L21:
    
![[Pasted image 20260131230627.png]]
- Fractal segmentation:
    
    - Segment A: L0→L7 (7 steps)
        
    - Segment B: L7→L14 (7 steps)
        
    - Segment C: L14→L21 (7 steps)
        

---

## 1) Piecewise “growth weight” allocation (fractal slope)

Allocate total progression budget across the three 7-step segments:

- Segment A weight = **0.2**
    
- Segment B weight = **0.3**
    
- Segment C weight = **0.5**
    

![[Pasted image 20260131230654.png]]

**NLP description:**  
“Leveling is intentionally front-light and back-heavy. Early levels are rapid onboarding. Mid levels slow slightly. Late levels require significant investment.”

---

## 2) Monotonic increasing XP-per-level requirement (convex/asymptotic)

### Rationale

Log curves flatten (diminishing). We require “XP needed always increases” and accelerates later → use convex scaling.

### ![[Pasted image 20260131230730.png]]

**NLP description:**  
“XP per level is shaped like an asymptotic ramp: each next level is harder than the last; late levels accelerate.”

---

## 3) Preferred piecewise convex progression (fast/drag/heavy)

To enforce “super quick 0–7, drag 7–14, heavy 14–21” while remaining monotonic:

Use **piecewise geometric ratios**:

- Segment A ratio r1r_1r1​ (gentle)
    
- Segment B ratio r2r_2r2​ (medium)
    
- Segment C ratio r3r_3r3​ (steep)
    

![[Pasted image 20260131230803.png]]
    

**NLP description:**  
“Early leveling is fast (small XP jumps). Mid leveling slows (moderate jumps). Late leveling becomes heavy (large accelerating jumps).”

---

## 4) Example XP-to-next table (piecewise convex reference)

(This is one validated monotonic table that sums to 63,000 exactly.)

| Reach Level | XP needed from previous | Total XP to reach level |
| ----------- | ----------------------- | ----------------------- |
| 1           | 1351                    | 1351                    |
| 2           | 1405                    | 2756                    |
| 3           | 1462                    | 4218                    |
| 4           | 1520                    | 5738                    |
| 5           | 1581                    | 7319                    |
| 6           | 1644                    | 8963                    |
| 7           | 1710                    | 10673                   |
| 8           | 1847                    | 12520                   |
| 9           | 1994                    | 14514                   |
| 10          | 2154                    | 16668                   |
| 11          | 2326                    | 18994                   |
| 12          | 2513                    | 21507                   |
| 13          | 2714                    | 24221                   |
| 14          | 2931                    | 27152                   |
| 15          | 3341                    | 30493                   |
| 16          | 3809                    | 34302                   |
| 17          | 4343                    | 38645                   |
| 18          | 4951                    | 43596                   |
| 19          | 5642                    | 49234                   |
| 20          | 6432                    | 55666                   |
| 21          | 7334                    | 63000                   |

**NLP description:**  
“XP-to-next is strictly increasing. Players blaze through early onboarding, take longer in midgame, and grind noticeably in the final segment.”

---

## 5) Enemy XP system (RANGE-BASED, 3 tiers)

We do **not** store exact XP totals per enemy.  
We store **tier-based XP ranges** derived from a base XP value.

![[Pasted image 20260131230837.png]]
(i.e., XP needed to go from level L→L+1)

Alternative acceptable base:

- BaseXP from world/chapter difficulty instead of level curve.
    

### Tier scalars (fractal)

Use exactly:

- Tier 1: **0.2**
    
- Tier 2: **0.3**
    
- Tier 3: **0.5**
    
- Legendary: **0.0**
    

![[Pasted image 20260131230907.png]]
    

![[Pasted image 20260131230929.png]]

**NLP description:**  
“Enemies do not grant fixed XP. They grant XP within a range determined by difficulty tier. XP tier weights mirror the global 0.2/0.3/0.5 progression geometry. This keeps bestiary authoring fast and balance consistent.”

---

## 6) Mapping bestiary tiers → XP tiers

Bestiary labels may include:

- Fodder / Common / Uncommon / Strong / Elite / Legendary
    

Compress into 3 XP tiers:

- XP Tier 1 (0.2): **Fodder + Common**
    
- XP Tier 2 (0.3): **Uncommon + Strong**
    
- XP Tier 3 (0.5): **Elite**
    
- Legendary: **0 XP** (loot/flags)
    

**NLP description:**  
“Bestiary tiers remain detailed for combat/spawn logic, but XP tiers are compressed into three normalized brackets for systemic balance.”

---

## 7) Legendary reward rule (no XP)

Legendary enemies grant:

- `XP = 0`
    
- reward via:
    
    - unique items
        
    - unlock flags
        
    - quest progression tokens
        
    - lore keys
        
    - crafting components
        

**NLP description:**  
“Legendary encounters are not XP farms. They are narrative/loot milestones.”