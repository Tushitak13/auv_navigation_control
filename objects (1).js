// ============================================================
// AUV Mission Control v11 — Marine Object Detection
//   Model: InceptionResNetV2 (aquarium-data-cots, 7 classes)
// ============================================================

/** Spawn a random detected marine object (near AUV if near=true) */
function spawnDetectedObject(near) {
  const ot = OBJ_TYPES[Math.floor(Math.random() * OBJ_TYPES.length)];
  let x, y;
  if (near) {
    x = clampF(auv.x + (Math.random() - 0.5) * 80, MG + 10, W - MG - 10);
    y = clampF(auv.y + (Math.random() - 0.5) * 80, MG + 10, H - MG - 10);
  } else {
    x = MG + 10 + Math.random() * (W - 2 * MG - 20);
    y = MG + 10 + Math.random() * (H - 2 * MG - 20);
  }
  const conf = Math.floor(rnd(ot.conf[0], ot.conf[1]));
  const obj = {
    x, y, type: ot.type, icon: ot.icon, color: ot.color,
    cls: ot.cls, conf, age: 0, id: objIdCounter++, detected: false
  };
  detectedObjects.push(obj);
  totalObjDetected++;
  return obj;
}

/** UI button: trigger InceptionResNetV2 object scan */
function doObjectScan() {
  for (let i = 0; i < 4; i++) spawnDetectedObject(true);
  log('🔍 InceptionResNetV2 scan — 4 objects classified (aquarium-data-cots)', 'ok');
  document.getElementById('obj-panel').classList.add('visible');
  objDetPanelVisible = true;
}

/** Tick: scan for newly visible objects and update the object detection panel */
function tickObjectDetection() {
  if (frame % 60 === 0 && L.objdet) {
    const sr = 70 * (E.vis / 100);
    detectedObjects.forEach(o => {
      if (!o.detected && distF(auv.x, auv.y, o.x, o.y) < sr) {
        o.detected = true;
        log('🤖 ' + o.icon + ' ' + o.type + ' detected (' + o.conf + '% conf)', 'ok');
        if (o.type === 'SHARK' && distF(auv.x, auv.y, o.x, o.y) < 50)
          log('⚠ SHARK in proximity — sonar ping elevated', 'warn');
      }
    });
    if (Math.random() < 0.015 && detectedObjects.length < 20) {
      const obj = spawnDetectedObject(Math.random() < 0.6);
      if (distF(auv.x, auv.y, obj.x, obj.y) < 80) {
        obj.detected = true;
        log('🤖 ' + obj.icon + ' ' + obj.type + ' auto-detected (' + obj.conf + '%)', 'ok');
      }
    }
  }
  if (L.objdet) {
    lastDetections = detectedObjects
      .filter(o => o.detected && distF(auv.x, auv.y, o.x, o.y) < 100)
      .slice(-5);
    updateObjPanel();
  }
  detectedObjects = detectedObjects.filter(o => { o.age++; return o.age < 1800; });
}

/** Update the floating object-detection panel */
function updateObjPanel() {
  const list = document.getElementById('obj-list');
  if (lastDetections.length === 0) {
    list.innerHTML = '<div style="font-size:8px;color:#2a4a60">scanning...</div>';
    return;
  }
  list.innerHTML = lastDetections.map(o => {
    const cls = o.conf > 85 ? 'obj-high' : o.conf > 70 ? 'obj-med' : 'obj-low';
    return `<div class="obj-item">
      <span class="obj-name">${o.icon} ${o.type}</span>
      <span class="obj-conf ${cls}">${o.conf}%</span>
    </div>`;
  }).join('');
  document.getElementById('obj-panel').classList.add('visible');
}
