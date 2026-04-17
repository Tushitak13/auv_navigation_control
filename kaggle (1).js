// ============================================================
// AUV Mission Control v11 — Kaggle Dataset Integration
//
//   Dataset 1: Oil Spill Classification (SAR)
//              300 images · 2 classes · CC BY 4.0
//   Dataset 2: Ocean Waste Detector (Roboflow ocean_waste v1)
//              ~500 images · 15 classes · CC BY 4.0
// ============================================================

/** Build the Ocean Waste class tags inside #ds-plastic-classes */
function buildOceanWasteClasses() {
  const cont = document.getElementById('ds-plastic-classes');
  OCEAN_WASTE_CLASSES.forEach(c => {
    const s = document.createElement('span');
    s.className = 'ds-cls';
    s.style.borderColor = c.color + ',0.5)';
    s.style.color       = c.color + ',0.9)';
    s.textContent = c.icon + ' ' + c.name;
    cont.appendChild(s);
  });
}

/** Animate model accuracy / mAP loading (simulates model initialization) */
function animateModelLoad() {
  let acc = 0, mAP = 0;
  const interval = setInterval(() => {
    acc  = Math.min(94.2, acc  + 2.1 + Math.random() * 1.5);
    mAP  = Math.min(78.5, mAP  + 1.8 + Math.random() * 1.2);
    oilModelAcc  = acc;
    wasteModelMAP = mAP;
    document.getElementById('ds-oil-acc').textContent = acc.toFixed(1) + '%';
    document.getElementById('ds-map').textContent     = mAP.toFixed(1) + '%';
    if (acc >= 94.2 && mAP >= 78.5) clearInterval(interval);
  }, 80);
}

/**
 * Tick: update live inference bars.
 * Called every 20 frames from the main tick loop.
 */
function updateKaggleInference() {
  // -- Oil spill confidence --
  let nearOilConf = 0;
  oilSpills.forEach(s => {
    const d     = distF(auv.x, auv.y, s.x, s.y);
    const range = (s.r + s.spread) * 3;
    if (d < range) nearOilConf = Math.max(nearOilConf, (1 - d / range) * 100);
  });
  const oilConf   = Math.min(99, nearOilConf + (Math.random() - 0.5) * 3);
  const noOilConf = 100 - oilConf;

  const barOil    = document.getElementById('ds-bar-oil');
  const barNoOil  = document.getElementById('ds-bar-nooil');
  const valOil    = document.getElementById('ds-val-oil');
  const valNoOil  = document.getElementById('ds-val-nooil');
  if (barOil)   { barOil.style.width   = oilConf.toFixed(1)   + '%'; valOil.textContent   = oilConf.toFixed(0)   + '%'; }
  if (barNoOil) { barNoOil.style.width = noOilConf.toFixed(1) + '%'; valNoOil.textContent = noOilConf.toFixed(0) + '%'; }

  // -- Ocean waste live detections near AUV --
  const liveDiv    = document.getElementById('ds-plastic-live');
  if (!liveDiv) return;
  const nearPlastic = plasticItems.filter(p => !p.collected && p.detected && distF(auv.x, auv.y, p.x, p.y) < 100);

  if (nearPlastic.length === 0) {
    liveDiv.innerHTML = '<div style="font-size:7px;color:var(--tx3)">scanning…</div>';
    return;
  }

  const typeMap = { BOTTLE: 'pbottle', NET: 'net', MICRO: 'plastic', BAG: 'pbag', DEBRIS: 'misc' };
  liveDiv.innerHTML = nearPlastic.slice(0, 4).map(p => {
    const cls  = OCEAN_WASTE_CLASSES.find(c => c.name === (typeMap[p.type] || 'plastic')) || OCEAN_WASTE_CLASSES[11];
    const conf = 55 + Math.random() * 35;
    const confCls = conf > 80 ? 'obj-high' : conf > 65 ? 'obj-med' : 'obj-low';
    return `<div class="ds-conf-row">
      <span class="ds-conf-lbl">${cls.icon} ${cls.name}</span>
      <div class="ds-conf-bar-bg">
        <div class="ds-conf-bar" style="background:${cls.color},0.7);width:${conf.toFixed(0)}%"></div>
      </div>
      <span class="ds-conf-val ${confCls}" style="color:unset;background:unset;border:none;padding:0">${conf.toFixed(0)}%</span>
    </div>`;
  }).join('');
}
