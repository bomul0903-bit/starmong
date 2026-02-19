import React from 'react';
import { Trophy, Star, Home, LogOut, User } from 'lucide-react';
import SoundEngine from '../lib/soundEngine';
import { STAGES } from '../lib/constants';

const TopBar = ({ score, completedCount, onHomeClick, user, onLogout }) => (
  <div className="w-full max-w-md p-4 flex justify-between items-center z-50">
    <div className="flex gap-2">
      <div className="bg-slate-800/80 px-4 py-1.5 rounded-full border border-yellow-500/20 flex items-center gap-2">
        <Trophy className="text-yellow-400 w-4 h-4" />
        <span className="font-bold text-yellow-500 text-xs">{score.toLocaleString()}</span>
      </div>
      <div className="bg-slate-800/80 px-4 py-1.5 rounded-full border border-blue-400/20 flex items-center gap-2">
        <Star className="text-blue-400 w-4 h-4" />
        <span className="font-bold text-blue-300 text-xs">{completedCount}/{STAGES.length}</span>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {user?.is_anonymous ? (
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/20 flex items-center justify-center">
          <User className="w-4 h-4 text-slate-300" />
        </div>
      ) : user?.user_metadata?.avatar_url && (
        <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full border border-white/20" />
      )}
      <button onClick={() => { SoundEngine.buttonClick(); onHomeClick(); }} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-white/5">
        <Home className="w-5 h-5" />
      </button>
      {onLogout && (
        <button onClick={() => { SoundEngine.buttonClick(); onLogout(); }} className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors border border-white/5">
          <LogOut className="w-5 h-5 text-slate-400" />
        </button>
      )}
    </div>
  </div>
);

export default TopBar;
