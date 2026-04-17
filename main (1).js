// ============================================================
// AUV Mission Control v11 — Main Entry Point & Game Loop
// ============================================================

// ---- Canvas setup ----
const cv = document.getElementById('cv');
cv.width  = W; cv.height = H;
cv.style.width = '100%'; cv.style.height = '100%';
const cx = cv.getContext('2d');

const mmCv = document.getElementById('mm-cv');
const mmCx = mmCv.getContext('2d');

// ---- Obstacle size slider ----
const obsSizeSlider = document.getElementById('sl-obs-size');
const obsSizeVal    = document.getElementById('sv-obs-size');
obsSizeSlider.addEventListener('input', function () {
  currentObsSize = parseInt(this.value);
  obsSizeVal.textContent = this.value;
});

// ---- Build UI ----
buildSliders();
buildPresets();
buildOceanWasteClasses();
initPlacementEvents(cv);

// ---- Build object legend ----
(function () {
  const legend = document.getElementById('obj-legend');
  if (legend) {
    legend.innerHTML = OBJ_TYPES
      .map(o => `<span class="obj-tag ${o.cls}">${o.icon} ${o.type}</span>`)
      .join('');
  }
})();

// ---- Init simulation state ----
initObs();
initWPs();
updateBatteryUI();

// ---- Startup logs ----
log('◈ AUV Mission Control v11 online', 'ok');
log('PRM+Dijkstra pathfinder ready', 'ok');
log('EKF sensor fusion active', 'ok');
log('GraphSLAM localization armed', 'ok');
log('📊 Kaggle datasets loaded: Oil Spill SAR (300 imgs) + Ocean Waste v1 (15 cls)', 'data');
log('🛢 OIL DRILL = inject hazard spill for AUV to detect', 'oil');
log('Battery auto-RTH at 15% — home base at ⌂ (top-left)', 'bat');
log('🖱 Click ＋OBSTACLE or ⊕WAYPOINT then click map to place | Right-click obstacle to remove', 'info');

// ---- Deferred spawns ----
setTimeout(() => { replan(); log('Initial path planned', 'ok'); }, 50);
setTimeout(() => { spawnOilSpill(1); spawnPlastic(2); spawnDetectedObject(false); }, 2000);

// ---- Kaggle model load animation ----
setTimeout(() => {
  animateModelLoad();
  log('📊 Oil spill CNN model loaded — SAR dataset (150/150 classes)', 'data');
  log('📊 Ocean waste YOLOv5 loaded — 15 class ocean_waste v1', 'data');
}, 1200);

// ============================================================
// MAIN TICK — called every animation frame
// ============================================================
function tick() {
  if (!running) return;
  frame++;
  aiStage = Math.floor(frame / 15) % 8;

  // NaN guard
  if (!isFinite(auv.x) || !isFinite(auv.y)) {
    auv.x = HOME.x; auv.y = HOME.y; auv.vx = 0.5; auv.vy = 0;
    log('NaN recovery', 'err'); replan(); return;
  }

  // Battery drain
  const movingFast = Math.sqrt(auv.vx ** 2 + auv.vy ** 2) > 1.5;
  const drain      = batteryDrain * (movingFast ? 1.4 : 1) * (E.turb > 5 ? 1.3 : 1);
  battery = Math.max(0, battery - drain);
  updateBatteryUI();

  // Emergency triggers
  if (battery <= 15 && !isReturningHome && !isSurfacing && !isAtHome && !waitingForStart)
    triggerEmergencyRTH('LOW BATTERY');
  if (battery <= 0  && !isAtHome && !isSurfacing && !waitingForStart) {
    battery = 0; triggerEmergencyRTH('BATTERY DEAD');
  }

  // Stuck detection
  if (stuckT > 120 && !isReturningHome && !isSurfacing && !waitingForStart) {
    stuckT = 0;
    auv.vx = (Math.random() - 0.5) * 2.5;
    auv.vy = (Math.random() - 0.5) * 2.5;
    log('AUV stuck! Emergency surface', 'err');
    if (!isSurfacing && !isReturningHome) { isSurfacing = true; planSurfacePath(); }
    return;
  }

  // Dispatch to sub-modes
  if (isReturningHome) { tickReturnHome(); tickEnvSensors(); updateHUD(); updateStats(); return; }
  if (isSurfacing)     { tickSurface();   tickEnvSensors(); updateHUD(); updateStats(); return; }

  // Mission: follow A* path toward current waypoint
  let gx = null, gy = null;
  if (path.length > 0 && pathIdx < path.length) {
    gx = path[pathIdx].x; gy = path[pathIdx].y;
    if (distF(auv.x, auv.y, gx, gy) < 10) pathIdx++;
  } else if (wpIdx < wps.length) {
    gx = wps[wpIdx].x; gy = wps[wpIdx].y;
  }

  // Waypoint arrival
  if (wpIdx < wps.length && distF(auv.x, auv.y, wps[wpIdx].x, wps[wpIdx].y) < 16) {
    missionCount++;
    log('WP' + (wpIdx + 1) + ' reached ✓', 'ok');
    wpIdx++;
    if (wpIdx >= wps.length) wpIdx = 0;
    replan(); updateStats(); return;
  }

  applyPhysics(gx, gy);
  tickEnvSensors();
  tickObjectDetection();
  if (frame % 20 === 0) updateKaggleInference();
  updateHUD();
  updateStats();
}

// ---- Render + tick loop ----
function loop() { tick(); render(); requestAnimationFrame(loop); }
loop();
