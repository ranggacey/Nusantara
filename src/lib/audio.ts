// SFX PROXIMITY — audio spasial prosedural (Web Audio, TANPA file suara
// download — semua bunyi disintesis di tempat, sesuai aturan aset bikinan
// sendiri). Volume mengikuti JARAK kamera: jauh = tidak terdengar, makin
// dekat = makin jelas, dekat banget = jelas. Stereo pan mengikuti arah
// relatif sumber terhadap kamera.
// Kebijakan autoplay mobile: AudioContext dibuat + di-resume HANYA setelah
// gestur pertama user (pointerdown/keydown) atau klik tombol suara; sebelum
// itu senyap total. Tombol mute/unmute di topbar (disimpan ne_suara).
// Modul ini aman diimpor di server/Node: semua akses window/AudioContext
// hanya di dalam fungsi (ensure), fungsi murni bisa dites tanpa audio.

// Kurva jarak: 1 di sumber, 0 di luar radius, kuadrat di antaranya.
export function gainJarak(dist: number, radius: number): number {
  if (dist >= radius) return 0;
  const t = 1 - dist / radius;
  return t * t;
}

// Pan stereo dari vektor relatif (sudah dinormalisasi) dan arah kanan kamera.
export function panKamera(relX: number, relZ: number, rightX: number, rightZ: number): number {
  const len = Math.hypot(relX, relZ);
  if (len < 1e-6) return 0;
  const dot = (relX / len) * rightX + (relZ / len) * rightZ;
  return Math.max(-0.8, Math.min(0.8, dot * 0.8));
}

// Radius terdengar per jenis sumber (unit peta; orang = 1,83).
export const SFX_JARAK = {
  langkah: 14,
  perkakas: 20,
  api: 30,
  air: 26,
  hewan: 24,
} as const;

// Bunyi perkakas per peran (null = tidak ada bunyi perkakas khusus;
// penjaga_api ditangani loop api, pemburu berburu ditangani suara hewan).
export const SFX_PERKAKAS: Record<string, "chop" | "pick" | "hammer" | "rustle" | null> = {
  penebang: "chop",
  penambang: "pick",
  perajin: "hammer",
  pengumpul: "rustle",
  tabib: "rustle",
  peramu: "rustle",
  juru_masak: "rustle",
  kepala_suku: "hammer",
  pemburu: null,
  penjaga_api: null,
  nelayan: null,
  petani: "rustle",
  penjaga: null,
  pengukir: "pick",
  penjelajah: null,
  pemanjat: "rustle",
  penenun: "rustle",
  penjerat: "rustle",
};

// Parameter panggilan hewan per spesies (nada prosedural).
export const SFX_HEWAN: Record<
  string,
  { type: OscillatorType; f0: number; f1: number; dur: number; vol: number; ulang?: number }
> = {
  rusa: { type: "sine", f0: 180, f1: 120, dur: 0.35, vol: 0.5 },
  kelinci: { type: "sine", f0: 900, f1: 1300, dur: 0.12, vol: 0.35, ulang: 2 },
  ayam: { type: "square", f0: 700, f1: 500, dur: 0.07, vol: 0.4, ulang: 2 },
  babi_hutan: { type: "sawtooth", f0: 140, f1: 90, dur: 0.25, vol: 0.55 },
  serigala: { type: "sine", f0: 600, f1: 500, dur: 0.9, vol: 0.5 },
  beruang: { type: "sawtooth", f0: 90, f1: 60, dur: 0.6, vol: 0.6 },
};

export interface AudioSumberWarga {
  id: string;
  x: number;
  z: number;
  bergerak: boolean;
  fase: string;
  bunyiPerkakas: "chop" | "pick" | "hammer" | "rustle" | null;
}

export interface AudioSnapshot {
  camX: number;
  camY: number;
  camZ: number;
  rightX: number;
  rightZ: number;
  warga: AudioSumberWarga[];
  api: { x: number; z: number }[];
  jarakAir: number;
  hewan: { id: string; jenis: string; x: number; z: number }[];
}

let actx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let apiGain: GainNode | null = null;
let apiPan: StereoPannerNode | null = null;
let airGain: GainNode | null = null;
let suaraOn = true;
const lastLangkah = new Map<string, number>();
const lastPerkakas = new Map<string, number>();
const lastPanggil = new Map<string, number>();
let lastPanggilGlobal = 0;
let lastPop = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!actx) {
    actx = new AC();
    master = actx.createGain();
    master.gain.value = suaraOn ? 0.9 : 0;
    master.connect(actx.destination);
    // Buffer noise 2 detik (dipakai ulang semua bunyi noise).
    const len = actx.sampleRate * 2;
    noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    // Loop api unggun: noise -> bandpass -> gain (gain diatur per update).
    const apiSrc = actx.createBufferSource();
    apiSrc.buffer = noiseBuf;
    apiSrc.loop = true;
    const apiFilter = actx.createBiquadFilter();
    apiFilter.type = "bandpass";
    apiFilter.frequency.value = 700;
    apiFilter.Q.value = 0.6;
    apiGain = actx.createGain();
    apiGain.gain.value = 0;
    apiPan = actx.createStereoPanner();
    apiSrc.connect(apiFilter).connect(apiGain).connect(apiPan).connect(master);
    apiSrc.start();
    // Loop air sungai: noise -> lowpass -> gain (gain diatur per update),
    // dengan LFO pelan supaya air terdengar mengalir, bukan statis.
    const airSrc = actx.createBufferSource();
    airSrc.buffer = noiseBuf;
    airSrc.loop = true;
    airSrc.playbackRate.value = 0.7;
    const airFilter = actx.createBiquadFilter();
    airFilter.type = "lowpass";
    airFilter.frequency.value = 500;
    airGain = actx.createGain();
    airGain.gain.value = 0;
    const lfo = actx.createOscillator();
    lfo.frequency.value = 0.25;
    const lfoGain = actx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain).connect(airGain.gain);
    airSrc.connect(airFilter).connect(airGain).connect(master);
    airSrc.start();
    lfo.start();
  }
  return actx;
}

export function ensureAudio(): void {
  const c = getCtx();
  if (c && c.state === "suspended") void c.resume();
}

export function setSuaraAktif(on: boolean): void {
  suaraOn = on;
  if (master && actx) master.gain.setTargetAtTime(on ? 0.9 : 0, actx.currentTime, 0.05);
}

export function isSuaraAktif(): boolean {
  return suaraOn;
}

function tone(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, pan: number): void {
  if (!actx || !master) return;
  const t = actx.currentTime;
  const osc = actx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  const p = actx.createStereoPanner();
  p.pan.value = pan;
  osc.connect(g).connect(p).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
    p.disconnect();
  };
}

function noise(dur: number, filterType: BiquadFilterType, freq: number, vol: number, pan: number): void {
  if (!actx || !master || !noiseBuf) return;
  const t = actx.currentTime;
  const src = actx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = actx.createBiquadFilter();
  f.type = filterType;
  f.frequency.value = freq;
  const g = actx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  const p = actx.createStereoPanner();
  p.pan.value = pan;
  src.connect(f).connect(g).connect(p).connect(master);
  src.start(t, Math.random());
  src.stop(t + dur + 0.02);
  src.onended = () => {
    src.disconnect();
    f.disconnect();
    g.disconnect();
    p.disconnect();
  };
}

function bunyiPerkakas(kind: "chop" | "pick" | "hammer" | "rustle", vol: number, pan: number): void {
  if (kind === "chop") {
    noise(0.12, "lowpass", 900, vol, pan);
    tone("sine", 90, 60, 0.1, vol * 0.8, pan);
  } else if (kind === "pick") {
    tone("triangle", 1700, 900, 0.07, vol * 0.7, pan);
    noise(0.04, "highpass", 2500, vol * 0.4, pan);
  } else if (kind === "hammer") {
    tone("sine", 130, 80, 0.09, vol * 0.9, pan);
    noise(0.06, "lowpass", 500, vol * 0.5, pan);
  } else {
    noise(0.15, "bandpass", 1200, vol * 0.5, pan);
  }
}

// Dipanggil dari loop Map3D (dibatasi pemanggil tiap ~6 frame).
// TANPA membuat context: sebelum gestur pertama (ctx belum ada) atau saat
// mute: tidak bersuara, tanpa error, tanpa warning autoplay.
export function updateAudioScene(s: AudioSnapshot): void {
  if (!suaraOn) return;
  const c = actx;
  if (!c || c.state !== "running" || !master) return;
  const now = performance.now();
  const dist = (x: number, z: number) => Math.hypot(x - s.camX, z - s.camZ);
  const panUntuk = (x: number, z: number) => panKamera(x - s.camX, z - s.camZ, s.rightX, s.rightZ);

  // Api unggun terdekat -> loop crackle (gain + pan dari api terdekat).
  if (apiGain && apiPan) {
    let dTerbaik = Infinity;
    let apiTerbaik: { x: number; z: number } | null = null;
    for (const a of s.api) {
      const d = dist(a.x, a.z);
      if (d < dTerbaik) {
        dTerbaik = d;
        apiTerbaik = a;
      }
    }
    const g = apiTerbaik ? gainJarak(dTerbaik, SFX_JARAK.api) * 0.5 : 0;
    apiGain.gain.setTargetAtTime(g, c.currentTime, 0.2);
    if (apiTerbaik) apiPan.pan.setTargetAtTime(panUntuk(apiTerbaik.x, apiTerbaik.z), c.currentTime, 0.2);
    // Letupan acak (pop) bila api terdengar.
    if (g > 0.05 && now - lastPop > 350 && Math.random() < 0.6) {
      lastPop = now;
      if (apiTerbaik) noise(0.06, "bandpass", 1400 + Math.random() * 800, g * 0.6, panUntuk(apiTerbaik.x, apiTerbaik.z));
    }
  }
  // Air sungai: gain dari jarak kamera ke sungai.
  if (airGain) airGain.gain.setTargetAtTime(gainJarak(s.jarakAir, SFX_JARAK.air) * 0.35, c.currentTime, 0.3);

  // Warga: langkah kaki saat bergerak + perkakas saat kumpul.
  for (const w of s.warga) {
    const d = dist(w.x, w.z);
    const pan = panUntuk(w.x, w.z);
    if (w.bergerak) {
      const g = gainJarak(d, SFX_JARAK.langkah);
      if (g > 0.02 && now - (lastLangkah.get(w.id) ?? 0) > 450) {
        lastLangkah.set(w.id, now);
        noise(0.09, "lowpass", 400, g * 0.5, pan);
      }
    }
    if (w.fase === "kumpul" && w.bunyiPerkakas) {
      const g = gainJarak(d, SFX_JARAK.perkakas);
      if (g > 0.02 && now - (lastPerkakas.get(w.id) ?? 0) > 900) {
        lastPerkakas.set(w.id, now);
        bunyiPerkakas(w.bunyiPerkakas, g * 0.7, pan);
      }
    }
  }
  // Hewan: panggilan spesies sesekali (maks 1 per 0,8 detik global).
  if (now - lastPanggilGlobal > 800 && Math.random() < 0.4) {
    let kandidat: { id: string; jenis: string; x: number; z: number; d: number } | null = null;
    for (const h of s.hewan) {
      if (now - (lastPanggil.get(h.id) ?? 0) < 8000) continue;
      const d = dist(h.x, h.z);
      if (gainJarak(d, SFX_JARAK.hewan) <= 0.02) continue;
      if (!kandidat || d < kandidat.d) kandidat = { ...h, d };
    }
    if (kandidat) {
      const p = SFX_HEWAN[kandidat.jenis];
      if (p) {
        const g = gainJarak(kandidat.d, SFX_JARAK.hewan);
        const pan = panUntuk(kandidat.x, kandidat.z);
        const ulang = p.ulang ?? 1;
        for (let i = 0; i < ulang; i++) {
          const delay = i * (p.dur + 0.12);
          window.setTimeout(() => tone(p.type, p.f0, p.f1, p.dur, g * p.vol, pan), delay * 1000);
        }
        lastPanggil.set(kandidat.id, now);
        lastPanggilGlobal = now;
      }
    }
  }
}
