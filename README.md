# Pyramids

**A minimalist real-time strategy game where you control territory through light-based energy transfer.**

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎮 What is Pyramids?

Pyramids is a strategic puzzle game where you:
- **Control light spheres** by creating energy connections between them
- **Capture neutral and enemy spheres** through gradual energy transfer
- **Master distance strategy** - closer connections transfer energy faster
- **Think spatially** - each sphere can only connect to ONE other sphere at a time

**Inspired by**: Osmos (minimalist aesthetics), Go (territorial control), light physics (inverse square law)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari)
- Python 3 or Node.js (for local server)

### Run Locally

**Option 1: Python**
```bash
git clone https://github.com/JeromeDuboisPro/Pyramids.git
cd Pyramids
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

**Option 2: Node.js**
```bash
git clone https://github.com/JeromeDuboisPro/Pyramids.git
cd Pyramids
npx serve .
```

Open the URL shown in terminal.

### Controls
- **Click** your sphere to select it (white glow appears)
- **Click** another sphere to create a connection
- **Click** empty space to deselect
- **Goal**: Capture all neutral spheres (grey) by turning them your color

---

## 📁 Project Structure

```
pyramids/
├── planning/          # Design docs, architecture, roadmap (for devs)
├── src/
│   ├── core/         # Game logic (mode-agnostic)
│   ├── modes/        # Game mode controllers
│   ├── rendering/    # Three.js visualization
│   ├── input/        # Mouse + touch handling
│   └── ui/           # HUD and menus
├── assets/           # Sounds, textures (minimal)
└── README.md         # You are here
```

See `planning/` for detailed technical documentation.

---

## 🎯 Current Status

### ✅ Completed
- Project architecture and design
- Repository setup

### 🔄 In Progress (MVP - Phase 1)
- Static Three.js scene with glowing spheres
- Core data model (Sphere, GameState)
- Click-to-target interaction
- Energy transfer with distance attenuation
- Victory condition

### ⏳ Planned
- Puzzle campaign (10-15 levels)
- Multi-layer pyramid system
- AI opponent (skirmish mode)
- Multiplayer (real-time PvP)
- Mobile version (Android/iOS)

See `planning/roadmap.md` for full development timeline.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Good First Issues**:
- Improve glow shader effects
- Add sound effects
- Design puzzle levels
- Optimize particle systems

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

**TLDR**: Free to use, modify, and distribute. Attribution appreciated!

---

## 🔗 Links

- **GitHub Repository**: https://github.com/JeromeDuboisPro/Pyramids
- **Issues & Features**: https://github.com/JeromeDuboisPro/Pyramids/issues
- **Developer Docs**: See `planning/` folder

---

## 🎨 Credits

**Created by**: [Jerome Dubois](https://github.com/JeromeDuboisPro)

**Inspired by**: Osmos, Go, light physics

**Built with**: [Three.js](https://threejs.org/), JavaScript, WebGL

---

## 📊 Development Progress

Track our progress:
- [x] Project setup
- [ ] MVP (single-layer puzzle)
- [ ] Puzzle campaign
- [ ] Multi-layer pyramid
- [ ] AI opponent
- [ ] Multiplayer
- [ ] Mobile release

---

**Last Updated**: 2025-10-27
