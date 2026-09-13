import * as THREE from 'three';
import { engine } from './core/Engine.js';
import { input } from './core/Input.js';
import { audio } from './core/AudioManager.js';
import { saveSystem } from './core/SaveSystem.js';
import { terrain } from './world/WorldTerrain.js';
import { dayNight } from './world/DayNightCycle.js';
import { environment } from './world/Environment.js';
import { player } from './entities/PlayerEvermean.js';
import { villagers } from './entities/CreatureVillagers.js';
import { colony } from './entities/EvermeanColony.js';
import { hud } from './ui/HUD.js';
import { buildMenu } from './ui/BuildMenu.js';
import { customizerUI } from './ui/CustomizerUI.js';
import { mainMenu } from './ui/MainMenu.js';

class Game {
  constructor() {
    this.isGameRunning = false;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.autosaveTimer = 0;
  }

  start() {
    const appContainer = document.getElementById('app');
    const settings = saveSystem.getSettings();

    // 1. Initialize Engine & Input
    engine.init(appContainer, settings);
    input.init(engine.renderer.domElement);
    audio.init();

    // 2. Build World
    terrain.generate(engine.scene);
    dayNight.init(engine.scene, engine);
    environment.generate(engine.scene, terrain);
    villagers.init(engine.scene, terrain);
    colony.init(engine.scene, terrain);

    // 3. Initialize HUD & Menus
    hud.init();
    buildMenu.init(player, engine);

    customizerUI.init((customConfig) => {
      this.startNewGameWithConfig(customConfig);
    });

    mainMenu.init({
      onContinue: () => {
        const slot = saveSystem.getLatestSaveSlot() || 'autosave';
        this.loadGameFromSlot(slot);
      },
      onNewGame: () => {
        customizerUI.show();
      },
      onSaveSlot: (slotId) => {
        this.saveCurrentGame(slotId);
      },
      onLoadSlot: (slotId) => {
        this.loadGameFromSlot(slotId);
      },
      onUpdateSettings: (newSettings) => {
        if (engine.camera && newSettings.fov) {
          engine.camera.fov = newSettings.fov;
          engine.camera.updateProjectionMatrix();
        }
        if (newSettings.mouseSensitivity) {
          input.sensitivity = newSettings.mouseSensitivity;
        }
      }
    });

    // 4. Setup Input Action Callbacks
    this.setupActions();

    // 5. Check if saves exist, show Main Menu
    mainMenu.show();

    // 6. Start Lifecycle Loop
    this.loop();
  }

  setupActions() {
    // Left-Click: TOTK Head-Slam
    input.onAction('Mouse0', () => {
      if (!this.isGameRunning || this.isPaused || buildMenu.isOpen) return;
      player.executeHeadSlam(environment, villagers);
    });

    // Right-Click: Secondary / Mantis Scythe / Elemental
    input.onAction('Mouse2', () => {
      if (!this.isGameRunning || this.isPaused || buildMenu.isOpen) return;
      player.executeSecondaryAction(villagers);
    });

    // C: Camouflage Disguise
    input.onAction('KeyC', () => {
      if (!this.isGameRunning || this.isPaused) return;
      player.toggleCamouflage();
    });

    // R: Root Burrow
    input.onAction('KeyR', () => {
      if (!this.isGameRunning || this.isPaused) return;
      player.toggleRootBurrow();
    });

    // Q or Right-Click secondary: Launch Spore / Acorn
    input.onAction('KeyQ', () => {
      if (!this.isGameRunning || this.isPaused) return;
      player.launchProjectile(villagers);
    });

    // B: Evermean Civilization Build Menu
    input.onAction('KeyB', () => {
      if (!this.isGameRunning || this.isPaused) return;
      buildMenu.toggle();
    });

    // V: First / Third Person Camera Toggle
    input.onAction('KeyV', () => {
      if (!this.isGameRunning || this.isPaused) return;
      player.toggleCameraMode();
    });

    // Escape: Pause / Main Menu
    input.onAction('Escape', () => {
      if (!this.isGameRunning) return;
      if (buildMenu.isOpen) {
        buildMenu.close();
        return;
      }
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        mainMenu.show();
      } else {
        mainMenu.hide();
        input.requestPointerLock();
      }
    });
  }

  startNewGameWithConfig(config) {
    player.init(engine.scene, engine.camera, terrain, engine, config.presetKey || 'oak', config);
    dayNight.setTime(1, 0.3);

    this.isGameRunning = true;
    this.isPaused = false;
    hud.show();
    input.requestPointerLock();
  }

  saveCurrentGame(slotId = 'autosave') {
    if (!this.isGameRunning) return;

    const gameState = {
      species: {
        name: player.speciesConfig.name,
        customization: player.speciesConfig
      },
      growth: {
        day: dayNight.day,
        timeOfDay: dayNight.timeOfDay,
        stage: player.growthStage,
        stageName: player.stageNames[player.growthStage - 1]
      },
      stats: {
        barkHp: player.barkHp,
        maxBarkHp: player.maxBarkHp,
        moisture: player.moisture,
        photosynthesis: player.photosynthesis,
        soilBiomass: player.soilBiomass
      },
      inventory: player.inventory,
      position: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z
      }
    };

    saveSystem.saveGame(slotId, gameState);
  }

  loadGameFromSlot(slotId) {
    const data = saveSystem.loadGame(slotId);
    if (!data) return;

    player.init(
      engine.scene,
      engine.camera,
      terrain,
      engine,
      data.species?.customization?.presetKey || 'oak',
      data.species?.customization || {}
    );

    if (data.growth) {
      dayNight.setTime(data.growth.day || 1, data.growth.timeOfDay || 0.3);
      player.growthStage = data.growth.stage || 1;
      player.rebuildModel();
    }

    if (data.stats) {
      player.barkHp = data.stats.barkHp;
      player.maxBarkHp = data.stats.maxBarkHp || 100;
      player.moisture = data.stats.moisture;
      player.photosynthesis = data.stats.photosynthesis;
      player.soilBiomass = data.stats.soilBiomass;
    }

    if (data.inventory) {
      player.inventory = { ...player.inventory, ...data.inventory };
    }

    if (data.position) {
      player.position.set(data.position.x, data.position.y, data.position.z);
    }

    this.isGameRunning = true;
    this.isPaused = false;
    hud.show();
    input.requestPointerLock();
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.isGameRunning && !this.isPaused) {
      // 1. World & Time
      dayNight.update(delta, player.position);
      terrain.update(delta, now * 0.001);
      environment.update(delta, now * 0.001);

      // 2. Player Controller
      player.update(delta, input, dayNight, environment);

      // 3. AI Creatures (Woodcutters, Beavers, Koroks, Deer)
      villagers.update(delta, player, engine, audio, colony);

      // 4. Civilization Colony
      colony.update(delta, player, now * 0.001);

      // 5. Engine Effects & HUD
      engine.update(delta);
      hud.update(player, dayNight);

      // Autosave periodically (every 60s)
      this.autosaveTimer += delta;
      if (this.autosaveTimer >= 60) {
        this.autosaveTimer = 0;
        this.saveCurrentGame('autosave');
      }
    }

    // Render Scene
    engine.render();
  }
}

// Robust Game Bootloader (handles both deferred module execution and DOMContentLoaded)
function bootGame() {
  console.log('Booting Life of an Evermean...');
  try {
    const game = new Game();
    game.start();
    console.log('Life of an Evermean successfully started!');
  } catch (err) {
    console.error('Failed to start game:', err);
    const errBox = document.createElement('div');
    errBox.style.cssText = 'position:fixed;top:20px;left:20px;right:20px;background:#3b0707;color:#fca5a5;padding:20px;border:2px solid #ef4444;border-radius:10px;z-index:999999;font-family:monospace;font-size:14px;white-space:pre-wrap;box-shadow:0 10px 40px rgba(0,0,0,0.9);';
    errBox.innerHTML = `<strong>⚠️ Game Initialization Error:</strong>\n\n${err.stack || err.message}\n\nPlease check browser console for more details.`;
    document.body.appendChild(errBox);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}

