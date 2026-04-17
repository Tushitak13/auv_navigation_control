// ============================================================
// AUV Mission Control v11 — Math & Utility Helpers
// ============================================================

/** Euclidean distance between two points */
function distF(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/** Clamp value v between lo and hi */
function clampF(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** Return v if finite and not NaN, else fallback fb */
function safeNum(v, fb) {
  return (isFinite(v) && !isNaN(v)) ? v : fb;
}

/** Random float in [a, b) */
function rnd(a, b) {
  return a + Math.random() * (b - a);
}

// ============================================================
// Mission Log
// ============================================================
const logEl = document.getElementById('lg');
let logLines = [];

/**
 * Append a timestamped line to the mission log.
 * @param {string} msg
 * @param {string} type  ok | warn | err | oil | plastic | env | bat | safe | data
 */
function log(msg, type) {
  const t = new Date().toISOString().substr(11, 8);
  const cls = {
    ok: 'lok', warn: 'lw', err: 'le', oil: 'loil',
    plastic: 'lplastic', env: 'lenv', bat: 'lbat',
    safe: 'lsafe', data: 'ldata'
  }[type] || 'lk';
  logLines.push(`<span class="${cls}">[${t}] ${msg}</span>`);
  if (logLines.length > 100) logLines.shift();
  logEl.innerHTML = logLines.join('<br>');
  logEl.scrollTop = logEl.scrollHeight;
}
