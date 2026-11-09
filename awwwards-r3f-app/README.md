# CHRONOS // Sovereign 3D Awwwards Experience

An award-winning interactive 3D web application built with **React 18**, **Vite**, **React Three Fiber (R3F)**, **Drei**, **Rapier Physics**, and **GSAP**.

---

## 🛠️ Tech Stack & Architecture

- **Core Framework:** React 18+ / Vite (ESM)
- **3D Engine:** Three.js / `@react-three/fiber`
- **Helper Utilities:** `@react-three/drei` (AccumulativeShadows, MeshTransmissionMaterial, Float, Sparkles, useProgress)
- **Physics Engine:** `@react-three/rapier` (RigidBody dynamics, impulse collisions, cuboid containment)
- **Shaders:** Custom GLSL Iridescent Holographic Material with Fresnel rim dispersion and vertex wave displacement
- **Post-Processing:** `@react-three/postprocessing` (N8AO contact shadows, Bloom, Chromatic Aberration, Film Grain, Vignette)
- **Motion & Camera:** GreenSock (GSAP) timeline choreography + pointer damping
- **Audio Engine:** Custom Web Audio API synthesizer for tactile UI micro-clicks and ambient drone

---

## 📁 Modular File Structure

```
awwwards-r3f-app/
├── package.json                          # Core dependencies and scripts
├── vite.config.js                        # Rollup chunk optimization
├── index.html                            # Luxury typography & meta viewport
├── src/
│   ├── main.jsx                          # React root entry
│   ├── App.jsx                           # Canvas orchestration & wheel navigation
│   ├── index.css                         # Glassmorphism tokens & typography
│   ├── components/
│   │   ├── Experience.jsx                # Scene composition root
│   │   ├── CustomLighting.jsx            # Environment map, soft shadows & directional rim lights
│   │   ├── HeroMonolith.jsx              # Kinetic sculpture, custom shaders & glass shield
│   │   ├── KineticPhysics.jsx            # Rapier rigid bodies with collision impulses
│   │   ├── CameraRig.jsx                 # GSAP timeline-driven camera moves & mouse damping
│   │   ├── PostProcessingEffects.jsx     # N8AO, Bloom, Chromatic Aberration & Vignette
│   │   ├── Overlay.jsx                   # Glassmorphic UI with chapter selector & audio toggle
│   │   └── Loader.jsx                    # Asset progress loader with smooth exit fade
│   ├── materials/
│   │   └── IridescentShaderMaterial.js   # Custom GLSL vertex & fragment shader
│   └── utils/
│       └── audio.js                      # Web Audio API sound synthesizer
```

---

## 🚀 Quick Start

1. Navigate to the project directory:
   ```bash
   cd awwwards-r3f-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## ⚡ Performance Optimizations

1. **DPR Capping (`dpr={[1, 2]}`):** Prevents GPU thermal throttling on high-density Retina displays.
2. **Selective Antialiasing:** Disables default canvas antialiasing (`antialias: false`) in favor of hardware-accelerated multisampling in `EffectComposer`.
3. **Memoized Materials & Geometries:** Allocates shaders and materials outside the render loop using `useMemo` to eliminate garbage collection pauses.
4. **Non-Blocking Dynamic Physics:** Runs Rapier physics calculations on an independent step rate decoupled from UI state changes.
