// apps/character-creation/constants.ts

import { LevelData, CoreClass, Attribute, QuestionData, Affinity } from './types';

export const FALLBACK_QUESTION: QuestionData = {
  scenario: "Domain Mapping Initiated. A structural anomaly is detected in Sector 7. Your directive is to resolve. Do you...",
  options: [
    { text: "Enforce absolute structural compliance. Crush the anomaly under heavy ordinance.", affinity: Attribute.STR },
    { text: "Rewire the sector's exchange protocols to bypass the anomaly entirely.", affinity: Attribute.DEX },
    { text: "Analyze the anomaly's signal coherence and integrate it into the collective.", affinity: Attribute.INT }
  ]
};

// A geometric progression XP table as requested
// Canonical leveling table (Level 1–21, Total XP to reach 21 = 63,000)
// Source: Player/Exp and Leveling/Tables.md
export const XP_TABLE: LevelData[] = [
  { level: 1, xpFromPrevious: 1351, totalXpToReach: 1351, unlock: 'CORE' },
  { level: 2, xpFromPrevious: 1405, totalXpToReach: 2756, unlock: '—' },
  { level: 3, xpFromPrevious: 1462, totalXpToReach: 4218, unlock: '—' },
  { level: 4, xpFromPrevious: 1520, totalXpToReach: 5738, unlock: '—' },
  { level: 5, xpFromPrevious: 1581, totalXpToReach: 7319, unlock: '—' },
  { level: 6, xpFromPrevious: 1644, totalXpToReach: 8963, unlock: '—' },
  { level: 7, xpFromPrevious: 1710, totalXpToReach: 10673, unlock: 'SUB' },
  { level: 8, xpFromPrevious: 1847, totalXpToReach: 12520, unlock: '—' },
  { level: 9, xpFromPrevious: 1994, totalXpToReach: 14514, unlock: '—' },
  { level: 10, xpFromPrevious: 2154, totalXpToReach: 16668, unlock: '—' },
  { level: 11, xpFromPrevious: 2326, totalXpToReach: 18994, unlock: '—' },
  { level: 12, xpFromPrevious: 2513, totalXpToReach: 21507, unlock: '—' },
  { level: 13, xpFromPrevious: 2714, totalXpToReach: 24221, unlock: '—' },
  { level: 14, xpFromPrevious: 2931, totalXpToReach: 27152, unlock: 'CROSS' },
  { level: 15, xpFromPrevious: 3341, totalXpToReach: 30493, unlock: '—' },
  { level: 16, xpFromPrevious: 3809, totalXpToReach: 34302, unlock: '—' },
  { level: 17, xpFromPrevious: 4343, totalXpToReach: 38645, unlock: '—' },
  { level: 18, xpFromPrevious: 4951, totalXpToReach: 43596, unlock: '—' },
  { level: 19, xpFromPrevious: 5642, totalXpToReach: 49234, unlock: '—' },
  { level: 20, xpFromPrevious: 6432, totalXpToReach: 55666, unlock: '—' },
  { level: 21, xpFromPrevious: 7334, totalXpToReach: 63000, unlock: 'MASTERY' }
];

export const CLASS_DESCRIPTIONS: Record<string, { description: string; bonus: string }> = {
  [CoreClass.REBEL]: {
    description: "A disgruntled citizen looking to make some changes. You see the world through its structural flaws—opportunity is just another word for a weak support beam.",
    bonus: "+1 STR, -1 INT (DIRECTIVE: Disrupt the status quo by any means necessary.)"
  },
  [CoreClass.ACOLYTE]: {
    description: "An augment seeking induction into the ranks of the Church of the Ascension. Your neural lattice hums with the promise of divinity—flesh is but a temporary vessel for the Holy Flux.",
    bonus: "+1 INT, -1 DEX (DIRECTIVE: Purify the signal. Accelerate the Ascension.)"
  },
  [CoreClass.HACKER]: {
    description: "A systems specialist who gets off on the fact no doors are going to hold their secrets long if they want to peek inside. To you, reality is just another encrypted volume waiting for a brute-force breach.",
    bonus: "+1 DEX, -1 STR (DIRECTIVE: Access granted. Leave no trace but the ghost in the machine.)"
  }
};

export const AFFINITY_LABELS: Record<string, string> = {
  [Affinity.STR]: 'STR',
  [Affinity.INT]: 'INT',
  [Affinity.DEX]: 'DEX'
};

export const CLASS_PROGRESSION: Record<string, {
  subs: Record<string, { label: string; description: string }>;
  cross: Record<string, { label: string; description: string }>;
}> = {
  [CoreClass.REBEL]: {
    subs: {
      [Affinity.STR]: { label: "Merc", description: "A freelance Rebel fighter for hire. Set out for fame and fortune" },
      [Affinity.INT]: { label: "Specialist", description: "A highly specialized Rebel fighter who has settled into a niche slot on a team of Rebel insurgents" },
      [Affinity.DEX]: { label: "Recruit", description: "A prospect rebel for an unnamed insurgency ring that has been recruited for special assignments" }
    },
    cross: {
      [`STR_${Affinity.STR}`]: { label: "Soldier of Fortune", description: "A famous well paid eagerly sought after mercenary rebel" },
      [`STR_${Affinity.INT}`]: { label: "False Prophet", description: "An apostate priest from the church of ascension who has been branded a false prophet by the leadership" },
      [`STR_${Affinity.DEX}`]: { label: "Sleeper Cell", description: "A Rebel/Recruit who has now earned enough trust and progressed far enough in their training to become a Sleeper Cell" }
    }
  },
  [CoreClass.ACOLYTE]: {
    subs: {
      [Affinity.STR]: { label: "Convert", description: "An Acolyte that has been initiated into the technocracy's Church of Ascension" },
      [Affinity.INT]: { label: "Priest", description: "A lifelong member of the Church of Ascension who has progressed through the ranks to achieve the title of a Priest" },
      [Affinity.DEX]: { label: "Parishioner", description: "A valuable preferential member of the flock of the Church of Ascension" }
    },
    cross: {
      [`INT_${Affinity.STR}`]: { label: "The Un-made", description: "A disillusioned rebel warrior turned acolyte for the Church of Ascension." },
      [`INT_${Affinity.INT}`]: { label: "True Believer", description: "An Acolyte of the Church of Ascension who became a priest. Serving the church faithfully has now become a senior member and donned the status of a True Believer" },
      [`INT_${Affinity.DEX}`]: { label: "Cyber Heretic", description: "A hacker turned acolyte who, after many years of faithful service, has had a falling out with the church." }
    }
  },
  [CoreClass.HACKER]: {
    subs: {
      [Affinity.STR]: { label: "Insurgent", description: "A specialized tech support agent for the local insurgency." },
      [Affinity.INT]: { label: "Zealot", description: "An extremely passionate Hacker who is more extremist than insurgent." },
      [Affinity.DEX]: { label: "Cipher", description: "An encryption expert who works for the bureaucracy. A 'good guy' by their own estimation." }
    },
    cross: {
      [`DEX_${Affinity.STR}`]: { label: "Hacktivist", description: "A very political and bold hacker who loves rally's and protests and the occasional destruction of corporate property." },
      [`DEX_${Affinity.INT}`]: { label: "Null Apostle", description: "A high ranker member of the church of ascension who has been isolated from the flock and tasked with monitoring the congregations for the leadership." },
      [`DEX_${Affinity.DEX}`]: { label: "Cryptocrat", description: "A hacker who was recruited by the '9' The elite group of star system cartel overlords." }
    }
  }
};