import React from 'react';

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

export default Miniature;
