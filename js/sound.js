// Suara latar dibuat langsung oleh browser (Web Audio), tanpa file audio:
// dengung lembut + "klik" kecil saat berpindah bagian atau memilih warna.
let ctx = null, master = null, on = false;

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 520; filter.Q.value = 0.6; filter.connect(master);
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
  lfo.frequency.value = 0.07; lfoGain.gain.value = 260; lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start();
  // akor A minor 9 yang pelan
  [110, 164.81, 220, 261.63, 329.63, 493.88].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 2.5) * 4;
    g.gain.value = [0.22, 0.12, 0.12, 0.08, 0.06, 0.035][i];
    o.connect(g); g.connect(filter); o.start();
  });
}

export function toggle(force) {
  const want = force ?? !on;
  if (want && !ctx) build();
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  on = want;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(on ? 0.11 : 0, t, on ? 0.8 : 0.25);
  return on;
}
export const isOn = () => on;

export function tick(pitch = 1) {
  if (!on || !ctx) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(880 * pitch, t); o.frequency.exponentialRampToValueAtTime(440 * pitch, t + 0.12);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2);
}
