// ============================================================
// AUV Mission Control v11 — HUD, Stats & Battery UI
// ============================================================

/** Update the HUD strip, mini-charts, and AI pipeline panel */
function updateHUD() {
  const posErr = safeNum(E.turb * 0.28 + E.pres * 0.018 + (100 - E.vis) * 0.035, 0);
  const fusConf = safeNum(Math.max(20, 100 - E.turb * 4 - E.pres * 0.25 - (100 - E.vis) * 0.28), 100);
  const spd     = safeNum(Math.sqrt(auv.vx ** 2 + auv.vy ** 2), 0);

  const setH = (id, txt, cls) => {
    const e = document.getElementById(id);
    if (e) { e.textContent = txt; if (cls !== undefined) e.className = 'hv' + cls; }
  };
  setH('h-err',  posErr.toFixed(2) + 'm',               posErr  > 3   ? ' c' : posErr  > 1   ? ' w' : '');
  setH('h-conf', fusConf.toFixed(0) + '%',               fusConf < 40  ? ' c' : fusConf < 70  ? ' w' : '');
  setH('h-spd',  spd.toFixed(2) + 'm/s', '');
  setH('h-hdg',  ((auv.hdg + 360) % 360).toFixed(0) + '°', '');
  setH('h-dep',  Math.round(E.dep) + 'm', '');
  setH('h-wps',  isReturningHome ? 'HOME↩' : isSurfacing ? 'SURF↑' : wpIdx + '/' + wps.length, '');
  setH('h-temp', waterTemp.toFixed(1) + '°',   waterTemp < 2 || waterTemp > 30 ? ' c' : waterTemp < 5 ? ' w' : '');
  setH('h-ph',   phLevel.toFixed(1),            phLevel < 6 ? ' c' : phLevel < 6.8 ? ' w' : '');
  setH('h-sal',  salinityLevel.toFixed(0) + '‰', '');
  setH('h-turb', turbidityLevel,                turbidityLevel === 'CRITICAL' ? ' c' : turbidityLevel === 'HIGH' ? ' w' : '');
  setH('h-wq',   waterQuality,                  waterQuality === 'CRITICAL' || waterQuality === 'POOR' ? ' c' : waterQuality === 'FAIR' ? ' w' : '');

  // History buffers
  errHist.push(posErr);   if (errHist.length  > 80) errHist.shift();
  confHist.push(fusConf); if (confHist.length > 80) confHist.shift();
  batHist.push(battery);  if (batHist.length  > 80) batHist.shift();

  // Mini charts
  drawMiniChart('ce', errHist,  'rgba(255,74,74,0.85)',    0, 10);
  drawMiniChart('cc', confHist, 'rgba(29,222,140,0.85)',   0, 100);
  drawMiniChart('cb', batHist,  'rgba(0,212,255,0.85)',    0, 100);

  // AI pipeline pulse
  for (let i = 0; i < 8; i++) {
    const el = document.getElementById('pn' + i);
    if (el) el.className = 'pn' + (aiStage === i ? ' act' : '');
  }
}

/** Update the battery bar and percentage label */
function updateBatteryUI() {
  const pct   = Math.max(0, Math.min(100, battery));
  const inner = document.getElementById('bat-bar-inner');
  const pctEl = document.getElementById('bat-pct');
  inner.style.width      = pct + '%';
  const col              = pct > 30 ? '#1dde8c' : pct > 15 ? '#f5a623' : '#ff4a4a';
  inner.style.background = col;
  pctEl.textContent      = pct.toFixed(0) + '%';
  pctEl.style.color      = col;
}

/** Update the bottom status bar */
function updateStats() {
  const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  s('bs-m',       missionCount);
  s('bs-o',       obs.length);
  s('bs-l',       auv.landmarks.length);
  s('bs-spill',   detectedSpills);
  s('bs-plastic', collectedPlastic);
  s('bs-obj',     totalObjDetected);
  s('bs-d',       E.pres > 80 ? 'DEGRADED' : 'LOCK');

  if (!isSurfacing && !isReturningHome) s('b-mis', 'MISSION ' + (wpIdx + 1));
  else if (isReturningHome)             s('b-mis', 'RTH');
  else                                  s('b-mis', 'SURFACING');

  const sl = document.getElementById('b-slam');
  if (sl) {
    sl.textContent = 'SLAM ' + slamQuality.toFixed(0) + '%';
    sl.className   = 'badge ' + (slamQuality > 70 ? 'info' : slamQuality > 40 ? 'warn' : 'err');
  }

  const modeLabel = waitingForStart ? 'STOPPED'
    : isAtHome      ? 'DOCKED'
    : isAtSurface   ? 'SURFACED'
    : isReturningHome ? 'RTH'
    : isSurfacing   ? 'SURFACING'
    : 'MISSION';
  s('bs-mode', modeLabel);
}

/** Draw a small sparkline chart onto a canvas element */
function drawMiniChart(id, data, color, mn, mx) {
  const el = document.getElementById(id);
  if (!el) return;
  const w = el.parentElement.offsetWidth || 270, h = 38;
  el.width = w; el.height = h;
  const c = el.getContext('2d');
  c.clearRect(0, 0, w, h);
  if (data.length < 2) return;
  c.strokeStyle = color; c.lineWidth = 1.2; c.beginPath();
  data.forEach((v, i) => {
    const px = (i / (data.length - 1)) * w;
    const py = h - (v - mn) / (mx - mn) * h;
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
  });
  c.stroke();
  c.lineTo(w, h); c.lineTo(0, h); c.closePath();
  c.fillStyle = color.replace(/,[0-9.]+\)$/, ',0.08)');
  c.fill();
}
