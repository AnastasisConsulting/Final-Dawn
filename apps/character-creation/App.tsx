// apps/character-creation/App.tsx

import React, { useState, useCallback } from 'react';
import { TerminalWrapper } from './components/TerminalWrapper';
import {
  IntroStage,
  QuestionStage,
  ClassSelectionStage,
  SubSelectionStage,
  SummaryStage
} from './components/Stages';
import {
  AppStage,
  Character,
  Attribute,
  CoreClass,
  QuestionData,
  Affinity,
  CrossId
} from './types';
import { XP_TABLE } from './constants';
import { generateSardonicQuestion } from './services/geminiService';

import SplashScreen from './components/SplashScreen';
import StartScreen from './components/StartScreen';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.INTRO);
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [character, setCharacter] = useState<Character>({
    name: `UNIT-${Math.floor(Math.random() * 9000) + 1000}`,
    affinity: Attribute.NONE,
    coreClass: null,
    subAffinity: null,
    crossId: null,
    level: 1,
    xp: 0
  });

  // Root entry flow: Splash -> Start -> Character creation
  const [bootStage, setBootStage] = useState<AppStage>(AppStage.SPLASH);

  const handleStart = useCallback(async () => {
    setStage(AppStage.QUESTION_LOADING);
    const data = await generateSardonicQuestion();
    setQuestionData(data);
    setStage(AppStage.QUESTION);
  }, []);

  const handleAnswer = (affinity: Attribute) => {
    setCharacter(prev => ({ ...prev, affinity }));
    setStage(AppStage.CLASS_SELECTION);
  };

  const handleClassSelect = (coreClass: CoreClass) => {
    // Reset downstream identity when core changes.
    setCharacter(prev => ({ ...prev, coreClass, subAffinity: null, crossId: null }));
    setStage(AppStage.SUB_SELECTION);
  };

  const handleSubSelect = (subAffinity: Affinity) => {
    setCharacter(prev => {
      const core = prev.coreClass;
      const coreAff: Affinity | null =
        core === CoreClass.REBEL ? Affinity.STR :
          core === CoreClass.ACOLYTE ? Affinity.INT :
            core === CoreClass.HACKER ? Affinity.DEX :
              null;

      const crossId: CrossId | null = coreAff ? (`${coreAff}_${subAffinity}` as CrossId) : null;
      return { ...prev, subAffinity, crossId };
    });
    setStage(AppStage.SUMMARY);
  };

  // Splash/Start are true root screens (no terminal wrapper).
  if (bootStage === AppStage.SPLASH) {
    return <SplashScreen onBegin={() => setBootStage(AppStage.START)} />;
  }

  if (bootStage === AppStage.START) {
    return (
      <StartScreen
        onStartNewGame={() => {
          setBootStage(AppStage.INTRO);
          setStage(AppStage.INTRO);
        }}
        onLoadSavedGame={() => {
          // Placeholder: load not wired in this app yet.
          alert('Load game not implemented yet.');
        }}
      />
    );
  }

  return (
    <TerminalWrapper>
      {stage === AppStage.INTRO && (
        <IntroStage onStart={handleStart} loading={false} />
      )}

      {stage === AppStage.QUESTION_LOADING && (
        <IntroStage onStart={() => { }} loading={true} />
      )}

      {stage === AppStage.QUESTION && questionData && (
        <QuestionStage
          data={questionData}
          onAnswer={handleAnswer}
        />
      )}

      {stage === AppStage.CLASS_SELECTION && (
        <ClassSelectionStage
          affinity={character.affinity}
          onSelect={handleClassSelect}
        />
      )}

      {stage === AppStage.SUB_SELECTION && character.coreClass && (
        <SubSelectionStage
          coreClass={character.coreClass}
          onSelect={handleSubSelect}
        />
      )}

      {stage === AppStage.SUMMARY && (
        <SummaryStage
          character={character}
          table={XP_TABLE}
        />
      )}
    </TerminalWrapper>
  );
};

export default App;