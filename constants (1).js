// ============================================================
// AUV Mission Control v11 — Constants & Configuration
// ============================================================

const MG  = 30;   // Map margin (px)
const OBR = 18;   // Default obstacle radius
const AR  = 9;    // AUV radius

const HOME = { x: 70, y: 70 };  // Home base position

const W = 660;    // Canvas width
const H = 478;    // Canvas height

// Spill type labels
const SPILL_TYPES = ['OIL', 'ACID', 'TOXIC', 'FUEL'];

// Plastic debris types
const PLASTIC_TYPES = ['BOTTLE', 'NET', 'MICRO', 'BAG', 'DEBRIS'];

// Marine object classes (InceptionResNetV2 — aquarium-data-cots)
const OBJ_TYPES = [
  { type: 'FISH',      icon: '🐟', color: 'rgba(0,200,255',   cls: 'fish',      conf: [72, 97] },
  { type: 'JELLYFISH', icon: '🪼', color: 'rgba(160,100,255', cls: 'jellyfish', conf: [65, 93] },
  { type: 'PENGUIN',   icon: '🐧', color: 'rgba(80,200,240',  cls: 'penguin',   conf: [78, 98] },
  { type: 'PUFFIN',    icon: '🦜', color: 'rgba(255,170,50',  cls: 'puffin',    conf: [60, 89] },
  { type: 'SHARK',     icon: '🦈', color: 'rgba(255,74,74',   cls: 'shark',     conf: [70, 96] },
  { type: 'STARFISH',  icon: '⭐', color: 'rgba(255,120,60',  cls: 'starfish',  conf: [63, 91] },
  { type: 'STINGRAY',  icon: '🌊', color: 'rgba(29,222,140',  cls: 'stingray',  conf: [66, 94] },
];

// Ocean Waste class metadata (Roboflow ocean_waste v1 — 15 classes)
const OCEAN_WASTE_CLASSES = [
  { name: 'Mask',        color: 'rgba(255,100,150', icon: '😷' },
  { name: 'can',         color: 'rgba(200,180,60',  icon: '🥫' },
  { name: 'cellphone',   color: 'rgba(100,180,255', icon: '📱' },
  { name: 'electronics', color: 'rgba(80,100,255',  icon: '🔌' },
  { name: 'gbottle',     color: 'rgba(80,200,120',  icon: '🍾' },
  { name: 'glove',       color: 'rgba(255,200,80',  icon: '🧤' },
  { name: 'metal',       color: 'rgba(180,180,180', icon: '🔩' },
  { name: 'misc',        color: 'rgba(140,100,200', icon: '❓' },
  { name: 'net',         color: 'rgba(0,200,200',   icon: '🕸' },
  { name: 'pbag',        color: 'rgba(0,220,255',   icon: '🛍' },
  { name: 'pbottle',     color: 'rgba(0,180,255',   icon: '🍼' },
  { name: 'plastic',     color: 'rgba(22,211,238',  icon: '♻' },
  { name: 'rod',         color: 'rgba(200,140,60',  icon: '🪝' },
  { name: 'sunglasses',  color: 'rgba(255,180,50',  icon: '🕶' },
  { name: 'tire',        color: 'rgba(120,120,120', icon: '🛞' },
];

// Default environment state
const EDEF = { cur: 0.5, curdir: 90, wave: 0.3, turb: 0.5, vis: 95, pres: 5, sal: 35, therm: 0, dep: 50 };

// Environment slider configurations
const SLIDERS_CFG = [
  { k: 'cur',    label: 'Ocean Current', min: 0,   max: 10,  step: 0.1 },
  { k: 'curdir', label: 'Current Dir°',  min: 0,   max: 360, step: 1   },
  { k: 'wave',   label: 'Wave Height',   min: 0,   max: 5,   step: 0.1 },
  { k: 'turb',   label: 'Turbulence',    min: 0,   max: 10,  step: 0.1 },
  { k: 'vis',    label: 'Visibility%',   min: 0,   max: 100, step: 1   },
  { k: 'pres',   label: 'Pressure atm',  min: 1,   max: 100, step: 1   },
  { k: 'therm',  label: 'Therm. Layer',  min: 0,   max: 10,  step: 0.1 },
  { k: 'dep',    label: 'Sim Depth m',   min: 5,   max: 3000,step: 5   },
];

// Mission scenario presets
const PRESETS = [
  { name: 'Calm',       cur: 0.5, curdir: 90,  wave: 0.2, turb: 0.5, vis: 95, pres: 5,  sal: 35, therm: 0,  dep: 50   },
  { name: 'Moderate',   cur: 3,   curdir: 135, wave: 1.5, turb: 3,   vis: 70, pres: 20, sal: 35, therm: 2,  dep: 150  },
  { name: 'Storm',      cur: 7,   curdir: 200, wave: 4,   turb: 8,   vis: 30, pres: 10, sal: 35, therm: 1,  dep: 80   },
  { name: 'Arctic',     cur: 4,   curdir: 0,   wave: 2,   turb: 4,   vis: 45, pres: 50, sal: 28, therm: 7,  dep: 800  },
  { name: 'Deep Rift',  cur: 6,   curdir: 270, wave: 0,   turb: 6,   vis: 10, pres: 95, sal: 38, therm: 10, dep: 3000 },
  { name: 'Hull Insp.', cur: 1,   curdir: 90,  wave: 0.3, turb: 1,   vis: 85, pres: 3,  sal: 34, therm: 0,  dep: 15   },
  { name: 'Oil Field',  cur: 2,   curdir: 180, wave: 1,   turb: 2,   vis: 55, pres: 30, sal: 36, therm: 3,  dep: 200  },
  { name: 'Reef/Eco',   cur: 0.8, curdir: 45,  wave: 0.5, turb: 1,   vis: 80, pres: 8,  sal: 34, therm: 0,  dep: 30   },
];
