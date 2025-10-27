/**
 * ColorThemes
 *
 * Manages color theme presets and live theme switching.
 * Allows users to try different color schemes for player/enemy/neutral spheres.
 */

import { CONFIG } from '../main.js';

export const THEMES = {
    fireIce: {
        name: 'Fire & Ice',
        description: 'Warm orange vs cool cyan (recommended)',
        player: 0xFF6B35,    // Vibrant orange
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x808080    // Grey
    },
    classic: {
        name: 'Classic',
        description: 'Pure white vs cyan',
        player: 0xFFFFFF,    // White
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x606060    // Dark grey
    },
    crimson: {
        name: 'Crimson Tide',
        description: 'Red vs cyan conflict',
        player: 0xFF3366,    // Vibrant red-pink
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x808080    // Grey
    },
    golden: {
        name: 'Golden Sun',
        description: 'Gold vs cyan regal theme',
        player: 0xFFD700,    // Gold
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x606060    // Darker grey
    },
    sunset: {
        name: 'Sunset',
        description: 'Warm sunset orange',
        player: 0xFF8C42,    // Sunset orange
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x808080    // Grey
    },
    ember: {
        name: 'Ember',
        description: 'Glowing amber vs ice',
        player: 0xFFB347,    // Amber
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x808080    // Grey
    },
    neon: {
        name: 'Neon',
        description: 'Electric purple vs cyan',
        player: 0xBF40BF,    // Electric purple
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x808080    // Grey
    },
    lime: {
        name: 'Toxic',
        description: 'Toxic green vs cyan',
        player: 0x39FF14,    // Neon green
        enemy: 0x00D9FF,     // Cyan
        neutral: 0x808080    // Grey
    }
};

export class ColorThemeManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.currentTheme = 'fireIce'; // Default

        this.initUI();
    }

    /**
     * Initialize the settings UI
     */
    initUI() {
        // Get UI elements
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsPanel = document.getElementById('settings-panel');
        this.closeBtn = document.getElementById('close-settings');
        this.themeContainer = document.getElementById('theme-options');

        // Create theme buttons
        this.createThemeButtons();

        // Event listeners
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeBtn.addEventListener('click', () => this.closeSettings());

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.settingsPanel.classList.contains('hidden')) {
                this.closeSettings();
            }
        });

        console.log('✅ Color theme manager initialized');
    }

    /**
     * Create theme selection buttons
     */
    createThemeButtons() {
        Object.keys(THEMES).forEach(themeKey => {
            const theme = THEMES[themeKey];

            const button = document.createElement('button');
            button.className = 'theme-btn';
            button.dataset.theme = themeKey;

            if (themeKey === this.currentTheme) {
                button.classList.add('active');
            }

            // Create color preview circles
            const preview = document.createElement('div');
            preview.className = 'color-preview';

            const playerCircle = document.createElement('span');
            playerCircle.className = 'color-circle';
            playerCircle.style.background = `#${theme.player.toString(16).padStart(6, '0')}`;

            const vsText = document.createElement('span');
            vsText.textContent = 'vs';
            vsText.style.margin = '0 8px';
            vsText.style.fontSize = '12px';

            const enemyCircle = document.createElement('span');
            enemyCircle.className = 'color-circle';
            enemyCircle.style.background = `#${theme.enemy.toString(16).padStart(6, '0')}`;

            preview.appendChild(playerCircle);
            preview.appendChild(vsText);
            preview.appendChild(enemyCircle);

            // Theme info
            const info = document.createElement('div');
            info.className = 'theme-info';
            info.innerHTML = `
                <div class="theme-name">${theme.name}</div>
                <div class="theme-desc">${theme.description}</div>
            `;

            button.appendChild(preview);
            button.appendChild(info);

            button.addEventListener('click', () => this.applyTheme(themeKey));

            this.themeContainer.appendChild(button);
        });
    }

    /**
     * Apply a color theme
     */
    applyTheme(themeKey) {
        if (!THEMES[themeKey]) return;

        const theme = THEMES[themeKey];

        // Update CONFIG
        CONFIG.PLAYER_COLOR = theme.player;
        CONFIG.ENEMY_COLOR = theme.enemy;
        CONFIG.NEUTRAL_COLOR = theme.neutral;

        // Update all spheres in scene
        this.sceneManager.updateAllSphereColors();

        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${themeKey}"]`).classList.add('active');

        this.currentTheme = themeKey;

        console.log(`🎨 Applied theme: ${theme.name}`);
    }

    /**
     * Open settings panel
     */
    openSettings() {
        this.settingsPanel.classList.remove('hidden');
    }

    /**
     * Close settings panel
     */
    closeSettings() {
        this.settingsPanel.classList.add('hidden');
    }
}
