import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SESSION_ID = "VERIFY_PHASE_2_" + Date.now();
const HOME = os.homedir();
const SAVE_PATH = path.join(HOME, ".eideus", "saves", SESSION_ID, "state.json");

const payload = JSON.stringify({
    sessionId: SESSION_ID,
    planetCode: "O1",
    playerAffinity: { buckets: [] },
    worldFiles: {
        lorebook: { world_id: "TEST_G1", civilizations: [] },
        sectorMap: { civilizations: [] },
        quests: []
    }
});

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/land',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

console.log("--- STARTING VERIFICATION ---");
console.log(`Target Session: ${SESSION_ID}`);

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`Response Code: ${res.statusCode}`);
        console.log(`Response Body: ${data}`);

        try {
            const json = JSON.parse(data);
            if (json.ok && json.startKey) {
                console.log("[PASS] B-2.2 API Handshake: Success");
            } else {
                console.error("[FAIL] B-2.2 API Handshake: Invalid Response");
            }
        } catch (e) {
            console.error("[FAIL] B-2.2 API Handshake: JSON Parse Error");
        }

        // Check File
        if (fs.existsSync(SAVE_PATH)) {
            console.log(`[PASS] B-2.1 Persistence Write: File found at ${SAVE_PATH}`);
            // Clean up
            // fs.rmSync(path.join(HOME, ".eideus", "saves", SESSION_ID), { recursive: true, force: true });
        } else {
            console.error(`[FAIL] B-2.1 Persistence Write: File NOT found at ${SAVE_PATH}`);
        }
    });
});

req.on('error', (error) => {
    console.error(`[FAIL] Connection Error: ${error.message}`);
});

req.write(payload);
req.end();
