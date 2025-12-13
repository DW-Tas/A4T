# A4T Toolhead Configurator - Web App

Interactive 3D configurator for the A4T toolhead. Select your parts and see them assembled in 3D!

## Quick Start

### 1. Add your GLB models

Export GLB files from Onshape and place them in the `models/` folder:

```
models/
├── Cowlings/
│   ├── A4T Cowling - Dragon_Rapido [xol-carriage].glb
│   └── ...
├── Hotend Fan Ducts/
│   └── ...
├── Extruder Adapters/
│   └── ...
└── ...
```

### 2. Start a local server

The app needs to be served via HTTP (not file://) due to ES modules. 

**Option A: Python (easiest)**
```bash
cd web
python -m http.server 8000
```

**Option B: Node.js**
```bash
npx serve .
```

**Option C: VS Code Live Server extension**

Then open http://localhost:8000 in your browser.

## Features

- **Configuration Panel**: Select carriage, hotend, extruder
- **3D Viewer**: Orbit, zoom, pan the assembled toolhead
- **Exploded View**: See how parts fit together
- **Parts List**: Shows exactly which files you need
- **Compatibility Warnings**: Alerts for incompatible combinations

## Dev Mode

Press `Ctrl+Shift+D` to toggle dev mode, which shows:
- Transform editor for positioning parts
- Copy transform JSON for updating `partsManifest.js`

## File Structure

```
web/
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Styles
├── js/
│   ├── app.js          # Main Three.js application
│   └── partsManifest.js # Part definitions and compatibility rules
└── models/             # GLB files from Onshape
```

## Adding New Parts

1. Export GLB from Onshape
2. Place in appropriate `models/` subfolder
3. Add entry to `js/partsManifest.js` with:
   - File path
   - Compatibility requirements
   - Transform data (position/rotation)

## Hosting on GitHub Pages

1. Ensure the `web/` folder is in your repo
2. Go to repo Settings → Pages
3. Set source to deploy from branch, select `/web` folder
4. Your configurator will be live at `https://yourusername.github.io/A4T/`
