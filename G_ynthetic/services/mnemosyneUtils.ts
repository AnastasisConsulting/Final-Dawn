// G_ynthetic/services/mnemosyneUtils.ts
import { HashKey } from '../types';

export const generateHash = (content: any): HashKey => {
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; 
  }
  return `0x${Math.abs(hash).toString(16)}-${str.length}`;
};

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const getNextCoordinate = (currentCount: number): {x: number, y: number, z: number} => {
  const z = Math.floor(currentCount / 49);
  const remainderZ = currentCount % 49;
  const y = Math.floor(remainderZ / 7);
  const x = remainderZ % 7;
  return { x, y, z };
};

// --- THE MISSING MATH FOR 3-SECOND PROTOCOL ---
// Maps the 768-dimension vector to your 7x7x7 Cognitive Grid
export const vectorToGridCoords = (embedding: number[]): { x: number, y: number, z: number } => {
    if (!embedding || embedding.length === 0) return { x: 0, y: 0, z: 0 };

    // 1. Split Vector into 3 Segments (Risk, Reward, Relation)
    const chunkSize = Math.floor(embedding.length / 3);
    
    const getSegmentAvg = (start: number, end: number) => {
        let sum = 0;
        for (let i = start; i < end; i++) sum += embedding[i];
        return sum / (end - start);
    };

    const rawX = getSegmentAvg(0, chunkSize);
    const rawY = getSegmentAvg(chunkSize, chunkSize * 2);
    const rawZ = getSegmentAvg(chunkSize * 2, embedding.length);

    // 2. Clamp to Grid (-3 to +3)
    // Sensitivity: 40 works well for 'nomic-embed-text' vectors which are usually small floats
    const sensitivity = 40; 
    const clamp = (val: number) => Math.max(-3, Math.min(3, Math.round(val * sensitivity)));

    return {
        x: clamp(rawX),
        y: clamp(rawY),
        z: clamp(rawZ)
    };
};