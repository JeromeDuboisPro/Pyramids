# Contributing to Pyramids

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## 🚀 Getting Started

### Prerequisites
- Git
- Modern web browser
- Code editor (VS Code, Sublime, etc.)
- Python 3 or Node.js (for local server)

### Setup Development Environment

1. **Fork and clone**:
```bash
git clone https://github.com/YOUR_USERNAME/Pyramids.git
cd Pyramids
```

2. **Run locally**:
```bash
python -m http.server 8000
# or
npx serve .
```

3. **Open in browser**:
```
http://localhost:8000
```

4. **Read the docs**:
- `planning/architecture.md` - Technical architecture
- `planning/game-design.md` - Game mechanics
- `planning/roadmap.md` - Development timeline

---

## 🎯 How to Contribute

### Reporting Bugs

**Before submitting**:
- Check existing issues to avoid duplicates
- Test on latest version

**Bug report should include**:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Console errors (if any)

**Template**:
```markdown
## Bug Description
[Clear one-sentence description]

## Steps to Reproduce
1. Click on sphere A
2. Click on sphere B
3. Notice that...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Browser: Chrome 120
- OS: Fedora 39
- Version: main branch, commit abc123

## Console Errors
[Paste any errors from browser console]
```

### Suggesting Features

**Feature requests should include**:
- **Problem**: What user need does this address?
- **Solution**: Your proposed feature
- **Alternatives**: Other approaches considered
- **Complexity**: Your estimate (low/medium/high)

**Check roadmap first**: See `planning/roadmap.md` - feature might already be planned!

### Pull Requests

**PR Guidelines**:
1. **One feature per PR** - easier to review and merge
2. **Branch naming**: `feature/your-feature` or `fix/bug-description`
3. **Commits**: Clear, descriptive messages
4. **Testing**: Test your changes thoroughly
5. **Documentation**: Update relevant docs if needed

**PR Template**:
```markdown
## Description
[What does this PR do?]

## Related Issue
Closes #123

## Changes Made
- Added X
- Modified Y
- Fixed Z

## Testing Done
- Tested on Chrome/Firefox
- Verified feature X works
- No console errors

## Screenshots (if applicable)
[Before/after images for visual changes]
```

---

## 🎨 Code Style

### JavaScript Style Guide

**Naming Conventions**:
```javascript
// Classes: PascalCase
class GameState {}
class SphereRenderer {}

// Functions/methods: camelCase
function updateEnergy() {}
function createConnection() {}

// Constants: UPPER_SNAKE_CASE
const BASE_ENERGY_RATE = 15.0;
const ATTENUATION_FACTOR = 0.01;

// Variables: camelCase
let selectedSphere = null;
const sphereColor = '#FFFFFF';
```

**File Organization**:
```javascript
// 1. Imports
import * as THREE from 'three';
import { Sphere } from './Sphere.js';

// 2. Constants
const MAX_SPHERES = 20;

// 3. Class/function definition
export class GameState {
  constructor() {
    // ...
  }
}

// 4. Export (if not inline)
```

**Comments**:
```javascript
// Good: Explain WHY, not WHAT
// Inverse square law creates intuitive distance falloff
const attenuation = 1 / (1 + distance * distance * ATTENUATION_FACTOR);

// Bad: Obvious "what" comment
// Calculate attenuation
const attenuation = 1 / (1 + distance * distance * ATTENUATION_FACTOR);
```

### Code Quality Standards

- **Max file size**: 300 lines (refactor if larger)
- **Max function size**: 50 lines (extract helpers if larger)
- **No magic numbers**: Use named constants
- **No commented-out code**: Delete or use version control
- **No `console.log` in commits**: Remove debug statements

---

## 📁 Repository Structure

### Where to Put Code

```
src/
├── core/              # Game logic (pure functions, no rendering)
│   ├── GameState.js   # Master game state
│   ├── Sphere.js      # Sphere entity
│   └── Physics.js     # Energy calculations
│
├── modes/             # Game mode controllers
│   ├── PuzzleMode.js
│   └── SkirmishMode.js
│
├── rendering/         # Three.js visualization only
│   ├── SceneManager.js
│   └── SphereRenderer.js
│
├── input/             # Input abstraction (mouse + touch)
│   └── InputHandler.js
│
└── ui/                # HUD, menus, screens
    └── HUD.js
```

**Rule**: Core game logic should NOT import rendering code (separation of concerns).

---

## 🧪 Testing

### Manual Testing Checklist

Before submitting PR, verify:
- [ ] Game runs without console errors
- [ ] Feature works on Chrome AND Firefox
- [ ] Touch input works (use browser dev tools mobile emulation)
- [ ] No visual glitches
- [ ] Performance: 60 FPS on mid-range hardware
- [ ] Code follows style guide

### Playtesting
- Play the game for at least 5 minutes
- Try edge cases (clicking rapidly, selecting same sphere, etc.)
- Check victory condition works
- Verify energy transfer feels intuitive

---

## 🎯 Good First Issues

Looking to contribute but not sure where to start? Try these:

### Visual Effects (Low Complexity)
- Improve sphere glow shader
- Add particle trails to connections
- Enhance victory screen animation
- Add background starfield effect

### Game Design (Medium Complexity)
- Design 3 new puzzle levels
- Balance energy transfer rates
- Create tutorial messages
- Design sphere arrangement patterns

### Code Quality (Medium Complexity)
- Add JSDoc comments to core classes
- Refactor large functions
- Extract magic numbers to constants
- Improve error handling

### Features (High Complexity)
- Add sound effects
- Implement level selection screen
- Add settings menu (volume, graphics quality)
- Create replay system

---

## 🤝 Community Guidelines

### Be Respectful
- Respectful and constructive feedback
- Assume good intentions
- Focus on the issue, not the person
- Celebrate contributions

### Be Patient
- This is an open-source project maintained by volunteers
- Response time may vary
- Complex PRs take longer to review

### Be Collaborative
- Discuss major changes before implementing
- Accept feedback gracefully
- Help others learn

---

## 📞 Communication

### Where to Ask Questions

**GitHub Issues**: Bug reports, feature requests
**GitHub Discussions**: General questions, ideas, design discussions
**Pull Request Comments**: Code-specific questions

### Response Time Expectations
- **Bug reports**: 1-3 days
- **Feature requests**: 1 week
- **Pull requests**: 1-2 weeks (depends on complexity)

---

## 🏆 Recognition

Contributors are credited in:
- `README.md` (for significant contributions)
- GitHub contributors list (automatic)
- Release notes (for features)

**Significant contribution** means:
- Major feature implementation
- Substantial refactoring
- Multiple quality PRs
- Helping other contributors

---

## 📚 Learning Resources

### Three.js
- [Three.js Docs](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Three.js Journey](https://threejs-journey.com/) (course)

### Game Development
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- [Red Blob Games](https://www.redblobgames.com/) (interactive tutorials)

### JavaScript
- [MDN JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [JavaScript.info](https://javascript.info/)

---

## 🚫 What We Don't Accept

- Features not aligned with project vision (check roadmap first)
- Large refactors without prior discussion
- Code without testing
- Disrespectful or unprofessional communication
- Copyright violations (all code must be your own or properly licensed)

---

## ✅ PR Checklist

Before submitting PR:
- [ ] Code follows style guide
- [ ] No console errors
- [ ] Tested on multiple browsers
- [ ] Documentation updated (if needed)
- [ ] Commit messages are descriptive
- [ ] PR description explains changes
- [ ] No commented-out code or debug statements
- [ ] Performance is acceptable (60 FPS target)

---

## 🎉 Thank You!

Every contribution, no matter how small, helps make Pyramids better. Thank you for being part of the project!

**Questions?** Open a GitHub Discussion or Issue.

---

**Last Updated**: 2025-10-27
