export interface AnimationIntent {
  energy: number;      // 0–1
  mood: number;        // -1 (dark) to +1 (radiant)
  coherence: number;   // 0–1 (chaotic → unified)
  curiosity: number;   // 0–1 (wandering tendency)
}
