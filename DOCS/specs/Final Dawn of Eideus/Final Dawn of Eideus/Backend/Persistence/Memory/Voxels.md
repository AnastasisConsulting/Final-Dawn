| Face   | Content                 | Example                                                          |
| ------ | ----------------------- | ---------------------------------------------------------------- |
| **x+** | Player input            | "I examine the console"                                          |
| **x-** | Narration output        | LLM's response                                                   |
| **y+** | Embeddings              | ```<br>[0.12, -0.33, ...]<br>```                                 |
| **y-** | Tags                    | ```<br>["console", "terminal", "hack"]<br>```                    |
| **z+** | **NPCs (EntityCard[])** | ```<br>[{id: "G1-S1-O7-C2-CT2-R4-NPC", name: "Dr. Voss"}]<br>``` |
| **z-** | **LoreContext**         | ```<br>{loreKey: "xenon_scar", landmarks: [...]}<br>```          |
