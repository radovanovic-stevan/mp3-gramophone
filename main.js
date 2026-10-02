import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// ---------- renderer, scene, camera ----------
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(6.4, 5.4, 8.2);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 2.0, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.49;

const key = new THREE.SpotLight(0xffdcae, 3.2, 0, Math.PI / 5, 0.6, 0);
key.position.set(-4.5, 10, 6);
key.target.position.set(0, 1.2, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x2a1810, 0.55));
const rim = new THREE.DirectionalLight(0x9fb8ff, 0.7);
rim.position.set(6, 5, -7);
scene.add(rim);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.45 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ---------- materials ----------
function canvasTexture(size, draw) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

const woodMap = canvasTexture(1024, (g, S) => {
  g.fillStyle = "#5e2d14";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 280; i++) {
    const y = Math.random() * S, amp = 3 + Math.random() * 12, freq = 0.003 + Math.random() * 0.01, ph = Math.random() * 6;
    g.strokeStyle = Math.random() < 0.55
      ? `rgba(28, 10, 3, ${0.08 + Math.random() * 0.2})`
      : `rgba(140, 70, 30, ${0.06 + Math.random() * 0.16})`;
    g.lineWidth = 0.6 + Math.random() * 2.6;
    g.beginPath();
    for (let x = 0; x <= S; x += 16) {
      const yy = y + Math.sin(x * freq + ph) * amp;
      x ? g.lineTo(x, yy) : g.moveTo(x, yy);
    }
    g.stroke();
  }
});
const wood = new THREE.MeshPhysicalMaterial({ map: woodMap, roughness: 0.5, clearcoat: 0.7, clearcoatRoughness: 0.25 });
const woodDark = wood.clone();
woodDark.color = new THREE.Color(0x8a6a5a);
const brass = new THREE.MeshPhysicalMaterial({ color: 0xd4a24c, metalness: 1, roughness: 0.28, side: THREE.DoubleSide });
const brassDark = new THREE.MeshStandardMaterial({ color: 0x9c7533, metalness: 1, roughness: 0.4 });
const nickel = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, metalness: 1, roughness: 0.22 });
const felt = new THREE.MeshStandardMaterial({ color: 0x24402e, roughness: 1 });
const shellac = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0b, roughness: 0.35, clearcoat: 0.5 });
const mica = new THREE.MeshPhysicalMaterial({ color: 0xd9ccaa, metalness: 0.3, roughness: 0.25, clearcoat: 1 });
const ivory = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, roughness: 0.45 });

function mesh(geo, mat, parent, pos = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

// ---------- the gramophone ----------
const CAB = { w: 3.0, d: 3.0, h: 1.15, foot: 0.12 };
const Y0 = CAB.foot + CAB.h + 0.06;               // top surface of the cabinet
const C = { x: -0.25, z: 0.12 };                   // platter centre
const P = { x: 1.12, z: -1.08 };                   // tonearm pivot
const L = 1.75;                                     // pivot to needle
const R_OUT = 1.12, R_IN = 0.46;                    // first and last groove
const PLATTER_H = 0.09, RECORD_H = 0.02;
const SPIN = (78 / 60) * Math.PI * 2;               // 78 RPM in rad/s
const LIFT_UP = 0.09;

const gramophone = new THREE.Group();
scene.add(gramophone);

// cabinet
mesh(new THREE.BoxGeometry(CAB.w, CAB.h, CAB.d), wood, gramophone, [0, CAB.foot + CAB.h / 2, 0]);
mesh(new THREE.BoxGeometry(CAB.w + 0.14, 0.06, CAB.d + 0.14), wood, gramophone, [0, CAB.foot + CAB.h + 0.03, 0]);
mesh(new THREE.BoxGeometry(CAB.w + 0.14, 0.1, CAB.d + 0.14), wood, gramophone, [0, CAB.foot + 0.05, 0]);
mesh(new THREE.BoxGeometry(CAB.w - 0.6, CAB.h - 0.45, 0.03), woodDark, gramophone, [0, CAB.foot + CAB.h / 2 + 0.03, CAB.d / 2 + 0.015]);
mesh(new THREE.BoxGeometry(0.03, CAB.h - 0.45, CAB.d - 0.6), woodDark, gramophone, [CAB.w / 2 + 0.015, CAB.foot + CAB.h / 2 + 0.03, 0]);
mesh(new THREE.BoxGeometry(0.62, 0.13, 0.012), brass, gramophone, [0, CAB.foot + CAB.h - 0.12, CAB.d / 2 + 0.006]);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
  mesh(new THREE.CylinderGeometry(0.13, 0.09, CAB.foot, 24), brassDark, gramophone,
    [sx * (CAB.w / 2 - 0.1), CAB.foot / 2, sz * (CAB.d / 2 - 0.1)]);
}
// speed knob, front right
mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.07, 24), brass, gramophone, [1.2, Y0 + 0.035, 1.18]);

// platter, spindle and record
const platter = new THREE.Group();
platter.position.set(C.x, Y0, C.z);
gramophone.add(platter);
mesh(new THREE.CylinderGeometry(1.26, 1.26, PLATTER_H, 96), [nickel, felt, felt], platter, [0, PLATTER_H / 2, 0]);
mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 16), nickel, platter, [0, PLATTER_H + 0.07, 0]);

const record = new THREE.Group();
record.position.y = PLATTER_H;
record.visible = false;
platter.add(record);
mesh(new THREE.CylinderGeometry(1.2, 1.2, RECORD_H, 128, 1, true), shellac, record, [0, RECORD_H / 2, 0]);
const labelMat = new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.2 });
const recordTop = mesh(new THREE.CircleGeometry(1.2, 128), labelMat, record, [0, RECORD_H + 0.0005, 0]);
recordTop.rotation.x = -Math.PI / 2;

// tonearm: yaw around the pivot post, then lift around the arm's own axis
mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.04, 32), brassDark, gramophone, [P.x, Y0 + 0.02, P.z]);
mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.42, 32), brass, gramophone, [P.x, Y0 + 0.23, P.z]);
const armYaw = new THREE.Group();
armYaw.position.set(P.x, Y0 + 0.44, P.z);
gramophone.add(armYaw);
const armLift = new THREE.Group();
armYaw.add(armLift);
mesh(new THREE.SphereGeometry(0.14, 32, 16), brass, armLift);
const tube = mesh(new THREE.CylinderGeometry(0.045, 0.08, L - 0.05, 32), brass, armLift, [(L - 0.05) / 2, 0, 0]);
tube.rotation.z = -Math.PI / 2;
mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 16), brass, armLift, [L, -0.05, 0]);
const box = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 48), nickel, armLift, [L, -0.1, 0]);
box.rotation.z = Math.PI / 2;
const face = mesh(new THREE.CircleGeometry(0.135, 48), mica, armLift, [L + 0.037, -0.1, 0]);
face.rotation.y = Math.PI / 2;
const face2 = face.clone();
face2.position.x = L - 0.037;
face2.rotation.y = -Math.PI / 2;
armLift.add(face2);
const needle = mesh(new THREE.ConeGeometry(0.014, 0.07, 12), nickel, armLift, [L, -0.295, 0]);
needle.rotation.z = Math.PI;

// angle of the arm (in the x/z plane) that puts the needle at radius r from the spindle
const dx = C.x - P.x, dz = C.z - P.z, D = Math.hypot(dx, dz), PHI = Math.atan2(dz, dx);
function armAngleFor(r) {
  const cosB = (L * L + D * D - r * r) / (2 * L * D);
  return PHI - Math.acos(THREE.MathUtils.clamp(cosB, -1, 1));
}
const REST = armAngleFor(R_OUT) - 0.42;

// arm rest post where the soundbox parks
const restTip = { x: P.x + L * Math.cos(REST), z: P.z + L * Math.sin(REST) };
mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 16), brassDark, gramophone, [restTip.x, Y0 + 0.08, restTip.z]);

// fluted horn: a swept tube whose radius flares toward the bell
function hornGeometry(curve, segs, radial, r0, r1) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [];
  const ring = (t, i, j) => {
    const p = curve.getPointAt(t), n = frames.normals[i], b = frames.binormals[i];
    const th = (j / radial) * Math.PI * 2;
    const r = r0 + (r1 - r0) * Math.pow(t, 3.4);
    const rr = r * (1 + 0.06 * t * t * Math.cos(10 * th));
    return p.clone().addScaledVector(n, Math.cos(th) * rr).addScaledVector(b, Math.sin(th) * rr);
  };
  for (let i = 0; i <= segs; i++) {
    for (let j = 0; j <= radial; j++) pos.push(...ring(i / segs, i, j).toArray());
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geometry: g, rim: Array.from({ length: radial }, (_, j) => ring(1, segs, j)) };
}
const hornCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(P.x, Y0 + 0.44, P.z),
  new THREE.Vector3(P.x - 0.04, Y0 + 0.85, P.z - 0.36),
  new THREE.Vector3(P.x - 0.48, Y0 + 1.55, P.z - 0.52),
  new THREE.Vector3(P.x - 0.82, Y0 + 2.2, P.z - 0.12),
  new THREE.Vector3(P.x - 0.55, Y0 + 2.62, P.z + 0.6),
]);
const horn = hornGeometry(hornCurve, 140, 80, 0.075, 1.25);
mesh(horn.geometry, brass, gramophone);
mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(horn.rim, true), 160, 0.035, 10, true), brass, gramophone);

// winding crank on the right side
const crank = new THREE.Group();
crank.position.set(CAB.w / 2 + 0.03, CAB.foot + CAB.h * 0.52, 0.45);
gramophone.add(crank);
const shaftDisc = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 32), brass, gramophone, [CAB.w / 2 + 0.03, crank.position.y, crank.position.z]);
shaftDisc.rotation.z = Math.PI / 2;
const shaft = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 16), nickel, crank, [0.13, 0, 0]);
shaft.rotation.z = Math.PI / 2;
mesh(new THREE.BoxGeometry(0.04, 0.5, 0.07), nickel, crank, [0.26, -0.22, 0]);
const handle = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.26, 20), ivory, crank, [0.38, -0.44, 0]);
handle.rotation.z = Math.PI / 2;

// ---------- record labels ----------
const LABEL_COLORS = ["#7a1f1f", "#1f3f6b", "#2f5a3a", "#6b4a12", "#4a2560", "#0f4f52", "#7a3b12"];
function labelColor(title) {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return LABEL_COLORS[h % LABEL_COLORS.length];
}
function wrapLines(g, text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean), lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (g.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last && g.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = last + "…";
  }
  return lines;
}
function recordTexture(title, color, artist) {
  return canvasTexture(1024, (g, S) => {
    const c = S / 2;
    g.fillStyle = "#0a0a0a";
    g.fillRect(0, 0, S, S);
    for (let r = 200; r < 498; r += 1.5) {            // grooves
      g.strokeStyle = `rgba(255, 255, 255, ${0.02 + Math.random() * 0.05})`;
      g.lineWidth = 0.8;
      g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.stroke();
    }
    g.strokeStyle = "rgba(255, 255, 255, .12)";        // lead-in
    g.lineWidth = 3;
    g.beginPath(); g.arc(c, c, 503, 0, Math.PI * 2); g.stroke();

    g.fillStyle = color;                               // paper label
    g.beginPath(); g.arc(c, c, 178, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#d9b25e";
    g.lineWidth = 4;
    g.beginPath(); g.arc(c, c, 168, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(c, c, 158, 0, Math.PI * 2); g.stroke();

    g.fillStyle = "#f3e3bd";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "600 21px 'Josefin Sans', sans-serif";
    g.fillText("G R A M O P H O N E", c, c - 112);
    g.font = "34px Limelight, Georgia, serif";
    const lines = wrapLines(g, title, 250, artist ? 2 : 3);
    const mid = artist ? c - 24 : c - 10;
    lines.forEach((ln, i) => g.fillText(ln, c, mid + (i - (lines.length - 1) / 2) * 40));
    if (artist) {
      g.font = "600 20px 'Josefin Sans', sans-serif";
      g.fillText(wrapLines(g, artist.toUpperCase(), 240, 1)[0], c, c + 50);
    }
    g.font = "600 18px 'Josefin Sans', sans-serif";
    g.fillText("78 R.P.M.", c, c + 112);
    g.fillStyle = "#050505";                           // spindle hole
    g.beginPath(); g.arc(c, c, 9, 0, Math.PI * 2); g.fill();
  });
}

// ---------- tiny tween / wait helpers driven by the render loop ----------
const waiters = [], tweens = new Map();
const until = cond => new Promise(resolve => waiters.push({ cond, resolve }));
const wait = ms => new Promise(r => setTimeout(r, ms));
function tween(obj, prop, to, ms) {
  const prev = tweens.get(obj);
  if (prev && prev.prop === prop) prev.resolve();
  return new Promise(resolve => tweens.set(obj, { prop, from: obj[prop], to, ms, t: 0, resolve }));
}

// ---------- audio ----------
const audio = new Audio();
audio.preload = "auto";
let ctx, master, dryGain, wetGain, crackleGain;

function crackleBuffer(ac) {
  const len = ac.sampleRate * 6, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  let lp = 0;
  for (let i = 0; i < len; i++) { lp += (Math.random() * 2 - 1 - lp) * 0.2; d[i] = lp * 0.03; }
  for (let k = 0; k < 70; k++) {                       // pops and ticks
    const at = Math.floor(Math.random() * (len - 400)), amp = 0.12 + Math.random() * 0.5, tau = 4 + Math.random() * 18;
    for (let j = 0; j < 300; j++) d[at + j] += amp * Math.exp(-j / tau) * (j % 2 ? 1 : -1);
  }
  return buf;
}
function softClip(amount) {
  const n = 1024, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * amount) / Math.tanh(amount); }
  return curve;
}
function ensureAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  master = ctx.createGain();
  master.gain.value = volume();
  dryGain = ctx.createGain();
  wetGain = ctx.createGain();
  // shellac and horn: narrow band, a horn resonance, gentle saturation
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 300; hp.Q.value = 0.7;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200; lp.Q.value = 0.9;
  const horn = ctx.createBiquadFilter(); horn.type = "peaking"; horn.frequency.value = 1400; horn.Q.value = 0.9; horn.gain.value = 5;
  const sat = ctx.createWaveShaper(); sat.curve = softClip(1.8);
  src.connect(dryGain).connect(master);
  src.connect(hp).connect(lp).connect(horn).connect(sat).connect(wetGain).connect(master);
  const crackle = ctx.createBufferSource();
  crackle.buffer = crackleBuffer(ctx);
  crackle.loop = true;
  crackleGain = ctx.createGain();
  crackleGain.gain.value = 0;
  crackle.connect(crackleGain).connect(master);
  crackle.start();
  master.connect(ctx.destination);
  applyTone();
}
const volume = () => (+$("vol").value / 100) ** 1.6;
function applyTone() {
  if (!ctx) return;
  const vintage = $("vintage").checked, t = ctx.currentTime;
  dryGain.gain.setTargetAtTime(vintage ? 0 : 1, t, 0.05);
  wetGain.gain.setTargetAtTime(vintage ? 0.9 : 0, t, 0.05);
  crackleGain.gain.setTargetAtTime(vintage && needleOn ? 0.35 : 0, t, 0.05);
}

// ---------- player state ----------
const $ = id => document.getElementById(id);
const records = [];
let current = -1, token = 0, wanted = false, engaged = false, needleOn = false, wound = false, unlocked = false;
const st = { spin: 0, spinTarget: 0, arm: REST, lift: LIFT_UP, liftTarget: LIFT_UP, crank: 0 };

function fmt(s) {
  if (!isFinite(s)) return "0:00";
  s = Math.max(0, Math.floor(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function setNeedle(on) { needleOn = on; applyTone(); }
function setStatus(text) { $("status").textContent = text; }

// Safari only lets audio start inside a click, so play-and-pause once while we have one
function unlock() {
  if (unlocked) return;
  unlocked = true;
  const at = audio.currentTime;
  audio.muted = true;
  audio.play().then(() => { audio.pause(); audio.currentTime = at; audio.muted = false; })
    .catch(() => { audio.muted = false; });
}

async function play() {
  if (current < 0) return;
  const my = ++token;
  wanted = true;
  renderUI();
  ensureAudio();
  unlock();
  await ctx.resume();
  if (!wound) {
    setStatus("Winding");
    st.crank = 10;
    await wait(950);
    if (my !== token) return;
    wound = true;
  }
  setStatus("Cueing");
  st.spinTarget = SPIN;
  engaged = true;
  await until(() => Math.abs(st.arm - armTarget()) < 0.004);
  if (my !== token) return;
  st.liftTarget = 0;
  await until(() => st.lift <= 0.0005);
  if (my !== token) return;
  setNeedle(true);
  try {
    await audio.play();
    if (my === token) setStatus("Playing");
  } catch {
    if (my === token) pause();
  }
}

function pause() {
  ++token;
  wanted = false;
  audio.pause();
  setNeedle(false);
  st.liftTarget = LIFT_UP;
  st.spinTarget = 0;
  setStatus(current < 0 ? "Needle up" : "Paused");
  renderUI();
}

async function park() {
  pause();
  const my = token;
  await until(() => st.lift >= LIFT_UP - 0.001);
  if (my !== token) return;
  engaged = false;
  setStatus("Needle up");
  await until(() => Math.abs(st.arm - REST) < 0.01);
}

async function load(i, autoplay) {
  const before = token;
  await park();
  if (token !== before + 1) return;               // park() bumps the token once; anything more means a newer action
  const mine = token;
  if (record.visible) await tween(record.position, "y", 1.7, 420);
  if (mine !== token) return;
  current = i;
  wound = false;
  const r = records[i];
  if (labelMat.map) labelMat.map.dispose();
  labelMat.map = recordTexture(r.title, r.color, r.artist);
  labelMat.needsUpdate = true;
  audio.src = r.url;
  audio.load();
  $("error").hidden = true;
  record.visible = true;
  record.position.y = 1.7;
  renderUI();
  await tween(record.position, "y", PLATTER_H, 520);
  if (mine !== token) return;
  if (autoplay) play();
}

function armTarget() {
  if (!engaged) return REST;
  const p = audio.duration ? THREE.MathUtils.clamp(audio.currentTime / audio.duration, 0, 1) : 0;
  return armAngleFor(R_OUT - (R_OUT - R_IN) * p);
}

audio.addEventListener("ended", () => {
  const next = current + 1;
  if (next < records.length) load(next, true);
  else { audio.currentTime = 0; park(); }
});
audio.addEventListener("loadedmetadata", () => {
  if (records[current]) records[current].duration = audio.duration;
  renderUI();
});
audio.addEventListener("error", () => {
  if (!audio.src) return;
  $("error").textContent = "This file couldn't be played. Try an MP3, M4A, WAV or OGG file.";
  $("error").hidden = false;
  pause();
});

// ---------- UI ----------
function renderUI() {
  const r = records[current];
  $("title").textContent = r ? r.name : "No record on the platter";
  $("play").disabled = !r;
  $("play").classList.toggle("on", wanted);
  $("play").setAttribute("aria-label", wanted ? "Pause" : "Play");
  $("seek").disabled = !r;
  const list = $("crate");
  list.innerHTML = "";
  records.forEach((rec, i) => {
    const li = document.createElement("li");
    if (i === current) li.className = "current";
    li.innerHTML = `<button type="button"><span class="disc"></span><span class="name"></span><span class="len"></span></button>`;
    li.querySelector(".disc").style.background = rec.color;
    li.querySelector(".name").textContent = rec.name;
    li.querySelector(".len").textContent = rec.duration ? fmt(rec.duration) : "";
    li.querySelector("button").addEventListener("click", () => {
      if (i === current) wanted ? pause() : play();
      else { ensureAudio(); unlock(); load(i, true); }
    });
    list.append(li);
  });
}

function addFiles(files) {
  const before = records.length;
  for (const f of files) {
    if (!f.type.startsWith("audio/") && !/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm)$/i.test(f.name)) continue;
    const name = f.name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim() || "Untitled";
    records.push({ ...splitName(name), url: URL.createObjectURL(f), color: labelColor(name) });
    probeDuration(records.at(-1));
  }
  if (records.length === before) {
    $("error").textContent = "Those weren't audio files. Add MP3s or other audio.";
    $("error").hidden = false;
    return;
  }
  $("error").hidden = true;
  renderUI();
  // put the first new record on the platter, unless something is playing
  if (!wanted) { ensureAudio(); unlock(); load(before, false); }
}
// "Artist - Title" file names put the artist on its own line of the label
function splitName(name) {
  const m = name.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  return m ? { name, artist: m[1], title: m[2] } : { name, artist: "", title: name };
}
function probeDuration(rec) {
  const a = new Audio();
  a.preload = "metadata";
  a.src = rec.url;
  a.addEventListener("loadedmetadata", () => { rec.duration = a.duration; renderUI(); }, { once: true });
}

$("play").addEventListener("click", () => (wanted ? pause() : play()));
$("file").addEventListener("change", e => { addFiles(e.target.files); e.target.value = ""; });
$("vintage").addEventListener("change", applyTone);
$("vol").addEventListener("input", () => { if (master) master.gain.setTargetAtTime(volume(), ctx.currentTime, 0.03); });
let seeking = false;
$("seek").addEventListener("input", e => {
  seeking = true;
  if (audio.duration) audio.currentTime = (e.target.value / 1000) * audio.duration;
});
$("seek").addEventListener("change", () => { seeking = false; });
window.addEventListener("keydown", e => {
  if (e.code !== "Space" || e.target.closest("input, button")) return;
  e.preventDefault();
  if (current >= 0) wanted ? pause() : play();
});

let dragDepth = 0;
window.addEventListener("dragenter", e => { e.preventDefault(); dragDepth++; $("drop").hidden = false; });
window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("drop").hidden = true; } });
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => {
  e.preventDefault();
  dragDepth = 0;
  $("drop").hidden = true;
  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
});

// ---------- demo record: a short waltz rendered in the browser ----------
async function demoRecord() {
  const sr = 22050, beat = 0.5, bars = 16, len = bars * 3 * beat + 1.5;
  const oc = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
  const out = oc.createGain();
  out.gain.value = 0.5;
  out.connect(oc.destination);
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const note = (midi, t, dur, type, vol) => {
    const o = oc.createOscillator(), g = oc.createGain();
    o.type = type;
    o.frequency.value = hz(midi);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  };
  const N = { B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, D6: 86 };
  const melody = [
    ["E5", 1], ["G5", 1], ["C6", 1], ["B5", 2], ["G5", 1], ["A5", 1], ["F5", 1], ["A5", 1], ["G5", 3],
    ["F5", 1], ["A5", 1], ["D6", 1], ["C6", 2], ["A5", 1], ["G5", 1], ["E5", 1], ["F5", 1], ["D5", 3],
    ["E5", 1], ["G5", 1], ["C6", 1], ["D6", 2], ["B5", 1], ["C6", 1], ["A5", 1], ["F5", 1], ["E5", 3],
    ["A5", 1], ["F5", 1], ["D5", 1], ["G5", 2], ["F5", 1], ["E5", 1], ["D5", 1], ["B4", 1], ["C5", 3],
  ];
  let t = 0.3;
  for (const [n, beats] of melody) { note(N[n], t, beats * beat * 1.1, "triangle", 0.32); t += beats * beat; }
  const chords = { C: [48, 64, 67], G: [43, 62, 65], F: [41, 60, 69], D: [50, 65, 69] };
  "C G F C F C D G C G F C F G C C".split(" ").forEach((name, bar) => {
    const [root, a, b] = chords[name], t0 = 0.3 + bar * 3 * beat;
    note(root, t0, beat * 1.6, "sine", 0.4);
    for (const k of [1, 2]) { note(a, t0 + k * beat, beat * 0.7, "sine", 0.12); note(b, t0 + k * beat, beat * 0.7, "sine", 0.12); }
  });
  const buf = await oc.startRendering();
  return new Blob([wav(buf)], { type: "audio/wav" });
}
function wav(buf) {
  const data = buf.getChannelData(0), n = data.length, view = new DataView(new ArrayBuffer(44 + n * 2));
  const str = (o, s) => [...s].forEach((ch, i) => view.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF"); view.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, buf.sampleRate, true); view.setUint32(28, buf.sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, "data"); view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 0x7fff, true);
  return view;
}

// ---------- render loop ----------
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // keep the whole machine in frame on narrow screens
  camera.fov = w / h < 0.8 ? 52 : w / h < 1.2 ? 42 : 34;
  camera.updateProjectionMatrix();
  // on tall screens the player card covers the bottom, so lift the machine up the frame
  controls.target.y = w / h < 0.8 ? 1.3 : 2.0;
}
window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);

  st.spin += (st.spinTarget - st.spin) * (1 - Math.exp(-dt * 1.5));
  platter.rotation.y -= st.spin * dt;

  const step = (from, to, rate) => from + THREE.MathUtils.clamp(to - from, -rate * dt, rate * dt);
  st.arm = step(st.arm, armTarget(), 0.8);
  st.lift = step(st.lift, st.liftTarget, 0.22);
  armYaw.rotation.y = -st.arm;
  armLift.rotation.z = st.lift;

  crank.rotation.x -= st.crank * dt;
  st.crank *= Math.exp(-dt * 1.2);
  if (st.crank < 0.05) st.crank = 0;

  for (const [obj, tw] of tweens) {
    tw.t = Math.min(1, tw.t + (dt * 1000) / tw.ms);
    const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - (-2 * tw.t + 2) ** 2 / 2;
    obj[tw.prop] = tw.from + (tw.to - tw.from) * e;
    if (tw.t >= 1) { tweens.delete(obj); tw.resolve(); }
  }
  for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].cond()) waiters.splice(i, 1)[0].resolve();

  if (current >= 0) {
    $("cur").textContent = fmt(audio.currentTime);
    $("dur").textContent = fmt(audio.duration);
    if (!seeking && audio.duration) $("seek").value = Math.round((audio.currentTime / audio.duration) * 1000);
  }

  controls.update();
  renderer.render(scene, camera);
});

// fonts first, so the record labels are drawn in the right typeface
await Promise.race([
  Promise.all([document.fonts.load("34px Limelight"), document.fonts.load("600 21px 'Josefin Sans'")]),
  wait(2500),
]);
// built-in records ship in records/; any file that's missing is skipped
const BUILT_IN = [
  ["Desingerica - Folkicc", "records/desingerica-folkicc.mp3"],
  ["Sinan Sakić - Ej, otkad sam se rodio", "records/sinan-sakic-ej-otkad-sam-se-rodio.mp3"],
  ["Bejbi Motorola - Smuti", "records/bejbi-motorola-smuti.mp3"],
  ["Šta sam jeo", "records/sta-sam-jeo.mp3"],
];
const found = await Promise.all(BUILT_IN.map(([, url]) =>
  fetch(url, { method: "HEAD" }).then(r => r.ok).catch(() => false)));
BUILT_IN.forEach(([name, url], i) => {
  if (!found[i]) return;
  records.push({ ...splitName(name), url, color: labelColor(name) });
  probeDuration(records.at(-1));
});
const demo = await demoRecord();
records.push({ ...splitName("Demo Waltz"), url: URL.createObjectURL(demo), color: "#7a1f1f", duration: 25.5 });
renderUI();
load(0, false);
