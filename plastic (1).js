// ============================================================
// AUV Mission Control v11 — Ocean Plastic Detection & Collection
// ============================================================

/** Spawn `count` plastic debris items at random free positions */
function spawnPlastic(count) {
  for (let i = 0; i < (count || 1); i++) {
    for (let t = 0; t < 30; t++) {
      const x = MG + 10 + Math.random() * (W - 2 * MG - 20);
      const y = MG + 10 + Math.random() * (H - 2 * MG - 20);
      if (obs.every(o => distF(x, y, o.x, o.y) > o.r + 15)) {
        const type = PLASTIC_TYPES[Math.floor(Math.random() * PLASTIC_TYPES.length)];
        plasticItems.push({
          x, y, type, collected: false,
          size: 4 + Math.random() * 8, age: 0, detected: false
        });
        break;
      }
    }
  }
  updateStats();
}

/** UI button: trigger a plastic scan */
function doPlasticScan() {
  spawnPlastic(3);
  log('♻ Plastic scan initiated — 3 items marked', 'plastic');
}
