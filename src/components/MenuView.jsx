import React from 'react';
import { Dog, Play } from 'lucide-react';
import SoundEngine from '../lib/soundEngine';
import { STAGES } from '../lib/constants';

const MenuView = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-in zoom-in duration-500">
    <div className="relative mb-12">
      <div className="absolute -inset-10 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
      <div className="relative z-10 p-6 bg-slate-800 rounded-[3rem] border border-white/10 shadow-2xl">
        <Dog className="w-32 h-32 text-yellow-400 animate-bounce" style={{animationDuration: '4s'}} />
      </div>
    </div>
    <h1 className="text-5xl font-black mb-4 tracking-tighter italic bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 bg-clip-text text-transparent uppercase">Star Mong</h1>
    <p className="text-slate-400 text-lg mb-12 leading-relaxed font-medium">정밀한 성도 데이터를 기반으로 구현된<br/><span className="text-yellow-400">{STAGES.length}개 별자리 카드</span>를 수집하세요!</p>
    <button onClick={() => { SoundEngine.buttonClick(); onStart(); }} className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black py-5 rounded-[2.5rem] text-2xl shadow-[0_8px_0_0_#ca8a04] active:translate-y-1 transition-all flex items-center justify-center gap-4 group">
      <Play className="fill-current group-hover:scale-110 transition-transform" /> 탐사 시작
    </button>
  </div>
);

export default MenuView;
