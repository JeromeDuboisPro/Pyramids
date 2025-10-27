# Pyramids - Technical Architecture

**Last Updated**: 2025-10-27
**Status**: MVP Phase - Single Layer Puzzle Mode

---

## Architecture Overview

### Core Principle
**Separation of Concerns**: Game logic, rendering, and input handling are completely decoupled to support future platforms (web, Android) and game modes (puzzle, skirmish, multiplayer).

```
┌─────────────────────────────────────────────────┐
│                   Game Loop                      │
│  (60 FPS, requestAnimationFrame)                │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌────────┐      ┌──────────┐
│  Mode  │      │  Input   │
│ Logic  │      │ Handler  │
└───┬────┘      └────┬─────┘
    │                │
    ▼                ▼
┌────────────────────────┐
│     Game State         │
│  (Spheres, Energy,     │
│   Connections)         │
└───────────┬────────────┘
            │
            ▼
    ┌──────────────┐
    │  Rendering   │
    │  (Three.js)  │
    └──────────────┘
```

---

## Data Model

### Sphere Entity
```javascript
{
  id: string,              // Unique identifier
  position: Vector3,       // 3D position (even for 2D layer)
  energy: 0-100,          // Ownership energy level
  owner: string,          // 'player' | 'enemy' | 'neutral'
  connectedTo: string?,   // Target sphere ID (ONE connection only)
  radius: number,         // Visual size
  layer: number          // Pyramid layer (0 = base, future feature)
}
```

### Game State
```javascript
{
  spheres: Map<id, Sphere>,
  activeConnections: [{
    from: sphereId,
    to: sphereId,
    age: number,          // For animation timing
    energyRate: number    // Calculated with attenuation
  }],
  selectedSphere: sphereId?,
  tick: number,
  gameMode: 'puzzle' | 'skirmish' | 'multiplayer'
}
```

---

## Energy Transfer Physics

### Attenuation Formula
```javascript
effectiveEnergy = BASE_ENERGY_RATE / (1 + distance² × ATTENUATION_FACTOR)

// Constants (tunable):
BASE_ENERGY_RATE = 15.0  // % per second
ATTENUATION_FACTOR = 0.01
```

**Rationale**: Inverse square law creates natural gameplay dynamics:
- Close spheres: Fast conversion (strategic aggression)
- Distant spheres: Slow conversion (requires patience, vulnerable to interruption)

### Ownership Thresholds
```
  0-33%  → Enemy owned
 34-66%  → Neutral
 67-100% → Player owned
```

**Color Interpolation**: Smooth gradient between owner colors based on energy percentage.

---

## Rendering Architecture (Three.js)

### Scene Setup
```javascript
// Camera: Orthographic for clean 2D feel with 3D objects
// Background: 0x000510 (deep space blue-black)
// Lighting: Ambient + point lights at each sphere for glow
```

### Sphere Rendering (3-Layer Glow Effect)
```javascript
// Layer 1: Core sphere
- Geometry: SphereGeometry(radius, 32, 32)
- Material: MeshStandardMaterial
  - emissive: owner color
  - emissiveIntensity: 1.0

// Layer 2: Glow aura
- Geometry: SphereGeometry(radius * 1.4, 32, 32)
- Material: MeshBasicMaterial
  - transparent: true
  - opacity: 0.3
  - blending: AdditiveBlending

// Layer 3: Soft halo
- Geometry: SphereGeometry(radius * 1.8, 32, 32)
- Material: MeshBasicMaterial
  - transparent: true
  - opacity: 0.1
  - blending: AdditiveBlending
```

### Connection Stream Rendering
```javascript
// Use TubeGeometry for visible beam
- Path: CatmullRomCurve3 from source to target
- Material: Animated texture (UV scroll for flow effect)
- Particles: Spawn along path for extra visual impact
- Width: Pulsing animation based on energy transfer rate
```

---

## Input Handling

### Unified Mouse + Touch Abstraction
```javascript
class InputHandler {
  handlePointerDown(event) {
    const pos = this.normalizePointer(event);
    const sphereId = this.raycaster.getSphereAt(pos);

    if (sphereId) {
      if (state.isPlayerSphere(sphereId)) {
        state.selectSphere(sphereId);
      } else if (state.selectedSphere) {
        state.createConnection(state.selectedSphere, sphereId);
      }
    } else {
      state.deselectSphere();
    }
  }
}
```

**Touch Support**: Prevent default to avoid page scroll, unified event handling for both input types.

---

## Game Mode Polymorphism

### Base Mode Interface
```javascript
class GameMode {
  init(state) { /* Setup initial sphere configuration */ }
  update(deltaTime, state) { /* AI logic, event triggers */ }
  checkVictory(state) { /* Return win/lose condition */ }
}
```

### PuzzleMode (MVP)
```javascript
class PuzzleMode extends GameMode {
  init(state) {
    // 7 spheres: 1 player, 6 neutral
    // No enemy AI, pure strategic puzzle
  }

  checkVictory(state) {
    return state.spheres.every(s => s.owner === 'player');
  }
}
```

### Future Modes
- **SkirmishMode**: AI opponent, real-time competition
- **MultiplayerMode**: WebSocket synchronization, authoritative server

---

## Technology Stack

### Core
- **Three.js**: 3D rendering engine (via CDN for MVP)
- **ES6 Modules**: Native browser support, no bundler initially
- **No frameworks**: Vanilla JS for maximum control and learning

### Development
- **Local Server**: `python -m http.server` or `npx serve`
- **Version Control**: Git with feature branch workflow
- **Future**: Vite for bundling when needed

### Deployment
- **GitHub Pages**: Static hosting for web version
- **Future**: PWA for mobile, Capacitor for native Android

---

## Performance Considerations

### Target: 60 FPS on mid-range hardware

**Optimizations**:
- Object pooling for particles (avoid GC pressure)
- Frustum culling (built-in Three.js)
- LOD for multi-layer pyramid (future)
- Batch geometry updates
- Single render pass per frame

**Metrics to Monitor**:
- Frame time (< 16.67ms target)
- Draw calls (< 100 for MVP)
- Triangle count (< 50k for MVP)

---

## Future Architecture Considerations

### Multi-Layer Pyramid (Milestone 1)
```javascript
// Add layer management
class LayerManager {
  layers: Layer[],
  activeLayer: number,
  interLayerConnections: Connection[]
}

// Modified energy transfer: upper → lower = bonus, lower → upper = penalty
```

### Multiplayer (Milestone 3)
```javascript
// Client-server architecture
- Server: Authoritative game state (Node.js + Socket.io)
- Client: Optimistic prediction + server reconciliation
- Network: Delta compression, snapshot interpolation
```

---

## Design Decisions Log

### 1. Why Three.js over Canvas2D?
- **Decision**: Three.js
- **Rationale**:
  - Better glow effects with WebGL shaders
  - Future 3D camera navigation built-in
  - Hardware acceleration
  - Easier particle systems
- **Trade-off**: Slightly larger bundle, but acceptable for visual quality gain

### 2. Why "One Connection Per Sphere"?
- **Decision**: Enforce single connection constraint
- **Rationale**:
  - Strategic gameplay: forces prioritization
  - Cleaner visuals: avoids connection spam
  - Skill expression: micro-management matters
- **Trade-off**: Reduces chaos, but increases strategic depth (positive)

### 3. Why No Game Engine?
- **Decision**: Vanilla JS + Three.js only
- **Rationale**:
  - Learning opportunity
  - Full control over game loop
  - No engine overhead
  - Faster iteration for custom mechanics
- **Trade-off**: More code to write, but better understanding

---

## Code Quality Standards

### Naming Conventions
- Classes: PascalCase (`GameState`, `SphereRenderer`)
- Functions/methods: camelCase (`updateEnergy`, `createConnection`)
- Constants: UPPER_SNAKE_CASE (`BASE_ENERGY_RATE`)
- Files: PascalCase for classes, camelCase for utilities

### File Organization
- One class per file (except small utilities)
- Max file size: 300 lines (refactor if larger)
- Clear imports at top, exports at bottom

### Comments
- JSDoc for public APIs
- Inline comments only for non-obvious logic
- No "what" comments, only "why" comments

---

## Testing Strategy (Future)

### Unit Tests
- Pure logic: energy calculations, ownership thresholds
- No rendering tests initially

### Integration Tests
- Full game loop simulation
- Victory condition validation

### Playtesting
- Primary testing method for game feel
- Iterate on constants based on actual gameplay
