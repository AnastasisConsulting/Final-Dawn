export enum Affinity {
    STR = 'STR',
    INT = 'INT',
    DEX = 'DEX',
    NULL = 'NULL'
}

export interface Skill {
    id: string;
    name: string;
    type: 'CORE' | 'SUB' | 'CROSS' | 'ULTIMATE';
    description?: string;
    levelReq: number;
}

export interface NodeData {
    id: string;
    name: string;
    affinity: Affinity;
    type: 'CLASS_CORE' | 'CLASS_SUB' | 'CLASS_CROSS' | 'CLASS_MASTER';
    skills: Skill[];
    children?: NodeData[];
}

export interface TreeContext {
    position: [number, number, number];
    color: string;
}
