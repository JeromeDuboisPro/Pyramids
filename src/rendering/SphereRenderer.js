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
     * Create a glowing sphere with 3-layer effect
     * @param {THREE.Vector3} position - Position in world space
     * @param {number} color - Hex color value
     * @param {string} id - Unique identifier for this sphere
     * @returns {THREE.Group} Group containing all sphere layers
     */
    createSphere(position, color, id) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.userData.sphereId = id;

        const radius = CONFIG.SPHERE_RADIUS;

        // Layer 1: Core sphere (solid, emissive)
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1.0,
            metalness: 0.2,
            roughness: 0.4
        });

        const coreGeometry = new THREE.SphereGeometry(radius, 32, 32);
        const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(coreMesh);

        // Layer 2: Glow layer (transparent, additive blending)
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide
        });

        const glowGeometry = new THREE.SphereGeometry(
            radius * CONFIG.GLOW_MULTIPLIER,
            32,
            32
        );
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glowMesh);

        // Layer 3: Halo (very transparent, soft outer glow)
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide
        });

        const haloGeometry = new THREE.SphereGeometry(
            radius * CONFIG.GLOW_MULTIPLIER * 1.3,
            32,
            32
        );
        const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
        group.add(haloMesh);

        // Add point light at sphere position for extra glow effect
        const pointLight = new THREE.PointLight(color, 0.5, 5);
        pointLight.position.set(0, 0, 0); // Relative to group
        group.add(pointLight);

        // Add to scene
        this.scene.add(group);

        return group;
    }

    /**
     * Update sphere color (for energy transfer visualization)
     * @param {THREE.Group} sphereGroup - The sphere group to update
     * @param {number} newColor - New hex color value
     * @param {number} intensity - Emissive intensity (0-1)
     */
    updateSphereColor(sphereGroup, newColor, intensity = 1.0) {
        // Update all layers
        sphereGroup.children.forEach((child, index) => {
            if (child.isMesh && child.material) {
                if (index === 0) {
                    // Core: Update both color and emissive
                    child.material.color.setHex(newColor);
                    child.material.emissive.setHex(newColor);
                    child.material.emissiveIntensity = intensity;
                } else {
                    // Glow and halo: Update color only
                    child.material.color.setHex(newColor);
                }
            } else if (child.isLight) {
                // Update point light color
                child.color.setHex(newColor);
            }
        });
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

        if (energy < CONFIG.ENEMY_THRESHOLD) {
            // Enemy to neutral transition (0-33%)
            const t = energy / CONFIG.ENEMY_THRESHOLD;
            resultColor.lerpColors(enemyColor, neutralColor, t);
        } else if (energy < CONFIG.NEUTRAL_THRESHOLD) {
            // Neutral to player transition (33-67%)
            const t = (energy - CONFIG.ENEMY_THRESHOLD) / (CONFIG.NEUTRAL_THRESHOLD - CONFIG.ENEMY_THRESHOLD);
            resultColor.lerpColors(neutralColor, playerColor, t);
        } else {
            // Player owned (67-100%)
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
