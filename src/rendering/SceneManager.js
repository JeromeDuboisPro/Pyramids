/**
 * SceneManager
 *
 * Manages the Three.js scene, camera, renderer, and lighting.
 * Handles window resizing and provides rendering API.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { SphereRenderer } from './SphereRenderer.js';
import { StreamRenderer } from './StreamRenderer.js';
import { StarfieldRenderer } from './StarfieldRenderer.js';
import { CONFIG } from '../main.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;

        // Initialize Three.js components
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();

        // Sphere renderer
        this.sphereRenderer = new SphereRenderer(this.scene);

        // Stream renderer for connections
        this.streamRenderer = new StreamRenderer(this.scene);

        // Starfield background
        this.starfieldRenderer = new StarfieldRenderer(this.scene);
        this.starfieldRenderer.createStarfield(150);

        // Store sphere meshes for animation
        this.sphereMeshes = [];
    }

    /**
     * Initialize WebGL renderer
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance

        // Enable tone mapping for emissive materials to glow properly
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0; // Standard exposure (reduced from 1.5 for iGPU compatibility)

        // Set background color (deep space)
        this.renderer.setClearColor(CONFIG.BACKGROUND_COLOR);

        console.log('✅ Renderer initialized');
    }

    /**
     * Initialize scene
     */
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(CONFIG.BACKGROUND_COLOR, 0.01); // Subtle depth fog

        console.log('✅ Scene initialized');
    }

    /**
     * Initialize camera (orthographic for clean 2D look with 3D objects)
     */
    initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        const viewSize = 10; // World units visible in viewport

        this.camera = new THREE.OrthographicCamera(
            -viewSize * aspect, // left
            viewSize * aspect,  // right
            viewSize,           // top
            -viewSize,          // bottom
            0.1,                // near
            1000                // far
        );

        // Position camera for top-down view
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);

        console.log('✅ Camera initialized (orthographic top-down)');
    }

    /**
     * Initialize lighting
     */
    initLights() {
        // Ambient light (low intensity for dark aesthetic)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        // Point lights will be added at each sphere position
        // (handled by SphereRenderer for per-sphere glow)

        console.log('✅ Lighting initialized');
    }


    /**
     * Create visual spheres from GameState
     * @param {GameState} gameState - Game state containing sphere entities
     */
    createSpheresFromGameState(gameState) {
        // Clear existing spheres
        this.sphereMeshes = [];

        // Create visual sphere for each game state sphere
        gameState.getAllSpheres().forEach(sphereEntity => {
            const color = sphereEntity.getColor();

            const sphereMesh = this.sphereRenderer.createSphere(
                sphereEntity.position,
                color,
                sphereEntity.id
            );

            // Link mesh to entity
            sphereEntity.mesh = sphereMesh;
            this.sphereMeshes.push(sphereMesh);
        });

        console.log(`✅ Created ${this.sphereMeshes.length} visual spheres from game state`);
    }

    /**
     * Create test spheres for Phase 1 (7 spheres in circular pattern)
     * @deprecated Use createSpheresFromGameState instead
     */
    createTestSpheres() {
        const sphereCount = 7;
        const radius = 4; // Radius of circle arrangement

        // Center sphere (player-owned)
        const centerSphere = this.sphereRenderer.createSphere(
            new THREE.Vector3(0, 0, 0),
            CONFIG.PLAYER_COLOR,
            'center'
        );
        this.sphereMeshes.push(centerSphere);

        // Surrounding spheres (neutral) in circular pattern
        for (let i = 0; i < sphereCount - 1; i++) {
            const angle = (i / (sphereCount - 1)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const sphere = this.sphereRenderer.createSphere(
                new THREE.Vector3(x, y, 0),
                CONFIG.NEUTRAL_COLOR,
                `sphere-${i}`
            );
            this.sphereMeshes.push(sphere);
        }

        console.log(`✅ Created ${sphereCount} test spheres`);
    }

    /**
     * Update sphere animations based on energy level
     * Rotation speed tied to energy: 0% = no rotation, 100% = full rotation
     * @param {number} deltaTime - Time since last frame
     */
    updateSphereAnimations(deltaTime) {
        const time = performance.now() * 0.001; // Convert to seconds

        this.sphereMeshes.forEach((sphereGroup, index) => {
            sphereGroup.children.forEach(child => {
                // Inner cellular plasma core - rotation based on energy
                if (child.userData.isCore) {
                    const baseRotSpeed = child.userData.baseRotationSpeed || 0.5;
                    const currentRotSpeed = child.userData.currentRotationSpeed || 0.0;

                    // Check for impact boost multiplier (set by StreamRenderer)
                    const speedMultiplier = child.userData.rotationSpeedMultiplier || 1.0;
                    const finalRotSpeed = currentRotSpeed * speedMultiplier;

                    // Rotate core (energy determines speed, boost multiplies it)
                    child.rotation.y += finalRotSpeed * deltaTime;
                    child.rotation.x += finalRotSpeed * deltaTime * 0.6;

                    // Subtle emissive pulsing for visual life
                    const pulseSpeed = 1.2;
                    const basePulse = child.material.emissiveIntensity;
                    const pulseVariation = 0.3;
                    child.material.emissiveIntensity = basePulse + Math.sin(time * pulseSpeed) * pulseVariation;
                }

                // Animate selection indicators (multi-layer pulsing)
                if (child.userData.isSelectionHalo && child.userData.isPulsing) {
                    const pulseType = child.userData.pulseType || 'outer';

                    if (pulseType === 'outer') {
                        // Outer ring: Fast aggressive pulse
                        const pulseSpeed = 3.0;
                        const opacityBase = 0.8;
                        const opacityVariation = 0.2;
                        child.material.opacity = opacityBase + Math.sin(time * pulseSpeed) * opacityVariation;
                    } else if (pulseType === 'inner') {
                        // Inner ring: Slower counter-pulse
                        const pulseSpeed = 2.0;
                        const opacityBase = 0.6;
                        const opacityVariation = 0.3;
                        child.material.opacity = opacityBase + Math.sin(time * pulseSpeed + Math.PI) * opacityVariation;
                    } else if (pulseType === 'sphere') {
                        // Glow sphere: Gentle scale pulse
                        const pulseSpeed = 1.5;
                        const scaleBase = 1.0;
                        const scaleVariation = 0.08;
                        const scale = scaleBase + Math.sin(time * pulseSpeed) * scaleVariation;
                        child.scale.setScalar(scale);

                        // Also pulse opacity
                        const opacityBase = 0.15;
                        const opacityVariation = 0.08;
                        child.material.opacity = opacityBase + Math.sin(time * pulseSpeed) * opacityVariation;
                    }
                }

                // Pulse point light intensity
                if (child.isLight) {
                    const pulseSpeed = 1.2;
                    const minIntensity = 0.8;
                    const maxIntensity = 2.0;
                    child.intensity = minIntensity + (maxIntensity - minIntensity) *
                                    (0.5 + 0.5 * Math.sin(time * pulseSpeed));
                }
            });
        });

        // Animate connection streams
        this.streamRenderer.animate(deltaTime);

        // Animate starfield
        this.starfieldRenderer.animate(deltaTime);
    }

    /**
     * Update connection streams based on game state
     * @param {GameState} gameState - Current game state
     */
    updateConnectionStreams(gameState) {
        const activeConnections = gameState.getActiveConnections();
        this.streamRenderer.updateStreams(activeConnections);
    }

    /**
     * Update sphere colors based on ownership and capture progress
     * Shows interpolated color during capture for visual feedback
     * @param {GameState} gameState - Current game state
     */
    updateSphereColors(gameState) {
        gameState.getAllSpheres().forEach(sphere => {
            if (sphere.mesh) {
                // Get interpolated color showing capture progress
                const color = sphere.getInterpolatedColor();

                // Update sphere visual
                this.sphereRenderer.updateSphereColor(sphere.mesh, color, 1.0);

                // Update rotation speed based on energy level
                this.updateSphereRotation(sphere.mesh, sphere.energy);
            }
        });
    }

    /**
     * Update sphere rotation speed based on energy level
     * 0% energy = no rotation, 100% energy = full rotation
     * @param {THREE.Group} sphereGroup - Sphere mesh group
     * @param {number} energy - Energy level (0-100)
     */
    updateSphereRotation(sphereGroup, energy) {
        const coreMesh = sphereGroup.children.find(child => child.userData.isCore);
        if (!coreMesh) return;

        const baseRotSpeed = coreMesh.userData.baseRotationSpeed || 0.5;

        // Energy percentage (0.0 to 1.0)
        const energyPercent = Math.max(0, Math.min(100, energy)) / 100;

        // Rotation speed scales with energy
        const newRotSpeed = baseRotSpeed * energyPercent;

        coreMesh.userData.currentRotationSpeed = newRotSpeed;
    }

    /**
     * Update all sphere colors (for theme switching)
     */
    updateAllSphereColors() {
        this.sphereMeshes.forEach((sphereGroup, index) => {
            // Center sphere = player, others = neutral
            const color = index === 0 ? CONFIG.PLAYER_COLOR : CONFIG.NEUTRAL_COLOR;
            this.sphereRenderer.updateSphereColor(sphereGroup, color, 1.0);
        });

        console.log('🎨 Updated all sphere colors');
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const viewSize = 10;

        // Update camera
        this.camera.left = -viewSize * aspect;
        this.camera.right = viewSize * aspect;
        this.camera.top = viewSize;
        this.camera.bottom = -viewSize;
        this.camera.updateProjectionMatrix();

        // Update renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        console.log('📐 Window resized');
    }

    /**
     * Cleanup resources
     */
    dispose() {
        this.sphereMeshes.forEach(mesh => {
            mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });

        this.renderer.dispose();
        console.log('🗑️  Scene resources disposed');
    }
}
