import React, { useState, useRef } from 'react';
import { Star, Eye, Dog, RotateCcw } from 'lucide-react';

const findNearestStar = (stars, x, y, threshold) => {
  let best = null, bestDist = Infinity;
  for (const s of stars) {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < threshold && d < bestDist) { best = s; bestDist = d; }
  }
  return best;
};

const GameView = ({
  currentLevel, activeStarId, selectedStars, lines, time,
  isGameActive, showHint, mistakes, maxMistakes, dogMsg,
  onStarClick, onHintClick, onUndoClick,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const containerRef = useRef(null);

  const handleStarPointerDown = (e, starId) => {
    if (!isGameActive) return;
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    onStarClick(starId);
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDragPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragPos(null);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const nearest = findNearestStar(currentLevel.stars, px, py, 8);
    if (nearest && nearest.id !== activeStarId) {
      onStarClick(nearest.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="bg-slate-900/90 px-5 py-2 rounded-2xl border border-white/10 font-black text-blue-400 text-xl shadow-lg">
          {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <button onClick={onHintClick} className="px-4 py-2 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500 font-bold text-sm flex items-center gap-2 active:bg-yellow-500/20 transition-all">
            <Eye className="w-4 h-4" /> 힌트
          </button>
          <button
            onClick={onUndoClick}
            disabled={lines.length === 0 || !isGameActive}
            className="px-4 py-2 bg-slate-500/10 rounded-2xl border border-slate-500/20 text-slate-400 font-bold text-sm flex items-center gap-2 active:bg-slate-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" /> 취소
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
          {Array.from({ length: maxMistakes }, (_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < maxMistakes - mistakes ? 'bg-rose-400' : 'bg-slate-700'}`} />
          ))}
        </div>
      </div>

      <div
        className="relative flex-1 bg-gradient-to-b from-slate-900 to-[#020617] rounded-[3rem] border-2 border-white/5 shadow-inner overflow-hidden flex items-center justify-center"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div ref={containerRef} className="relative w-full aspect-square max-w-full">
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* 가이드 선 (힌트) */}
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
            {/* 드래그 중 펜딩 라인 */}
            {isDragging && activeStarId && dragPos && (() => {
              const activeStar = currentLevel.stars.find(s => s.id === activeStarId);
              return activeStar ? (
                <line x1={`${activeStar.x}%`} y1={`${activeStar.y}%`}
                      x2={`${dragPos.x}%`} y2={`${dragPos.y}%`}
                      stroke="white" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
              ) : null;
            })()}
          </svg>

          {/* 별 노드들 */}
          {currentLevel.stars.map((s) => {
            const isActive = activeStarId === s.id;
            const isSelected = selectedStars.includes(s.id);
            return (
              <button key={s.id}
                onPointerDown={(e) => handleStarPointerDown(e, s.id)}
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
  );
};

export default GameView;
