import * as THREE from 'three';
import { engine } from './core/Engine.js';
import { input } from './core/Input.js';
import { audio } from './core/AudioManager.js';
import { saveSystem } from './core/SaveSystem.js';
import { accountSystem } from './core/AccountSystem.js';
import { campaign } from './core/CampaignManager.js';
import { creatorMode } from './core/CreatorMode.js';
import { arena } from './core/ArenaManager.js';
import { multiplayer } from './net/MultiplayerManager.js';
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
import { mobileControls } from './ui/MobileControls.js';
import { accountModal } from './ui/AccountModal.js';
import { multiplayerLobby } from './ui/MultiplayerLobbyModal.js';

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
    mobileControls.init();
    buildMenu.init(player, engine);
    accountModal.init();
    multiplayerLobby.init();
    multiplayerLobby.onEnterGame(() => {
      mainMenu.hide();
      if (!this.isGameRunning) {
        const savedConfig = accountSystem.getProfile()?.customEvermean;
        this.startNewGameWithConfig(savedConfig || {});
      } else {
        input.requestPointerLock();
      }
    });

    // 4. Initialize Core Expansion Systems
    creatorMode.init(engine.scene, terrain, player, villagers, dayNight, colony, environment);
    arena.init(engine.scene, terrain, player, engine);
    multiplayer.init(engine.scene, terrain, engine, player);

    multiplayer.onRoomChange((roomCode, mode) => {
      if (mode === 'arena') {
        arena.startArenaDuel(roomCode);
      } else {
        arena.stopArenaDuel();
      }
    });

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
      onCampaign: () => {
        const savedConfig = accountSystem.getProfile()?.customEvermean;
        this.startNewGameWithConfig(savedConfig || {});
        campaign.startCampaign(1);
      },
      onCreator: () => {
        const savedConfig = accountSystem.getProfile()?.customEvermean;
        this.startNewGameWithConfig(savedConfig || {});
        creatorMode.enable();
      },
      onMultiplayer: () => {
        multiplayerLobby.show();
      },
      onAccount: () => {
        accountModal.show();
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

    // 5. Setup Input Action Callbacks
    this.setupActions();

    // 6. Check if saves exist, show Main Menu
    mainMenu.show();

    // 7. Start Lifecycle Loop
    this.loop();
  }

  setupActions() {
    // Left-Click: TOTK Head-Slam
    input.onAction('Mouse0', () => {
      if (!this.isGameRunning || this.isPaused || buildMenu.isOpen) return;
      const wasDisguised = player.isDisguised;
      player.executeHeadSlam(environment, villagers);

      // Arena PvP clash
      if (multiplayer.currentRoom && multiplayer.roomMode === 'arena') {
        multiplayer.checkPvpHit(player.position, player.growthStage);
      }

      // Campaign story objective triggers
      if (campaign.isActive) {
        campaign.completeObjective('c1_break_camo', player, audio);
        if (wasDisguised) {
          campaign.completeObjective('c4_sneak_strike', player, audio);
        }
      }
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

    // F: Creator Mode Flight Toggle
    input.onAction('KeyF', () => {
      if (!this.isGameRunning || this.isPaused) return;
      if (creatorMode.isActive) {
        creatorMode.toggleFlight();
      }
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

  startNewGameWithConfig(config = {}) {
    const savedEvermean = accountSystem.getProfile()?.customEvermean || {};
    const finalConfig = {
      ...savedEvermean,
      ...config
    };
    player.init(engine.scene, engine.camera, terrain, engine, finalConfig.presetKey || 'oak', finalConfig);
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

      // 2. Creator Mode Flight
      if (creatorMode.isActive && creatorMode.isFlying) {
        creatorMode.updateFlight(delta, input);
      }

      // 3. Player Controller
      player.update(delta, input, dayNight, environment);

      // 4. AI Creatures (Woodcutters, Beavers, Koroks, Deer)
      villagers.update(delta, player, engine, audio, colony);

      // 5. Civilization Colony
      colony.update(delta, player, now * 0.001, villagers, engine, audio);

      // 6. Multiplayer Network & Arena
      multiplayer.update(delta);
      arena.update(delta);

      // 7. Engine Effects & HUD
      engine.update(delta);
      hud.update(player, dayNight);

      // 8. Campaign story progress checks
      if (campaign.isActive) {
        if (player.inventory.wood >= 25) campaign.completeObjective('c1_harvest_wood', player, audio);
        if (player.isSwimming) campaign.completeObjective('c2_swim_river', player, audio);
        if ((player.inventory.korokSeeds || 0) >= 1) campaign.completeObjective('c3_solve_korok', player, audio);
        if (player.inventory.stardust >= 1) campaign.completeObjective('c5_collect_star', player, audio);
        if (player.growthStage >= 5) campaign.completeObjective('c5_ascend', player, audio);
      }

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

