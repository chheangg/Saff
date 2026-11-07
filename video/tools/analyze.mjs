#!/usr/bin/env node
// Look at everything dropped in video/raw/inbox and write video/raw/plan.json:
// what each file is, in what order it was recorded, and how the files line up in time.
//
//   node video/tools/analyze.mjs [inboxDir]
//
// Kinds (guessed from shape and content, override in plan.json if wrong):
//   memo    audio only (Voice Memos .m4a, .wav, .mp3)
//   screen  iPhone screen recording (tall, ~19.5:9, often no or quiet audio)
//   camera  camera footage (landscape = scene 1 studying, portrait = walking)
// Pairing: each memo is synced to the camera clip it matches best (same monologue);
// each screen recording is synced to the walking clip it overlaps (needs the mic on).
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { sync } from './sync.mjs';

const inbox = resolve(process.argv[2] ?? new URL('../raw/inbox', import.meta.url).pathname);
const MEDIA = /\.(mov|mp4|m4v|m4a|wav|mp3|aac|caf)$/i;

function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]).toString();
  const j = JSON.parse(out);
  const v = j.streams.find((s) => s.codec_type === 'video' && s.disposition?.attached_pic !== 1);
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const rot = Math.abs(Number(v?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? v?.tags?.rotate ?? 0));
  let w = v?.width, h = v?.height;
  if (rot === 90 || rot === 270) [w, h] = [h, w];
  const created = j.format.tags?.['com.apple.quicktime.creationdate'] ?? j.format.tags?.creation_time ?? null;
  return {
    duration: +Number(j.format.duration).toFixed(2),
    width: w ?? null,
    height: h ?? null,
    fps: v ? eval(v.avg_frame_rate || '0') : null,
    audio: !!a,
    created: created ? new Date(created).toISOString() : new Date(statSync(file).mtime).toISOString(),
  };
}

// Mean loudness in dB (to tell a silent screen recording from one with mic on).
function meanVolume(file) {
  const r = execFileSync('sh', ['-c', `ffmpeg -v info -i "${file}" -vn -af volumedetect -f null - 2>&1 | grep mean_volume || true`]).toString();
  const m = r.match(/mean_volume: (-?[\d.]+) dB/);
  return m ? +m[1] : null;
}

function kindOf(p) {
  if (!p.width) return 'memo';
  const tall = p.height / p.width;
  // iPhone screen recordings: ~2.16 aspect (e.g. 1178x2556, 1170x2532, 886x1920); cameras are 16:9 (1.78).
  if (tall > 2.0) return 'screen';
  return 'camera';
}

const files = readdirSync(inbox)
  .filter((f) => MEDIA.test(f) && !f.startsWith('.'))
  .map((f) => join(inbox, f));
if (!files.length) {
  console.log(`No media in ${inbox}. AirDrop clips there, then run again.`);
  process.exit(0);
}

const items = files.map((file) => {
  const p = probe(file);
  const kind = kindOf(p);
  return {
    file,
    kind,
    orientation: p.width ? (p.width >= p.height ? 'landscape' : 'portrait') : null,
    ...p,
    volumeDb: p.audio ? meanVolume(file) : null,
  };
}).sort((a, b) => a.created.localeCompare(b.created));

const cams = items.filter((i) => i.kind === 'camera' && i.audio);
// Memo -> best-matching camera clip.
for (const m of items.filter((i) => i.kind === 'memo')) {
  let best = null;
  for (const c of cams) {
    const r = sync(c.file, m.file);
    if (!best || r.confidence > best.confidence) best = { camera: c.file, ...r };
  }
  m.syncTo = best; // memo time = camera time + offset
}
// Screen recording -> overlapping portrait camera clip (walking), by sound if it has any.
for (const s of items.filter((i) => i.kind === 'screen')) {
  const walks = items.filter((i) => i.kind === 'camera' && i.orientation === 'portrait');
  let best = null;
  if (s.audio && (s.volumeDb ?? -99) > -60) {
    for (const w of walks) {
      if (!w.audio) continue;
      const r = sync(w.file, s.file);
      if (!best || r.confidence > best.confidence) best = { camera: w.file, method: 'sound', ...r };
    }
  }
  if (!best || best.confidence < 0.3) {
    // Fall back to recording timestamps (phone clocks are within a second or two).
    const sT = Date.parse(s.created);
    const near = walks.map((w) => ({ w, d: Math.abs(Date.parse(w.created) - sT) })).sort((a, b) => a.d - b.d)[0];
    if (near) best = { camera: near.w.file, method: 'timestamps', offset: +((Date.parse(near.w.created) - sT) / 1000).toFixed(2), confidence: null };
  }
  s.syncTo = best;
}

const plan = {
  made: new Date().toISOString(),
  inbox,
  layout: '1920x1080: scene 1 = landscape camera full frame (+memo audio); then each walking clip on the left half, its screen recording on the right',
  items,
};
const out = join(inbox, '..', 'plan.json');
writeFileSync(out, JSON.stringify(plan, null, 2));
for (const i of items) {
  const name = i.file.split('/').pop();
  const s = i.syncTo ? ` → ${i.syncTo.camera.split('/').pop()} offset ${i.syncTo.offset}s (${i.syncTo.method ?? 'sound'}${i.syncTo.confidence != null ? `, conf ${i.syncTo.confidence}` : ''})` : '';
  console.log(`${i.created.slice(11, 19)}  ${i.kind.padEnd(6)} ${String(i.orientation ?? '').padEnd(9)} ${String(i.duration).padStart(6)}s  ${name}${s}`);
}
console.log(`plan: ${out}`);
