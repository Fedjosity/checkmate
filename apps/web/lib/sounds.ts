"use client";

// Web Audio API context wrapper
let audioCtx: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Helper to play a quick synthesized beep.
 */
function playTone(freq: number, type: OscillatorType, durationMs: number, vol = 0.1) {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playMoveSound() {
  // A dull woody knock
  playTone(200, "sine", 150, 0.5);
  playTone(300, "square", 50, 0.05);
}

export function playCaptureSound() {
  // A slightly sharper, crunchier knock
  playTone(400, "triangle", 100, 0.3);
  playTone(200, "sawtooth", 150, 0.1);
}

export function playCheckSound() {
  // High alert beep
  playTone(800, "sine", 300, 0.2);
  playTone(1200, "triangle", 150, 0.1);
}

export function playGameStartSound() {
  // Rising major triad
  const ctx = getContext();
  if (!ctx) return;
  setTimeout(() => playTone(440, "sine", 300, 0.2), 0);
  setTimeout(() => playTone(554, "sine", 300, 0.2), 150);
  setTimeout(() => playTone(659, "sine", 500, 0.2), 300);
}

export function playGameEndSound() {
  // Descending minor chord
  const ctx = getContext();
  if (!ctx) return;
  setTimeout(() => playTone(659, "sine", 400, 0.2), 0);
  setTimeout(() => playTone(523, "sine", 400, 0.2), 200);
  setTimeout(() => playTone(440, "sine", 600, 0.2), 400);
}

export function playLowTimeSound() {
  // Urgent short tick
  playTone(1000, "square", 50, 0.05);
}
