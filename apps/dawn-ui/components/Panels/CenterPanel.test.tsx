/// <reference types="@testing-library/jest-dom" />
// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { CenterPanel } from './CenterPanel';

// extend expect for everyone
expect.extend(matchers);

// Mock dependencies
vi.mock('../../../services/orchestrator', () => ({
    runTurn: vi.fn(),
    initializeSession: vi.fn(),
}));

// Full mock for hooks/useKernel to avoid loading its imports
vi.mock('../../hooks/useKernel', () => ({
    useKernel: () => ({
        loadLocationFromAddress: vi.fn(),
        state: {
            isWarping: false,
            navContext: { sessionId: 'test-session' },
            address: { full: 'test-address' }
        },
        dispatch: vi.fn(),
    }),
}));

// Mock the problematic dependencies just to be safe
vi.mock('@eideus/universe-mapper', () => ({ CoordinateMapper: {} }));
vi.mock('@eideus/world-bundle-binder', () => ({ bindWorldBundle: vi.fn() }));

vi.mock('../../../services/VizzyOrchestrator', () => ({
    vizzyOrchestrator: {
        analyze: vi.fn(),
        speak: vi.fn(),
        processToolCalls: vi.fn(),
    },
}));

// Mock fetch for Ollama
global.fetch = vi.fn();

describe('CenterPanel - AutoPilot Bot Safety', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('does NOT trigger autonomous loop by default', async () => {
        render(<CenterPanel activeTarget="navbot" onTargetSelect={() => { }} />);

        // Wait a moment to ensure no fetch calls happen immediately
        await new Promise(r => setTimeout(r, 100));

        expect(global.fetch).not.toHaveBeenCalledWith(
            'http://localhost:11434/api/generate',
            expect.anything()
        );
    });

    it('triggers autonomous loop when enabled via command', async () => {
        render(<CenterPanel activeTarget="navbot" onTargetSelect={() => { }} />);

        const input = screen.getByPlaceholderText(/Enter command/i);
        fireEvent.change(input, { target: { value: '/beta-test VANGUARD STR' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Verify indicator appears
        await waitFor(() => {
            expect(screen.getByText(/BETA AUTOMATION ENGAGED/i)).toBeInTheDocument();
        });
    });

    it('stops autonomous loop via /stop-bot command', async () => {
        // Pre-seed state in localStorage to simulate running bot
        localStorage.setItem('eideus-autopilot', JSON.stringify({
            enabled: true,
            class: 'HACKER',
            affinity: 'INT',
            questsCompleted: 2
        }));

        render(<CenterPanel activeTarget="navbot" onTargetSelect={() => { }} />);

        // Verify it starts enabled
        expect(screen.getByText(/BETA AUTOMATION ENGAGED/i)).toBeInTheDocument();

        // Send stop command
        const input = screen.getByPlaceholderText(/Enter command/i);
        fireEvent.change(input, { target: { value: '/stop-bot' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        // Verify it stops (indicator removed)
        await waitFor(() => {
            expect(screen.queryByText(/BETA AUTOMATION ENGAGED/i)).not.toBeInTheDocument();
        });

        // Check localStorage was updated
        const state = JSON.parse(localStorage.getItem('eideus-autopilot') || '{}');
        expect(state.enabled).toBe(false);
    });
});
