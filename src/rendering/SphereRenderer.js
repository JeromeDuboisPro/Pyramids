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

        // Create darker base color (30% brightness) and bright emissive for strong glow
        const baseColor = new THREE.Color(color);
        baseColor.multiplyScalar(0.3); // Much darker base

        // Translucent sphere with strong emissive glow
        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: baseColor.getHex(),  // Dark base color
            emissive: color,             // Bright emissive glow
            emissiveIntensity: 2.0,      // Very strong glow (was 0.8)
            transparent: true,
            opacity: 0.9,                // Slightly more opaque
            metalness: 0.0,              // No metallic reflection
            roughness: 0.4,
            transmission: 0.1,           // Less transparent to show glow better
            thickness: 0.3,
            clearcoat: 0.2,
            clearcoatRoughness: 0.3
        });

        const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64); // High segments for smooth 3D
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphereMesh);

        // Stronger point light for ambient glow
        const pointLight = new THREE.PointLight(color, 1.5, 8); // Increased intensity and distance
        pointLight.position.set(0, 0, 0);
        group.add(pointLight);

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
        // Create darker base color for contrast
        const baseColor = new THREE.Color(newColor);
        baseColor.multiplyScalar(0.3); // Match the 30% darkness from createSphere

        sphereGroup.children.forEach((child) => {
            if (child.isMesh && child.material) {
                // Update sphere with dark base and bright emissive
                child.material.color.setHex(baseColor.getHex());
                child.material.emissive.setHex(newColor);
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
