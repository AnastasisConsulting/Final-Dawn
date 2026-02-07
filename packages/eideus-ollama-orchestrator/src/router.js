export function decideMemoryEntryPoint(input) {
    // default: semantic recall (spatialPrefix optional)
    return {
        plan: {
            op: "EmbeddingTopKThenRerank",
            topK: 25,
            spatialPrefix: `g${input.spatial.g}.s${input.spatial.s}.o${input.spatial.o}`,
            window: { mode: "PlusMinusPages", n: 3 },
        },
        reason: "Use embeddings-driven recall with spatial prefix from request",
    };
}
