/**
 * SceneManager
 *
 * Manages the Three.js scene, camera, renderer, and lighting.
 * Handles window resizing and provides rendering API.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { SphereRenderer } from './SphereRenderer.js';
import { StreamRenderer } from './StreamRenderer.js';
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
        this.renderer.toneMappingExposure = 1.5; // Increase exposure for brighter glow

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
     * Update sphere animations (subtle pulsing)
     * @param {number} deltaTime - Time since last frame
     */
    updateSphereAnimations(deltaTime) {
        const time = performance.now() * 0.001; // Convert to seconds

        this.sphereMeshes.forEach((sphereGroup, index) => {
            // Subtle pulse effect on sphere itself
            const sphereMesh = sphereGroup.children[0]; // First child is the sphere mesh
            if (sphereMesh && sphereMesh.isMesh) {
                const pulseSpeed = 1.0 + index * 0.1; // Slightly different speeds
                const pulseAmount = 0.03; // 3% size variation (subtle)
                const scale = 1.0 + Math.sin(time * pulseSpeed) * pulseAmount;
                sphereMesh.scale.setScalar(scale);
            }

            // Animate halo glow (breathing effect)
            sphereGroup.children.forEach(child => {
                if (child.userData.isHalo) {
                    const pulseSpeed = 1.5;
                    const opacityBase = 0.3;
                    const opacityVariation = 0.15;
                    child.material.opacity = opacityBase + Math.sin(time * pulseSpeed) * opacityVariation;
                }
            });

            // Subtle rotation (very slow)
            sphereGroup.rotation.z += deltaTime * 0.1;
        });

        // Animate connection streams
        this.streamRenderer.animate(deltaTime);
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
     * Update sphere colors based on ownership
     * Color represents owner (player/enemy/neutral)
     * Energy level shown via tooltip, not color
     * @param {GameState} gameState - Current game state
     */
    updateSphereColors(gameState) {
        gameState.getAllSpheres().forEach(sphere => {
            if (sphere.mesh) {
                // Get color based on owner
                const color = sphere.getColor();

                // Update sphere visual
                this.sphereRenderer.updateSphereColor(sphere.mesh, color, 1.0);
            }
        });
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
