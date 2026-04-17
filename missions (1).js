// ============================================================
// AUV Mission Control v11 — Mission Control
//   (surface, return home, emergency RTH, reset, run/pause)
// ============================================================

/** Initialise default obstacles */
function initObs() {
  obs = [
    { x: 180, y: 130, r: OBR }, { x: 330, y: 95,  r: OBR }, { x: 250, y: 220, r: OBR },
    { x: 420, y: 170, r: 22  }, { x: 460, y: 280, r: OBR }, { x: 145, y: 265, r: OBR },
    { x: 340, y: 310, r: 24  }, { x: 220, y: 340, r: 16  }, { x: 430, y: 90,  r: 16  },
    { x: 110, y: 190, r: 14  }, { x: 500, y: 210, r: 18  }, { x: 280, y: 160, r: 12  },
    { x: 540, y: 320, r: 16  }, { x: 380, y: 380, r: 14  }, { x: 580, y: 160, r: 14  },
  ];
}

/** Initialise default waypoints */
function initWPs() {
  wps = [{ x: 540, y: 65 }, { x: 580, y: 380 }, { x: 300, y: 300 }, { x: 70, y: 380 }];
  wpIdx = 0; pathIdx = 0;
}

// ---- Arrival callbacks ----

function onArrivedHome() {
  isAtHome = true; isReturningHome = false; isSurfacing = false; waitingForStart = true; running = false;
  auv.vx = 0; auv.vy = 0;
  const b = document.getElementById('btn-run');
  b.textContent = '▶ RUN'; b.classList.remove('on');
  document.getElementById('b-sys').textContent  = 'AT HOME';
  document.getElementById('b-sys').className    = 'badge info';
  document.getElementById('bs-mode').textContent = 'DOCKED';
  clearEmergency();
  log('⌂ AUV arrived at home base — STOPPED. Press ▶ RUN to resume.', 'ok');
  log('Battery: ' + battery.toFixed(0) + '% — charging...', 'bat');
}

function onArrivedSurface() {
  isAtSurface = true; isSurfacing = false; isReturningHome = false; waitingForStart = true; running = false;
  auv.vx = 0; auv.vy = 0;
  const b = document.getElementById('btn-run');
  b.textContent = '▶ RUN'; b.classList.remove('on');
  document.getElementById('b-sys').textContent  = 'AT SURFACE';
  document.getElementById('b-sys').className    = 'badge info';
  document.getElementById('bs-mode').textContent = 'SURFACED';
  log('▲ AUV at surface — STOPPED. GPS link established. Press ▶ RUN to dive.', 'ok');
}

// ---- Tick sub-routines ----

function tickReturnHome() {
  let gx = null, gy = null;
  if (surfacePath.length > 0 && surfacePathIdx < surfacePath.length) {
    gx = surfacePath[surfacePathIdx].x; gy = surfacePath[surfacePathIdx].y;
    if (distF(auv.x, auv.y, gx, gy) < 12) surfacePathIdx++;
  } else { gx = HOME.x; gy = HOME.y; }
  if (distF(auv.x, auv.y, HOME.x, HOME.y) < 16) { onArrivedHome(); return; }
  applyPhysics(gx, gy);
}

function tickSurface() {
  let gx = null, gy = null;
  if (surfacePath.length > 0 && surfacePathIdx < surfacePath.length) {
    gx = surfacePath[surfacePathIdx].x; gy = surfacePath[surfacePathIdx].y;
    if (distF(auv.x, auv.y, gx, gy) < 12) surfacePathIdx++;
  } else if (surfaceTarget) { gx = surfaceTarget.x; gy = surfaceTarget.y; }
  if (auv.y <= MG + 12) { onArrivedSurface(); return; }
  applyPhysics(gx, gy);
}

// ---- UI actions ----

function doSurface() {
  if (waitingForStart)   { log('Press ▶ RUN to restart AUV', 'warn'); return; }
  if (isReturningHome)   { log('RTH in progress — cancel first', 'warn'); return; }
  if (isSurfacing) {
    isSurfacing = false; surfacePath = [];
    log('Surface ascent cancelled', 'warn');
    if (!running) toggleRun();
    replan(); return;
  }
  isSurfacing = true; emergencyMode = false;
  log('▲ Surface ascent initiated', 'warn');
  planSurfacePath();
  if (!running) toggleRun();
}

function doReturnHome() {
  if (waitingForStart) { log('Press ▶ RUN to restart', 'warn'); return; }
  if (isSurfacing) { isSurfacing = false; surfacePath = []; }
  isReturningHome = true; emergencyMode = false;
  log('⌂ Return to Home initiated — planning path', 'info');
  replanHome();
  if (!running) toggleRun();
}

function triggerEmergencyRTH(reason) {
  if (isAtHome || isAtSurface || waitingForStart) return;
  emergencyMode = true; emergencyReason = reason;
  isSurfacing = false; isReturningHome = true;
  log('🚨 EMERGENCY RTH: ' + reason, 'err');
  replanHome();
  const saEl = document.getElementById('safety-alert');
  document.getElementById('sa-title').textContent = '⚠ ' + reason;
  document.getElementById('sa-sub').textContent   = 'EMERGENCY RETURN TO HOME';
  saEl.classList.add('show');
  document.getElementById('b-safety').textContent = 'EMERGENCY';
  document.getElementById('b-safety').className   = 'badge err pulse';
  if (!running) toggleRun();
}

function clearEmergency() {
  emergencyMode = false;
  document.getElementById('safety-alert').classList.remove('show');
  document.getElementById('b-safety').textContent = 'SAFE';
  document.getElementById('b-safety').className   = 'badge ok';
}

function toggleRun() {
  if (waitingForStart) {
    waitingForStart = false; isAtHome = false; isAtSurface = false; running = true;
    const b = document.getElementById('btn-run');
    b.textContent = '⏸ PAUSE'; b.classList.add('on');
    document.getElementById('b-sys').textContent   = 'NOMINAL';
    document.getElementById('b-sys').className     = 'badge ok';
    document.getElementById('bs-mode').textContent = 'MISSION';
    if (battery < 20) battery = 20;
    replan();
    log('AUV restarted — resuming mission', 'ok');
    return;
  }
  running = !running;
  const b = document.getElementById('btn-run');
  b.textContent = running ? '⏸ PAUSE' : '▶ RUN';
  if (running) b.classList.add('on'); else b.classList.remove('on');
  document.getElementById('b-sys').textContent = running ? 'NOMINAL' : 'PAUSED';
  document.getElementById('b-sys').className   = 'badge ' + (running ? 'ok' : 'warn');
  log(running ? 'Simulation resumed' : 'Simulation paused', running ? 'ok' : 'warn');
}

function doReset() {
  cancelPlaceMode();
  auv = { x: HOME.x, y: HOME.y, vx: 0.5, vy: 0, hdg: 0, trail: [], landmarks: [] };
  stuckT = 0; stuckX = HOME.x; stuckY = HOME.y;
  initObs(); initWPs();
  errHist = []; confHist = []; batHist = []; slamPoses = [];
  bubbles = []; particles = []; missionCount = 0; frame = 0;
  oilSpills = []; plasticItems = []; plasticZones = []; detectedObjects = []; lastDetections = [];
  detectedSpills = 0; collectedPlastic = 0; totalObjDetected = 0; objIdCounter = 0;
  isSurfacing = false; isReturningHome = false; isAtHome = false; isAtSurface = false;
  waitingForStart = false; emergencyMode = false; surfacePath = [];
  battery = 100; slamQuality = 100; oilPPM = 0; phLevel = 7.2; waterTemp = 18.5; salinityLevel = 35;
  running = true;
  const b = document.getElementById('btn-run');
  b.textContent = '⏸ PAUSE'; b.classList.add('on');
  clearEmergency();
  document.getElementById('b-sys').textContent   = 'NOMINAL';
  document.getElementById('b-sys').className     = 'badge ok';
  document.getElementById('bs-mode').textContent = 'MISSION';
  document.getElementById('obj-panel').classList.remove('visible');
  setPreset(activeP);
  log('System reset — AUV Mission Control v11', 'info');
  updateStats();
}
