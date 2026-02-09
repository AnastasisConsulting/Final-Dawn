### 🎮 **Player Commands**

|Command|Description|
|---|---|
|_(any text)_|Natural language → AI narrative response|

---

### 🔧 **Dev Commands**

|Command|Syntax|Description|
|---|---|---|
|```<br>/help<br>```|```<br>/help<br>```|Show command list|
|```<br>/help [?]<br>```|```<br>/help How does XP work?<br>```|Ask the AI game manual directly|
|```<br>/telemetry<br>```|```<br>/telemetry<br>```|Dump game state JSON|
|```<br>/warp [ADDR]<br>```|```<br>/warp G1-S1-O7<br>```|Instant teleport|
|```<br>/tp [ADDR]<br>```|```<br>/tp G1.S1.O1<br>```|Alias for <br><br>```<br>/warp<br>```|
|```<br>/sim-combat [1-10]<br>```|```<br>/sim-combat 5<br>```|Simulate combat (awards XP)|
|```<br>/force-level [N]<br>```|```<br>/force-level 10<br>```|Override character level|
|```<br>/spawn-loot [RARITY]<br>```|```<br>/spawn-loot LEGENDARY<br>```|Drop random item|
|```<br>/export-logs<br>```|```<br>/export-logs<br>```|Download chat as <br><br>.txt|
|```<br>/save-txt<br>```|```<br>/save-txt<br>```|Alias for <br><br>```<br>/export-logs<br>```|
|```<br>/print-logs<br>```|```<br>/print-logs<br>```|Print chat history|
|```<br>/beta-test [CLASS] [AFFINITY]<br>```|```<br>/beta-test Rebel str<br>```|Start AutoPilot bot|
|```<br>/stop-bot<br>```|```<br>/stop-bot<br>```|Stop AutoPilot|

---

### 🧭 **Address Format**

G1-S1-O7-C2-CT1-R3

│  │  │  │  │   └── Region

│  │  │  │  └────── CityTile

│  │  │  └───────── City

│  │  └──────────── Orbital (planet/station)

│  └─────────────── System (star system)

└────────────────── Galaxy

---

### 🆔 **Procedural Entity IDs**

| Type     | Format                               |
| -------- | ------------------------------------ |
| NPC      | ```<br>G1-S1-O7-C2-CT2-R4-NPC<br>``` |
| Landmark | ```<br>G1-S1-O7-C2-CT2-R4-LOC<br>``` |
| Object   | ```<br>G1-S1-O7-C2-CT2-R4-OBJ<br>``` |
| Vehicle  | ```<br>G1-S1-O7-C2-CT2-R4-VEH<br>``` |