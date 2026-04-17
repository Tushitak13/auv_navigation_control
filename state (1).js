// ============================================================
// AUV Mission Control v11 — Global State
// ============================================================

// ---- Simulation Control ----
let running = true;
let frame   = 0;
let missionCount = 0;
let aiStage = 0;

// ---- Battery ----
let battery      = 100;
let batteryDrain = 0.004;
let isAtHome     = false;
let isAtSurface  = false;
let waitingForStart = false;

// ---- AUV State ----
let auv = { x: HOME.x, y: HOME.y, vx: 0.5, vy: 0, hdg: 0, trail: [], landmarks: [] };

// ---- Path / Waypoints ----
let obs    = [];
let wps    = [];
let wpIdx  = 0;
let path   = [];
let pathIdx = 0;

// ---- Particles / Bubbles / SLAM ----
let particles  = [];
let bubbles    = [];
let slamPoses  = [];

// ---- History Buffers ----
let errHist  = [];
let confHist = [];
let batHist  = [];

// ---- Stuck Detection ----
let stuckT = 0;
let stuckX = HOME.x;
let stuckY = HOME.y;

// ---- Oil Spill State ----
let oilSpills      = [];
let detectedSpills = 0;

// ---- Plastic State ----
let plasticItems    = [];
let collectedPlastic = 0;
let plasticZones    = [];

// ---- Surface / Home State ----
let isSurfacing      = false;
let isReturningHome  = false;
let surfaceTarget    = null;
let surfacePath      = [];
let surfacePathIdx   = 0;
let emergencyMode    = false;
let emergencyReason  = '';

// ---- Environmental Sensor Readings ----
let oilPPM       = 0;
let phLevel      = 7.2;
let turbidityLevel = 'LOW';
let chemAlert    = false;
let waterTemp    = 18.5;
let salinityLevel = 35;
let waterQuality = 'GOOD';
let slamQuality  = 100;

// ---- Object Detection State ----
let detectedObjects    = [];
let objIdCounter       = 0;
let totalObjDetected   = 0;
let objDetPanelVisible = false;
let lastDetections     = [];

// ---- Layer Visibility ----
const L = {
  sonar: true, path: true, cur: true, trail: true,
  slam: true, cov: true, spill: true, plastic: true,
  objdet: true, depthz: true
};

// ---- Minimap ----
let minimapVisible = true;

// ---- Placement Mode ----
let placeMode      = null;  // 'obstacle' | 'waypoint' | null
let ghostX         = -999;
let ghostY         = -999;
let currentObsSize = 18;

// ---- Active Preset ----
let activeP = 0;

// ---- Kaggle Model Stats ----
let oilModelAcc    = 0;
let wasteModelMAP  = 0;
