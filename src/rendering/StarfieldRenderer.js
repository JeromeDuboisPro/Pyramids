/**
 * StarfieldRenderer
 *
 * Creates a subtle starfield background with twinkling stars.
 * Sparse, slow-moving stars to add depth without distraction.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class StarfieldRenderer {
    constructor(scene) {
        this.scene = scene;
        this.starGroup = new THREE.Group();
        this.stars = [];
        this.time = 0;

        // Star trails (persistent wandering connections)
        this.trails = [];
        this.numTrails = 4; // 4 persistent trails with distinct colors
        this.trailColors = [
            0x88ddff, // Cyan
            0xff88dd, // Pink
            0xffff88, // Yellow
            0x88ffdd  // Mint
        ];

        // Touch lights (when trails reach stars)
        this.activeTouchLights = [];
    }

    /**
     * Create starfield using small mesh spheres
     * @param {number} starCount - Number of stars (default 150)
     */
    createStarfield(starCount = 150) {
        // Distribute stars around the edges of the view
        for (let i = 0; i < starCount; i++) {
            // Random position spread across view
            const spreadX = 35;
            const spreadY = 35;
            const x = (Math.random() - 0.5) * spreadX;
            const y = (Math.random() - 0.5) * spreadY;
            const z = 0; // Same z as spheres

            // Only add stars outside the gameplay area (avoid overlap with spheres)
            const distanceFromCenter = Math.sqrt(x*x + y*y);
            if (distanceFromCenter < 8) continue; // Skip stars too close to center

            // Slight color variation (mostly white with hints of blue/yellow)
            let starColor = 0xffffff;
            const colorVariation = Math.random();
            if (colorVariation < 0.7) {
                starColor = 0xffffff; // White
            } else if (colorVariation < 0.85) {
                starColor = 0xccddff; // Slightly blue
            } else {
                starColor = 0xffffcc; // Slightly yellow
            }

            // Random size (smaller stars)
            const starSize = 0.05 + Math.random() * 0.08;

            // Create small glowing sphere for star
            const starGeometry = new THREE.SphereGeometry(starSize, 8, 8);
            const starMaterial = new THREE.MeshBasicMaterial({
                color: starColor,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });

            const starMesh = new THREE.Mesh(starGeometry, starMaterial);
            starMesh.position.set(x, y, z);

            // Store twinkle phase for animation
            starMesh.userData.twinklePhase = Math.random() * Math.PI * 2;
            starMesh.userData.baseOpacity = 0.8;
            starMesh.userData.twinkleSpeed = 0.5 + Math.random() * 1.0;
            starMesh.userData.originalColor = starColor; // Store original color
            starMesh.userData.painted = false; // Not yet painted by a trail

            this.starGroup.add(starMesh);
            this.stars.push(starMesh);
        }

        this.scene.add(this.starGroup);

        // Initialize persistent trails
        this.initializeTrails();

        console.log(`✨ Created starfield with ${this.stars.length} stars and ${this.numTrails} trails`);
    }

    /**
     * Initialize persistent star trails (comet-style with history)
     */
    initializeTrails() {
        for (let i = 0; i < this.numTrails; i++) {
            // Pick random starting star
            const startStar = this.stars[Math.floor(Math.random() * this.stars.length)];

            // Find nearby star as first target
            const nearbyStars = this.findNearbyStars(startStar, 8);
            if (nearbyStars.length === 0) continue;

            const targetStar = nearbyStars[Math.floor(Math.random() * nearbyStars.length)];

            // Assign distinct color to this trail
            const color = this.trailColors[i];

            // Create line geometry for comet trail (will be updated with history)
            const points = [startStar.position.clone(), targetStar.position.clone()];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // Add vertex colors for gradient effect
            const colors = new Float32Array([
                0.2, 0.2, 0.2, // Tail (dim)
                1.0, 1.0, 1.0  // Head (bright)
            ]);
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                vertexColors: true
            });

            const line = new THREE.Line(geometry, material);
            this.starGroup.add(line);

            // Paint the starting star with trail color
            startStar.material.color.setHex(color);
            startStar.userData.painted = true;
            startStar.userData.paintedColor = color;

            // Store trail data with history
            this.trails.push({
                line: line,
                starHistory: [startStar], // History of visited stars (max 3)
                targetStar: targetStar,
                progress: 0, // 0 to 1 (progress to target)
                speed: 0.4 + Math.random() * 0.4, // 0.4-0.8 units per second
                color: color,
                maxHistory: 3,
                tailFadeProgress: 0 // For gradual tail erasure
            });
        }
    }

    /**
     * Find stars within given distance of a star
     * @param {THREE.Mesh} star - Reference star
     * @param {number} maxDistance - Maximum distance
     * @returns {Array} Array of nearby stars
     */
    findNearbyStars(star, maxDistance) {
        const nearby = [];
        this.stars.forEach(otherStar => {
            if (otherStar === star) return;
            const distance = star.position.distanceTo(otherStar.position);
            if (distance <= maxDistance) {
                nearby.push(otherStar);
            }
        });
        return nearby;
    }


    /**
     * Animate starfield (slow rotation and twinkling)
     * @param {number} deltaTime - Time since last frame
     */
    animate(deltaTime) {
        if (this.stars.length === 0) return;

        this.time += deltaTime;

        // Very slow rotation for parallax effect
        this.starGroup.rotation.z += deltaTime * 0.01;

        // Twinkle individual stars
        this.stars.forEach(star => {
            const phase = star.userData.twinklePhase + this.time * star.userData.twinkleSpeed;
            const opacity = star.userData.baseOpacity + Math.sin(phase) * 0.3;
            star.material.opacity = Math.max(0.3, Math.min(1.0, opacity));
        });

        // Animate persistent trails
        this.animateTrails(deltaTime);

        // Animate touch lights
        this.animateTouchLights(deltaTime);
    }

    /**
     * Animate persistent star trails (comet-style with history)
     * @param {number} deltaTime - Time since last frame
     */
    animateTrails(deltaTime) {
        this.trails.forEach(trail => {
            const lastStar = trail.starHistory[trail.starHistory.length - 1];
            const distance = lastStar.position.distanceTo(trail.targetStar.position);

            // Update progress along the path
            trail.progress += (trail.speed * deltaTime) / distance;

            // Gradually erase tail when at max history
            if (trail.starHistory.length > trail.maxHistory) {
                const tailDistance = trail.starHistory[0].position.distanceTo(trail.starHistory[1].position);
                trail.tailFadeProgress += (trail.speed * deltaTime) / tailDistance;

                if (trail.tailFadeProgress >= 1.0) {
                    trail.starHistory.shift(); // Remove oldest star
                    trail.tailFadeProgress = 0;
                }
            }

            if (trail.progress >= 1.0) {
                // Reached target - add to history
                trail.starHistory.push(trail.targetStar);

                // Create touch light effect at star
                this.createStarTouchLight(trail.targetStar, trail.color);

                // Find new target nearby (excluding stars already in history)
                const nearbyStars = this.findNearbyStars(trail.targetStar, 8).filter(
                    star => !trail.starHistory.includes(star)
                );

                if (nearbyStars.length > 0) {
                    trail.targetStar = nearbyStars[Math.floor(Math.random() * nearbyStars.length)];
                } else {
                    // No valid nearby stars - pick any random star not in history
                    const availableStars = this.stars.filter(star => !trail.starHistory.includes(star));
                    if (availableStars.length > 0) {
                        trail.targetStar = availableStars[Math.floor(Math.random() * availableStars.length)];
                    }
                }

                trail.progress = 0;
            }

            // Build points array: history stars + current interpolated position
            const points = [];
            const colors = [];

            // Start point for tail fade
            let startIndex = 0;
            let firstPoint = trail.starHistory[0].position.clone();

            // If tail is fading, interpolate start point
            if (trail.starHistory.length > trail.maxHistory && trail.tailFadeProgress > 0) {
                firstPoint = new THREE.Vector3().lerpVectors(
                    trail.starHistory[0].position,
                    trail.starHistory[1].position,
                    trail.tailFadeProgress
                );
                // Adjust brightness for fading tail
                const fadeBrightness = (1.0 - trail.tailFadeProgress) * 0.2;
                colors.push(fadeBrightness, fadeBrightness, fadeBrightness);
                points.push(firstPoint);
                startIndex = 1;
            }

            // Add history stars (skip first if tail is fading)
            for (let i = startIndex; i < trail.starHistory.length; i++) {
                points.push(trail.starHistory[i].position.clone());

                // Gradient from dim (oldest) to bright (newest)
                const brightness = (i - startIndex + 1) / (trail.starHistory.length - startIndex + 1);
                colors.push(brightness, brightness, brightness);
            }

            // Add current interpolated position (brightest)
            const lastHistoryStar = trail.starHistory[trail.starHistory.length - 1];
            const currentPos = new THREE.Vector3().lerpVectors(
                lastHistoryStar.position,
                trail.targetStar.position,
                trail.progress
            );
            points.push(currentPos);
            colors.push(1.0, 1.0, 1.0); // Head is brightest

            // Update line geometry
            trail.line.geometry.setFromPoints(points);

            // Update vertex colors for gradient
            trail.line.geometry.setAttribute(
                'color',
                new THREE.BufferAttribute(new Float32Array(colors), 3)
            );
        });
    }

    /**
     * Create a colored glow effect when trail touches a star
     * Also permanently changes the star's color (painting effect)
     * @param {THREE.Mesh} star - Star mesh that was touched
     * @param {number} color - Trail color
     */
    createStarTouchLight(star, color) {
        // Permanently paint the star with trail color
        star.material.color.setHex(color);
        star.userData.painted = true;
        star.userData.paintedColor = color;

        // Create temporary point light for visual feedback
        const light = new THREE.PointLight(color, 0, 2.5); // Start at 0 intensity
        light.position.copy(star.position);

        this.starGroup.add(light);

        // Store light data for animation
        this.activeTouchLights.push({
            light: light,
            star: star,
            age: 0,
            fadeInTime: 0.1,   // Quick fade in
            holdTime: 0.2,      // Brief hold
            fadeOutTime: 1.0,   // Slow fade out
            maxIntensity: 2.5,
            lifetime: 0.1 + 0.2 + 1.0 // Total: 1.3s
        });
    }

    /**
     * Animate touch lights (fade in/hold/fade out)
     * @param {number} deltaTime - Time since last frame
     */
    animateTouchLights(deltaTime) {
        const lightsToRemove = [];

        this.activeTouchLights.forEach((touchLight, index) => {
            touchLight.age += deltaTime;

            if (touchLight.age >= touchLight.lifetime) {
                // Light expired
                lightsToRemove.push(index);
                this.starGroup.remove(touchLight.light);
                touchLight.light.dispose();
            } else {
                // Calculate intensity based on phase
                let intensity = 0;

                if (touchLight.age < touchLight.fadeInTime) {
                    // Fade in phase
                    const progress = touchLight.age / touchLight.fadeInTime;
                    intensity = progress * touchLight.maxIntensity;
                } else if (touchLight.age < touchLight.fadeInTime + touchLight.holdTime) {
                    // Hold phase
                    intensity = touchLight.maxIntensity;
                } else {
                    // Fade out phase
                    const fadeOutStart = touchLight.fadeInTime + touchLight.holdTime;
                    const fadeOutProgress = (touchLight.age - fadeOutStart) / touchLight.fadeOutTime;
                    intensity = touchLight.maxIntensity * (1.0 - fadeOutProgress);
                }

                touchLight.light.intensity = intensity;
            }
        });

        // Remove expired lights
        for (let i = lightsToRemove.length - 1; i >= 0; i--) {
            this.activeTouchLights.splice(lightsToRemove[i], 1);
        }
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.stars.forEach(star => {
            star.geometry.dispose();
            star.material.dispose();
        });

        this.trails.forEach(trail => {
            trail.line.geometry.dispose();
            trail.line.material.dispose();
        });

        this.activeTouchLights.forEach(touchLight => {
            this.starGroup.remove(touchLight.light);
            touchLight.light.dispose();
        });

        this.scene.remove(this.starGroup);
        this.stars = [];
        this.trails = [];
        this.activeTouchLights = [];
        console.log('🗑️  Starfield renderer disposed');
    }
}
