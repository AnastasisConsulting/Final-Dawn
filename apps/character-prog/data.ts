import { Affinity, NodeData } from './types';

// Helper to create skills
const sk = (name: string, type: any, level: number) => ({ id: name.replace(/\s/g, ''), name, type, levelReq: level });

export const rpgData: NodeData[] = [
  {
    id: 'rebel-core',
    name: 'Rebel',
    affinity: Affinity.STR,
    type: 'CLASS_CORE',
    skills: [sk('Rend Slash', 'CORE', 0), sk('Iron Stance', 'CORE', 0)],
    children: [
      {
        id: 'merc',
        name: 'Merc',
        affinity: Affinity.STR,
        type: 'CLASS_SUB',
        skills: [sk('Bayonet Rush', 'SUB', 7), sk('Flashbang Feint', 'SUB', 7)],
        children: [{
            id: 'soldier',
            name: 'Soldier of Fortune',
            affinity: Affinity.STR,
            type: 'CLASS_CROSS',
            skills: [sk('Contract Killer', 'CROSS', 14), sk('Warpath', 'CROSS', 14)],
            children: [{
                id: 'master-merc',
                name: 'Legend',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Cash & Thunder', 'ULTIMATE', 21)]
            }]
        }]
      },
      {
        id: 'specialist',
        name: 'Specialist',
        affinity: Affinity.INT,
        type: 'CLASS_SUB',
        skills: [sk('Precision Tap', 'SUB', 7), sk('Overcommit Strike', 'SUB', 7)],
        children: [{
            id: 'false-prophet',
            name: 'False Prophet',
            affinity: Affinity.INT,
            type: 'CLASS_CROSS',
            skills: [sk('Blasphemy Tactics', 'CROSS', 14), sk('Censure Strike', 'CROSS', 14)],
            children: [{
                id: 'master-spec',
                name: 'Iconoclast',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Schism Event', 'ULTIMATE', 21)]
            }]
        }]
      },
      {
        id: 'recruit',
        name: 'Recruit',
        affinity: Affinity.DEX,
        type: 'CLASS_SUB',
        skills: [sk('Adrenal Drill', 'SUB', 7), sk('Clumsy Lunge', 'SUB', 7)],
        children: [{
            id: 'sleeper',
            name: 'Sleeper Cell',
            affinity: Affinity.DEX,
            type: 'CLASS_CROSS',
            skills: [sk('Silent Breach', 'CROSS', 14), sk('Execution Order', 'CROSS', 14)],
            children: [{
                id: 'master-recruit',
                name: 'Awakened',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Deep Cover Awakening', 'ULTIMATE', 21)]
            }]
        }]
      }
    ]
  },
  {
    id: 'acolyte-core',
    name: 'Acolyte',
    affinity: Affinity.INT,
    type: 'CLASS_CORE',
    skills: [sk('Shock Pulse', 'CORE', 0), sk('Sanctified Circuit', 'CORE', 0)],
    children: [
      {
        id: 'convert',
        name: 'Convert',
        affinity: Affinity.STR,
        type: 'CLASS_SUB',
        skills: [sk('Commandment Link', 'SUB', 7), sk('Awkward Swipe', 'SUB', 7)],
        children: [{
            id: 'unmade',
            name: 'The Un-made',
            affinity: Affinity.STR,
            type: 'CLASS_CROSS',
            skills: [sk('Exile Guard', 'CROSS', 14), sk('Heretic Current', 'CROSS', 14)],
            children: [{
                id: 'master-convert',
                name: 'Void Walker',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Excommunication Protocol', 'ULTIMATE', 21)]
            }]
        }]
      },
      {
        id: 'priest',
        name: 'Priest',
        affinity: Affinity.INT,
        type: 'CLASS_SUB',
        skills: [sk('Votive Mark', 'SUB', 7), sk('Burdened Strike', 'SUB', 7)],
        children: [{
            id: 'true-believer',
            name: 'True Believer',
            affinity: Affinity.INT,
            type: 'CLASS_CROSS',
            skills: [sk('Doctrine Barrier', 'CROSS', 14), sk('Ascension Surge', 'CROSS', 14)],
            children: [{
                id: 'master-priest',
                name: 'High Pontiff',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Radiant Ascension', 'ULTIMATE', 21)]
            }]
        }]
      },
      {
        id: 'parishioner',
        name: 'Parishioner',
        affinity: Affinity.DEX,
        type: 'CLASS_SUB',
        skills: [sk('Flock Shield', 'SUB', 7), sk('Miscast Surge', 'SUB', 7)],
        children: [{
            id: 'cyber-heretic',
            name: 'Cyber Heretic',
            affinity: Affinity.DEX,
            type: 'CLASS_CROSS',
            skills: [sk('Purge Firewall', 'CROSS', 14), sk('Forbidden Upload', 'CROSS', 14)],
            children: [{
                id: 'master-parish',
                name: 'System Breaker',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Saintbreaker Override', 'ULTIMATE', 21)]
            }]
        }]
      }
    ]
  },
  {
    id: 'hacker-core',
    name: 'Hacker',
    affinity: Affinity.DEX,
    type: 'CLASS_CORE',
    skills: [sk('System Pierce', 'CORE', 0), sk('Ghost Protocol', 'CORE', 0)],
    children: [
      {
        id: 'insurgent',
        name: 'Insurgent',
        affinity: Affinity.STR,
        type: 'CLASS_SUB',
        skills: [sk('Signal Jam', 'SUB', 7), sk('Fumbled Hack', 'SUB', 7)],
        children: [{
            id: 'hacktivist',
            name: 'Hacktivist',
            affinity: Affinity.STR,
            type: 'CLASS_CROSS',
            skills: [sk('Signal Manifesto', 'CROSS', 14), sk('Chain Exploit', 'CROSS', 14)],
            children: [{
                id: 'master-insurgent',
                name: 'Revolutionary',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Citywide Uprising', 'ULTIMATE', 21)]
            }]
        }]
      },
      {
        id: 'zealot',
        name: 'Zealot',
        affinity: Affinity.INT,
        type: 'CLASS_SUB',
        skills: [sk('Radical Exploit', 'SUB', 7), sk('Reckless Charge', 'SUB', 7)],
        children: [{
            id: 'null-apostle',
            name: 'Null Apostle',
            affinity: Affinity.INT,
            type: 'CLASS_CROSS',
            skills: [sk('Surveillance Hymn', 'CROSS', 14), sk('Black Operation', 'CROSS', 14)],
            children: [{
                id: 'master-zealot',
                name: 'Null Entity',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Silent Inquisition', 'ULTIMATE', 21)]
            }]
        }]
      },
      {
        id: 'cipher',
        name: 'Cipher',
        affinity: Affinity.DEX,
        type: 'CLASS_SUB',
        skills: [sk('Cipher Cut', 'SUB', 7), sk('Logic Loop', 'SUB', 7)],
        children: [{
            id: 'cryptocrat',
            name: 'Cryptocrat',
            affinity: Affinity.DEX,
            type: 'CLASS_CROSS',
            skills: [sk('Market Probe', 'CROSS', 14), sk('Ledger Break', 'CROSS', 14)],
            children: [{
                id: 'master-cipher',
                name: 'Shadow Ruler',
                affinity: Affinity.NULL,
                type: 'CLASS_MASTER',
                skills: [sk('Total System Capture', 'ULTIMATE', 21)]
            }]
        }]
      }
    ]
  }
];