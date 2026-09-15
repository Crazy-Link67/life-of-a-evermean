import * as THREE from 'three';

// Creator / Sandbox Mode System
// Grants infinite building resources, Flight Mode (F), custom prop/creature spawners, and time manipulation
export class CreatorMode {
  constructor() {
    this.isActive = false;
    this.isFlying = false;
    this.scene = null;
    this.terrain = null;
    this.player = null;
    this.villagers = null;
    this.dayNight = null;
    this.colony = null;
    this.environment = null;
    this.onStateChangeCallbacks = [];
  }

  init(scene, terrain, player, villagers, dayNight, colony, environment = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.player = player;
    this.villagers = villagers;
    this.dayNight = dayNight;
    this.colony = colony;
    this.environment = environment;
  }

  enable() {
    this.isActive = true;
    if (this.player) {
      this.player.inventory.wood = 9999;
      this.player.inventory.acorns = 9999;
      this.player.inventory.stardust = 9999;
      this.player.inventory.korokSeeds = 999;
      this.player.inventory.rupees = 9999;
      this.player.inventory.chuchuJelly = 999;
      this.player.inventory.bubbulGems = 999;
      this.player.inventory.sundelions = 999;
      this.player.soilBiomass = 9999;
      this.player.moisture = 100;
      this.player.photosynthesis = 100;
      this.player.barkHp = this.player.maxBarkHp;
    }

    if (window.showGameNotification) {
      window.showGameNotification('🛠️ Creator Sandbox Mode Activated! Press F to Toggle Flight, Unlimited Resources!');
    }

    this.notifyState();
  }

  disable() {
    this.isActive = false;
    this.isFlying = false;
    this.notifyState();
  }

  toggleFlight() {
    if (!this.isActive) return;
    this.isFlying = !this.isFlying;
    if (window.showGameNotification) {
      window.showGameNotification(this.isFlying ? '🕊️ Flight Mode ON (Fly with Space / Descend with C)' : '🚶 Flight Mode OFF');
    }
    this.notifyState();
  }

  // Spawn dynamic prop in front of player
  spawnProp(propType) {
    if (!this.isActive || !this.player || !this.scene) return;

    const forward = new THREE.Vector3(
      Math.sin(this.player.yaw),
      0,
      Math.cos(this.player.yaw)
    ).normalize();
    const spawnPos = this.player.position.clone().addScaledVector(forward, 3.5);
    spawnPos.y = this.terrain.getHeight(spawnPos.x, spawnPos.z);

    switch (propType) {
      case 'sprout_minion': {
        if (this.colony) {
          this.colony.spawnCitizenEvermean(spawnPos.x, spawnPos.z, this.player.speciesConfig);
          if (window.showGameNotification) window.showGameNotification('🌱 Spawned Baby Sprout Minion!');
        }
        break;
      }
      case 'deer': {
        if (this.villagers) {
          this.villagers.spawnDeer(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🦌 Spawned Woodland Stag Deer!');
        }
        break;
      }
      case 'beaver': {
        if (this.villagers) {
          this.villagers.spawnBeaver(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🦫 Spawned Friendly Beaverfolk!');
        }
        break;
      }
      case 'goblin_spar': {
        if (this.villagers) {
          this.villagers.spawnGoblin(spawnPos.x, spawnPos.z, false);
          if (window.showGameNotification) window.showGameNotification('👹 Spawned Sparring Woodcutter Goblin!');
        }
        break;
      }
      case 'shrooms': {
        const group = new THREE.Group();
        group.position.copy(spawnPos);
        for (let i = 0; i < 4; i++) {
          const cap = new THREE.Mesh(
            new THREE.ConeGeometry(0.3 + Math.random() * 0.2, 0.4, 6),
            new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8 })
          );
          cap.position.set((Math.random() - 0.5) * 0.8, 0.2, (Math.random() - 0.5) * 0.8);
          group.add(cap);
        }
        this.scene.add(group);
        if (window.showGameNotification) window.showGameNotification('🍄 Spawned Glowing Bioluminescent Mushrooms!');
        break;
      }
      case 'ancient_monolith': {
        const mono = new THREE.Mesh(
          new THREE.CylinderGeometry(0.6, 0.9, 4.2, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
        );
        mono.position.set(spawnPos.x, spawnPos.y + 2.1, spawnPos.z);
        this.scene.add(mono);
        if (window.showGameNotification) window.showGameNotification('🗿 Spawned Ancient Stone Monolith!');
        break;
      }
      case 'blupee': {
        if (this.villagers) {
          this.villagers.spawnBlupee(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🐰 Spawned Mythical Glowing Blupee!');
        }
        break;
      }
      case 'chuchu': {
        if (this.villagers) {
          const type = ['grass', 'fire', 'electric', 'frost'][Math.floor(Math.random() * 4)];
          this.villagers.spawnChuchu(spawnPos.x, spawnPos.z, type);
          if (window.showGameNotification) window.showGameNotification(`💧 Spawned ${type.toUpperCase()} Chuchu!`);
        }
        break;
      }
      case 'bubbulfrog': {
        if (this.villagers) {
          this.villagers.spawnBubbulfrog(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🐸 Spawned Cave Spirit Bubbulfrog!');
        }
        break;
      }
      case 'cucco': {
        if (this.villagers) {
          this.villagers.spawnCucco(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🐔 Spawned Hyrule Cucco! (Do not provoke!)');
        }
        break;
      }
      case 'aerocuda': {
        if (this.villagers) {
          this.villagers.spawnAerocuda(spawnPos.x, spawnPos.z, spawnPos.y + 14);
          if (window.showGameNotification) window.showGameNotification('🦇 Spawned Winged Aerocuda!');
        }
        break;
      }
      case 'dondon': {
        if (this.villagers) {
          this.villagers.spawnDondon(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🦏 Spawned Luminous Ore Dondon!');
        }
        break;
      }
      case 'fox': {
        if (this.villagers) {
          this.villagers.spawnFox(spawnPos.x, spawnPos.z);
          if (window.showGameNotification) window.showGameNotification('🦊 Spawned Woodland Grassland Fox!');
        }
        break;
      }
      case 'zonai_pad': {
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.7, roughness: 0.3 });
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0x34d399,
          emissive: 0x10b981,
          emissiveIntensity: 0.95,
          roughness: 0.2
        });
        const beamMat = new THREE.MeshBasicMaterial({
          color: 0x6ee7b7,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide
        });

        const padGroup = new THREE.Group();
        padGroup.position.set(spawnPos.x, spawnPos.y + 0.08, spawnPos.z);

        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.2, 16), baseMat);
        base.receiveShadow = true;
        padGroup.add(base);

        const glyphRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 24), ringMat);
        glyphRing.rotation.x = Math.PI / 2;
        glyphRing.position.y = 0.12;
        padGroup.add(glyphRing);

        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 8), ringMat);
        core.position.y = 0.12;
        padGroup.add(core);

        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 2.5, 12, 1, true), beamMat);
        beam.position.y = 1.35;
        padGroup.add(beam);

        padGroup.userData = {
          isZonaiPad: true,
          glyphRing,
          beam
        };

        this.scene.add(padGroup);
        if (this.environment && this.environment.zonaiPads) {
          this.environment.zonaiPads.push(padGroup);
        }
        if (window.showGameNotification) window.showGameNotification('🚀 Spawned Ancient Zonai Boost Pad!');
        break;
      }
    }
  }

  // Set time of day in Creator mode
  setTimeOfDay(timeVal) {
    if (this.dayNight) {
      this.dayNight.timeOfDay = timeVal;
      if (window.showGameNotification) {
        const name = timeVal < 0.25 ? 'Dawn' : (timeVal < 0.7 ? 'Day' : 'Night');
        window.showGameNotification(`☀️ Time Set to: ${name}`);
      }
    }
  }

  onStateChange(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  notifyState() {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.isActive, this.isFlying));
  }

  // Flight physics update (called from player update)
  updateFlight(delta, input) {
    if (!this.isActive || !this.isFlying || !this.player) return false;

    this.player.velocity.set(0, 0, 0);

    const speed = 16.0;
    if (input.isKeyDown('Space')) this.player.position.y += speed * delta;
    if (input.isKeyDown('KeyC')) this.player.position.y -= speed * delta;

    // Maintain flight above ground
    const ground = this.terrain.getHeight(this.player.position.x, this.player.position.z);
    this.player.position.y = Math.max(ground + 1.2, this.player.position.y);
    this.player.isGrounded = false;
    return true;
  }
}

export const creatorMode = new CreatorMode();

