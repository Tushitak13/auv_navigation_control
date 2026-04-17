// ============================================================
// AUV Mission Control v11 — Environmental Sensor Simulation
// ============================================================

/**
 * Tick: compute all sensor readings from AUV position + env state,
 * then update sidebar sensor strip and top-bar badges.
 */
function tickEnvSensors() {
  // ---- Oil PPM ----
  let nearOil = 0;
  oilSpills.forEach(s => {
    const d = distF(auv.x, auv.y, s.x, s.y);
    if (d < (s.r + s.spread) * 2.5)
      nearOil += Math.max(0, 300 * (1 - d / ((s.r + s.spread) * 2.5)));
  });
  oilPPM = Math.round(safeNum(nearOil + E.turb * 0.5, 0));

  // ---- pH (reduced by acid spills) ----
  let acidEff = 0;
  oilSpills.filter(s => s.type === 'ACID').forEach(s => {
    const d = distF(auv.x, auv.y, s.x, s.y);
    if (d < 80) acidEff += 1.8 * (1 - d / 80);
  });
  phLevel = safeNum(clampF(7.2 - acidEff + (Math.random() - 0.5) * 0.04, 4.5, 8.5), 7.2);

  // ---- Water temperature (depth + thermal layer) ----
  waterTemp = safeNum(
    clampF(18.5 - (E.dep / 3000) * 14 + E.therm * 0.4 + (Math.random() - 0.5) * 0.1, -2, 32),
    18.5
  );

  // ---- Salinity ----
  salinityLevel = safeNum(
    clampF(E.sal + (E.dep / 3000) * 2 + (Math.random() - 0.5) * 0.05, 0, 40),
    35
  );

  // ---- Turbidity ----
  const turbVal = E.turb / 10;
  turbidityLevel = turbVal < 0.3 ? 'LOW' : turbVal < 0.6 ? 'MED' : turbVal < 0.85 ? 'HIGH' : 'CRITICAL';

  // ---- Water Quality score ----
  const wqScore = 100
    - oilPPM * 0.3
    - (8.5 - phLevel) * 8
    - turbVal * 20
    - (oilSpills.some(s => s.type === 'TOXIC' && distF(auv.x, auv.y, s.x, s.y) < 80) ? 25 : 0);
  waterQuality = wqScore > 80 ? 'GOOD' : wqScore > 55 ? 'FAIR' : wqScore > 30 ? 'POOR' : 'CRITICAL';

  chemAlert = oilSpills.some(s => s.type === 'TOXIC' && distF(auv.x, auv.y, s.x, s.y) < 60);

  // ---- Update sidebar sensor strip ----
  const setS = (id, txt, cls) => {
    const e = document.getElementById(id);
    if (e) { e.textContent = txt; e.className = 'sensor-val ' + cls; }
  };
  setS('s-oil',    'OIL: '   + oilPPM + 'ppm',              oilPPM > 50 ? 'sv-err' : oilPPM > 10 ? 'sv-warn' : 'sv-ok');
  setS('s-ph',     'pH: '    + phLevel.toFixed(1),           phLevel < 6 ? 'sv-err' : phLevel < 6.8 ? 'sv-warn' : 'sv-ok');
  setS('s-temp',   'Temp: '  + waterTemp.toFixed(1) + '°C',  waterTemp < 2 || waterTemp > 30 ? 'sv-err' : waterTemp < 5 || waterTemp > 28 ? 'sv-warn' : 'sv-ok');
  setS('s-sal',    'Sal: '   + salinityLevel.toFixed(1) + '‰', salinityLevel < 28 || salinityLevel > 38 ? 'sv-warn' : 'sv-ok');
  setS('s-turb2',  'Turb: '  + turbidityLevel,               turbidityLevel === 'CRITICAL' ? 'sv-err' : turbidityLevel === 'HIGH' ? 'sv-warn' : 'sv-ok');
  setS('s-wq',     'WQ: '    + waterQuality,                 waterQuality === 'CRITICAL' ? 'sv-err' : waterQuality === 'POOR' ? 'sv-err' : waterQuality === 'FAIR' ? 'sv-warn' : 'sv-ok');

  const plasticNear = plasticItems.filter(p => !p.collected && p.detected).length;
  setS('s-plastic', 'Plastic: ' + plasticNear, plasticNear > 5 ? 'sv-err' : plasticNear > 2 ? 'sv-warn' : 'sv-ok');
  setS('s-chem', chemAlert ? 'Chem: ALERT!' : 'Chem: CLEAR', chemAlert ? 'sv-err' : 'sv-ok');

  // ---- Oil top-bar badge ----
  const oilBadge = document.getElementById('b-oil');
  if (oilPPM > 50 || chemAlert) { oilBadge.textContent = 'OIL ALERT'; oilBadge.className = 'badge err'; }
  else if (oilPPM > 10)         { oilBadge.textContent = 'OIL WARN';  oilBadge.className = 'badge warn'; }
  else                          { oilBadge.textContent = 'OIL CLEAR'; oilBadge.className = 'badge ok'; }

  // ---- Plastic top-bar badge ----
  const plBadge    = document.getElementById('b-plastic');
  const uncollected = plasticItems.filter(p => !p.collected).length;
  if (uncollected > 5)      { plBadge.textContent = 'PLASTIC: ' + uncollected; plBadge.className = 'badge err'; }
  else if (uncollected > 0) { plBadge.textContent = 'PLASTIC: ' + uncollected; plBadge.className = 'badge warn'; }
  else                      { plBadge.textContent = 'PLASTIC CLEAR';           plBadge.className = 'badge ok'; }
}
