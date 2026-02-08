import React, { useState, useEffect, useMemo } from 'react';
import { Star, Map, Trophy, Play, Home, Dog, RotateCcw, Eye, Sparkles, BookOpen, ChevronRight, Lock } from 'lucide-react';
import constellationData from './data/constellations.json';
import {
  isValidConnection,
  isLineAlreadyDrawn,
  calculateFinishBonus,
  isGameComplete,
  handleMistake as handleMistakeLogic,
  isTierUnlocked,
  groupStagesByTier,
} from './lib/gameLogic';

// --- 사운드 엔진 (Web Audio API 합성) ---
const SoundEngine = (() => {
  let ctx = null;
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  // ADSR 엔벨로프 + 레이어링 지원
  const playTone = (freq, duration, type = 'sine', volume = 0.4, { layer, attack = 0.02, sustain } = {}) => {
    const c = getCtx();
    const t = c.currentTime;
    const sustainEnd = t + (sustain ?? duration * 0.4);

    const makeOsc = (f, tp, vol) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = tp;
      osc.frequency.value = f;
      // ADSR: attack → sustain → release
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + attack);
      gain.gain.setValueAtTime(vol, sustainEnd);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + duration);
    };

    makeOsc(freq, type, volume);
    if (layer) makeOsc(layer.freq ?? freq * 2, layer.type ?? 'triangle', layer.vol ?? volume * 0.3);
  };

  return {
    starConnect() {
      playTone(523.25, 0.3, 'sine', 0.4, { layer: { type: 'triangle', vol: 0.15 } }); // C5
      setTimeout(() => playTone(659.25, 0.35, 'sine', 0.4, { layer: { type: 'triangle', vol: 0.15 } }), 80); // E5
    },
    mistake() {
      playTone(329.63, 0.25, 'square', 0.3); // E4
      setTimeout(() => playTone(277.18, 0.35, 'square', 0.3), 100); // C#4
    },
    gameComplete() {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5-E5-G5-C6
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.5, 'sine', 0.45, { layer: { type: 'triangle', vol: 0.2 }, sustain: 0.25 }), i * 180);
      });
    },
    gameFail() {
      const notes = [440, 369.99, 311.13]; // A4-F#4-Eb4
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.4, 'triangle', 0.35, { layer: { type: 'square', vol: 0.1 } }), i * 180);
      });
    },
    buttonClick() {
      playTone(800, 0.1, 'sine', 0.3);
    },
  };
})();

// --- 별자리 데이터 (d3-celestial 기반 88개 IAU 공식 별자리) ---
const STAGES = constellationData.map((c, index) => ({
  id: index + 1,
  abbr: c.id,
  name: c.name,
  nameEn: c.nameEn,
  difficulty: c.difficulty,
  stars: c.stars,
  path: c.path,
  desc: c.desc,
}));

const TIERS = [
  { key: 'star2',    label: '2별',     color: 'emerald', difficulty: '2별' },
  { key: 'star3',    label: '3별',     color: 'teal',    difficulty: '3별' },
  { key: 'star4',    label: '4별',     color: 'sky',     difficulty: '4별' },
  { key: 'star5',    label: '5별',     color: 'blue',    difficulty: '5별' },
  { key: 'star6',    label: '6별',     color: 'indigo',  difficulty: '6별' },
  { key: 'star78',   label: '7~8별',   color: 'violet',  difficulty: '7~8별' },
  { key: 'star911',  label: '9~11별',  color: 'amber',   difficulty: '9~11별' },
  { key: 'star1214', label: '12~14별', color: 'orange',  difficulty: '12~14별' },
  { key: 'star1523', label: '15~23별', color: 'rose',    difficulty: '15~23별' },
];

const TIER_GROUPS = groupStagesByTier(STAGES, TIERS);

// --- UI 컴포넌트 ---
const Miniature = ({ level }) => (
  <svg viewBox="0 0 100 100" className="w-12 h-12 bg-slate-900/80 rounded-xl p-1.5 border border-yellow-500/20 shadow-inner">
    {level.path.map((p, i) => {
      const s1 = level.stars.find(s => s.id === p[0]);
      const s2 = level.stars.find(s => s.id === p[1]);
      return s1 && s2 ? <line key={i} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke="#eab308" strokeWidth="3" strokeLinecap="round" opacity="0.4" /> : null;
    })}
    {level.stars.map(s => <circle key={s.id} cx={s.x} cy={s.y} r={s.r / 1.5} fill="white" />)}
  </svg>
);

const BackgroundStars = React.memo(() => {
  const stars = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.5,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
    })),
  []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            '--twinkle-duration': s.duration,
            animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
});

const App = () => {
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

  const MAX_MISTAKES = 3;

  useEffect(() => {
    let timer;
    if (isGameActive) timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isGameActive]);

  useEffect(() => {
    localStorage.setItem('starmong-completed', JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem('starmong-score', String(score));
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

    // 이미 그려진 선인지 확인
    const alreadyDrawn = isLineAlreadyDrawn(activeStarId, starId, lines);

    if (alreadyDrawn) {
      setActiveStarId(starId); // 위치만 이동
      return;
    }

    // 고증된 경로 확인
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
      // 잘못된 클릭
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

  const finishGame = () => {
    SoundEngine.gameComplete();
    setIsGameActive(false);
    setScore(s => s + calculateFinishBonus(time));
    if (!completed.includes(currentLevel.id)) setCompleted([...completed, currentLevel.id]);
    setTimeout(() => setShowEduCard(true), 800);
  };

  const triggerHint = () => {
    SoundEngine.buttonClick();
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-hidden flex flex-col items-center">
      <BackgroundStars />
      {/* Top Bar */}
      <div className="w-full max-w-md p-4 flex justify-between items-center z-50">
        <div className="flex gap-2">
          <div className="bg-slate-800/80 px-4 py-1.5 rounded-full border border-yellow-500/20 flex items-center gap-2">
            <Trophy className="text-yellow-400 w-4 h-4" />
            <span className="font-bold text-yellow-500 text-xs">{score.toLocaleString()}</span>
          </div>
          <div className="bg-slate-800/80 px-4 py-1.5 rounded-full border border-blue-400/20 flex items-center gap-2">
            <Star className="text-blue-400 w-4 h-4" />
            <span className="font-bold text-blue-300 text-xs">{completed.length}/{STAGES.length}</span>
          </div>
        </div>
        <button onClick={() => { SoundEngine.buttonClick(); setView('menu'); }} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-white/5">
          <Home className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 w-full max-w-md relative flex flex-col">
        {/* --- VIEW: Menu --- */}
        {view === 'menu' && (
          <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-in zoom-in duration-500">
            <div className="relative mb-12">
              <div className="absolute -inset-10 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
              <div className="relative z-10 p-6 bg-slate-800 rounded-[3rem] border border-white/10 shadow-2xl">
                <Dog className="w-32 h-32 text-yellow-400 animate-bounce" style={{animationDuration: '4s'}} />
              </div>
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tighter italic bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 bg-clip-text text-transparent uppercase">Star Mong</h1>
            <p className="text-slate-400 text-lg mb-12 leading-relaxed font-medium">정밀한 성도 데이터를 기반으로 구현된<br/><span className="text-yellow-400">{STAGES.length}개 별자리 카드</span>를 수집하세요!</p>
            <button onClick={() => { SoundEngine.buttonClick(); setView('map'); }} className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-5 rounded-[2.5rem] text-2xl shadow-[0_8px_0_0_#ca8a04] active:translate-y-1 transition-all flex items-center justify-center gap-4 group">
              <Play className="fill-current group-hover:scale-110 transition-transform" /> 탐사 시작
            </button>
          </div>
        )}

        {/* --- VIEW: Map --- */}
        {view === 'map' && (
          <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom duration-500 px-6">
            <h2 className="text-2xl font-black py-6 flex items-center gap-3"><Map className="text-blue-400" /> 성좌 정밀 도감</h2>
            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
              {TIER_GROUPS.map((tier, tierIdx) => {
                const doneCount = tier.stages.filter(s => completed.includes(s.id)).length;
                const unlocked = isTierUnlocked(tierIdx, tierIdx > 0 ? TIER_GROUPS[tierIdx - 1].stages : [], completed);
                const tierColors = {
                  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
                  teal:    { bg: 'bg-teal-500/10',    border: 'border-teal-500/30',    text: 'text-teal-400' },
                  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     text: 'text-sky-400' },
                  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400' },
                  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  text: 'text-indigo-400' },
                  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30',  text: 'text-violet-400' },
                  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400' },
                  orange:  { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400' },
                  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    text: 'text-rose-400' },
                }[tier.color];

                return (
                  <div key={tier.key}>
                    {/* 단계 헤더 */}
                    <div className={`flex items-center justify-between mb-3 px-4 py-3 rounded-2xl border ${tierColors.bg} ${tierColors.border}`}>
                      <div className="flex items-center gap-2.5">
                        {unlocked
                          ? <Star className={`w-4 h-4 ${tierColors.text}`} />
                          : <Lock className="w-4 h-4 text-slate-600" />}
                        <span className={`font-black text-sm ${unlocked ? tierColors.text : 'text-slate-600'}`}>{tier.label}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{tier.stages[0]?.stars.length}~{tier.stages[tier.stages.length-1]?.stars.length}별</span>
                      </div>
                      <span className={`text-xs font-black ${unlocked ? tierColors.text : 'text-slate-600'}`}>{doneCount}/{tier.stages.length}</span>
                    </div>

                    {unlocked ? (
                      <div className="space-y-2.5">
                        {tier.stages.map((c) => {
                          const isDone = completed.includes(c.id);
                          return (
                            <div key={c.id} onClick={() => startGame(c)}
                                 className={`group p-4 rounded-[2rem] flex items-center justify-between border-2 transition-all active:scale-95 cursor-pointer ${isDone ? 'bg-slate-800/80 border-yellow-500/50' : 'bg-slate-800/40 border-white/5 hover:border-yellow-400/30'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isDone ? 'bg-yellow-400 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>{c.stars.length}</div>
                                <div>
                                  <h3 className="font-bold text-base">{c.name}</h3>
                                  <p className="text-[10px] text-slate-500">{isDone ? "수집 완료 ✨" : c.nameEn}</p>
                                </div>
                              </div>
                              {isDone ? <Miniature level={c} /> : <div className="p-2 bg-slate-700 rounded-full text-slate-400 group-hover:text-yellow-400 transition-colors"><ChevronRight className="w-4 h-4" /></div>}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-600 text-sm font-bold">
                        <Lock className="w-5 h-5 mx-auto mb-2 opacity-50" />
                        이전 단계를 모두 완료하면 열립니다
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: Game --- */}
        {view === 'game' && currentLevel && (
          <div className="flex-1 flex flex-col p-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="bg-slate-900/90 px-5 py-2 rounded-2xl border border-white/10 font-black text-blue-400 text-xl shadow-lg">
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex gap-2">
                <button onClick={triggerHint} className="px-4 py-2 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500 font-bold text-sm flex items-center gap-2 active:bg-yellow-500/20 transition-all">
                  <Eye className="w-4 h-4" /> 힌트
                </button>
                <div className="px-4 py-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 font-black text-sm text-blue-400">
                  {currentLevel.name}
                </div>
              </div>
            </div>

            {/* 진행률 & 남은 기회 */}
            <div className="flex justify-between items-center mb-3 px-3">
              <span className="text-xs text-slate-500">{lines.length}/{currentLevel.path.length} 연결</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < MAX_MISTAKES - mistakes ? 'bg-rose-400' : 'bg-slate-700'}`} />
                ))}
              </div>
            </div>

            <div className="relative flex-1 bg-gradient-to-b from-slate-900 to-[#020617] rounded-[3rem] border-2 border-white/5 shadow-inner overflow-hidden flex items-center justify-center">
              {/* 별자리 캔버스 (비율 유지를 위해 내부 박스 사용) */}
              <div className="relative w-full aspect-square max-w-full">
                {/* 힌트 및 완성 선 레이어 */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* 가이드 선 (힌트 클릭 시) */}
                  <g className={`transition-opacity duration-500 ${showHint ? 'opacity-40' : 'opacity-0'}`}>
                    {currentLevel.path.map((path, i) => {
                      const s1 = currentLevel.stars.find(s => s.id === path[0]);
                      const s2 = currentLevel.stars.find(s => s.id === path[1]);
                      return s1 && s2 ? <line key={i} x1={`${s1.x}%`} y1={`${s1.y}%`} x2={`${s2.x}%`} y2={`${s2.y}%`} stroke="white" strokeWidth="2" strokeDasharray="5 5" /> : null;
                    })}
                  </g>
                  {/* 플레이어가 그린 선 */}
                  {lines.map((line, i) => {
                    const s1 = currentLevel.stars.find(s => s.id === line[0]);
                    const s2 = currentLevel.stars.find(s => s.id === line[1]);
                    return s1 && s2 ? (
                      <g key={i}>
                        <line x1={`${s1.x}%`} y1={`${s1.y}%`} x2={`${s2.x}%`} y2={`${s2.y}%`} stroke="#facc15" strokeWidth="4" strokeLinecap="round" className="opacity-50" />
                        <line x1={`${s1.x}%`} y1={`${s1.y}%`} x2={`${s2.x}%`} y2={`${s2.y}%`} stroke="#fbbf24" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 6" className="animate-[dash_2s_linear_infinite]" />
                      </g>
                    ) : null;
                  })}
                </svg>
                
                {/* 별 노드들 */}
                {currentLevel.stars.map((s) => {
                  const isActive = activeStarId === s.id;
                  const isSelected = selectedStars.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => handleStarClick(s.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-4 rounded-full transition-all duration-300 z-20 group`}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                      <div className={`relative flex items-center justify-center rounded-full transition-all duration-300
                        ${isActive ? 'w-8 h-8 bg-yellow-400 scale-125 shadow-[0_0_20px_rgba(250,204,21,0.8)] border-2 border-white' : 
                          isSelected ? 'w-6 h-6 bg-yellow-600/40 border border-yellow-500/30' : 
                          'w-5 h-5 bg-white/10 border border-white/5 hover:bg-white/30'}`}>
                        <Star className={`w-full h-full p-1 transition-all ${isSelected ? 'fill-white text-white' : 'text-white/30'}`} />
                        {s.name && isSelected && (
                          <span className="absolute top-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-yellow-400 whitespace-nowrap bg-slate-900/90 px-2 py-0.5 rounded shadow-lg border border-yellow-500/20">
                            {s.name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 강아지 안내창 */}
            <div className="mt-8 bg-slate-800/90 rounded-[2.5rem] p-5 flex items-center gap-5 border border-white/5 shadow-2xl relative">
              <div className="w-16 h-16 bg-yellow-400 rounded-3xl flex items-center justify-center border-4 border-slate-900 flex-shrink-0 shadow-xl -translate-y-2">
                <Dog className="text-slate-950 w-10 h-10" />
              </div>
              <div className="bg-white text-slate-900 px-5 py-3 rounded-2xl font-bold flex-1 text-xs shadow-md relative leading-tight">
                <div className="absolute -left-2 top-4 w-4 h-4 bg-white rotate-45" />
                {dogMsg}
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: Education Card --- */}
        {showEduCard && currentLevel && (
          <div className="fixed inset-0 z-[100] bg-slate-950/98 flex items-center justify-center p-6 animate-in zoom-in duration-500">
            <div className="relative bg-slate-900 w-full max-w-[340px] rounded-[3rem] overflow-hidden border-[6px] border-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.2)]">
              <div className="bg-yellow-500 p-8 text-slate-950 flex flex-col items-center relative overflow-hidden">
                <Sparkles className="w-10 h-10 mb-2 animate-pulse" />
                <h3 className="text-2xl font-black italic tracking-tight uppercase">Star-Mong Card</h3>
                <div className="mt-1 text-[10px] font-black tracking-widest bg-slate-950 text-white px-3 py-1 rounded-full opacity-80">AUTHENTIC</div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
              </div>
              <div className="p-8 flex flex-col items-center">
                <div className="w-full aspect-square bg-slate-950/80 rounded-[2.5rem] border-2 border-white/5 mb-8 flex items-center justify-center p-6 relative">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
                   <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                    {currentLevel.path.map((p, i) => {
                      const s1 = currentLevel.stars.find(s => s.id === p[0]);
                      const s2 = currentLevel.stars.find(s => s.id === p[1]);
                      return s1 && s2 ? <line key={i} x1={`${s1.x}%`} y1={`${s1.y}%`} x2={`${s2.x}%`} y2={`${s2.y}%`} stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" /> : null;
                    })}
                    {currentLevel.stars.map(s => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r/1.8 + 1} fill="white" />)}
                  </svg>
                </div>
                <h4 className="text-4xl font-black text-white mb-4 drop-shadow-lg">{currentLevel.name}</h4>
                <p className="text-slate-400 text-[11px] text-center leading-relaxed font-medium px-4 mb-10 min-h-[48px]">"{currentLevel.desc}"</p>
                <button onClick={() => { SoundEngine.buttonClick(); setShowEduCard(false); setView('map'); }}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-950 font-black py-5 rounded-3xl shadow-[0_6px_0_0_#ca8a04] active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
                  <BookOpen className="w-5 h-5" /> 도감에 보관하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL: Fail --- */}
        {showFailCard && (
          <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-6 animate-in zoom-in duration-300">
            <div className="bg-slate-900 w-full max-w-[320px] rounded-[3rem] overflow-hidden border-4 border-rose-500/50 shadow-2xl">
              <div className="bg-rose-500 p-8 text-center text-white flex flex-col items-center">
                <RotateCcw className="w-12 h-12 mb-2 animate-spin-slow" />
                <h3 className="text-2xl font-black italic">연결 실패</h3>
              </div>
              <div className="p-8 flex flex-col gap-3">
                <button onClick={() => { SoundEngine.buttonClick(); startGame(currentLevel); }} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_6px_0_0_#9f1239] active:translate-y-1 transition-all">
                  <RotateCcw className="w-5 h-5" /> 다시 도전하기
                </button>
                <button onClick={() => { SoundEngine.buttonClick(); setShowFailCard(false); setActiveStarId(null); setMistakes(0); triggerHint(); setIsGameActive(true); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl border border-white/5 transition-all">
                  모양 다시 확인
                </button>
              </div>
            </div>
          </div>
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
