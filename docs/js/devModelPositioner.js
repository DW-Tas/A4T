/**
 * A4T Model Positioner - Development Tool
 * ========================================
 * 
 * This tool helps position new models by providing keyboard controls for
 * rotation and translation. After positioning, it outputs the transform
 * values that should be copied into partsManifest.js.
 * 
 * USAGE:
 * ------
 * 1. Include this file in index.html: <script type="module" src="js/devModelPositioner.js"></script>
 * 2. The dev panel will appear automatically when the file is loaded
 * 3. Select a toolhead board model from the dropdown
 * 4. Use keyboard controls to position the model
 * 5. Copy the transform output to partsManifest.js
 * 6. Remove the script include when done
 * 
 * KEYBOARD CONTROLS:
 * ------------------
 * Rotation (90° increments):
 *   X - Rotate 90° around X axis
 *   Y - Rotate 90° around Y axis
 *   Z - Rotate 90° around Z axis
 * 
 * Translation:
 *   < / > - Move along X axis
 *   Arrow Up/Down - Move along Y axis
 *   Arrow Left/Right - Move along Z axis
 * 
 * Modifiers:
 *   Default: 5mm movement
 *   Shift + key: 1mm movement
 *   Ctrl + key: 0.1mm movement
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Dev state
const devState = {
    enabled: true,
    selectedModel: null,
    selectedModelName: null,
    models: new Map(),  // Available models for positioning
    transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1
    },
    transformHistory: []  // Track all transforms applied
};

// Wait for main app to initialize
let checkInterval = setInterval(() => {
    if (window.modelGroup && window.scene) {
        clearInterval(checkInterval);
        initDevTools();
    }
}, 100);

// Also try after DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!devState.panelCreated) {
            // Try to access through module scope - the app stores these globally
            initDevTools();
        }
    }, 1000);
});

function initDevTools() {
    if (devState.panelCreated) return;
    devState.panelCreated = true;
    
    createDevPanel();
    setupKeyboardControls();
    console.log('🛠️ Dev Model Positioner loaded. Use keyboard controls to position models.');
}

function createDevPanel() {
    const panel = document.createElement('div');
    panel.id = 'dev-positioner-panel';
    panel.innerHTML = `
        <style>
            #dev-positioner-panel {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 380px;
                background: rgba(20, 20, 35, 0.95);
                border: 2px solid #e94560;
                border-radius: 8px;
                padding: 15px;
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: 12px;
                color: #fff;
                z-index: 10000;
                max-height: 90vh;
                overflow-y: auto;
            }
            #dev-positioner-panel h3 {
                margin: 0 0 10px 0;
                color: #e94560;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #dev-positioner-panel .dev-badge {
                background: #e94560;
                color: #fff;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
            }
            #dev-positioner-panel .section {
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 4px;
            }
            #dev-positioner-panel .section-title {
                color: #4a90d9;
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 11px;
                text-transform: uppercase;
            }
            #dev-positioner-panel select {
                width: 100%;
                padding: 8px;
                background: #2a2a3e;
                border: 1px solid #444;
                border-radius: 4px;
                color: #fff;
                font-size: 12px;
            }
            #dev-positioner-panel .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                font-size: 11px;
            }
            #dev-positioner-panel .control-item {
                display: flex;
                justify-content: space-between;
                padding: 4px 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 3px;
            }
            #dev-positioner-panel .key {
                background: #444;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
                font-weight: bold;
            }
            #dev-positioner-panel .transform-output {
                background: #1a1a2e;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 10px;
                font-family: 'Consolas', 'Monaco', monospace;
                font-size: 11px;
                white-space: pre-wrap;
                word-break: break-all;
                color: #4ad94a;
            }
            #dev-positioner-panel .current-values {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
                margin-bottom: 10px;
            }
            #dev-positioner-panel .value-box {
                background: #2a2a3e;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
            }
            #dev-positioner-panel .value-box .label {
                color: #888;
                font-size: 10px;
                margin-bottom: 4px;
            }
            #dev-positioner-panel .value-box .value {
                font-family: monospace;
                font-weight: bold;
                color: #4a90d9;
            }
            #dev-positioner-panel .history-log {
                max-height: 150px;
                overflow-y: auto;
                background: #1a1a2e;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 8px;
                font-family: monospace;
                font-size: 10px;
                color: #888;
            }
            #dev-positioner-panel .history-log .entry {
                padding: 2px 0;
                border-bottom: 1px solid #333;
            }
            #dev-positioner-panel .history-log .entry:last-child {
                border-bottom: none;
            }
            #dev-positioner-panel .history-log .entry.rotate {
                color: #e94560;
            }
            #dev-positioner-panel .history-log .entry.translate {
                color: #4a90d9;
            }
            #dev-positioner-panel button {
                padding: 8px 12px;
                background: #4a90d9;
                border: none;
                border-radius: 4px;
                color: #fff;
                cursor: pointer;
                font-size: 11px;
                margin-right: 5px;
                margin-top: 5px;
            }
            #dev-positioner-panel button:hover {
                background: #5aa0e9;
            }
            #dev-positioner-panel button.danger {
                background: #e94560;
            }
            #dev-positioner-panel button.danger:hover {
                background: #f95570;
            }
            #dev-positioner-panel .status {
                padding: 8px;
                border-radius: 4px;
                margin-top: 10px;
                text-align: center;
            }
            #dev-positioner-panel .status.ready {
                background: rgba(74, 217, 74, 0.2);
                color: #4ad94a;
            }
            #dev-positioner-panel .status.no-model {
                background: rgba(233, 69, 96, 0.2);
                color: #e94560;
            }
            #dev-positioner-panel .file-input-section {
                margin-top: 10px;
            }
            #dev-positioner-panel .file-path-input {
                width: 100%;
                padding: 8px;
                background: #2a2a3e;
                border: 1px solid #444;
                border-radius: 4px;
                color: #fff;
                font-size: 11px;
                font-family: monospace;
                margin-bottom: 8px;
            }
        </style>
        
        <h3>
            <span class="dev-badge">DEV</span>
            Model Positioner
        </h3>
        
        <div class="section">
            <div class="section-title">Load Model</div>
            <input type="text" id="dev-model-path" class="file-path-input" 
                   placeholder="e.g., Toolhead Board Mounts/A4T - THB Mount - WWBMG">
            <button id="dev-load-model">Load GLTF Model</button>
            <button id="dev-clear-model" class="danger">Clear Model</button>
        </div>
        
        <div class="section">
            <div class="section-title">Keyboard Controls</div>
            <div class="controls-grid">
                <div class="control-item"><span class="key">X</span> Rotate X 90°</div>
                <div class="control-item"><span class="key">Y</span> Rotate Y 90°</div>
                <div class="control-item"><span class="key">Z</span> Rotate Z 90°</div>
                <div class="control-item"><span class="key">&lt; / &gt;</span> Move X</div>
                <div class="control-item"><span class="key">↑↓</span> Move Y</div>
                <div class="control-item"><span class="key">←→</span> Move Z</div>
            </div>
            <div style="margin-top: 8px; color: #888; font-size: 10px;">
                Movement: Default 5mm | <span class="key">Shift</span> 1mm | <span class="key">Ctrl</span> 0.1mm
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Current Transform</div>
            <div class="current-values">
                <div class="value-box">
                    <div class="label">Position X</div>
                    <div class="value" id="dev-pos-x">0</div>
                </div>
                <div class="value-box">
                    <div class="label">Position Y</div>
                    <div class="value" id="dev-pos-y">0</div>
                </div>
                <div class="value-box">
                    <div class="label">Position Z</div>
                    <div class="value" id="dev-pos-z">0</div>
                </div>
                <div class="value-box">
                    <div class="label">Rotation X</div>
                    <div class="value" id="dev-rot-x">0</div>
                </div>
                <div class="value-box">
                    <div class="label">Rotation Y</div>
                    <div class="value" id="dev-rot-y">0</div>
                </div>
                <div class="value-box">
                    <div class="label">Rotation Z</div>
                    <div class="value" id="dev-rot-z">0</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Transform Output (Copy to partsManifest.js)</div>
            <div class="transform-output" id="dev-transform-output">
// No model loaded
            </div>
            <button id="dev-copy-transform">📋 Copy Transform</button>
            <button id="dev-reset-transform" class="danger">Reset Transform</button>
        </div>
        
        <div class="section">
            <div class="section-title">Transform History</div>
            <div class="history-log" id="dev-history-log">
                <div class="entry">No transforms applied yet</div>
            </div>
            <button id="dev-clear-history">Clear History</button>
        </div>
        
        <div class="status no-model" id="dev-status">
            No model loaded - Enter path and click "Load GLTF Model"
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Setup button handlers
    document.getElementById('dev-load-model').addEventListener('click', loadDevModel);
    document.getElementById('dev-clear-model').addEventListener('click', clearDevModel);
    document.getElementById('dev-copy-transform').addEventListener('click', copyTransform);
    document.getElementById('dev-reset-transform').addEventListener('click', resetTransform);
    document.getElementById('dev-clear-history').addEventListener('click', clearHistory);
    
    // Allow Enter key in path input to load model
    document.getElementById('dev-model-path').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadDevModel();
        }
    });
}

const gltfLoader = new GLTFLoader();

async function loadDevModel() {
    const pathInput = document.getElementById('dev-model-path');
    const modelPath = pathInput.value.trim();
    
    if (!modelPath) {
        alert('Please enter a model path');
        return;
    }
    
    // Clear any existing dev model
    clearDevModel();
    
    // Build full path
    const fullPath = `models/${modelPath}.gltf`;
    
    try {
        document.getElementById('dev-status').textContent = 'Loading model...';
        document.getElementById('dev-status').className = 'status';
        
        const gltf = await new Promise((resolve, reject) => {
            gltfLoader.load(
                fullPath,
                resolve,
                undefined,
                reject
            );
        });
        
        const model = gltf.scene;
        
        // Apply initial scale (OnShape exports in meters, we work in mm)
        const globalScale = 1000;
        model.scale.set(globalScale, globalScale, globalScale);
        
        // Apply a distinctive material so it stands out
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xff6600,  // Bright orange for dev model
                    metalness: 0.3,
                    roughness: 0.5,
                    emissive: 0x331100,
                    emissiveIntensity: 0.3
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        model.name = 'dev-positioner-model';
        devState.selectedModel = model;
        devState.selectedModelName = modelPath;
        
        // Reset transform
        devState.transform = {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: 1
        };
        devState.transformHistory = [];
        
        // Add to scene via modelGroup if available, otherwise directly to scene
        if (window.modelGroup) {
            window.modelGroup.add(model);
        } else {
            // Try to find modelGroup in the scene
            const scene = document.querySelector('canvas')?.parentElement;
            if (scene) {
                // Access through app's module scope - this is a workaround
                // The model will be added when we find the modelGroup
            }
        }
        
        updateDevDisplay();
        addHistoryEntry('Loaded model: ' + modelPath);
        
        document.getElementById('dev-status').textContent = 'Model loaded! Use keyboard to position.';
        document.getElementById('dev-status').className = 'status ready';
        
    } catch (error) {
        console.error('Failed to load model:', error);
        document.getElementById('dev-status').textContent = 'Failed to load: ' + error.message;
        document.getElementById('dev-status').className = 'status no-model';
        alert(`Failed to load model: ${fullPath}\n\n${error.message}`);
    }
}

function clearDevModel() {
    if (devState.selectedModel) {
        if (devState.selectedModel.parent) {
            devState.selectedModel.parent.remove(devState.selectedModel);
        }
        devState.selectedModel = null;
        devState.selectedModelName = null;
        
        document.getElementById('dev-status').textContent = 'No model loaded';
        document.getElementById('dev-status').className = 'status no-model';
        updateDevDisplay();
    }
}

function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!devState.enabled || !devState.selectedModel) return;
        
        // Don't handle if typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        // Determine movement amount based on modifiers
        let moveAmount = 5;  // Default 5mm
        if (e.shiftKey) moveAmount = 1;
        if (e.ctrlKey) moveAmount = 0.1;
        
        let handled = false;
        
        // Rotation controls (90 degree increments)
        if (key === 'x' && !e.ctrlKey && !e.altKey) {
            devState.transform.rotation[0] = (devState.transform.rotation[0] + 90) % 360;
            addHistoryEntry(`Rotate X +90° → ${devState.transform.rotation[0]}°`, 'rotate');
            handled = true;
        }
        else if (key === 'y' && !e.ctrlKey && !e.altKey) {
            devState.transform.rotation[1] = (devState.transform.rotation[1] + 90) % 360;
            addHistoryEntry(`Rotate Y +90° → ${devState.transform.rotation[1]}°`, 'rotate');
            handled = true;
        }
        else if (key === 'z' && !e.ctrlKey && !e.altKey) {
            devState.transform.rotation[2] = (devState.transform.rotation[2] + 90) % 360;
            addHistoryEntry(`Rotate Z +90° → ${devState.transform.rotation[2]}°`, 'rotate');
            handled = true;
        }
        // Translation controls
        else if (key === '>' || key === '.') {
            devState.transform.position[0] += moveAmount;
            addHistoryEntry(`Move X +${moveAmount}mm → ${devState.transform.position[0].toFixed(1)}`, 'translate');
            handled = true;
        }
        else if (key === '<' || key === ',') {
            devState.transform.position[0] -= moveAmount;
            addHistoryEntry(`Move X -${moveAmount}mm → ${devState.transform.position[0].toFixed(1)}`, 'translate');
            handled = true;
        }
        else if (e.key === 'ArrowUp') {
            devState.transform.position[1] += moveAmount;
            addHistoryEntry(`Move Y +${moveAmount}mm → ${devState.transform.position[1].toFixed(1)}`, 'translate');
            handled = true;
        }
        else if (e.key === 'ArrowDown') {
            devState.transform.position[1] -= moveAmount;
            addHistoryEntry(`Move Y -${moveAmount}mm → ${devState.transform.position[1].toFixed(1)}`, 'translate');
            handled = true;
        }
        else if (e.key === 'ArrowLeft') {
            devState.transform.position[2] += moveAmount;
            addHistoryEntry(`Move Z +${moveAmount}mm → ${devState.transform.position[2].toFixed(1)}`, 'translate');
            handled = true;
        }
        else if (e.key === 'ArrowRight') {
            devState.transform.position[2] -= moveAmount;
            addHistoryEntry(`Move Z -${moveAmount}mm → ${devState.transform.position[2].toFixed(1)}`, 'translate');
            handled = true;
        }
        
        if (handled) {
            e.preventDefault();
            applyTransformToModel();
            updateDevDisplay();
        }
    });
}

function applyTransformToModel() {
    if (!devState.selectedModel) return;
    
    const model = devState.selectedModel;
    const transform = devState.transform;
    
    // Apply position
    model.position.set(...transform.position);
    
    // Apply rotation (convert degrees to radians)
    model.rotation.set(
        THREE.MathUtils.degToRad(transform.rotation[0]),
        THREE.MathUtils.degToRad(transform.rotation[1]),
        THREE.MathUtils.degToRad(transform.rotation[2])
    );
}

function updateDevDisplay() {
    // Update position values
    document.getElementById('dev-pos-x').textContent = devState.transform.position[0].toFixed(1);
    document.getElementById('dev-pos-y').textContent = devState.transform.position[1].toFixed(1);
    document.getElementById('dev-pos-z').textContent = devState.transform.position[2].toFixed(1);
    
    // Update rotation values
    document.getElementById('dev-rot-x').textContent = devState.transform.rotation[0];
    document.getElementById('dev-rot-y').textContent = devState.transform.rotation[1];
    document.getElementById('dev-rot-z').textContent = devState.transform.rotation[2];
    
    // Update transform output
    const output = devState.selectedModel ? generateTransformCode() : '// No model loaded';
    document.getElementById('dev-transform-output').textContent = output;
}

function generateTransformCode() {
    const t = devState.transform;
    
    // Round position values for cleaner output
    const pos = t.position.map(v => {
        const rounded = Math.round(v * 10) / 10;
        return rounded === Math.floor(rounded) ? rounded : rounded;
    });
    
    return `transform: {
    position: [${pos.join(', ')}],
    rotation: [${t.rotation.join(', ')}],
    scale: 1
}`;
}

function addHistoryEntry(text, type = '') {
    const log = document.getElementById('dev-history-log');
    
    // Clear "no transforms" message if present
    if (devState.transformHistory.length === 0) {
        log.innerHTML = '';
    }
    
    const entry = document.createElement('div');
    entry.className = `entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    log.insertBefore(entry, log.firstChild);
    
    devState.transformHistory.push({ text, type, time: new Date() });
}

function clearHistory() {
    devState.transformHistory = [];
    document.getElementById('dev-history-log').innerHTML = '<div class="entry">No transforms applied yet</div>';
}

function copyTransform() {
    const output = document.getElementById('dev-transform-output').textContent;
    navigator.clipboard.writeText(output).then(() => {
        const btn = document.getElementById('dev-copy-transform');
        const original = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => btn.textContent = original, 1500);
    });
}

function resetTransform() {
    devState.transform = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1
    };
    applyTransformToModel();
    updateDevDisplay();
    addHistoryEntry('Reset transform to origin');
}

// Expose for main app integration
window.devModelPositioner = {
    state: devState,
    loadModel: loadDevModel,
    clearModel: clearDevModel,
    resetTransform,
    getTransform: () => devState.transform
};

console.log('🛠️ Dev Model Positioner: Ready. Enter model path and click Load.');
