# A4T Parts Manifest Guide

This document explains how the `partsManifest.js` file works and how to add new parts to the A4T configurator.

## Overview

The `partsManifest.js` file is the **single source of truth** for:
- All available configuration options (carriage, hotend, extruder, etc.)
- Compatibility rules between options
- Part definitions with file paths and 3D transforms
- STL-only parts (download-only, not rendered in 3D viewer)

## File Structure

```javascript
export const partsManifest = {
    version: "1.1.0",           // Cache-busting version
    basePath: "models/",        // Where 3D models live
    fileExtension: "gltf",      // Model format (don't include in file paths!)
    globalScale: 1000,          // OnShape exports in meters, we display in mm
    
    configOptions: { ... },     // UI configuration options
    compatibility: { ... },     // What works with what
    parts: { ... },             // 3D rendered parts
    stlOnlyParts: { ... },      // Download-only parts (no 3D model)
    colors: { ... }             // Part visualization colors
};
```

## Configuration Options (`configOptions`)

Defines the dropdown/radio options shown in the UI:

```javascript
configOptions: {
    hotend: {
        label: "Hotend",                    // UI label
        options: [
            { id: "dragon", label: "Dragon + MZE", default: true },
            { id: "rapido-uhf", label: "Rapido UHF", noExtruderAdapter: true }
        ]
    }
}
```

**Properties:**
- `id` - Internal identifier (used in part matching)
- `label` - Display name in UI
- `default` - Set to `true` for the default selection
- `noExtruderAdapter` - If `true`, this option skips extruder adapter parts

## Compatibility Rules (`compatibility`)

Defines which options work together:

```javascript
compatibility: {
    "sherpa-mini": {
        incompatibleWith: {
            hotend: ["dragon-uhf", "rapido-uhf"],
            filamentCutter: ["crossbow"]
        },
        noExtruderAdapter: true,
        warningMessage: "Sherpa-Mini is not supported with UHF hotends"
    },
    "wwg2": {
        requiresSpacing: true    // Needs G2-Orbiter spacing cowlings
    }
}
```

**Properties:**
- `incompatibleWith` - Disables certain options in the UI
- `noExtruderAdapter` - Skip extruder adapter category
- `requiresSpacing` - Used by cowling selection logic
- `warningMessage` - Shown to user when incompatibility detected

## Part Definitions (`parts`)

Parts are organized by category. Each category contains variants that match different configurations.

### Basic Structure

```javascript
parts: {
    cowlings: {                           // Category ID
        category: "Cowling",              // Display name
        description: "Main toolhead body",
        variants: {
            "cowling-dragon-xol": {       // Part ID (must be unique)
                file: "Cowlings/A4T Cowling - Dragon [xol-carriage]",
                requires: { carriage: "xol-carriage", hotend: "dragon" },
                transform: {
                    position: [0, 0, 0],
                    rotation: [-180, 0, 0],
                    scale: 1
                }
            }
        }
    }
}
```

### Part Matching Properties

| Property | Description | Example |
|----------|-------------|---------|
| `file` | Path to model (no extension!) | `"Cowlings/A4T Cowling - Dragon [xol]"` |
| `requires` | Must match ALL these values | `{ carriage: "xol", hotend: "dragon" }` |
| `requiresAny` | Must match ANY value in arrays | `{ hotend: ["dragon", "rapido"] }` |
| `excludeIf` | Don't match if ANY value matches | `{ extruder: ["wwg2", "orbiter"] }` |
| `always` | Always included regardless of config | `true` |
| `transform` | Position, rotation, scale for 3D | See below |

### How Part Matching Works

The app checks each part against the current configuration:

1. **`always: true`** → Part always matches
2. **`requires`** → ALL key/value pairs must match exactly
3. **`requiresAny`** → At least ONE value from each array must match
4. **`excludeIf`** → If ANY value matches, part is excluded

**Example:**

```javascript
"cowling-dragon-xol-g2": {
    file: "Cowlings/A4T Cowling - Dragon - G2-Orbiter [xol]",
    requires: { carriage: "xol-carriage" },           // Must be xol carriage
    requiresAny: { 
        hotend: ["dragon", "rapido"],                 // Dragon OR Rapido
        extruder: ["wwg2", "orbiter"]                 // AND (G2 OR Orbiter)
    },
    transform: { ... }
}
```

This part matches when:
- Carriage is `xol-carriage` AND
- Hotend is `dragon` OR `rapido` AND
- Extruder is `wwg2` OR `orbiter`

### Transform Values

```javascript
transform: {
    position: [x, y, z],      // Offset in millimeters
    rotation: [rx, ry, rz],   // Rotation in degrees (X, Y, Z axes)
    scale: 1                  // Scale multiplier (usually 1)
}
```

**Important:** OnShape exports in meters. The `globalScale: 1000` converts to mm automatically. Transform positions are applied AFTER scaling.

## STL-Only Parts (`stlOnlyParts`)

Parts that don't have 3D models but need to be included in downloads:

```javascript
stlOnlyParts: {
    backflowInhibitors: {
        category: "Backflow Inhibitors",
        description: "Prevents filament backflow",
        alwaysInclude: true,              // Always in download
        variants: {
            "backflow-inhibitor": {
                stlFile: "Backflow Inhibitors/A4T Backflow Inhibitor [x2].stl",
                quantity: 2,
                requires: {}               // No requirements = always included
            }
        }
    },
    toolheadBoardMounts: {
        category: "Toolhead Board Mount",
        variants: {
            "thb-wwbmg-ebb36": {
                stlFile: "Toolhead Board Mounts/A4T - THB Mount - WWBMG.stl",
                requires: { 
                    extruder: "wwbmg", 
                    toolheadBoard: "ebb36-sht36v2",
                    carriage: "xol-carriage" 
                }
            }
        }
    }
}
```

**Properties:**
- `alwaysInclude` - Category is always in download list
- `stlFile` - Full path including extension (unlike `file` for 3D parts)
- `quantity` - Number of copies to print
- `printNote` - Special instructions (e.g., "Print in translucent filament")

## Adding a New Part

### Step 1: Prepare the Model

1. Export from OnShape as `.gltf` format
2. Place in appropriate folder under `web/models/`
3. Name format: `A4T [Part Name] - [Variant] [carriage-type].gltf`

### Step 2: Add the Part Entry

```javascript
// In the appropriate category under 'parts':
"my-new-part-id": {
    file: "Category/A4T Part Name [xol-carriage]",  // NO .gltf extension!
    requires: { carriage: "xol-carriage", hotend: "dragon" },
    transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: 1
    }
}
```

### Step 3: Adjust the Transform

1. Open the configurator in browser
2. Select the configuration that shows your part
3. Adjust `position` and `rotation` values until aligned
4. Save and refresh to verify

**Tips:**
- Position values are in mm
- Rotation is applied in X, Y, Z order (degrees)
- Use browser console to check if part is matching: look for part ID in logs

### Step 4: Add STL for Download (if different path)

If the STL file path differs from the model path, add an `stlPath` override:

```javascript
"my-part-id": {
    file: "Models/MyPart",
    stlPath: "STL/Different/Path/MyPart.stl",  // Override download path
    requires: { ... },
    transform: { ... }
}
```

### Step 5: Run Tests

```bash
cd web
node tests/stl-coverage.test.js
```

This verifies all configuration combinations have valid STL files.

## File Naming Convention

| Type | Path | Extension |
|------|------|-----------|
| 3D Model | `models/Category/Part Name [variant].gltf` | Auto-added |
| STL Download | `STL/Category/Part Name [variant].stl` | Included |
| 3MF Download | `3mf/Category/Part Name [variant].3mf` | Included |

**Important:**
- `file` property: NO extension (added from `fileExtension` setting)
- `stlFile` property: INCLUDE the `.stl` extension
- Paths are relative to repo root for STL/3MF, relative to `basePath` for models

## Common Patterns

### Part with Multiple Hotend Compatibility

```javascript
"duct-dragon-rapido": {
    file: "Hotend Fan Ducts/A4T Duct - Dragon-Rapido",
    requiresAny: { 
        hotend: ["dragon", "dragon-ace", "rapido", "dragon-uhf-mini"] 
    },
    transform: { ... }
}
```

### Part Excluded for Certain Extruders

```javascript
"cowling-standard": {
    file: "Cowlings/A4T Cowling Standard",
    requires: { hotend: "dragon" },
    excludeIf: { extruder: ["wwg2", "orbiter"] },  // Use G2-spacing version instead
    transform: { ... }
}
```

### Always-Included Part

```javascript
"led-holder": {
    file: "LED Holder/A4T LED Holder",
    always: true,  // Always shown regardless of config
    transform: { ... }
}
```

## Debugging

### Part Not Showing?

1. Check if `requires` values match current config exactly
2. Check if `excludeIf` is blocking it
3. Verify `requiresAny` has at least one matching value per key
4. Check browser console for matching logs

### Wrong Part Showing?

Multiple parts may match the same config. Check:
1. Are `requires` conditions too broad?
2. Should you add `excludeIf` to narrow matching?

### Transform Issues?

1. Verify units are in mm (not meters)
2. Check rotation order (X, Y, Z)
3. Try adjusting one axis at a time

## Version History

When making changes, increment the `version` field:

```javascript
version: "1.1.0",  // Major.Minor.Patch
```

This helps with cache busting when users load the configurator.
