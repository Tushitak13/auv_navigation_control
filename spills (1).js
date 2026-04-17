// ============================================================
// AUV Mission Control v11 — Oil / Chemical Spill Simulation
// ============================================================

/** Spawn `count` random chemical spills away from obstacles */
function spawnOilSpill(count) {
  for (let i = 0; i < (count || 1); i++) {
    for (let t = 0; t < 30; t++) {
      const x = MG + 20 + Math.random() * (W - 2 * MG - 40);
      const y = MG + 20 + Math.random() * (H - 2 * MG - 40);
      if (obs.every(o => distF(x, y, o.x, o.y) > o.r + 20)) {
        const type = SPILL_TYPES[Math.floor(Math.random() * SPILL_TYPES.length)];
        oilSpills.push({ x, y, r: 12 + Math.random() * 18, spread: 0, type, age: 0, detected: false });
        break;
      }
    }
  }
  updateStats();
}

/** UI button: inject oil drill simulation */
function doSpillDrill() {
  spawnOilSpill(2);
  log('🛢 Oil drill activated! 2 spills injected — AUV will detect & map', 'oil');
}
