/**
 * Synthesised eagle cry (no audio file): a high, thin whistle that falls in pitch, then a quick
 * run of short chirps, with a little breath noise and a soft sky-sized echo. Tweak CALL for taste.
 */
export const CALL = {
  everyMs: 5000,
  volume: 0.55,
};

/** Schedules one cry on `dest` starting at `when` seconds. `pitch` ~0.9..1.1 gives each call its own voice. */
export function scheduleCall(ctx: BaseAudioContext, dest: AudioNode, when: number, pitch = 1) {
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(dest);

  const voice = (start: number, len: number, f0: number, f1: number, peak: number, shake = 0.012) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0 * pitch, start);
    osc.frequency.exponentialRampToValueAtTime(f1 * pitch, start + len);
    // fast vibrato on the pitch gives the strained, reedy quality
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 38;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = f0 * shake;
    lfo.connect(lfoGain).connect(osc.frequency);

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(f0 * 1.15 * pitch, start);
    band.frequency.exponentialRampToValueAtTime(f1 * 1.15 * pitch, start + len);
    band.Q.value = 4.5;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.04, len * 0.25));
    env.gain.exponentialRampToValueAtTime(0.0001, start + len);

    osc.connect(band).connect(env).connect(out);
    osc.start(start);
    lfo.start(start);
    osc.stop(start + len + 0.05);
    lfo.stop(start + len + 0.05);
  };

  // opening scream: long, falling
  voice(when, 0.5, 4100, 2500, 0.55, 0.018);
  voice(when, 0.5, 2050, 1250, 0.18, 0.02); // lower partial
  // answering chirps, getting shorter and softer
  let t = when + 0.62;
  for (let i = 0; i < 6; i++) {
    const len = 0.14 - i * 0.012;
    voice(t, len, 3500 - i * 90, 2600 - i * 60, 0.34 - i * 0.03, 0.02);
    t += len + 0.045;
  }

  // breath
  const len = Math.floor(ctx.sampleRate * 1.4);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'bandpass';
  hp.frequency.value = 3200 * pitch;
  hp.Q.value = 0.8;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, when);
  ng.gain.exponentialRampToValueAtTime(0.05, when + 0.08);
  ng.gain.exponentialRampToValueAtTime(0.0001, when + 1.3);
  noise.connect(hp).connect(ng).connect(out);
  noise.start(when);
  noise.stop(when + 1.4);
}

/** Small generated impulse response: a soft tail so the cry sounds like it comes from open sky. */
export function makeReverb(ctx: BaseAudioContext, seconds = 1.8): ConvolverNode {
  const rate = ctx.sampleRate;
  const n = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, n, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

/** Plays a call every CALL.everyMs once the browser allows audio. Returns controls. */
export function createEagleCaller() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer = 0;
  let enabled = true;
  let unlocked = false;
  let n = 0;

  const ensure = () => {
    if (ctx) return ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = CALL.volume;
    const dry = ctx.createGain();
    dry.gain.value = 0.8;
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    const rev = makeReverb(ctx);
    master.connect(dry).connect(ctx.destination);
    master.connect(rev).connect(wet).connect(ctx.destination);
    return ctx;
  };

  const play = () => {
    if (!enabled || !unlocked || document.hidden) return;
    const c = ensure();
    if (!c || !master) return;
    if (c.state === 'suspended') void c.resume();
    n++;
    scheduleCall(c, master, c.currentTime + 0.02, 0.92 + ((n * 37) % 17) / 100);
  };

  const start = () => {
    window.clearInterval(timer);
    timer = window.setInterval(play, CALL.everyMs);
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    const c = ensure();
    if (c?.state === 'suspended') void c.resume();
    play(); // first cry as soon as the visitor interacts
    start();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchend', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  return {
    setEnabled(on: boolean) {
      enabled = on;
      if (on && unlocked) start();
      if (!on) window.clearInterval(timer);
    },
    get ready() {
      return unlocked;
    },
    dispose() {
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchend', unlock);
      void ctx?.close();
      ctx = null;
    },
  };
}
