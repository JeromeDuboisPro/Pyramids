# Pyramids - Development Roadmap

**Last Updated**: 2025-10-30
**Project Start**: 2025-10-27

---

## Vision

Build a minimalist real-time strategy game with light-based mechanics, starting as a single-player puzzle game and evolving into a multiplayer competitive experience across web and mobile platforms.

---

## Phase 1: MVP - Single Layer Puzzle ✅ COMPLETE

**Goal**: Prove core mechanic is fun and visually appealing

### Core Features (All Complete)
✅ Static scene with 7 glowing spheres (cellular plasma texture)
✅ Dark minimalist aesthetic (Osmos-inspired)
✅ Click sphere → click target → create connection
✅ Visual pulse streams with particle trails + glow effects
✅ Energy transfer with distance attenuation (inverse square)
✅ Gradual color interpolation (neutral → player, stepped for performance)
✅ Victory condition: All spheres owned
✅ Mouse + touch input support
✅ Camera controls: pan (middle-click), rotate (right-click), zoom (wheel)

### Bonus Features Added
✅ Theme system (5 color schemes: default, sunset, forest, ocean, neon)
✅ Starfield background (150 twinkling stars)
✅ Shadow projections (subtle cyan glow under spheres)
✅ Sphere hover tooltips (owner, energy, connections)
✅ HUD (sphere count, connections, selected sphere info)
✅ Reset view button
✅ Selection visual (pulsing glow, no rings per user preference)
✅ Impact effects (burst particles, rotation boost on energy arrival)

### Success Criteria - All Met
✅ Game runs at 60 FPS on mid-range hardware
✅ Visual aesthetic matches Osmos inspiration
✅ Core mechanic feels satisfying to play
⏳ 5-minute playtest needed for external validation

### Key Design Decisions
- **Cellular plasma texture** for sphere cores (procedural, cached for performance)
- **Stepped color interpolation** (25/50/75% thresholds) vs smooth gradients (reduces texture regeneration)
- **No Saturn rings** on selection/capture (user preference for cleaner look)
- **Mesh-based starfield** (not point particles) for guaranteed visibility
- **3D camera controls** added early (pan/rotate/zoom) for enhanced spatial feel
- **One connection per sphere** rule (strategic constraint)
- **Inverse square attenuation** for energy transfer (realistic falloff)

---

## Phase 2: Puzzle Campaign (Target: 1-2 weeks)

**Goal**: Create 10-15 varied puzzle levels to test strategic depth

### Features
- Level system with progression
- 10-15 handcrafted puzzle levels
- Increasing difficulty curve
- Level selection screen
- Save progress (localStorage)
- Restart level functionality
- Simple HUD (level number, time taken)

### Level Design Themes
- **Levels 1-3**: Tutorial (3-5 spheres, trivial)
- **Levels 4-7**: Distance challenges (optimal path finding)
- **Levels 8-10**: Spatial puzzles (branching choices)
- **Levels 11-15**: Efficiency challenges (minimum connections)

### Success Criteria
- 80% playtest completion rate on first 5 levels
- Clear difficulty progression
- Each level teaches new strategic concept

---

## Phase 3: Multi-Layer Pyramid (Target: 2-3 weeks)

**Goal**: Implement signature pyramid layer system with vertical strategy

### Features
- 3 layers: Base (10 spheres), Mid (6 spheres), Top (3 spheres)
- Inter-layer connections (edge spheres only)
- Energy transfer modifiers (upper → lower bonus)
- Camera navigation (swipe between layers OR free 3D orbit)
- Layer-specific victory conditions
- New puzzle levels utilizing vertical strategy

### Technical Challenges
- Camera transitions between layers
- Visual clarity (which layer is active?)
- Performance with 20+ spheres
- Tutorial for new layer mechanic

### Success Criteria
- Vertical strategy adds meaningful depth
- Camera navigation feels intuitive
- Performance maintains 60 FPS

---

## Phase 4: Skirmish Mode - AI Opponent (Target: 2-3 weeks)

**Goal**: Real-time competitive gameplay against AI

### Features
- AI opponent with 3 difficulty levels (Easy, Medium, Hard)
- Real-time simultaneous actions
- AI decision-making system (heuristic-based)
- Player vs AI on single layer first
- Victory/defeat conditions
- Score display
- Replay last match functionality

### AI Behavior Design
- **Easy**: Random connections, slow reaction
- **Medium**: Greedy algorithm (nearest targets), medium speed
- **Hard**: Strategic planning (high-value targets), fast execution

### Success Criteria
- Medium AI provides challenge for average player
- Hard AI is beatable with skill
- AI behavior feels intentional, not random

---

## Phase 5: Random Events (Target: 1 week)

**Goal**: Add dynamic elements to break stalemates and increase replayability

### Features
- Black Hole: Reduces energy transfer in radius
- Nova: Increases energy transfer in radius
- Nebula: Blocks connections (moving obstacle)
- Event frequency tuning
- Visual effects for each event
- Event forecast system (optional: 5-second warning)

### Success Criteria
- Events feel impactful but not frustrating
- Add replayability without feeling gimmicky
- Integrate naturally into existing gameplay

---

## Phase 6: Polish & Web Release (Target: 1-2 weeks)

**Goal**: Production-ready web game on GitHub Pages

### Features
- Sound effects and ambient music
- Particle system polish
- Improved shader effects
- Responsive design (mobile + desktop)
- Full screen mode
- Settings menu (sound volume, effects quality)
- About/credits screen
- Social sharing (Twitter, Reddit)

### Technical
- Vite bundler for optimization
- Asset compression
- GitHub Pages deployment
- PWA manifest for mobile "install"
- Analytics (privacy-respecting)

### Success Criteria
- < 5 MB total bundle size
- Works on 90% of modern browsers
- Lighthouse score > 90

---

## Phase 7: Multiplayer Foundation (Target: 3-4 weeks)

**Goal**: Real-time multiplayer for 2-4 players

### Features
- WebSocket server (Node.js + Socket.io)
- Lobby system (create/join rooms)
- Player matchmaking (optional)
- Client-server authoritative architecture
- Latency compensation (client prediction + rollback)
- Spectator mode
- Chat system
- Match replay recording

### Technical Architecture
- Backend: Node.js server on cloud platform (Heroku/Railway)
- Protocol: JSON over WebSocket
- State synchronization: Snapshot + delta updates
- Anti-cheat: Server validates all actions

### Success Criteria
- < 100ms perceived latency on good connections
- No desync issues
- Graceful handling of disconnects

---

## Phase 8: Mobile Release (Target: 2-3 weeks)

**Goal**: Native Android app with full feature parity

### Approach
- Capacitor: Web-to-native wrapper
- Optimize touch controls for mobile
- Android Play Store release
- iOS App Store release (if feasible)

### Mobile-Specific Features
- Haptic feedback on connections
- Battery optimization
- Offline mode with AI
- Cloud save sync

### Success Criteria
- Works on Android 8+
- < 50 MB APK size
- Play Store rating > 4.0

---

## Phase 9: Advanced Features (Target: 4+ weeks)

**Goal**: Scale gameplay and add depth

### Features
- **Multi-Pyramid System**: Connect multiple pyramids for epic scale
- **Tournament Mode**: Bracket-style competitive play
- **Ranked Matchmaking**: ELO-based ranking system
- **Custom Maps**: Level editor for community content
- **Cosmetics**: Unlockable sphere skins, effects
- **Daily Challenges**: Procedural puzzles with leaderboards
- **Clan System**: Team-based gameplay

### Monetization (Optional)
- Cosmetic DLC
- Premium account (ad-free, exclusive skins)
- Tournament entry fees (winner takes pot)

---

## Success Metrics (Long-Term)

### Engagement
- Daily Active Users (DAU)
- Average session length: Target 10-15 minutes
- Retention: 40% Day-1, 20% Day-7, 10% Day-30

### Community
- GitHub stars: Target 100+ (indicates developer interest)
- Reddit/Discord community: Target 500+ members
- User-generated content (custom maps)

### Technical
- Crash rate < 1%
- Average FPS > 55
- Server uptime > 99.5%

---

## Risk Management

### Risk 1: Core Mechanic Not Fun
**Likelihood**: Medium
**Impact**: Critical
**Mitigation**: Early playtesting after MVP, willingness to pivot mechanics

### Risk 2: Multiplayer Complexity Overwhelming
**Likelihood**: High
**Impact**: High
**Mitigation**: Incremental approach, single-layer multiplayer first, thorough testing

### Risk 3: Performance on Low-End Devices
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Performance testing early, LOD system, quality settings

### Risk 4: Community Growth Stagnates
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Regular content updates, community engagement, feature voting

---

## Go/No-Go Decision Points

### After MVP (Phase 1)
**Question**: Is the core mechanic fun?
**Go Criteria**: 70%+ playtesters say "I'd play more levels"
**No-Go**: Pivot mechanics or shelve project

### After Puzzle Campaign (Phase 2)
**Question**: Is there strategic depth?
**Go Criteria**: Players replay levels for optimization
**No-Go**: Simplify or add mechanics before continuing

### After AI Skirmish (Phase 4)
**Question**: Is competitive play engaging?
**Go Criteria**: Average match length > 5 minutes, 60%+ win to continue
**No-Go**: Rethink multiplayer approach

### Before Multiplayer (Phase 7)
**Question**: Is there demand?
**Go Criteria**: 100+ GitHub stars OR 500+ players
**No-Go**: Focus on single-player content instead

---

## Timeline Summary

| Phase | Duration | Features | Status |
|-------|----------|----------|--------|
| Phase 1: MVP | 2-4 hours | Single-layer puzzle core + polish | ✅ Complete |
| Phase 2: Campaign | 1-2 weeks | 10-15 puzzle levels | ⏳ Next |
| Phase 3: Multi-Layer | 2-3 weeks | Pyramid layer system | ⏳ Planned |
| Phase 4: AI Skirmish | 2-3 weeks | Real-time vs AI | ⏳ Planned |
| Phase 5: Events | 1 week | Random events system | ⏳ Planned |
| Phase 6: Web Release | 1-2 weeks | Production polish | ⏳ Planned |
| Phase 7: Multiplayer | 3-4 weeks | Real-time PvP | ⏳ Future |
| Phase 8: Mobile | 2-3 weeks | Android/iOS release | ⏳ Future |
| Phase 9: Advanced | 4+ weeks | Scale features | ⏳ Future |

**Total Estimated Time to Web Release**: 8-11 weeks
**Total Estimated Time to Mobile**: 12-15 weeks
**Total Estimated Time to Full Feature Set**: 20+ weeks

---

## Open Source Strategy

### Community Building
- Clear contribution guidelines
- Good first issues labeled
- Responsive to PRs and issues
- Regular devlogs/updates

### Code Quality
- Clean, documented code
- Architecture guides
- No "hacky" shortcuts
- Welcoming to newcomers

### Licensing
- MIT License (permissive)
- Encourage forks and experiments
- Credit contributors prominently

---

## Next Steps (Immediate)

1. ✅ Create repository structure
2. ✅ Write planning documentation
3. ✅ Implement Phase 1.1-1.6: Complete MVP
4. ✅ Add polish features (themes, starfield, camera controls)
5. 🔄 Playtest MVP with 5+ users
6. ⏳ Iterate based on feedback
7. ⏳ Decide go/no-go for Phase 2
8. ⏳ If GO: Begin Phase 2 (Level system + 10-15 puzzles)

**Current Focus**: MVP complete and ready for playtesting. Next: validate core mechanic with users, then begin Phase 2 puzzle campaign.
