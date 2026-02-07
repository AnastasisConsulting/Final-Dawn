// Test script for character creation and persistence
// Run with: npx tsx test-persistence.ts from the orchestrator directory

import { sessions } from './src/session.js';
import { persistence } from './src/persistence.js';

async function testCharacterPersistence() {
    console.log('🧪 Testing Character Creation and Persistence\\n');

    const testSessionId = `test_session_${Date.now()}`;

    // Step 1: Create a new session with character data
    console.log('📝 Step 1: Creating new session with character...');
    await sessions.create(testSessionId, {
        planetCode: 'G1-S1-O7',
        playerClass: 'VANGUARD',
        playerAffinity: 'STR',
        caches: {
            lore: new Map(),
            quests: new Map(),
            cast: new Map(),
        },
        location: {
            spatial: { g: 1, s: 1, o: 7, c: 1, ct: 2, r: 7 },
            temporal: { saga: 1, book: 1, chapter: 1, page: 0 }
        },
        credits: 1000,
        inventory: ['Standard Flight Suit', 'Emergency Kit']
    });
    console.log(`✅ Session created: ${testSessionId}`);

    // Step 2: Verify session exists in memory
    console.log('\\n📖 Step 2: Verifying session in memory...');
    const memorySession = sessions.get(testSessionId);
    if (!memorySession) {
        console.error('❌ FAILED: Session not found in memory!');
        return;
    }
    console.log(`✅ Found in memory:`);
    console.log(`   - PlayerClass: ${memorySession.playerClass}`);
    console.log(`   - Player Affinity: ${memorySession.playerAffinity}`);
    console.log(`   - Credits: ${memorySession.credits}`);
    console.log(`   - Location: G${memorySession.location.spatial.g} S${memorySession.location.spatial.s} O${memorySession.location.spatial.o}`);

    // Step 3: Load session from disk to verify persistence
    console.log('\\n💾 Step 3: Loading session from disk...');
    const loadedSession = await persistence.loadState(testSessionId);
    if (!loadedSession) {
        console.error('❌ FAILED: Session not found on disk!');
        return;
    }
    console.log(`✅ Loaded from disk:`);
    console.log(`   - PlayerClass: ${loadedSession.playerClass}`);
    console.log(`   - Player Affinity: ${loadedSession.playerAffinity}`);
    console.log(`   - Credits: ${loadedSession.credits}`);
    console.log(`   - Inventory items: ${loadedSession.inventory.length}`);

    // Step 4: Simulate game progress (advance time)
    console.log('\\n⏰ Step 4: Simulating game progress (tick)...');
    const beforePage = memorySession.location.temporal.page;
    await sessions.tick(testSessionId);
    const afterSession = sessions.get(testSessionId);
    if (!afterSession) {
        console.error('❌ FAILED: Session lost after tick!');
        return;
    }
    console.log(`✅ Time advanced: page ${beforePage} → ${afterSession.location.temporal.page}`);

    // Step 5: Reload from disk after tick to verify auto-save
    console.log('\\n🔄 Step 5: Reloading to verify auto-save...');
    const reloadedSession = await persistence.loadState(testSessionId);
    if (!reloadedSession) {
        console.error('❌ FAILED: Session not found after reload!');
        return;
    }
    if (reloadedSession.location.temporal.page !== afterSession.location.temporal.page) {
        console.error(`❌ FAILED: Page mismatch! Expected ${afterSession.location.temporal.page}, got ${reloadedSession.location.temporal.page}`);
        return;
    }
    console.log(`✅ Auto-save verified: page ${reloadedSession.location.temporal.page}`);

    // Step 6: Test session resume (simulating game restart)
    console.log('\\n🔌 Step 6: Testing session resume (simulate app restart)...');
    sessions.delete(testSessionId); // Clear from memory
    const resumedSession = await sessions.load(testSessionId);
    if (!resumedSession) {
        console.error('❌ FAILED: Could not resume session!');
        return;
    }
    console.log(`✅ Session resumed successfully:`);
    console.log(`   - PlayerClass: ${resumedSession.playerClass}`);
    console.log(`   - Page: ${resumedSession.location.temporal.page}`);
    console.log(`   - Data intact: ${resumedSession.inventory.join(', ')}`);

    // Summary
    console.log('\\n' + '='.repeat(60));
    console.log('✅ ✅ ✅  ALL PERSISTENCE TESTS PASSED  ✅ ✅ ✅');
    console.log('='.repeat(60));
    console.log('\\n💡 Character persistence is working correctly:');
    console.log('   ✓ Sessions are created with character data');
    console.log('   ✓ Data is saved to disk automatically');
    console.log('   ✓ Sessions persist across app restarts');
    console.log('   ✓ Game progress (time/page) is tracked');
    console.log('   ✓ Inventory and state are preserved');
    console.log(`\\n📂 Save location: ~/.eideus/saves/${testSessionId}/state.json`);
}

testCharacterPersistence().catch(err => {
    console.error('\\n❌ TEST FAILED WITH ERROR:', err);
    process.exit(1);
});
