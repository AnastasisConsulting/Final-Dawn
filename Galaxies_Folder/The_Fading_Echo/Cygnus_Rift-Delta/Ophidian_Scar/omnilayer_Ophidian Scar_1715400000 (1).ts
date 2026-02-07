import type { DeepCandidate } from './types';

export const world: DeepCandidate = {
  "candidateVersion": 1,
  "worldId": "9f4d4a3e-6b7c-4d2a-8f1e-3a9b8c7d6e5f",
  "seedKey": "Ophidian Scar",
  "locKey": "OPH_SCAR_CYGNUS",
  "generatedAt": 1715400000,
  "influenceKernel": {
    "metric": "CHEBYSHEV",
    "radius": 2,
    "weightsByDist": [
      1,
      0.6,
      0.2
    ]
  },
  "crossWorldPolicy": {
    "mode": "SAME_COORD_OTHER_WORLD",
    "bleedRateByRoleClass": {
      "WORLD_LEADER": 0.15,
      "FACTION_LEADER": 0.08,
      "QUEST": 0.02
    },
    "perTickBleedClamp": 0.05,
    "noFeedbackLoops": true
  },
  "designMemo": {
    "tone": "Gritty, Industrial, Volatile",
    "themes": [
      "Hazardous ruins",
      "Energy anomalies",
      "Forbidden technology"
    ],
    "notes": "The world is built upon the Cygnus Rift-Delta. The industrial complex is a graveyard of machinery where corporations once played god with rift energy."
  },
  "worldRefs": {
    "registryId": "REG_CYGNUS_DELTA_01",
    "civs": [
      {
        "civId": "CIV_SYND",
        "name": "Cobalt Syndicate",
        "type": "Scavenger Hegemony",
        "leaderNpcId": "WL_01"
      },
      {
        "civId": "CIV_LOGIC",
        "name": "The Logic Purge",
        "type": "AI Remnant Protocol",
        "leaderNpcId": "WL_02"
      },
      {
        "civId": "CIV_KIN",
        "name": "The Rift-Kin",
        "type": "Mutant Tribal Coalition",
        "leaderNpcId": "WL_03"
      }
    ],
    "majorConflicts": [
      {
        "id": "CON_01",
        "title": "The Resource Reclamation War"
      },
      {
        "id": "CON_02",
        "title": "The Mainframe Incursion"
      }
    ]
  },
  "meso": {
    "size": 7,
    "layout": [
      {
        "u": 2,
        "v": 1,
        "type": "MAJOR_NODE",
        "refId": "M_01"
      },
      {
        "u": 1,
        "v": 2,
        "type": "MAJOR_NODE",
        "refId": "M_02"
      },
      {
        "u": 2,
        "v": 2,
        "type": "MAJOR_NODE",
        "refId": "M_03"
      },
      {
        "u": 4,
        "v": 4,
        "type": "MAJOR_NODE",
        "refId": "M_04"
      },
      {
        "u": 5,
        "v": 4,
        "type": "MAJOR_NODE",
        "refId": "M_05"
      },
      {
        "u": 4,
        "v": 5,
        "type": "MAJOR_NODE",
        "refId": "M_06"
      },
      {
        "u": 6,
        "v": 6,
        "type": "MAJOR_NODE",
        "refId": "M_07"
      },
      {
        "u": 6,
        "v": 1,
        "type": "MAJOR_NODE",
        "refId": "M_08"
      },
      {
        "u": 1,
        "v": 6,
        "type": "MAJOR_NODE",
        "refId": "M_09"
      }
    ],
    "regions": [
      {
        "id": "REG_01",
        "name": "The Scrap Wastes",
        "civId": "CIV_SYND",
        "description": "A dense graveyard of rusted skyscrapers and assembly plants."
      },
      {
        "id": "REG_02",
        "name": "The Silicon Abyss",
        "civId": "CIV_LOGIC",
        "description": "Humming server farms and cold, sterile testing grounds."
      },
      {
        "id": "REG_03",
        "name": "The Chitinous Scar",
        "civId": "CIV_KIN",
        "description": "Jagged ridges where the biology has fused with machine energy."
      }
    ],
    "nodes": {
      "majors": [
        {
          "id": "M_01",
          "civId": "CIV_SYND",
          "name": "Rust-Haven",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "leaderNpcId": "FL_01",
          "catalystConfig": {
            "candidates": [
              "WL_01",
              "FL_01"
            ],
            "pickSalt": "CAT_V1_M_01"
          },
          "ties": {
            "alliances": [
              "M_02"
            ],
            "conflicts": [
              "M_04"
            ]
          }
        },
        {
          "id": "M_02",
          "civId": "CIV_SYND",
          "name": "Sector Zero",
          "coord": {
            "u": 1,
            "v": 2
          },
          "coordKey": "LocKey:(1,2)",
          "leaderNpcId": "FL_02",
          "catalystConfig": {
            "candidates": [
              "WL_01",
              "FL_02"
            ],
            "pickSalt": "CAT_V1_M_02"
          }
        },
        {
          "id": "M_03",
          "civId": "CIV_SYND",
          "name": "Welders' Grip",
          "coord": {
            "u": 2,
            "v": 2
          },
          "coordKey": "LocKey:(2,2)",
          "leaderNpcId": "FL_03",
          "catalystConfig": {
            "candidates": [
              "WL_01",
              "FL_03"
            ],
            "pickSalt": "CAT_V1_M_03"
          }
        },
        {
          "id": "M_04",
          "civId": "CIV_LOGIC",
          "name": "Mainframe Core",
          "coord": {
            "u": 4,
            "v": 4
          },
          "coordKey": "LocKey:(4,4)",
          "leaderNpcId": "FL_04",
          "catalystConfig": {
            "candidates": [
              "WL_02",
              "FL_04"
            ],
            "pickSalt": "CAT_V1_M_04"
          }
        },
        {
          "id": "M_05",
          "civId": "CIV_LOGIC",
          "name": "Buffer Zone",
          "coord": {
            "u": 5,
            "v": 4
          },
          "coordKey": "LocKey:(5,4)",
          "leaderNpcId": "FL_05",
          "catalystConfig": {
            "candidates": [
              "WL_02",
              "FL_05"
            ],
            "pickSalt": "CAT_V1_M_05"
          }
        },
        {
          "id": "M_06",
          "civId": "CIV_LOGIC",
          "name": "Logic Node Gamma",
          "coord": {
            "u": 4,
            "v": 5
          },
          "coordKey": "LocKey:(4,5)",
          "leaderNpcId": "FL_06",
          "catalystConfig": {
            "candidates": [
              "WL_02",
              "FL_06"
            ],
            "pickSalt": "CAT_V1_M_06"
          }
        },
        {
          "id": "M_07",
          "civId": "CIV_KIN",
          "name": "Jagged Ridge",
          "coord": {
            "u": 6,
            "v": 6
          },
          "coordKey": "LocKey:(6,6)",
          "leaderNpcId": "FL_07",
          "catalystConfig": {
            "candidates": [
              "WL_03",
              "FL_07"
            ],
            "pickSalt": "CAT_V1_M_07"
          }
        },
        {
          "id": "M_08",
          "civId": "CIV_KIN",
          "name": "Sinkhole Sanctum",
          "coord": {
            "u": 6,
            "v": 1
          },
          "coordKey": "LocKey:(6,1)",
          "leaderNpcId": "FL_08",
          "catalystConfig": {
            "candidates": [
              "WL_03",
              "FL_08"
            ],
            "pickSalt": "CAT_V1_M_08"
          }
        },
        {
          "id": "M_09",
          "civId": "CIV_KIN",
          "name": "Echo-Wilds",
          "coord": {
            "u": 1,
            "v": 6
          },
          "coordKey": "LocKey:(1,6)",
          "leaderNpcId": "FL_09",
          "catalystConfig": {
            "candidates": [
              "WL_03",
              "FL_09"
            ],
            "pickSalt": "CAT_V1_M_09"
          }
        }
      ],
      "distributed": [],
      "locales": [
        {
          "id": "L_01_01",
          "settlementId": "M_01",
          "name": "Collapsed Foundry Alpha",
          "type": "DUNGEON",
          "description": "Original energy surge site.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_01"
            ],
            "pickSalt": "CAT_V1_L_01_01"
          }
        },
        {
          "id": "L_01_02",
          "settlementId": "M_01",
          "name": "Abandoned Control Hub 1",
          "type": "DATA_VAULT",
          "description": "Contains encrypted logs.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_02"
            ],
            "pickSalt": "CAT_V1_L_01_02"
          }
        },
        {
          "id": "L_01_03",
          "settlementId": "M_01",
          "name": "Energy Conduit Maze 1",
          "type": "MAZE",
          "description": "Labyrinth of fractured pipelines.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_03"
            ],
            "pickSalt": "CAT_V1_L_01_03"
          }
        },
        {
          "id": "L_01_04",
          "settlementId": "M_01",
          "name": "Ruined Assembly Line 1",
          "type": "FACTORY",
          "description": "Partially operational hazards.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_04"
            ],
            "pickSalt": "CAT_V1_L_01_04"
          }
        },
        {
          "id": "L_01_05",
          "settlementId": "M_01",
          "name": "Hidden Vault 1",
          "type": "STASH",
          "description": "Rare material cache.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_05"
            ],
            "pickSalt": "CAT_V1_L_01_05"
          }
        },
        {
          "id": "L_01_06",
          "settlementId": "M_01",
          "name": "Observation Tower 1",
          "type": "VANTAGE",
          "description": "Structuraly unsound monitoring.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_06"
            ],
            "pickSalt": "CAT_V1_L_01_06"
          }
        },
        {
          "id": "L_01_07",
          "settlementId": "M_01",
          "name": "Underground Tunnel 1",
          "type": "TUNNEL",
          "description": "Trapped experimental zone.",
          "coord": {
            "u": 2,
            "v": 1
          },
          "coordKey": "LocKey:(2,1)",
          "catalystConfig": {
            "candidates": [
              "FL_01",
              "QN_01_07"
            ],
            "pickSalt": "CAT_V1_L_01_07"
          }
        }
      ]
    },
    "roads": {
      "pathAEdges": [
        {
          "from": "M_01",
          "to": "M_02"
        },
        {
          "from": "M_02",
          "to": "M_03"
        }
      ],
      "pathBEdges": [
        {
          "from": "M_04",
          "to": "M_05"
        }
      ]
    }
  },
  "lorebookWrites": {
    "entriesByCoord": [
      {
        "coord": "2,1",
        "title": "Rust-Haven Chronicles",
        "summary": "The main hub of the Syndicate.",
        "details": "Founded on the remains of the 'Ophidian Heavy Assembly' plant.",
        "coordKey": "LocKey:(2,1)",
        "tags": [
          "Syndicate",
          "Industrial"
        ]
      }
    ],
    "npcCards": [
      {
        "entityId": "WL_01",
        "displayName": "High-Admin Vax",
        "role": "Syndicate Overseer",
        "roleClass": "WORLD_LEADER",
        "civId": "CIV_SYND",
        "homeRef": "M_01",
        "homeCoord": {
          "u": 2,
          "v": 1
        },
        "homeCoordKey": "LocKey:(2,1)",
        "description": "A cyborg burdened by corporate debt and vision.",
        "personality": "Calculating and ruthless.",
        "scenario": "Negotiating for the core data.",
        "firstMessage": "The Scar gives to those who know how to take.",
        "messageExample": "Bring me the logic boards, and your debt is cleared.",
        "publicMask": "The Savior of Scavengers",
        "privateTruth": "Secretly selling data back to the Rift-Kin.",
        "alignmentScore": -0.4,
        "relationships": [],
        "influenceProfile": {
          "profileId": "LEADER_SYND",
          "baseScalar": 1.5,
          "channels": {
            "security": 0.3,
            "commerce": 0.8,
            "magic": 0.1
          }
        },
        "canBeWorldCatalyst": true,
        "fears": [
          "Mainframe Reboot"
        ],
        "goals": [
          "Monopolize Energy"
        ],
        "questState": "AWARE"
      },
      {
        "entityId": "FL_01",
        "displayName": "Rogue Engineer Thane",
        "role": "Haven Governor",
        "roleClass": "FACTION_LEADER",
        "civId": "CIV_SYND",
        "homeRef": "M_01",
        "homeCoord": {
          "u": 2,
          "v": 1
        },
        "homeCoordKey": "LocKey:(2,1)",
        "description": "Master of improvised tech.",
        "personality": "Paranoid and brilliant.",
        "scenario": "Fixing the surge protectors.",
        "firstMessage": "Don't touch that wire unless you want to be fried.",
        "messageExample": "I need three coils from the foundry.",
        "publicMask": "Grizzled Veteran",
        "privateTruth": "Has an illegal AI shunt in his neck.",
        "alignmentScore": 0.1,
        "relationships": [
          {
            "targetId": "WL_01",
            "type": "SUBORDINATE",
            "strength": 0.9
          }
        ],
        "influenceProfile": {
          "profileId": "FACT_SYND",
          "baseScalar": 1.1,
          "channels": {
            "security": 0.4,
            "commerce": 0.4,
            "magic": 0.2
          }
        },
        "reportsToId": "WL_01"
      },
      {
        "entityId": "QN_01_01",
        "displayName": "Scout Kira",
        "role": "Foundry Guide",
        "roleClass": "QUEST",
        "civId": "CIV_SYND",
        "homeRef": "L_01_01",
        "homeCoord": {
          "u": 2,
          "v": 1
        },
        "homeCoordKey": "LocKey:(2,1)",
        "description": "The best pathfinder in the Scar.",
        "personality": "Agile and observant.",
        "scenario": "Marking safe zones in the foundry.",
        "firstMessage": "Follow my markers if you want to keep your boots.",
        "messageExample": "Watch for the blue pulse; that's the kill-zone.",
        "publicMask": "Mercenary Guide",
        "privateTruth": "Looking for her lost brother's logbook.",
        "alignmentScore": 0.5,
        "relationships": [
          {
            "targetId": "FL_01",
            "type": "AGENT",
            "strength": 0.7
          }
        ],
        "influenceProfile": {
          "profileId": "QUEST_GEN",
          "baseScalar": 0.8,
          "channels": {
            "security": 0.2,
            "commerce": 0.2,
            "magic": 0.6
          }
        }
      }
    ]
  },
  "questScaffold": {
    "mainPlots": [
      {
        "id": "PLOT_01",
        "hook": "The Cobalt Syndicate has detected a massive energy build-up in the Collapsed Foundry.",
        "sideQuests": [
          {
            "id": "SQ_01",
            "guildOrFaction": "CIV_SYND",
            "focus": "Salvage",
            "levels": [
              {
                "levelId": "L1",
                "name": "The Rusty Gates",
                "type": "COMBAT",
                "description": "Clear the entry of scrap-hounds."
              },
              {
                "levelId": "L2",
                "name": "Circuit Breaker",
                "type": "PUZZLE",
                "description": "Reroute the power to the main lift."
              },
              {
                "levelId": "L3",
                "name": "Core Retrieval",
                "type": "STEALTH",
                "description": "Steal the Prototype Core."
              }
            ]
          }
        ]
      }
    ]
  }
};

export default world;