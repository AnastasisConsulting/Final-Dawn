This official system specification defines the three decoupled core components of the **Final Dawn of Eideus** Affinity System. By separating structural geometry from temporal logic and external drivers, the system allows for the superimposition of multiple domains into a single addressable hypercube lattice.

---

### I. Fractal Template Specification (The Structure)

The Fractal Template defines the geometric hierarchy and addressable coordinate space of the simulation. It is invariant and domain-agnostic.

- **Atomic Unit (The Element):** The smallest addressable node in the lattice, representing a discrete responsibility or data point.
    
- **The Modifier (Axis):** A grouping of **7 Elements** forming a linear axis (X, Y, or Z). Each axis represents a specific role or department.
    
- **The Transform (Gizmo):** A 3D coordinate frame composed of **3 Modifiers** (X, Y, Z). One template consists of **3 Transforms**.
    
- **The Hypercube Lattice:**
    
    - **Dimensions**: $3 \times 3 \times 7 \times 3$ (Transforms $\times$ Modifiers $\times$ Elements $\times$ Superimposed States).
        
    - **Superimposition**: Up to 6 domains can be compressed into one addressable space by encoding different axes to increase vertically per state.
        
    - **Addressing**: Every node is reachable via a 4-dimensional coordinate: `[TransformID, AxisID, ElementID, StateID]`.
        

---

### II. Tick Logic Specification (The Engine)

The Tick Logic (TC Logic) defines the deterministic rules for state evolution across the lattice. It is hot-swappable and operates on the tensors provided by the Fractal Template.

- **The Three-Gear Churn**:
    
    - **Politics**: Drives Diplomacy.
        
    - **Diplomacy**: Drives Economy.
        
    - **Economy**: Drives Politics.
        
- **Inverse Pressure Invariant**: Civil Unrest must increase when the aggregate health of Politics, Economy, and Diplomacy decreases.
    
- **Recursive Propagation**:
    
    - **Bottom-Up**: Child element averages (e.g., Regional Unrest) drive parent modifiers (e.g., City Diplomacy).
        
    - **Top-Down**: Parent states act as weight modifiers for child delta calculations.
        
- **Temporal Differential (Tick Modifiers)**:
    
    - Update frequency is gated by the hierarchy level: Macro levels update slower (Modifier -3 to -1), while Micro levels update faster (Modifier +1 to +3).
        
    - Update Threshold Formula: `GlobalTick % (4 - LevelModifier) == 0`.
        

---

### III. Actuator Specification (The Driver)

The Actuator is a use-case-specific module that injects external pressure into the simulation. It is designed to be hot-swapped based on narrative or simulation needs.

- **Standard Relational Actuator**:
    
    - **Input**: Delta of the difference between Player/Companion relational scores: `(Player-Lyra - Player-Navbot) - (Navbot-Vizzy - Vizzy-Lyra)`.
        
    - **Output**: Injects a "Tensioner" value into the bottom-most Micro nodes (Regional Unrest) and the top-most Macro nodes (Intergalactic Diplomacy).
        
- **Actuator Interface**:
    
    - **Standardized Tensor Output**: Must return a delta tensor of shape `[3, 3, 7]` matching the target lattice dimensions.
        
    - **Hot-Swapping**: The simulation loop must accept any Actuator that fulfills the `CalculatePressure` contract, allowing for a shift from Player-driven logic to AI/Neural-driven optimization.
        
- **Constraints**:
    
    - Actuators must respect the `SPEED_MODIFIERS` of the target Fractal Template.
        
    - Actuators cannot bypass the **Affinity Table** weights (STR/INT/DEX) when applying pressure to entities.