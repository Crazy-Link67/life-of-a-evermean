import * as THREE from 'three';
import { multiplayer } from '../net/MultiplayerManager.js';
import { accountSystem } from './AccountSystem.js';

// Evermean Arena PvP Colosseum Manager
// Fast-paced dueling ring with shockwave clashes, round timers, power-up drops, and live scoreboard
export class ArenaManager {
  constructor() {
    this.isActive = false;
    this.arenaCenter = new THREE.Vector3(0, 0, 0);
    this.arenaRadius = 35;
    this.roundTime = 120; // 2 minute duel
    this.roundTimer = 120;
    this.powerUpTimer = 15;
    this.powerUps = [];
    this.scene = null;
    this.terrain = null;
    this.player = null;
    this.engine = null;
    this.onArenaUpdateCallbacks = [];
  }

  init(scene, terrain, player, engine) {
    this.scene = scene;
    this.terrain = terrain;
    this.player = player;
    this.engine = engine;
  }

  startArenaDuel(roomCode = null) {
    this.isActive = true;
    this.roundTimer = this.roundTime;
    this.powerUpTimer = 10;

    // Teleport player to Arena starting circle
    if (this.player) {
      this.player.position.set(0, 2, -18);
      this.player.yaw = 0;
      this.player.barkHp = this.player.maxBarkHp;
      this.player.moisture = 100;
      this.player.photosynthesis = 100;
    }

    if (window.showGameNotification) {
      window.showGameNotification('⚔️ ARENA DUEL STARTED! Clash with shockwaves & acorn artillery!');
    }

    this.notifyUpdate();
  }

  stopArenaDuel() {
    this.isActive = false;
    this.powerUps.forEach((p) => {
      if (this.scene) this.scene.remove(p);
    });
    this.powerUps = [];
    this.notifyUpdate();
  }

  update(delta) {
    if (!this.isActive) return;

    // 1. Arena Ring Containment
    if (this.player) {
      const dist = Math.hypot(this.player.position.x - this.arenaCenter.x, this.player.position.z - this.arenaCenter.z);
      if (dist > this.arenaRadius) {
        // Push back towards ring center
        const angle = Math.atan2(this.player.position.z - this.arenaCenter.z, this.player.position.x - this.arenaCenter.x);
        this.player.position.x = this.arenaCenter.x + Math.cos(angle) * this.arenaRadius;
        this.player.position.z = this.arenaCenter.z + Math.sin(angle) * this.arenaRadius;
        if (this.engine) this.engine.spawnParticles(this.player.position, 6, 0xef4444, 2, 0.08);
      }
    }

    // 2. Round Timer
    this.roundTimer -= delta;
    if (this.roundTimer <= 0) {
      this.roundTimer = this.roundTime;
      if (window.showGameNotification) {
        window.showGameNotification('🔔 ARENA ROUND ENDED! Preparing next round...');
      }
    }

    // 3. Power-Up Spawner (Every 18 seconds)
    this.powerUpTimer -= delta;
    if (this.powerUpTimer <= 0 && this.powerUps.length < 3) {
      this.powerUpTimer = 18;
      this.spawnArenaPowerUp();
    }

    // Check power-up collection
    if (this.player) {
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const p = this.powerUps[i];
        if (p.position.distanceTo(this.player.position) < 2.0) {
          if (p.userData.type === 'sap') {
            this.player.barkHp = Math.min(this.player.maxBarkHp, this.player.barkHp + 40);
            if (window.showGameNotification) window.showGameNotification('🧪 Restored +40 Bark Health!');
          } else {
            this.player.inventory.acorns += 8;
            if (window.showGameNotification) window.showGameNotification('🌰 Picked up Heavy Acorn Barrage Ammo (+8)!');
          }
          if (this.engine) this.engine.spawnCosmicBurst(p.position, 20);
          this.scene.remove(p);
          this.powerUps.splice(i, 1);
        }
      }
    }

    this.notifyUpdate();
  }

  spawnArenaPowerUp() {
    if (!this.scene) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * (this.arenaRadius * 0.7);
    const x = this.arenaCenter.x + Math.cos(angle) * dist;
    const z = this.arenaCenter.z + Math.sin(angle) * dist;
    const y = this.terrain.getHeight(x, z) + 0.4;

    const isSap = Math.random() < 0.5;
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.4),
      new THREE.MeshStandardMaterial({
        color: isSap ? 0x22c55e : 0xf59e0b,
        emissive: isSap ? 0x15803d : 0xb45309,
        emissiveIntensity: 0.9,
        roughness: 0.2
      })
    );
    mesh.position.set(x, y, z);
    mesh.userData = { type: isSap ? 'sap' : 'ammo' };
    this.scene.add(mesh);
    this.powerUps.push(mesh);
  }

  onUpdate(callback) {
    this.onArenaUpdateCallbacks.push(callback);
  }

  notifyUpdate() {
    this.onArenaUpdateCallbacks.forEach((cb) => cb(this.isActive, Math.ceil(this.roundTimer)));
  }
}

export const arena = new ArenaManager();

