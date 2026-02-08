const SoundEngine = (() => {
  let ctx = null;
  const getCtx = () => {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  };

  const playTone = (freq, duration, type = 'sine', volume = 0.4, { layer, attack = 0.02, sustain } = {}) => {
    const c = getCtx();
    if (!c) return;
    try {
      const t = c.currentTime;
      const sustainEnd = t + (sustain ?? duration * 0.4);

      const makeOsc = (f, tp, vol) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = tp;
        osc.frequency.value = f;
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
    } catch {
      // individual playback failure — ignore
    }
  };

  return {
    starConnect() {
      playTone(523.25, 0.3, 'sine', 0.4, { layer: { type: 'triangle', vol: 0.15 } });
      setTimeout(() => playTone(659.25, 0.35, 'sine', 0.4, { layer: { type: 'triangle', vol: 0.15 } }), 80);
    },
    mistake() {
      playTone(329.63, 0.25, 'square', 0.3);
      setTimeout(() => playTone(277.18, 0.35, 'square', 0.3), 100);
    },
    gameComplete() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.5, 'sine', 0.45, { layer: { type: 'triangle', vol: 0.2 }, sustain: 0.25 }), i * 180);
      });
    },
    gameFail() {
      const notes = [440, 369.99, 311.13];
      notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.4, 'triangle', 0.35, { layer: { type: 'square', vol: 0.1 } }), i * 180);
      });
    },
    buttonClick() {
      playTone(800, 0.1, 'sine', 0.3);
    },
  };
})();

export default SoundEngine;
