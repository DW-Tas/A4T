/**
 * A4T Configurator STL Coverage Test
 * 
 * This script tests that every valid configuration combination
 * produces the correct STL files and that those files exist.
 * 
 * Run with: node tests/stl-coverage.test.js
 */

const fs = require('fs');
const path = require('path');

// Load partsManifest - we need to extract it from the JS file
const manifestPath = path.join(__dirname, '..', 'js', 'partsManifest.js');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Find where the export function starts (marks end of partsManifest)
const exportIdx = manifestContent.indexOf('export function');
if (exportIdx === -1) {
    console.error('Could not find export marker');
    process.exit(1);
}

// Get content up to the export, then find the last };
const contentBeforeExport = manifestContent.substring(0, exportIdx);
const lastBraceIdx = contentBeforeExport.lastIndexOf('};');
if (lastBraceIdx === -1) {
    console.error('Could not find end of partsManifest');
    process.exit(1);
}

// Extract just the object declaration
const declarationStart = contentBeforeExport.indexOf('const partsManifest = ');
const objectContent = contentBeforeExport.substring(declarationStart + 'const partsManifest = '.length, lastBraceIdx + 1);

let partsManifest;
try {
    partsManifest = new Function(`return ${objectContent}`)();
} catch (e) {
    console.error('Error parsing partsManifest:', e);
    console.error('First 500 chars:', objectContent.substring(0, 500));
    process.exit(1);
}

// STL and 3MF base paths (relative to repo root)
const STL_BASE = path.join(__dirname, '..', '..', 'STL');
const THREE_MF_BASE = path.join(__dirname, '..', '..', '3mf');
const GITHUB_STL_BASE = 'https://raw.githubusercontent.com/Armchair-Heavy-Industries/A4T/main/STL/';
const GITHUB_3MF_BASE = 'https://raw.githubusercontent.com/Armchair-Heavy-Industries/A4T/main/3mf/';

// ============================================
// Configuration Options
// ============================================

const CONFIG_OPTIONS = {
    carriage: ['cw2-tap', 'xol-carriage'],
    hotend: [
        'rapido', 'rapido-uhf',
        'dragon-sf', 'dragon-hf', 'dragon-uhf',
        'dragonace',
        'revo-voron',
        'bambulab',
        'nf-crazy',
        'chube-compact',
        'tz-v6-sf', 'tz-v6-hf'
    ],
    extruder: ['wwbmg', 'wwg2', 'sherpa-mini', 'orbiter', 'lgx-lite', 'vz-hextrudort'],
    wwbmgSensors: ['no-sensors', 'single', 'dual'],
    wwbmgIdler: ['standard', 'filament-sensor'],
    toolheadBoard: ['none', 'ebb36', 'ebb42', 'sht36', 'sht42', 'mellow-fly', 'skr-pico', 'huvud'],
    filamentCutter: ['none', 'crossbow'],
    hexCowl: [false, true]
};

// ============================================
// Compatibility Logic (mirrors app.js)
// ============================================

function isConfigValid(config) {
    const extruderRule = partsManifest.compatibility[config.extruder];
    const hotendRule = partsManifest.compatibility[config.hotend];
    
    // Check extruder incompatibilities
    if (extruderRule?.incompatibleWith) {
        for (const [key, values] of Object.entries(extruderRule.incompatibleWith)) {
            if (values.includes(config[key])) {
                return false;
            }
        }
    }
    
    // Check hotend incompatibilities
    if (hotendRule?.incompatibleWith) {
        for (const [key, values] of Object.entries(hotendRule.incompatibleWith)) {
            if (values.includes(config[key])) {
                return false;
            }
        }
    }
    
    return true;
}

// ============================================
// Part Matching Logic (mirrors app.js)
// ============================================

function partMatchesConfig(partData, config) {
    // Check 'always' flag
    if (partData.always) return true;
    
    // Check 'requires' conditions (all must match)
    if (partData.requires) {
        for (const [key, value] of Object.entries(partData.requires)) {
            if (config[key] !== value) return false;
        }
    }
    
    // Check 'requiresAny' conditions (at least one must match)
    if (partData.requiresAny) {
        let anyMatch = false;
        for (const [key, values] of Object.entries(partData.requiresAny)) {
            if (Array.isArray(values) && values.includes(config[key])) {
                anyMatch = true;
                break;
            }
        }
        if (!anyMatch) return false;
    }
    
    // Check 'excludeIf' conditions (none should match)
    if (partData.excludeIf) {
        for (const [key, values] of Object.entries(partData.excludeIf)) {
            if (Array.isArray(values) && values.includes(config[key])) {
                return false;
            }
        }
    }
    
    return true;
}

function getMatchingParts(config) {
    const matching = [];
    
    const extruderRule = partsManifest.compatibility[config.extruder];
    const hotendRule = partsManifest.compatibility[config.hotend];
    const skipExtruderAdapter = extruderRule?.noExtruderAdapter || hotendRule?.noExtruderAdapter;
    
    for (const [categoryId, category] of Object.entries(partsManifest.parts)) {
        if (skipExtruderAdapter && categoryId === 'extruderAdapters') continue;
        
        for (const [partId, partData] of Object.entries(category.variants)) {
            if (partMatchesConfig(partData, config)) {
                matching.push({
                    id: partId,
                    category: categoryId,
                    ...partData
                });
            }
        }
    }
    
    return matching;
}

function getMatchingStlOnlyParts(config) {
    const matching = [];
    
    if (!partsManifest.stlOnlyParts) return matching;
    
    for (const [categoryId, category] of Object.entries(partsManifest.stlOnlyParts)) {
        for (const [partId, partData] of Object.entries(category.variants)) {
            if (partMatchesConfig(partData, config)) {
                matching.push({
                    id: partId,
                    category: categoryId,
                    ...partData
                });
            }
        }
    }
    
    return matching;
}

// ============================================
// STL File Resolution (mirrors downloadParts in app.js)
// ============================================

function getExpectedFiles(config) {
    const parts = getMatchingParts(config);
    const stlOnlyParts = getMatchingStlOnlyParts(config);
    
    // Build file list from rendered parts
    // Exclude carriages, wwbmg (handled via stlOnlyParts), hotendSpacers, and visualOnly
    let renderedFiles = parts
        .filter(p => 
            p.category !== 'carriages' && 
            p.category !== 'wwbmg' && 
            p.category !== 'hotendSpacers' && 
            !p.visualOnly
        )
        .map(p => {
            if (p.stlPath) {
                return { path: p.stlPath, isStl: true };
            }
            let baseName = p.file.replace('.glb', '');
            const stlPath = baseName.endsWith('.stl') ? baseName : baseName + '.stl';
            return { path: stlPath, isStl: true, isCowling: p.category === 'cowlings' };
        });
    
    // Add STL-only files
    const stlOnlyFiles = stlOnlyParts.map(p => ({ path: p.stlFile, isStl: true }));
    
    let allFiles = [...renderedFiles, ...stlOnlyFiles];
    
    // Transform cowling files to hex 3MF if hex cowl option is enabled
    if (config.hexCowl) {
        allFiles = allFiles.map(file => {
            if (file.isCowling) {
                // Transform: "Cowlings/A4T Cowling - Dragon_Rapido [cw2-tap].stl"
                // To: "Cowlings [Hexagon multi-colour]/Hex A4T Cowling - Dragon_Rapido [cw2-tap].3mf"
                const fileName = file.path.split('/').pop();
                const baseName = fileName.replace('.stl', '');
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
    
    return allFiles;
}

// ============================================
// Test Execution
// ============================================

function generateAllConfigs() {
    const configs = [];
    
    for (const carriage of CONFIG_OPTIONS.carriage) {
        for (const hotend of CONFIG_OPTIONS.hotend) {
            for (const extruder of CONFIG_OPTIONS.extruder) {
                for (const toolheadBoard of CONFIG_OPTIONS.toolheadBoard) {
                    for (const filamentCutter of CONFIG_OPTIONS.filamentCutter) {
                        for (const hexCowl of CONFIG_OPTIONS.hexCowl) {
                            // WW-BMG has additional options
                            if (extruder === 'wwbmg') {
                                for (const wwbmgSensors of CONFIG_OPTIONS.wwbmgSensors) {
                                    for (const wwbmgIdler of CONFIG_OPTIONS.wwbmgIdler) {
                                        configs.push({
                                            carriage,
                                            hotend,
                                            extruder,
                                            wwbmgSensors,
                                            wwbmgIdler,
                                            toolheadBoard,
                                            filamentCutter,
                                            hexCowl
                                        });
                                    }
                                }
                            } else {
                                configs.push({
                                    carriage,
                                    hotend,
                                    extruder,
                                    wwbmgSensors: 'no-sensors',
                                    wwbmgIdler: 'standard',
                                    toolheadBoard,
                                    filamentCutter,
                                    hexCowl
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    return configs;
}

function checkFileExists(file) {
    const basePath = file.is3mf ? THREE_MF_BASE : STL_BASE;
    const fullPath = path.join(basePath, file.path);
    return fs.existsSync(fullPath);
}

async function checkFileExistsOnGitHub(file) {
    const baseUrl = file.is3mf ? GITHUB_3MF_BASE : GITHUB_STL_BASE;
    const encodedPath = file.path.split('/').map(s => encodeURIComponent(s)).join('/');
    const url = baseUrl + encodedPath;
    
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
}

function runTests(options = { checkGitHub: false, verbose: false }) {
    console.log('A4T Configurator STL/3MF Coverage Test');
    console.log('======================================\n');
    
    const allConfigs = generateAllConfigs();
    console.log(`Total configuration combinations: ${allConfigs.length}`);
    
    // Filter to valid configs only
    const validConfigs = allConfigs.filter(isConfigValid);
    console.log(`Valid configurations (after compatibility filtering): ${validConfigs.length}`);
    console.log(`Skipped invalid configurations: ${allConfigs.length - validConfigs.length}\n`);
    
    // Track results
    const results = {
        passed: 0,
        failed: 0,
        missingFiles: new Map(), // Map<filePath, configsThatNeedIt[]>
        configErrors: []
    };
    
    // Test each valid config
    for (const config of validConfigs) {
        const configKey = JSON.stringify(config);
        
        try {
            const expectedFiles = getExpectedFiles(config);
            
            if (options.verbose) {
                console.log(`\nConfig: ${configKey}`);
                console.log(`Expected files (${expectedFiles.length}):`);
                expectedFiles.forEach(f => console.log(`  - ${f.path} (${f.is3mf ? '3mf' : 'stl'})`));
            }
            
            let configPassed = true;
            
            for (const file of expectedFiles) {
                if (!checkFileExists(file)) {
                    configPassed = false;
                    
                    if (!results.missingFiles.has(file.path)) {
                        results.missingFiles.set(file.path, []);
                    }
                    results.missingFiles.get(file.path).push(config);
                }
            }
            
            if (configPassed) {
                results.passed++;
            } else {
                results.failed++;
            }
            
        } catch (error) {
            results.configErrors.push({ config, error: error.message });
            results.failed++;
        }
    }
    
    // Print results
    console.log('\n======================================');
    console.log('RESULTS');
    console.log('======================================\n');
    
    console.log(`✅ Passed: ${results.passed} configurations`);
    console.log(`❌ Failed: ${results.failed} configurations`);
    
    if (results.missingFiles.size > 0) {
        console.log(`\n⚠️  Missing files (${results.missingFiles.size}):\n`);
        
        for (const [filePath, configs] of results.missingFiles) {
            console.log(`  ❌ ${filePath}`);
            console.log(`     Needed by ${configs.length} configuration(s)`);
            
            if (options.verbose && configs.length <= 3) {
                configs.forEach(c => {
                    console.log(`       - ${c.extruder}/${c.hotend}/${c.carriage}${c.hexCowl ? ' (hex cowl)' : ''}`);
                });
            }
        }
    }
    
    if (results.configErrors.length > 0) {
        console.log(`\n⚠️  Configuration errors (${results.configErrors.length}):\n`);
        results.configErrors.forEach(({ config, error }) => {
            console.log(`  Config: ${JSON.stringify(config)}`);
            console.log(`  Error: ${error}\n`);
        });
    }
    
    // Summary
    console.log('\n===================================');
    if (results.failed === 0) {
        console.log('✅ ALL TESTS PASSED');
    } else {
        console.log('❌ TESTS FAILED');
        console.log(`   ${results.missingFiles.size} missing STL files`);
        console.log(`   ${results.failed} configurations affected`);
    }
    console.log('===================================\n');
    
    return results;
}

// ============================================
// Additional Utility: List all unique STL files
// ============================================

function listAllExpectedStlFiles() {
    const allConfigs = generateAllConfigs();
    const validConfigs = allConfigs.filter(isConfigValid);
    
    const allFiles = new Set();
    
    for (const config of validConfigs) {
        const files = getExpectedStlFiles(config);
        files.forEach(f => allFiles.add(f));
    }
    
    return Array.from(allFiles).sort();
}

// ============================================
// CLI Entry Point
// ============================================

if (require.main === module) {
    const args = process.argv.slice(2);
    const verbose = args.includes('--verbose') || args.includes('-v');
    const listFiles = args.includes('--list-files');
    
    if (listFiles) {
        console.log('All expected STL files across all valid configurations:\n');
        const files = listAllExpectedStlFiles();
        files.forEach(f => console.log(f));
        console.log(`\nTotal: ${files.length} unique STL files`);
    } else {
        const results = runTests({ verbose });
        process.exit(results.failed > 0 ? 1 : 0);
    }
}

module.exports = {
    runTests,
    generateAllConfigs,
    getExpectedStlFiles,
    listAllExpectedStlFiles,
    isConfigValid,
    checkFileExists
};
