# Pyramids - Game Design Document

**Last Updated**: 2025-10-27
**Status**: MVP - Single Layer Puzzle Mode

---

## Core Concept

**Genre**: Real-time strategy puzzle game with light-based territory control

**Inspiration**: Osmos (minimalist aesthetics, organic growth), Go (territorial control), Tower Defense (strategic positioning)

**Unique Mechanic**: Energy transfer through light pulses with distance attenuation - closer connections are stronger, distant connections require patience and strategy.

---

## Visual Identity

### Color Palette

**Background**: Deep space (0x000510 - dark blue-black)

**Player Colors**:
- **Option A** (Recommended): White vs Cyan-Blue
  - Player: White (#FFFFFF) - pure, clean, high contrast
  - Enemy: Cyan-Blue (#00D9FF) - cool, distinct, visible on dark BG
  - Neutral: Grey (#808080) - clearly differentiated

- **Option B** (Original): Black vs White
  - Player: White (#FFFFFF)
  - Enemy: Dark Purple (#4B0082) with glow - "black" wouldn't be visible
  - Neutral: Grey (#808080)

**Rationale**: Need strong contrast with dark background. Pure black is invisible; using colored glow (purple/indigo) keeps dark aesthetic while maintaining visibility.

**Decision**: Start with **White vs Cyan** for MVP, easy to switch later via constants.

### Visual Effects
- **Glow**: Multi-layer spheres with additive blending
- **Pulses**: Flowing light streams (tube geometry + UV animation)
- **Particles**: Light trails along connections
- **Color Transitions**: Smooth gradient interpolation during energy transfer
- **Feedback**: Pulsing outline on selected sphere

---

## Core Gameplay Loop

### MVP - Puzzle Mode (Single Player)

**Setup**:
- 7 spheres arranged in pattern (circular or grid)
- 1 player-owned (white)
- 6 neutral (grey)
- No enemies, no AI

**Objective**: Capture all neutral spheres

**Gameplay**:
1. Click your sphere to select it
2. Click target sphere to create connection
3. Light pulse streams from your sphere to target
4. Target sphere gradually shifts to your color
5. Once captured, can use new sphere as connection source
6. Repeat until all spheres owned

**Challenge**: Distance attenuation means strategy matters:
- Close spheres = fast capture
- Distant spheres = slow, vulnerable if you reconfigure before capture completes

---

## Game Mechanics (Detailed)

### Energy System

**Energy Range**: 0% - 100% per sphere

**Ownership Calculation**:
```
  0-33%  → Enemy owned (enemy color)
 34-66%  → Neutral (grey)
 67-100% → Player owned (player color)
```

**Transfer Rate** (per second):
```javascript
baseRate = 15% per second
effectiveRate = baseRate / (1 + distance² × 0.01)

// Example:
Distance 1.0 → 14.85% per second (capture in ~7 seconds)
Distance 3.0 → 13.64% per second (capture in ~8 seconds)
Distance 5.0 → 11.54% per second (capture in ~9 seconds)
```

**Color Interpolation**:
```javascript
// Smooth RGB lerp based on energy percentage
if (energy < 33) {
  color = lerp(ENEMY_COLOR, NEUTRAL_COLOR, energy / 33)
} else if (energy < 67) {
  color = lerp(NEUTRAL_COLOR, PLAYER_COLOR, (energy - 33) / 34)
} else {
  color = PLAYER_COLOR
}
```

### Connection Rules

**Constraint**: **ONE connection per sphere** (source can only target one destination)

**Behavior**:
- Creating new connection → breaks previous connection immediately
- Spheres can be connection sources OR targets (or both simultaneously)
- No connection to self (validated in code)

**Strategic Implications**:
- Must prioritize targets
- Switching targets "wastes" previous progress
- Creates micro-management skill expression

### Victory Conditions

**MVP Puzzle Mode**:
- Win: All spheres owned by player
- No lose condition (pure puzzle)
- No time limit (strategic patience rewarded)

**Future Skirmish Mode**:
- Win: All enemy spheres captured OR enemy has no connections for 10 seconds
- Lose: All player spheres captured
- Optional: Score threshold, pyramid summit control

**Future Multiplayer**:
- Win: Last player with spheres, or highest score at time limit
- Scoring: Points for sphere ownership over time

---

## Future Feature Design

### Random Events (Post-MVP)

**Black Hole**:
- Appears at random position
- Reduces energy transfer rate in radius by 50%
- Lasts 15 seconds
- Visual: Dark vortex with particle absorption

**Nova**:
- Appears at random position
- Increases energy transfer rate in radius by 100%
- Lasts 10 seconds
- Visual: Bright explosion with expanding ring

**Nebula**:
- Slow-moving cloud that blocks connections
- Forces rerouting around obstacles
- Visual: Foggy particle system

### Multi-Layer Pyramid System

**Layer Structure**:
```
Layer 2 (Top): 1-3 spheres, HIGH strategic value
Layer 1 (Mid): 5-7 spheres, MEDIUM value
Layer 0 (Base): 10-15 spheres, standard value
```

**Inter-Layer Connections**:
- Edge spheres connect between layers (marked visually)
- Upper → Lower: +50% energy transfer bonus
- Lower → Upper: -50% energy transfer penalty

**Rationale**: Upper spheres become "power positions" worth fighting for

**Camera Navigation**:
- Default: Top-down view showing all layers (isometric)
- Swipe/scroll: Switch focused layer (blur non-active layers)
- Optional: Free 3D camera orbit

### AI Design (Skirmish Mode)

**AI Personality Types**:

**Aggressive AI**:
- Prioritizes attacking player spheres
- Fast connection switching
- High APM (actions per minute)

**Defensive AI**:
- Protects territory by reinforcing neutral spheres near borders
- Slower, more deliberate
- Counter-attacks only when threatened

**Strategic AI**:
- Identifies high-value spheres (central position, layer advantages)
- Expands methodically
- Uses optimal connection paths

**Implementation**: Simple state machine + heuristic scoring

### Multiplayer Architecture

**Network Model**: Client-server authoritative

**Synchronization**:
- Server: Master game state, validates all actions
- Client: Optimistic prediction + rollback on mismatch
- Tick rate: 20 Hz server updates, 60 Hz client rendering

**Lobby System**:
- Room creation with settings (player count, map size, time limit)
- Spectator mode
- Replay recording on server

---

## Progression & Monetization (Future)

### Progression
- Campaign: 30 puzzle levels with increasing difficulty
- Challenges: Speed runs, minimal connections, distance limitations
- Achievements: Unlockable cosmetics

### Cosmetics (Non-Pay-to-Win)
- Sphere skins: Geometric patterns, particle effects
- Connection themes: Different pulse colors/styles
- Victory animations
- Profile badges

### Monetization (If Applicable)
- Optional cosmetic DLC
- No gameplay advantages for sale
- Ad-free option for mobile

---

## Difficulty Curve (Puzzle Campaign)

**Levels 1-5: Tutorial**
- 3-5 spheres, trivial layouts
- Introduce mechanics: selection, connections, energy transfer

**Levels 6-15: Strategic Thinking**
- 7-10 spheres, spatial puzzles
- Teach: Distance matters, connection priority, efficiency

**Levels 16-25: Advanced**
- 12+ spheres, multi-layer (when implemented)
- Teach: Layer advantages, inter-layer strategy

**Levels 26-30: Mastery**
- Complex patterns requiring optimal sequences
- Introduce: Random events, limited resources (future)

---

## Balance Considerations

### Tuning Parameters (Iteration Required)
```javascript
// Energy transfer
BASE_ENERGY_RATE = 15.0       // % per second (default)
ATTENUATION_FACTOR = 0.01     // Distance penalty strength

// Ownership thresholds
ENEMY_THRESHOLD = 33          // % (below = enemy)
NEUTRAL_THRESHOLD = 67        // % (above = player)

// Visual
SPHERE_BASE_RADIUS = 0.5      // World units
GLOW_RADIUS_MULTIPLIER = 1.4  // Glow layer size
```

**Playtesting Questions**:
- Is capture too fast/slow?
- Are distant connections viable?
- Do neutral spheres feel distinct from enemies?
- Is strategic depth sufficient?

### Known Balance Risks

**Risk 1: Stalemate in Skirmish Mode**
- Problem: Equal players might deadlock
- Solution: Add attrition mechanic or score-based victory

**Risk 2: Connection Spam**
- Problem: Players might rapidly switch connections
- Solution: Add cooldown or energy cost for switching

**Risk 3: Snowball Effect**
- Problem: Player with more spheres wins inevitably
- Solution: Upper layer advantages, random events, comeback mechanics

---

## User Experience Flow

### First Launch
1. Minimalist title screen: "PYRAMIDS"
2. Single button: "START"
3. Instant gameplay (no long tutorial)
4. First level teaches through doing

### In-Game HUD (Minimal)
- No persistent UI elements (clean aesthetic)
- On hover: Show sphere energy percentage
- On select: Highlight valid targets
- Victory/defeat: Overlay with option to restart or next level

### Accessibility
- Colorblind mode: Add patterns/symbols to colors
- Touch targets: Minimum 44x44px (mobile standards)
- No sound required (but enhances experience)

---

## Audio Design (Future)

### Sound Effects
- **Selection**: Soft "ping" (440 Hz tone)
- **Connection**: Whoosh/beam sound (pitched by distance)
- **Capture**: Satisfying "bloom" when sphere changes owner
- **Victory**: Triumphant chord progression

### Music
- Ambient electronic (Brian Eno style)
- Non-intrusive, atmospheric
- Dynamic: Intensifies during close captures

---

## Technical Constraints

### MVP Scope (Single Layer Puzzle)
- 7-10 spheres maximum
- No AI opponents
- No network code
- No random events
- No multi-layer system

### Performance Targets
- 60 FPS on integrated GPU (Intel HD 620 equivalent)
- < 100 MB total download size
- Works offline (no required backend)

### Platform Requirements
- Desktop: Chrome/Firefox/Safari latest
- Mobile: iOS 13+, Android 8+
- Input: Mouse, touch (no keyboard required)

---

## Metrics to Track (Future Analytics)

### Gameplay Metrics
- Average capture time per sphere
- Connection switches per level
- Victory rate per level
- Playtime per session

### User Behavior
- Drop-off points (which level?)
- Retry rate
- Completion rate

### Performance
- Average FPS
- Load times
- Crash rate

---

## Open Questions (Requiring Playtesting)

1. **Energy transfer rate**: Is 15%/sec too fast/slow?
2. **Sphere count**: Is 7 spheres enough strategic depth for MVP?
3. **Distance scaling**: Does attenuation formula feel intuitive?
4. **Color choice**: White vs Cyan, or White vs Purple?
5. **Connection feedback**: Is pulse stream clearly visible?
6. **Victory satisfaction**: Does winning feel rewarding enough?

**Answer via**: Build MVP, playtest with real users, iterate based on feedback.
