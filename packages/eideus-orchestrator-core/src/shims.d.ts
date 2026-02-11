// Local dev shims for a workspace that may not have `pnpm install` run yet.
// When dependencies are installed, you can delete this file to restore real typings.

declare module "zod" {
  // Minimal merged value+namespace so `z.infer<>` doesn't error before deps are installed.
  export const z: any;
  export namespace z {
    export type infer<T> = any;
  }
}

declare module "ollama" {
  export class Ollama {
    constructor(opts?: any);
    generate(args: any): Promise<any>;
    embeddings?(args: any): Promise<any>;
  }
}
