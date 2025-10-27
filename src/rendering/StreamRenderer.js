/**
 * StreamRenderer
 *
 * Creates and animates visible connection streams (pulse beams) between spheres.
 * Uses TubeGeometry for visible beams with flowing texture and particle effects.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { CONFIG } from '../main.js';

export class StreamRenderer {
    constructor(scene) {
        this.scene = scene;
        this.streams = new Map(); // connectionKey -> stream object
        this.time = 0;
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
            } else {
                // Update existing stream (position might change in future)
                // For now, connections are static
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

        // Create tube geometry along the path
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            20,    // segments
            0.08,  // radius (thin beam)
            8,     // radial segments
            false  // not closed
        );

        // Create material with flowing effect
        const color = new THREE.Color(CONFIG.PLAYER_COLOR);

        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const tubeMesh = new THREE.Mesh(tubeGeometry, material);

        // Create particle system along the stream
        const particles = this.createStreamParticles(source.position, target.position, color);

        // Group everything together
        const streamGroup = new THREE.Group();
        streamGroup.add(tubeMesh);
        streamGroup.add(particles);

        this.scene.add(streamGroup);

        // Store stream data
        this.streams.set(key, {
            group: streamGroup,
            tubeMesh: tubeMesh,
            particles: particles,
            material: material,
            source: source,
            target: target,
            createdAt: performance.now()
        });

        console.log(`✨ Created stream: ${key}`);
    }

    /**
     * Create particle system along stream path
     * @param {THREE.Vector3} start
     * @param {THREE.Vector3} end
     * @param {THREE.Color} color
     * @returns {THREE.Points}
     */
    createStreamParticles(start, end, color) {
        const particleCount = 30;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount); // Store progress along path

        // Initialize particles along the line
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const pos = new THREE.Vector3().lerpVectors(start, end, t);

            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;

            // Random velocity for variety
            velocities[i] = t + Math.random() * 0.1;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, material);
        points.userData.velocities = velocities; // Store for animation

        return points;
    }

    /**
     * Remove a stream
     * @param {string} key
     */
    removeStream(key) {
        const stream = this.streams.get(key);
        if (!stream) return;

        // Dispose geometries and materials
        stream.tubeMesh.geometry.dispose();
        stream.tubeMesh.material.dispose();

        stream.particles.geometry.dispose();
        stream.particles.material.dispose();

        // Remove from scene
        this.scene.remove(stream.group);

        this.streams.delete(key);

        console.log(`🗑️  Removed stream: ${key}`);
    }

    /**
     * Animate all streams (flowing effect)
     * @param {number} deltaTime - Time since last frame
     */
    animate(deltaTime) {
        this.time += deltaTime;

        this.streams.forEach((stream, key) => {
            // Pulse the tube opacity
            const pulseSpeed = 2.0;
            const pulseAmount = 0.2;
            const basePulse = 0.6;
            stream.material.opacity = basePulse + Math.sin(this.time * pulseSpeed) * pulseAmount;

            // Animate particles along the path
            this.animateStreamParticles(stream);
        });
    }

    /**
     * Animate particles flowing along stream
     * @param {Object} stream - Stream data
     */
    animateStreamParticles(stream) {
        const particles = stream.particles;
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.userData.velocities;

        const start = stream.source.position;
        const end = stream.target.position;

        const flowSpeed = 0.5; // Speed of particle flow

        for (let i = 0; i < velocities.length; i++) {
            // Update particle position along path
            velocities[i] += flowSpeed * 0.016; // Assume ~60fps

            // Wrap around when reaching end
            if (velocities[i] > 1.0) {
                velocities[i] = 0.0;
            }

            // Interpolate position
            const t = velocities[i];
            const pos = new THREE.Vector3().lerpVectors(start, end, t);

            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Update stream colors based on owner (for future use)
     * @param {string} key
     * @param {number} color - Hex color
     */
    updateStreamColor(key, color) {
        const stream = this.streams.get(key);
        if (!stream) return;

        stream.material.color.setHex(color);
        stream.particles.material.color.setHex(color);
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
