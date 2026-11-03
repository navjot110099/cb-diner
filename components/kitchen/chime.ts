"use client";

/**
 * Synthesised bell for new orders (no audio file to download or cache).
 * Browsers only allow sound after a tap, so the kitchen screen calls
 * `unlockAudio()` from a button press first.
 */
let ctx: AudioContext | null = null;

export function unlockAudio() {
  const AC = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return false;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return true;
}

export function audioReady() {
  return ctx?.state === "running";
}

function bell(at: number, freq: number, peak: number) {
  if (!ctx) return;
  // A bell is a fundamental plus a few inharmonic partials that decay faster.
  for (const [ratio, gainScale, decay] of [
    [1, 1, 1.4],
    [2.76, 0.35, 0.6],
    [5.4, 0.12, 0.35],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak * gainScale, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }
}

/** Two-note "ding-dong", played twice so it cuts through a busy kitchen. */
export function playChime() {
  if (!ctx || ctx.state !== "running") return false;
  const t = ctx.currentTime + 0.02;
  bell(t, 987.8, 0.5);
  bell(t + 0.28, 784, 0.5);
  bell(t + 0.9, 987.8, 0.4);
  bell(t + 1.18, 784, 0.4);
  return true;
}
