// ============================================================
// AUV Mission Control v11 — Environment (sliders, presets, badges)
// ============================================================

// Live environment values (copied from EDEF on init)
const E = { ...EDEF };

/** Build all environment sliders in the sidebar */
function buildSliders() {
  const cont = document.getElementById('sliders');
  cont.innerHTML = '';
  SLIDERS_CFG.forEach(s => {
    const d = document.createElement('div');
    d.className = 'sr';
    d.innerHTML = `
      <span class="sl">${s.label}</span>
      <input type="range" id="sl-${s.k}" min="${s.min}" max="${s.max}" step="${s.step}" value="${E[s.k]}">
      <span class="sv" id="sv-${s.k}">${E[s.k]}</span>`;
    cont.appendChild(d);
    d.querySelector('input').addEventListener('input', function () {
      E[s.k] = parseFloat(this.value);
      document.getElementById('sv-' + s.k).textContent = parseFloat(this.value).toFixed(s.step < 1 ? 1 : 0);
      updateEnvBadge();
    });
  });
}

/** Build mission scenario preset grid */
function buildPresets() {
  const cont = document.getElementById('presets');
  cont.innerHTML = '';
  PRESETS.forEach((p, i) => {
    const b = document.createElement('div');
    b.className = 'pr' + (i === 0 ? ' a' : '');
    b.id = 'pr' + i;
    b.textContent = p.name;
    b.addEventListener('click', () => setPreset(i));
    cont.appendChild(b);
  });
}

/** Apply a mission preset */
function setPreset(i) {
  activeP = i;
  document.querySelectorAll('.pr').forEach((p, j) => p.classList.toggle('a', j === i));
  const pr = PRESETS[i];
  Object.keys(pr).forEach(k => {
    if (k === 'name') return;
    E[k] = pr[k];
    const sl = document.getElementById('sl-' + k);
    const sv = document.getElementById('sv-' + k);
    if (sl) sl.value = pr[k];
    if (sv) sv.textContent = parseFloat(pr[k]).toFixed(parseFloat(pr[k]) > 10 ? 0 : 1);
  });
  updateEnvBadge();
  replan();
  log('Preset: ' + pr.name, 'info');
  if (i === 6) { spawnOilSpill(3); log('Oil Field: chemical spills spawned', 'oil'); }
  if (i === 7) { spawnPlastic(5); log('Reef preset: plastic debris detected', 'plastic'); }
}

/** Update the top-bar environment badge */
function updateEnvBadge() {
  const s = (E.turb + E.cur + E.wave) / 3;
  const b = document.getElementById('b-env');
  if      (s < 1.5) { b.textContent = 'CALM SEA';  b.className = 'badge ok'; }
  else if (s < 4)   { b.textContent = 'MODERATE';  b.className = 'badge warn'; }
  else if (s < 7)   { b.textContent = 'ROUGH';     b.className = 'badge warn'; }
  else              { b.textContent = 'EXTREME';   b.className = 'badge err'; }
}

/** Toggle layer visibility */
function tog(key, btnId) {
  L[key] = !L[key];
  const btn = document.getElementById(btnId);
  if (L[key]) btn.classList.add('on');
  else        btn.classList.remove('on');
  log((L[key] ? 'Enabled' : 'Disabled') + ' layer: ' + key, 'info');
}

/** Toggle minimap */
function togMinimap() {
  minimapVisible = !minimapVisible;
  document.getElementById('minimap').style.display = minimapVisible ? 'block' : 'none';
  document.getElementById('btn-minimap').classList.toggle('on', minimapVisible);
}
