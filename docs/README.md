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
cd docs
python -m http.server 8000
```

**Option B: Node.js**
```bash
npx serve .
```

**Option C: VS Code Live Server extension**

Then open http://localhost:8000 in your browser.

## Features

- **Configuration Panel**: Select carriage, hotend, extruder, toolhead board, and more
- **3D Viewer**: Orbit, zoom, pan the assembled toolhead
- **Color Customization**: Pick main and accent colors with color pickers
- **Wireframe Mode**: Toggle wireframe view to see through parts
- **STL Download**: Download all required STL files as a ZIP
- **Parts List**: Shows exactly which files you need
- **Compatibility Warnings**: Alerts for incompatible combinations

## Dev Mode (Model Positioning)

To enable the dev positioning tool for aligning new models:

1. Uncomment the dev script in `index.html`:
   ```html
   <script type="module" src="js/devModelPositioner.js"></script>
   ```
2. Refresh the page - a dev panel will appear
3. Select a model and use keyboard controls to position it:
   - **X/Y/Z** - Rotate 90° around each axis
   - **< / >** - Move along X axis
   - **Arrow Up/Down** - Move along Y axis
   - **Arrow Left/Right** - Move along Z axis
   - **Shift** - 1mm precision, **Ctrl** - 0.1mm precision
4. Copy the transform JSON output to `partsManifest.js`
5. Comment out the script when done

## File Structure

```
docs/
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Styles
├── js/
│   ├── app.js          # Main Three.js application
│   ├── partsManifest.js # Part definitions and compatibility rules
│   └── devModelPositioner.js # Dev tool for positioning models
├── models/             # GLB files from Onshape
└── tests/              # Automated tests
```

## Adding New Parts

1. Export GLB from Onshape
2. Place in appropriate `models/` subfolder
3. Add entry to `js/partsManifest.js` with:
   - File path
   - Compatibility requirements
   - Transform data (position/rotation)

## Hosting on GitHub Pages

1. Ensure the `docs/` folder is in your repo
2. Go to repo Settings → Pages
3. Set source to deploy from branch, select `/docs` folder
4. Your configurator will be live at `https://yourusername.github.io/A4T/`
