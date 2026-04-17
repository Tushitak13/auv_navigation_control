// ============================================================
// AUV Mission Control v11 — Path Planning (PRM + Dijkstra)
// ============================================================

/** Check if point (x,y) is in free space (not inside obstacle + margin) */
function inFree(x, y, extra) {
  extra = extra || 0;
  if (x < MG || x > W - MG || y < MG || y > H - MG) return false;
  for (const o of obs) {
    if (distF(x, y, o.x, o.y) < o.r + AR + extra + 4) return false;
  }
  return true;
}

/** Check if the segment from (ax,ay) to (bx,by) is fully in free space */
function segFree(ax, ay, bx, by) {
  const steps = Math.ceil(distF(ax, ay, bx, by) / 4) + 1;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (!inFree(ax + t * (bx - ax), ay + t * (by - ay), 2)) return false;
  }
  return true;
}

/**
 * Build a Probabilistic Roadmap and run Dijkstra on it.
 * Returns a shortcut-optimised path array [{x,y}, ...] or null if unreachable.
 */
function buildPRM(sx, sy, gx, gy, n, crad) {
  const nodes = [
    { x: safeNum(sx, HOME.x), y: safeNum(sy, HOME.y) },
    { x: gx, y: gy }
  ];
  let tries = 0;
  while (nodes.length < n && tries < n * 6) {
    tries++;
    const x = MG + Math.random() * (W - 2 * MG);
    const y = MG + Math.random() * (H - 2 * MG);
    if (inFree(x, y, 3)) nodes.push({ x, y });
  }

  const N = nodes.length;
  const adj = Array.from({ length: N }, () => []);
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const d = distF(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
      if (d < crad && segFree(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y)) {
        adj[i].push({ n: j, d });
        adj[j].push({ n: i, d });
      }
    }
  }

  // Dijkstra
  const dist2 = Array(N).fill(Infinity);
  dist2[0] = 0;
  const prev = Array(N).fill(-1);
  const vis2 = Array(N).fill(false);
  const pq   = [[0, 0]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [, u] = pq.shift();
    if (vis2[u]) continue;
    vis2[u] = true;
    if (u === 1) break;
    for (const { n: v, d: w } of adj[u]) {
      if (dist2[u] + w < dist2[v]) {
        dist2[v] = dist2[u] + w;
        prev[v]  = u;
        pq.push([dist2[v], v]);
      }
    }
  }

  if (!isFinite(dist2[1])) return null;

  let cur = 1;
  const raw = [];
  while (cur !== -1) { raw.push({ x: nodes[cur].x, y: nodes[cur].y }); cur = prev[cur]; }
  return shortcut(raw.reverse());
}

/** Shortcut-smooth a path by greedily skipping nodes when line-of-sight allows */
function shortcut(p) {
  if (p.length < 3) return p;
  const r = [p[0]];
  let i = 0;
  while (i < p.length - 1) {
    let j = p.length - 1;
    while (j > i + 1 && !segFree(p[i].x, p[i].y, p[j].x, p[j].y)) j--;
    r.push(p[j]);
    i = j;
  }
  return r;
}

/** Zigzag escape path when PRM fails */
function buildEscapePath(tx, ty) {
  const pts = [{ x: auv.x, y: auv.y }];
  let cx2 = auv.x, cy2 = auv.y;
  while (distF(cx2, cy2, tx, ty) > 20) {
    const dx = tx - cx2, dy = ty - cy2;
    const dm = Math.sqrt(dx * dx + dy * dy) || 1;
    cy2 = clampF(cy2 + dy / dm * 30, MG + 4, H - MG - 4);
    let bx = clampF(cx2 + dx / dm * 30, MG + 4, W - MG - 4);
    for (const off of [0, -40, 40, -80, 80]) {
      const nx = clampF(cx2 + off, MG + 4, W - MG - 4);
      if (inFree(nx, cy2, 4)) { bx = nx; break; }
    }
    cx2 = bx;
    pts.push({ x: cx2, y: cy2 });
    if (pts.length > 60) break;
  }
  return pts;
}

/** Try to inject an escape vector if stuck */
function tryEscape() {
  for (let a = 0; a < 360; a += 45) {
    const bx = auv.x + 70 * Math.cos(a * Math.PI / 180);
    const by = auv.y + 70 * Math.sin(a * Math.PI / 180);
    if (inFree(bx, by, 0)) {
      path = [{ x: auv.x, y: auv.y }, { x: bx, y: by }];
      pathIdx = 0;
      log('Escape injected', 'warn');
      return;
    }
  }
}

/** Replan path to current waypoint */
function replan() {
  if (isSurfacing || isReturningHome) return;
  if (wpIdx >= wps.length) { path = []; return; }

  // Nudge goal if inside obstacle
  const goal = wps[wpIdx];
  if (!inFree(goal.x, goal.y, 0)) {
    for (let r = 5; r < 40; r += 5) {
      let f = false;
      for (let a = 0; a < 360; a += 30) {
        const nx = goal.x + r * Math.cos(a * Math.PI / 180);
        const ny = goal.y + r * Math.sin(a * Math.PI / 180);
        if (inFree(nx, ny, 0)) { wps[wpIdx] = { x: nx, y: ny }; f = true; break; }
      }
      if (f) break;
    }
  }

  const p = buildPRM(auv.x, auv.y, wps[wpIdx].x, wps[wpIdx].y, 200, 140);
  if (!p) { path = []; log('No route — escape kick', 'err'); tryEscape(); }
  else    { path = p; pathIdx = 0; log('Path found: ' + path.length + ' nodes', 'ok'); }
}

/** Replan path to home base */
function replanHome() {
  const p = buildPRM(auv.x, auv.y, HOME.x, HOME.y, 150, 130);
  if (!p) { surfacePath = buildEscapePath(HOME.x, HOME.y); log('Home: zigzag fallback', 'warn'); }
  else    { surfacePath = p; log('Home path: ' + surfacePath.length + ' nodes', 'ok'); }
  surfacePathIdx = 0;
}

/** Plan path to surface (top of canvas) */
function planSurfacePath() {
  const tx = clampF(auv.x + (Math.random() - 0.5) * 60, MG + 20, W - MG - 20);
  const ty = MG + 8;
  surfaceTarget = { x: tx, y: ty };
  const p = buildPRM(auv.x, auv.y, tx, ty, 120, 110);
  if (!p) { surfacePath = buildEscapePath(tx, ty); log('Surface: zigzag fallback', 'warn'); }
  else    { surfacePath = p; log('Surface path: ' + surfacePath.length + ' nodes', 'ok'); }
  surfacePathIdx = 0;
}
