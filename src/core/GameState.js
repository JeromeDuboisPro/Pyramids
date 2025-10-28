/**
 * GameState
 *
 * Central game state manager. Maintains all spheres, connections, and game logic.
 * Provides query methods and state updates.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Sphere } from './Sphere.js';
import { CONFIG } from '../main.js';

export class GameState {
    constructor() {
        // Core state
        this.spheres = new Map(); // id -> Sphere
        this.selectedSphereId = null;

        // Game metadata
        this.tick = 0;
        this.gameTime = 0; // seconds
        this.gameMode = 'puzzle'; // 'puzzle' | 'skirmish' | 'multiplayer'

        // Statistics
        this.stats = {
            spheresCaptured: 0,
            connectionsCreated: 0,
            energyTransferred: 0
        };
    }

    /**
     * Add a sphere to the game
     * @param {Sphere} sphere
     */
    addSphere(sphere) {
        this.spheres.set(sphere.id, sphere);
        console.log(`➕ Added sphere: ${sphere.id}`);
    }

    /**
     * Remove a sphere from the game
     * @param {string} sphereId
     */
    removeSphere(sphereId) {
        // Disconnect any connections to this sphere
        this.spheres.forEach(sphere => {
            if (sphere.connectedTo === sphereId) {
                sphere.disconnect();
            }
        });

        this.spheres.delete(sphereId);
        console.log(`➖ Removed sphere: ${sphereId}`);
    }

    /**
     * Get sphere by ID
     * @param {string} sphereId
     * @returns {Sphere|null}
     */
    getSphere(sphereId) {
        return this.spheres.get(sphereId) || null;
    }

    /**
     * Get all spheres as array
     * @returns {Sphere[]}
     */
    getAllSpheres() {
        return Array.from(this.spheres.values());
    }

    /**
     * Create connection from source to target sphere
     * Enforces ONE connection per sphere rule
     * @param {string} sourceId - Source sphere ID
     * @param {string} targetId - Target sphere ID
     * @returns {boolean} - Success
     */
    createConnection(sourceId, targetId) {
        const source = this.getSphere(sourceId);
        const target = this.getSphere(targetId);

        // Validation
        if (!source || !target) {
            console.warn(`⚠️ Invalid connection: sphere not found`);
            return false;
        }

        if (sourceId === targetId) {
            console.warn(`⚠️ Cannot connect sphere to itself`);
            return false;
        }

        // Create connection (replaces existing if any)
        source.connect(targetId);
        this.stats.connectionsCreated++;

        return true;
    }

    /**
     * Disconnect a sphere from its target
     * @param {string} sphereId
     */
    disconnectSphere(sphereId) {
        const sphere = this.getSphere(sphereId);
        if (sphere) {
            sphere.disconnect();
        }
    }

    /**
     * Select a sphere (for player input)
     * @param {string} sphereId
     */
    selectSphere(sphereId) {
        if (!this.isPlayerSphere(sphereId)) {
            console.warn(`⚠️ Cannot select non-player sphere: ${sphereId}`);
            return;
        }

        this.selectedSphereId = sphereId;
        console.log(`✨ Selected sphere: ${sphereId}`);
    }

    /**
     * Deselect current sphere
     */
    deselectSphere() {
        this.selectedSphereId = null;
    }

    /**
     * Get currently selected sphere
     * @returns {Sphere|null}
     */
    getSelectedSphere() {
        return this.selectedSphereId ? this.getSphere(this.selectedSphereId) : null;
    }

    /**
     * Check if sphere is player-owned
     * @param {string} sphereId
     * @returns {boolean}
     */
    isPlayerSphere(sphereId) {
        const sphere = this.getSphere(sphereId);
        return sphere ? sphere.owner === 'player' : false;
    }

    /**
     * Get all spheres owned by player
     * @returns {Sphere[]}
     */
    getPlayerSpheres() {
        return this.getAllSpheres().filter(s => s.owner === 'player');
    }

    /**
     * Get all spheres owned by enemy
     * @returns {Sphere[]}
     */
    getEnemySpheres() {
        return this.getAllSpheres().filter(s => s.owner === 'enemy');
    }

    /**
     * Get all neutral spheres
     * @returns {Sphere[]}
     */
    getNeutralSpheres() {
        return this.getAllSpheres().filter(s => s.owner === 'neutral');
    }

    /**
     * Get all active connections (spheres that have a target)
     * @returns {Array<{source: Sphere, target: Sphere, distance: number}>}
     */
    getActiveConnections() {
        const connections = [];

        this.spheres.forEach(source => {
            if (source.isConnected()) {
                const target = this.getSphere(source.connectedTo);
                if (target) {
                    connections.push({
                        source,
                        target,
                        distance: source.distanceTo(target)
                    });
                }
            }
        });

        return connections;
    }

    /**
     * Update game state (called every frame)
     * @param {number} deltaTime - Time since last update (seconds)
     */
    update(deltaTime) {
        this.gameTime += deltaTime;
        this.tick++;

        // Process energy transfer for all active connections
        this.processEnergyTransfer(deltaTime);
    }

    /**
     * Process energy transfer for all active connections
     * Energy represents capture progress (0% = neutral, 100% = owned)
     * Source maintains its energy - does NOT lose energy when transferring
     * @param {number} deltaTime - Time since last frame (seconds)
     */
    processEnergyTransfer(deltaTime) {
        const connections = this.getActiveConnections();

        connections.forEach(conn => {
            const { source, target, distance } = conn;

            // Only owned spheres produce energy (neutral = 0 production)
            if (source.owner === 'neutral') return;

            // Calculate energy transfer rate using inverse square attenuation
            const effectiveRate = CONFIG.BASE_ENERGY_RATE /
                (1 + distance * distance * CONFIG.ATTENUATION_FACTOR);

            const energyAmount = effectiveRate * deltaTime;

            // Apply energy transfer based on ownership relationship
            if (source.owner === target.owner) {
                // Same owner: maintain at 100% (already owned)
                target.energy = 100;
                target.attackingOwner = null; // Not being attacked
            } else if (target.owner === 'neutral') {
                // Capturing neutral: 0% → 100%
                target.attackingOwner = source.owner; // Track who's attacking
                const oldEnergy = target.energy;
                target.energy += energyAmount;

                // DEBUG: Log energy changes for neutral spheres
                if (this.tick % 60 === 0) { // Log every 60 frames (~1 second)
                    console.log(`⚡ ${target.id}: ${oldEnergy.toFixed(1)}% → ${target.energy.toFixed(1)}% (+${energyAmount.toFixed(3)}%/frame)`);
                }

                if (target.energy >= 100) {
                    target.energy = 100;
                    target.owner = source.owner; // Capture!
                    target.attackingOwner = null; // Capture complete
                    console.log(`✅ ${target.id} captured by ${source.owner}!`);

                    if (source.owner === 'player') {
                        this.stats.spheresCaptured++;
                    }
                }
                this.stats.energyTransferred += energyAmount;
            } else {
                // Attacking owned sphere: 100% → 0% (becomes neutral)
                target.attackingOwner = source.owner; // Track who's attacking
                target.energy -= energyAmount;
                if (target.energy <= 0) {
                    target.energy = 0;
                    target.owner = 'neutral'; // Lost, reverts to neutral
                    target.attackingOwner = null; // Attack complete (now neutral)
                }
                this.stats.energyTransferred += energyAmount;
            }

            // Update visual if ownership changed
            if (target.mesh) {
                target.mesh.userData.needsColorUpdate = true;
                target.mesh.userData.targetColor = target.getColor();
            }
        });
    }

    /**
     * Check victory condition (MVP: all spheres owned by player)
     * @returns {boolean}
     */
    checkVictory() {
        const totalSpheres = this.spheres.size;
        const playerSpheres = this.getPlayerSpheres().length;

        return totalSpheres > 0 && playerSpheres === totalSpheres;
    }

    /**
     * Check defeat condition (MVP: no defeat in puzzle mode)
     * @returns {boolean}
     */
    checkDefeat() {
        if (this.gameMode === 'puzzle') {
            return false; // No defeat in puzzle mode
        }

        // Future: skirmish/multiplayer defeat conditions
        return false;
    }

    /**
     * Reset game state (for restart)
     */
    reset() {
        this.spheres.clear();
        this.selectedSphereId = null;
        this.tick = 0;
        this.gameTime = 0;
        this.stats = {
            spheresCaptured: 0,
            connectionsCreated: 0,
            energyTransferred: 0
        };

        console.log('🔄 Game state reset');
    }

    /**
     * Create initial puzzle layout (7 spheres: 1 player, 6 neutral)
     */
    createPuzzleLayout() {
        const sphereCount = 7;
        const radius = 4; // Arrangement radius

        // Center sphere (player-owned)
        const centerSphere = new Sphere(
            'center',
            new THREE.Vector3(0, 0, 0),
            'player',
            100.0 // Full player energy
        );
        this.addSphere(centerSphere);

        // Surrounding spheres (neutral) in circular pattern
        for (let i = 0; i < sphereCount - 1; i++) {
            const angle = (i / (sphereCount - 1)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const sphere = new Sphere(
                `sphere-${i}`,
                new THREE.Vector3(x, y, 0),
                'neutral',
                0.0 // Neutral = 0% (unowned buffer zone)
            );
            this.addSphere(sphere);
        }

        console.log(`✅ Created puzzle layout: ${sphereCount} spheres`);
    }

    /**
     * Get game statistics summary
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            totalSpheres: this.spheres.size,
            playerSpheres: this.getPlayerSpheres().length,
            enemySpheres: this.getEnemySpheres().length,
            neutralSpheres: this.getNeutralSpheres().length,
            activeConnections: this.getActiveConnections().length,
            gameTime: this.gameTime.toFixed(1)
        };
    }

    /**
     * Serialize game state to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            spheres: Array.from(this.spheres.values()).map(s => s.toJSON()),
            selectedSphereId: this.selectedSphereId,
            tick: this.tick,
            gameTime: this.gameTime,
            gameMode: this.gameMode,
            stats: this.stats
        };
    }

    /**
     * Load game state from JSON
     * @param {Object} data
     */
    static fromJSON(data) {
        const state = new GameState();

        // Restore spheres
        data.spheres.forEach(sphereData => {
            const sphere = Sphere.fromJSON(sphereData);
            state.addSphere(sphere);
        });

        // Restore metadata
        state.selectedSphereId = data.selectedSphereId;
        state.tick = data.tick;
        state.gameTime = data.gameTime;
        state.gameMode = data.gameMode;
        state.stats = data.stats;

        return state;
    }

    /**
     * Debug dump
     */
    debugDump() {
        console.log('=== GAME STATE DEBUG ===');
        console.log(`Mode: ${this.gameMode}`);
        console.log(`Time: ${this.gameTime.toFixed(1)}s (tick ${this.tick})`);
        console.log(`Selected: ${this.selectedSphereId || 'none'}`);
        console.log('\nSpheres:');
        this.spheres.forEach(sphere => {
            console.log(`  ${sphere.toString()}`);
        });
        console.log('\nConnections:');
        this.getActiveConnections().forEach(conn => {
            console.log(`  ${conn.source.id} → ${conn.target.id} (dist: ${conn.distance.toFixed(2)})`);
        });
        console.log('\nStats:', this.stats);
        console.log('========================');
    }
}
