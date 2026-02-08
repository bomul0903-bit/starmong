import React from 'react';
import { RotateCcw } from 'lucide-react';
import SoundEngine from '../lib/soundEngine';

const FailCardModal = ({ onRetry, onReview }) => (
  <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-6 animate-in zoom-in duration-300">
    <div className="bg-slate-900 w-full max-w-[320px] rounded-[3rem] overflow-hidden border-4 border-rose-500/50 shadow-2xl">
      <div className="bg-rose-500 p-8 text-center text-white flex flex-col items-center">
        <RotateCcw className="w-12 h-12 mb-2 animate-spin-slow" />
        <h3 className="text-2xl font-black italic">연결 실패</h3>
      </div>
      <div className="p-8 flex flex-col gap-3">
        <button onClick={() => { SoundEngine.buttonClick(); onRetry(); }} className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-[0_6px_0_0_#9f1239] active:translate-y-1 transition-all">
          <RotateCcw className="w-5 h-5" /> 다시 도전하기
        </button>
        <button onClick={() => { SoundEngine.buttonClick(); onReview(); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-5 rounded-2xl border border-white/5 transition-all">
          모양 다시 확인
        </button>
      </div>
    </div>
  </div>
);

export default FailCardModal;
