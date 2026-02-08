import React from 'react';
import { Sparkles, BookOpen } from 'lucide-react';
import SoundEngine from '../lib/soundEngine';

const EduCardModal = ({ level, onClose }) => (
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
            {level.path.map((p, i) => {
              const s1 = level.stars.find(s => s.id === p[0]);
              const s2 = level.stars.find(s => s.id === p[1]);
              return s1 && s2 ? <line key={i} x1={`${s1.x}%`} y1={`${s1.y}%`} x2={`${s2.x}%`} y2={`${s2.y}%`} stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" /> : null;
            })}
            {level.stars.map(s => <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r/1.8 + 1} fill="white" />)}
          </svg>
        </div>
        <h4 className="text-4xl font-black text-white mb-4 drop-shadow-lg">{level.name}</h4>
        <p className="text-slate-400 text-[11px] text-center leading-relaxed font-medium px-4 mb-10 min-h-[48px]">"{level.desc}"</p>
        <button onClick={() => { SoundEngine.buttonClick(); onClose(); }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-950 font-black py-5 rounded-3xl shadow-[0_6px_0_0_#ca8a04] active:translate-y-1 transition-all flex items-center justify-center gap-3 text-lg">
          <BookOpen className="w-5 h-5" /> 도감에 보관하기
        </button>
      </div>
    </div>
  </div>
);

export default EduCardModal;
