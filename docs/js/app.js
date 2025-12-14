/**
 * A4T Toolhead Configurator
 * Main application script
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { partsManifest } from './partsManifest.js';

// ============================================
// Application State
// ============================================
const state = {
    config: {
        carriage: 'xol-carriage',
        hotend: 'dragon',
        extruder: 'wwbmg',
        wwbmgSensors: 'no-sensors',
        wwbmgIdler: 'smooth-bearing',
        toolheadBoard: 'none',
        filamentCutter: 'none',
        hexCowl: false
    },
    loadedModels: new Map(),  // Cache of loaded GLTF models
    activeModels: new Map(),  // Currently displayed models
    exploded: false,
    wireframe: false,
    initialLoad: true  // Track if this is the first load
};

// ============================================
// Three.js Setup
// ============================================
let scene, camera, renderer, controls;
let modelGroup;  // Group to hold all part models

function initThreeJS() {
    const container = document.getElementById('viewer-3d');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Camera - set up for mm scale (parts are ~100mm)
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    camera.position.set(200, 150, 200);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Lighting
    setupLighting();
    
    // Model group
    modelGroup = new THREE.Group();
    scene.add(modelGroup);
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Start render loop
    animate();
    
    // Hide loading overlay
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 500);
}

function setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    
    // Key light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(50, 100, 50);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-50, 50, -50);
    scene.add(fillLight);
    
    // Rim light
    const rimLight = new THREE.DirectionalLight(0xe94560, 0.2);
    rimLight.position.set(0, -50, -100);
    scene.add(rimLight);
}

function onWindowResize() {
    const container = document.getElementById('viewer-3d');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    
    // Render main scene
    renderer.render(scene, camera);
}

// ============================================
// Model Loading
// ============================================
const gltfLoader = new GLTFLoader();

/**
 * Deep clone a Three.js object, including materials and geometries
 */
function deepCloneModel(source) {
    const clone = source.clone(true);
    
    // Clone materials to avoid shared state issues
    clone.traverse((child) => {
        if (child.isMesh) {
            // Clone the material so each instance has its own
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => m.clone());
                } else {
                    child.material = child.material.clone();
                }
            }
        }
    });
    
    return clone;
}

async function loadModel(partId, partData) {
    // Build file path: basePath + file + extension
    const filePath = partsManifest.basePath + partData.file + '.' + partsManifest.fileExtension;
    
    // Check cache first
    if (state.loadedModels.has(filePath)) {
        return deepCloneModel(state.loadedModels.get(filePath));
    }
    
    return new Promise((resolve, reject) => {
        gltfLoader.load(
            filePath,
            (gltf) => {
                const model = gltf.scene;
                
                // Store in cache (use deep clone to prevent shared state issues)
                state.loadedModels.set(filePath, deepCloneModel(model));
                
                resolve(model);
            },
            undefined, // Progress callback not needed
            (error) => {
                console.warn(`Failed to load model: ${filePath}`, error);
                resolve(null); // Return null - we'll skip missing models
            }
        );
    });
}

function applyTransform(model, transform) {
    if (!transform) return;
    
    // Position (convert from mm if needed)
    if (transform.position) {
        model.position.set(...transform.position);
    }
    
    // Rotation (convert degrees to radians)
    if (transform.rotation) {
        model.rotation.set(
            THREE.MathUtils.degToRad(transform.rotation[0]),
            THREE.MathUtils.degToRad(transform.rotation[1]),
            THREE.MathUtils.degToRad(transform.rotation[2])
        );
    }
    
    // Scale - apply global scale first, then part-specific scale
    const globalScale = partsManifest.globalScale || 1;
    const partScale = transform.scale || 1;
    const finalScale = globalScale * partScale;
    model.scale.set(finalScale, finalScale, finalScale);
}

function applyMaterial(model, color, opacity = 1.0) {
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.1,
                roughness: 0.7,
                transparent: opacity < 1.0,
                opacity: opacity
            });
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

// ============================================
// Configuration Logic
// ============================================

/**
 * Check if a part variant matches the current configuration
 */
function partMatchesConfig(partData, config) {
    // Check required exact matches
    if (partData.requires) {
        for (const [key, value] of Object.entries(partData.requires)) {
            if (config[key] !== value) {
                return false;
            }
        }
    }
    
    // Check requiresAny (for each key, at least one value must match - ALL keys must pass)
    if (partData.requiresAny) {
        for (const [key, values] of Object.entries(partData.requiresAny)) {
            if (!values.includes(config[key])) {
                return false;
            }
        }
    }
    
    // Check exclusions
    if (partData.excludeIf) {
        for (const [key, values] of Object.entries(partData.excludeIf)) {
            if (values.includes(config[key])) {
                return false;
            }
        }
    }
    
    // Check always-include parts
    if (partData.always) {
        return true;
    }
    
    return true;
}

/**
 * Get all parts that match the current configuration
 */
function getMatchingParts(config) {
    const matching = [];
    
    // Check if current extruder has no extruder adapter (like Sherpa Mini)
    const extruderRule = partsManifest.compatibility[config.extruder];
    const skipExtruderAdapterForExtruder = extruderRule?.noExtruderAdapter === true;
    
    // Check if current hotend has no extruder adapter (like UHF)
    const hotendRule = partsManifest.compatibility[config.hotend];
    const skipExtruderAdapterForHotend = hotendRule?.noExtruderAdapter === true;
    
    const skipExtruderAdapter = skipExtruderAdapterForExtruder || skipExtruderAdapterForHotend;
    
    for (const [categoryId, category] of Object.entries(partsManifest.parts)) {
        // Skip extruder adapters for extruders/hotends that don't use them
        if (skipExtruderAdapter && categoryId === 'extruderAdapters') {
            continue;
        }
        
        for (const [partId, partData] of Object.entries(category.variants)) {
            const matches = partMatchesConfig(partData, config);
            if (matches) {
                matching.push({
                    id: partId,
                    category: categoryId,
                    categoryLabel: category.category,
                    ...partData
                });
            }
        }
    }
    
    return matching;
}

/**
 * Get STL-only parts that match the current configuration (not rendered, just for download)
 */
function getMatchingStlOnlyParts(config) {
    const matching = [];
    
    if (!partsManifest.stlOnlyParts) return matching;
    
    for (const [categoryId, category] of Object.entries(partsManifest.stlOnlyParts)) {
        for (const [partId, partData] of Object.entries(category.variants)) {
            if (partMatchesConfig(partData, config)) {
                matching.push({
                    id: partId,
                    category: categoryId,
                    categoryLabel: category.category,
                    ...partData
                });
            }
        }
    }
    
    return matching;
}

/**
 * Check compatibility and return warnings
 */
function checkCompatibility(config) {
    const warnings = [];
    
    // Check specific compatibility rules
    const extruderRule = partsManifest.compatibility[config.extruder];
    if (extruderRule?.incompatibleWith) {
        for (const [key, values] of Object.entries(extruderRule.incompatibleWith)) {
            if (values.includes(config[key])) {
                warnings.push(extruderRule.warningMessage);
            }
        }
    }
    
    return warnings;
}

// ============================================
// UI Updates
// ============================================

/**
 * Update disabled state of options based on compatibility rules
 */
function updateToolheadBoardNote(config) {
    const tapNote = document.getElementById('toolhead-note-tap');
    const xolNote = document.getElementById('toolhead-note-xol');
    
    if (config.carriage === 'xol-carriage') {
        tapNote.style.display = 'none';
        xolNote.style.display = 'block';
    } else {
        tapNote.style.display = 'block';
        xolNote.style.display = 'none';
    }
}

function updateDisabledOptions(config) {
    // Update the toolhead board section note based on carriage
    updateToolheadBoardNote(config);
    
    // Define incompatibility rules
    const uhfHotends = ['dragon-uhf', 'dragon-ace-mze', 'dragon-ace-volcano-mze', 'rapido-uhf'];
    const uhfCompatibleExtruders = ['wwbmg', 'wwg2', 'orbiter'];
    const isUHF = uhfHotends.includes(config.hotend);
    const isCrossbow = config.filamentCutter === 'crossbow';
    const isSherpaMini = config.extruder === 'sherpa-mini';
    
    // Get all option inputs
    const allInputs = document.querySelectorAll('.option-group input[type="radio"], .option-group input[type="checkbox"]');
    
    allInputs.forEach(input => {
        const label = input.closest('.option');
        const inputName = input.name;
        const inputValue = input.value;
        
        let shouldDisable = false;
        let reason = '';
        
        // Rule 1: Sherpa-mini is disabled if crossbow is selected or UHF hotend is selected
        if (inputName === 'extruder' && inputValue === 'sherpa-mini') {
            if (isCrossbow) {
                shouldDisable = true;
                reason = 'Not compatible with Crossbow cutter';
            } else if (isUHF) {
                shouldDisable = true;
                reason = 'Not compatible with UHF hotends';
            }
        }
        
        // Rule 2: LGX-Lite and VZ-Hextrudort are disabled if UHF hotend is selected
        if (inputName === 'extruder' && (inputValue === 'lgx-lite' || inputValue === 'vz-hextrudort')) {
            if (isUHF) {
                shouldDisable = true;
                reason = 'Not compatible with UHF hotends';
            }
        }
        
        // Rule 3: Crossbow is disabled if sherpa-mini is selected or UHF hotend is selected
        if (inputName === 'filament-cutter' && inputValue === 'crossbow') {
            if (isSherpaMini) {
                shouldDisable = true;
                reason = 'Not compatible with Sherpa Mini';
            } else if (isUHF) {
                shouldDisable = true;
                reason = 'Not compatible with UHF hotends';
            }
        }
        
        // Rule 4: UHF hotends are disabled if crossbow is selected
        if (inputName === 'hotend' && uhfHotends.includes(inputValue)) {
            if (isCrossbow) {
                shouldDisable = true;
                reason = 'Not compatible with Crossbow cutter';
            }
        }
        
        // Rule 5: Toolhead board compatibility based on extruder (Xol Carriage only)
        // Board mount availability matrix:
        // - ebb36-sht36v2: wwbmg, wwg2, sherpa-mini, lgx-lite, vz-hextrudort
        // - h36: wwbmg only
        // - nh36: wwbmg only
        // - sht36v3: wwbmg only
        // - xol-pcb: wwbmg, orbiter
        if (inputName === 'toolhead-board' && inputValue !== 'none') {
            const extruder = config.extruder;
            const boardCompatibility = {
                'ebb36-sht36v2': ['wwbmg', 'wwg2', 'sherpa-mini', 'lgx-lite', 'vz-hextrudort'],
                'h36': ['wwbmg'],
                'nh36': ['wwbmg'],
                'sht36v3': ['wwbmg'],
                'xol-pcb': ['wwbmg', 'orbiter']
            };
            
            // Also disable all toolhead boards if not using Xol Carriage
            if (config.carriage !== 'xol-carriage') {
                shouldDisable = true;
                reason = 'Only available with Xol Carriage';
            } else if (boardCompatibility[inputValue] && !boardCompatibility[inputValue].includes(extruder)) {
                shouldDisable = true;
                reason = `No mount available for ${extruder} extruder`;
            }
        }
        
        // Apply disabled state
        if (shouldDisable) {
            label.classList.add('disabled');
            input.disabled = true;
            label.title = reason;
        } else {
            label.classList.remove('disabled');
            input.disabled = false;
            label.title = '';
        }
    });
}

async function updateViewer() {
    const config = state.config;
    
    // Update which options are disabled based on current selection
    updateDisabledOptions(config);
    
    const matchingParts = getMatchingParts(config);
    
    // Show loading
    document.getElementById('loading').classList.remove('hidden');
    
    // Clear current models
    modelGroup.clear();
    state.activeModels.clear();
    
    // Load and display matching parts
    for (const part of matchingParts) {
        try {
            const model = await loadModel(part.id, part);
            
            // Apply transform
            // Skip if model failed to load
            if (!model) {
                continue;
            }
            
            applyTransform(model, part.transform);
            
            // Apply material color - use bright colors for visibility
            const categoryColors = {
                carriages: 0x888888,        // Gray
                cowlings: 0x4a90d9,        // Blue
                hotendDucts: 0xd94a4a,     // Red  
                hotendSpacers: 0xd94a4a,   // Red (same as ducts)
                extruderAdapters: 0x4ad94a, // Green
                ledHolders: 0xeeeeee,       // White
                boardMounts: 0xd9d94a,      // Yellow
                wwbmg: 0x9b59b6             // Purple
            };
            
            // Special colors for specific parts
            const partColors = {
                'crossbow-assembly': 0x555555  // Mid-dark gray for crossbow assembly
            };
            
            const color = partColors[part.id] || categoryColors[part.category] || 0x888888;
            let opacity = 1.0;
            if (part.category === 'carriages') opacity = 0.6;
            else if (part.id === 'crossbow-assembly') opacity = 0.7;
            applyMaterial(model, color, opacity);
            
            // Add to scene
            model.name = part.id;
            model.userData = part;
            modelGroup.add(model);
            state.activeModels.set(part.id, model);
            
        } catch (error) {
            console.warn(`Failed to load part ${part.id}:`, error);
        }
    }
    
    // Update parts list UI (include STL-only parts)
    const stlOnlyParts = getMatchingStlOnlyParts(config);
    updatePartsList(matchingParts, stlOnlyParts, config);
    
    // Update warnings
    const warnings = checkCompatibility(config);
    updateWarnings(warnings);
    
    // Center camera on models only on initial load
    if (state.initialLoad) {
        centerCameraOnModels();
        state.initialLoad = false;
    }
    
    // Hide loading
    document.getElementById('loading').classList.add('hidden');
    
    // Update dev panel if in dev mode
    if (state.devMode) {
        updateDevPanel();
    }
}

function updatePartsList(parts, stlOnlyParts = [], config = {}) {
    const listEl = document.getElementById('parts-list');
    listEl.innerHTML = '';
    
    // Combine both rendered parts and STL-only parts
    // Exclude carriages (from other sources), wwbmg (STL files handled separately),
    // hotendSpacers (included in the HE Duct STL, separate gltf for visualization only),
    // and visualOnly parts
    const allParts = [...parts, ...stlOnlyParts].filter(p => 
        p.category !== 'carriages' && p.category !== 'wwbmg' && p.category !== 'hotendSpacers' && !p.visualOnly
    );
    
    // Group by category
    const byCategory = {};
    for (const part of allParts) {
        if (!byCategory[part.categoryLabel]) {
            byCategory[part.categoryLabel] = [];
        }
        byCategory[part.categoryLabel].push(part);
    }
    
    for (const [category, categoryParts] of Object.entries(byCategory)) {
        for (const part of categoryParts) {
            const li = document.createElement('li');
            // Handle both gltf parts (file) and STL-only parts (stlFile)
            let fileName;
            if (part.stlFile) {
                fileName = part.stlFile.split('/').pop();
            } else {
                // Remove .glb if present, then ensure .stl extension
                let baseName = part.file.split('/').pop().replace('.glb', '');
                fileName = baseName.endsWith('.stl') ? baseName : baseName + '.stl';
            }
            
            // Transform cowling filename if hex cowl option is enabled
            if (config.hexCowl && part.category === 'cowlings') {
                // Change from "A4T Cowling - Dragon_Rapido [xol-carriage].stl"
                // To "Hex A4T Cowling - Dragon_Rapido [xol-carriage].3mf"
                const baseName = fileName.replace('.stl', '');
                fileName = 'Hex ' + baseName + '.3mf';
            }
            
            // Build quantity and note text
            let quantityText = part.quantity && part.quantity > 1 ? ` (x${part.quantity})` : '';
            let noteText = part.printNote ? ` <span class="print-note">${part.printNote}</span>` : '';
            
            li.innerHTML = `
                <span class="part-name">${category}${quantityText}</span>
                <span class="part-file">${fileName}${noteText}</span>
            `;
            listEl.appendChild(li);
        }
    }
}

function updateWarnings(warnings) {
    const warningsEl = document.getElementById('warnings');
    
    if (warnings.length === 0) {
        warningsEl.classList.remove('visible');
        return;
    }
    
    warningsEl.classList.add('visible');
    warningsEl.innerHTML = '<h3>⚠️ Warnings</h3>';
    
    for (const warning of warnings) {
        const div = document.createElement('div');
        div.className = 'warning-item';
        div.textContent = warning;
        warningsEl.appendChild(div);
    }
}

function centerCameraOnModels() {
    if (modelGroup.children.length === 0) return;
    
    const box = new THREE.Box3().setFromObject(modelGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.0; // Zoom out more
    
    // Handle very small models
    if (maxDim < 1) {
        cameraZ = 0.5;  // Get very close for tiny models
    }
    
    camera.position.set(center.x + cameraZ * 0.7, center.y + cameraZ * 0.5, center.z + cameraZ * 0.7);
    camera.near = maxDim * 0.001 || 0.001;
    camera.far = maxDim * 100 || 10000;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.update();
}

// ============================================
// Event Handlers
// ============================================

function setupEventListeners() {
    // Configuration radio buttons
    document.querySelectorAll('.option-group input[type=\"radio\"]').forEach(input => {
        input.addEventListener('change', (e) => {
            // Convert kebab-case to camelCase (e.g., "wwbmg-sensors" -> "wwbmgSensors")
            const configKey = e.target.name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            const value = e.target.value;
            state.config[configKey] = value;
            
            // Show/hide WW-BMG sensor options based on extruder selection
            if (configKey === 'extruder') {
                const wwbmgOptions = document.getElementById('wwbmg-options');
                if (wwbmgOptions) {
                    wwbmgOptions.style.display = value === 'wwbmg' ? 'block' : 'none';
                }
            }
            
            updateViewer();
        });
    });
    
    // Checkboxes
    document.querySelectorAll('.option-group input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', (e) => {
            // Convert kebab-case to camelCase (e.g., "filament-cutter" -> "filamentCutter")
            const configKey = e.target.name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            
            // hexCowl is a boolean, others use value/'none'
            if (configKey === 'hexCowl') {
                state.config[configKey] = e.target.checked;
            } else {
                state.config[configKey] = e.target.checked ? e.target.value : 'none';
            }
            updateViewer();
        });
    });
    
    // Viewer controls
    document.getElementById('btn-reset-view').addEventListener('click', () => {
        centerCameraOnModels();
    });
    
    document.getElementById('btn-explode').addEventListener('click', toggleExplodedView);
    document.getElementById('btn-wireframe').addEventListener('click', toggleWireframe);
    
    document.getElementById('btn-perspective').addEventListener('click', () => {
        setPerspective(true);
    });
    
    document.getElementById('btn-ortho').addEventListener('click', () => {
        setPerspective(false);
    });
    
    // Download button
    document.getElementById('download-btn').addEventListener('click', downloadParts);
}

function toggleExplodedView() {
    state.exploded = !state.exploded;
    document.getElementById('btn-explode').classList.toggle('active', state.exploded);
    
    const explodeDistance = 30;
    
    state.activeModels.forEach((model, partId) => {
        const baseTransform = model.userData.transform || { position: [0, 0, 0] };
        
        if (state.exploded) {
            // Move parts outward based on their category
            const category = model.userData.category;
            let offset = [0, 0, 0];
            
            switch (category) {
                case 'cowlings':
                    offset = [0, 0, 0];
                    break;
                case 'hotendDucts':
                    offset = [0, -explodeDistance, 0];
                    break;
                case 'extruderAdapters':
                    offset = [0, explodeDistance, 0];
                    break;
                case 'ledHolders':
                    offset = [0, 0, explodeDistance];
                    break;
                case 'boardMounts':
                    offset = [0, explodeDistance * 1.5, 0];
                    break;
            }
            
            model.position.set(
                baseTransform.position[0] + offset[0],
                baseTransform.position[1] + offset[1],
                baseTransform.position[2] + offset[2]
            );
        } else {
            // Return to original position
            model.position.set(...baseTransform.position);
        }
    });
}

function toggleWireframe() {
    state.wireframe = !state.wireframe;
    document.getElementById('btn-wireframe').classList.toggle('active', state.wireframe);
    
    modelGroup.traverse((child) => {
        if (child.isMesh) {
            child.material.wireframe = state.wireframe;
        }
    });
}

function setPerspective(isPerspective) {
    document.getElementById('btn-perspective').classList.toggle('active', isPerspective);
    document.getElementById('btn-ortho').classList.toggle('active', !isPerspective);
    
    // Would need to swap camera type for true ortho
    // For now, just adjust FOV to simulate
    if (isPerspective) {
        camera.fov = 45;
    } else {
        camera.fov = 10;  // Very narrow FOV approximates ortho
    }
    camera.updateProjectionMatrix();
}

// GitHub raw content base URLs
const GITHUB_STL_BASE = 'https://raw.githubusercontent.com/Armchair-Heavy-Industries/A4T/main/STL/';
const GITHUB_3MF_BASE = 'https://raw.githubusercontent.com/Armchair-Heavy-Industries/A4T/main/3mf/';

async function downloadParts() {
    const parts = getMatchingParts(state.config);
    const stlOnlyParts = getMatchingStlOnlyParts(state.config);
    
    // Build file list from both rendered parts and STL-only parts
    // Exclude carriages (from other sources), wwbmg (STL files handled via stlOnlyParts),
    // hotendSpacers (included in the HE Duct STL, separate gltf for visualization only),
    // and visualOnly parts (not printable, just for visualization)
    const renderedFiles = parts
        .filter(p => p.category !== 'carriages' && p.category !== 'wwbmg' && p.category !== 'hotendSpacers' && !p.visualOnly)
        .map(p => {
            // Use stlPath if specified (for parts where STL location differs from GLTF)
            if (p.stlPath) {
                return { path: p.stlPath, isStl: true };
            }
            // Otherwise, convert GLTF path to STL path
            let baseName = p.file.replace('.glb', '');
            const stlPath = baseName.endsWith('.stl') ? baseName : baseName + '.stl';
            return { path: stlPath, isStl: true, isCowling: p.category === 'cowlings' };
        });
    const stlOnlyFiles = stlOnlyParts.map(p => ({ path: p.stlFile, isStl: true }));
    let allFiles = [...renderedFiles, ...stlOnlyFiles];
    
    // Transform cowling files to hex 3MF if hex cowl option is enabled
    if (state.config.hexCowl) {
        allFiles = allFiles.map(file => {
            if (file.isCowling) {
                // Transform: "Cowlings/A4T Cowling - Dragon_Rapido [cw2-tap].stl"
                // To: "Cowlings [Hexagon multi-colour]/Hex A4T Cowling - Dragon_Rapido [cw2-tap].3mf"
                const fileName = file.path.split('/').pop();  // e.g., "A4T Cowling - Dragon_Rapido [cw2-tap].stl"
                const baseName = fileName.replace('.stl', '');  // Remove .stl
                const hexFileName = 'Hex ' + baseName + '.3mf';
                return { 
                    path: 'Cowlings [Hexagon multi-colour]/' + hexFileName, 
                    isStl: false,
                    is3mf: true 
                };
            }
            return file;
        });
    }
    
    // Show download progress
    const downloadBtn = document.getElementById('download-btn');
    const originalText = downloadBtn.textContent;
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Preparing download...';
    
    try {
        const zip = new JSZip();
        const folder = zip.folder('A4T-STLs');
        
        let completed = 0;
        const total = allFiles.length;
        
        // Fetch all files in parallel with progress updates
        const fetchPromises = allFiles.map(async (file) => {
            const filePath = file.path;
            // Use appropriate base URL based on file type
            const baseUrl = file.is3mf ? GITHUB_3MF_BASE : GITHUB_STL_BASE;
            
            // Encode the path but keep forward slashes for URL structure
            // GitHub raw URLs need proper encoding for spaces and special chars
            const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
            const url = baseUrl + encodedPath;
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const blob = await response.blob();
                
                // Extract just the filename for the zip (flatten structure)
                const fileName = filePath.split('/').pop();
                folder.file(fileName, blob);
                
                completed++;
                downloadBtn.textContent = `Downloading... ${completed}/${total}`;
                
                return { success: true, file: filePath };
            } catch (error) {
                console.error(`Failed to fetch ${filePath}:`, error);
                completed++;
                downloadBtn.textContent = `Downloading... ${completed}/${total}`;
                return { success: false, file: filePath, error: error.message };
            }
        });
        
        const results = await Promise.all(fetchPromises);
        
        // Check for failures
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            console.warn('Some files failed to download:', failures);
        }
        
        // Generate the zip
        downloadBtn.textContent = 'Creating ZIP...';
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        }, (metadata) => {
            downloadBtn.textContent = `Creating ZIP... ${Math.round(metadata.percent)}%`;
        });
        
        // Trigger download
        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'A4T-STLs.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        // Show completion message
        if (failures.length > 0) {
            alert(`Download complete!\n\n${failures.length} file(s) could not be fetched:\n${failures.map(f => f.file).join('\n')}`);
        }
        
    } catch (error) {
        console.error('Download failed:', error);
        alert('Download failed: ' + error.message);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = originalText;
    }
}

// ============================================
// Initialize
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    setupEventListeners();
    updateViewer();
});
