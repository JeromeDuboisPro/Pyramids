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
    }

    /**
     * Create a 3D translucent sphere
     * @param {THREE.Vector3} position - Position in world space
     * @param {number} color - Hex color value
     * @param {string} id - Unique identifier for this sphere
     * @returns {THREE.Group} Group containing sphere
     */
    createSphere(position, color, id) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.userData.sphereId = id;

        const radius = CONFIG.SPHERE_RADIUS;

        // Only non-neutral spheres should glow
        const isNeutral = (color === CONFIG.NEUTRAL_COLOR);

        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: isNeutral ? 0x000000 : color,  // No emissive for neutral
            emissiveIntensity: isNeutral ? 0 : 1.2,  // Only glow if not neutral
            transparent: true,
            opacity: 0.85,
            metalness: 0.1,
            roughness: 0.3
        });

        const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64); // High segments for smooth 3D
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphereMesh);

        // Only add point light and glow halo for non-neutral spheres
        if (!isNeutral) {
            const pointLight = new THREE.PointLight(color, 1.5, 8);
            pointLight.position.set(0, 0, 0);
            group.add(pointLight);

            // Add visible glow halo (flat circle visible from top-down)
            const haloGeometry = new THREE.RingGeometry(radius * 1.1, radius * 1.6, 32);
            const haloMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
            haloMesh.rotation.x = Math.PI / 2; // Lay flat (visible from top)
            haloMesh.userData.isHalo = true;
            group.add(haloMesh);
        }

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
        // Check if this is a fully owned sphere (not neutral, not interpolated capture color)
        const isPlayerOwned = (newColor === CONFIG.PLAYER_COLOR);
        const isEnemyOwned = (newColor === CONFIG.ENEMY_COLOR);
        const isFullyOwned = isPlayerOwned || isEnemyOwned;

        let hasLight = false;
        let hasHalo = false;

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

                // Update sphere color
                child.material.color.setHex(newColor);

                // Only set emissive for fully owned spheres
                if (child.material.emissive) {
                    if (isFullyOwned) {
                        child.material.emissive.setHex(newColor); // Glow for fully owned spheres
                        child.material.emissiveIntensity = 1.2;
                    } else {
                        child.material.emissive.setHex(0x000000); // No glow during capture
                        child.material.emissiveIntensity = 0;
                    }
                }
            } else if (child.isLight) {
                // Update point light color
                child.color.setHex(newColor);
                hasLight = true;
            }
        });

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
            // No longer fully owned (neutral or being captured), remove point light and halo
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
     * Add selection outline to sphere
     * @param {THREE.Group} sphereGroup - Sphere to select
     */
    addSelectionOutline(sphereGroup) {
        // Create outline geometry (slightly larger sphere, only edges visible)
        const outlineGeometry = new THREE.SphereGeometry(
            CONFIG.SPHERE_RADIUS * 1.15,
            32,
            32
        );

        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.5,
            side: THREE.BackSide // Render only back faces for outline effect
        });

        const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outlineMesh.userData.isOutline = true;
        sphereGroup.add(outlineMesh);
    }

    /**
     * Remove selection outline from sphere
     * @param {THREE.Group} sphereGroup - Sphere to deselect
     */
    removeSelectionOutline(sphereGroup) {
        const outline = sphereGroup.children.find(child => child.userData.isOutline);
        if (outline) {
            outline.geometry.dispose();
            outline.material.dispose();
            sphereGroup.remove(outline);
        }
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
