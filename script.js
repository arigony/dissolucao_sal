const $ = (id) => document.getElementById(id);

/* ---------- Molecular canvas animation ---------- */

const molecularCanvas = $("molecularCanvas");
const mctx = molecularCanvas.getContext("2d");

let molecularRunning = true;
let showLabels = true;
let selectedScene = "auto";
let molecularTime = 0;

const sceneText = {
  auto: {
    title: "Dissolução animada do NaCl",
    text: "<p><strong>Observe:</strong> a água se aproxima da superfície do cristal, alguns íons se separam e ficam hidratados. A animação destaca a sequência conceitual, não uma dinâmica molecular real.</p>"
  },
  crystal: {
    title: "Rede cristalina de NaCl",
    text: "<p><strong>Cristal iônico:</strong> Na⁺ e Cl⁻ estão organizados alternadamente em uma rede mantida por atração eletrostática. A dissolução começa na superfície.</p>"
  },
  water: {
    title: "Água polar se aproxima",
    text: "<p><strong>Água polar:</strong> moléculas de água se aproximam da superfície. O oxigênio tem carga parcial negativa; os hidrogênios, carga parcial positiva.</p>"
  },
  release: {
    title: "Íons de superfície se separam",
    text: "<p><strong>Dissociação:</strong> interações água–íon estabilizam íons de superfície, que começam a se afastar do cristal.</p>"
  },
  hydrated: {
    title: "Íons hidratados em solução",
    text: "<p><strong>Hidratação:</strong> Na⁺ e Cl⁻ ficam cercados por moléculas de água orientadas, formando espécies aquosas móveis.</p>"
  },
  naZoom: {
    title: "Zoom molecular — Na⁺ hidratado",
    text: "<p><strong>Na⁺:</strong> o oxigênio da água, região parcialmente negativa, aponta para o cátion.</p>"
  },
  clZoom: {
    title: "Zoom molecular — Cl⁻ hidratado",
    text: "<p><strong>Cl⁻:</strong> os hidrogênios da água, regiões parcialmente positivas, apontam para o ânion.</p>"
  }
};

function setMolecularScene(scene) {
  selectedScene = scene;
  $("molecularTitle").textContent = sceneText[scene].title;
  $("sceneText").innerHTML = sceneText[scene].text;
  document.querySelectorAll(".scene-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.scene === scene);
  });
}

function project3D(p, angle) {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const x = p.x * ca - p.z * sa;
  const z = p.x * sa + p.z * ca;
  const y = p.y;
  const scale = 520 / (520 + z);
  return {
    x: molecularCanvas.width / 2 + x * scale,
    y: molecularCanvas.height / 2 + y * scale,
    z,
    scale
  };
}

function sphere(x, y, r, color, label = "", alpha = 1) {
  const g = mctx.createRadialGradient(x - r * .35, y - r * .35, r * .15, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(.18, color);
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  mctx.save();
  mctx.globalAlpha = alpha;
  mctx.fillStyle = g;
  mctx.beginPath();
  mctx.arc(x, y, r, 0, Math.PI * 2);
  mctx.fill();
  mctx.restore();

  if (label && showLabels && r > 9) {
    mctx.fillStyle = "#ffffff";
    mctx.font = `${Math.max(12, r * .72)}px Inter, sans-serif`;
    mctx.textAlign = "center";
    mctx.textBaseline = "middle";
    mctx.fillText(label, x, y);
  }
}

function drawBond(x1, y1, x2, y2, color = "rgba(160,225,255,.65)", dash = false) {
  mctx.save();
  mctx.strokeStyle = color;
  mctx.lineWidth = 2;
  if (dash) mctx.setLineDash([7, 8]);
  mctx.beginPath();
  mctx.moveTo(x1, y1);
  mctx.lineTo(x2, y2);
  mctx.stroke();
  mctx.restore();
}

function drawWater(cx, cy, angle, scale = 1, emphasize = false) {
  const ox = cx;
  const oy = cy;
  const hDist = 18 * scale;
  const theta = 0.92;
  const h1 = { x: cx + Math.cos(angle + theta) * hDist, y: cy + Math.sin(angle + theta) * hDist };
  const h2 = { x: cx + Math.cos(angle - theta) * hDist, y: cy + Math.sin(angle - theta) * hDist };

  drawBond(ox, oy, h1.x, h1.y, "rgba(220,245,255,.85)");
  drawBond(ox, oy, h2.x, h2.y, "rgba(220,245,255,.85)");
  sphere(ox, oy, 8 * scale, "#e84135", emphasize ? "O" : "", 1);
  sphere(h1.x, h1.y, 5.4 * scale, "#f4f7fb", emphasize ? "H" : "", 1);
  sphere(h2.x, h2.y, 5.4 * scale, "#f4f7fb", emphasize ? "H" : "", 1);
}

function drawHydrationShell(cx, cy, ionType, radius = 88) {
  const isNa = ionType === "Na";
  sphere(cx, cy, isNa ? 28 : 34, isNa ? "#7c4dff" : "#20a85e", isNa ? "Na⁺" : "Cl⁻");
  const count = 6;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i / count) + molecularTime * 0.15;
    const wx = cx + Math.cos(a) * radius;
    const wy = cy + Math.sin(a) * radius * .72;
    if (isNa) {
      // oxygen toward ion: oxygen closer to ion, hydrogens outward
      drawBond(cx, cy, wx, wy, "rgba(86, 190, 255, .45)", true);
      drawWater(wx, wy, a, 1, true);
    } else {
      // hydrogens toward ion: rotate water with H side inward
      drawBond(cx, cy, wx, wy, "rgba(86, 190, 255, .45)", true);
      drawWater(wx, wy, a + Math.PI, 1, true);
    }
  }
}

function drawCrystalScene(progress) {
  const atoms = [];
  const spacing = 56;
  for (let ix = -2; ix <= 2; ix++) {
    for (let iy = -2; iy <= 2; iy++) {
      for (let iz = -1; iz <= 1; iz++) {
        const type = (ix + iy + iz) % 2 === 0 ? "Na" : "Cl";
        atoms.push({ type, x: ix * spacing, y: iy * spacing * .62, z: iz * spacing + iy * 12 });
      }
    }
  }

  const angle = molecularTime * 0.32;
  const release = Math.max(0, Math.min(1, (progress - .45) / .35));
  const waterApproach = Math.max(0, Math.min(1, progress / .45));

  const releaseIons = [
    { type: "Na", base: { x: 112, y: -28, z: 40 }, target: { x: 230, y: -110, z: 80 } },
    { type: "Cl", base: { x: 112, y: 28, z: -10 }, target: { x: 240, y: 110, z: -40 } }
  ];

  atoms.sort((a, b) => a.z - b.z);
  atoms.forEach((a) => {
    let p = { ...a };
    if (a.x > 90 && Math.abs(a.y) < 45) {
      const match = releaseIons.find(r => r.type === a.type);
      if (match) {
        p.x = match.base.x * (1 - release) + match.target.x * release;
        p.y = match.base.y * (1 - release) + match.target.y * release;
        p.z = match.base.z * (1 - release) + match.target.z * release;
      }
    }

    const pr = project3D(p, angle);
    const r = (a.type === "Na" ? 18 : 24) * pr.scale;
    sphere(pr.x, pr.y, r, a.type === "Na" ? "#7c4dff" : "#20a85e", a.type === "Na" ? "Na⁺" : "Cl⁻", .98);
  });

  // surrounding waters
  for (let i = 0; i < 20; i++) {
    const a = i * 0.74 + molecularTime * 0.7;
    const baseR = 330 - waterApproach * 110;
    const x = molecularCanvas.width / 2 + Math.cos(a) * baseR + Math.sin(i) * 20;
    const y = molecularCanvas.height / 2 + Math.sin(a * 1.17) * 190 + Math.cos(i) * 18;
    drawWater(x, y, a + Math.PI, .78, false);
  }

  if (progress > .65) {
    drawHydrationShell(molecularCanvas.width * .72, molecularCanvas.height * .33, "Na", 58);
    drawHydrationShell(molecularCanvas.width * .72, molecularCanvas.height * .68, "Cl", 64);
  }
}

function drawMolecularCanvas() {
  const w = molecularCanvas.width;
  const h = molecularCanvas.height;
  mctx.clearRect(0, 0, w, h);

  const bg = mctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#1f3148");
  bg.addColorStop(1, "#16263a");
  mctx.fillStyle = bg;
  mctx.fillRect(0, 0, w, h);

  mctx.fillStyle = "rgba(255,255,255,.045)";
  for (let i = 0; i < 60; i++) {
    const x = (Math.sin(i * 12.93) * 0.5 + 0.5) * w;
    const y = (Math.sin(i * 7.21 + 2) * 0.5 + 0.5) * h;
    mctx.beginPath();
    mctx.arc(x, y, 1.2, 0, Math.PI * 2);
    mctx.fill();
  }

  let progress;
  if (selectedScene === "auto") progress = (Math.sin(molecularTime * .45 - Math.PI / 2) + 1) / 2;
  if (selectedScene === "crystal") progress = 0;
  if (selectedScene === "water") progress = .35;
  if (selectedScene === "release") progress = .68;
  if (selectedScene === "hydrated") progress = .92;

  if (selectedScene === "naZoom") {
    drawHydrationShell(w / 2, h / 2, "Na", 112);
  } else if (selectedScene === "clZoom") {
    drawHydrationShell(w / 2, h / 2, "Cl", 112);
  } else {
    drawCrystalScene(progress);
  }

  if (molecularRunning) molecularTime += 0.016;
  requestAnimationFrame(drawMolecularCanvas);
}

document.querySelectorAll(".scene-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMolecularScene(btn.dataset.scene));
});

$("playMolecular").addEventListener("click", () => {
  molecularRunning = !molecularRunning;
  $("playMolecular").textContent = molecularRunning ? "Pausar animação" : "Reproduzir animação";
});

$("labelsToggle").addEventListener("click", () => {
  showLabels = !showLabels;
  $("labelsToggle").textContent = showLabels ? "Ocultar rótulos" : "Mostrar rótulos";
});

setMolecularScene("auto");
drawMolecularCanvas();

/* ---------- Simulation ---------- */

const sim = {
  saltMass: $("saltMass"),
  waterMass: $("waterMass"),
  temperature: $("temperature"),
  agitation: $("agitation"),
  grainSize: $("grainSize"),
  saltMassValue: $("saltMassValue"),
  waterMassValue: $("waterMassValue"),
  temperatureValue: $("temperatureValue"),
  agitationValue: $("agitationValue"),
  start: $("startSim"),
  pause: $("pauseSim"),
  reset: $("resetSim"),
  resetMessage: $("resetMessage"),
  liquid: $("liquid"),
  particleLayer: $("particleLayer"),
  solidLayer: $("solidLayer"),
  timeValue: $("timeValue"),
  stateValue: $("stateValue"),
  capacityValue: $("capacityValue"),
  dissolvedValue: $("dissolvedValue"),
  solidNowValue: $("solidNowValue"),
  excessValue: $("excessValue"),
  saturationValue: $("saturationValue"),
  concentrationValue: $("concentrationValue"),
  conductivityValue: $("conductivityValue"),
  dynamicExplanation: $("dynamicExplanation"),
  kineticsChart: $("kineticsChart"),
  solubilityChart: $("solubilityChart")
};

let running = false;
let interval = null;
let simTime = 0;
let dissolved = 0;
let history = [];
const grainFactors = { fine: 1.35, medium: 1.0, coarse: 0.68 };

function fmt(n, d = 1) {
  return n.toFixed(d).replace(".", ",");
}

function getInputs() {
  return {
    salt: Number(sim.saltMass.value),
    water: Number(sim.waterMass.value),
    temp: Number(sim.temperature.value),
    agitation: Number(sim.agitation.value),
    grain: sim.grainSize.value
  };
}

function solubilityPer100(temp) {
  return 35.7 + (39.2 - 35.7) * (temp / 100);
}

function capacity() {
  const x = getInputs();
  return solubilityPer100(x.temp) * (x.water / 100);
}

function targetDissolved() {
  const x = getInputs();
  return Math.min(x.salt, capacity());
}

function excessAtEquilibrium() {
  const x = getInputs();
  return Math.max(0, x.salt - capacity());
}

function syncLabels() {
  const x = getInputs();
  sim.saltMassValue.textContent = x.salt;
  sim.waterMassValue.textContent = x.water;
  sim.temperatureValue.textContent = x.temp;
  sim.agitationValue.textContent = x.agitation;
}

function resetSimulation(withMessage = false) {
  clearInterval(interval);
  interval = null;
  running = false;
  simTime = 0;
  dissolved = 0;
  history = [];
  updateSimulation();

  if (withMessage) {
    sim.resetMessage.textContent = "Experimento reiniciado para evitar estados fisicamente incoerentes.";
    clearTimeout(resetSimulation.tid);
    resetSimulation.tid = setTimeout(() => sim.resetMessage.textContent = "", 3200);
  }
}

function startSimulation() {
  if (running) return;
  running = true;
  interval = setInterval(stepSimulation, 110);
  updateSimulation();
}

function pauseSimulation() {
  clearInterval(interval);
  interval = null;
  running = false;
  updateSimulation();
}

function stepSimulation() {
  const x = getInputs();
  const target = targetDissolved();

  const tempFactor = 0.78 + (x.temp / 100) * 0.54;
  const agitationFactor = 0.62 + (x.agitation / 100) * 0.75;
  const grainFactor = grainFactors[x.grain];

  const remainingFraction = Math.max((target - dissolved) / Math.max(target, 1), 0.02);
  const k = 0.052 * tempFactor * agitationFactor * grainFactor * remainingFraction;

  dissolved += (target - dissolved) * k * 2.1;
  if (dissolved > target || Math.abs(target - dissolved) < 0.03) {
    dissolved = target;
  }

  simTime += 0.11;
  history.push({ t: simTime, m: dissolved });
  if (history.length > 340) history.shift();

  if (dissolved >= target) pauseSimulation();
  updateSimulation();
}

function updateMetrics() {
  const x = getInputs();
  const cap = capacity();
  const target = targetDissolved();
  const solidNow = Math.max(0, x.salt - dissolved);
  const excess = excessAtEquilibrium();
  const saturation = cap > 0 ? Math.min((dissolved / cap) * 100, 100) : 0;
  const concentration = (dissolved / 58.44) / (x.water / 1000);
  const conductivity = Math.min(dissolved / Math.max(cap, 0.001), 1);

  sim.timeValue.textContent = `${fmt(simTime)} s`;
  sim.stateValue.textContent = running ? "Dissolvendo" : (simTime === 0 ? "Pronto" : (dissolved >= target ? "Equilíbrio" : "Pausado"));
  sim.capacityValue.textContent = `${fmt(cap)} g`;
  sim.dissolvedValue.textContent = `${fmt(dissolved)} g`;
  sim.solidNowValue.textContent = `${fmt(solidNow)} g`;
  sim.excessValue.textContent = `${fmt(excess)} g`;
  sim.saturationValue.textContent = `${fmt(saturation, 0)} %`;
  sim.concentrationValue.textContent = `${fmt(concentration, 2)} mol/L`;
  sim.conductivityValue.textContent = conductivity.toFixed(2).replace(".", ",");

  let msg;
  if (x.salt > cap) {
    msg = `A capacidade estimada é ${fmt(cap)} g. Como foram adicionados ${x.salt} g, cerca de ${fmt(excess)} g permanecerão como sólido no equilíbrio. Agitar pode acelerar, mas não elimina esse excesso.`;
  } else if (x.grain === "fine" && x.agitation > 70) {
    msg = "Sal fino e alta agitação favorecem maior velocidade porque aumentam área de contato e renovação da água junto à superfície do sólido.";
  } else if (x.temp > 70) {
    msg = "A temperatura alta acelera a dissolução. Para NaCl, entretanto, a solubilidade cresce pouco mesmo quando a temperatura aumenta bastante.";
  } else if (x.grain === "coarse") {
    msg = "Grãos grossos tendem a dissolver mais lentamente por menor área superficial exposta, embora a quantidade final dissolvida possa ser a mesma.";
  } else {
    msg = "A água polar se orienta ao redor dos íons: oxigênio para Na⁺ e hidrogênios para Cl⁻. Essa hidratação estabiliza os íons em solução.";
  }
  sim.dynamicExplanation.textContent = msg;
}

function renderBeaker() {
  const x = getInputs();
  const level = 52 + ((x.water - 50) / 150) * 34;
  sim.liquid.style.height = `${level}%`;

  sim.solidLayer.innerHTML = "";
  sim.particleLayer.innerHTML = "";

  const solidNow = Math.max(0, x.salt - dissolved);
  const crystals = Math.min(120, Math.round(solidNow * 1.2));
  for (let i = 0; i < crystals; i++) {
    const c = document.createElement("div");
    c.className = "crystal";
    c.style.left = `${28 + Math.random() * 44}%`;
    c.style.top = `${83 + Math.random() * 11}%`;
    c.style.transform = `rotate(${Math.random() * 90}deg)`;
    sim.solidLayer.appendChild(c);
  }

  const fraction = x.salt > 0 ? dissolved / x.salt : 0;
  const pairs = Math.max(0, Math.round(fraction * 30));
  const top = 100 - level;

  for (let i = 0; i < pairs; i++) {
    const na = document.createElement("div");
    na.className = "b-ion na";
    na.textContent = "+";
    na.style.left = `${19 + Math.random() * 62}%`;
    na.style.top = `${top + 8 + Math.random() * Math.max(level - 18, 8)}%`;

    const cl = document.createElement("div");
    cl.className = "b-ion cl";
    cl.textContent = "–";
    cl.style.left = `${19 + Math.random() * 62}%`;
    cl.style.top = `${top + 8 + Math.random() * Math.max(level - 18, 8)}%`;

    sim.particleLayer.append(na, cl);
  }
}

function drawAxes(ctx, w, h, yLabel, xLabel) {
  const m = 46;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#dfeaf3";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = m + (h - 2*m) * i / 5;
    ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(w - m, y); ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    const x = m + (w - 2*m) * i / 5;
    ctx.beginPath(); ctx.moveTo(x, m); ctx.lineTo(x, h - m); ctx.stroke();
  }

  ctx.strokeStyle = "#8ba6bf";
  ctx.beginPath();
  ctx.moveTo(m, m);
  ctx.lineTo(m, h - m);
  ctx.lineTo(w - m, h - m);
  ctx.stroke();

  ctx.fillStyle = "#5d7288";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(yLabel, 10, 20);
  ctx.fillText(xLabel, w/2 - 28, h - 12);
  return m;
}

function drawKinetics() {
  const canvas = sim.kineticsChart;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const m = drawAxes(ctx, w, h, "massa dissolvida (g)", "tempo (s)");
  const maxM = Math.max(targetDissolved(), 1);
  const maxT = Math.max(history.length ? history[history.length - 1].t : 1, 1);

  ctx.fillStyle = "#5d7288";
  ctx.font = "11px Inter, sans-serif";
  for (let i = 0; i <= 5; i++) {
    const val = maxM * (1 - i / 5);
    const y = m + (h - 2*m) * i / 5;
    ctx.fillText(fmt(val), 5, y + 4);
  }

  const eqY = h - m - (targetDissolved() / maxM) * (h - 2*m);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = "#e28a18";
  ctx.beginPath(); ctx.moveTo(m, eqY); ctx.lineTo(w - m, eqY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#a8640e";
  ctx.fillText("equilíbrio previsto", w - 150, eqY - 8);

  if (history.length < 2) return;
  ctx.strokeStyle = "#225bd6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  history.forEach((p, i) => {
    const x = m + (p.t / maxT) * (w - 2*m);
    const y = h - m - (p.m / maxM) * (h - 2*m);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawSolubility() {
  const canvas = sim.solubilityChart;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const m = drawAxes(ctx, w, h, "g NaCl / 100 g H₂O", "temperatura (°C)");
  const minY = 35, maxY = 40;

  ctx.fillStyle = "#5d7288";
  ctx.font = "11px Inter, sans-serif";
  for (let i = 0; i <= 5; i++) {
    const val = maxY - (maxY - minY) * i / 5;
    const y = m + (h - 2*m) * i / 5;
    ctx.fillText(fmt(val, 1), 5, y + 4);
  }

  ctx.strokeStyle = "#05a6a6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let t = 0; t <= 100; t += 2) {
    const x = m + (t / 100) * (w - 2*m);
    const yVal = solubilityPer100(t);
    const y = h - m - ((yVal - minY) / (maxY - minY)) * (h - 2*m);
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const temp = getInputs().temp;
  const x = m + (temp / 100) * (w - 2*m);
  const yVal = solubilityPer100(temp);
  const y = h - m - ((yVal - minY) / (maxY - minY)) * (h - 2*m);
  ctx.fillStyle = "#225bd6";
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillText(`${temp} °C`, x + 8, y - 8);
}

function updateSimulation() {
  syncLabels();
  updateMetrics();
  renderBeaker();
  drawKinetics();
  drawSolubility();
}

[sim.saltMass, sim.waterMass, sim.temperature].forEach(el => {
  el.addEventListener("input", () => resetSimulation(true));
});
sim.grainSize.addEventListener("change", () => resetSimulation(true));
sim.agitation.addEventListener("input", updateSimulation);
sim.start.addEventListener("click", startSimulation);
sim.pause.addEventListener("click", pauseSimulation);
sim.reset.addEventListener("click", () => resetSimulation(false));

/* ---------- Quiz ---------- */

const quizData = [
  {
    question: "O que acontece com o NaCl quando ele se dissolve em água?",
    options: [
      { text: "Ele desaparece e deixa de existir.", correct: false, feedback: "Não. O sal deixa de ser visto como sólido, mas seus íons continuam na solução." },
      { text: "Ele se dissocia em Na⁺ e Cl⁻ hidratados.", correct: true, feedback: "Correto. A água estabiliza os íons separados por hidratação." },
      { text: "Ele se transforma em moléculas de água.", correct: false, feedback: "Não há transformação em água; há dissociação do sólido iônico." },
      { text: "Ele vira gás dissolvido.", correct: false, feedback: "Não. O produto são íons aquosos, não um gás." }
    ]
  },
  {
    question: "Se há excesso no equilíbrio, onde esse excesso deve aparecer?",
    options: [
      { text: "Como uma linha horizontal dentro da água.", correct: false, feedback: "Essa representação é enganosa. O excesso não fica como uma linha no líquido." },
      { text: "Como sólido no fundo ou não dissolvido.", correct: true, feedback: "Correto. O excesso permanece como sólido em contato com a solução saturada." },
      { text: "Como bolhas na superfície.", correct: false, feedback: "Não há formação de gás nesse processo." },
      { text: "Como água separada em outra fase.", correct: false, feedback: "Não ocorre separação de uma nova fase de água." }
    ]
  },
  {
    question: "Qual parte da água se orienta para o Na⁺?",
    options: [
      { text: "Os hidrogênios, porque são parcialmente negativos.", correct: false, feedback: "Os hidrogênios são parcialmente positivos, não negativos." },
      { text: "O oxigênio, por ter densidade parcial negativa.", correct: true, feedback: "Correto. O oxigênio da água interage favoravelmente com o cátion." },
      { text: "Nenhuma parte: a orientação é aleatória.", correct: false, feedback: "A polaridade da água gera orientação preferencial." },
      { text: "A molécula inteira sem polaridade.", correct: false, feedback: "A água é polar." }
    ]
  },
  {
    question: "Agitar uma solução saturada de NaCl geralmente:",
    options: [
      { text: "Aumenta muito a solubilidade máxima.", correct: false, feedback: "Não. Agitação muda principalmente a velocidade, não o limite de solubilidade." },
      { text: "Ajuda o sistema a chegar mais rápido ao equilíbrio.", correct: true, feedback: "Correto. A agitação renova o contato entre água e sólido." },
      { text: "Remove os íons da solução.", correct: false, feedback: "Não. Os íons continuam em solução." },
      { text: "Impede a hidratação.", correct: false, feedback: "Não. A hidratação continua ocorrendo." }
    ]
  },
  {
    question: "Por que sal fino tende a dissolver mais rápido que sal grosso?",
    options: [
      { text: "Porque possui maior área superficial exposta.", correct: true, feedback: "Correto. Maior área favorece contato com a água." },
      { text: "Porque tem fórmula química diferente.", correct: false, feedback: "Não. A fórmula continua sendo NaCl." },
      { text: "Porque muda a polaridade da água.", correct: false, feedback: "Não. A polaridade da água não muda." },
      { text: "Porque elimina a saturação.", correct: false, feedback: "Não. O limite de solubilidade ainda existe." }
    ]
  },
  {
    question: "Por que a solução aquosa de NaCl conduz eletricidade?",
    options: [
      { text: "Porque contém íons móveis.", correct: true, feedback: "Correto. Íons móveis transportam carga elétrica." },
      { text: "Porque o sal sólido vira metal.", correct: false, feedback: "Não há formação de metal." },
      { text: "Porque a água pura sempre conduz fortemente.", correct: false, feedback: "Água pura tem baixa condutividade; os íons aumentam a condução." },
      { text: "Porque a agitação cria elétrons livres.", correct: false, feedback: "Não. O mecanismo é transporte iônico." }
    ]
  }
];

const userAnswers = new Array(quizData.length).fill(null);

function renderQuiz() {
  const container = $("quizContainer");
  container.innerHTML = "";

  quizData.forEach((item, qi) => {
    const card = document.createElement("article");
    card.className = "card quiz-card";

    const title = document.createElement("h3");
    title.textContent = `${qi + 1}. ${item.question}`;
    card.appendChild(title);

    const list = document.createElement("div");
    list.className = "option-list";

    item.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.type = "button";
      btn.textContent = option.text;

      btn.addEventListener("click", () => {
        if (card.querySelector(".feedback")) return;

        userAnswers[qi] = option.correct;
        [...list.children].forEach(child => child.disabled = true);
        btn.classList.add(option.correct ? "correct" : "incorrect");

        if (!option.correct) {
          [...list.children].forEach((child, index) => {
            if (item.options[index].correct) child.classList.add("correct");
          });
        }

        const feedback = document.createElement("div");
        feedback.className = `feedback ${option.correct ? "correct" : "incorrect"}`;
        feedback.innerHTML = `<strong>${option.correct ? "Muito bem!" : "Atenção:"}</strong> ${option.feedback}`;
        card.appendChild(feedback);
      });

      list.appendChild(btn);
    });

    card.appendChild(list);
    container.appendChild(card);
  });
}

$("finishQuiz").addEventListener("click", () => {
  const answered = userAnswers.filter(v => v !== null).length;
  const score = userAnswers.filter(Boolean).length;
  const total = quizData.length;
  let message;

  if (answered < total) {
    message = `Você respondeu ${answered} de ${total} questões. Complete todas para um diagnóstico melhor.`;
  } else if (score === total) {
    message = "Excelente. Você diferenciou bem dissolução, hidratação, saturação e velocidade.";
  } else if (score >= 4) {
    message = "Ótimo resultado. Revise apenas os pontos em que o feedback indicou dúvida.";
  } else if (score >= 3) {
    message = "Bom começo. Revise principalmente excesso no equilíbrio, hidratação e papel da agitação.";
  } else {
    message = "Vale retomar a sequência: cristal → água polar → hidratação → íons móveis → saturação.";
  }

  const result = $("quizResult");
  result.classList.remove("hidden");
  result.innerHTML = `<h3>Resultado final</h3><p><strong>Pontuação:</strong> ${score} / ${total}</p><p>${message}</p>`;
});

renderQuiz();
updateSimulation();
