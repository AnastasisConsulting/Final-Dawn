// path: /Docs/Specs/AffinitySystem_v2_Official.md

**Status:** Canonical / Internal Only
**Audience:** Engine, simulation, LLM orchestration, tooling
**Do Not Publish**

---

## 0. Design Intent (Authoritative)
The Affinity System in *Final Dawn of Eideus* is a top-down/bottom-up simulation of the universe. It is a "Three-Gear" system (Politics, Economy, Civil Unrest) driven by a tri-polar affinity matrix (STR, INT, DEX).

## 1. Core State Model: The Three Gears
Every entity `E` (from Inhabitant to Galaxy) carries a state vector representing the three gears of the simulation:

1.  **Politics (P):** Drives Diplomacy.
2.  **Economy (E):** Drives Politics.
3.  **Civil Unrest (U):** Drives Economy (Micro) and Diplomacy (Macro).

### 1.1 The Affinity Driver (STR / INT / DEX)
Every person, place, and system is assigned a core **Affinity Type**. Interactions between entities are modified by the **Affinity Table**:

| Attacker \ Defender | STR | INT | DEX |
| :--- | :---: | :---: | :---: |
| **STR** | +1 | 0 | -1 |
| **INT** | -1 | +1 | 0 |
| **DEX** | 0 | -1 | +1 |

*Note: These values act as weights for the simulation's relational scores and gear-churn speed.*



---

## 2. Hierarchy & Scale (The 3x3x7 Drill Down)
The simulation operates across two primary domains, each containing three layers, each containing seven sub-objects (where applicable).

### 2.1 MACRO Scale
1.  **Inter-galactic:** (3 Galaxies)
2.  **Inter-stellar:** (3 Star Systems)
3.  **Planetary:** (7 Planetary Objects)

### 2.2 MICRO Scale
1.  **Globally:** (3 Civilizations - contains citizens/regional inhabitants)
2.  **Civically:** (3 Cities - contains inhabitants)
3.  **Regionally:** (7 Regions - contains inhabitants)

---

## 3. The Churn: Gear Coupling Logic
The simulation moves through the hierarchy via the following causal chain:

* **Regional Unrest** → drives → **City Diplomacy**
* **City Diplomacy** → drives → **City Economy**
* **City Economy** → drives → **Civilizational Politics**
* **Civilizational Politics** → drives → **Civilizational Unrest**
* **Civilizational Unrest** → drives → **Interplanetary Diplomacy**
* **Interplanetary Diplomacy** → drives → **Interplanetary Economy**
* **Interplanetary Economy** → drives → **Interplanetary Politics**
* **Interplanetary Politics** → drives → **Interplanetary Unrest**
* **Interplanetary Unrest** → drives → **Interstellar Diplomacy**
* **... (Recursive up to Intergalactic Diplomacy)**

> **The Ultimate Actuator:** Intergalactic Diplomacy is tied to the **Actuator** (see Section 5).

---

## 4. Tick Model & Scale Modifiers
To simulate the "slower turn" of larger cosmic wheels, a **Tick Modifier** is applied to the update frequency.

| Level | Scale | Tick Modifier | Update Frequency |
| :--- | :--- | :---: | :--- |
| **Inter-galactic** | Macro | -3 | Slower |
| **Inter-stellar** | Macro | -2 | |
| **Interplanetary** | Macro | -1 | |
| **Planetary** | Macro | 0 | Baseline |
| **Civilizational** | Micro | +1 | |
| **Cities** | Micro | +2 | |
| **Regions/Inhabitants** | Micro | +3 | Faster |

---

## 5. The Actuators (Player Influence)
The "Tensioner" of the entire simulation is derived from the **Relational Scores** between the Player and the core cast: **Lyra, Navbot, and Vizzy.**

**Calculation:**
$$Modifier = \Delta(Player, Lyra) - \Delta(Navbot, Vizzy)$$

This modifier acts as the direct input for:
1.  **Regional Public Unrest** (The bottom-most anchor)
2.  **Intergalactic Diplomacy** (The top-most anchor)

---

## 6. Invariants (Must Never Break)
1.  **Relational Weights:** Use relational scores between supporting cast to modify simulation weights.
2.  **Affinity Consistency:** A "STR" civilization must always interact with an "INT" star system using the -1 modifier.
3.  **Deterministic Churn:** Macro levels cannot update until the required number of Micro ticks have passed (per Section 4).
4.  **Observer Silence:** The exact numerical values of the $3 \times 3 \times 7$ grid are never shown to the player—only the narrative "feel" of the Politics, Economy, and Unrest.

---

## 7. Canonical Summary
> **Affinity is a top-down/bottom-up gear system where STR/INT/DEX relationships and Player/Companion relational deltas drive a recursive simulation from the smallest regional inhabitant to the intergalactic void.**