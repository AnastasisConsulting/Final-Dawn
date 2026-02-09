# Eideus Dawn Class System

**Last Updated:** 2026-02-06

---

## ⚔️ Affinity Matrix

|         | **STR** | **INT** | **DEX** |
|---------|---------|---------|---------|
| **Rebel**   | +1 | -1 | 0 |
| **Acolyte** | 0 | +1 | -1 |
| **Hacker**  | -1 | 0 | +1 |

---

## 🎭 Core Classes

### A. Rebel
*Disgruntled citizen looking to make some changes*

**Primary Affinity:** STR (+1)  
**Weakness:** INT (-1)  
**Neutral:** DEX (0)

**Playstyle:** Direct action, combat-focused, revolutionary

---

### B. Acolyte
*An augment seeking induction into the ranks of the Church of the Ascension*

**Primary Affinity:** INT (+1)  
**Weakness:** DEX (-1)  
**Neutral:** STR (0)

**Playstyle:** Tech-augmented, faith-based, transhumanist

---

### C. Hacker
*A systems specialist who gets off on the fact no doors are going to hold their secrets long if they want to peek inside*

**Primary Affinity:** DEX (+1)  
**Weakness:** STR (-1)  
**Neutral:** INT (0)

**Playstyle:** Infiltration, information gathering, systems exploitation

---

## 📈 Class Progression Tree

```
CORE CLASS → SUB-CLASS → CROSS-CLASS → MASTERY
```

---

## 🔀 Sub-Classes

### A. Rebel Sub-Classes

| Sub-Class | Description |
|-----------|-------------|
| **Merc** | A freelance Rebel fighter for hire. Set out for fame and fortune |
| **Specialist** | A highly specialized Rebel fighter who has settled into a niche slot on a team of Rebel insurgents |
| **Recruit** | A prospect rebel for an unnamed insurgency ring that has been recruited for special assignments |

---

### B. Acolyte Sub-Classes

| Sub-Class | Description |
|-----------|-------------|
| **Convert** | An Acolyte that has been initiated into the technocracy's Church of Ascension |
| **Priest** | A lifelong member of the Church of Ascension who has progressed through the ranks to achieve the title of a Priest |
| **Parishioner** | A valuable preferential member of the flock of the Church of Ascension |

---

### C. Hacker Sub-Classes

| Sub-Class | Description |
|-----------|-------------|
| **Insurgent** | A specialized tech support agent for the local insurgency |
| **Zealot** | An extremely passionate Hacker who is more extremist than insurgent. Has their own agenda although will partner up if it aligns with the current goals |
| **Cipher** | An encryption expert who works for the bureaucracy. A "good guy" by their own estimation and would be considered an ethical hacker |

---

## ⚡ Cross-Classes

### A. Rebel Cross-Classes

| Cross-Class | Description |
|-------------|-------------|
| **Soldier of Fortune** | A famous, well-paid, eagerly sought after mercenary rebel |
| **False Prophet** | An apostate priest from the Church of Ascension who has been branded a false prophet by the leadership |
| **Sleeper Cell** | A Rebel/Recruit who has now earned enough trust and progressed far enough in their training to become a Sleeper Cell |

---

### B. Acolyte Cross-Classes

| Cross-Class | Description |
|-------------|-------------|
| **The Un-made** | A disillusioned rebel warrior turned acolyte for the Church of Ascension. An Un-made has rejected his duty to the church and been excommunicated from the flocks of the augmented. Doomed to wandering the universe alone without the significant benefits the church offers to those who submit and spread the message of transhumanistic enlightenment |
| **True Believer** | An Acolyte of the Church of Ascension who became a priest. Serving the church faithfully has now become a senior member and donned the status of a True Believer |
| **Cyber Heretic** | A hacker turned acolyte who, after many years of faithful service, has had a falling out with the church over reasons now only known to them and has been labeled a Cyber Heretic by the Church of Ascension and a bounty placed on their heads |

---

### C. Hacker Cross-Classes

| Cross-Class | Description |
|-------------|-------------|
| **Hacktivist** | A very political and bold hacker who loves rallies and protests and the occasional destruction of corporate property |
| **Null Apostle** | A high ranking member of the Church of Ascension who has been isolated from the flock and tasked with monitoring the congregations for the leadership. A covert surveillance and operations expert |
| **Cryptocrat** | A hacker who was recruited by the "9"—the elite group of star system cartel overlords—who has been targeted for assimilation into the army of the Prophet, one of 3 leaders of the self-proclaimed "Free Galaxies" and a pure AI construct. Although none of the 3 or the 9 have revealed this to the citizens of the Free Galaxies |

---

## 🏆 Mastery Classes

The final evolution of each progression path (Unlock at Level 21):

| Core | Path | Mastery Title |
|------|------|---------------|
| **Rebel** | STR (Merc) | **Legend** |
| **Rebel** | INT (Specialist) | **Iconoclast** |
| **Rebel** | DEX (Recruit) | **Awakened** |
| **Acolyte** | STR (Convert) | **Void Walker** |
| **Acolyte** | INT (Priest) | **High Pontiff** |
| **Acolyte** | DEX (Parishioner) | **System Breaker** |
| **Hacker** | STR (Insurgent) | **Revolutionary** |
| **Hacker** | INT (Zealot) | **Null Entity** |
| **Hacker** | DEX (Cipher) | **Shadow Ruler** |

---

## 📊 Class ID Format

Classes are encoded in entity IDs using the following pattern:

```
G#-S#-O#-C#-CT#-R#-NPC
         │
         └── Class info embedded in character card
```

**Example Character Card:**
```json
{
  "id": "G1-S1-O7-C2-CT2-R4-NPC",
  "name": "Zara Vex",
  "role": "Subordinate",
  "title": "Sleeper Cell Operative",
  "character_card": {
    "system_prompt": "[ROLE: Subordinate] [TITLE: Sleeper Cell Operative]...",
    "traits": ["Paranoid", "Resourceful", "Double-Agent"],
    "class": "Rebel",
    "sub_class": "Recruit",
    "cross_class": "Sleeper Cell",
    "affinity": "STR"
  }
}
```

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `packages/eideus-ollama-orchestrator/src/npc/npc.types.ts` | NPC Profile types |
| `DOCS/lorebook.json` | Character definitions |
| `DOCS/COMMAND_REFERENCE.md` | Command reference |
