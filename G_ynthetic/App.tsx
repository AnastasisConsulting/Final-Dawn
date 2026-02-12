// G_ynthetic/App.tsx
import React, { useCallback, useState } from 'react';
import { useMemoryCore } from './hooks/useMemoryCore';
import { useConfig } from './hooks/useConfig';
import { ConfigModal } from './components/ConfigModal';
import { LatticeVisualizer } from './components/LatticeVisualizer';
import { NodeDetail } from './components/NodeDetail';
import { AvatarDisplay } from './components/AvatarDisplay';
import { CreatorPanel } from './components/CreatorPanel'; // Import CreatorPanel
import { AIProvider } from './types';

const App = () => {
    // --- Hook Integration ---
    const memory = useMemoryCore();
    const config = useConfig();

    const {
        lattices, registry, linearLog, input, setInput, isLoading, bottomRef,
        isQuantumMode, toggleQuantumMode, quantumSlice, viewLatticeIndex, setViewLatticeIndex,
        selectedNode, setSelectedNode, handleSendMessage, setIsLoading,
        setLattices, setRegistry, setLinearLog, setIsQuantumMode 
    } = memory;
    
    // Memory state and setters object for passing to config handlers
    const memoryState = { lattices, registry, linearLog, isQuantumMode, viewLatticeIndex };
    const memorySetters = { setLattices, setRegistry, setLinearLog, setIsQuantumMode, setViewLatticeIndex };

    const {
        rpConfig, setRpConfig, tempConfig, setTempConfig, pendingFirstMes, setPendingFirstMes,
        showConfig, setShowConfig, aiProvider, handleWarmup, setActiveTab, activeTab,
    } = config;
    
    const [showCreator, setShowCreator] = useState(false); // NEW STATE for Split View

    // RESTORED COLORS: Cyan, Purple, Blue, Green (No Orange/Pink)
    const globalTabs: { id: 'persona' | 'simulation' | 'llm' | 'library' | 'creator', label: string, color: string }[] = [
        { id: 'persona', label: 'PLAYER', color: 'cyan' },
        { id: 'simulation', label: 'WORLD', color: 'purple' },
        { id: 'llm', label: 'SYSTEM', color: 'blue' },
        { id: 'library', label: 'LIBRARY', color: 'green' },
        { id: 'creator', label: 'CREATOR', color: 'purple' },
    ];

    // 1. Send Message Dispatcher
    const handleSend = useCallback(() => {
        handleSendMessage(rpConfig, {
            aiProvider: config.aiProvider,
            systemInstruction: '', 
            geminiApiKey: config.geminiApiKey,
            openaiApiKey: config.openaiApiKey,
            anthropicApiKey: config.anthropicApiKey,
            ollamaUrl: config.ollamaUrl,
            ollamaModel: config.ollamaModel,
            
            // F.R.A.C.C. Flags
            useFractalOrchestration: config.useFractalOrchestration,
            useFastPath: config.useFastPath,
            useCoralScorer: config.useCoralScorer,
            usePhaseAgents: config.usePhaseAgents,
            useDecomposerSynthesizer: config.useDecomposerSynthesizer,
            
            // F.R.A.C.C. Agent Models
            ollamaDecomposerModel: config.ollamaDecomposerModel,
            ollamaPhase1Model: config.ollamaPhase1Model,
            ollamaPhase2Model: config.ollamaPhase2Model,
            ollamaPhase3Model: config.ollamaPhase3Model,
            ollamaSynthesizerModel: config.ollamaSynthesizerModel,
        });
    }, [rpConfig, config, handleSendMessage]);

    // 2. Config Modal Handlers
    const saveConfig = useCallback(() => {
        setRpConfig(tempConfig);
        setShowConfig(false);
        if (pendingFirstMes) {
            memory.setLinearLog([{ role: 'model', text: pendingFirstMes, name: tempConfig.aiName, avatar: tempConfig.avatar }]);
            setPendingFirstMes(null);
        }
    }, [tempConfig, setRpConfig, setShowConfig, pendingFirstMes, memory.setLinearLog, setPendingFirstMes]);

    const cancelConfig = useCallback(() => {
        setShowConfig(false);
        setTempConfig(rpConfig);
    }, [setShowConfig, setTempConfig, rpConfig]);

    const handleWarmupProxy = async () => {
        setIsLoading(true);
        try {
            await handleWarmup();
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-screen w-screen bg-black flex overflow-hidden font-sans text-neutral-200 selection:bg-cyan-500/30">
            
            {/* LEFT: Visualization OR Creator Pane */}
            <div className="w-1/2 h-full border-r border-white/10 relative flex flex-col bg-gradient-to-br from-neutral-900 via-black to-neutral-900">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>

                {showCreator ? (
                    // Show Creator Interface
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="p-4 border-b border-purple-500/30 bg-purple-900/20 backdrop-blur-md">
                            <h2 className="text-lg font-bold text-purple-400 tracking-widest flex justify-between items-center">
                                CREATOR INTERFACE
                                <button onClick={() => setShowCreator(false)} className="text-xs text-purple-300 hover:text-white">[CLOSE]</button>
                            </h2>
                        </div>
                        <CreatorPanel config={config} />
                    </div>
                ) : (
                    // Show Memory Cube
                    <LatticeVisualizer 
                        lattice={isQuantumMode ? quantumSlice : lattices[viewLatticeIndex] || []}
                        totalLattices={lattices.length}
                        currentViewIndex={viewLatticeIndex}
                        isQuantumMode={isQuantumMode}
                        registry={registry}
                        onNodeClick={setSelectedNode}
                        onChangeLatticeView={setViewLatticeIndex}
                    />
                )}
            </div>

            {/* RIGHT: Interface Pane */}
            <div className="w-1/2 h-full flex flex-col bg-black/90 relative">
                
                {/* HEADER / CONTROLLER */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0 bg-black/80 backdrop-blur-sm z-10">
                    
                    {/* Left Side: Identity */}
                    <div className="flex items-center gap-3 flex-shrink-0 mr-4">
                        <AvatarDisplay name={rpConfig.aiName} avatar={rpConfig.avatar} size="sm" />
                        <div className="flex flex-col overflow-hidden">
                            <h1 className="font-bold tracking-widest text-sm md:text-base text-white leading-none truncate max-w-[150px]">
                                {rpConfig.worldName.toUpperCase()}
                            </h1>
                            <span className="text-[9px] text-neutral-500 font-mono">
                                MEM: {lattices.flat().length} | {aiProvider.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    {/* Right Side: Controls */}
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide mask-linear-fade">
                        
                        {/* Tabs */}
                        <div className="flex gap-1 bg-neutral-800/50 p-1 rounded border border-white/5 flex-shrink-0">
                            {globalTabs.map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => {
                                        config.setTempConfig(rpConfig);
                                        setShowConfig(true);
                                        setActiveTab(tab.id);
                                        config.fetchOllamaModels(); 
                                    }}
                                    className={`px-2 py-1 text-[9px] font-bold rounded transition-all whitespace-nowrap ${
                                        activeTab === tab.id && showConfig
                                            ? `bg-${tab.color}-700 text-white`
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Creator Split Toggle */}
                        <button
                            onClick={() => setShowCreator(!showCreator)}
                            className={`px-3 py-1 text-[9px] font-bold tracking-wider border transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                                showCreator
                                ? 'border-purple-500 text-purple-400 bg-purple-900/20'
                                : 'border-neutral-700 text-neutral-500 hover:border-purple-500 hover:text-purple-400'
                            }`}
                        >
                            {showCreator ? 'HIDE CREATOR' : '✎ CREATOR'}
                        </button>

                        {/* Recall Toggle */}
                        <button 
                            onClick={toggleQuantumMode}
                            className={`px-3 py-1 text-[9px] font-bold tracking-wider border transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                                isQuantumMode 
                                ? 'border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)] bg-purple-900/20' 
                                : 'border-neutral-700 text-neutral-500 hover:border-cyan-500 hover:text-cyan-400'
                            }`}
                        >
                            {isQuantumMode ? '⚡ COLLAPSE' : '○ RECALL'}
                        </button>
                    </div>
                </div>

                {/* Chat Log */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative">
                    {linearLog.length === 0 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-30 pointer-events-none select-none">
                            <div className="text-6xl mb-4 text-cyan-900 animate-pulse">⌬</div>
                            <p className="text-xs font-mono tracking-[0.2em]">INITIALIZING PROTOCOLS</p>
                        </div>
                    )}
                    
                    {linearLog.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="flex-shrink-0 mt-1">
                                <AvatarDisplay name={msg.name || (msg.role === 'user' ? 'User' : 'AI')} avatar={msg.avatar} size="md" />
                            </div>

                            <div className={`max-w-[80%] p-4 rounded-sm border text-sm leading-relaxed shadow-lg ${
                                msg.role === 'user' 
                                ? 'border-cyan-900/50 bg-cyan-950/10 text-cyan-100' 
                                : msg.role === 'system'
                                ? 'border-red-900/50 text-red-400 font-mono bg-red-950/10'
                                : 'border-white/10 bg-neutral-900/40 text-gray-300 backdrop-blur-sm'
                            }`}>
                                <div className="text-[9px] uppercase tracking-widest opacity-40 mb-2 font-mono flex justify-between">
                                    <span>{msg.role === 'user' ? (msg.name || 'User') : (msg.name || 'G_SYNTHETIC')}</span>
                                </div>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start ml-14 opacity-70">
                            <div className="text-cyan-500 text-xs font-mono animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></span>
                                GENERATING RESPONSE...
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/10 bg-neutral-900/50 flex-shrink-0 backdrop-blur-md">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                            placeholder={`Command / Action...`}
                            className="relative w-full bg-black border border-neutral-800 p-4 pr-16 text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono rounded-sm"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !input}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-neutral-500 p-2 transition-colors"
                        >
                            ⏎
                        </button>
                    </div>
                </div>

                {/* Overlays */}
                <NodeDetail 
                    node={selectedNode} 
                    registry={registry} 
                    onClose={() => setSelectedNode(null)} 
                />

                <ConfigModal 
                    config={{ 
                        ...config, 
                        handleWarmup: handleWarmupProxy,
                        memoryState,
                        memorySetters
                    }} 
                    onApplySettings={saveConfig}
                    onCancel={cancelConfig}
                />

            </div>
        </div>
    );
};

export default App;