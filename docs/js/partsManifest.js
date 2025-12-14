/**
 * A4T Parts Manifest
 * ==================
 * 
 * This file is the single source of truth for all parts in the A4T configurator.
 * It defines available parts, compatibility rules, file paths, and transform data.
 * 
 * FILE NAMING CONVENTION:
 * -----------------------
 * - All model files are .gltf format (exported from OnShape)
 * - DO NOT include file extensions in the 'file' property - the extension is
 *   added automatically from 'fileExtension' setting below
 * - STL files for download use the same base name with .stl extension
 * - If the STL path differs from the model path, use 'stlPath' to override
 * 
 * ADDING A NEW PART:
 * ------------------
 * 1. Export the model from OnShape as .gltf
 * 2. Place in the appropriate subfolder under models/
 * 3. Add an entry to the relevant category in 'parts' below
 * 4. Follow this template:
 * 
 *    "my-part-id": {
 *        file: "Category/My Part Name [variant]",     // NO extension!
 *        requires: { configKey: "value" },            // Must match exactly
 *        requiresAny: { configKey: ["a", "b"] },      // Match any in array (optional)
 *        excludeIf: { configKey: ["x", "y"] },        // Exclude if matches (optional)
 *        transform: {
 *            position: [x, y, z],
 *            rotation: [rx, ry, rz],
 *            scale: 1
 *        }
 *    }
 * 
 * TRANSFORM VALUES:
 * -----------------
 * - position: [x, y, z] in millimeters
 * - rotation: [rx, ry, rz] in degrees
 * - scale: multiplier (usually 1)
 * 
 * Note: OnShape exports in meters; globalScale converts to mm automatically.
 * Transform positions are applied AFTER scaling.
 */

export const partsManifest = {
    // Increment version when making changes (for cache busting)
    version: "1.1.0",
    
    // Base path for model files (relative to web root)
    basePath: "models/",
    
    // File extension for 3D models - DO NOT include this in file paths below
    fileExtension: "gltf",
    
    // Global scale: OnShape exports in meters, we display in mm
    globalScale: 1000,
    // Configuration options with their available values
    configOptions: {
        carriage: {
            label: "Carriage",
            options: [
                { id: "xol-carriage", label: "Xol-Carriage", default: true },
                { id: "cw2-tap", label: "CW2 / Tap" }
            ]
        },
        hotend: {
            label: "Hotend",
            options: [
                { id: "dragon", label: "Dragon + MZE", default: true },
                { id: "dragon-ace", label: "Dragon Ace" },
                { id: "dragon-uhf-mini", label: "Dragon UHF-Mini" },
                { id: "dragon-ace-volcano", label: "Dragon Ace Volcano (no MZE)" },
                { id: "rapido", label: "Rapido HF" },
                { id: "bambulab", label: "Bambulab" },
                { id: "chube-compact", label: "Chube Compact" },
                { id: "revo-voron", label: "Revo Voron" },
                { id: "revolcano", label: "ReVolcano" },
                { id: "nf-crazy", label: "NF-Crazy" },
                { id: "tz-v6-stock", label: "TZ-V6-2.0 (Stock Nozzle)" },
                { id: "tz-v6-v6", label: "TZ-V6-2.0 (V6 Nozzle)" },
                { id: "dragon-uhf", label: "Dragon UHF", noExtruderAdapter: true },
                { id: "dragon-ace-mze", label: "Dragon Ace + MZE", noExtruderAdapter: true },
                { id: "dragon-ace-volcano-mze", label: "Dragon Ace Volcano + MZE", noExtruderAdapter: true },
                { id: "rapido-uhf", label: "Rapido UHF", noExtruderAdapter: true }
            ]
        },
        extruder: {
            label: "Extruder",
            options: [
                { id: "wwbmg", label: "Wrist Watch BMG for A4T", default: true },
                { id: "sherpa-mini", label: "Sherpa Mini" },
                { id: "wwg2", label: "Wrist Watch G2" },
                { id: "orbiter", label: "Orbiter 2.0" },
                { id: "lgx-lite", label: "LGX Lite" },
                { id: "vz-hextrudort", label: "VZ-Hextrudort" }
            ]
        },
        filamentCutter: {
            label: "Filament Cutter",
            options: [
                { id: "none", label: "None", default: true },
                { id: "crossbow", label: "Crossbow Cutter" }
            ]
        }
    },
    
    // Compatibility rules - defines what combinations work together
    compatibility: {
        // Sherpa Mini not compatible with UHF hotends or crossbow cutter (no extruder adapter)
        "sherpa-mini": {
            incompatibleWith: {
                hotend: ["dragon-uhf", "dragon-ace-mze", "dragon-ace-volcano-mze", "rapido-uhf"],
                filamentCutter: ["crossbow"]
            },
            noExtruderAdapter: true,
            warningMessage: "Sherpa-Mini is not supported with UHF hotends or Crossbow cutter"
        },
        // G2/Orbiter extruders need the special spacing cowlings
        "wwg2": {
            requiresSpacing: true
        },
        "orbiter": {
            requiresSpacing: true
        },
        // Dragon UHF only compatible with specific extruders and no extruder adapter
        "dragon-uhf": {
            compatibleExtruders: ["wwbmg", "wwg2", "orbiter"],
            noExtruderAdapter: true
        },
        // Dragon Ace + MZE only compatible with specific extruders and no extruder adapter
        "dragon-ace-mze": {
            compatibleExtruders: ["wwbmg", "wwg2", "orbiter"],
            noExtruderAdapter: true
        },
        // Dragon Ace Volcano + MZE only compatible with specific extruders and no extruder adapter
        "dragon-ace-volcano-mze": {
            compatibleExtruders: ["wwbmg", "wwg2", "orbiter"],
            noExtruderAdapter: true
        },
        // Rapido UHF only compatible with specific extruders and no extruder adapter
        "rapido-uhf": {
            compatibleExtruders: ["wwbmg", "wwg2", "orbiter"],
            noExtruderAdapter: true
        }
    },
    
    // Part definitions organized by category
    parts: {
        // ========================================
        // CARRIAGES
        // ========================================
        carriages: {
            category: "Carriage",
            description: "Carriage mount for toolhead",
            variants: {
                "carriage-xol": {
                    file: "Carriages/Xol-Carriage",
                    requires: { carriage: "xol-carriage" },
                    transform: {
                        position: [6.3, 0, -54.5],
                        rotation: [270, 0, 0],
                        scale: 1
                    }
                },
                "carriage-tap": {
                    file: "Carriages/Tap",
                    requires: { carriage: "cw2-tap" },
                    transform: {
                        position: [0, -45.1, -34.2],
                        rotation: [270, 0, 0],
                        scale: 1
                    }
                }
            }
        },
        
        // ========================================
        // WW-BMG EXTRUDER MODELS
        // ========================================
        wwbmg: {
            category: "WW-BMG",
            description: "Wrist Watch BMG extruder model",
            variants: {
                // No Sensors without Crossbow
                "wwbmg-no-sensors": {
                    file: "WW-BMG/A4T - WW-BMG",
                    requires: { extruder: "wwbmg", wwbmgSensors: "no-sensors" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 29.1, -32],
                        rotation: [270, 0, 0],
                        scale: 1
                    }
                },
                // No Sensors with Crossbow
                "wwbmg-no-sensors-crossbow": {
                    file: "WW-BMG/A4T - WW-BMG - Crossbow",
                    requires: { extruder: "wwbmg", wwbmgSensors: "no-sensors", filamentCutter: "crossbow" },
                    transform: {
                        position: [0, 29.1, -32],
                        rotation: [270, 0, 0],
                        scale: 1
                    }
                },
                // Single/Dual Sensors without Crossbow
                "wwbmg-sensor": {
                    file: "WW-BMG/A4T - WW-BMG - Sensor",
                    requires: { extruder: "wwbmg" },
                    requiresAny: { wwbmgSensors: ["single-sensor", "dual-sensors"] },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 29.1, -32],
                        rotation: [270, 0, 0],
                        scale: 1
                    }
                },
                // Single/Dual Sensors with Crossbow
                "wwbmg-sensor-crossbow": {
                    file: "WW-BMG/A4T - WW-BMG - Sensor - Crossbow",
                    requires: { extruder: "wwbmg", filamentCutter: "crossbow" },
                    requiresAny: { wwbmgSensors: ["single-sensor", "dual-sensors"] },
                    transform: {
                        position: [0, 29.1, -32],
                        rotation: [270, 0, 0],
                        scale: 1
                    }
                }
            }
        },
        
        // ========================================
        // COWLINGS
        // ========================================
        cowlings: {
            category: "Cowling",
            description: "Main toolhead body",
            variants: {
                // Dragon/Rapido HF (and Dragon Ace, UHF-Mini, Ace Volcano)
                "cowling-dragon-rapido-xol": {
                    file: "Cowlings/A4T Cowling - Dragon_Rapido [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { hotend: ["dragon", "dragon-ace", "dragon-uhf-mini", "dragon-ace-volcano", "rapido"] },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-dragon-rapido-xol-g2": {
                    file: "Cowlings/A4T Cowling - Dragon_Rapido - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { hotend: ["dragon", "dragon-ace", "dragon-uhf-mini", "dragon-ace-volcano", "rapido"], extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-dragon-rapido-cw2": {
                    file: "Cowlings/A4T Cowling - Dragon_Rapido [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { hotend: ["dragon", "dragon-ace", "dragon-uhf-mini", "dragon-ace-volcano", "rapido"] },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-dragon-rapido-cw2-g2": {
                    file: "Cowlings/A4T Cowling - Dragon_Rapido - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { hotend: ["dragon", "dragon-ace", "dragon-uhf-mini", "dragon-ace-volcano", "rapido"], extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // Dragon/Rapido UHF (and Dragon Ace + MZE, Ace Volcano + MZE) - only compatible with wwbmg, wwg2, orbiter - no extruder adapter needed
                "cowling-dragon-uhf-xol": {
                    file: "Cowlings/A4T Cowling - Dragon-Rapido UHF [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { hotend: ["dragon-uhf", "dragon-ace-mze", "dragon-ace-volcano-mze", "rapido-uhf"] },
                    excludeIf: { extruder: ["wwg2", "orbiter", "lgx-lite", "vz-hextrudort", "sherpa-mini"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-dragon-uhf-xol-g2": {
                    file: "Cowlings/A4T Cowling - Dragon-Rapido UHF - G2-Orb Spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { hotend: ["dragon-uhf", "dragon-ace-mze", "dragon-ace-volcano-mze", "rapido-uhf"], extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-dragon-uhf-cw2": {
                    file: "Cowlings/A4T Cowling - Dragon-Rapido UHF [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { hotend: ["dragon-uhf", "dragon-ace-mze", "dragon-ace-volcano-mze", "rapido-uhf"] },
                    excludeIf: { extruder: ["wwg2", "orbiter", "lgx-lite", "vz-hextrudort", "sherpa-mini"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-dragon-uhf-cw2-g2": {
                    file: "Cowlings/A4T Cowling - Dragon-Rapido UHF - G2-Orb Spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { hotend: ["dragon-uhf", "dragon-ace-mze", "dragon-ace-volcano-mze", "rapido-uhf"], extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // Bambulab
                "cowling-bambulab-xol": {
                    file: "Cowlings/A4T Cowling - Bambulab [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "bambulab" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-bambulab-xol-g2": {
                    file: "Cowlings/A4T Cowling - Bambulab - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "bambulab" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-bambulab-cw2": {
                    file: "Cowlings/A4T Cowling - Bambulab [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "bambulab" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-bambulab-cw2-g2": {
                    file: "Cowlings/A4T Cowling - Bambulab - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "bambulab" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // Chube Compact
                "cowling-chube-xol": {
                    file: "Cowlings/A4T Cowling - Chube-Compact [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "chube-compact" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-chube-xol-g2": {
                    file: "Cowlings/A4T Cowling - Chube-Compact - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "chube-compact" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-chube-cw2": {
                    file: "Cowlings/A4T Cowling - Chube-Compact [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "chube-compact" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-chube-cw2-g2": {
                    file: "Cowlings/A4T Cowling - Chube-Compact - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "chube-compact" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // Revo Voron
                "cowling-revo-xol": {
                    file: "Cowlings/A4T Cowling - Revo-Voron [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "revo-voron" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-revo-xol-g2": {
                    file: "Cowlings/A4T Cowling - Revo-Voron - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "revo-voron" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-revo-cw2": {
                    file: "Cowlings/A4T Cowling - Revo-Voron [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "revo-voron" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-revo-cw2-g2": {
                    file: "Cowlings/A4T Cowling - Revo-Voron - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "revo-voron" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // ReVolcano
                "cowling-revolcano-xol": {
                    file: "Cowlings/A4T Cowling - ReVolcano [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "revolcano" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-revolcano-xol-g2": {
                    file: "Cowlings/A4T Cowling - ReVolcano - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "revolcano" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-revolcano-cw2": {
                    file: "Cowlings/A4T Cowling - ReVolcano [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "revolcano" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-revolcano-cw2-g2": {
                    file: "Cowlings/A4T Cowling - ReVolcano - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "revolcano" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // NF-Crazy
                "cowling-nfcrazy-xol": {
                    file: "Cowlings/A4T Cowling - NF-Crazy [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "nf-crazy" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-nfcrazy-xol-g2": {
                    file: "Cowlings/A4T Cowling - NF-Crazy - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage", hotend: "nf-crazy" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-nfcrazy-cw2": {
                    file: "Cowlings/A4T Cowling - NF-Crazy [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "nf-crazy" },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-nfcrazy-cw2-g2": {
                    file: "Cowlings/A4T Cowling - NF-Crazy - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap", hotend: "nf-crazy" },
                    requiresAny: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                
                // TZ-V6-2.0 (both Stock Nozzle and V6 Nozzle use same cowlings)
                "cowling-tzv6-xol": {
                    file: "Cowlings/A4T Cowling - TZ-V6-2.0 [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { hotend: ["tz-v6-stock", "tz-v6-v6"] },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-tzv6-xol-g2": {
                    file: "Cowlings/A4T Cowling - TZ-V6-2.0 - G2-Orbiter spacing [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { hotend: ["tz-v6-stock", "tz-v6-v6"], extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-tzv6-cw2": {
                    file: "Cowlings/A4T Cowling - TZ-V6-2.0 [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { hotend: ["tz-v6-stock", "tz-v6-v6"] },
                    excludeIf: { extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "cowling-tzv6-cw2-g2": {
                    file: "Cowlings/A4T Cowling - TZ-V6-2.0 - G2-Orbiter spacing [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { hotend: ["tz-v6-stock", "tz-v6-v6"], extruder: ["wwg2", "orbiter"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                }
            }
        },
        
        // ========================================
        // HOTEND FAN DUCTS
        // ========================================
        hotendDucts: {
            category: "Hotend Fan Duct",
            description: "2510 fan mount and airflow duct",
            variants: {
                "duct-dragon": {
                    file: "Hotend Fan Ducts/A4T HE Fan Duct - Dragon",
                    requiresAny: { hotend: ["dragon", "dragon-ace", "dragon-uhf-mini", "dragon-ace-volcano"] },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-rapido": {
                    file: "Hotend Fan Ducts/A4T HE Fan Duct - Rapido",
                    requires: { hotend: "rapido" },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-dragon-uhf": {
                    file: "Hotend Fan Ducts/A4T HE Fan Duct - Dragon",
                    requiresAny: { hotend: ["dragon-uhf", "dragon-ace-mze", "dragon-ace-volcano-mze"] },
                    transform: {
                        position: [0, 7.3, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-rapido-uhf": {
                    file: "Hotend Fan Ducts/A4T HE Fan Duct - Rapido",
                    requires: { hotend: "rapido-uhf" },
                    transform: {
                        position: [0, 7.3, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-bambulab": {
                    file: "Hotend Fan Ducts/A4T HE Duct - Bambulab",
                    requires: { hotend: "bambulab" },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-chube": {
                    file: "Hotend Fan Ducts/A4T HE Duct - Chube-Compact",
                    requires: { hotend: "chube-compact" },
                    transform: {
                        position: [0, -11, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-revo": {
                    file: "Hotend Fan Ducts/A4T HE Duct - Revo-Voron",
                    requires: { hotend: "revo-voron" },
                    transform: {
                        position: [0, -11, -13.6],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-revolcano": {
                    file: "Hotend Fan Ducts/A4T HE Duct - ReVolcano",
                    requires: { hotend: "revolcano" },
                    transform: {
                        position: [0, 0, 0],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-nfcrazy": {
                    file: "Hotend Fan Ducts/A4T HE Duct - NF-Crazy",
                    requires: { hotend: "nf-crazy" },
                    transform: {
                        position: [0, 0, -13.6],
                        rotation: [-180, 0, 180],
                        scale: 1
                    }
                },
                "duct-tzv6-stock": {
                    file: "Hotend Fan Ducts/A4T HE Duct - TZ-V6-2.0 [Stock Nozzle]",
                    requires: { hotend: "tz-v6-stock" },
                    transform: {
                        position: [0, -11, -13.6],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                },
                "duct-tzv6-v6": {
                    file: "Hotend Fan Ducts/A4T HE Duct - TZ-V6-2.0 [V6 Nozzle]",
                    requires: { hotend: "tz-v6-v6" },
                    transform: {
                        position: [0, -11, -13.6],
                        rotation: [-180, 0, 0],
                        scale: 1
                    }
                }
            }
        },
        
        // ========================================
        // HOTEND SPACERS
        // ========================================
        hotendSpacers: {
            category: "Hotend Spacer",
            description: "Spacers for specific hotend configurations",
            variants: {
                "spacer-tzv6-stock": {
                    file: "Hotend Fan Ducts/A4T HE Duct - TZ-V6-2.0 [Stock Nozzle] - Spacer",
                    requires: { hotend: "tz-v6-stock" },
                    transform: {
                        position: [-30, 1.6, -31.9],
                        rotation: [-90, 0, 0],
                        scale: 1
                    }
                }
            }
        },
        
        // ========================================
        // EXTRUDER ADAPTERS
        // ========================================
        extruderAdapters: {
            category: "Extruder Adapter",
            description: "Connects extruder to cowling",
            variants: {
                "adapter-wwbmg-xol": {
                    file: "Extruder Adapters/A4T - WWBMG - Extruder Adapter [xol-carriage]",
                    requires: { carriage: "xol-carriage", extruder: "wwbmg" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 27.7, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-wwbmg-cw2": {
                    file: "Extruder Adapters/A4T - WWBMG - Extruder Adapter [cw2-tap]",
                    requires: { carriage: "cw2-tap", extruder: "wwbmg" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 27.7, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-wwg2-xol": {
                    file: "Extruder Adapters/A4T - WWG2 - Extruder Adapter [xol-carriage]",
                    requires: { carriage: "xol-carriage", extruder: "wwg2" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 30.9, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-wwg2-cw2": {
                    file: "Extruder Adapters/A4T - WWG2 - Extruder Adapter [cw2-tap]",
                    requires: { carriage: "cw2-tap", extruder: "wwg2" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 30.9, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-orbiter-xol": {
                    file: "Extruder Adapters/A4T - Orbiter - Extruder Adapter [xol-carriage]",
                    requires: { carriage: "xol-carriage", extruder: "orbiter" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 30.9, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-orbiter-cw2": {
                    file: "Extruder Adapters/A4T - Orbiter - Extruder Adapter [cw2-tap]",
                    requires: { carriage: "cw2-tap", extruder: "orbiter" },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 30.9, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-lgx-xol": {
                    file: "Extruder Adapters/A4T - LGX-L_VZHex Adapter [xol-carriage]",
                    requires: { carriage: "xol-carriage" },
                    requiresAny: { extruder: ["lgx-lite", "vz-hextrudort"] },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 31.5, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "adapter-lgx-cw2": {
                    file: "Extruder Adapters/A4T - LGX-L_VZHex Adapter [cw2-tap]",
                    requires: { carriage: "cw2-tap" },
                    requiresAny: { extruder: ["lgx-lite", "vz-hextrudort"] },
                    excludeIf: { filamentCutter: ["crossbow"] },
                    transform: {
                        position: [0, 31.5, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                
                // ----------------------------------------
                // CROSSBOW CUTTER HOLDERS
                // (Replace standard adapters when Crossbow is selected)
                // Note: GLTF models are in Extruder Adapters/, but STLs are in the subfolder
                // ----------------------------------------
                "crossbow-wwbmg": {
                    file: "Extruder Adapters/Crossbow cutter holder - WW-BMG (Sherpa-Mini spacing)",
                    stlPath: "Extruder Adapters/For Crossbow filament cutter/Crossbow cutter holder - WW-BMG (Sherpa-Mini spacing).stl",
                    requires: { extruder: "wwbmg", filamentCutter: "crossbow" },
                    transform: {
                        position: [99.9, 29.1, -33.8],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "crossbow-wwg2": {
                    file: "Extruder Adapters/Crossbow cutter holder - WW-G2 (Oribiter2 Spacing)",
                    stlPath: "Extruder Adapters/For Crossbow filament cutter/Crossbow cutter holder - WW-G2 (Oribiter2 Spacing).stl",
                    requires: { extruder: "wwg2", filamentCutter: "crossbow" },
                    transform: {
                        position: [0, 30.9, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "crossbow-orbiter": {
                    file: "Extruder Adapters/Crossbow cutter holder - Orbiter2",
                    stlPath: "Extruder Adapters/For Crossbow filament cutter/Crossbow cutter holder - Orbiter2.stl",
                    requires: { extruder: "orbiter", filamentCutter: "crossbow" },
                    transform: {
                        position: [0, 30.9, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                "crossbow-lgx": {
                    file: "Extruder Adapters/Crossbow cutter holder - LGX-L_VZHex",
                    stlPath: "Extruder Adapters/For Crossbow filament cutter/Crossbow cutter holder - LGX-L_VZHex.stl",
                    requiresAny: { extruder: ["lgx-lite", "vz-hextrudort"] },
                    requires: { filamentCutter: "crossbow" },
                    transform: {
                        position: [0, 31.5, -31.9],
                        rotation: [90, 0, 180],
                        scale: 1
                    }
                },
                
                // Crossbow Assembly visual (shown when crossbow option is enabled)
                // This is visualization-only, not a printable part
                "crossbow-assembly": {
                    file: "Extruder Adapters/CrossbowAssembly",
                    requires: { filamentCutter: "crossbow" },
                    visualOnly: true,  // Don't include in STL downloads
                    transform: {
                        position: [0, 22.6, -31.9],
                        rotation: [-90, 0, 0],
                        scale: 1
                    }
                }
            }
        }
        
        // ========================================
        // LED HOLDERS (disabled until files added)
        // ========================================
        // ledHolders: {
        //     category: "LED Holder",
        //     description: "Neopixel LED mount and diffuser",
        //     variants: {
        //         "led-holder": {
        //             file: "LED Holder + Filter/A4T LED Holder",
        //             always: true,  // Always included
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         },
        //         "led-filter": {
        //             file: "LED Holder + Filter/A4T LED Filter",
        //             always: true,
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         }
        //     }
        // },
        
        // ========================================
        // TOOLHEAD BOARD MOUNTS (disabled until files added)
        // ========================================
        // boardMounts: {
        //     category: "Toolhead Board Mount",
        //     description: "Mount for CAN toolhead board",
        //     variants: {
        //         "thb-wwbmg": {
        //             file: "Toolhead Board Mounts/A4T - THB Mount - WWBMG",
        //             requires: { extruder: "wwbmg" },
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         },
        //         "thb-wwg2": {
        //             file: "Toolhead Board Mounts/A4T - THB Mount - WWG2",
        //             requires: { extruder: "wwg2" },
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         },
        //         "thb-sherpa": {
        //             file: "Toolhead Board Mounts/A4T - THB Mount - Sherpa-Mini",
        //             requires: { extruder: "sherpa-mini" },
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         },
        //         "thb-lgx": {
        //             file: "Toolhead Board Mounts/A4T - THB Mount - LGX-L",
        //             requires: { extruder: "lgx-lite" },
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         },
        //         "thb-vzhex": {
        //             file: "Toolhead Board Mounts/A4T - THB Mount - VZ-Hex",
        //             requires: { extruder: "vz-hextrudort" },
        //             transform: {
        //                 position: [0, 27.7, -31.9],
        //                 rotation: [90, 0, 180],
        //                 scale: 1
        //             }
        //         }
        //     }
        // }
    },
    
    // STL-only parts (not rendered in 3D viewer, but included in downloads)
    // These are parts that don't have gltf models but need to be included in the parts list
    stlOnlyParts: {
        // ========================================
        // ALWAYS INCLUDED - NON-OPTIONAL PARTS
        // ========================================
        backflowInhibitors: {
            category: "Backflow Inhibitors",
            description: "Prevents filament backflow - always required",
            alwaysInclude: true,
            variants: {
                "backflow-inhibitor": {
                    stlFile: "Backflow Inhibitors/A4T Backflow Inhibitor [x2].stl",
                    quantity: 2,
                    requires: {}  // No requirements - always included
                },
                "backflow-install-tool": {
                    stlFile: "Backflow Inhibitors/A4T Backflow Inhibitor install spacer tool.stl",
                    quantity: 1,
                    requires: {}  // No requirements - always included
                }
            }
        },
        
        ledHolderFilter: {
            category: "LED Holder + Filter",
            description: "LED lighting components - always required",
            alwaysInclude: true,
            variants: {
                "led-carrier": {
                    stlFile: "LED Holder + Filter/A4T LED Carrier.stl",
                    quantity: 1,
                    requires: {}  // No requirements - always included
                },
                "led-diffuser": {
                    stlFile: "LED Holder + Filter/A4T LED Diffuser[translucent].stl",
                    quantity: 1,
                    printNote: "Print in translucent filament",
                    requires: {}  // No requirements - always included
                },
                "led-filter": {
                    stlFile: "LED Holder + Filter/A4T LED Filter[opaque].stl",
                    quantity: 1,
                    printNote: "Print in opaque filament",
                    requires: {}  // No requirements - always included
                }
            }
        },
        
        // ========================================
        // TOOLHEAD BOARD MOUNTS (Xol Carriage only)
        // ========================================
        toolheadBoardMounts: {
            category: "Toolhead Board Mount",
            description: "Mount for CAN toolhead board",
            variants: {
                // BTT EBB 36 v1.2 / Fly SHT36v2 (standard boards)
                "thb-wwbmg-ebb36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - WWBMG.stl",
                    requires: { extruder: "wwbmg", toolheadBoard: "ebb36-sht36v2", carriage: "xol-carriage" }
                },
                "thb-wwg2-ebb36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - WWG2.stl",
                    requires: { extruder: "wwg2", toolheadBoard: "ebb36-sht36v2", carriage: "xol-carriage" }
                },
                "thb-sherpa-ebb36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - Sherpa-Mini.stl",
                    requires: { extruder: "sherpa-mini", toolheadBoard: "ebb36-sht36v2", carriage: "xol-carriage" }
                },
                "thb-lgx-ebb36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - LGX-L.stl",
                    requires: { extruder: "lgx-lite", toolheadBoard: "ebb36-sht36v2", carriage: "xol-carriage" }
                },
                "thb-vzhex-ebb36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - VZ-Hex.stl",
                    requires: { extruder: "vz-hextrudort", toolheadBoard: "ebb36-sht36v2", carriage: "xol-carriage" }
                },
                
                // Fysetc H36
                "thb-wwbmg-h36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - WWBMG - H36.stl",
                    requires: { extruder: "wwbmg", toolheadBoard: "h36", carriage: "xol-carriage" }
                },
                
                // LDO Nitehawk 36
                "thb-wwbmg-nh36": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - WWBMG - NH36.STL",
                    requires: { extruder: "wwbmg", toolheadBoard: "nh36", carriage: "xol-carriage" }
                },
                
                // Fly SHT36v3
                "thb-wwbmg-sht36v3": {
                    stlFile: "Toolhead Board Mounts/A4T - THB Mount - WWBMG SHT36v3.stl",
                    requires: { extruder: "wwbmg", toolheadBoard: "sht36v3", carriage: "xol-carriage" }
                },
                
                // Xol PCB
                "thb-wwbmg-xolpcb": {
                    stlFile: "Toolhead Board Mounts/A4T - Xol_PCB Mount - WWBMG.stl",
                    requires: { extruder: "wwbmg", toolheadBoard: "xol-pcb", carriage: "xol-carriage" }
                },
                "thb-orbiter-xolpcb": {
                    stlFile: "Toolhead Board Mounts/A4T - Xol_PCB Mount - Orbiter v2.0.stl",
                    requires: { extruder: "orbiter", toolheadBoard: "xol-pcb", carriage: "xol-carriage" }
                }
            }
        },
        
        // ========================================
        // WW-BMG EXTRUDER STL FILES
        // ========================================
        wwbmgExtruder: {
            category: "Extruder",
            description: "Wrist Watch BMG extruder parts",
            variants: {
                // === NO SENSORS ===
                // No Sensors without Crossbow - Main Body
                "wwbmg-nosensor-main": {
                    stlFile: "WW-BMG for A4T/Standard (no sensor)/A4T - WWBMG - Main_Body [Sherpa-Mini spacing].stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "no-sensors" },
                    excludeIf: { filamentCutter: ["crossbow"] }
                },
                // No Sensors without Crossbow - Motor Plate
                "wwbmg-nosensor-motor": {
                    stlFile: "WW-BMG for A4T/Standard (no sensor)/A4T - WWBMG - Motor Plate.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "no-sensors" },
                    excludeIf: { filamentCutter: ["crossbow"] }
                },
                // No Sensors with Crossbow - Main Body
                "wwbmg-nosensor-crossbow-main": {
                    stlFile: "WW-BMG for A4T/Standard (no sensor)/A4T - WWBMG - Main_Body [Sherpa-Mini spacing] - Crossbow.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "no-sensors", filamentCutter: "crossbow" }
                },
                // No Sensors with Crossbow - Motor Plate
                "wwbmg-nosensor-crossbow-motor": {
                    stlFile: "WW-BMG for A4T/Standard (no sensor)/A4T - WWBMG - Motor Plate.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "no-sensors", filamentCutter: "crossbow" }
                },
                
                // === SINGLE SENSOR ===
                // Single Sensor without Crossbow - Main Body
                "wwbmg-single-main": {
                    stlFile: "WW-BMG for A4T/Single Sensor/A4T - WWBMG - Main_Body [Sherpa-Mini spacing] Single Sensor.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "single-sensor" },
                    excludeIf: { filamentCutter: ["crossbow"] }
                },
                // Single Sensor without Crossbow - Motor Plate
                "wwbmg-single-motor": {
                    stlFile: "WW-BMG for A4T/Single Sensor/A4T - WWBMG - Motor_Plate - Single Sensor.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "single-sensor" },
                    excludeIf: { filamentCutter: ["crossbow"] }
                },
                // Single Sensor with Crossbow - Main Body
                "wwbmg-single-crossbow-main": {
                    stlFile: "WW-BMG for A4T/Single Sensor/A4T - WWBMG - Main_Body [Sherpa-Mini spacing] Single Sensor - Crossbow.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "single-sensor", filamentCutter: "crossbow" }
                },
                // Single Sensor with Crossbow - Motor Plate
                "wwbmg-single-crossbow-motor": {
                    stlFile: "WW-BMG for A4T/Single Sensor/A4T - WWBMG - Motor_Plate - Single Sensor.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "single-sensor", filamentCutter: "crossbow" }
                },
                
                // === DUAL SENSORS ===
                // Dual Sensors without Crossbow - Main Body
                "wwbmg-dual-main": {
                    stlFile: "WW-BMG for A4T/Dual Sensor/A4T - WWBMG - Main_Body [Sherpa-Mini spacing] Dual Sensor.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "dual-sensors" },
                    excludeIf: { filamentCutter: ["crossbow"] }
                },
                // Dual Sensors without Crossbow - Motor Plate
                "wwbmg-dual-motor": {
                    stlFile: "WW-BMG for A4T/Dual Sensor/A4T - WWBMG - Motor_Plate - Dual Sensor.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "dual-sensors" },
                    excludeIf: { filamentCutter: ["crossbow"] }
                },
                // Dual Sensors with Crossbow - Main Body
                "wwbmg-dual-crossbow-main": {
                    stlFile: "WW-BMG for A4T/Dual Sensor/A4T - WWBMG - Main_Body [Sherpa-Mini spacing] Dual Sensor - Crossbow.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "dual-sensors", filamentCutter: "crossbow" }
                },
                // Dual Sensors with Crossbow - Motor Plate
                "wwbmg-dual-crossbow-motor": {
                    stlFile: "WW-BMG for A4T/Dual Sensor/A4T - WWBMG - Motor_Plate - Dual Sensor.stl",
                    requires: { extruder: "wwbmg", wwbmgSensors: "dual-sensors", filamentCutter: "crossbow" }
                },
                
                // === TENSION ARM ===
                // Smooth Bearing Idler
                "wwbmg-tensionarm-smooth": {
                    stlFile: "WW-BMG for A4T/Tension Arm/A4T - WWBMG - Beefy_Tension_Arm - Smooth_Idler.stl",
                    requires: { extruder: "wwbmg", wwbmgIdler: "smooth-bearing" }
                },
                // BMG Dual Drive Idler
                "wwbmg-tensionarm-bmg": {
                    stlFile: "WW-BMG for A4T/Tension Arm/A4T - WWBMG - Beefy_Tension_Arm - BMG_Idler.stl",
                    requires: { extruder: "wwbmg", wwbmgIdler: "bmg-dual-drive" }
                }
            }
        }
    },
    
    // Part colors for visualization (can be customized)
    colors: {
        cowlings: 0x2a2a2a,         // Dark gray (main body)
        hotendDucts: 0x3a3a3a,      // Slightly lighter gray
        extruderAdapters: 0x2a2a2a, // Match cowling
        ledHolders: 0xeeeeee,       // White/light for LED diffuser
        boardMounts: 0x2a2a2a       // Dark gray
    }
};
