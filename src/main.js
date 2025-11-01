/**
 * Pyramids - Main Entry Point
 *
 * Bootstraps the game, initializes systems, and starts the game loop.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { SceneManager } from './rendering/SceneManager.js';
import { ColorThemeManager } from './ui/ColorThemes.js';
import { GameState } from './core/GameState.js';
import { InputHandler } from './input/InputHandler.js';

// Game configuration constants
export const CONFIG = {
    // Energy transfer
    BASE_ENERGY_RATE: 15.0,      // % per second
    ATTENUATION_FACTOR: 0.01,    // Distance penalty

    // Ownership thresholds
    ENEMY_THRESHOLD: 33,         // Below this = enemy owned
    NEUTRAL_THRESHOLD: 67,       // Above this = player owned

    // Visual
    SPHERE_RADIUS: 0.5,
    GLOW_MULTIPLIER: 1.4,

    // Colors (Hex values)
    PLAYER_COLOR: 0xFF6B35,      // Vibrant orange (warm)
    ENEMY_COLOR: 0x00D9FF,       // Cyan (cool)
    NEUTRAL_COLOR: 0x808080,     // Grey
    BACKGROUND_COLOR: 0x000510,  // Deep space

    // Performance
    TARGET_FPS: 60
};

/**
 * Main Game class
 * Coordinates all game systems and manages the game loop
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.loading = document.getElementById('loading');
        this.victoryScreen = document.getElementById('victory-screen');
        this.restartBtn = document.getElementById('restart-btn');

        // Initialize game state
        this.state = new GameState();

        // Initialize rendering
        this.sceneManager = new SceneManager(this.canvas);

        // Game loop tracking
        this.lastTime = 0;
        this.isRunning = false;
        this.hasWon = false;

        // Bind methods
        this.loop = this.loop.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.restart = this.restart.bind(this);
    }

    /**
     * Initialize the game
     */
    async init() {
        console.log('🎮 Initializing Pyramids...');

        // Setup event listeners
        window.addEventListener('resize', this.onWindowResize);

        // Create puzzle layout in game state
        this.state.createPuzzleLayout();

        // Create visual spheres from game state
        this.sceneManager.createSpheresFromGameState(this.state);

        // Initialize input handler (mouse + touch)
        this.inputHandler = new InputHandler(
            this.canvas,
            this.sceneManager.camera,
            this.state,
            this.sceneManager
        );

        // Initialize color theme manager
        this.colorThemeManager = new ColorThemeManager(this.sceneManager);

        // Setup restart button
        this.restartBtn.addEventListener('click', this.restart);

        // Setup reset view button
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.inputHandler.resetView();
            });
        }

        // Hide loading screen
        this.loading.classList.add('hidden');

        console.log('✅ Game initialized successfully');

        // Debug: dump game state
        this.state.debugDump();

        // Start game loop
        this.start();
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
        console.log('▶️  Game loop started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        console.log('⏸️  Game loop stopped');
    }

    /**
     * Main game loop (60 FPS target)
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    loop(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update game systems
        this.update(deltaTime);

        // Render
        this.render();

        // Request next frame
        requestAnimationFrame(this.loop);
    }

    /**
     * Update game logic
     * @param {number} deltaTime - Time since last frame (seconds)
     */
    update(deltaTime) {
        // Update game state logic (energy transfer)
        this.state.update(deltaTime);

        // Update sphere colors based on current energy levels
        this.sceneManager.updateSphereColors(this.state);

        // Update connection streams visualization
        this.sceneManager.updateConnectionStreams(this.state);

        // Update visual animations (spheres + streams)
        this.sceneManager.updateSphereAnimations(deltaTime);

        // Update HUD
        this.updateHUD();

        // Check victory condition
        if (!this.hasWon && this.state.checkVictory()) {
            this.showVictory();
        }
    }

    /**
     * Update HUD information
     */
    updateHUD() {
        const stats = this.state.getStats();
        const selected = this.state.getSelectedSphere();

        // Update sphere count
        const sphereCountEl = document.getElementById('sphere-count');
        if (sphereCountEl) {
            sphereCountEl.innerHTML = `
                <div>Player: ${stats.playerSpheres}/${stats.totalSpheres} spheres</div>
                <div>Connections: ${stats.activeConnections}</div>
            `;
        }

        // Update selected sphere info
        const selectedInfoEl = document.getElementById('selected-info');
        if (selectedInfoEl) {
            if (selected) {
                selectedInfoEl.innerHTML = `
                    <div style="color: #FF6B35; font-weight: bold;">
                        Selected: ${selected.id}
                    </div>
                    <div style="font-size: 12px;">
                        Energy: ${selected.energy.toFixed(0)}%
                        ${selected.isConnected() ? ` → ${selected.connectedTo}` : ''}
                    </div>
                `;
            } else {
                selectedInfoEl.innerHTML = `
                    <div style="color: rgba(255,255,255,0.5); font-size: 12px;">
                        Click a sphere to select
                    </div>
                `;
            }
        }
    }

    /**
     * Show victory screen
     */
    showVictory() {
        this.hasWon = true;
        this.victoryScreen.classList.remove('hidden');
        console.log('🏆 VICTORY! All spheres captured!');

        // Display final stats in victory screen
        const stats = this.state.getStats();
        const victoryStatsEl = document.getElementById('victory-stats');
        victoryStatsEl.innerHTML = `
            <div style="color: #00D9FF;">⏱️ Time: ${stats.gameTime}s</div>
            <div style="color: #FF6B35; margin-top: 10px;">🎯 Spheres Captured: ${stats.spheresCaptured}</div>
            <div style="color: #00D9FF; margin-top: 10px;">🔗 Connections Created: ${stats.connectionsCreated}</div>
            <div style="color: #FF6B35; margin-top: 10px;">⚡ Energy Transferred: ${stats.energyTransferred.toFixed(0)}%</div>
        `;

        // Log final stats
        console.log('📊 Final Stats:', {
            gameTime: stats.gameTime,
            spheresCaptured: stats.spheresCaptured,
            energyTransferred: stats.energyTransferred.toFixed(1),
            totalConnections: stats.connectionsCreated
        });
    }

    /**
     * Restart the game
     */
    restart() {
        console.log('🔄 Restarting game...');

        // Hide victory screen
        this.victoryScreen.classList.add('hidden');
        this.hasWon = false;

        // Clear all connections
        this.state.getAllSpheres().forEach(sphere => {
            sphere.disconnect();
        });

        // Clear visual streams
        this.sceneManager.streamRenderer.clearAllStreams();

        // Reset game state
        this.state.reset();

        // Recreate puzzle layout
        this.state.createPuzzleLayout();

        // Recreate visual spheres
        this.sceneManager.sphereMeshes.forEach(mesh => {
            this.sceneManager.scene.remove(mesh);
        });
        this.sceneManager.createSpheresFromGameState(this.state);

        // Reset input handler (deselect any sphere)
        if (this.inputHandler.gameState.getSelectedSphere()) {
            this.inputHandler.deselectSphere();
        }

        // Reset game time
        this.lastTime = performance.now();

        console.log('✅ Game restarted successfully');
    }

    /**
     * Render the scene
     */
    render() {
        this.sceneManager.render();
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.sceneManager.onWindowResize();
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting Pyramids...');

    const game = new Game();

    try {
        await game.init();
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        document.getElementById('loading').innerHTML =
            '<div style="color: #ff4444;">Failed to load game. Please refresh.</div>';
    }
});

// Expose THREE for debugging
window.THREE = THREE;
