// ============================================================
// AUV Mission Control v11 — Canvas Rendering Engine
// ============================================================

/** Derive water background colour from env state */
function waterColor() {
  const v  = E.vis / 100, t = Math.min(1, E.turb / 10), dp = Math.min(1, E.dep / 3000);
  let r = Math.round(2 + t * 10);
  let g = Math.round(12 + v * 10 - t * 5);
  let b2 = Math.round(24 + v * 25 + dp * 18 - t * 8);
  if (oilPPM > 30) { r = Math.min(255, r + Math.round(oilPPM * 0.12)); g = Math.max(0, g - Math.round(oilPPM * 0.04)); }
  return `rgb(${r},${g},${b2})`;
}

/** Main render frame */
function render() {
  cx.clearRect(0, 0, W, H);
  cx.fillStyle = waterColor(); cx.fillRect(0, 0, W, H);

  // Low-visibility fog
  if (E.vis < 80) { cx.fillStyle = `rgba(3,8,18,${(100 - E.vis) / 100 * 0.5})`; cx.fillRect(0, 0, W, H); }

  // ---- DEPTH ZONES ----
  if (L.depthz) {
    const dg = cx.createLinearGradient(0, 0, 0, H);
    dg.addColorStop(0,    'rgba(0,80,160,0.12)');
    dg.addColorStop(0.33, 'rgba(0,50,120,0.08)');
    dg.addColorStop(0.66, 'rgba(0,30,80,0.06)');
    dg.addColorStop(1,    'rgba(0,10,40,0.14)');
    cx.fillStyle = dg; cx.fillRect(0, 0, W, H);
    [0.33, 0.66].forEach(fy => {
      cx.strokeStyle = 'rgba(0,100,180,0.12)'; cx.lineWidth = 0.5; cx.setLineDash([12, 8]);
      cx.beginPath(); cx.moveTo(0, fy * H); cx.lineTo(W, fy * H); cx.stroke(); cx.setLineDash([]);
    });
  }

  // Surface zone + waves
  const sfH = 18;
  const sfg = cx.createLinearGradient(0, 0, 0, sfH);
  sfg.addColorStop(0, 'rgba(10,60,100,0.9)'); sfg.addColorStop(1, 'rgba(2,12,24,0)');
  cx.fillStyle = sfg; cx.fillRect(0, 0, W, sfH);
  cx.strokeStyle = 'rgba(100,200,255,0.3)'; cx.lineWidth = 1; cx.setLineDash([8, 4]);
  cx.beginPath(); cx.moveTo(0, sfH); cx.lineTo(W, sfH); cx.stroke(); cx.setLineDash([]);
  cx.fillStyle = 'rgba(100,200,255,0.35)'; cx.font = '7px Share Tech Mono,monospace'; cx.fillText('SURFACE', 5, 12);

  if (E.wave > 0.3) {
    cx.strokeStyle = `rgba(100,180,255,${Math.min(0.25, E.wave * 0.05)})`; cx.lineWidth = 0.5; cx.setLineDash([5, 7]);
    for (let i = 0; i < 3; i++) {
      const y = 8 + i * 5 + Math.sin(frame * 0.04 + i) * E.wave * 1.5;
      cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke();
    }
    cx.setLineDash([]);
  }

  // Thermal layer
  if (E.therm > 0) {
    const ty = H * 0.35 + E.therm * 5;
    const tg = cx.createLinearGradient(0, ty - 12, 0, ty + 12);
    tg.addColorStop(0, 'rgba(220,130,40,0.1)'); tg.addColorStop(1, 'rgba(40,90,200,0.08)');
    cx.fillStyle = tg; cx.fillRect(0, ty - 12, W, 24);
    cx.strokeStyle = 'rgba(200,155,70,0.25)'; cx.lineWidth = 0.7; cx.setLineDash([6, 4]);
    cx.beginPath(); cx.moveTo(0, ty); cx.lineTo(W, ty); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = 'rgba(200,155,70,0.5)'; cx.font = '7px monospace';
    cx.fillText('THERMOCLINE Δ' + (E.therm * 3).toFixed(0) + '°C', 6, ty - 3);
  }

  // Bubbles
  cx.fillStyle = 'rgba(140,200,255,0.2)';
  for (const b of bubbles) { cx.beginPath(); cx.arc(b.x, b.y, 1.5, 0, Math.PI * 2); cx.fill(); }

  // Current particles + arrow
  if (L.cur) {
    cx.fillStyle = 'rgba(80,150,255,0.28)';
    for (const p of particles) { cx.beginPath(); cx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); cx.fill(); }
    if (E.cur > 0.2) {
      const px = W - 55, py = H - 55, len = 18, r = E.curdir * Math.PI / 180;
      cx.strokeStyle = 'rgba(80,190,255,0.6)'; cx.lineWidth = 1.2;
      cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px + Math.cos(r) * len, py + Math.sin(r) * len); cx.stroke();
      cx.fillStyle = 'rgba(80,190,255,0.5)'; cx.font = '7px monospace';
      cx.fillText(E.cur.toFixed(1) + 'kn', px - 18, py + 14);
    }
  }

  // ---- OIL / CHEM SPILLS ----
  if (L.spill) {
    oilSpills.forEach(s => {
      const totalR = s.r + s.spread;
      const spillColors = { OIL: 'rgba(60,30,0', ACID: 'rgba(80,180,0', TOXIC: 'rgba(180,0,80', FUEL: 'rgba(100,40,0' };
      const sc = spillColors[s.type] || 'rgba(60,30,0';
      const sg2 = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, totalR);
      sg2.addColorStop(0, sc + ',0.55)'); sg2.addColorStop(0.5, sc + ',0.28)'); sg2.addColorStop(1, sc + ',0)');
      cx.fillStyle = sg2; cx.beginPath(); cx.arc(s.x, s.y, totalR, 0, Math.PI * 2); cx.fill();
      if (s.type === 'OIL' || s.type === 'FUEL') {
        const sh = cx.createRadialGradient(s.x - 3, s.y - 3, 0, s.x, s.y, totalR * 0.7);
        sh.addColorStop(0, 'rgba(150,220,255,0.1)'); sh.addColorStop(0.4, 'rgba(200,150,255,0.06)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
        cx.fillStyle = sh; cx.beginPath(); cx.arc(s.x, s.y, totalR * 0.7, 0, Math.PI * 2); cx.fill();
      }
      if (s.detected) {
        cx.strokeStyle = s.type === 'TOXIC' ? 'rgba(255,50,150,0.55)' : 'rgba(255,140,0,0.55)';
        cx.lineWidth = 1.2; cx.setLineDash([4, 3]);
        cx.beginPath(); cx.arc(s.x, s.y, totalR + 8, 0, Math.PI * 2); cx.stroke(); cx.setLineDash([]);
        const pulse = (frame % 30) / 30;
        cx.strokeStyle = `rgba(255,140,0,${0.35 * (1 - pulse)})`; cx.lineWidth = 0.8;
        cx.beginPath(); cx.arc(s.x, s.y, totalR + 10 + pulse * 22, 0, Math.PI * 2); cx.stroke();
      }
      cx.fillStyle = s.detected ? 'rgba(255,140,0,0.85)' : 'rgba(180,100,0,0.4)';
      cx.font = 'bold 7px monospace'; cx.fillText(s.type, s.x - 12, s.y - totalR - 4);
    });
  }

  // ---- PLASTIC DEBRIS ----
  if (L.plastic) {
    const pcols = { BOTTLE: 'rgba(0,200,255', NET: 'rgba(180,180,0', MICRO: 'rgba(255,100,200', BAG: 'rgba(150,255,200', DEBRIS: 'rgba(200,200,100' };
    plasticItems.forEach(p => {
      if (p.collected) return;
      const pc = pcols[p.type] || 'rgba(0,200,255';
      const alpha = p.detected ? 0.85 : 0.3;
      cx.fillStyle = pc + ',' + alpha + ')';
      if (p.type === 'NET') {
        cx.strokeStyle = pc + ',' + alpha + ')'; cx.lineWidth = 1; cx.beginPath();
        for (let i = 0; i < 4; i++) {
          cx.moveTo(p.x - p.size + i * p.size * 0.67, p.y - p.size); cx.lineTo(p.x - p.size + i * p.size * 0.67, p.y + p.size);
          cx.moveTo(p.x - p.size, p.y - p.size + i * p.size * 0.67); cx.lineTo(p.x + p.size, p.y - p.size + i * p.size * 0.67);
        }
        cx.stroke();
      } else {
        cx.beginPath(); cx.arc(p.x, p.y, p.size, 0, Math.PI * 2); cx.fill();
      }
      if (p.detected) {
        cx.strokeStyle = pc + ',0.6)'; cx.lineWidth = 0.8; cx.setLineDash([2, 2]);
        cx.beginPath(); cx.arc(p.x, p.y, p.size + 6, 0, Math.PI * 2); cx.stroke(); cx.setLineDash([]);
        cx.fillStyle = pc + ',0.7)'; cx.font = '7px monospace';
        cx.fillText(p.type.slice(0, 3), p.x + p.size + 2, p.y - 2);
      }
    });
    // Plastic density zones
    plasticZones.forEach(z => {
      const zg = cx.createRadialGradient(z.x, z.y, 0, z.x, z.y, 28);
      zg.addColorStop(0, 'rgba(0,200,220,' + Math.min(0.15, z.density * 0.04) + ')');
      zg.addColorStop(1, 'rgba(0,200,220,0)');
      cx.fillStyle = zg; cx.beginPath(); cx.arc(z.x, z.y, 28, 0, Math.PI * 2); cx.fill();
    });
  }

  // ---- DETECTED OBJECTS (marine life) ----
  if (L.objdet) {
    detectedObjects.filter(o => o.detected).forEach(o => {
      const fade = Math.min(1, (1800 - o.age) / 200);
      cx.globalAlpha = fade * 0.7;
      cx.strokeStyle = o.color + ',0.6)'; cx.lineWidth = 1; cx.setLineDash([3, 2]);
      cx.beginPath(); cx.arc(o.x, o.y, 12, 0, Math.PI * 2); cx.stroke(); cx.setLineDash([]);
      cx.globalAlpha = fade;
      cx.fillStyle = 'rgba(6,12,22,0.75)'; cx.fillRect(o.x - 14, o.y - 22, 28, 13);
      cx.fillStyle = o.color + ',0.9)'; cx.font = 'bold 7px monospace';
      cx.fillText(o.icon + ' ' + o.type.slice(0, 4), o.x - 12, o.y - 12);
      cx.globalAlpha = 1;
    });
  }

  // ---- OBSTACLES ----
  obs.forEach(o => {
    const og = cx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    og.addColorStop(0, 'rgba(40,20,0,0.85)'); og.addColorStop(0.6, 'rgba(60,30,10,0.7)'); og.addColorStop(1, 'rgba(20,10,0,0.5)');
    cx.fillStyle = og; cx.beginPath(); cx.arc(o.x, o.y, o.r, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = o.userPlaced ? 'rgba(255,100,60,0.7)' : 'rgba(120,60,20,0.5)'; cx.lineWidth = 1;
    cx.beginPath(); cx.arc(o.x, o.y, o.r, 0, Math.PI * 2); cx.stroke();
  });

  // ---- HOME BASE ----
  cx.strokeStyle = 'rgba(0,200,255,0.6)'; cx.lineWidth = 1.5;
  cx.beginPath(); cx.arc(HOME.x, HOME.y, 14, 0, Math.PI * 2); cx.stroke();
  cx.fillStyle = 'rgba(0,200,255,0.15)'; cx.beginPath(); cx.arc(HOME.x, HOME.y, 14, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = 'rgba(0,200,255,0.9)'; cx.font = 'bold 11px monospace'; cx.fillText('⌂', HOME.x - 6, HOME.y + 4);

  // ---- SONAR RINGS ----
  if (L.sonar) {
    const sonarR = 55 * (E.vis / 100);
    for (let i = 1; i <= 3; i++) {
      const pr = (frame % 60) / 60;
      const sr = sonarR * ((i / 3 + pr) % 1);
      cx.strokeStyle = `rgba(0,200,255,${0.18 * (1 - sr / sonarR)})`; cx.lineWidth = 0.8;
      cx.beginPath(); cx.arc(auv.x, auv.y, sr, 0, Math.PI * 2); cx.stroke();
    }
  }

  // ---- COVARIANCE ELLIPSE (EKF) ----
  if (L.cov) {
    const covR = safeNum(E.turb * 3 + E.pres * 0.2 + (100 - E.vis) * 0.15, 5);
    cx.strokeStyle = 'rgba(0,200,255,0.2)'; cx.lineWidth = 0.8;
    cx.beginPath(); cx.ellipse(auv.x, auv.y, covR * 1.3, covR * 0.9, auv.hdg * Math.PI / 180, 0, Math.PI * 2); cx.stroke();
  }

  // ---- TRAIL ----
  if (L.trail && auv.trail.length > 2) {
    cx.strokeStyle = isReturningHome ? 'rgba(0,180,255,0.25)' : isSurfacing ? 'rgba(50,220,150,0.25)' : 'rgba(0,120,255,0.3)';
    cx.lineWidth = 1.2; cx.beginPath();
    cx.moveTo(auv.trail[0].x, auv.trail[0].y);
    for (let i = 1; i < auv.trail.length; i++) cx.lineTo(auv.trail[i].x, auv.trail[i].y);
    cx.stroke();
  }

  // ---- SLAM POSES ----
  if (L.slam) {
    cx.fillStyle = 'rgba(100,180,255,0.3)';
    for (let i = 0; i < slamPoses.length; i += 3) { cx.beginPath(); cx.arc(slamPoses[i].x, slamPoses[i].y, 1.2, 0, Math.PI * 2); cx.fill(); }
    cx.fillStyle = 'rgba(0,200,255,0.45)';
    for (const lm of auv.landmarks) { cx.beginPath(); cx.arc(lm.x, lm.y, 1.8, 0, Math.PI * 2); cx.fill(); }
  }

  // ---- A* PATH ----
  if (L.path && path.length > 1) {
    cx.strokeStyle = isReturningHome ? 'rgba(0,180,255,0.5)' : 'rgba(0,255,200,0.45)';
    cx.lineWidth = 1.2; cx.setLineDash([5, 4]); cx.beginPath();
    cx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) cx.lineTo(path[i].x, path[i].y);
    cx.stroke(); cx.setLineDash([]);
  }

  // ---- WAYPOINTS ----
  wps.forEach((w, i) => {
    const reached = i < wpIdx;
    cx.strokeStyle = i === wpIdx ? 'rgba(50,220,100,0.8)' : reached ? 'rgba(50,120,80,0.4)' : 'rgba(80,130,200,0.5)';
    cx.lineWidth = i === wpIdx ? 1.5 : 1;
    cx.beginPath(); cx.arc(w.x, w.y, 6, 0, Math.PI * 2); cx.stroke();
    if (i === wpIdx) {
      const pulse = (frame % 40) / 40;
      cx.strokeStyle = `rgba(50,220,100,${0.4 * (1 - pulse)})`; cx.lineWidth = 0.8;
      cx.beginPath(); cx.arc(w.x, w.y, 6 + pulse * 12, 0, Math.PI * 2); cx.stroke();
    }
    cx.fillStyle = i === wpIdx ? 'rgba(50,220,100,0.9)' : reached ? 'rgba(50,120,80,0.5)' : 'rgba(80,130,200,0.7)';
    cx.font = 'bold 8px monospace';
    cx.fillText('WP' + (i + 1), w.x + 8, w.y - 6);
  });

  // ---- AUV ----
  {
    const spd2 = Math.sqrt(auv.vx ** 2 + auv.vy ** 2) / 2.4;
    cx.save();
    cx.translate(auv.x, auv.y);
    cx.rotate((auv.hdg + 90) * Math.PI / 180);

    // Thruster glow
    if (spd2 > 0.1) {
      const tg = cx.createRadialGradient(0, 10, 0, 0, 10, 10);
      tg.addColorStop(0, `rgba(0,180,255,${spd2 * 0.6})`); tg.addColorStop(1, 'transparent');
      cx.fillStyle = tg; cx.beginPath(); cx.arc(0, 10, 10, 0, Math.PI * 2); cx.fill();
    }

    const hullCol = isReturningHome ? '#0a5a7a' : isSurfacing ? '#1a7a60' : battery < 15 ? '#5a1a0a' : '#1a5a8a';
    cx.fillStyle = hullCol; cx.beginPath(); cx.ellipse(0, 0, AR * 0.52, AR * 1.2, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,0.1)'; cx.beginPath(); cx.ellipse(-2, -2, 2.5, 5.5, 0, 0, Math.PI * 2); cx.fill();

    const noseCol = isReturningHome ? '#00a0cc' : isSurfacing ? '#22aa88' : battery < 15 ? '#aa3300' : '#2080bb';
    cx.fillStyle = noseCol; cx.beginPath();
    cx.moveTo(-AR * 0.52, -AR * 1.2); cx.quadraticCurveTo(0, -AR * 2, AR * 0.52, -AR * 1.2); cx.fill();

    cx.fillStyle = 'rgba(60,140,200,0.65)';
    [[-1], [1]].forEach(([s]) => {
      cx.beginPath(); cx.moveTo(s * AR * 0.52, AR * 0.7); cx.lineTo(s * AR * 1.5, AR * 1.3);
      cx.lineTo(s * AR * 0.52, AR * 1.3); cx.closePath(); cx.fill();
    });

    const dotCol = battery < 15 ? 'rgba(255,74,74,0.95)' : oilPPM > 10 ? 'rgba(255,140,0,0.9)' : 'rgba(0,212,255,0.9)';
    cx.fillStyle = dotCol; cx.beginPath(); cx.arc(0, -AR * 1.35, 2.5, 0, Math.PI * 2); cx.fill();

    if (battery < 15 && frame % 20 < 10) {
      cx.strokeStyle = 'rgba(255,74,74,0.8)'; cx.lineWidth = 1.5;
      cx.beginPath(); cx.arc(0, 0, AR * 1.8, 0, Math.PI * 2); cx.stroke();
    }
    cx.restore();
  }

  // ---- PLACEMENT GHOST PREVIEW ----
  if (placeMode && ghostX > 0 && ghostY > 0) {
    if (placeMode === 'obstacle') {
      cx.save(); cx.globalAlpha = 0.55;
      const og2 = cx.createRadialGradient(ghostX, ghostY, 0, ghostX, ghostY, currentObsSize);
      og2.addColorStop(0, 'rgba(255,80,30,0.7)'); og2.addColorStop(1, 'rgba(180,40,20,0.4)');
      cx.fillStyle = og2; cx.beginPath(); cx.arc(ghostX, ghostY, currentObsSize, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = 'rgba(255,120,60,0.8)'; cx.lineWidth = 1.2; cx.setLineDash([4, 3]);
      cx.beginPath(); cx.arc(ghostX, ghostY, currentObsSize, 0, Math.PI * 2); cx.stroke(); cx.setLineDash([]);
      cx.restore();
      cx.fillStyle = 'rgba(255,120,60,0.9)'; cx.font = 'bold 8px monospace';
      cx.fillText('OBSTACLE r=' + currentObsSize, ghostX + currentObsSize + 4, ghostY - 2);
    } else {
      cx.save(); cx.globalAlpha = 0.6;
      cx.strokeStyle = 'rgba(50,220,100,0.9)'; cx.lineWidth = 1.5; cx.setLineDash([3, 2]);
      cx.beginPath(); cx.arc(ghostX, ghostY, 8, 0, Math.PI * 2); cx.stroke();
      cx.beginPath();
      cx.moveTo(ghostX - 6, ghostY); cx.lineTo(ghostX + 6, ghostY);
      cx.moveTo(ghostX, ghostY - 6); cx.lineTo(ghostX, ghostY + 6);
      cx.stroke(); cx.setLineDash([]); cx.restore();
      cx.fillStyle = 'rgba(50,220,100,0.9)'; cx.font = 'bold 8px monospace';
      cx.fillText('WP' + (wps.length + 1), ghostX + 11, ghostY - 4);
    }
  }

  // ---- DEPTH RULER ----
  cx.fillStyle = 'rgba(80,150,200,0.35)'; cx.font = '7px monospace';
  for (let i = 0; i <= 4; i++) {
    const y = H * 0.1 + i * (H * 0.8 / 4);
    cx.fillText(Math.round(E.dep * (i / 4)) + 'm', 3, y + 3);
    cx.strokeStyle = 'rgba(80,150,200,0.15)'; cx.lineWidth = 0.4;
    cx.beginPath(); cx.moveTo(20, y); cx.lineTo(25, y); cx.stroke();
  }

  if (minimapVisible) renderMinimap();
}

/** Render the minimap overlay */
function renderMinimap() {
  const mw = 100, mh = 75;
  mmCx.clearRect(0, 0, mw, mh);
  mmCx.fillStyle = 'rgba(2,8,16,0.85)'; mmCx.fillRect(0, 0, mw, mh);
  const sx = mw / W, sy = mh / H;

  mmCx.fillStyle = 'rgba(200,50,30,0.7)';
  for (const o of obs) { mmCx.beginPath(); mmCx.arc(o.x * sx, o.y * sy, Math.max(1.5, o.r * sx), 0, Math.PI * 2); mmCx.fill(); }

  if (auv.trail.length > 2) {
    mmCx.strokeStyle = 'rgba(60,140,255,0.4)'; mmCx.lineWidth = 0.8; mmCx.beginPath();
    mmCx.moveTo(auv.trail[0].x * sx, auv.trail[0].y * sy);
    for (let i = 1; i < auv.trail.length; i += 3) mmCx.lineTo(auv.trail[i].x * sx, auv.trail[i].y * sy);
    mmCx.stroke();
  }

  wps.forEach((w, i) => {
    mmCx.strokeStyle = i === wpIdx ? 'rgba(50,220,100,0.8)' : 'rgba(80,130,200,0.5)';
    mmCx.lineWidth = 0.8; mmCx.beginPath(); mmCx.arc(w.x * sx, w.y * sy, 3, 0, Math.PI * 2); mmCx.stroke();
  });

  oilSpills.forEach(s => { mmCx.fillStyle = 'rgba(200,100,0,0.5)'; mmCx.beginPath(); mmCx.arc(s.x * sx, s.y * sy, 2, 0, Math.PI * 2); mmCx.fill(); });
  plasticItems.filter(p => !p.collected && p.detected).forEach(p => { mmCx.fillStyle = 'rgba(0,200,220,0.5)'; mmCx.beginPath(); mmCx.arc(p.x * sx, p.y * sy, 1.5, 0, Math.PI * 2); mmCx.fill(); });
  detectedObjects.filter(o => o.detected).forEach(o => { mmCx.fillStyle = 'rgba(150,100,255,0.5)'; mmCx.beginPath(); mmCx.arc(o.x * sx, o.y * sy, 1.5, 0, Math.PI * 2); mmCx.fill(); });

  mmCx.strokeStyle = 'rgba(0,200,255,0.7)'; mmCx.lineWidth = 1;
  mmCx.beginPath(); mmCx.arc(HOME.x * sx, HOME.y * sy, 3.5, 0, Math.PI * 2); mmCx.stroke();
  mmCx.fillStyle = 'rgba(0,212,255,0.9)'; mmCx.beginPath(); mmCx.arc(auv.x * sx, auv.y * sy, 2.5, 0, Math.PI * 2); mmCx.fill();

  if (placeMode && ghostX > 0) {
    const mc = placeMode === 'obstacle' ? 'rgba(255,80,30,0.7)' : 'rgba(50,220,100,0.7)';
    mmCx.fillStyle = mc; mmCx.beginPath(); mmCx.arc(ghostX * sx, ghostY * sy, 2, 0, Math.PI * 2); mmCx.fill();
  }

  mmCx.strokeStyle = 'rgba(30,58,74,0.8)'; mmCx.lineWidth = 1; mmCx.strokeRect(0, 0, mw, mh);
}
