import Fastify from 'fastify';
import { TurnEngine } from '@eideus/orchestrator-core';
// import { VertexAI } from '@google-cloud/vertexai'; // FUTURE: Google Cloud Integration

const server = Fastify({ logger: true });

// [HYBRID ARCHITECTURE]
// The "Cortex" Path: High-Intelligence, Low-Frequency
// Routes to Vertex AI (Gemini Pro) for narrative synthesis
// currently mocked until GCP credentials are provisioned
const CLOUD_THRESHOLD_TOKENS = 500;

// Initialize the Core Engine (currently acting as Local/Edge)
const edgeEngine = new TurnEngine('http://localhost:11434');

server.post('/turn', async (request, reply) => {
    const body = request.body as any;
    const inputLength = body.playerText?.length || 0;

    // [ROUTER LOGIC]
    // Decision Gate: Edge vs Cloud
    if (inputLength > CLOUD_THRESHOLD_TOKENS || body.forceCloud) {
        server.log.info('[ROUTER] Complexity High -> Routing to Google Vertex AI (Cortex)');
        // TODO: Implement Vertex AI call here
        // return vertexEngine.processTurn(body);
        return { error: "Cloud credits not yet provisioned. Fallback to Local." };
    } else {
        server.log.info('[ROUTER] Complexity Low -> Routing to Local Ollama (Edge)');
        // 100% Private, Zero Cost, Low Latency
        const result = await edgeEngine.processTurn(body);
        return result;
    }
});

const start = async () => {
    try {
        await server.listen({ port: 3000 });
        console.log('[Eideus-Server] Hybrid Node Running on http://localhost:3000');
        console.log('[Eideus-Server] Linked to @eideus/orchestrator-core');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
