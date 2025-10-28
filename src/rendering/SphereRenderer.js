/**
 * SphereRenderer
 *
 * Creates visually appealing glowing spheres with multi-layer effect.
 * Each sphere consists of:
 * 1. Core (solid, emissive)
 * 2. Glow (transparent, additive blending)
 * 3. Halo (very transparent, soft outer glow)
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CONFIG } from '../main.js';

export class SphereRenderer {
    constructor(scene) {
        this.scene = scene;
        // Cache cellular textures by color to avoid expensive regeneration
        this.textureCache = new Map(); // color (hex) -> THREE.CanvasTexture
    }

    /**
     * Generate cellular plasma texture (S12 pattern from sphere-test.html)
     * Uses cache to avoid expensive regeneration
     * @param {number} color - Hex color for the plasma
     * @param {number} cellCount - Number of cell centers (default 12)
     * @returns {THREE.CanvasTexture}
     */
    createCellularPlasmaTexture(color, cellCount = 12) {
        // Check cache first
        if (this.textureCache.has(color)) {
            return this.textureCache.get(color);
        }

        // Generate random cell centers
        const cellCenters = [];
        for (let i = 0; i < cellCount; i++) {
            cellCenters.push({
                x: Math.random() * 256,
                y: Math.random() * 256
            });
        }

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Convert hex color to RGB components
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;

        // Generate cellular pattern
        for (let x = 0; x < 256; x++) {
            for (let y = 0; y < 256; y++) {
                // Find distance to nearest cell center
                let minDist = Infinity;
                for (const center of cellCenters) {
                    const dx = x - center.x;
                    const dy = y - center.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    minDist = Math.min(minDist, dist);
                }

                // Create plasma wave based on distance
                const value = Math.sin(minDist * 0.1);

                // Color variation based on wave
                const finalR = Math.floor(r * (0.7 + value * 0.3));
                const finalG = Math.floor(g * (0.7 + value * 0.3));
                const finalB = Math.floor(b * (0.7 + value * 0.3));

                ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);

        // Cache for reuse
        this.textureCache.set(color, texture);

        return texture;
    }

    /**
     * Create a 3D sphere with cellular plasma core
     * @param {THREE.Vector3} position - Position in world space
     * @param {number} color - Hex color value
     * @param {string} id - Unique identifier for this sphere
     * @returns {THREE.Group} Group containing sphere
     */
    createSphere(position, color, id) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.userData.sphereId = id;
        group.userData.currentColor = color; // Track color for update optimization

        const radius = CONFIG.SPHERE_RADIUS;

        // Generate cellular plasma texture for this sphere
        const cellularTexture = this.createCellularPlasmaTexture(color);

        // Outer glass shell - transparent
        const glassShellMaterial = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,                // More transparent
            metalness: 0.1,
            roughness: 0.2,
            emissive: 0x000000,
            emissiveIntensity: 0
        });

        const shellGeometry = new THREE.SphereGeometry(radius, 64, 64);
        const shellMesh = new THREE.Mesh(shellGeometry, glassShellMaterial);
        shellMesh.userData.isShell = true;
        group.add(shellMesh);

        // Inner cellular plasma core - uses texture map
        const coreRadius = radius * 0.6;
        const coreMaterial = new THREE.MeshStandardMaterial({
            map: cellularTexture,            // Cellular plasma texture
            emissive: color,
            emissiveIntensity: 2.0,          // Base intensity (will be modulated by energy)
            emissiveMap: cellularTexture,    // Use same texture for emission
            transparent: false,
            metalness: 0.0,
            roughness: 0.5
        });

        const coreGeometry = new THREE.SphereGeometry(coreRadius, 64, 64);
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        coreMesh.userData.isCore = true;
        coreMesh.userData.baseRotationSpeed = 0.5; // Base rotation speed
        coreMesh.userData.currentRotationSpeed = 0.0; // Will be set by energy level
        group.add(coreMesh);

        // Point light for owned spheres only
        const isNeutral = (color === CONFIG.NEUTRAL_COLOR);
        if (!isNeutral) {
            const pointLight = new THREE.PointLight(color, 1.5, 8);
            pointLight.position.set(0, 0, 0);
            group.add(pointLight);
        }

        // NO halo by default - halo is only added for selection

        // Add to scene
        this.scene.add(group);

        return group;
    }

    /**
     * Update sphere color and glow
     * @param {THREE.Group} sphereGroup - The sphere group to update
     * @param {number} newColor - New hex color value
     * @param {number} intensity - Unused (kept for compatibility)
     */
    updateSphereColor(sphereGroup, newColor, intensity = 1.0) {
        // Skip update if color hasn't actually changed (performance optimization)
        const currentColor = sphereGroup.userData.currentColor;

        // Throttle color updates: only update if color difference is significant (> 5%)
        // This prevents rapid texture regeneration during gradual color transitions
        const colorDiff = Math.abs(newColor - currentColor);
        const colorThreshold = 0x0A0A0A; // ~4% color change threshold
        const colorChanged = !currentColor || colorDiff > colorThreshold;

        // Check if this is a fully owned sphere (not neutral, not interpolated capture color)
        const isPlayerOwned = (newColor === CONFIG.PLAYER_COLOR);
        const isEnemyOwned = (newColor === CONFIG.ENEMY_COLOR);
        const isFullyOwned = isPlayerOwned || isEnemyOwned;

        let hasLight = false;
        let hasHalo = false;
        let hasCore = false;

        sphereGroup.children.forEach((child) => {
            if (child.isMesh && child.material) {
                // Skip outline mesh
                if (child.userData.isOutline) return;

                // Update halo color
                if (child.userData.isHalo) {
                    child.material.color.setHex(newColor);
                    hasHalo = true;
                    return;
                }

                // Update inner glowing core
                if (child.userData.isCore) {
                    // Only regenerate texture if color actually changed
                    if (colorChanged) {
                        const newTexture = this.createCellularPlasmaTexture(newColor);

                        // Note: Don't dispose cached textures, they're shared!
                        // Just update references
                        child.material.map = newTexture;
                        child.material.emissiveMap = newTexture;
                        child.material.needsUpdate = true;
                    }

                    // Always update color and intensity (cheap operations)
                    child.material.color.setHex(newColor);
                    child.material.emissive.setHex(newColor);
                    child.material.emissiveIntensity = isFullyOwned ? 2.0 : 0.8;
                    hasCore = true;
                    return;
                }

                // Update glass shell color
                if (child.userData.isShell) {
                    child.material.color.setHex(newColor);
                }
            } else if (child.isLight) {
                // Update point light color
                child.color.setHex(newColor);
                hasLight = true;
            }
        });

        // Update tracked color
        sphereGroup.userData.currentColor = newColor;

        // Core always exists now (added in createSphere), just update intensity above

        // Add or remove point light and halo based on fully owned state
        if (isFullyOwned && !hasLight) {
            // Becoming fully owned, add point light and halo
            const pointLight = new THREE.PointLight(newColor, 1.5, 8);
            pointLight.position.set(0, 0, 0);
            sphereGroup.add(pointLight);

            const radius = CONFIG.SPHERE_RADIUS;
            const haloGeometry = new THREE.RingGeometry(radius * 1.1, radius * 1.6, 32);
            const haloMaterial = new THREE.MeshBasicMaterial({
                color: newColor,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
            haloMesh.rotation.x = Math.PI / 2;
            haloMesh.userData.isHalo = true;
            sphereGroup.add(haloMesh);
        } else if (!isFullyOwned && (hasLight || hasHalo)) {
            // No longer fully owned, remove point light and halo
            const lightToRemove = sphereGroup.children.find(child => child.isLight);
            if (lightToRemove) {
                sphereGroup.remove(lightToRemove);
            }

            const haloToRemove = sphereGroup.children.find(child => child.userData.isHalo);
            if (haloToRemove) {
                haloToRemove.geometry.dispose();
                haloToRemove.material.dispose();
                sphereGroup.remove(haloToRemove);
            }
        }
    }

    /**
     * Interpolate color based on energy percentage (for ownership transitions)
     * @param {number} energy - Energy percentage (0-100)
     * @returns {number} Interpolated hex color
     */
    getColorFromEnergy(energy) {
        const enemyColor = new THREE.Color(CONFIG.ENEMY_COLOR);
        const neutralColor = new THREE.Color(CONFIG.NEUTRAL_COLOR);
        const playerColor = new THREE.Color(CONFIG.PLAYER_COLOR);

        let resultColor = new THREE.Color();

        // Define transition zones (10% buffer around thresholds for smooth gradients)
        const enemyToNeutralStart = CONFIG.ENEMY_THRESHOLD - 10;
        const enemyToNeutralEnd = CONFIG.ENEMY_THRESHOLD + 10;
        const neutralToPlayerStart = CONFIG.NEUTRAL_THRESHOLD - 10;
        const neutralToPlayerEnd = CONFIG.NEUTRAL_THRESHOLD + 10;

        if (energy < enemyToNeutralStart) {
            // Solid enemy color (0-23%)
            resultColor = enemyColor;
        } else if (energy < enemyToNeutralEnd) {
            // Enemy to neutral transition (23-43%)
            const t = (energy - enemyToNeutralStart) / 20;
            resultColor.lerpColors(enemyColor, neutralColor, t);
        } else if (energy < neutralToPlayerStart) {
            // Solid neutral color (43-57%)
            resultColor = neutralColor;
        } else if (energy < neutralToPlayerEnd) {
            // Neutral to player transition (57-77%)
            const t = (energy - neutralToPlayerStart) / 20;
            resultColor.lerpColors(neutralColor, playerColor, t);
        } else {
            // Solid player color (77-100%)
            resultColor = playerColor;
        }

        return resultColor.getHex();
    }

    /**
     * Add selection indicator to sphere (multi-layer pulsing effect)
     * @param {THREE.Group} sphereGroup - Sphere to select
     */
    addSelectionOutline(sphereGroup) {
        // Remove existing selection indicators if any
        this.removeSelectionOutline(sphereGroup);

        const radius = CONFIG.SPHERE_RADIUS;

        // Get sphere color
        let sphereColor = 0xFFFFFF;
        const shellMesh = sphereGroup.children.find(child => child.userData.isShell);
        if (shellMesh && shellMesh.material) {
            sphereColor = shellMesh.material.color.getHex();
        }

        // Outer pulsing ring (bright white for high visibility)
        const outerRingGeometry = new THREE.RingGeometry(radius * 1.2, radius * 1.8, 32);
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,  // Bright white for maximum visibility
            transparent: true,
            opacity: 0.8,  // High opacity
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        outerRing.rotation.x = Math.PI / 2; // Lay flat
        outerRing.userData.isSelectionHalo = true;
        outerRing.userData.isPulsing = true;
        outerRing.userData.pulseType = 'outer'; // Fast pulse
        sphereGroup.add(outerRing);

        // Inner ring (sphere color for context)
        const innerRingGeometry = new THREE.RingGeometry(radius * 1.0, radius * 1.15, 32);
        const innerRingMaterial = new THREE.MeshBasicMaterial({
            color: sphereColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
        innerRing.rotation.x = Math.PI / 2;
        innerRing.userData.isSelectionHalo = true;
        innerRing.userData.isPulsing = true;
        innerRing.userData.pulseType = 'inner'; // Slower pulse for variety
        sphereGroup.add(innerRing);

        // Outer glow sphere (subtle pulsing aura)
        const glowSphereGeometry = new THREE.SphereGeometry(radius * 1.4, 32, 32);
        const glowSphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.15,  // Very subtle
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide  // Only visible from outside
        });

        const glowSphere = new THREE.Mesh(glowSphereGeometry, glowSphereMaterial);
        glowSphere.userData.isSelectionHalo = true;
        glowSphere.userData.isPulsing = true;
        glowSphere.userData.pulseType = 'sphere'; // Gentle scale pulse
        sphereGroup.add(glowSphere);
    }

    /**
     * Remove selection indicators from sphere
     * @param {THREE.Group} sphereGroup - Sphere to deselect
     */
    removeSelectionOutline(sphereGroup) {
        // Find all selection indicators (there may be multiple)
        const halos = sphereGroup.children.filter(child => child.userData.isSelectionHalo);
        halos.forEach(halo => {
            halo.geometry.dispose();
            halo.material.dispose();
            sphereGroup.remove(halo);
        });
    }

    /**
     * Create particle effect (for future pulse streams)
     * @param {THREE.Vector3} position - Start position
     * @param {number} color - Particle color
     * @returns {THREE.Points} Particle system
     */
    createParticles(position, color) {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();

        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.05,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        particles.position.copy(position);

        this.scene.add(particles);

        return particles;
    }

    /**
     * Cleanup sphere resources
     * @param {THREE.Group} sphereGroup - Sphere group to remove
     */
    disposeSphere(sphereGroup) {
        sphereGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });

        this.scene.remove(sphereGroup);
    }
}
