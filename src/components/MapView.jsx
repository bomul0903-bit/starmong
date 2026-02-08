import React from 'react';
import { Star, Map, ChevronRight, Lock } from 'lucide-react';
import { TIER_GROUPS } from '../lib/constants';
import { isTierUnlocked } from '../lib/gameLogic';
import Miniature from './Miniature';

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
};

const MapView = ({ completed, onSelectLevel }) => (
  <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom duration-500 px-6">
    <h2 className="text-2xl font-black py-6 flex items-center gap-3"><Map className="text-blue-400" /> 성좌 정밀 도감</h2>
    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pb-10">
      {TIER_GROUPS.map((tier, tierIdx) => {
        const doneCount = tier.stages.filter(s => completed.includes(s.id)).length;
        const unlocked = isTierUnlocked(tierIdx, tierIdx > 0 ? TIER_GROUPS[tierIdx - 1].stages : [], completed);
        const colors = tierColors[tier.color];

        return (
          <div key={tier.key}>
            <div className={`flex items-center justify-between mb-3 px-4 py-3 rounded-2xl border ${colors.bg} ${colors.border}`}>
              <div className="flex items-center gap-2.5">
                {unlocked
                  ? <Star className={`w-4 h-4 ${colors.text}`} />
                  : <Lock className="w-4 h-4 text-slate-600" />}
                <span className={`font-black text-sm ${unlocked ? colors.text : 'text-slate-600'}`}>{tier.label}</span>
                <span className="text-[10px] text-slate-500 font-bold">{tier.stages[0]?.stars.length}~{tier.stages[tier.stages.length-1]?.stars.length}별</span>
              </div>
              <span className={`text-xs font-black ${unlocked ? colors.text : 'text-slate-600'}`}>{doneCount}/{tier.stages.length}</span>
            </div>

            {unlocked ? (
              <div className="space-y-2.5">
                {tier.stages.map((c) => {
                  const isDone = completed.includes(c.id);
                  return (
                    <div key={c.id} onClick={() => onSelectLevel(c)}
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
);

export default MapView;
