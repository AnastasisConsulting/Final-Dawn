/**
 * Vizzy Orchestrator
 * Handles Sentient Core (sc_*) tool calls from Ollama and dispatches events to Vizzy
 */

import type { SentientCoreToolCall, EmoteMode } from '../../../../toolcalls/ai-avatar/tools';

export interface VizzyToolCallEvent {
    name: string;
    params: any;
    timestamp: number;
}

export interface VizzyState {
    emotionalMode: EmoteMode | null;
    focusTarget: 'player' | 'object' | 'memory' | 'event' | null;
    movementBehavior: 'approach' | 'retreat' | 'orbit' | 'idle';
    orbitAxis: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'free' | null;
    attentionLevel: 'idle' | 'awake' | 'alert';
    curiosityBias: number; // 0-1
    disciplineBias: number; // 0-1
    isPaused: boolean;
    isFrozen: boolean;
}

/**
 * Vizzy Orchestrator - Central handler for AI-controlled avatar behavior
 */
export class VizzyOrchestrator {
    private state: VizzyState = {
        emotionalMode: null,
        focusTarget: null,
        movementBehavior: 'idle',
        orbitAxis: null,
        attentionLevel: 'idle',
        curiosityBias: 0.5,
        disciplineBias: 0.5,
        isPaused: false,
        isFrozen: false,
    };

    private motionLibrary: Map<string, any> = new Map();
    private toolCallHistory: VizzyToolCallEvent[] = [];

    /**
     * Process tool calls from Ollama response
     */
    processToolCalls(toolCalls: any[]): void {
        if (!toolCalls || toolCalls.length === 0) return;

        console.log('[VizzyOrchestrator] Processing', toolCalls.length, 'tool calls');

        for (const call of toolCalls) {
            this.executeToolCall(call);
        }
    }

    /**
     * Execute a single tool call
     */
    private executeToolCall(call: any): void {
        const { name, params } = call;

        // Log for debugging
        this.toolCallHistory.push({
            name,
            params,
            timestamp: Date.now(),
        });

        console.log(`[VizzyOrchestrator] Executing: ${name}`, params);

        // Dispatch to appropriate handler
        switch (name) {
            // State Management
            case 'sc_awaken':
                this.handleAwaken(params);
                break;
            case 'sc_rest':
                this.handleRest(params);
                break;
            case 'sc_pause':
                this.handlePause(params);
                break;
            case 'sc_resume':
                this.handleResume(params);
                break;
            case 'sc_stop':
                this.handleStop(params);
                break;

            // Emotion & Personality
            case 'sc_emote':
                this.handleEmote(params);
                break;
            case 'sc_curiosity':
                this.handleCuriosity(params);
                break;
            case 'sc_discipline':
                this.handleDiscipline(params);
                break;

            // Focus & Attention
            case 'sc_focus':
                this.handleFocus(params);
                break;
            case 'sc_ignore':
                this.handleIgnore(params);
                break;

            // Movement
            case 'sc_approach':
                this.handleApproach(params);
                break;
            case 'sc_retreat':
                this.handleRetreat(params);
                break;
            case 'sc_orbit':
                this.handleOrbit(params);
                break;

            // Memory/Library
            case 'sc_save':
                this.handleSave(params);
                break;
            case 'sc_recall':
                this.handleRecall(params);
                break;
            case 'sc_tag':
                this.handleTag(params);
                break;

            // Debug
            case 'sc_dump':
                this.handleDump(params);
                break;
            case 'sc_trace':
                this.handleTrace(params);
                break;

            // UI Interaction (Color Stealing)
            case 'sc_steal_color':
                this.handleStealColor(params);
                break;
            case 'sc_return_color':
                this.handleReturnColor(params);
                break;
            case 'sc_adopt_color':
                this.handleAdoptColor(params);
                break;
            case 'sc_set_quest_flag':
                this.handleSetQuestFlag(params);
                break;

            default:
                console.warn(`[VizzyOrchestrator] Unknown tool: ${name}`);
        }

        // Sync state to Vizzy
        this.syncToVizzy();
    }

    /**
     * Handle direct feed interaction from UI
     */
    feed(treatType: string): void {
        console.log(`[VizzyOrchestrator] 🍬 Feeding Vizzy: ${treatType}`);

        // Dispatch special feed event for immediate reaction
        window.dispatchEvent(new CustomEvent('vizzy-feed', {
            detail: { type: treatType, timestamp: Date.now() }
        }));

        // Update internal state based on treat
        if (treatType === 'energy') {
            this.handleAwaken({ actions: ['alert'] });
            this.state.emotionalMode = 'excited';
        } else if (treatType === 'data') {
            this.handleCuriosity({ action: 'increase' });
            this.state.emotionalMode = 'curious';
        } else if (treatType === 'scrap') {
            this.state.emotionalMode = 'calm';
        }

        this.syncToVizzy();
    }

    // ========================================================================
    // State Management Handlers
    // ========================================================================

    private handleAwaken(params: { actions: ('focus' | 'alert')[] }): void {
        this.state.attentionLevel = 'awake';
        if (params.actions.includes('alert')) {
            this.state.attentionLevel = 'alert';
        }
    }

    private handleRest(params: { actions: ('idle' | 'decay')[] }): void {
        this.state.attentionLevel = 'idle';
        this.state.movementBehavior = 'idle';
    }

    private handlePause(params: { actions: ('freeze' | 'hold')[] }): void {
        this.state.isPaused = true;
    }

    private handleResume(params: {}): void {
        this.state.isPaused = false;
    }

    private handleStop(params: {}): void {
        this.state.isFrozen = true;
        this.state.isPaused = true;
    }

    // ========================================================================
    // Emotion & Personality Handlers
    // ========================================================================

    private handleEmote(params: { mode: EmoteMode }): void {
        this.state.emotionalMode = params.mode;
        console.log(`[VizzyOrchestrator] 🎭 Emotion set to: ${params.mode}`);
    }

    private handleCuriosity(params: { action: 'increase' | 'decrease' }): void {
        const delta = params.action === 'increase' ? 0.2 : -0.2;
        this.state.curiosityBias = Math.max(0, Math.min(1, this.state.curiosityBias + delta));
    }

    private handleDiscipline(params: { action: 'increase' | 'decrease' }): void {
        const delta = params.action === 'increase' ? 0.2 : -0.2;
        this.state.disciplineBias = Math.max(0, Math.min(1, this.state.disciplineBias + delta));
    }

    // ========================================================================
    // Focus & Attention Handlers
    // ========================================================================

    private handleFocus(params: { target: 'player' | 'object' | 'memory' | 'event' }): void {
        this.state.focusTarget = params.target;
    }

    private handleIgnore(params: { target: 'player' | 'object' | 'stimulus' }): void {
        if (this.state.focusTarget === params.target) {
            this.state.focusTarget = null;
        }
    }

    // ========================================================================
    // Movement Handlers
    // ========================================================================

    private handleApproach(params: { target: 'player' | 'object' }): void {
        this.state.movementBehavior = 'approach';
        this.state.focusTarget = params.target;
    }

    private handleRetreat(params: { target: 'player' | 'object' }): void {
        this.state.movementBehavior = 'retreat';
        this.state.focusTarget = params.target;
    }

    private handleOrbit(params: { target: 'player' | 'object'; axis: string }): void {
        this.state.movementBehavior = 'orbit';
        this.state.focusTarget = params.target;
        this.state.orbitAxis = params.axis as any;
    }

    // ========================================================================
    // Memory/Library Handlers
    // ========================================================================

    private handleSave(params: { kind: 'animation' | 'state'; tags?: string[] }): void {
        const snapshot = { ...this.state };
        const key = params.tags?.join('_') || Date.now().toString();
        this.motionLibrary.set(key, { snapshot, kind: params.kind, tags: params.tags });
        console.log(`[VizzyOrchestrator] 💾 Saved ${params.kind} as:`, key);
    }

    private handleRecall(params: { tags: string[]; top_k?: number }): void {
        const query = params.tags.join('_');
        const match = this.motionLibrary.get(query);
        if (match) {
            this.state = { ...match.snapshot };
            console.log(`[VizzyOrchestrator] 🔄 Recalled state:`, query);
        } else {
            console.warn(`[VizzyOrchestrator] ⚠️ No match found for:`, params.tags);
        }
    }

    private handleTag(params: { tags: string[] }): void {
        console.log('[VizzyOrchestrator] 🏷️  Tagged current state:', params.tags);
    }

    // ========================================================================
    // Debug Handlers
    // ========================================================================

    private handleDump(params: { what: 'knobs' | 'motion'; format?: 'json' | 'text' }): void {
        if (params.what === 'motion') {
            console.log('[VizzyOrchestrator] 🔍 Current State:', this.state);
        } else if (params.what === 'knobs') {
            console.log('[VizzyOrchestrator] 🎚️  Motion Library:', Array.from(this.motionLibrary.entries()));
        }
    }

    private handleTrace(params: { what: 'motion' | 'last' | 'chain'; depth?: number }): void {
        const depth = params.depth || 10;
        const recent = this.toolCallHistory.slice(-depth);
        console.log(`[VizzyOrchestrator] 📜 Tool Call History (last ${depth}):`, recent);
    }

    // ========================================================================
    // UI Interaction Handlers
    // ========================================================================

    private handleStealColor(params: { color?: string; target_panel?: string }): void {
        console.log('[VizzyOrchestrator] 🎨 Vizzy is stealing a color!', params);
        window.dispatchEvent(new CustomEvent('vizzy-logic-steal', {
            detail: {
                color: params.color,
                panelId: params.target_panel
            }
        }));
    }

    private handleReturnColor(params: { target_panel?: string }): void {
        console.log('[VizzyOrchestrator] 🎨 Vizzy is returning a color!', params);
        window.dispatchEvent(new CustomEvent('vizzy-logic-return', {
            detail: {
                panelId: params.target_panel
            }
        }));
    }

    private handleAdoptColor(params: { color: string; target_panel: string }): void {
        console.log('[VizzyOrchestrator] 🎨 Vizzy is adopting a color!', params);
        window.dispatchEvent(new CustomEvent('vizzy-logic-adopt', {
            detail: {
                color: params.color,
                panelId: params.target_panel
            }
        }));
    }

    private handleSetQuestFlag(params: { flag: string; value: boolean | string }): void {
        console.log(`[VizzyOrchestrator] 🚩 Setting Quest Flag: ${params.flag} = ${params.value}`);
        window.dispatchEvent(new CustomEvent('game-flag-update', {
            detail: {
                flag: params.flag,
                value: params.value
            }
        }));
    }

    // ========================================================================
    // Vizzy Sync
    // ========================================================================

    /**
     * Sync current state to Vizzy via custom events
     */
    private syncToVizzy(): void {
        const event = new CustomEvent('vizzy-state-update', {
            detail: {
                state: this.state,
                timestamp: Date.now(),
            },
        });

        window.dispatchEvent(event);
        console.log('[VizzyOrchestrator] 📡 State synced to Vizzy');
    }

    /**
     * Get current state (for debugging)
     */
    getState(): VizzyState {
        return { ...this.state };
    }

    /**
     * Get tool call history
     */
    getHistory(limit?: number): VizzyToolCallEvent[] {
        return limit ? this.toolCallHistory.slice(-limit) : [...this.toolCallHistory];
    }
}

// Singleton instance
export const vizzyOrchestrator = new VizzyOrchestrator();
