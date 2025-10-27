# Architectural Decision Records

Format: Lightweight ADRs documenting key technical and design decisions.

---

## ADR-001: Technology Stack - Web-First with Three.js

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
Need to choose tech stack supporting: fast MVP iteration, web deployment, future mobile (Android), and visually appealing 3D effects with minimal complexity.

### Options Considered
1. **Python + Pygame**: User proficiency, fast prototyping, but web/mobile porting = complete rewrite
2. **C++ + raylib/SDL**: Performance, user proficiency, but complex web compilation (WASM) and Android native builds
3. **Web-first (Three.js + JavaScript)**: Works everywhere, great visuals, but user less familiar with JS

### Decision
**Choose Web-first with Three.js**

### Rationale
- Immediate web deployment (aligns with fast iteration goal)
- Mobile via PWA wrapper (Capacitor) = zero porting effort
- Three.js provides excellent glow effects and particle systems
- Live reload during development = fastest iteration
- Largest ecosystem for game UI and networking
- User can learn JS/TS (transferable skill)

### Consequences
- User writes JavaScript instead of Python/C++
- Slightly larger bundle size (acceptable)
- Relies on browser WebGL support (98%+ coverage)

### Review Date
After MVP completion - reassess if web platform proves limiting.

---

## ADR-002: One Connection Per Sphere Constraint

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
Must decide: Can a sphere maintain connections to multiple targets simultaneously, or only one?

### Options Considered
1. **Unlimited connections**: Maximum chaos, visual complexity
2. **Limited (e.g., 3 connections)**: Moderate complexity
3. **Single connection only**: Maximum strategic constraint

### Decision
**Single connection only - each sphere can target exactly ONE other sphere**

### Rationale
- **Strategic depth**: Forces prioritization decisions
- **Visual clarity**: Prevents connection spam, keeps minimalist aesthetic
- **Skill expression**: Micro-management matters (switching = wasted progress)
- **Gameplay pacing**: Prevents instant overwhelming attacks
- **Easier to understand**: Simple rule for new players

### Consequences
- Players must carefully choose targets
- Connection switching becomes strategic cost
- Visual scene stays clean and readable
- May frustrate players expecting RTS-style multi-targeting (acceptable trade-off)

### Review Date
After MVP playtesting - if feels too restrictive, consider allowing 2-3 connections.

---

## ADR-003: No Game Engine - Vanilla JS + Three.js Only

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
Should we use a game engine (Phaser, PixiJS, PlayCanvas) or build custom architecture?

### Options Considered
1. **Phaser**: Full 2D game engine, batteries included
2. **PlayCanvas**: WebGL engine with editor
3. **Vanilla JS + Three.js**: Manual game loop, full control

### Decision
**Vanilla JS + Three.js only, no game engine**

### Rationale
- **Learning opportunity**: Understand game architecture deeply
- **Full control**: Custom game loop, no engine limitations
- **Lightweight**: No engine overhead, smaller bundle
- **Custom mechanics**: Light-based energy transfer doesn't fit standard engine patterns
- **Flexibility**: Easy to add custom systems (pyramid layers, networking)

### Consequences
- More code to write (game loop, state management, input handling)
- No visual editor (acceptable for procedural game)
- Need to implement own tools (debugging, level design)
- Better architectural understanding
- Easier to optimize for specific needs

### Review Date
If development slows significantly, reconsider Phaser for rapid prototyping.

---

## ADR-004: ES6 Modules Without Bundler (Initially)

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
Modern browsers support ES6 modules natively. Do we need a bundler (Webpack, Vite) from day one?

### Options Considered
1. **Vite from start**: Professional setup, optimizations
2. **Native ES6 modules**: Zero config, instant dev server
3. **Webpack**: Powerful but complex

### Decision
**Start with native ES6 modules, add Vite later if needed**

### Rationale
- **Fastest iteration**: Edit file → refresh browser → see changes (0ms build time)
- **Zero configuration**: No package.json, no build scripts
- **Modern browser support**: 95%+ coverage for ES6 modules
- **Simplicity**: Focus on game logic, not tooling
- **Easy to add later**: Vite migration is straightforward when bundle size matters

### Consequences
- No tree shaking (initially)
- No minification (initially)
- No TypeScript (initially, can add later)
- Each import = separate HTTP request (acceptable for development)
- Faster development workflow
- Need CDN for Three.js (or npm + import maps)

### Migration Plan
Add Vite when:
- Bundle size exceeds 2 MB
- Need TypeScript
- Preparing production release

### Review Date
After MVP completion.

---

## ADR-005: Energy Transfer Uses Inverse Square Law (Modified)

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
Need formula for distance attenuation that feels intuitive and creates strategic gameplay.

### Options Considered
1. **Linear falloff**: `energy = max(0, baseRate - distance × factor)` → Can reach zero
2. **Exponential**: `energy = baseRate × e^(-distance × factor)` → Complex, hard to tune
3. **Inverse square**: `energy = baseRate / (1 + distance² × factor)` → Physics-inspired, never zero

### Decision
**Modified inverse square law**: `effectiveEnergy = baseRate / (1 + distance² × 0.01)`

### Rationale
- **Never reaches zero**: Distant connections always viable (slow but possible)
- **Intuitive curve**: Close = fast, distant = slow (not too extreme)
- **Physics familiarity**: Resembles light intensity falloff (thematic fit)
- **Tunable**: Single constant (`0.01`) easy to adjust during playtesting
- **Smooth gradient**: No sudden drop-offs, feels organic

### Example Calculations
```
Distance 1.0 → 99% effectiveness
Distance 3.0 → 91% effectiveness
Distance 5.0 → 80% effectiveness
Distance 10.0 → 50% effectiveness
```

### Consequences
- All connections eventually succeed (patience rewarded)
- Distance strategy matters but isn't punishing
- Need to tune `ATTENUATION_FACTOR` during playtesting

### Review Date
After MVP playtesting - may need adjustment based on feel.

---

## ADR-006: Color Scheme - White vs Cyan (Not Black vs White)

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
User originally proposed black vs white. With dark background (0x000510), pure black is nearly invisible.

### Options Considered
1. **Black vs White**: Original idea, but black invisible on dark background
2. **White vs Dark Purple**: "Black" becomes glowing purple/indigo
3. **White vs Cyan/Blue**: High contrast, distinct, thematic (cold vs warm light)

### Decision
**White (player) vs Cyan-Blue (enemy), Grey (neutral)**

**Colors**:
- Player: `#FFFFFF` (white)
- Enemy: `#00D9FF` (cyan-blue)
- Neutral: `#808080` (grey)
- Background: `#000510` (deep space)

### Rationale
- **Visibility**: All colors highly visible on dark background
- **Distinction**: Clear visual difference between player/enemy/neutral
- **Thematic**: Light-based game = light colors make sense
- **Accessibility**: Color contrast meets WCAG AA standards
- **Easy to change**: Constants in code, can swap later

### Consequences
- Deviates from user's original black/white vision
- User feedback: "Indeed your proposal might be superior due to contrast"
- Future: Add colorblind mode with patterns/symbols

### Alternative Preserved
Can switch to "White vs Dark Purple" if user prefers darker enemy aesthetic.

### Review Date
After MVP playtesting - gather preference data.

---

## ADR-007: Victory Condition - Total Capture (MVP)

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
What ends a puzzle level? Multiple victory conditions possible.

### Options Considered
1. **Total capture**: Own all spheres
2. **Percentage threshold**: Own 70%+ of spheres
3. **Strategic points**: Control specific key spheres
4. **Time-based**: Hold majority for X seconds

### Decision
**MVP: Total capture - player must own 100% of spheres**

### Rationale
- **Clear objective**: Unambiguous win condition
- **Satisfying completion**: Total victory feels decisive
- **Tests core mechanic**: Forces player to use all strategies
- **Simple to implement**: Single boolean check

### Consequences
- Levels can't end early (must clear entire map)
- No "close enough" victories
- Encourages thorough spatial control

### Future Variations (Post-MVP)
- Skirmish mode: Percentage or time-based
- Pyramid mode: Reach summit
- Multiplayer: Last player standing or highest score

### Review Date
After Skirmish mode implementation.

---

## ADR-008: Input Model - Click-to-Target (Not Hold-and-Drag)

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
User initially suggested "hold and aim" mechanic. During discussion, simplified to click-to-target.

### Options Considered
1. **Hold and aim**: Click sphere, drag to target, release → More tactile
2. **Click-to-target**: Click sphere, click target → Simpler, faster
3. **Drag-and-drop**: Drag connection icon to target → More visual

### Decision
**Click-to-target: Click source sphere → click destination sphere → instant connection**

### Rationale
- **Speed**: Faster execution for real-time gameplay
- **Touch-friendly**: No precision drag required on mobile
- **Clear intent**: Two distinct actions (select, target)
- **Scales to real-time**: Works when actions per minute matters
- **User agreement**: "Ok with your MVP and only click no drag no hold to select"

### Consequences
- No aiming skill component (acceptable for strategy game)
- Instant feedback (no anticipation phase)
- Must provide clear visual feedback for selection state

### Implementation
```
1. Click player-owned sphere → SELECT (show outline)
2. Click any other sphere → CREATE CONNECTION
3. Click empty space → DESELECT
```

### Review Date
If gameplay feels too "clicky", consider adding hold-to-queue or other tactile elements.

---

## ADR-009: Repository Structure - Planning Folder for Claude

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
User explicitly requested tidy repository: "LLMs tend to produce a lot of data, crappy readmes we lost ourselves in. So please try to keep this place tidy!"

### Decision
**Create `planning/` folder specifically for Claude's strategic documents, separate from user-facing docs**

### Structure
```
planning/          # Claude's strategic thinking
├── architecture.md
├── game-design.md
├── roadmap.md
└── decisions.md

README.md          # Minimal user-facing: what, why, how to run
CONTRIBUTING.md    # Developer guide
```

### Rationale
- **Separation of concerns**: Strategy docs vs user docs
- **Cleanliness**: No doc sprawl in root directory
- **Scalability**: Easy to add more planning docs without clutter
- **Discoverability**: Devs know where to find context

### Consequences
- Two documentation audiences: Claude (planning/) and users (root)
- Must keep README.md minimal and actionable
- Planning docs can be verbose (detailed context for Claude)

### Review Date
Ongoing - maintain discipline about doc placement.

---

## ADR-010: Open Source License - MIT

**Date**: 2025-10-27
**Status**: ✅ Accepted

### Context
Need to choose license for GitHub repository.

### Options Considered
1. **MIT**: Permissive, commercial-friendly
2. **GPL**: Copyleft, forces derivatives to be open
3. **Apache 2.0**: Permissive with patent protection
4. **Unlicense**: Public domain

### Decision
**MIT License**

### Rationale
- **Maximum freedom**: Users can fork, modify, commercialize
- **Industry standard**: Most familiar to developers
- **Simple**: Short, easy to understand
- **Attribution only**: Only requirement is credit
- **Community-friendly**: Encourages experimentation

### Consequences
- Anyone can create commercial versions (acceptable - we want ecosystem)
- No patent protection (not relevant for this project)
- Must be comfortable with derivative works

### Review Date
Unlikely to change - MIT is stable choice.

---

## Template for Future ADRs

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD
**Status**: 🔄 Proposed | ✅ Accepted | ⏸️ Superseded | ❌ Rejected

### Context
What problem or question does this address?

### Options Considered
1. **Option A**: Description
2. **Option B**: Description
3. **Option C**: Description

### Decision
**Chosen option and key details**

### Rationale
- Why this choice?
- What factors were most important?
- What trade-offs are we accepting?

### Consequences
- Positive outcomes
- Negative outcomes
- Open questions

### Review Date
When should we revisit this decision?
```

---

## Decision Review Schedule

- **After MVP**: Review all MVP-related decisions (ADR-001 through ADR-008)
- **After Phase 2**: Review level design and difficulty decisions
- **Before Multiplayer**: Review architecture scalability
- **Quarterly**: General audit of technical debt

---

## Change Log

- **2025-10-27**: Initial ADRs 001-010 created during project setup
