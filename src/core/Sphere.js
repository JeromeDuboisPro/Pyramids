/**
 * Sphere Entity
 *
 * Represents a single sphere in the game with its state and behavior.
 * Each sphere has energy level (0-100%), ownership, and can connect to one other sphere.
 */

import { CONFIG } from '../main.js';

export class Sphere {
    /**
     * Create a sphere
     * @param {string} id - Unique identifier
     * @param {THREE.Vector3} position - World position
     * @param {string} owner - 'player' | 'enemy' | 'neutral'
     * @param {number} energy - Initial energy (0-100)
     */
    constructor(id, position, owner = 'neutral', energy = 50.0) {
        this.id = id;
        this.position = position;
        this.owner = owner;
        this.energy = energy; // 0-100%

        // Connection state
        this.connectedTo = null; // Target sphere ID (ONE connection only)
        this.lastTransferTime = 0;

        // Visual reference (will be set by renderer)
        this.mesh = null;
    }

    /**
     * Get current color based on ownership
     * Color represents owner, not energy level
     * Energy level visible via tooltip
     * @returns {number} Hex color value
     */
    getColor() {
        if (this.owner === 'player') {
            return CONFIG.PLAYER_COLOR;
        }
        if (this.owner === 'enemy') {
            return CONFIG.ENEMY_COLOR;
        }
        return CONFIG.NEUTRAL_COLOR;
    }

    /**
     * Update ownership based on energy level
     * Ownership is persistent - only changes when fully captured
     * 0% = enemy captures, 100% = player captures
     * Energy represents the contest balance, not ownership
     */
    updateOwnership() {
        const prevOwner = this.owner;

        // Only change ownership at extremes (fully captured)
        if (this.energy <= 0) {
            this.owner = 'enemy';
        } else if (this.energy >= 100) {
            this.owner = 'player';
        }
        // Otherwise keep existing owner (persistent ownership)

        // Return true if ownership changed
        return prevOwner !== this.owner;
    }

    /**
     * Connect this sphere to a target sphere
     * Breaks previous connection if exists (ONE connection rule)
     * @param {string} targetId - Target sphere ID, or null to disconnect
     */
    connect(targetId) {
        // Validation happens at GameState level
        this.connectedTo = targetId;
        this.lastTransferTime = performance.now();

        console.log(`🔗 Sphere ${this.id} connected to ${targetId || 'none'}`);
    }

    /**
     * Disconnect from current target
     */
    disconnect() {
        this.connectedTo = null;
    }

    /**
     * Check if this sphere is currently connected to another
     * @returns {boolean}
     */
    isConnected() {
        return this.connectedTo !== null;
    }

    /**
     * Transfer energy to this sphere (from another sphere)
     * @param {number} amount - Energy amount to add (can be negative)
     * @returns {boolean} - True if energy changed
     */
    transferEnergy(amount) {
        const prevEnergy = this.energy;

        // Clamp energy to 0-100 range
        this.energy = Math.max(0, Math.min(100, this.energy + amount));

        return this.energy !== prevEnergy;
    }

    /**
     * Get distance to another sphere
     * @param {Sphere} other - Other sphere
     * @returns {number} Euclidean distance
     */
    distanceTo(other) {
        return this.position.distanceTo(other.position);
    }

    /**
     * Clone this sphere (for game state snapshots)
     * @returns {Sphere}
     */
    clone() {
        const cloned = new Sphere(
            this.id,
            this.position.clone(),
            this.owner,
            this.energy
        );
        cloned.connectedTo = this.connectedTo;
        cloned.lastTransferTime = this.lastTransferTime;
        return cloned;
    }

    /**
     * Serialize to JSON (for save/network)
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            owner: this.owner,
            energy: this.energy,
            connectedTo: this.connectedTo
        };
    }

    /**
     * Create from JSON
     * @param {Object} data
     * @returns {Sphere}
     */
    static fromJSON(data) {
        const position = new THREE.Vector3(
            data.position.x,
            data.position.y,
            data.position.z
        );

        const sphere = new Sphere(
            data.id,
            position,
            data.owner,
            data.energy
        );

        sphere.connectedTo = data.connectedTo;
        return sphere;
    }

    /**
     * Debug string
     * @returns {string}
     */
    toString() {
        return `Sphere(${this.id}, ${this.owner}, ${this.energy.toFixed(1)}%, ` +
               `connected: ${this.connectedTo || 'none'})`;
    }
}
