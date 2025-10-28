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

        // Tooltip
        this.tooltip = document.getElementById('sphere-tooltip');
        this.hoveredSphereId = null;

        // Camera controls state
        this.isPanning = false;
        this.isRotating = false;
        this.previousPanPosition = { x: 0, y: 0 };
        this.previousRotatePosition = { x: 0, y: 0 };
        this.zoomLevel = 1.0;  // 1.0 = default view
        this.minZoom = 0.5;    // Can zoom out to 2x area
        this.maxZoom = 3.0;    // Can zoom in to 3x magnification

        // 3D rotation state
        this.rotationPivot = new THREE.Vector3(0, 0, 0); // Pivot point for rotation
        this.cameraDistance = 20; // Distance from pivot

        // Bind event handlers
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onWheel = this.onWheel.bind(this);

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
        this.canvas.addEventListener('mousemove', this.onPointerMove);
        this.canvas.addEventListener('mouseup', this.onPointerUp);
        this.canvas.addEventListener('wheel', this.onWheel, { passive: false });

        // Prevent context menu on right-click (we use it for rotation)
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch events
        this.canvas.addEventListener('touchstart', this.onPointerDown, { passive: false });

        console.log('🖱️  Mouse + touch + camera controls registered');
    }

    /**
     * Handle pointer down (mouse or touch)
     * @param {MouseEvent|TouchEvent} event
     */
    onPointerDown(event) {
        // DEBUG: Log all button presses
        console.log(`🖱️ Button pressed: ${event.button} (0=left, 1=middle, 2=right)`);

        // Prevent default touch behavior (page scrolling)
        if (event.type === 'touchstart') {
            event.preventDefault();
        }

        // Check for middle mouse button (button = 1) for panning
        if (event.button === 1) {
            console.log('🖱️ Starting PAN mode (middle button)');
            event.preventDefault();
            this.isPanning = true;
            this.previousPanPosition = {
                x: event.clientX,
                y: event.clientY
            };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // Check for right mouse button (button = 2) for rotation
        if (event.button === 2) {
            console.log('🖱️ Starting ROTATE mode (right button)');
            event.preventDefault();
            this.isRotating = true;
            this.previousRotatePosition = {
                x: event.clientX,
                y: event.clientY
            };
            this.canvas.style.cursor = 'grab';
            return;
        }

        // Left mouse button (button = 0) for sphere interaction
        if (event.button !== 0 && event.type !== 'touchstart') {
            return;
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

            // Deselect source sphere after connection (cleaner UX)
            this.deselectSphere();
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
     * Handle pointer move (for hover tooltip and panning)
     * @param {MouseEvent} event
     */
    onPointerMove(event) {
        // Handle 3D rotation around pivot point (check RIGHT CLICK first)
        if (this.isRotating) {
            console.log('🔄 ROTATING camera...');
            const deltaX = event.clientX - this.previousRotatePosition.x;
            const deltaY = event.clientY - this.previousRotatePosition.y;

            this.previousRotatePosition = {
                x: event.clientX,
                y: event.clientY
            };

            // Calculate rotation pivot (intersection of screen center with z=0 plane)
            // Use current camera position's XY as pivot (where camera is looking)
            const currentLookAt = new THREE.Vector3(
                this.camera.position.x,
                this.camera.position.y,
                0
            );
            this.rotationPivot.copy(currentLookAt);

            // Rotate camera around pivot point
            const rotateSpeed = 0.005;

            // Get vector from pivot to camera
            const toPivotVector = new THREE.Vector3()
                .subVectors(this.camera.position, this.rotationPivot);

            // Horizontal rotation (around Z axis through pivot)
            const angleH = deltaX * rotateSpeed;
            const quaternionH = new THREE.Quaternion()
                .setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angleH);
            toPivotVector.applyQuaternion(quaternionH);

            // Vertical rotation (around right vector)
            const angleV = deltaY * rotateSpeed;
            const right = new THREE.Vector3(1, 0, 0)
                .applyQuaternion(quaternionH);
            const quaternionV = new THREE.Quaternion()
                .setFromAxisAngle(right, -angleV);
            toPivotVector.applyQuaternion(quaternionV);

            // Update camera position relative to pivot
            this.camera.position.copy(this.rotationPivot).add(toPivotVector);

            // Keep camera looking at pivot
            this.camera.lookAt(this.rotationPivot);
            this.camera.updateProjectionMatrix();

            return; // Skip tooltip while rotating
        }

        // Handle panning if middle button is held
        if (this.isPanning) {
            console.log('↔️ PANNING camera...');
            const deltaX = event.clientX - this.previousPanPosition.x;
            const deltaY = event.clientY - this.previousPanPosition.y;

            this.previousPanPosition = {
                x: event.clientX,
                y: event.clientY
            };

            // Pan camera (scale by zoom level and viewport size)
            const panSpeed = 0.02 / this.zoomLevel;
            this.camera.position.x -= deltaX * panSpeed;
            this.camera.position.y += deltaY * panSpeed;

            return; // Skip tooltip while panning
        }

        // Get pointer position
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.pointer.x = (x / this.canvas.clientWidth) * 2 - 1;
        this.pointer.y = -(y / this.canvas.clientHeight) * 2 + 1;

        // Raycast to find hovered sphere
        const hoveredSphereId = this.getSphereAtPointer();

        if (hoveredSphereId) {
            // Show tooltip for hovered sphere
            this.hoveredSphereId = hoveredSphereId;
            this.showTooltip(hoveredSphereId, event.clientX, event.clientY);
        } else {
            // Hide tooltip
            this.hoveredSphereId = null;
            this.hideTooltip();
        }
    }

    /**
     * Show tooltip for sphere
     * @param {string} sphereId
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     */
    showTooltip(sphereId, x, y) {
        const sphere = this.gameState.getSphere(sphereId);
        if (!sphere) return;

        // Update tooltip content
        const tooltipId = this.tooltip.querySelector('.tooltip-id');
        const tooltipOwner = this.tooltip.querySelector('.tooltip-owner');
        const tooltipEnergy = this.tooltip.querySelector('.tooltip-energy');
        const energyFill = this.tooltip.querySelector('.energy-fill');

        tooltipId.textContent = sphere.id;

        // Owner with color
        const ownerColors = {
            'player': '#FF6B35',
            'enemy': '#00D9FF',
            'neutral': '#808080'
        };
        tooltipOwner.innerHTML = `<span style="color: ${ownerColors[sphere.owner]}">● ${sphere.owner.toUpperCase()}</span>`;

        // Energy
        tooltipEnergy.textContent = `Energy: ${sphere.energy.toFixed(1)}%`;

        // Energy bar color based on owner
        energyFill.style.width = `${sphere.energy}%`;
        energyFill.style.backgroundColor = ownerColors[sphere.owner];

        // Position tooltip (offset from cursor)
        this.tooltip.style.left = `${x + 15}px`;
        this.tooltip.style.top = `${y + 15}px`;

        // Show tooltip
        this.tooltip.classList.add('visible');
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }

    /**
     * Handle pointer up (end panning/rotating)
     * @param {MouseEvent} event
     */
    onPointerUp(event) {
        // Middle button released
        if (event.button === 1) {
            this.isPanning = false;
            this.canvas.style.cursor = 'default';
            console.log('⏹️ Panning stopped');
        }
        // Right button released
        if (event.button === 2) {
            this.isRotating = false;
            this.canvas.style.cursor = 'default';
            console.log('⏹️ Rotation stopped');
        }
    }

    /**
     * Handle mouse wheel (zooming)
     * @param {WheelEvent} event
     */
    onWheel(event) {
        event.preventDefault();

        // Zoom speed
        const zoomSpeed = 0.001;
        const delta = -event.deltaY * zoomSpeed;

        // Update zoom level
        this.zoomLevel *= (1 + delta);
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel));

        // Update orthographic camera frustum
        const aspect = window.innerWidth / window.innerHeight;
        const baseViewSize = 10; // Base view size from SceneManager
        const viewSize = baseViewSize / this.zoomLevel;

        this.camera.left = -viewSize * aspect;
        this.camera.right = viewSize * aspect;
        this.camera.top = viewSize;
        this.camera.bottom = -viewSize;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Cleanup event listeners
     */
    dispose() {
        this.canvas.removeEventListener('mousedown', this.onPointerDown);
        this.canvas.removeEventListener('mousemove', this.onPointerMove);
        this.canvas.removeEventListener('mouseup', this.onPointerUp);
        this.canvas.removeEventListener('wheel', this.onWheel);
        this.canvas.removeEventListener('touchstart', this.onPointerDown);

        console.log('🗑️  Input handler disposed');
    }
}
