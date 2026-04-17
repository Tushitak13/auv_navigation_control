# 🌊 AUV Mission Control v11

A browser-based Autonomous Underwater Vehicle (AUV) mission simulation dashboard featuring real-time path planning, environmental sensing, Kaggle dataset integration, and interactive obstacle/waypoint placement.

---

## 🚀 Quick Start

```bash
git clone <your-repo-url>
cd auv_mission_control
```

Then open `index.html` directly in your browser — **no server required**.

Or use VS Code Live Server extension for hot reload.

---

## 📁 Project Structure

```
auv_mission_control/
├── index.html              # Main entry point (standalone, self-contained)
├── auv_mission_control_v11.html  # Original single-file version
├── css/
│   └── styles.css          # All CSS styles
├── js/
│   ├── constants.js        # Simulation constants & config
│   ├── state.js            # Global state variables
│   ├── utils.js            # Math/helper utilities
│   ├── pathplanner.js      # PRM + Dijkstra path planning
│   ├── environment.js      # ENV sliders, presets, badges
│   ├── sensors.js          # Environmental sensor simulation
│   ├── kaggle.js           # Kaggle dataset integration (Oil + Ocean Waste)
│   ├── objects.js          # Marine object detection (InceptionResNetV2)
│   ├── spills.js           # Oil/chemical spill simulation
│   ├── plastic.js          # Ocean plastic detection & collection
│   ├── physics.js          # AUV physics, movement, SLAM
│   ├── missions.js         # Mission control (surface, RTH, reset)
│   ├── hud.js              # HUD & stats updates
│   ├── render.js           # Canvas rendering engine
│   ├── placement.js        # Click-to-place obstacles & waypoints
│   └── main.js             # App entry point & game loop
└── README.md
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **PRM + Dijkstra** | Probabilistic Roadmap + Dijkstra pathfinding with shortcutting |
| **EKF Sensor Fusion** | Extended Kalman Filter for sensor confidence simulation |
| **GraphSLAM** | Simultaneous Localization and Mapping visualization |
| **Oil Spill CNN** | Kaggle SAR oil spill dataset (300 images, 2 classes) integration |
| **Ocean Waste YOLOv5** | Kaggle ocean_waste v1 (15 classes) live inference |
| **InceptionResNetV2** | Aquarium object detection (7 marine species) |
| **Click-to-Place** | Interactive obstacle & waypoint placement on canvas |
| **Battery RTH** | Auto return-to-home at 15% battery |
| **Mission Presets** | 8 environment presets (Calm → Deep Rift) |
| **Minimap** | Real-time minimap overlay |
| **HUD** | Live sensor strip (speed, heading, depth, pH, salinity, etc.) |

---

## 🎮 Controls

| Control | Action |
|---|---|
| **⏸ PAUSE / ▶ RUN** | Toggle simulation |
| **↺ RESET** | Full system reset |
| **▲ SURFACE** | Command AUV to surface |
| **⌂ RETURN HOME** | Command AUV to home base |
| **🛢 OIL DRILL** | Inject 2 chemical spills |
| **♻ SCAN** | Spawn 3 plastic debris items |
| **🔍 IRV2 DETECT** | Trigger InceptionResNetV2 scan |
| **＋ OBSTACLE** | Click map to place obstacle |
| **⊕ WAYPOINT** | Click map to place waypoint |
| **Right-click obstacle** | Remove obstacle |
| **ESC** | Cancel placement mode |

---

## 📊 Kaggle Datasets Used

1. **Oil Spill Classification (SAR)** — Binary CNN, 300 SAR satellite images, `oil_spill` / `no_oil` classes, CC BY 4.0
2. **Ocean Waste Detector** — YOLOv5, Roboflow ocean_waste v1, 15 classes (Mask, can, cellphone, electronics, gbottle, glove, metal, misc, net, pbag, pbottle, plastic, rod, sunglasses, tire), CC BY 4.0

---

## 🛠 Tech Stack

- **Vanilla JavaScript** (ES6+) — No frameworks
- **HTML5 Canvas** — 2D rendering
- **CSS Variables** — Theming system
- **Google Fonts** — Share Tech Mono, Exo 2

---

## 🔧 Development

Open in VS Code and use the **Live Server** extension (`Alt+L Alt+O`) to serve with hot reload.

For multi-file version, open `index.html`. For the original self-contained version, open `auv_mission_control_v11.html`.
