import React, { useState } from 'react';

const DevButton: React.FC<{ label: string; onClick: React.MouseEventHandler<HTMLButtonElement>; color?: 'cyan' | 'red' | 'yellow' | 'green' }> = ({ label, onClick, color = 'cyan' }) => {
    const colors = {
        cyan: 'border-cyan-800 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-500 hover:text-cyan-100',
        red: 'border-red-900 text-red-400 hover:bg-red-900/50 hover:border-red-500 hover:text-red-100',
        yellow: 'border-yellow-900 text-yellow-400 hover:bg-yellow-900/50 hover:border-yellow-500 hover:text-yellow-100',
        green: 'border-green-900 text-green-400 hover:bg-green-900/50 hover:border-green-500 hover:text-green-100',
    };
    return (
        <button
            onClick={onClick}
            className={`border px-2 py-1.5 rounded transition-all text-left uppercase tracking-wider text-[9px] ${colors[color]}`}
        >
            {label}
        </button>
    );
};

export const DevOverlay: React.FC<{ show: boolean }> = ({ show }) => {
    const [betaStage, setBetaStage] = useState(0); // 0=Home, 1=Class, 2=Affinity, 3=Turns
    const [betaClass, setBetaClass] = useState('');
    const [betaAffinity, setBetaAffinity] = useState('');
    const [isCustomInput, setIsCustomInput] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [customCommand, setCustomCommand] = useState('');

    const execute = (cmd: string) => {
        window.dispatchEvent(new CustomEvent('execute-dev-command', { detail: cmd }));
    };

    const handleBetaReset = () => {
        setBetaStage(0);
        setBetaClass('');
        setBetaAffinity('');
        setIsCustomInput(false);
        setInputValue('');
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        execute(`${customCommand} ${inputValue}`);
        setIsCustomInput(false);
        setInputValue('');
        setCustomCommand('');
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-24 left-8 z-[200] font-mono text-[10px] text-cyan-300 transition-opacity duration-300 pointer-events-auto">
            <div className="bg-black/90 backdrop-blur-md p-4 rounded border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] min-w-[200px] flex flex-col gap-2">
                <h3 className="font-bold text-cyan-100 border-b border-cyan-800 pb-1 flex justify-between items-center">
                    <span>DEV PROTOCOLS</span>
                    {betaStage > 0 && (
                        <button onClick={handleBetaReset} className="text-red-400 hover:text-red-300 text-[9px] uppercase tracking-wider">
                            [RESET]
                        </button>
                    )}
                    <span className="text-[9px] text-cyan-600">v0.9.5</span>
                </h3>

                {/* MAIN MENU */}
                {betaStage === 0 && !isCustomInput && (
                    <div className="grid grid-cols-2 gap-2">
                        <DevButton label="TEST HEIST (VISUAL)" onClick={() => window.dispatchEvent(new CustomEvent('vizzy-logic-steal', { detail: {} }))} color="red" />
                        <DevButton label="BETA TEST WIZARD" onClick={() => setBetaStage(1)} color="yellow" />
                        <DevButton label="STOP BOT" onClick={() => execute('/stop-bot')} color="red" />
                        <DevButton label="LANDING GAME" onClick={() => execute('/landing-game')} />
                        <DevButton label="WARP..." onClick={() => { setCustomCommand('/warp'); setIsCustomInput(true); }} />
                        <DevButton label="TELEMETRY" onClick={() => execute('/telemetry')} />
                        <DevButton label="SIM COMBAT (5)" onClick={() => execute('/sim-combat 5')} />
                        <DevButton label="SPAWN LOOT" onClick={() => execute('/spawn-loot RARE')} />
                        <DevButton label="FORCE LEVEL..." onClick={() => { setCustomCommand('/force-level'); setIsCustomInput(true); }} />
                        <DevButton label="QUEST STATUS" onClick={() => execute('/quest-status')} />
                        <DevButton label="TRIGGER HEIST" onClick={() => window.dispatchEvent(new CustomEvent('vizzy-logic-steal', { detail: {} }))} color="yellow" />
                        <DevButton label="SAVE GAME" onClick={() => execute('/save')} color="green" />
                        <DevButton label="RESET SAVE" onClick={() => execute('/reset-save')} color="red" />
                        <DevButton label="EXPORT LOGS" onClick={() => execute('/export-logs')} />
                    </div>
                )}

                {/* CUSTOM INPUT (Warp, Level) */}
                {isCustomInput && (
                    <form onSubmit={handleCustomSubmit} className="flex flex-col gap-2">
                        <div className="text-cyan-400">{customCommand} [ARG]</div>
                        <input
                            autoFocus
                            className="bg-black/50 border border-cyan-700 text-cyan-100 p-1 rounded focus:border-cyan-400 outline-none"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Value..."
                        />
                        <div className="flex gap-2">
                            <DevButton label="CANCEL" onClick={() => { setIsCustomInput(false); setCustomCommand(''); }} color="red" />
                            <DevButton label="EXECUTE" onClick={(e: any) => handleCustomSubmit(e)} color="green" />
                        </div>
                    </form>
                )}

                {/* BETA WIZARD: STAGE 1 - CLASS */}
                {betaStage === 1 && (
                    <div className="flex flex-col gap-2">
                        <div className="text-yellow-400 font-bold">SELECT CLASS</div>
                        <DevButton label="REBEL" onClick={() => { setBetaClass('REBEL'); setBetaStage(2); }} />
                        <DevButton label="ACOLYTE" onClick={() => { setBetaClass('ACOLYTE'); setBetaStage(2); }} />
                        <DevButton label="HACKER" onClick={() => { setBetaClass('HACKER'); setBetaStage(2); }} />
                    </div>
                )}

                {/* BETA WIZARD: STAGE 2 - AFFINITY */}
                {betaStage === 2 && (
                    <div className="flex flex-col gap-2">
                        <div className="text-yellow-400 font-bold">SELECT AFFINITY</div>
                        <DevButton label="STR (Strength)" onClick={() => { setBetaAffinity('STR'); setBetaStage(3); }} />
                        <DevButton label="INT (Intelligence)" onClick={() => { setBetaAffinity('INT'); setBetaStage(3); }} />
                        <DevButton label="DEX (Dexterity)" onClick={() => { setBetaAffinity('DEX'); setBetaStage(3); }} />
                    </div>
                )}

                {/* BETA WIZARD: STAGE 3 - TURNS */}
                {betaStage === 3 && (
                    <div className="flex flex-col gap-2">
                        <div className="text-yellow-400 font-bold">TURN LIMIT</div>
                        <input
                            autoFocus
                            type="number"
                            className="bg-black/50 border border-cyan-700 text-cyan-100 p-1 rounded focus:border-cyan-400 outline-none"
                            placeholder="Enter turns (e.g. 50)"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const turns = parseInt(e.currentTarget.value) || 0;
                                    execute(`/beta-test ${betaClass} ${betaAffinity} ${turns}`);
                                    handleBetaReset();
                                }
                            }}
                        />
                        <div className="text-[9px] text-cyan-600">Press ENTER to launch</div>
                    </div>
                )}
            </div>
        </div>
    );
};
