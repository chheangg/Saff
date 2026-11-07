#!/usr/bin/env node
// Find how two recordings of the same moment line up, by their sound.
// Usage: node video/tools/sync.mjs <reference.(mov|mp4|m4a)> <other.(m4a|mov|mp4)>
// Prints JSON: { offset } where other's time = reference's time + offset (seconds),
// plus a confidence score. Use it for: voice memo vs camera audio, and
// screen recording (mic on) vs walking camera.
import { execFileSync } from 'node:child_process';

const RATE = 2000; // Hz for the fine pass
const ENV = 100; // envelope rate (Hz) for the coarse pass

function pcm(file, rate) {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}

// Loudness envelope: RMS per window, then mean-removed and normalized.
function envelope(x, per) {
  const n = Math.floor(x.length / per);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * per; j < (i + 1) * per; j++) s += x[j] * x[j];
    e[i] = Math.sqrt(s / per);
  }
  return normalize(e);
}

function normalize(e) {
  let m = 0;
  for (const v of e) m += v;
  m /= e.length || 1;
  let sd = 0;
  for (let i = 0; i < e.length; i++) {
    e[i] -= m;
    sd += e[i] * e[i];
  }
  sd = Math.sqrt(sd / (e.length || 1)) || 1;
  for (let i = 0; i < e.length; i++) e[i] /= sd;
  return e;
}

// Best lag L (in samples) such that b[t + L] ≈ a[t], searched in [lo, hi].
function bestLag(a, b, lo, hi) {
  let best = { lag: 0, score: -Infinity };
  for (let L = lo; L <= hi; L++) {
    let s = 0;
    let n = 0;
    const t0 = Math.max(0, -L);
    const t1 = Math.min(a.length, b.length - L);
    for (let t = t0; t < t1; t++) {
      s += a[t] * b[t + L];
      n++;
    }
    if (n > 50) {
      const score = s / n;
      if (score > best.score) best = { lag: L, score };
    }
  }
  return best;
}

export function sync(refFile, otherFile, maxShift = 180) {
  const a = pcm(refFile, RATE);
  const b = pcm(otherFile, RATE);
  // Coarse: 10 ms envelope over ±maxShift seconds.
  const per = RATE / ENV;
  const ea = envelope(a, per);
  const eb = envelope(b, per);
  const coarse = bestLag(ea, eb, -maxShift * ENV, maxShift * ENV);
  // Fine: 0.5 ms envelope (4-sample windows) within ±30 ms of the coarse answer.
  const fa = envelope(a, 4);
  const fb = envelope(b, 4);
  const k = RATE / 4;
  const c = Math.round((coarse.lag / ENV) * k);
  const fine = bestLag(fa, fb, c - Math.round(0.03 * k), c + Math.round(0.03 * k));
  return { offset: +(fine.lag / k).toFixed(3), confidence: +coarse.score.toFixed(3) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [ref, other] = process.argv.slice(2);
  if (!ref || !other) {
    console.error('usage: node video/tools/sync.mjs <reference> <other>');
    process.exit(1);
  }
  console.log(JSON.stringify(sync(ref, other)));
}
