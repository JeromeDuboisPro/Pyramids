/**
 * InputHandler
 *
 * Unified mouse + touch input handling with Three.js raycasting for sphere detection.
 * Manages click interactions, selection, and connection creation.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class InputHandler {
    /**
     * Create input handler
     * @param {HTMLCanvasElement} canvas - Game canvas
     * @param {THREE.Camera} camera - Three.js camera
     * @param {GameState} gameState - Game state
     * @param {SceneManager} sceneManager - Scene manager for visual feedback
     */
    constructor(canvas, camera, gameState, sceneManager) {
        this.canvas = canvas;
        this.camera = camera;
        this.gameState = gameState;
        this.sceneManager = sceneManager;

        // Raycaster for 3D picking
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        // Bind event handlers
        this.onPointerDown = this.onPointerDown.bind(this);

        // Setup event listeners
        this.setupEventListeners();

        console.log('✅ Input handler initialized');
    }

    /**
     * Setup event listeners for mouse and touch
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onPointerDown);

        // Touch events
        this.canvas.addEventListener('touchstart', this.onPointerDown, { passive: false });

        console.log('🖱️  Mouse + touch events registered');
    }

    /**
     * Handle pointer down (mouse or touch)
     * @param {MouseEvent|TouchEvent} event
     */
    onPointerDown(event) {
        // Prevent default touch behavior (page scrolling)
        if (event.type === 'touchstart') {
            event.preventDefault();
        }

        // Get normalized pointer position
        const pointerPos = this.getPointerPosition(event);
        this.pointer.x = (pointerPos.x / this.canvas.clientWidth) * 2 - 1;
        this.pointer.y = -(pointerPos.y / this.canvas.clientHeight) * 2 + 1;

        // Raycast to find clicked sphere
        const clickedSphereId = this.getSphereAtPointer();

        if (clickedSphereId) {
            this.handleSphereClick(clickedSphereId);
        } else {
            this.handleEmptyClick();
        }
    }

    /**
     * Get pointer position from mouse or touch event
     * @param {MouseEvent|TouchEvent} event
     * @returns {{x: number, y: number}}
     */
    getPointerPosition(event) {
        if (event.touches && event.touches.length > 0) {
            // Touch event
            const touch = event.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        } else {
            // Mouse event
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        }
    }

    /**
     * Use raycasting to find sphere at pointer position
     * @returns {string|null} Sphere ID or null
     */
    getSphereAtPointer() {
        // Update raycaster
        this.raycaster.setFromCamera(this.pointer, this.camera);

        // Get all sphere meshes
        const sphereMeshes = this.sceneManager.sphereMeshes;

        // Raycast against sphere core meshes (first child of each group)
        const intersectableObjects = sphereMeshes.map(group => group.children[0]);

        const intersects = this.raycaster.intersectObjects(intersectableObjects, false);

        if (intersects.length > 0) {
            // Get the sphere group from the intersected mesh
            const intersectedMesh = intersects[0].object;
            const sphereGroup = intersectedMesh.parent;

            // Return sphere ID from group userData
            return sphereGroup.userData.sphereId;
        }

        return null;
    }

    /**
     * Handle click on a sphere
     * @param {string} sphereId - Clicked sphere ID
     */
    handleSphereClick(sphereId) {
        const clickedSphere = this.gameState.getSphere(sphereId);
        if (!clickedSphere) return;

        const selectedSphere = this.gameState.getSelectedSphere();

        if (this.gameState.isPlayerSphere(sphereId)) {
            // Clicked a player sphere → SELECT it
            if (selectedSphere && selectedSphere.id === sphereId) {
                // Clicking same sphere → DESELECT
                this.deselectSphere();
            } else {
                // Select this sphere
                this.selectSphere(sphereId);
            }
        } else {
            // Clicked non-player sphere
            if (selectedSphere) {
                // Have selection → CREATE CONNECTION
                this.createConnection(selectedSphere.id, sphereId);
            } else {
                // No selection → Can't interact with non-player spheres
                console.log(`ℹ️  Cannot select non-player sphere: ${sphereId}`);
            }
        }
    }

    /**
     * Handle click on empty space
     */
    handleEmptyClick() {
        // Deselect if anything is selected
        if (this.gameState.getSelectedSphere()) {
            this.deselectSphere();
        }
    }

    /**
     * Select a sphere (visual + state)
     * @param {string} sphereId
     */
    selectSphere(sphereId) {
        // Deselect previous selection first
        const prevSelected = this.gameState.getSelectedSphere();
        if (prevSelected) {
            this.removeSelectionVisual(prevSelected.id);
        }

        // Update game state
        this.gameState.selectSphere(sphereId);

        // Add visual feedback
        this.addSelectionVisual(sphereId);

        console.log(`✨ Selected: ${sphereId}`);
    }

    /**
     * Deselect current sphere
     */
    deselectSphere() {
        const selectedSphere = this.gameState.getSelectedSphere();
        if (!selectedSphere) return;

        // Remove visual feedback
        this.removeSelectionVisual(selectedSphere.id);

        // Update game state
        this.gameState.deselectSphere();

        console.log('⭕ Deselected');
    }

    /**
     * Create connection from selected sphere to target
     * @param {string} sourceId
     * @param {string} targetId
     */
    createConnection(sourceId, targetId) {
        const success = this.gameState.createConnection(sourceId, targetId);

        if (success) {
            console.log(`🔗 Connection created: ${sourceId} → ${targetId}`);

            // Phase 1.4 will add visual connection stream here
            // For now, just log to console

            // Keep source sphere selected (can switch targets)
        }
    }

    /**
     * Add visual selection outline to sphere
     * @param {string} sphereId
     */
    addSelectionVisual(sphereId) {
        const sphere = this.gameState.getSphere(sphereId);
        if (!sphere || !sphere.mesh) return;

        this.sceneManager.sphereRenderer.addSelectionOutline(sphere.mesh);
    }

    /**
     * Remove visual selection outline from sphere
     * @param {string} sphereId
     */
    removeSelectionVisual(sphereId) {
        const sphere = this.gameState.getSphere(sphereId);
        if (!sphere || !sphere.mesh) return;

        this.sceneManager.sphereRenderer.removeSelectionOutline(sphere.mesh);
    }

    /**
     * Cleanup event listeners
     */
    dispose() {
        this.canvas.removeEventListener('mousedown', this.onPointerDown);
        this.canvas.removeEventListener('touchstart', this.onPointerDown);

        console.log('🗑️  Input handler disposed');
    }
}
