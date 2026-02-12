// src/features/game/App.tsx
import React, { useState, useReducer, useEffect } from 'react';
import { GameMode, Difficulty, Axis } from './types'; 

// Components
import { Header } from './ui/Header'; 
import { Sidebar, ViewMode } from './ui/Sidebar'; 
import Board3D from './core/Board3D';
import Board2D from './core/Board2D';
import SliceNavigator from './ui/SliceNavigator';
import StrategicRadar from './ui/StrategicRadar';
import MetricsDashboard from './ui/MetricsDashboard';
import TeamOverview from './ui/TeamOverview';
import LayerMap from './ui/LayerMap';
import Roster from './ui/Roster';
import HelpSection from './ui/HelpSection';
import { SkillTree } from './ui/SkillTree'; 
import { NewGameModal } from './ui/NewGameModal';
import { PromotionModal } from './ui/PromotionModal';
import { Graveyard, PhaseIndicator, ControlsHelp } from './ui/GameHUD';

// Logic Hooks & Reducers
import { useCubexEngine } from './hooks/useCubexEngine';
import { gameReducer } from './state/gameReducer';
// [FIX] Direct import to match Reducer and avoid circularity
import { getInitialGameState } from './core/game_logic/gameStateInitializer';
import { useAILoop } from './ai/useAILoop'; 

// Vantage Chat
import PieceVantageChat from './ui/PieceVantageChat'; 
import { useVantageChat } from './hooks/useVantageChat'; 

export default function GameModule() {
  const [state, dispatch] = useReducer(gameReducer, getInitialGameState());
  
  // --- [FIX] ACTIVATE AI LOOP ---
  useAILoop(state, dispatch);

  const { engine } = useCubexEngine(8); 
  
  const { 
    messages: chatMessages, 
    sendMessage: sendVantageMessage, 
    isLoading: isChatLoading, 
    activePiece: selectedPiece 
  } = useVantageChat(state, engine as any); 

  const [viewMode, setViewMode] = useState<ViewMode>('3D');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false); 
  const [activeAxis, setActiveAxis] = useState<Axis>('Z');
  const [activeLayer, setActiveLayer] = useState<number>(3); 

  // --- [FIX] INTERACTION GUARD ---
  // If it is HvAI mode and it is Black's turn, lock the UI.
  const isAiTurn = state.gameMode === 'HvAI' && state.turn === 'black';

  const handleStartGame = (mode: GameMode, diff: Difficulty) => {
    console.log("Starting Game:", mode, diff);
    dispatch({ type: 'RESET', mode, difficulty: diff });
    setShowNewGameModal(false);
  };

  const handleSelect = (id: string) => {
    if (isAiTurn) return; // Block human selection during AI turn
    dispatch({type: 'SELECT_PIECE', id})
  };

  const handleMove = (to: any) => {
      if (isAiTurn) return; // Block human movement during AI turn
      dispatch({ type: 'MOVE_PIECE', to });
  };

  // Mock progression
  const playerLevel = 5;
  const skillPoints = 3;
  const unlockedSkills = ['foundations_1'];
  const handleUnlockSkill = (skillId: string, cost: number) => console.log(`Unlock ${skillId}`);

  const isChatVisible = !!selectedPiece && viewMode !== 'HELP' && viewMode !== 'SKILLS' && !showNewGameModal && !state.pendingPromotion;

  const dashboardProps = {
    matchStats: state.matchStats,
    detailedMetrics: state.detailedMetrics,
    whiteStats: state.whiteStats,
    blackStats: state.blackStats,
    boardLayers: state.boardLayers
  };

  return (
    <div className="flex flex-col h-full w-full bg-black text-slate-200 overflow-hidden">
      <Header 
        state={state} 
        onNewGame={() => setShowNewGameModal(true)} 
        onToggleDashboard={() => setShowDashboard(!showDashboard)}
        showDashboard={showDashboard}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar currentMode={viewMode} onChange={setViewMode} />

        <div className="flex-1 relative bg-black/50">
           {showNewGameModal && (
               <NewGameModal onStart={handleStartGame} onCancel={() => setShowNewGameModal(false)} />
           )}
           {state.pendingPromotion?.active && (
               <PromotionModal state={state} dispatch={dispatch} />
           )}

           {viewMode !== 'HELP' && viewMode !== 'SKILLS' && (
               <>
                   <div className="absolute top-4 left-4 z-10 pointer-events-none">
                       <Graveyard pieces={state.capturedPieces.filter(p => p.color === 'white')} color="white" />
                   </div>
                   <div className="absolute top-4 right-4 z-10 pointer-events-none">
                        <Graveyard pieces={state.capturedPieces.filter(p => p.color === 'black')} color="black" />
                   </div>
                   {state.turnPhase?.active && <PhaseIndicator phase={state.turnPhase} />}
                   <ControlsHelp />
                   
                   <div className="absolute bottom-4 right-4 z-20">
                        <SliceNavigator 
                            activeAxis={activeAxis} 
                            activeLayer={activeLayer}
                            onAxisChange={setActiveAxis}
                            onLayerChange={setActiveLayer}
                        />
                   </div>
               </>
           )}

           {isChatVisible && selectedPiece && (
               <div className="absolute bottom-4 left-4 z-40">
                   <PieceVantageChat
                       pieceId={selectedPiece.id}
                       pieceName={selectedPiece.type}
                       pieceColor={selectedPiece.color}
                       pieceType={selectedPiece.type}
                       isLoading={isChatLoading}
                       onSendMessage={sendVantageMessage}
                       messages={chatMessages}
                   />
               </div>
           )}

           {viewMode === '3D' && (
               <Board3D 
                 state={state} 
                 onSelect={handleSelect}
                 onMove={handleMove}
                 activeAxis={activeAxis}
                 activeLayer={activeLayer}
               />
           )}
           {viewMode === '2D' && (
               <Board2D 
                 state={state} 
                 onSelect={handleSelect}
                 onMove={handleMove}
                 axis={activeAxis}
                 layer={activeLayer}
               />
           )}
           {viewMode === 'SKILLS' && (
               <SkillTree 
                   currentLevel={playerLevel}
                   availableSP={skillPoints}
                   unlockedSkills={unlockedSkills}
                   onUnlock={handleUnlockSkill}
               />
           )}
           {viewMode === 'HELP' && <HelpSection />}
        </div>

        {showDashboard && (
            <aside className="w-[400px] border-l border-cyber-700 bg-cyber-900/90 backdrop-blur-xl flex flex-col transition-all z-30 shadow-2xl">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    <div className="h-[400px]">
                        <StrategicRadar matchStats={dashboardProps.matchStats} />
                    </div>
                    <TeamOverview white={dashboardProps.whiteStats} black={dashboardProps.blackStats} />
                    <div className="h-[400px]">
                         <MetricsDashboard metrics={dashboardProps.detailedMetrics} />
                    </div>
                    <div className="h-[300px]">
                        <LayerMap layers={dashboardProps.boardLayers} />
                    </div>
                    <div className="h-[400px]">
                        <Roster pieces={state.pieceTelemetry as any} /> 
                    </div>
                </div>
            </aside>
        )}
      </div>
    </div>
  );
}