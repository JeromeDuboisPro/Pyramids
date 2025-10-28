/**
 * StreamRenderer
 *
 * Creates particle-based energy transmission between spheres.
 * Each connection sends ONE particle at regular intervals with impact burst effects.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CONFIG } from '../main.js';

export class StreamRenderer {
    constructor(scene) {
        this.scene = scene;
        this.streams = new Map(); // connectionKey -> stream object
        this.time = 0;
        this.particleInterval = 1.0; // Send particle every 1 second
    }

    /**
     * Create or update streams based on active connections
     * @param {Array} activeConnections - Array of {source, target, distance}
     */
    updateStreams(activeConnections) {
        const currentKeys = new Set();

        // Create/update streams for active connections
        activeConnections.forEach(conn => {
            const key = `${conn.source.id}-${conn.target.id}`;
            currentKeys.add(key);

            if (!this.streams.has(key)) {
                // Create new stream
                this.createStream(conn.source, conn.target, key);
            }
        });

        // Remove streams that are no longer active
        this.streams.forEach((stream, key) => {
            if (!currentKeys.has(key)) {
                this.removeStream(key);
            }
        });
    }

    /**
     * Create a visual stream between two spheres
     * @param {Sphere} source - Source sphere
     * @param {Sphere} target - Target sphere
     * @param {string} key - Unique connection key
     */
    createStream(source, target, key) {
        // Create curved path from source to target
        const curve = new THREE.CatmullRomCurve3([
            source.position.clone(),
            target.position.clone()
        ]);

        // Create transparent tube geometry
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            20,    // segments
            0.06,  // radius (thin tube)
            8,     // radial segments
            false  // not closed
        );

        // Determine color based on source owner
        let tubeColor = CONFIG.PLAYER_COLOR;
        if (source.owner === 'enemy') {
            tubeColor = CONFIG.ENEMY_COLOR;
        } else if (source.owner === 'neutral') {
            tubeColor = CONFIG.NEUTRAL_COLOR;
        }

        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: tubeColor,
            transparent: true,
            opacity: 0.2,  // Very transparent
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);

        // Group everything together
        const streamGroup = new THREE.Group();
        streamGroup.add(tubeMesh);

        this.scene.add(streamGroup);

        // Store stream data
        this.streams.set(key, {
            group: streamGroup,
            tubeMesh: tubeMesh,
            curve: curve,
            material: tubeMaterial,
            source: source,
            target: target,
            createdAt: performance.now(),
            lastParticleTime: 0,
            activeParticles: [],  // Array of {mesh, progress, speed}
            burstEffects: [],     // Array of burst effect meshes
            color: tubeColor
        });

        console.log(`✨ Created stream: ${key}`);
    }

    /**
     * Create a single energy particle
     * @param {Object} stream - Stream data
     * @returns {THREE.Mesh} Particle mesh
     */
    createParticle(stream) {
        const particleGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: stream.color,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        // Add point light to particle for glow effect
        const light = new THREE.PointLight(stream.color, 2.0, 3.0);
        particle.add(light);

        stream.group.add(particle);

        return particle;
    }

    /**
     * Create burst effect on particle impact
     * @param {THREE.Vector3} position - Impact position
     * @param {number} color - Burst color
     * @param {Object} stream - Stream data
     */
    createImpactBurst(position, color, stream) {
        const burstCount = 8;
        const burstGeometry = new THREE.SphereGeometry(0.08, 8, 8);

        for (let i = 0; i < burstCount; i++) {
            const burstMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0,
                blending: THREE.AdditiveBlending
            });

            const burst = new THREE.Mesh(burstGeometry, burstMaterial);
            burst.position.copy(position);

            // Random velocity for burst particles
            const angle = (i / burstCount) * Math.PI * 2;
            burst.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * 2.0,
                Math.sin(angle) * 2.0,
                (Math.random() - 0.5) * 1.0
            );
            burst.userData.lifetime = 0.5; // 0.5 seconds
            burst.userData.age = 0;

            stream.group.add(burst);
            stream.burstEffects.push(burst);
        }

        console.log(`💥 Impact burst at target: ${stream.target.id}`);

        // Trigger sphere impact response
        this.triggerSphereImpact(stream.target);
    }

    /**
     * Trigger visual impact response on target sphere
     * @param {Sphere} targetSphere - Target sphere entity
     */
    triggerSphereImpact(targetSphere) {
        if (!targetSphere.mesh) return;

        const coreMesh = targetSphere.mesh.children.find(child => child.userData.isCore);
        if (!coreMesh) return;

        // Set rotation speed multiplier (read by SceneManager)
        coreMesh.userData.rotationSpeedMultiplier = 2.0; // 2x boost
        coreMesh.userData.boostStartTime = performance.now();
        coreMesh.userData.boostDuration = 0.3; // 300ms boost

        // Scale pulse for impact vibration
        coreMesh.userData.impactPulse = true;
        coreMesh.userData.impactStartTime = performance.now();
        coreMesh.userData.impactDuration = 0.2; // 200ms vibration
    }

    /**
     * Remove a stream
     * @param {string} key
     */
    removeStream(key) {
        const stream = this.streams.get(key);
        if (!stream) return;

        // Dispose tube geometry and materials
        stream.tubeMesh.geometry.dispose();
        stream.tubeMesh.material.dispose();

        // Dispose active particles
        stream.activeParticles.forEach(particleData => {
            if (particleData.mesh.geometry) particleData.mesh.geometry.dispose();
            if (particleData.mesh.material) particleData.mesh.material.dispose();
            // Dispose particle's point light (no disposal needed for lights)
        });

        // Dispose burst effects
        stream.burstEffects.forEach(burst => {
            if (burst.geometry) burst.geometry.dispose();
            if (burst.material) burst.material.dispose();
        });

        // Remove from scene
        this.scene.remove(stream.group);

        this.streams.delete(key);

        console.log(`🗑️  Removed stream: ${key}`);
    }

    /**
     * Animate all streams and particles
     * @param {number} deltaTime - Time since last frame
     */
    animate(deltaTime) {
        this.time += deltaTime;

        this.streams.forEach((stream, key) => {
            // Check if it's time to send a new particle
            const timeSinceLastParticle = this.time - stream.lastParticleTime;

            // Only send particles if target is NOT fully captured (< 100% energy)
            const targetNotFull = stream.target.energy < 100;

            if (timeSinceLastParticle >= this.particleInterval && targetNotFull) {
                // Create new particle
                const particle = this.createParticle(stream);
                const travelTime = stream.curve.getLength() / 3.0; // 3 units per second
                stream.activeParticles.push({
                    mesh: particle,
                    progress: 0.0,
                    speed: 1.0 / travelTime  // Progress per second
                });
                stream.lastParticleTime = this.time;
            }

            // Animate active particles
            this.animateParticles(stream, deltaTime);

            // Animate burst effects
            this.animateBurstEffects(stream, deltaTime);

            // Animate tube pulsing
            const pulseSpeed = 2.0;
            const pulseAmount = 0.1;
            const baseOpacity = 0.2;
            stream.material.opacity = baseOpacity + Math.sin(this.time * pulseSpeed) * pulseAmount;
        });

        // Animate sphere impact effects
        this.animateSphereImpacts(deltaTime);
    }

    /**
     * Animate particles along stream path
     * @param {Object} stream - Stream data
     * @param {number} deltaTime - Time since last frame
     */
    animateParticles(stream, deltaTime) {
        const particlesToRemove = [];

        stream.activeParticles.forEach((particleData, index) => {
            // Update progress
            particleData.progress += particleData.speed * deltaTime;

            if (particleData.progress >= 1.0) {
                // Particle reached target - create burst effect
                const targetPos = stream.target.position.clone();
                this.createImpactBurst(targetPos, stream.color, stream);

                // Mark for removal
                particlesToRemove.push(index);

                // Dispose particle
                particleData.mesh.geometry.dispose();
                particleData.mesh.material.dispose();
                stream.group.remove(particleData.mesh);
            } else {
                // Update particle position along curve
                const position = stream.curve.getPoint(particleData.progress);
                particleData.mesh.position.copy(position);

                // Particle pulsing effect
                const pulseSpeed = 5.0;
                const scale = 1.0 + Math.sin(this.time * pulseSpeed) * 0.3;
                particleData.mesh.scale.setScalar(scale);
            }
        });

        // Remove completed particles
        for (let i = particlesToRemove.length - 1; i >= 0; i--) {
            stream.activeParticles.splice(particlesToRemove[i], 1);
        }
    }

    /**
     * Animate burst effects
     * @param {Object} stream - Stream data
     * @param {number} deltaTime - Time since last frame
     */
    animateBurstEffects(stream, deltaTime) {
        const burstsToRemove = [];

        stream.burstEffects.forEach((burst, index) => {
            burst.userData.age += deltaTime;

            const agePercent = burst.userData.age / burst.userData.lifetime;

            if (agePercent >= 1.0) {
                // Burst expired
                burstsToRemove.push(index);
                burst.geometry.dispose();
                burst.material.dispose();
                stream.group.remove(burst);
            } else {
                // Update burst position
                burst.position.add(burst.userData.velocity.clone().multiplyScalar(deltaTime));

                // Fade out
                burst.material.opacity = 1.0 - agePercent;

                // Shrink
                const scale = 1.0 - agePercent * 0.5;
                burst.scale.setScalar(scale);
            }
        });

        // Remove expired bursts
        for (let i = burstsToRemove.length - 1; i >= 0; i--) {
            stream.burstEffects.splice(burstsToRemove[i], 1);
        }
    }

    /**
     * Animate sphere impact effects (vibration and rotation boost timer)
     * @param {number} deltaTime - Time since last frame
     */
    animateSphereImpacts(deltaTime) {
        this.streams.forEach(stream => {
            if (!stream.target.mesh) return;

            const coreMesh = stream.target.mesh.children.find(child => child.userData.isCore);
            if (!coreMesh) return;

            const now = performance.now();

            // Rotation boost timer (multiplier read by SceneManager)
            if (coreMesh.userData.rotationSpeedMultiplier) {
                const elapsed = (now - coreMesh.userData.boostStartTime) / 1000;
                if (elapsed >= coreMesh.userData.boostDuration) {
                    // Boost expired - remove multiplier
                    delete coreMesh.userData.rotationSpeedMultiplier;
                    delete coreMesh.userData.boostStartTime;
                    delete coreMesh.userData.boostDuration;
                }
                // Note: No rotation applied here - SceneManager handles it
            }

            // Impact vibration effect
            if (coreMesh.userData.impactPulse) {
                const elapsed = (now - coreMesh.userData.impactStartTime) / 1000;
                if (elapsed < coreMesh.userData.impactDuration) {
                    // Vibration effect (rapid scale oscillation)
                    const frequency = 30.0; // Hz
                    const amplitude = 0.08;
                    const vibration = 1.0 + Math.sin(elapsed * frequency * Math.PI * 2) * amplitude;
                    coreMesh.scale.setScalar(vibration);
                } else {
                    // Vibration ended - reset scale
                    coreMesh.scale.setScalar(1.0);
                    delete coreMesh.userData.impactPulse;
                    delete coreMesh.userData.impactStartTime;
                    delete coreMesh.userData.impactDuration;
                }
            }
        });
    }

    /**
     * Update stream colors based on owner
     * @param {string} key
     * @param {number} color - Hex color
     */
    updateStreamColor(key, color) {
        const stream = this.streams.get(key);
        if (!stream) return;

        stream.material.color.setHex(color);
        stream.color = color;
    }

    /**
     * Get number of active streams
     * @returns {number}
     */
    getStreamCount() {
        return this.streams.size;
    }

    /**
     * Remove all streams
     */
    clearAllStreams() {
        const keys = Array.from(this.streams.keys());
        keys.forEach(key => this.removeStream(key));
    }

    /**
     * Cleanup
     */
    dispose() {
        this.clearAllStreams();
        console.log('🗑️  Stream renderer disposed');
    }
}
