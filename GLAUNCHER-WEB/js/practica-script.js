document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos Comunes ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const practiceLayout = document.querySelector('.practice-layout');
    const exerciseItems = document.querySelectorAll('.exercise-item');
    const exerciseContents = document.querySelectorAll('.exercise-content');
    const hitSound = document.getElementById('hit-sound');
    const placeBlockSound = document.getElementById('place-block-sound');
    const levelUpSound = document.getElementById('level-up-sound');

    // --- Lógica de Navegación de Ejercicios ---
    exerciseItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            if (cpsTestRunning) endCpsTest();
            if (aimGameRunning) endAimGame();
            if (blockPlacerRunning) endBlockPlacerGame();
            exerciseItems.forEach(i => i.classList.remove('active'));
            exerciseContents.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                if (targetId === 'block-placer') {
                    initBlockPlacer();
                }
            }
        });
    });
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        practiceLayout.classList.toggle('sidebar-collapsed');
    });

    // ==================================================
    // --- TEST DE CPS (CLICS POR SEGUNDO) ---
    // ==================================================
    const timeSelect = document.getElementById('time-select');
    const customTimeInput = document.getElementById('custom-time-input');
    const cpsTimerDisplay = document.getElementById('cps-timer');
    const liveCpsDisplay = document.getElementById('live-cps');
    const clickArea = document.getElementById('click-area');
    const startText = document.getElementById('start-text');
    const cpsResultsModal = document.getElementById('cps-results-modal-overlay');
    const cpsRating = document.getElementById('cps-rating');
    const finalCpsSpan = document.querySelector('#final-cps span');
    const totalClicksSpan = document.querySelector('#total-clicks span');
    const cpsRestartBtn = document.getElementById('cps-restart-btn');
    let cpsClicks = 0, cpsIntervalId = null, cpsTestDuration = 10, cpsTestRunning = false, cpsStartTime = 0;
    timeSelect.addEventListener('change', () => { if (cpsTestRunning) return; customTimeInput.classList.toggle('hidden', timeSelect.value !== 'custom'); if (timeSelect.value === 'custom') { customTimeInput.focus(); cpsTestDuration = parseInt(customTimeInput.value, 10) || 10; } else { cpsTestDuration = parseInt(timeSelect.value, 10); } resetCpsTestUI(); });
    customTimeInput.addEventListener('change', () => { if (cpsTestRunning) return; const val = parseInt(customTimeInput.value, 10); if (val > 0 && val <= 60) { cpsTestDuration = val; resetCpsTestUI(); } });
    clickArea.addEventListener('click', e => { if (!cpsTestRunning && !cpsIntervalId) { startCpsTest(); } if (cpsTestRunning) { cpsClicks++; createClickFeedback(e.clientX, e.clientY); } });
    cpsRestartBtn.addEventListener('click', () => { cpsResultsModal.classList.add('hidden'); resetCpsTestUI(); });
    function startCpsTest() { resetCpsState(); cpsTestRunning = true; clickArea.classList.add('running'); startText.textContent = '¡Clica!'; cpsStartTime = Date.now(); cpsIntervalId = setInterval(() => { const elapsedTime = (Date.now() - cpsStartTime) / 1000; if (elapsedTime >= cpsTestDuration) { endCpsTest(); } else { cpsTimerDisplay.textContent = (cpsTestDuration - elapsedTime).toFixed(2); liveCpsDisplay.textContent = (cpsClicks / elapsedTime || 0).toFixed(2); } }, 10); }
    function endCpsTest() { clearInterval(cpsIntervalId); cpsIntervalId = null; if (!cpsTestRunning) return; cpsTestRunning = false; const finalTime = (Date.now() - cpsStartTime) / 1000; showCpsResults((cpsClicks / finalTime).toFixed(2), cpsClicks); startText.textContent = 'Haz Clic para Empezar'; }
    function showCpsResults(cps, totalClicks) { finalCpsSpan.textContent = cps; totalClicksSpan.textContent = totalClicks; setCpsRating(cps); cpsResultsModal.classList.remove('hidden'); }
    function setCpsRating(cps) { const r = { s: { i: 'fa-turtle', t: 'Lento...' }, a: { i: 'fa-walking', t: 'Promedio' }, f: { i: 'fa-running', t: '¡Rápido!' }, c: { i: 'fa-cheetah', t: '¡Velocidad de Chita!' } }; const k = cps < 5 ? 's' : cps < 8 ? 'a' : cps < 12 ? 'f' : 'c'; cpsRating.innerHTML = `<i class="fas ${r[k].i}"></i><span>${r[k].t}</span>`; cpsRating.className = 'cps-rating rating-' + k; }
    function resetCpsState() { if (cpsIntervalId) clearInterval(cpsIntervalId); cpsIntervalId = null; cpsTestRunning = false; cpsClicks = 0; }
    function resetCpsTestUI() { resetCpsState(); cpsTimerDisplay.textContent = cpsTestDuration.toFixed(2); liveCpsDisplay.textContent = '0.00'; clickArea.classList.remove('running'); startText.textContent = 'Haz Clic para Empezar'; }
    function createClickFeedback(x, y) { const f = document.createElement('div'); f.className = 'click-feedback'; f.style.left = `${x}px`; f.style.top = `${y}px`; document.body.appendChild(f); f.addEventListener('animationend', () => f.remove()); }

    // ==================================================
    // --- AIM TRAINER ---
    // ==================================================
    const aimTimerDisplay = document.getElementById('aim-timer');
    const aimHitsDisplay = document.getElementById('aim-hits');
    const aimMissesDisplay = document.getElementById('aim-misses');
    const aimGameArea = document.getElementById('aim-game-area');
    const aimStartText = document.getElementById('aim-start-text');
    const aimResultsModal = document.getElementById('aim-results-modal-overlay');
    const aimRating = document.getElementById('aim-rating');
    const finalHitsSpan = document.getElementById('final-hits');
    const finalMissesSpan = document.getElementById('final-misses');
    const finalAccuracySpan = document.getElementById('final-accuracy');
    const aimRestartBtn = document.getElementById('aim-restart-btn');
    let aimHits = 0, aimMisses = 0, aimIntervalId = null, aimGameRunning = false, aimGameDuration = 30;
    aimStartText.addEventListener('click', startAimGame);
    aimGameArea.addEventListener('click', (e) => { if (aimGameRunning && e.target === aimGameArea) { aimMisses++; aimMissesDisplay.textContent = aimMisses; } });
    aimRestartBtn.addEventListener('click', () => { aimResultsModal.classList.add('hidden'); resetAimGameUI(); });
    function startAimGame() { resetAimGameUI(); aimGameRunning = true; aimStartText.classList.add('hidden'); const s = Date.now(); aimIntervalId = setInterval(() => { const e = (Date.now() - s) / 1000; if (e >= aimGameDuration) { endAimGame(); } else { aimTimerDisplay.textContent = (aimGameDuration - e).toFixed(2); } }, 10); spawnTarget(); }
    function endAimGame() { if (!aimGameRunning) return; clearInterval(aimIntervalId); aimIntervalId = null; aimGameRunning = false; aimGameArea.innerHTML = ''; aimGameArea.appendChild(aimStartText); showAimResults(); }
    function showAimResults() { const t = aimHits + aimMisses; const a = t > 0 ? ((aimHits / t) * 100) : 0; finalHitsSpan.textContent = aimHits; finalMissesSpan.textContent = aimMisses; finalAccuracySpan.textContent = `${a.toFixed(1)}%`; setAimRating(a); aimResultsModal.classList.remove('hidden'); }
    function setAimRating(acc) { const m = { b: ["¿Estás bien?", "¿Le das a la pantalla?", "Mi abuela apunta mejor..."], o: ["No está mal, pero mejora.", "Sigue practicando.", "Casi..."], g: ["¡Buena puntería!", "¡Eres rápido!", "Se nota la práctica."], gr: ["¡Impresionante!", "¡Eres una máquina!", "¡LEYENDA!"] }; let c = 'b'; if (acc >= 95) c = 'gr'; else if (acc >= 80) c = 'g'; else if (acc >= 60) c = 'o'; const rM = m[c][Math.floor(Math.random() * m[c].length)]; aimRating.innerHTML = `<span>${rM}</span>`; aimRating.className = 'cps-rating rating-' + c; }
    function resetAimGameUI() { aimGameRunning = false; if (aimIntervalId) clearInterval(aimIntervalId); aimHits = 0; aimMisses = 0; aimTimerDisplay.textContent = aimGameDuration.toFixed(2); aimHitsDisplay.textContent = '0'; aimMissesDisplay.textContent = '0'; aimGameArea.innerHTML = ''; aimStartText.classList.remove('hidden'); aimGameArea.appendChild(aimStartText); }
    function spawnTarget() { if (!aimGameRunning) return; aimGameArea.querySelector('.aim-target')?.remove(); const t = document.createElement('div'); t.classList.add('aim-target'); t.addEventListener('click', onTargetHit); t.style.left = `${Math.floor(Math.random() * (aimGameArea.clientWidth - 50))}px`; t.style.top = `${Math.floor(Math.random() * (aimGameArea.clientHeight - 50))}px`; aimGameArea.appendChild(t); void t.offsetWidth; t.classList.add('visible'); }
    function onTargetHit(e) { e.stopPropagation(); if (!aimGameRunning) return; aimHits++; aimHitsDisplay.textContent = aimHits; hitSound.currentTime = 0; hitSound.play().catch(e => {}); e.target.remove(); spawnTarget(); }

    // ==================================================
    // --- BLOCK PLACER ---
    // ==================================================
    const blockPlacerArea = document.getElementById('block-placer-area');
    const blockStartText = document.getElementById('block-start-text');
    const blockTimerDisplay = document.getElementById('block-timer');
    const blockScoreDisplay = document.getElementById('block-score');
    const objectiveBtn = document.getElementById('objective-btn');
    const currentObjectiveDisplay = document.getElementById('current-objective-display');
    const hotbarContainer = document.getElementById('hotbar-container');
    const hotbarSlots = document.getElementById('hotbar-slots');
    const hotbarSelection = document.getElementById('hotbar-selection');
    const blockResultsModal = document.getElementById('block-results-modal-overlay');
    const blockResultTitle = document.getElementById('block-result-title');
    const blockRating = document.getElementById('block-rating');
    const blockFinalStats = document.getElementById('block-final-stats');
    const blockRestartBtn = document.getElementById('block-restart-btn');
    
    // Elementos Bedwars
    const bedwarsArea = document.getElementById('bedwars-game-area');
    const bedwarsStartText = document.getElementById('bedwars-start-text');
    const botHealthContainer = document.getElementById('bot-health-container');
    const playerHealthContainer = document.getElementById('player-health-container');
    const botBedStatusDisplay = document.getElementById('bot-bed-status');
    const playerBedStatusDisplay = document.getElementById('player-bed-status');

    let blockPlacerRunning = false, blockTimerId = null, blockStartTime = 0;
    let currentObjective = 'freestyle', score = 0, totalToBuild = 0;
    let scene, camera, renderer, raycaster, mouse;
    let materials = {}, cubeGeo, rollOverMesh, cubes = [], hologramGroup = new THREE.Group();
    let isThreeJsInitialized = false;
    let hotbarItems = [], currentHotbarSlot = 0;
    let gridHelper = null;
    let inventoryOpen = false;
    let torchModel = null; // Variable para guardar el modelo cargado
    let characterModel = null; // Modelo del personaje (Bot)
    
    // Variables Bedwars
    let bedwarsRunning = false;
    let botMesh = null;
    let botHealth = 20;
    let playerHealth = 20;
    let botBedAlive = true;
    let playerBedAlive = true;
    let lastBotAttackTime = 0;
    
    // Variables para FPS y Movimiento
    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
    let prevTime = performance.now();
    let isLocked = false;
    // Nuevas variables de físicas
    let playerVelocity = new THREE.Vector3();
    let canJump = false;
    let activeGameMode = 'block-placer';

    const BLOCK_SIZE = 100;
    const blueprints = {
        beacon: {
            blocks: ['iron_block', 'beacon'],
            structure: [
                { pos: [-1, 0, -1], type: 'iron_block' }, { pos: [0, 0, -1], type: 'iron_block' }, { pos: [1, 0, -1], type: 'iron_block' },
                { pos: [-1, 0, 0], type: 'iron_block' }, { pos: [0, 0, 0], type: 'iron_block' }, { pos: [1, 0, 0], type: 'iron_block' },
                { pos: [-1, 0, 1], type: 'iron_block' }, { pos: [0, 0, 1], type: 'iron_block' }, { pos: [1, 0, 1], type: 'iron_block' },
                { pos: [0, 1, 0], type: 'beacon' }
            ]
        },
        villager_house: {
            blocks: ['cobblestone', 'oak_planks', 'oak_log', 'glass'],
            structure: [
                // Floor 5x5
                ...Array.from({length: 5}, (_, x) => Array.from({length: 5}, (_, z) => ({ pos: [x-2, 0, z-2], type: 'cobblestone' }))).flat(),
                // Corners (Logs)
                { pos: [-2, 1, -2], type: 'oak_log' }, { pos: [2, 1, -2], type: 'oak_log' }, { pos: [-2, 1, 2], type: 'oak_log' }, { pos: [2, 1, 2], type: 'oak_log' },
                { pos: [-2, 2, -2], type: 'oak_log' }, { pos: [2, 2, -2], type: 'oak_log' }, { pos: [-2, 2, 2], type: 'oak_log' }, { pos: [2, 2, 2], type: 'oak_log' },
                { pos: [-2, 3, -2], type: 'oak_log' }, { pos: [2, 3, -2], type: 'oak_log' }, { pos: [-2, 3, 2], type: 'oak_log' }, { pos: [2, 3, 2], type: 'oak_log' },
                // Walls (Planks) & Windows (Glass)
                // Back Wall
                { pos: [-1, 1, -2], type: 'oak_planks' }, { pos: [0, 1, -2], type: 'oak_planks' }, { pos: [1, 1, -2], type: 'oak_planks' },
                { pos: [-1, 2, -2], type: 'oak_planks' }, { pos: [0, 2, -2], type: 'glass' }, { pos: [1, 2, -2], type: 'oak_planks' },
                { pos: [-1, 3, -2], type: 'oak_planks' }, { pos: [0, 3, -2], type: 'oak_planks' }, { pos: [1, 3, -2], type: 'oak_planks' },
                // Left Wall
                { pos: [-2, 1, -1], type: 'oak_planks' }, { pos: [-2, 1, 0], type: 'oak_planks' }, { pos: [-2, 1, 1], type: 'oak_planks' },
                { pos: [-2, 2, -1], type: 'oak_planks' }, { pos: [-2, 2, 0], type: 'glass' }, { pos: [-2, 2, 1], type: 'oak_planks' },
                { pos: [-2, 3, -1], type: 'oak_planks' }, { pos: [-2, 3, 0], type: 'oak_planks' }, { pos: [-2, 3, 1], type: 'oak_planks' },
                // Right Wall
                { pos: [2, 1, -1], type: 'oak_planks' }, { pos: [2, 1, 0], type: 'oak_planks' }, { pos: [2, 1, 1], type: 'oak_planks' },
                { pos: [2, 2, -1], type: 'oak_planks' }, { pos: [2, 2, 0], type: 'glass' }, { pos: [2, 2, 1], type: 'oak_planks' },
                { pos: [2, 3, -1], type: 'oak_planks' }, { pos: [2, 3, 0], type: 'oak_planks' }, { pos: [2, 3, 1], type: 'oak_planks' },
                // Front Wall (Door gap)
                { pos: [-1, 1, 2], type: 'oak_planks' }, { pos: [1, 1, 2], type: 'oak_planks' },
                { pos: [-1, 2, 2], type: 'oak_planks' }, { pos: [0, 2, 2], type: 'oak_planks' }, { pos: [1, 2, 2], type: 'oak_planks' },
                { pos: [-1, 3, 2], type: 'oak_planks' }, { pos: [0, 3, 2], type: 'oak_planks' }, { pos: [1, 3, 2], type: 'oak_planks' },
                // Roof (Pyramid style)
                ...Array.from({length: 5}, (_, x) => Array.from({length: 5}, (_, z) => ({ pos: [x-2, 4, z-2], type: 'oak_planks' }))).flat(),
                ...Array.from({length: 3}, (_, x) => Array.from({length: 3}, (_, z) => ({ pos: [x-1, 5, z-1], type: 'oak_planks' }))).flat(),
                { pos: [0, 6, 0], type: 'oak_planks' }
            ]
        },
        herobrine_shrine: {
            blocks: ['gold_block', 'cobblestone', 'netherrack', 'redstone_torch'],
            structure: [
                // 3x3 Gold Base
                { pos: [-1, 0, -1], type: 'gold_block' }, { pos: [0, 0, -1], type: 'gold_block' }, { pos: [1, 0, -1], type: 'gold_block' },
                { pos: [-1, 0, 0], type: 'gold_block' }, { pos: [0, 0, 0], type: 'gold_block' }, { pos: [1, 0, 0], type: 'gold_block' },
                { pos: [-1, 0, 1], type: 'gold_block' }, { pos: [0, 0, 1], type: 'gold_block' }, { pos: [1, 0, 1], type: 'gold_block' },
                // Center
                { pos: [0, 1, 0], type: 'cobblestone' },
                // Top
                { pos: [0, 2, 0], type: 'netherrack' },
                // "Torches" (Redstone Torches)
                { pos: [-1, 1, 0], type: 'redstone_torch' }, { pos: [1, 1, 0], type: 'redstone_torch' },
                { pos: [0, 1, -1], type: 'redstone_torch' }, { pos: [0, 1, 1], type: 'redstone_torch' }
            ]
        },
        creeper_pixel_art: {
            blocks: ['green_wool', 'obsidian'],
            structure: [
                // 8x8 Face (Green Wool Background + Obsidian Features)
                // Row 0 (Bottom)
                { pos: [-3, 1, 0], type: 'green_wool' }, { pos: [-2, 1, 0], type: 'green_wool' }, { pos: [-1, 1, 0], type: 'obsidian' }, { pos: [0, 1, 0], type: 'green_wool' }, { pos: [1, 1, 0], type: 'green_wool' }, { pos: [2, 1, 0], type: 'obsidian' }, { pos: [3, 1, 0], type: 'green_wool' }, { pos: [4, 1, 0], type: 'green_wool' },
                // Row 1
                { pos: [-3, 2, 0], type: 'green_wool' }, { pos: [-2, 2, 0], type: 'green_wool' }, { pos: [-1, 2, 0], type: 'obsidian' }, { pos: [0, 2, 0], type: 'obsidian' }, { pos: [1, 2, 0], type: 'obsidian' }, { pos: [2, 2, 0], type: 'obsidian' }, { pos: [3, 2, 0], type: 'green_wool' }, { pos: [4, 2, 0], type: 'green_wool' },
                // Row 2
                { pos: [-3, 3, 0], type: 'green_wool' }, { pos: [-2, 3, 0], type: 'green_wool' }, { pos: [-1, 3, 0], type: 'obsidian' }, { pos: [0, 3, 0], type: 'obsidian' }, { pos: [1, 3, 0], type: 'obsidian' }, { pos: [2, 3, 0], type: 'obsidian' }, { pos: [3, 3, 0], type: 'green_wool' }, { pos: [4, 3, 0], type: 'green_wool' },
                // Row 3
                { pos: [-3, 4, 0], type: 'green_wool' }, { pos: [-2, 4, 0], type: 'green_wool' }, { pos: [-1, 4, 0], type: 'green_wool' }, { pos: [0, 4, 0], type: 'obsidian' }, { pos: [1, 4, 0], type: 'obsidian' }, { pos: [2, 4, 0], type: 'green_wool' }, { pos: [3, 4, 0], type: 'green_wool' }, { pos: [4, 4, 0], type: 'green_wool' },
                // Row 4
                { pos: [-3, 5, 0], type: 'green_wool' }, { pos: [-2, 5, 0], type: 'obsidian' }, { pos: [-1, 5, 0], type: 'obsidian' }, { pos: [0, 5, 0], type: 'green_wool' }, { pos: [1, 5, 0], type: 'green_wool' }, { pos: [2, 5, 0], type: 'obsidian' }, { pos: [3, 5, 0], type: 'obsidian' }, { pos: [4, 5, 0], type: 'green_wool' },
                // Row 5
                { pos: [-3, 6, 0], type: 'green_wool' }, { pos: [-2, 6, 0], type: 'obsidian' }, { pos: [-1, 6, 0], type: 'obsidian' }, { pos: [0, 6, 0], type: 'green_wool' }, { pos: [1, 6, 0], type: 'green_wool' }, { pos: [2, 6, 0], type: 'obsidian' }, { pos: [3, 6, 0], type: 'obsidian' }, { pos: [4, 6, 0], type: 'green_wool' },
                // Row 6
                { pos: [-3, 7, 0], type: 'green_wool' }, { pos: [-2, 7, 0], type: 'green_wool' }, { pos: [-1, 7, 0], type: 'green_wool' }, { pos: [0, 7, 0], type: 'green_wool' }, { pos: [1, 7, 0], type: 'green_wool' }, { pos: [2, 7, 0], type: 'green_wool' }, { pos: [3, 7, 0], type: 'green_wool' }, { pos: [4, 7, 0], type: 'green_wool' },
                // Row 7
                { pos: [-3, 8, 0], type: 'green_wool' }, { pos: [-2, 8, 0], type: 'green_wool' }, { pos: [-1, 8, 0], type: 'green_wool' }, { pos: [0, 8, 0], type: 'green_wool' }, { pos: [1, 8, 0], type: 'green_wool' }, { pos: [2, 8, 0], type: 'green_wool' }, { pos: [3, 8, 0], type: 'green_wool' }, { pos: [4, 8, 0], type: 'green_wool' }
            ]
        },
        nether_portal: {
            blocks: ['obsidian'],
            structure: [
                { pos: [-1, 0, 0], type: 'obsidian' }, { pos: [0, 0, 0], type: 'obsidian' }, { pos: [1, 0, 0], type: 'obsidian' }, { pos: [2, 0, 0], type: 'obsidian' },
                { pos: [-1, 1, 0], type: 'obsidian' }, { pos: [2, 1, 0], type: 'obsidian' },
                { pos: [-1, 2, 0], type: 'obsidian' }, { pos: [2, 2, 0], type: 'obsidian' },
                { pos: [-1, 3, 0], type: 'obsidian' }, { pos: [2, 3, 0], type: 'obsidian' },
                { pos: [-1, 4, 0], type: 'obsidian' }, { pos: [0, 4, 0], type: 'obsidian' }, { pos: [1, 4, 0], type: 'obsidian' }, { pos: [2, 4, 0], type: 'obsidian' }
            ]
        },
        simple_tree: {
            blocks: ['oak_log', 'green_wool'],
            structure: [
                { pos: [0, 0, 0], type: 'oak_log' }, { pos: [0, 1, 0], type: 'oak_log' }, { pos: [0, 2, 0], type: 'oak_log' }, { pos: [0, 3, 0], type: 'oak_log' },
                { pos: [-1, 2, 0], type: 'green_wool' }, { pos: [1, 2, 0], type: 'green_wool' }, { pos: [0, 2, -1], type: 'green_wool' }, { pos: [0, 2, 1], type: 'green_wool' },
                { pos: [-1, 3, 0], type: 'green_wool' }, { pos: [1, 3, 0], type: 'green_wool' }, { pos: [0, 3, -1], type: 'green_wool' }, { pos: [0, 3, 1], type: 'green_wool' },
                { pos: [-1, 3, -1], type: 'green_wool' }, { pos: [1, 3, 1], type: 'green_wool' }, { pos: [-1, 3, 1], type: 'green_wool' }, { pos: [1, 3, -1], type: 'green_wool' },
                { pos: [0, 4, 0], type: 'green_wool' }
            ]
        },
        heart_pixel_art: {
            blocks: ['black_wool', 'red_wool', 'white_wool'],
            structure: [
                // Row 0 (Bottom Tip)
                { pos: [0, 0, 0], type: 'black_wool' },
                // Row 1
                { pos: [-1, 1, 0], type: 'black_wool' }, { pos: [0, 1, 0], type: 'red_wool' }, { pos: [1, 1, 0], type: 'black_wool' },
                // Row 2
                { pos: [-2, 2, 0], type: 'black_wool' }, { pos: [-1, 2, 0], type: 'red_wool' }, { pos: [0, 2, 0], type: 'red_wool' }, { pos: [1, 2, 0], type: 'red_wool' }, { pos: [2, 2, 0], type: 'black_wool' },
                // Row 3
                { pos: [-3, 3, 0], type: 'black_wool' }, { pos: [-2, 3, 0], type: 'red_wool' }, { pos: [-1, 3, 0], type: 'red_wool' }, { pos: [0, 3, 0], type: 'red_wool' }, { pos: [1, 3, 0], type: 'red_wool' }, { pos: [2, 3, 0], type: 'red_wool' }, { pos: [3, 3, 0], type: 'black_wool' },
                // Row 4
                { pos: [-3, 4, 0], type: 'black_wool' }, { pos: [-2, 4, 0], type: 'red_wool' }, { pos: [-1, 4, 0], type: 'red_wool' }, { pos: [0, 4, 0], type: 'red_wool' }, { pos: [1, 4, 0], type: 'red_wool' }, { pos: [2, 4, 0], type: 'red_wool' }, { pos: [3, 4, 0], type: 'black_wool' },
                // Row 5 (Top Lobes Start - with White Glint)
                { pos: [-3, 5, 0], type: 'black_wool' }, { pos: [-2, 5, 0], type: 'white_wool' }, { pos: [-1, 5, 0], type: 'red_wool' }, { pos: [0, 5, 0], type: 'black_wool' }, { pos: [1, 5, 0], type: 'red_wool' }, { pos: [2, 5, 0], type: 'red_wool' }, { pos: [3, 5, 0], type: 'black_wool' },
                // Row 6 (Top of Lobes)
                { pos: [-2, 6, 0], type: 'black_wool' }, { pos: [-1, 6, 0], type: 'black_wool' }, { pos: [1, 6, 0], type: 'black_wool' }, { pos: [2, 6, 0], type: 'black_wool' }
            ]
        },
        sword_pixel_art: {
            blocks: ['black_wool', 'brown_wool', 'cyan_wool', 'diamond_block'],
            structure: [
                // Handle
                { pos: [0, 0, 0], type: 'black_wool' }, // Pommel
                { pos: [0, 1, 0], type: 'brown_wool' },
                { pos: [0, 2, 0], type: 'brown_wool' },
                // Guard
                { pos: [-2, 3, 0], type: 'black_wool' }, { pos: [-1, 3, 0], type: 'cyan_wool' }, { pos: [0, 3, 0], type: 'cyan_wool' }, { pos: [1, 3, 0], type: 'cyan_wool' }, { pos: [2, 3, 0], type: 'black_wool' },
                // Blade
                { pos: [-1, 4, 0], type: 'cyan_wool' }, { pos: [0, 4, 0], type: 'diamond_block' }, { pos: [1, 4, 0], type: 'cyan_wool' },
                { pos: [-1, 5, 0], type: 'cyan_wool' }, { pos: [0, 5, 0], type: 'diamond_block' }, { pos: [1, 5, 0], type: 'cyan_wool' },
                { pos: [-1, 6, 0], type: 'cyan_wool' }, { pos: [0, 6, 0], type: 'diamond_block' }, { pos: [1, 6, 0], type: 'cyan_wool' },
                { pos: [-1, 7, 0], type: 'cyan_wool' }, { pos: [0, 7, 0], type: 'diamond_block' }, { pos: [1, 7, 0], type: 'cyan_wool' },
                { pos: [-1, 8, 0], type: 'cyan_wool' }, { pos: [0, 8, 0], type: 'diamond_block' }, { pos: [1, 8, 0], type: 'cyan_wool' },
                // Tip
                { pos: [0, 9, 0], type: 'cyan_wool' }
            ]
        },
        freestyle: {
            blocks: ['stone', 'grass_block', 'dirt', 'cobblestone', 'oak_planks', 'glass', 'oak_log', 'white_wool', 'tnt', 'diamond_block'],
            structure: []
        }
    };

    const blueprintNames = {
        freestyle: "Puente Libre",
        beacon: "Faro (Beacon)",
        villager_house: "Casa de Aldeano",
        herobrine_shrine: "Altar de Herobrine",
        nether_portal: "Portal al Nether",
        simple_tree: "Árbol Simple",
        creeper_pixel_art: "Pixel Art: Creeper",
        heart_pixel_art: "Pixel Art: Corazón",
        sword_pixel_art: "Pixel Art: Espada"
    };

    // Lista completa de bloques disponibles para el inventario
    const availableBlocks = [
        'stone', 'grass_block', 'dirt', 'cobblestone', 'oak_planks', 'bedrock', 'sand', 
        'gravel', 'gold_ore', 'iron_ore', 'coal_ore', 'oak_log', 'glass', 
        'white_wool', 'red_wool', 'green_wool', 'blue_wool', 'yellow_wool', 
        'black_wool', 'brown_wool', 'cyan_wool', 'obsidian', 'diamond_block', 'gold_block', 
        'iron_block', 'emerald_block', 'brick', 'tnt', 'beacon', 'netherrack', 'redstone_torch',
        'end_stone', 'emerald_ore', 'sponge', 'planks_birch', 'planks_spruce'
    ];
    
    function initBlockPlacer() {
        activeGameMode = 'block-placer';
        if (isThreeJsInitialized) {
            // Si ya está inicializado, mover el canvas si es necesario y reiniciar
            if (renderer && renderer.domElement.parentNode !== blockPlacerArea) {
                blockPlacerArea.appendChild(renderer.domElement);
            }
            resetBlockPlacerGame();
            onWindowResize(); // Forzar ajuste de tamaño
            return;
        }
        if (typeof THREE === 'undefined') return;
        isThreeJsInitialized = true;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1f1f1f);
        
        // Asegurar que el renderer esté en el contenedor correcto
        if (renderer && renderer.domElement.parentNode !== blockPlacerArea) {
            blockPlacerArea.appendChild(renderer.domElement);
        }

        camera = new THREE.PerspectiveCamera(75, blockPlacerArea.clientWidth / blockPlacerArea.clientHeight, 1, 10000);
        camera.position.set(0, 170, 400); // Altura de ojos aprox
        camera.rotation.order = 'YXZ'; // Importante para rotación FPS

        // Cargar el modelo de la antorcha
        const gltfLoader = new THREE.GLTFLoader();
        gltfLoader.load('models/torch.glb', (gltf) => {
            torchModel = gltf.scene;
            // Ajustar escala (asumiendo que el modelo viene en escala 1 unidad = 1 metro)
            // Un bloque es 100 unidades. Ajustamos la antorcha para que sea proporcional.
            torchModel.scale.set(30, 30, 30); 
        }, undefined, (error) => console.error('Error cargando torch.glb:', error));

        // Cargar el modelo del personaje (Bot)
        gltfLoader.load('models/character.glb', (gltf) => {
            characterModel = gltf.scene;
            // Ajustar escala y rotación si es necesario
            characterModel.scale.set(15, 15, 15); 
            characterModel.traverse(child => { if (child.isMesh) child.castShadow = true; });
        }, undefined, (error) => console.error('Error cargando character.glb:', error));

        const textureLoader = new THREE.TextureLoader();
        textureLoader.setPath('images/hotbar/blocks/');
        const allBlockTypes = new Set();
        // Cargar bloques de blueprints Y del inventario general
        Object.values(blueprints).forEach(bp => bp.blocks.forEach(b => allBlockTypes.add(b)));
        availableBlocks.forEach(b => allBlockTypes.add(b));

        const blockColors = {
            'iron_block': 0xe6e6e6,
            'beacon': 0x75e1ff,
            'cobblestone': 0x6b6b6b,
            'oak_planks': 0xa07b4e,
            'glass': 0xcceeff,
            'gold_block': 0xffd700,
            'netherrack': 0x6e2c2c,
            'blue_wool': 0x334cb2,
            'grass_block': 0x5b8c38,
            'dirt': 0x825e38,
            'stone': 0x7d7d7d,
            'sand': 0xdecfa3,
            'red_wool': 0x9e2b27,
            'green_wool': 0x4b6b26,
            'diamond_block': 0x61e3d6,
            'obsidian': 0x14121d,
            'tnt': 0xdb2e2e,
            'brick': 0x966c55,
            'oak_log': 0x6b5130,
            'bedrock': 0x222222,
            'redstone_torch': 0xff0000, // Color de respaldo para el icono
            'black_wool': 0x141414,
            'brown_wool': 0x724728,
            'cyan_wool': 0x158991,
            'end_stone': 0xdfebb5,
            'emerald_ore': 0x2b9e46,
            'sponge': 0xe3e34b,
            'planks_birch': 0xd7c185,
            'planks_spruce': 0x694f30
        };

        // Configuración para bloques con múltiples caras (Orden: Derecha, Izquierda, Arriba, Abajo, Frente, Atrás)
        const multiFaceBlocks = {
            'grass_block': ['grass_block_side.png', 'grass_block_side.png', 'grass_block_top.png', 'dirt.png', 'grass_block_side.png', 'grass_block_side.png'],
            'oak_log': ['oak_log.png', 'oak_log.png', 'oak_log_top.png', 'oak_log_top.png', 'oak_log.png', 'oak_log.png'],
            'tnt': ['tnt_side.png', 'tnt_side.png', 'tnt_top.png', 'tnt_bottom.png', 'tnt_side.png', 'tnt_side.png']
        };

        allBlockTypes.forEach(blockType => {
            if (multiFaceBlocks[blockType]) {
                // Bloques con múltiples texturas
                const textures = multiFaceBlocks[blockType];
                const materialArray = textures.map(texName => {
                    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
                    // CORRECCIÓN: Tinte verde para la parte superior del pasto
                    if (texName.includes('grass_block_top')) {
                        mat.color.setHex(0x7cfc00); // Verde vibrante estilo Minecraft
                    }
                    textureLoader.load(texName, 
                        (tex) => { tex.magFilter = THREE.NearestFilter; mat.map = tex; mat.needsUpdate = true; },
                        undefined,
                        () => { 
                            mat.color.setHex(blockColors[blockType] || 0xff00ff); 
                            mat.map = null; 
                            mat.needsUpdate = true; 
                        }
                    );
                    return mat;
                });
                materials[blockType] = materialArray;
            } else {
                // Bloques normales (una sola textura)
                const matParams = { color: 0xffffff };
                if (blockType === 'glass' || blockType === 'beacon') {
                    matParams.transparent = true;
                    matParams.opacity = 0.6;
                }
                const material = new THREE.MeshLambertMaterial(matParams);

                textureLoader.load(
                    `${blockType}.png`,
                    (texture) => { texture.magFilter = THREE.NearestFilter; material.map = texture; material.needsUpdate = true; },
                    undefined,
                    (err) => { 
                        console.warn(`Fallback color for ${blockType}`); 
                        material.color.setHex(blockColors[blockType] || 0xff00ff); 
                        material.map = null; 
                        material.needsUpdate = true; 
                    }
                );
                materials[blockType] = material;
            }
        });
        
        cubeGeo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        const rollOverMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true });
        rollOverMesh = new THREE.Mesh(cubeGeo, rollOverMaterial);
        scene.add(rollOverMesh);

        const ambientLight = new THREE.AmbientLight(0x808080);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        scene.add(directionalLight);

        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(blockPlacerArea.clientWidth, blockPlacerArea.clientHeight);
        blockPlacerArea.appendChild(renderer.domElement);
        scene.add(hologramGroup);

        renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
        renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
        renderer.domElement.addEventListener('contextmenu', event => event.preventDefault(), false);
        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
        document.addEventListener('pointerlockchange', onPointerLockChange, false);
        hotbarSlots.addEventListener('click', onHotbarClick, false);
        objectiveBtn.addEventListener('click', openBlueprintSelector);
        document.getElementById('close-blueprint-selector').addEventListener('click', closeBlueprintSelector);
        blockStartText.addEventListener('click', startBlockPlacerGame);
        blockRestartBtn.addEventListener('click', resetBlockPlacerGame);
        bedwarsStartText.addEventListener('click', startBedwarsGame);
        populateInventory(); // Llenar el inventario visualmente
        populateBlueprintSelector(); // Llenar el selector de blueprints

        // Asegurar que el canvas no tape el texto
        // Crear Mira (Crosshair)
        if (!document.getElementById('aim-crosshair')) {
            const crosshair = document.createElement('div');
            crosshair.id = 'aim-crosshair';
            crosshair.style.cssText = `
                position: absolute; top: 50%; left: 50%; width: 10px; height: 10px;
                background-color: transparent; border: 2px solid rgba(255, 255, 255, 0.8);
                border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; z-index: 100;
                display: none;
            `;
            blockPlacerArea.appendChild(crosshair);
        }
        
        animate();
        resetBlockPlacerGame();
    }

    function initBedwarsPvP() {
        if (!isThreeJsInitialized) {
            // Si no se ha inicializado Three.js (no se ha entrado a Block Placer), inicializarlo
            initBlockPlacer(); 
        }
        activeGameMode = 'bedwars';
        
        // Mover el renderer al área de Bedwars
        if (renderer && renderer.domElement.parentNode !== bedwarsArea) {
            bedwarsArea.appendChild(renderer.domElement);
        }
        
        resetBedwarsGame();
        // Forzar redimensionado después de resetear y mostrar
        setTimeout(() => {
            onWindowResize();
        }, 50);
    }

    function resetBedwarsGame() {
        bedwarsRunning = false;
        blockPlacerRunning = false; // Asegurar que el otro modo pare
        botHealth = 20;
        playerHealth = 20;
        botBedAlive = true;
        playerBedAlive = true;
        updateHealthDisplay(botHealthContainer, botHealth);
        updateHealthDisplay(playerHealthContainer, playerHealth);
        botBedStatusDisplay.textContent = '❤️';
        playerBedStatusDisplay.textContent = '❤️';
        bedwarsStartText.style.display = 'block';
        
        // Limpiar escena
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }
        cubes = [];
        hologramGroup.clear();

        // Configurar escena Bedwars
        scene.background = new THREE.Color(0x87CEEB); // Cielo azul
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 200, 100);
        scene.add(dirLight);

        // --- GENERACIÓN DE ISLAS (Estilo Hycraft) ---
        
        // Isla del Jugador (Inicio)
        createIsland(0, -20, 0, 'player');
        createBed(0, 0, 30, 'player');

        // Isla del Bot (Enemigo)
        createIsland(0, -20, -500, 'bot');
        createBed(0, 0, -530, 'bot');

        // Puente Central (Pre-construido para facilitar el PvP)
        const bridgeGeo = new THREE.BoxGeometry(100, 10, 500);
        const bridgeMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Lana blanca
        const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(0, -20, -250);
        scene.add(bridge);
        cubes.push(bridge);

        // Bot (Cápsula Roja)
        if (characterModel) {
            botMesh = characterModel.clone();
        } else {
            // Fallback si no hay modelo
            const botGeo = new THREE.CapsuleGeometry(15, 30, 4, 8);
            const botMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            botMesh = new THREE.Mesh(botGeo, botMat);
        }
        botMesh.position.set(0, 10, -500); // Posición inicial en su isla
        scene.add(botMesh);

        // Resetear cámara
        camera.position.set(0, 60, 100);
        camera.rotation.set(0, 0, 0);
    }

    function createIsland(x, y, z, type) {
        // Base cónica de la isla
        const geometry = new THREE.CylinderGeometry(120, 50, 100, 8);
        const material = new THREE.MeshLambertMaterial({ color: 0xdfebb5 }); // End Stone
        const islandBase = new THREE.Mesh(geometry, material);
        islandBase.position.set(x, y - 50, z);
        scene.add(islandBase);

        // Superficie plana
        const topGeo = new THREE.BoxGeometry(200, 10, 200);
        const topMat = new THREE.MeshLambertMaterial({ color: type === 'player' ? 0x5b8c38 : 0x87CEEB }); // Pasto o Arcilla
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.set(x, y, z);
        scene.add(top);
        cubes.push(top); // Colisión
    }

    function createBed(x, y, z, type) {
        const bedGeo = new THREE.BoxGeometry(40, 20, 70);
        const bedMat = new THREE.MeshLambertMaterial({ color: type === 'player' ? 0x00ff00 : 0xff0000 });
        const bed = new THREE.Mesh(bedGeo, bedMat);
        bed.position.set(x, y + 15, z);
        bed.userData = { isBed: true, team: type }; // Metadatos para identificar la cama
        scene.add(bed);
        cubes.push(bed);
    }

    function updateHealthDisplay(container, health) {
        container.innerHTML = '';
        // Minecraft: 20 HP = 10 Corazones.
        const maxHearts = 10;
        const fullHearts = Math.floor(health / 2);
        const halfHeart = health % 2 === 1;
        
        for (let i = 0; i < maxHearts; i++) {
            const img = document.createElement('img');
            img.className = 'heart-icon';
            if (i < fullHearts) {
                img.src = 'images/hotbar/heart/full.png'; // Textura oficial llena
            } else if (i === fullHearts && halfHeart) {
                img.src = 'images/hotbar/heart/half.png'; // Textura oficial media
            } else {
                img.src = 'images/hotbar/heart/container.png'; // Textura oficial vacía (borde)
            }
            // Fallback por si no carga la imagen
            img.onerror = () => { img.style.backgroundColor = i < fullHearts ? 'red' : '#333'; img.src = ''; };
            container.appendChild(img);
        }
    }

    function startBedwarsGame() {
        bedwarsRunning = true;
        bedwarsStartText.style.display = 'none';
        // Asegurar que el canvas tenga foco y tamaño correcto
        onWindowResize();
        renderer.domElement.requestPointerLock();
    }

    // --- LÓGICA ESPECÍFICA DE BLOCK PLACER (Vuelo / Gravedad Antigua) ---
    function updateBlockPlacerLogic(delta) {
        const speed = 600 * delta;
        
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();

        const velocity = new THREE.Vector3();
        if (moveForward) velocity.add(forward);
        if (moveBackward) velocity.add(forward.clone().negate());
        if (moveRight) velocity.add(right);
        if (moveLeft) velocity.add(right.clone().negate());
        velocity.normalize().multiplyScalar(speed);

        // Movimiento estilo "Creative" (Vuelo libre)
        camera.position.x += velocity.x;
        if (checkCollision(camera.position)) camera.position.x -= velocity.x;
        
        camera.position.z += velocity.z;
        if (checkCollision(camera.position)) camera.position.z -= velocity.z;
        
        if (moveUp) {
            camera.position.y += speed;
            if (checkCollision(camera.position)) camera.position.y -= speed;
        }
        if (moveDown) {
            camera.position.y -= speed;
            if (checkCollision(camera.position)) camera.position.y += speed;
        }
    }

    // --- LÓGICA ESPECÍFICA DE BEDWARS (Físicas, Gravedad, Bot) ---
    function updateBedwarsLogic(delta, time) {
        const speed = 600 * delta;
        
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, camera.up).normalize();

        const velocity = new THREE.Vector3();
        if (moveForward) velocity.add(forward);
        if (moveBackward) velocity.add(forward.clone().negate());
        if (moveRight) velocity.add(right);
        if (moveLeft) velocity.add(right.clone().negate());
        velocity.normalize().multiplyScalar(speed);

        // 1. Movimiento Horizontal con Colisiones
        const oldPos = camera.position.clone();
        camera.position.x += velocity.x;
        camera.position.z += velocity.z;
        
        if (checkCollision(camera.position)) {
            camera.position.x = oldPos.x;
            camera.position.z = oldPos.z;
        }

        // 2. Movimiento Vertical (Gravedad y Salto)
        playerVelocity.y -= 9.8 * 100.0 * delta; // Gravedad
        camera.position.y += playerVelocity.y * delta;

        if (checkCollision(camera.position)) {
            if (playerVelocity.y < 0) {
                canJump = true;
                // Ajuste para quedarse justo encima del bloque
                camera.position.y = Math.floor(camera.position.y / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE * 1.5;
            }
            playerVelocity.y = 0;
        }

        // Muerte por caída al vacío
        if (camera.position.y < -300) {
            playerHealth = 0; // Esto activará la lógica de respawn en el bloque del bot
        }

        // 3. Lógica del Bot
        if (botMesh && botHealth > 0) {
            updateBedwarsBot(delta, time);
        }
    }

    function updateBedwarsBot(delta, time) {
        const botSpeed = 250 * delta;
        const dist = botMesh.position.distanceTo(camera.position);
        
        // Mirar al jugador
        botMesh.lookAt(camera.position.x, botMesh.position.y, camera.position.z);
        
        // IA Simple: Ir a por la cama o el jugador
        let targetPos = playerBedAlive ? new THREE.Vector3(0, 0, 30) : camera.position;
        if (dist < 100) targetPos = camera.position; // Priorizar defensa propia

        const moveDir = targetPos.clone().sub(botMesh.position).normalize();
        moveDir.y = 0; 

        // Moverse
        if (dist > 60 && botMesh.position.distanceTo(targetPos) > 40) {
            botMesh.position.add(moveDir.multiplyScalar(botSpeed));
        } else {
            // Atacar
            if (time - lastBotAttackTime > 1000) { 
                playerHealth -= 2;
                updateHealthDisplay(playerHealthContainer, playerHealth);
                lastBotAttackTime = time;
                document.body.style.backgroundColor = 'rgba(255,0,0,0.2)';
                setTimeout(() => document.body.style.backgroundColor = '', 100);
                
                if (playerHealth <= 0) {
                    if (playerBedAlive) {
                        playerHealth = 20;
                        updateHealthDisplay(playerHealthContainer, playerHealth);
                        camera.position.set(0, 60, 100);
                        playerVelocity.y = 0; // Resetear velocidad de caída
                        window.showNotification("¡Has muerto! Respawning...", "error");
                    } else {
                        alert("¡Cama destruida y has muerto! Fin del juego.");
                        resetBedwarsGame();
                        document.exitPointerLock();
                    }
                }
            }
            // Atacar cama
            if (playerBedAlive && botMesh.position.distanceTo(new THREE.Vector3(0, 0, 30)) < 60) {
                playerBedAlive = false;
                playerBedStatusDisplay.textContent = '❌ DESTRUIDA';
                window.showNotification("¡TU CAMA HA SIDO DESTRUIDA!", "error");
            }
        }
        
        // Gravedad simple del bot
        botMesh.position.y = -5; 
    }

    function animate() { 
        requestAnimationFrame(animate);

        // Corrección automática de pantalla negra (Resize)
        if (renderer && camera) {
            const container = activeGameMode === 'bedwars' ? bedwarsArea : blockPlacerArea;
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                if (renderer.domElement.width !== container.clientWidth || renderer.domElement.height !== container.clientHeight) {
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(container.clientWidth, container.clientHeight);
                }
            }
        }

        if ((blockPlacerRunning || bedwarsRunning) && isLocked && !inventoryOpen) {
            const time = performance.now();
            const delta = (time - prevTime) / 1000;
            
            if (blockPlacerRunning) {
                updateBlockPlacerLogic(delta);
            } else if (bedwarsRunning) {
                updateBedwarsLogic(delta, time);
            }

            prevTime = time;
        } else {
            prevTime = performance.now();
        }

        if(renderer) renderer.render(scene, camera); 
    }

    function checkCollision(position) {
        const playerRadius = 30; // Radio de colisión del jugador
        for (let i = 0; i < cubes.length; i++) {
            const cube = cubes[i];
            // Ignorar objetos sin geometría (como modelos GLTF/Grupos) o el suelo
            if (!cube.geometry || cube.geometry.type === 'PlaneGeometry') continue; 

            const min = cube.position.clone().subScalar(BLOCK_SIZE / 2);
            const max = cube.position.clone().addScalar(BLOCK_SIZE / 2);

            if (position.x > min.x - playerRadius && position.x < max.x + playerRadius &&
                position.y > min.y - playerRadius && position.y < max.y + playerRadius &&
                position.z > min.z - playerRadius && position.z < max.z + playerRadius) {
                return true;
            }
        }
        return false;
    }

    function onWindowResize() { 
        if (!isThreeJsInitialized || !renderer || !camera) return; 
        
        // Detectar qué contenedor está visible (tiene dimensiones)
        const container = (bedwarsArea.offsetParent !== null) ? bedwarsArea : blockPlacerArea;
        
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            camera.aspect = container.clientWidth / container.clientHeight; 
            camera.updateProjectionMatrix(); 
            renderer.setSize(container.clientWidth, container.clientHeight); 
        }
    }
    
    function onKeyDown(event) { 
        if (!blockPlacerRunning && !bedwarsRunning) return; 
        if (event.code === 'KeyE') { toggleInventory(); return; }
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
            case 'Space': 
                if (blockPlacerRunning) {
                    moveUp = true; 
                } else if (bedwarsRunning && canJump) {
                    playerVelocity.y += 350; // Fuerza de salto
                    canJump = false;
                }
                event.preventDefault(); 
                break;
            case 'ShiftLeft': case 'ShiftRight': moveDown = true; break;
            case 'ControlLeft': case 'ControlRight': moveDown = true; break;
        }
        if (event.keyCode >= 49 && event.keyCode <= 57) { const slotIndex = event.keyCode - 49; if (slotIndex < hotbarItems.length) { setHotbarSelection(slotIndex); } } 
    }

    function onKeyUp(event) {
        if (!blockPlacerRunning && !bedwarsRunning) return;
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
            case 'Space': moveUp = false; break;
            case 'ShiftLeft': case 'ShiftRight':
            case 'ControlLeft': case 'ControlRight': moveDown = false; break;
        }
    }

    function onPointerLockChange() {
        isLocked = document.pointerLockElement === renderer.domElement;
        const crosshair = document.getElementById('aim-crosshair');
        if (crosshair) crosshair.style.display = isLocked ? 'block' : 'none';
    }

    function toggleInventory() {
        const inventoryEl = document.getElementById('block-inventory');
        inventoryOpen = !inventoryOpen;

        if (inventoryOpen) {
            inventoryEl.classList.remove('hidden');
            document.exitPointerLock(); // Liberar ratón para usar inventario
        } else {
            inventoryEl.classList.add('hidden');
            renderer.domElement.requestPointerLock(); // Volver al juego
        }
    }

    function openBlueprintSelector() {
        document.getElementById('blueprint-selector').classList.remove('hidden');
        if (isLocked) document.exitPointerLock();
    }

    function closeBlueprintSelector() {
        document.getElementById('blueprint-selector').classList.add('hidden');
    }

    function populateBlueprintSelector() {
        const grid = document.getElementById('blueprint-grid');
        grid.innerHTML = '';
        Object.keys(blueprints).forEach(key => {
            const item = document.createElement('div');
            item.className = 'blueprint-item';
            item.textContent = blueprintNames[key] || key;
            
            item.addEventListener('click', () => {
                selectObjective(key);
                closeBlueprintSelector();
            });
            grid.appendChild(item);
        });
    }

    function selectObjective(key) {
        currentObjective = key;
        currentObjectiveDisplay.textContent = blueprintNames[key] || key;
        resetBlockPlacerGame();
    }

    function populateInventory() {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';
        availableBlocks.forEach(block => {
            const item = document.createElement('div');
            item.className = 'inventory-item';
            item.title = block.replace(/_/g, ' ');
            
            const img = document.createElement('img');
            img.src = `images/hotbar/blocks/${block}.png`;
            img.onerror = () => { img.style.display = 'none'; item.style.backgroundColor = '#ff00ff'; }; // Fallback visual
            
            item.appendChild(img);
            item.addEventListener('click', () => {
                hotbarItems[currentHotbarSlot] = block;
                updateHotbar();
                setHotbarSelection(currentHotbarSlot);
            });
            grid.appendChild(item);
        });
    }

    function onHotbarClick(event) { if (event.target.classList.contains('hotbar-slot')) { const slotIndex = parseInt(event.target.dataset.slot, 10); if (slotIndex < hotbarItems.length) { setHotbarSelection(slotIndex); } } }

    function loadObjective(objectiveName) {
        const blueprint = blueprints[objectiveName];
        hotbarItems = blueprint.blocks;
        updateHotbar();
        setHotbarSelection(0);

        hologramGroup.clear();
        blueprint.structure.forEach(hologram => {
            const hologramMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity: 0.3, transparent: true });
            const hologramCube = new THREE.Mesh(cubeGeo, hologramMaterial);
            hologramCube.position.set(
                hologram.pos[0] * BLOCK_SIZE + BLOCK_SIZE / 2, 
                hologram.pos[1] * BLOCK_SIZE + BLOCK_SIZE / 2, 
                hologram.pos[2] * BLOCK_SIZE + BLOCK_SIZE / 2
            );
            hologramCube.userData.originalPos = hologram.pos.join(',');
            hologramCube.userData.blockType = hologram.type;
            hologramGroup.add(hologramCube);
        });
        
        totalToBuild = blueprint.structure.length;
        if (objectiveName === 'freestyle') {
            const startPlane = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x333333 }));
            cubes = [startPlane];
            scene.add(startPlane);

            gridHelper = new THREE.GridHelper(5000, 50);
            scene.add(gridHelper);
        }
    }

    function updateHotbar() {
        hotbarSlots.innerHTML = '';
        hotbarItems.forEach((item, index) => {
            const slot = document.createElement('img');
            slot.src = `images/hotbar/blocks/${item}.png`;
            slot.classList.add('hotbar-slot');
            slot.dataset.slot = index;
            slot.title = item.replace(/_/g, ' ');
            hotbarSlots.appendChild(slot);
        });
    }

    function setHotbarSelection(index) {
        currentHotbarSlot = index;
        hotbarSelection.style.left = `${4 + index * 40}px`; // 4px initial offset + 40px per slot
        const currentBlockType = hotbarItems[currentHotbarSlot];
        rollOverMesh.material = materials[currentBlockType] ? new THREE.MeshBasicMaterial({ map: materials[currentBlockType].map, opacity: 0.5, transparent: true }) : new THREE.MeshBasicMaterial({ color: 0xff00ff, opacity: 0.5, transparent: true });
    }

    function startBlockPlacerGame() {
        if (blockPlacerRunning) return;
        blockPlacerRunning = true;
        blockStartText.style.display = 'none';
        rollOverMesh.visible = true;
        hotbarContainer.style.opacity = 1;
        objectiveBtn.disabled = true;

        blockStartTime = Date.now();
        blockTimerId = setInterval(() => {
            const elapsedTime = (Date.now() - blockStartTime) / 1000;
            blockTimerDisplay.textContent = elapsedTime.toFixed(2);
        }, 10);
    }
    
    function endBlockPlacerGame(completed = false) {
        if (!blockPlacerRunning) return;
        blockPlacerRunning = false;
        clearInterval(blockTimerId);
        rollOverMesh.visible = false;
        objectiveBtn.disabled = false;
        showBlockPlacerResults(completed);
    }

    function showBlockPlacerResults(completed) {
        const finalTime = (Date.now() - blockStartTime) / 1000;
        blockResultsModal.classList.remove('hidden');
        if (currentObjective === 'freestyle') {
            blockResultTitle.textContent = '¡Modo Libre!';
            blockRating.innerHTML = '<span>¡Sigue construyendo!</span>';
            blockFinalStats.innerHTML = `<div class="final-stat"><p>Bloques Colocados</p><span>${score}</span></div><div class="final-stat"><p>Tiempo</p><span>${finalTime.toFixed(2)}s</span></div>`;
        } else {
            if (completed) {
                levelUpSound.play();
                blockResultTitle.textContent = '¡Objetivo Completado!';
                blockRating.innerHTML = `<span>¡Excelente trabajo!</span>`;
                blockFinalStats.innerHTML = `<div class="final-stat"><p>Tiempo Final</p><span>${finalTime.toFixed(2)}s</span></div>`;
            } else {
                blockResultTitle.textContent = '¡Tiempo!';
                blockRating.innerHTML = '<span>¡La próxima vez será!</span>';
                blockFinalStats.innerHTML = `<div class="final-stat"><p>Progreso</p><span>${score}/${totalToBuild}</span></div><div class="final-stat"><p>Tiempo</p><span>${finalTime.toFixed(2)}s</span></div>`;
            }
        }
    }

    function resetBlockPlacerGame() {
        if (blockTimerId) clearInterval(blockTimerId);
        blockPlacerRunning = false;
        score = 0;
        
        // Limpieza TOTAL de la escena (igual que en Bedwars) para evitar conflictos
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }
        cubes = [];
        hologramGroup = new THREE.Group(); // Recrear grupo limpio
        gridHelper = null;

        // Restaurar ambiente de Block Placer
        scene.background = new THREE.Color(0x1f1f1f);
        const ambientLight = new THREE.AmbientLight(0x808080);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 0.75, 0.5).normalize();
        scene.add(directionalLight);

        // Re-añadir elementos base
        scene.add(rollOverMesh);
        scene.add(hologramGroup);
        
        // Resetear posición de cámara
        if (camera) { camera.position.set(0, 170, 400); camera.rotation.set(0, 0, 0); }

        loadObjective(currentObjective);

        blockScoreDisplay.textContent = currentObjective === 'freestyle' ? '0' : `0 / ${totalToBuild}`;
        blockTimerDisplay.textContent = '0.00';
        blockStartText.style.display = 'block';
        hotbarContainer.style.opacity = 0.5;
        objectiveBtn.disabled = false;
        blockResultsModal.classList.add('hidden');
    }

    function getMouseCanvasPosition(domElement, x, y) {
        const rect = domElement.getBoundingClientRect();
        return { x: ((x - rect.left) / rect.width) * 2 - 1, y: -((y - rect.top) / rect.height) * 2 + 1 };
    }

    function onDocumentMouseMove(event) {
        if (!isThreeJsInitialized || !blockPlacerRunning) return;
        
        if (isLocked) {
            // Rotación de cámara FPS
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;
            camera.rotation.y -= movementX * 0.002;
            camera.rotation.x -= movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
            
            mouse.set(0, 0); // Raycast siempre al centro
            raycaster.setFromCamera(mouse, camera);
            
            const objectsToIntersect = cubes.concat(hologramGroup.children);
            const intersects = raycaster.intersectObjects(objectsToIntersect, true); // True para detectar hijos (modelos)

            if (intersects.length > 0) {
                rollOverMesh.visible = true;
                const intersect = intersects[0];
                
                if (hologramGroup.children.includes(intersect.object)) {
                    rollOverMesh.position.copy(intersect.object.position);
                } else {
                    rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
                    rollOverMesh.position.divideScalar(BLOCK_SIZE).floor().multiplyScalar(BLOCK_SIZE).addScalar(BLOCK_SIZE / 2);
                }
            } else {
                rollOverMesh.visible = false;
            }
        }
    }

    function onDocumentMouseDown(event) {
        if ((!blockPlacerRunning && !bedwarsRunning) || !isThreeJsInitialized) return;
        
        if (!isLocked && !inventoryOpen) {
            renderer.domElement.requestPointerLock();
            return;
        }

        mouse.set(0, 0);
        raycaster.setFromCamera(mouse, camera);

        // Lógica de Bedwars (Ataque)
        if (bedwarsRunning) {
            if (event.button === 0) { // Click izquierdo
                // 1. Detectar golpe a bloques/camas
                const blockIntersects = raycaster.intersectObjects(cubes);
                if (blockIntersects.length > 0 && blockIntersects[0].distance < 100) {
                    const obj = blockIntersects[0].object;
                    if (obj.userData.isBed) {
                        if (obj.userData.team === 'bot') {
                            botBedAlive = false;
                            botBedStatusDisplay.textContent = '❌ DESTRUIDA';
                            scene.remove(obj); // Eliminar cama visualmente
                            cubes = cubes.filter(c => c !== obj);
                            window.showNotification("¡CAMA ENEMIGA DESTRUIDA!", "success");
                        }
                    }
                }

                // 2. Detectar golpe al bot
                const intersects = raycaster.intersectObject(botMesh);
                if (intersects.length > 0 && intersects[0].distance < 80) {
                    // Golpe al bot
                    botHealth -= 4; // Daño del jugador
                    updateHealthDisplay(botHealthContainer, botHealth);
                    
                    // Knockback simple
                    const knockbackDir = botMesh.position.clone().sub(camera.position).normalize();
                    botMesh.position.add(knockbackDir.multiplyScalar(50));
                    
                    if(hitSound) { hitSound.currentTime = 0; hitSound.play().catch(e => {}); }

                    if (botHealth <= 0) {
                        if (!botBedAlive) {
                            alert("¡VICTORIA! Cama destruida y Bot eliminado.");
                            resetBedwarsGame();
                            document.exitPointerLock();
                        } else {
                            // Bot respawn (simulado curándolo y moviéndolo)
                            botHealth = 20;
                            updateHealthDisplay(botHealthContainer, botHealth);
                            botMesh.position.set(0, 10, -500); // Vuelta a su base
                            window.showNotification("Bot eliminado (Respawning...)", "info");
                        }
                    }
                }
            }
            return; // No ejecutar lógica de bloques en Bedwars
        }
        
        // Objetos interactuables: cubos colocados, suelo y hologramas
        const objectsToIntersect = cubes.concat(hologramGroup.children);
        const intersects = raycaster.intersectObjects(objectsToIntersect, true); // True para detectar hijos (modelos)

        if (intersects.length > 0) {
            const intersect = intersects[0];

            // CLICK DERECHO (2) -> PONER BLOQUE
            if (event.button === 2) {
                if (!rollOverMesh.visible) return;

                const currentBlockType = hotbarItems[currentHotbarSlot];
                const newBlockPosition = new THREE.Vector3();
                
                if (hologramGroup.children.includes(intersect.object)) {
                    newBlockPosition.copy(intersect.object.position);
                } else {
                    newBlockPosition.copy(intersect.point).add(intersect.face.normal);
                    newBlockPosition.divideScalar(BLOCK_SIZE).floor().multiplyScalar(BLOCK_SIZE).addScalar(BLOCK_SIZE / 2);
                }

                // Evitar colocar bloques sobre sí mismos
                if (cubes.some(c => c.position.equals(newBlockPosition))) return;

                if (currentObjective === 'freestyle') {
                    placeBlock(newBlockPosition, currentBlockType);
                    score++;
                    blockScoreDisplay.textContent = score;
                } else {
                    const targetHologram = hologramGroup.children.find(h => h.position.equals(newBlockPosition));
                    if (targetHologram && targetHologram.userData.blockType === currentBlockType) {
                        placeBlock(newBlockPosition, currentBlockType);
                        score++;
                        blockScoreDisplay.textContent = `${score} / ${totalToBuild}`;
                        targetHologram.visible = false; // Ocultar el holograma
                        if (score === totalToBuild) {
                            endBlockPlacerGame(true);
                        }
                    }
                }
            } 
            // CLICK IZQUIERDO (0) -> ROMPER BLOQUE
            else if (event.button === 0) {
                // Verificar que no sea el suelo (en freestyle, cubes[0] es el suelo)
                const isGround = (currentObjective === 'freestyle' && intersect.object === cubes[0]);
                const isHologram = hologramGroup.children.includes(intersect.object);

                if (!isGround && !isHologram) {
                    // Buscar el objeto padre en 'cubes' (porque intersect.object puede ser una parte del modelo)
                    const blockToRemove = cubes.find(c => c === intersect.object || c.children.includes(intersect.object) || (c.isGroup && c.getObjectById(intersect.object.id)));
                    
                    if (blockToRemove) {
                        scene.remove(blockToRemove);
                        cubes = cubes.filter(c => c !== blockToRemove);
                    }

                    if(hitSound) { hitSound.currentTime = 0; hitSound.play().catch(e => {}); }
                    
                    if (currentObjective === 'freestyle') {
                        score--;
                        blockScoreDisplay.textContent = score;
                    } else {
                        // Si rompemos un bloque de objetivo, restaurar el holograma
                        const brokenPos = blockToRemove ? blockToRemove.position : intersect.object.position;
                        const targetHologram = hologramGroup.children.find(h => h.position.equals(brokenPos));
                        if (targetHologram) {
                            targetHologram.visible = true;
                            score--;
                            blockScoreDisplay.textContent = `${score} / ${totalToBuild}`;
                        }
                    }
                }
            }
        }
    }
    
    function placeBlock(position, type) {
        let newCube;
        if (type === 'redstone_torch' && torchModel) {
            newCube = torchModel.clone();
            newCube.position.copy(position);
            newCube.position.y -= BLOCK_SIZE / 3; // Bajar un poco para que parezca clavada
        } else {
            newCube = new THREE.Mesh(cubeGeo, materials[type]);
            newCube.position.copy(position);
        }
        
        scene.add(newCube);
        cubes.push(newCube);
        placeBlockSound.currentTime = 0;
        placeBlockSound.play();
    }

    // Inicialización al cargar la página
    resetCpsTestUI();
    resetAimGameUI();
    // initBlockPlacer se llama al cambiar de pestaña
});
