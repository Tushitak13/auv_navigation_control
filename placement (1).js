// ============================================================
// AUV Mission Control v11 — Click-to-Place (Obstacles & Waypoints)
// ============================================================

/** Toggle placement mode on/off */
function togglePlaceMode(mode) {
  if (placeMode === mode) { cancelPlaceMode(); return; }
  placeMode = mode;

  const sw        = document.getElementById('simwrap');
  const tooltip   = document.getElementById('place-tooltip');
  const obsBtn    = document.getElementById('btn-place-obs');
  const wpBtn     = document.getElementById('btn-place-wp');
  const cancelBtn = document.getElementById('btn-place-cancel');

  sw.className        = mode === 'obstacle' ? 'mode-obstacle' : 'mode-waypoint';
  cancelBtn.style.display = 'inline-block';

  if (mode === 'obstacle') {
    tooltip.textContent  = '● OBSTACLE MODE — click canvas to place';
    tooltip.className    = 'mode-obs visible';
    obsBtn.className     = 'btn red place-active-obs';
    wpBtn.className      = 'btn';
    document.getElementById('place-hint').textContent    = 'OBSTACLE MODE active — click anywhere on map. ESC to cancel.';
    document.getElementById('bs-place-hint').textContent = '🔴 OBSTACLE MODE — click map to place obstacle';
  } else {
    tooltip.textContent  = '◎ WAYPOINT MODE — click canvas to place';
    tooltip.className    = 'mode-wp visible';
    wpBtn.className      = 'btn place-active-wp';
    obsBtn.className     = 'btn red';
    document.getElementById('place-hint').textContent    = 'WAYPOINT MODE active — click anywhere on map. ESC to cancel.';
    document.getElementById('bs-place-hint').textContent = '🟢 WAYPOINT MODE — click map to place waypoint';
  }
}

/** Cancel any active placement mode */
function cancelPlaceMode() {
  placeMode = null;
  const sw = document.getElementById('simwrap');
  sw.className = '';
  document.getElementById('place-tooltip').className          = '';
  document.getElementById('btn-place-obs').className          = 'btn red';
  document.getElementById('btn-place-wp').className           = 'btn';
  document.getElementById('btn-place-cancel').style.display   = 'none';
  document.getElementById('place-hint').textContent           = 'Click a button above then click anywhere on the simulation canvas to place.';
  document.getElementById('bs-place-hint').textContent        = 'Click ＋OBSTACLE or ⊕WAYPOINT then click map to place';
  ghostX = -999; ghostY = -999;
}

/** Register all canvas mouse/keyboard event listeners */
function initPlacementEvents(cv) {
  // Left-click to place
  cv.addEventListener('click', function (e) {
    if (!placeMode) return;
    const rect   = cv.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx     = (e.clientX - rect.left) * scaleX;
    const my     = (e.clientY - rect.top)  * scaleY;

    if (placeMode === 'obstacle') {
      if (distF(mx, my, HOME.x, HOME.y) < 30)                              { log('Too close to home base', 'warn'); return; }
      if (distF(mx, my, auv.x,  auv.y)  < 25)                              { log('Too close to AUV', 'warn'); return; }
      if (obs.some(o => distF(mx, my, o.x, o.y) < o.r + currentObsSize + 6)) { log('Overlaps existing obstacle', 'warn'); return; }
      if (mx < MG || mx > W - MG || my < MG || my > H - MG)                { log('Out of bounds', 'warn'); return; }
      obs.push({ x: mx, y: my, r: currentObsSize, userPlaced: true });
      if (!isSurfacing && !isReturningHome) replan();
      log('Obstacle placed at (' + mx.toFixed(0) + ',' + my.toFixed(0) + ') r=' + currentObsSize, 'warn');
      updateStats();

    } else if (placeMode === 'waypoint') {
      if (obs.some(o => distF(mx, my, o.x, o.y) < o.r + 12))  { log('Waypoint inside obstacle', 'warn'); return; }
      if (mx < MG || mx > W - MG || my < MG || my > H - MG)   { log('Out of bounds', 'warn'); return; }
      wps.push({ x: mx, y: my, userPlaced: true });
      log('Waypoint WP' + wps.length + ' placed at (' + mx.toFixed(0) + ',' + my.toFixed(0) + ')', 'ok');
    }
  });

  // Right-click to remove user-placed obstacles
  cv.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    const rect   = cv.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx     = (e.clientX - rect.left) * scaleX;
    const my     = (e.clientY - rect.top)  * scaleY;

    let closest = -1, closestD = Infinity;
    obs.forEach((o, i) => {
      const d = distF(mx, my, o.x, o.y);
      if (d < o.r + 8 && d < closestD) { closestD = d; closest = i; }
    });
    if (closest !== -1) {
      log('Obstacle removed', 'warn');
      obs.splice(closest, 1);
      if (!isSurfacing && !isReturningHome) replan();
      updateStats();
    }
  });

  // Mouse move — update ghost preview
  cv.addEventListener('mousemove', function (e) {
    if (!placeMode) return;
    const rect   = cv.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    ghostX = (e.clientX - rect.left) * scaleX;
    ghostY = (e.clientY - rect.top)  * scaleY;
  });

  cv.addEventListener('mouseleave', function () { ghostX = -999; ghostY = -999; });

  // ESC to cancel
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && placeMode) cancelPlaceMode();
  });
}
