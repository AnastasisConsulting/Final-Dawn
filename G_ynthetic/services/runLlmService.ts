// G_ynthetic/services/runLlmService.ts
import { AIProvider, LLMConfig, LogItem, MnemosyneAnalysis } from '../types';
import { generateGeminiChat, analyzeGeminiMemory } from './geminiService';
import { generateOllamaChat, analyzeOllamaMemory, getOllamaEmbedding } from './ollamaService';
import { generateOpenAIChat, analyzeOpenAIMemory } from './openaiService';
import { generateAnthropicChat, analyzeAnthropicMemory } from './anthropicService';
import { calculateTriadScores } from './coralService';
import { vectorToGridCoords } from './mnemosyneUtils';
import { makeLatticeKey, latticeStore } from './latticeService';

interface GenerationResult {
    aiResponseText: string;
    analysis: MnemosyneAnalysis;
}

/**
 * OPTIMIZED FAST PATH: 3-Second Protocol for GTX 1650
 * Uses Encoder (CPU) -> Lattice Lookup (Instant) -> 3B Model (GPU)
 */
const runFastFractalOrchestration = async (
    currentLog: LogItem[],
    prompt: string,
    config: LLMConfig
): Promise<GenerationResult> => {
    console.time("FastPath");
    console.log("--- F.R.A.C.C. FAST PATH ACTIVATED (3s Protocol) ---");

    const { ollamaUrl, ollamaDecomposerModel, ollamaSynthesizerModel } = config;
    
    // Use lightweight models if configured, otherwise fallback to main
    const encoderModel = ollamaDecomposerModel || "nomic-embed-text";
    const speechModel = ollamaSynthesizerModel || "hhao/qwen2.5-coder-tools:3b";

    // --- STEP 1: SENSATION (The Encoder / Thalamus) ---
    console.log(`[FastPath] Sensation: Embedding with ${encoderModel}...`);
    const vector = await getOllamaEmbedding(ollamaUrl, encoderModel, prompt);

    // --- STEP 2: PERCEPTION (The Lattice Logic) ---
    const coords = vectorToGridCoords(vector);
    console.log(`[FastPath] Perception: Mapped to Coords [${coords.x}, ${coords.y}, ${coords.z}]`);

    // Retrieve Context from the "Hardcoded Mind" (The 7x7x7 Grid)
    const nodeKey = makeLatticeKey(0, coords.x, coords.y, coords.z);
    let nodeContext = "State: Neutral. No prior memory of this state.";
    
    if (nodeKey) {
        const nodeData = latticeStore.readNode(nodeKey);
        if (nodeData && nodeData.Location_Metadata) {
            nodeContext = `
            STATE: ${nodeData.Location_Metadata.name}
            THEME: ${nodeData.Location_Metadata.System_Theme}
            CONTEXT: ${nodeData.Location_Metadata.Description}
            `;
            console.log(`[FastPath] Memory: Loaded context from ${nodeKey}`);
        } else {
            console.log(`[FastPath] Memory: Node ${nodeKey} is empty. Using raw coordinates.`);
            nodeContext = `State: Coordinate [Risk:${coords.x}, Reward:${coords.y}, Relation:${coords.z}].`;
        }
    }

    // --- STEP 3: ARTICULATION (The 3B LLM / Cortex) ---
    // FIX: INJECT PERSONA HERE because 360m models ignore System Prompts
    const finalPrompt = `
    ${config.systemInstruction}

    [INTERNAL STATE]
    ${nodeContext}
    
    [USER INPUT]
    "${prompt}"
    
    [DIRECTIVE]
    Respond immediately and authentically from this state. Be concise.
    `;

    // Note: Passing "" as system instruction because we manually injected it above
    const response = await generateOllamaChat(
        currentLog, finalPrompt, "", ollamaUrl, speechModel
    );

    console.timeEnd("FastPath");

    return {
        aiResponseText: response,
        analysis: {
            embedding: vector,
            scene: `Lattice Node ${nodeKey || 'Unknown'}`,
            names: [],
            tags: { coords, method: "FastPath" }
        }
    };
};

/**
 * Executes the F.R.A.C.C. Orchestration Pipeline with component gating.
 */
const runFractalOrchestration = async (
    currentLog: LogItem[],
    prompt: string,
    config: LLMConfig
): Promise<GenerationResult> => {

    console.log("--- F.R.A.C.C. DEEP ORCHESTRATION MODE ACTIVATED ---");

    const {
        ollamaUrl, systemInstruction,
        ollamaDecomposerModel, ollamaPhase1Model, ollamaPhase2Model, ollamaPhase3Model, ollamaSynthesizerModel,
        useCoralScorer, usePhaseAgents, useDecomposerSynthesizer
    } = config;

    const finalSynthesizerModel = useDecomposerSynthesizer ? ollamaSynthesizerModel : config.ollamaModel;
    if (!finalSynthesizerModel) throw new Error("Synthesis Model is required for F.R.A.C.C. mode.");

    const decomposerModel = useDecomposerSynthesizer ? ollamaDecomposerModel : finalSynthesizerModel;

    const phase1Model = usePhaseAgents ? ollamaPhase1Model : finalSynthesizerModel;
    const phase2Model = usePhaseAgents ? ollamaPhase2Model : finalSynthesizerModel;
    const phase3Model = usePhaseAgents ? ollamaPhase3Model : finalSynthesizerModel;

    const historyForText = currentLog.map(l => ({ role: l.role, text: l.text }));

    // --- 1. Decomposition ---
    const decompositionPrompt = `
        DECOMPOSITION AGENT (P0): Analyze the user's latest prompt for structural intent. Extract the 7 Rhetorical Arcs (Essence, Form, Action, Frame, Intent, Relation, Value).
        Respond ONLY with a valid JSON object.
    `;

    let decomposedArcs: any = {};

    try {
        const decompOutput = await generateOllamaChat(
            historyForText, decompositionPrompt, systemInstruction, ollamaUrl, decomposerModel
        );

        const match = decompOutput.match(/\{[\s\S]*\}/);
        decomposedArcs = match ? JSON.parse(match[0]) : { essence: "Decomposition Failed." };

        decomposedArcs = Object.keys(decomposedArcs).reduce((acc: any, key: string) => {
            acc[key.toLowerCase()] = decomposedArcs[key];
            return acc;
        }, {});
    } catch (e) {
        console.error("Decomposition Agent Failed:", e);
        decomposedArcs = { essence: "Critical Decomposition Failure." };
    }

    // --- 2. Phase Processing ---
    let lastPhaseOutput = JSON.stringify(decomposedArcs);
    let finalPhaseOutput = lastPhaseOutput;

    if (usePhaseAgents) {
        console.log("Orchestration: Running 3 Macro-Phase Agents (P1, P2, P3)");

        // P1
        lastPhaseOutput = await generateOllamaChat(
            historyForText,
            `INPUT PHASE (P1): Given Decomposition: ${lastPhaseOutput}.`,
            systemInstruction, ollamaUrl, phase1Model
        );

        // P2
        lastPhaseOutput = await generateOllamaChat(
            currentLog,
            `EXPANSION PHASE (P2): Given Phase 1 result: "${lastPhaseOutput}".`,
            systemInstruction, ollamaUrl, phase2Model
        );

        // P3
        finalPhaseOutput = await generateOllamaChat(
            currentLog,
            `NUANCE PHASE (P3): Given Phase 2 result: "${lastPhaseOutput}".`,
            systemInstruction, ollamaUrl, phase3Model
        );
    }

    // --- 3. Triad Scoring ---
    let rankedTriads: { arc: string, polarity: number, fragment: string }[] = [];

    if (useCoralScorer) {
        rankedTriads = calculateTriadScores(decomposedArcs);
    } else {
        console.log("Triad Scoring: CPU fallback mode.");
        rankedTriads = Object.keys(decomposedArcs).map((arc, i) => ({
            arc,
            polarity: (decomposedArcs[arc]?.length || 0) + (7 - i),
            fragment: decomposedArcs[arc] || `FRAGMENT_MISSING_${arc}`
        })).sort((a, b) => b.polarity - a.polarity);
    }

    // --- 4. Synthesis ---
    const finalSynthesisPrompt = `
    FINAL SYNTHESIS: Generate a single coherent narrative.

    --- RANKED LOGIC FRAGMENTS ---
    ${JSON.stringify(rankedTriads.map((t, i) => ({ rank: i + 1, data: t.fragment })), null, 2)}

    --- FINAL PHASE SYNTHESIS ---
    ${finalPhaseOutput}
    `;

    const finalResponse = await generateOllamaChat(
        historyForText, finalSynthesisPrompt, systemInstruction, ollamaUrl, finalSynthesizerModel
    );

    // --- 5. Memory Analysis ---
    const rawAnalysis = await analyzeOllamaMemory(prompt, finalResponse, ollamaUrl, finalSynthesizerModel);

    const analysis: MnemosyneAnalysis = {
        embedding: rawAnalysis.embedding || [],
        scene: rawAnalysis.scene || "Analysis Failed",
        names: rawAnalysis.names || [],

        tags: {
            semantics: rawAnalysis.semantics || {},
            suggestions: rawAnalysis.suggestions || []
        }
    };

    return { aiResponseText: finalResponse, analysis };
};

/**
 * Standard generation for all providers with performance monitoring.
 */
export const runLLMGenerationAndAnalysis = async (
    currentLog: LogItem[],
    prompt: string,
    config: LLMConfig
): Promise<GenerationResult> => {

    const {
        aiProvider,
        systemInstruction,
        ollamaModel,
        useFractalOrchestration,
        useFastPath
    } = config;

    const historyForText = currentLog.map(l => ({ role: l.role, text: l.text }));

    // --- F.R.A.C.C. Switch ---
    if (aiProvider === 'ollama' && useFractalOrchestration) {
        if (useFastPath) {
            return runFastFractalOrchestration(currentLog, prompt, config);
        }
        return runFractalOrchestration(currentLog, prompt, config);
    }

    // --- Standard Provider Dispatch ---
    let aiResponseText = "";
    let rawAnalysis: any = {};

    console.log(`[StandardMode] Dispatching to ${aiProvider}...`);
    console.time("Total_Standard_Turn");

    switch (aiProvider) {
        case 'gemini': {
            if (!config.geminiApiKey) throw new Error("Gemini API Key is missing.");
            const geminiHistory = currentLog.map(l => ({
                role: l.role === 'user' ? 'user' : 'model',
                parts: [{ text: l.text }]
            }));
            aiResponseText = await generateGeminiChat(geminiHistory as any, prompt, systemInstruction, config.geminiApiKey);
            rawAnalysis = await analyzeGeminiMemory(prompt, aiResponseText, config.geminiApiKey);
            break;
        }
        case 'openai': {
            if (!config.openaiApiKey) throw new Error("OpenAI API Key is missing.");
            aiResponseText = await generateOpenAIChat(historyForText, prompt, systemInstruction, config.openaiApiKey);
            rawAnalysis = await analyzeOpenAIMemory(prompt, aiResponseText, config.openaiApiKey);
            break;
        }
        case 'anthropic': {
            if (!config.anthropicApiKey) throw new Error("Anthropic API Key is missing.");
            aiResponseText = await generateAnthropicChat(historyForText, prompt, systemInstruction, config.anthropicApiKey);
            rawAnalysis = await analyzeAnthropicMemory(prompt, aiResponseText, config.anthropicApiKey);
            break;
        }
        case 'ollama': {
            if (!ollamaModel) throw new Error("No Ollama model selected.");

            // 1. GENERATION STEP
            console.time("Ollama_Gen");
            aiResponseText = await generateOllamaChat(
                historyForText, prompt, systemInstruction, config.ollamaUrl, ollamaModel
            );
            console.timeEnd("Ollama_Gen");

            // 2. ANALYSIS STEP (Likely Bottleneck)
            console.time("Ollama_Analysis");
            console.log("[StandardMode] Starting Analysis Phase...");
            try {
                rawAnalysis = await analyzeOllamaMemory(
                    prompt, aiResponseText, config.ollamaUrl, ollamaModel
                );
            } catch (e) {
                console.warn("Analysis Failed, skipping:", e);
                rawAnalysis = { scene: "Analysis Error", embedding: [] };
            }
            console.timeEnd("Ollama_Analysis");
            break;
        }
        default:
            throw new Error(`Unsupported AI Provider: ${aiProvider}`);
    }

    console.timeEnd("Total_Standard_Turn");

    const analysis: MnemosyneAnalysis = {
        embedding: rawAnalysis.embedding || [],
        scene: rawAnalysis.scene || "Analysis Failed",
        names: rawAnalysis.names || [],
        tags: {
            semantics: rawAnalysis.semantics || {},
            suggestions: rawAnalysis.suggestions || []
        }
    };

    return { aiResponseText, analysis };
};