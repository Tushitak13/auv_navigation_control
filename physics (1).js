// ============================================================
// AUV Mission Control v11 — AUV Physics & SLAM
// ============================================================

/**
 * Apply one physics step toward goal (gx, gy).
 * Handles: goal attraction, obstacle repulsion, boundary forces,
 * ocean currents, turbulence, collision resolution, SLAM update.
 */
function applyPhysics(gx, gy) {
  let fx = 0, fy = 0;

  // Goal attraction
  if (gx !== null) {
    const dg = distF(auv.x, auv.y, gx, gy);
    if (dg > 0) { fx += (gx - auv.x) / dg * 2.2; fy += (gy - auv.y) / dg * 2.2; }
  }

  // Obstacle repulsion
  for (const o of obs) {
    const d = distF(auv.x, auv.y, o.x, o.y);
    const inf = o.r + 40;
    if (d < inf && d > 0) {
      const k = 4 * (inf - d) / inf;
      fx -= (o.x - auv.x) / d * k;
      fy -= (o.y - auv.y) / d * k;
    }
  }

  // Boundary repulsion
  const bm = MG + 18;
  if (auv.x < bm)     fx += 3.5 * (bm - auv.x) / bm;
  if (auv.x > W - bm) fx -= 3.5 * (auv.x - (W - bm)) / bm;
  if (auv.y < bm)     fy += 3.5 * (bm - auv.y) / bm;
  if (auv.y > H - bm) fy -= 3.5 * (auv.y - (H - bm)) / bm;

  // Ocean current
  const crad = E.curdir * Math.PI / 180;
  fx += Math.cos(crad) * E.cur * 0.032;
  fy += Math.sin(crad) * E.cur * 0.032;

  // Turbulence noise
  fx += (Math.random() - 0.5) * E.turb * 0.065;
  fy += (Math.random() - 0.5) * E.turb * 0.065;

  // Apply velocity with smoothing
  const fm   = Math.sqrt(fx * fx + fy * fy) || 0.01;
  const tspd = Math.min(2.4, fm * 0.65 + 0.35);
  const nx2  = fx / fm, ny2 = fy / fm;
  auv.vx = auv.vx * 0.72 + nx2 * tspd * 0.28;
  auv.vy = auv.vy * 0.72 + ny2 * tspd * 0.28;
  const vmag = Math.sqrt(auv.vx ** 2 + auv.vy ** 2);
  if (vmag > 2.4) { auv.vx *= 2.4 / vmag; auv.vy *= 2.4 / vmag; }

  auv.x += auv.vx;
  auv.y += auv.vy;
  auv.x = safeNum(clampF(auv.x, MG, W - MG), HOME.x);
  auv.y = safeNum(clampF(auv.y, MG, H - MG), HOME.y);
  auv.vx = safeNum(auv.vx, 0.5);
  auv.vy = safeNum(auv.vy, 0);

  // Obstacle collision resolution (iterative push-out)
  for (let it = 0; it < 12; it++) {
    for (const o of obs) {
      const d  = distF(auv.x, auv.y, o.x, o.y);
      const md = o.r + AR + 2;
      if (d < md && d > 0.01) {
        const nxx = (auv.x - o.x) / d;
        const nyy = (auv.y - o.y) / d;
        auv.x = o.x + nxx * md;
        auv.y = o.y + nyy * md;
        const dot = auv.vx * nxx + auv.vy * nyy;
        if (dot < 0) { auv.vx -= 1.4 * dot * nxx; auv.vy -= 1.4 * dot * nyy; }
      }
    }
  }
  auv.x = clampF(auv.x, MG, W - MG);
  auv.y = clampF(auv.y, MG, H - MG);
  auv.hdg = safeNum(Math.atan2(auv.vy, auv.vx) * 180 / Math.PI, 0);

  // Stuck detection
  if (distF(auv.x, auv.y, stuckX, stuckY) < 2.5) stuckT++;
  else { stuckT = 0; stuckX = auv.x; stuckY = auv.y; }

  // Trail
  if (frame % 2 === 0) {
    auv.trail.push({ x: auv.x, y: auv.y });
    if (auv.trail.length > 250) auv.trail.shift();
  }

  // SLAM landmark discovery
  if (frame % 25 === 0) {
    for (const o of obs) {
      if (distF(auv.x, auv.y, o.x, o.y) < 90 &&
          auv.landmarks.every(l => distF(l.x, l.y, o.x, o.y) > 5)) {
        auv.landmarks.push({ x: o.x + (Math.random() * 4 - 2), y: o.y + (Math.random() * 4 - 2) });
      }
    }
    slamQuality = Math.min(100, 55 + auv.landmarks.length * 3);
  }
  if (frame % 18 === 0) {
    slamPoses.push({ x: auv.x, y: auv.y });
    if (slamPoses.length > 100) slamPoses.shift();
  }

  // Current particles
  if (frame % 3 === 0 && E.cur > 0.3)
    particles.push({ x: Math.random() * W, y: Math.random() * H, life: 50 + Math.random() * 50 });
  particles = particles.filter(p => {
    p.x += Math.cos(E.curdir * Math.PI / 180) * E.cur * 0.5;
    p.y += Math.sin(E.curdir * Math.PI / 180) * E.cur * 0.5;
    p.life--;
    return p.life > 0 && p.x > 0 && p.x < W && p.y > 0 && p.y < H;
  });

  // Pressure bubbles
  if (E.pres > 50 && frame % 5 === 0)
    bubbles.push({ x: MG + Math.random() * (W - 2 * MG), y: H - MG, life: 35 + Math.random() * 35 });
  bubbles = bubbles.filter(b => { b.y -= 0.7 + Math.random() * 0.3; b.life--; return b.life > 0; });

  // Oil spill drift & detection
  oilSpills.forEach(s => {
    s.age++;
    s.spread = Math.min(s.r * 1.8, s.spread + 0.015);
    s.x = clampF(s.x + Math.cos(E.curdir * Math.PI / 180) * E.cur * 0.02, MG, W - MG);
    s.y = clampF(s.y + Math.sin(E.curdir * Math.PI / 180) * E.cur * 0.02, MG, H - MG);
    if (!s.detected && distF(auv.x, auv.y, s.x, s.y) < 75) {
      s.detected = true;
      detectedSpills++;
      log('⚠ ' + s.type + ' spill detected! [oil_spill CNN: triggered]', 'oil');
    }
  });

  // Plastic drift, detection & collection
  plasticItems.forEach(p => {
    p.age++;
    if (!p.collected) {
      p.x = clampF(p.x + Math.cos(E.curdir * Math.PI / 180) * E.cur * 0.01 * (Math.random() + 0.5), MG, W - MG);
      p.y = clampF(p.y + Math.sin(E.curdir * Math.PI / 180) * E.cur * 0.01 * (Math.random() + 0.5), MG, H - MG);
      if (!p.detected && distF(auv.x, auv.y, p.x, p.y) < 65) {
        p.detected = true;
        const typeMap = { BOTTLE: 'pbottle', NET: 'net', MICRO: 'plastic', BAG: 'pbag', DEBRIS: 'misc' };
        const dsClass = typeMap[p.type] || 'plastic';
        log('♻ ' + p.type + ' [ocean_waste: ' + dsClass + '] detected', 'plastic');
        if (plasticZones.every(z => distF(z.x, z.y, p.x, p.y) > 30))
          plasticZones.push({ x: p.x, y: p.y, density: 1 });
        else
          plasticZones.forEach(z => { if (distF(z.x, z.y, p.x, p.y) < 30) z.density++; });
      }
      if (p.detected && p.type !== 'NET' && distF(auv.x, auv.y, p.x, p.y) < 18) {
        p.collected = true;
        collectedPlastic++;
        log('♻ ' + p.type + ' collected! Total: ' + collectedPlastic, 'plastic');
      }
    }
  });
}
