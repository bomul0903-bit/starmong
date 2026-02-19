import React, { useState, useEffect } from 'react';
import {
  isValidConnection,
  isLineAlreadyDrawn,
  calculateFinishBonus,
  isGameComplete,
  handleMistake as handleMistakeLogic,
  calculateUndo,
} from './lib/gameLogic';
import SoundEngine from './lib/soundEngine';
import { STAGES, MAX_MISTAKES } from './lib/constants';
import { supabase } from './lib/supabase';
import BackgroundStars from './components/BackgroundStars';
import TopBar from './components/TopBar';
import LoginView from './components/LoginView';
import MenuView from './components/MenuView';
import MapView from './components/MapView';
import GameView from './components/GameView';
import EduCardModal from './components/EduCardModal';
import FailCardModal from './components/FailCardModal';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('menu');
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('starmong-completed')) || []; }
    catch { return []; }
  });
  const [currentLevel, setCurrentLevel] = useState(null);
  const [activeStarId, setActiveStarId] = useState(null);
  const [selectedStars, setSelectedStars] = useState([]);
  const [lines, setLines] = useState([]);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(() => {
    try { return parseInt(localStorage.getItem('starmong-score')) || 0; }
    catch { return 0; }
  });
  const [isGameActive, setIsGameActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showEduCard, setShowEduCard] = useState(false);
  const [showFailCard, setShowFailCard] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [dogMsg, setDogMsg] = useState("안녕! 별 여행을 떠나볼까?");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let timer;
    if (isGameActive) timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isGameActive]);

  useEffect(() => {
    try { localStorage.setItem('starmong-completed', JSON.stringify(completed)); }
    catch { /* quota exceeded / private mode */ }
  }, [completed]);

  useEffect(() => {
    try { localStorage.setItem('starmong-score', String(score)); }
    catch { /* quota exceeded / private mode */ }
  }, [score]);

  const startGame = (level) => {
    SoundEngine.buttonClick();
    setCurrentLevel(level);
    setActiveStarId(null);
    setSelectedStars([]);
    setLines([]);
    setTime(0);
    setIsGameActive(true);
    setShowHint(false);
    setShowFailCard(false);
    setMistakes(0);
    setView('game');
    setDogMsg(`${level.name}의 정확한 위상을 연결해봐!`);
  };

  const finishGame = () => {
    SoundEngine.gameComplete();
    setIsGameActive(false);
    setScore(s => s + calculateFinishBonus(time));
    if (!completed.includes(currentLevel.id)) setCompleted([...completed, currentLevel.id]);
    setTimeout(() => setShowEduCard(true), 800);
  };

  const handleStarClick = (starId) => {
    if (!isGameActive) return;

    if (activeStarId === null) {
      SoundEngine.buttonClick();
      setActiveStarId(starId);
      setSelectedStars([starId]);
      setDogMsg("첫 번째 별을 찾았어! 이제 다음 별로 이어줘.");
      return;
    }

    if (activeStarId === starId) return;

    const alreadyDrawn = isLineAlreadyDrawn(activeStarId, starId, lines);
    if (alreadyDrawn) {
      setActiveStarId(starId);
      return;
    }

    const isValid = isValidConnection(activeStarId, starId, currentLevel.path);
    if (isValid) {
      SoundEngine.starConnect();
      const newLines = [...lines, [activeStarId, starId]];
      setLines(newLines);
      if (!selectedStars.includes(starId)) setSelectedStars([...selectedStars, starId]);
      setActiveStarId(starId);
      setScore(s => s + 150);
      if (isGameComplete(newLines.length, currentLevel.path.length)) finishGame();
    } else {
      const { newCount: newMistakes, isFailed } = handleMistakeLogic(mistakes, MAX_MISTAKES);
      setMistakes(newMistakes);
      if (isFailed) {
        SoundEngine.gameFail();
        setIsGameActive(false);
        setShowFailCard(true);
        setDogMsg("3번 틀렸어... 다시 도전해볼까?");
      } else {
        SoundEngine.mistake();
        setDogMsg(`앗! 그 길은 아니야! (남은 기회: ${MAX_MISTAKES - newMistakes}번)`);
      }
    }
  };

  const triggerHint = () => {
    SoundEngine.buttonClick();
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2000);
  };

  const handleUndo = () => {
    if (!isGameActive) return;
    const result = calculateUndo(lines, selectedStars, score);
    if (!result) return;
    SoundEngine.buttonClick();
    setLines(result.newLines);
    setSelectedStars(result.newSelectedStars);
    setActiveStarId(result.newActiveStarId);
    setScore(result.newScore);
    setDogMsg("마지막 연결을 취소했어!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <BackgroundStars />
        <div className="text-yellow-400 text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] text-white font-sans overflow-hidden flex flex-col items-center">
        <BackgroundStars />
        <div className="flex-1 w-full max-w-md relative flex flex-col">
          <LoginView />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-hidden flex flex-col items-center">
      <BackgroundStars />
      <TopBar score={score} completedCount={completed.length} onHomeClick={() => setView('menu')} user={user} onLogout={handleLogout} />

      <div className="flex-1 w-full max-w-md relative flex flex-col">
        {view === 'menu' && <MenuView onStart={() => setView('map')} />}
        {view === 'map' && <MapView completed={completed} onSelectLevel={startGame} />}
        {view === 'game' && currentLevel && (
          <GameView
            currentLevel={currentLevel} activeStarId={activeStarId}
            selectedStars={selectedStars} lines={lines} time={time}
            isGameActive={isGameActive} showHint={showHint}
            mistakes={mistakes} maxMistakes={MAX_MISTAKES} dogMsg={dogMsg}
            onStarClick={handleStarClick} onHintClick={triggerHint} onUndoClick={handleUndo}
          />
        )}

        {showEduCard && currentLevel && (
          <EduCardModal level={currentLevel} onClose={() => { setShowEduCard(false); setView('map'); }} />
        )}
        {showFailCard && (
          <FailCardModal
            onRetry={() => startGame(currentLevel)}
            onReview={() => { setShowFailCard(false); setActiveStarId(null); setMistakes(0); triggerHint(); setIsGameActive(true); }}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dash { to { stroke-dashoffset: -40; } }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}} />
    </div>
  );
};

export default App;
