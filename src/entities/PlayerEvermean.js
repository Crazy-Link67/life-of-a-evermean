import * as THREE from 'three';
import { TreeModelGenerator } from './TreeModelGenerator.js';
import { audio } from '../core/AudioManager.js';

// The Player Evermean: First-person tree controller with TOTK head-slam, swimming, disguise, and evolution
export class PlayerEvermean {
  constructor() {
    this.speciesConfig = null;
    this.growthStage = 1; // 1: Sprout, 2: Sapling, 3: Mature, 4: Elder, 5: Cosmic
    this.stageNames = ['Baby Sprout', 'Young Sapling', 'Mature Evermean', 'Ancient Grove Warden', 'Ascended Cosmic Evermean'];

    // Transform
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.cameraMode = 'first_person'; // 'first_person' or 'third_person'

    // Survival Stats
    this.maxBarkHp = 100;
    this.barkHp = 100;
    this.maxMoisture = 100;
    this.moisture = 100;
    this.maxPhotosynthesis = 100;
    this.photosynthesis = 50;
    this.soilBiomass = 0;
    this.biomassForNextStage = 100;

    // Inventory
    this.inventory = {
      wood: 20,
      acorns: 5,
      stardust: 0,
      korokSeeds: 0,
      rupees: 0,
      chuchuJelly: 0,
      bubbulGems: 0,
      sundelions: 0
    };

    // States
    this.isGrounded = false;
    this.isSwimming = false;
    this.isDisguised = false;
    this.isRootBurrowed = false;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.headSlamTilt = 0;
    this.rightArmRecoil = 0;

    // 3D Models
    this.thirdPersonModel = null;
    this.firstPersonModel = null;
    this.scene = null;
    this.camera = null;
    this.terrain = null;
    this.engine = null;

    // Stamina Wheel (Zelda TOTK Sprint & Action Energy)
    this.maxStamina = 100;
    this.stamina = 100;
    this.isExhausted = false;
    this.exhaustionTimer = 0;

    // Zelda TOTK Ultrahand & Fuse System
    this.isUltrahandActive = false;
    this.heldUltrahandObject = null;
    this.fusedItem = null; // { type, name, durability, maxDurability }
    this.fusedMeshTP = null;
    this.fusedMeshFP = null;

    // Head-bobbing & root-step timer
    this.stepTimer = 0;
    this.swimTimer = 0;
  }

  init(scene, camera, terrain, engine, speciesPresetKey = 'oak', customConfig = {}) {
    this.scene = scene;
    this.camera = camera;
    this.terrain = terrain;
    this.engine = engine;

    const basePreset = TreeModelGenerator.PRESETS[speciesPresetKey] || TreeModelGenerator.PRESETS.oak;
    this.speciesConfig = {
      ...basePreset,
      presetKey: speciesPresetKey,
      ...customConfig
    };

    // Apply species stat multipliers
    this.maxBarkHp = Math.floor(100 * (this.speciesConfig.barkHealthMult || 1.0));
    this.barkHp = this.maxBarkHp;

    // Spawn at a good forest clearing
    this.position.set(0, this.terrain.getHeight(0, 0) + 1.0, 10);

    // Build 3D Models
    this.rebuildModel();
  }

  rebuildModel() {
    if (this.thirdPersonModel) {
      this.scene.remove(this.thirdPersonModel);
    }
    if (this.firstPersonModel && this.camera) {
      this.camera.remove(this.firstPersonModel);
    }

    // 1. Third Person Full Tree Model (also visible when in 3rd person)
    this.thirdPersonModel = TreeModelGenerator.createEvermeanModel(this.speciesConfig, this.growthStage);
    this.thirdPersonModel.position.copy(this.position);
    this.scene.add(this.thirdPersonModel);

    // 2. First Person View Model (Evermean knot-hole sight rig in front of camera)
    this.firstPersonModel = TreeModelGenerator.createFirstPersonViewModel(this.speciesConfig, this.growthStage);
    this.camera.add(this.firstPersonModel);

    this.updateModelVisibility();
  }

  updateModelVisibility() {
    if (this.cameraMode === 'first_person') {
      if (this.thirdPersonModel) this.thirdPersonModel.visible = false;
      if (this.firstPersonModel) this.firstPersonModel.visible = true;
    } else {
      if (this.thirdPersonModel) this.thirdPersonModel.visible = true;
      if (this.firstPersonModel) this.firstPersonModel.visible = false;
    }
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode === 'first_person') ? 'third_person' : 'first_person';
    this.updateModelVisibility();
    if (window.showGameNotification) {
      window.showGameNotification(this.cameraMode === 'first_person' ? '👁️ Evermean First-Person Knot-Hole Sight' : '🌲 Third-Person Grove View');
    }
  }

  // Zelda TOTK Ultrahand Ability: Magnetic grab & carry loose boulders/items
  toggleUltrahand(environment) {
    if (this.isUltrahandActive) {
      this.isUltrahandActive = false;
      this.heldUltrahandObject = null;
      if (this.engine) this.engine.hideUltrahandTether();
      audio.stopUltrahandHum();
      if (window.showGameNotification) {
        window.showGameNotification('✋ Ultrahand Released');
      }
      return;
    }

    if (!environment || !environment.fusableObjects) return;
    let bestObj = null;
    let bestDist = 14.0;

    for (const obj of environment.fusableObjects) {
      const d = obj.position.distanceTo(this.position);
      if (d < bestDist) {
        bestDist = d;
        bestObj = obj;
      }
    }

    if (bestObj) {
      this.isUltrahandActive = true;
      this.heldUltrahandObject = bestObj;
      audio.startUltrahandHum();
      if (window.showGameNotification) {
        window.showGameNotification(`🟢 Ultrahand Grip: ${bestObj.userData?.name || 'Object'}! (Press F to Fuse to Evermean)`);
      }
    } else {
      if (window.showGameNotification) {
        window.showGameNotification('❓ No loose objects nearby to grip with Ultrahand.');
      }
    }
  }

  // Zelda TOTK Fuse Ability: Attach held/nearby object to Evermean for enhanced combat
  fuseHeldObject(environment) {
    let target = this.heldUltrahandObject;
    if (!target && environment && environment.fusableObjects) {
      for (const obj of environment.fusableObjects) {
        if (obj.position.distanceTo(this.position) < 3.8) {
          target = obj;
          break;
        }
      }
    }

    if (!target) {
      if (window.showGameNotification) {
        window.showGameNotification('❓ Grab an object with Ultrahand (E) or stand near a Boulder to Fuse (F)!');
      }
      return;
    }

    const u = target.userData || {};
    const fuseType = u.fuseType || 'boulder';
    const fuseName = u.name || 'Granite Boulder';

    this.fusedItem = {
      type: fuseType,
      name: fuseName,
      durability: 6,
      maxDurability: 6
    };

    if (this.scene && target.parent) {
      target.parent.remove(target);
    }
    if (environment && environment.fusableObjects) {
      const idx = environment.fusableObjects.indexOf(target);
      if (idx !== -1) environment.fusableObjects.splice(idx, 1);
    }

    this.isUltrahandActive = false;
    this.heldUltrahandObject = null;
    if (this.engine) {
      this.engine.hideUltrahandTether();
      this.engine.spawnCosmicBurst(this.position, 35);
      this.engine.applyScreenShake(0.4);
    }
    audio.stopUltrahandHum();
    audio.playFuseLatch();

    this.attachFusedMesh();

    if (window.showGameNotification) {
      window.showGameNotification(`✨ FUSED: ${fuseName} fused to Evermean! (+2.5x Head-Slam Damage & Rock-Breaker)`);
    }
  }

  attachFusedMesh() {
    this.detachFusedMesh();
    if (!this.fusedItem || !this.thirdPersonModel) return;

    const fuseGroup = new THREE.Group();
    let geom;
    let mat;

    if (this.fusedItem.type === 'boulder') {
      geom = new THREE.DodecahedronGeometry(0.55, 1);
      mat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    } else if (this.fusedItem.type === 'bomb_flower') {
      geom = new THREE.DodecahedronGeometry(0.45, 1);
      mat = new THREE.MeshStandardMaterial({ color: 0xea580c, emissive: 0x7c2d12, emissiveIntensity: 0.8 });
    } else {
      geom = new THREE.CylinderGeometry(0.25, 0.28, 1.4, 8);
      mat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    }

    const mesh = new THREE.Mesh(geom, mat);
    fuseGroup.add(mesh);

    // Glowing green Zonai adhesive glue ring
    const glueRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.07, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.95 })
    );
    fuseGroup.add(glueRing);

    fuseGroup.position.set(0, 2.6 * (this.growthStage * 0.4 + 0.6), 0.45);
    this.thirdPersonModel.add(fuseGroup);
    this.fusedMeshTP = fuseGroup;
  }

  detachFusedMesh() {
    if (this.fusedMeshTP && this.thirdPersonModel) {
      this.thirdPersonModel.remove(this.fusedMeshTP);
      this.fusedMeshTP = null;
    }
  }

  shatterFusedItem() {
    if (!this.fusedItem) return;
    const name = this.fusedItem.name;
    this.fusedItem = null;
    this.detachFusedMesh();
    if (this.engine) {
      this.engine.spawnParticles(this.position, 25, 0x94a3b8, 4, 0.18);
      this.engine.applyScreenShake(0.3);
    }
    audio.playHeadSlam(0.8, false);
    if (window.showGameNotification) {
      window.showGameNotification(`💥 Fused ${name} shattered from impact!`);
    }
  }

  // Head-Slam Attack: The classic TOTK tree monster slam!
  executeHeadSlam(environment, villagers) {
    if (this.isAttacking || this.moisture <= 5) return;

    this.isAttacking = true;
    this.attackTimer = 0.65;
    const isMantis = this.speciesConfig.hasMantisScythes;
    const power = 1.0 + (this.growthStage - 1) * 0.35;

    let damageMult = 1.0;
    let radiusMult = 1.0;

    // Zelda TOTK Fused Item Modifiers
    if (this.fusedItem) {
      if (this.fusedItem.type === 'boulder') {
        damageMult = 2.5;
        this.engine.applyScreenShake(0.85 * power);
      } else if (this.fusedItem.type === 'bomb_flower') {
        damageMult = 4.0;
        this.engine.applyScreenShake(1.25 * power);
      } else if (this.fusedItem.type === 'log') {
        radiusMult = 1.6;
        damageMult = 1.4;
      }
    }

    // Audio & Screen Shake
    audio.playHeadSlam(power * damageMult, isMantis);
    this.engine.applyScreenShake(0.5 * power);

    // Consume slight stamina/moisture
    this.moisture = Math.max(0, this.moisture - 4);

    // Shockwave particle & ground ring
    const forwardDir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    const slamPoint = this.position.clone().addScaledVector(forwardDir, 2.0 * power);
    slamPoint.y = this.terrain.getHeight(slamPoint.x, slamPoint.z);

    if (this.fusedItem && this.fusedItem.type === 'bomb_flower') {
      this.engine.spawnShockwave(slamPoint, 5.0 * power, 0xf97316);
      this.engine.spawnCosmicBurst(slamPoint, 45);
      this.shatterFusedItem();
    } else if (this.fusedItem && this.fusedItem.type === 'boulder') {
      this.engine.spawnShockwave(slamPoint, 3.8 * power, 0x94a3b8);
      this.engine.spawnParticles(slamPoint, 30, 0x64748b, 6, 0.22);
      this.fusedItem.durability--;
      if (this.fusedItem.durability <= 0) this.shatterFusedItem();
    } else {
      this.engine.spawnShockwave(slamPoint, 2.5 * power, this.speciesConfig.glowColor || 0x8b5a2b);
      this.engine.spawnParticles(slamPoint, 25, 0x654321, 5 * power, 0.18);
      if (this.fusedItem) {
        this.fusedItem.durability--;
        if (this.fusedItem.durability <= 0) this.shatterFusedItem();
      }
    }

    // Damage bonus if ambushing from camouflage disguise!
    const isSneakStrike = this.isDisguised;
    const baseDamage = Math.floor((25 + this.growthStage * 15) * damageMult);

    if (isSneakStrike) {
      this.engine.applyScreenShake(0.8);
      this.engine.spawnShockwave(slamPoint, 4.0, 0xf59e0b);
      this.isDisguised = false;
    }

    // 1. Check hitting Woodcutter Goblins
    const slamRadius = 3.8 * (this.speciesConfig.slamRadiusMult || 1.0) * radiusMult;
    villagers.goblins.forEach(goblin => {
      if (goblin.position.distanceTo(slamPoint) < slamRadius) {
        const res = villagers.damageGoblin(goblin, baseDamage, this.engine, audio, isSneakStrike);
        if (res.defeated) {
          this.inventory.wood += res.woodReward;
          this.soilBiomass += res.biomassReward;
          if (res.acornReward) this.inventory.acorns += res.acornReward;
        }
      }
    });

    // Check hitting Zelda TOTK Creatures with Head-Slam
    if (villagers.chuchus) {
      for (let i = villagers.chuchus.length - 1; i >= 0; i--) {
        const ch = villagers.chuchus[i];
        if (ch.position.distanceTo(slamPoint) < slamRadius) {
          villagers.damageChuchu(ch, baseDamage, this.engine, audio, this);
        }
      }
    }

    if (villagers.blupees) {
      for (let i = villagers.blupees.length - 1; i >= 0; i--) {
        const bp = villagers.blupees[i];
        if (bp.position.distanceTo(slamPoint) < slamRadius) {
          villagers.damageBlupee(bp, baseDamage, this.engine, audio, this);
        }
      }
    }

    if (villagers.bubbulfrogs) {
      for (let i = villagers.bubbulfrogs.length - 1; i >= 0; i--) {
        const frog = villagers.bubbulfrogs[i];
        if (frog.position.distanceTo(slamPoint) < slamRadius) {
          villagers.damageBubbulfrog(frog, baseDamage, this.engine, audio, this);
        }
      }
    }

    if (villagers.cuccos) {
      for (let i = villagers.cuccos.length - 1; i >= 0; i--) {
        const cucco = villagers.cuccos[i];
        if (cucco.position.distanceTo(slamPoint) < slamRadius) {
          villagers.hitCucco(cucco, this.engine, audio, this);
        }
      }
    }

    if (villagers.foxes) {
      for (let i = villagers.foxes.length - 1; i >= 0; i--) {
        const fox = villagers.foxes[i];
        if (fox.position.distanceTo(slamPoint) < slamRadius) {
          villagers.interactFox(fox, this.engine, audio, this, true);
        }
      }
    }

    if (villagers.likelikes) {
      for (let i = villagers.likelikes.length - 1; i >= 0; i--) {
        const like = villagers.likelikes[i];
        if (like.position.distanceTo(slamPoint) < slamRadius) {
          villagers.damageLikeLike(like, baseDamage, this.engine, audio, this);
        }
      }
    }

    // 2. Check felling normal trees / harvesting wood
    environment.breakables.forEach((item, idx) => {
      if (item.position.distanceTo(slamPoint) < 3.8) {
        item.userData.hp -= baseDamage;
        this.engine.spawnParticles(item.position, 15, 0x5c4033, 4, 0.15);

        if (item.userData.hp <= 0) {
          // Tree felled! Harvest wood & acorns
          this.inventory.wood += item.userData.woodYield || 15;
          this.inventory.acorns += 2;
          this.soilBiomass += 15;
          this.engine.spawnParticles(item.position, 35, 0x2e7d32, 6, 0.25);
          this.scene.remove(item);
          environment.breakables.splice(idx, 1);
        }
      }
    });
  }

  // Secondary Action: Mantis Scythe Slash, Fire Burst, Lightning Arc, or Cosmic Singularity
  executeSecondaryAction(villagers) {
    if (this.isAttacking) return;

    const element = this.speciesConfig.element;
    const isMantis = this.speciesConfig.hasMantisScythes;

    this.isAttacking = true;
    this.attackTimer = 0.5;

    const forwardDir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    const hitPoint = this.position.clone().addScaledVector(forwardDir, 2.5);

    let damage = 25;
    let radius = 2.8;

    if (isMantis) {
      audio.playMantisSlash();
      this.engine.spawnParticles(hitPoint, 20, 0x84cc16, 4.5, 0.1);
      damage = 40;
      radius = 3.2;
    } else if (element === 'fire') {
      audio.playFireBurst();
      this.engine.spawnParticles(hitPoint, 30, 0xff4500, 5, 0.15);
      damage = 35;
      radius = 4.0;
    } else if (element === 'lightning') {
      audio.playThunderSlam();
      this.engine.spawnParticles(hitPoint, 25, 0x00e5ff, 6, 0.12);
      this.engine.applyScreenShake(0.3);
      damage = 38;
      radius = 5.0;
    } else if (element === 'cosmic' || this.growthStage === 5) {
      audio.playCosmicSlam();
      this.engine.spawnCosmicBurst(hitPoint, 40);
      this.engine.applyScreenShake(0.6);
      damage = 75;
      radius = 7.0;
    } else {
      audio.playRootStep(1.4);
      this.engine.spawnParticles(hitPoint, 15, 0x8b5a2b, 3.5, 0.1);
      damage = 25;
      radius = 2.8;
    }

    this.damageCreaturesInArea(villagers, hitPoint, radius, damage);
  }

  damageCreaturesInArea(villagers, center, radius, damage) {
    if (!villagers) return;
    if (villagers.goblins) {
      villagers.goblins.forEach(g => {
        if (g.position.distanceTo(center) < radius) {
          villagers.damageGoblin(g, damage, this.engine, audio);
        }
      });
    }
    if (villagers.chuchus) {
      for (let i = villagers.chuchus.length - 1; i >= 0; i--) {
        const ch = villagers.chuchus[i];
        if (ch.position.distanceTo(center) < radius) {
          villagers.damageChuchu(ch, damage, this.engine, audio, this);
        }
      }
    }
    if (villagers.blupees) {
      for (let i = villagers.blupees.length - 1; i >= 0; i--) {
        const bp = villagers.blupees[i];
        if (bp.position.distanceTo(center) < radius) {
          villagers.damageBlupee(bp, damage, this.engine, audio, this);
        }
      }
    }
    if (villagers.bubbulfrogs) {
      for (let i = villagers.bubbulfrogs.length - 1; i >= 0; i--) {
        const frog = villagers.bubbulfrogs[i];
        if (frog.position.distanceTo(center) < radius) {
          villagers.damageBubbulfrog(frog, damage, this.engine, audio, this);
        }
      }
    }
    if (villagers.cuccos) {
      for (let i = villagers.cuccos.length - 1; i >= 0; i--) {
        const cucco = villagers.cuccos[i];
        if (cucco.position.distanceTo(center) < radius) {
          villagers.hitCucco(cucco, this.engine, audio, this);
        }
      }
    }
    if (villagers.foxes) {
      for (let i = villagers.foxes.length - 1; i >= 0; i--) {
        const fox = villagers.foxes[i];
        if (fox.position.distanceTo(center) < radius) {
          villagers.interactFox(fox, this.engine, audio, this, true);
        }
      }
    }
    if (villagers.likelikes) {
      for (let i = villagers.likelikes.length - 1; i >= 0; i--) {
        const like = villagers.likelikes[i];
        if (like.position.distanceTo(center) < radius) {
          villagers.damageLikeLike(like, damage, this.engine, audio, this);
        }
      }
    }
  }

  // Toggle Tree Camouflage Disguise
  toggleCamouflage() {
    this.isDisguised = !this.isDisguised;
    audio.playDisguise();
    if (this.isDisguised) {
      this.engine.spawnParticles(this.position, 12, 0x3d2817, 1.5, 0.1);
    }
  }

  // Toggle Root-Burrow (Taps groundwater to hydrate)
  toggleRootBurrow() {
    this.isRootBurrowed = !this.isRootBurrowed;
    audio.playDisguise();
  }

  // Ranged Spore / Acorn Artillery (fires explosive woodland acorn projectile)
  launchProjectile(villagers) {
    if (this.inventory.acorns <= 0) return;
    this.inventory.acorns--;
    this.rightArmRecoil = 0.35;

    audio.playRootStep(1.6);
    const forwardDir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    const projGeom = new THREE.SphereGeometry(0.22, 8, 8);
    const projMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.5,
      emissive: 0x78350f,
      emissiveIntensity: 0.3
    });
    const projMesh = new THREE.Mesh(projGeom, projMat);
    projMesh.position.copy(this.position);
    projMesh.position.y += 1.5;
    this.scene.add(projMesh);

    const vel = forwardDir.multiplyScalar(28);
    let lifetime = 0;

    const interval = setInterval(() => {
      lifetime += 0.035;
      vel.y -= 9.8 * 0.035;
      projMesh.position.addScaledVector(vel, 0.035);

      // Check collision with Goblins
      if (villagers && villagers.goblins) {
        for (let g of villagers.goblins) {
          if (g.position.distanceTo(projMesh.position) < 1.4) {
            clearInterval(interval);
            this.engine.spawnParticles(projMesh.position, 20, 0xa16207, 4, 0.12);
            audio.playHeadSlam(0.5);
            const res = villagers.damageGoblin(g, 35, this.engine, audio);
            if (res.defeated) {
              this.inventory.wood += res.woodReward;
              this.soilBiomass += res.biomassReward;
            }
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      // Check collision with Elemental Chuchus
      if (villagers && villagers.chuchus) {
        for (let ch of villagers.chuchus) {
          if (ch.position.distanceTo(projMesh.position) < 1.4) {
            clearInterval(interval);
            villagers.damageChuchu(ch, 35, this.engine, audio, this);
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      // Check collision with Blupees
      if (villagers && villagers.blupees) {
        for (let bp of villagers.blupees) {
          if (bp.position.distanceTo(projMesh.position) < 1.5) {
            clearInterval(interval);
            villagers.damageBlupee(bp, 35, this.engine, audio, this);
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      // Check collision with Bubbulfrogs
      if (villagers && villagers.bubbulfrogs) {
        for (let frog of villagers.bubbulfrogs) {
          if (frog.position.distanceTo(projMesh.position) < 1.5) {
            clearInterval(interval);
            villagers.damageBubbulfrog(frog, 35, this.engine, audio, this);
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      // Check collision with Cuccos
      if (villagers && villagers.cuccos) {
        for (let cucco of villagers.cuccos) {
          if (cucco.position.distanceTo(projMesh.position) < 1.4) {
            clearInterval(interval);
            villagers.hitCucco(cucco, this.engine, audio, this);
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      // Check collision with high-flying Aerocudas (Zelda sky archery!)
      if (villagers && villagers.aerocudas) {
        for (let aero of villagers.aerocudas) {
          if (aero.position.distanceTo(projMesh.position) < 2.0) {
            clearInterval(interval);
            villagers.damageAerocuda(aero, 35, this.engine, audio, this);
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      // Check collision with Foxes
      if (villagers && villagers.foxes) {
        for (let fox of villagers.foxes) {
          if (fox.position.distanceTo(projMesh.position) < 1.4) {
            clearInterval(interval);
            villagers.interactFox(fox, this.engine, audio, this, true);
            this.scene.remove(projMesh);
            return;
          }
        }
      }

      const ground = this.terrain.getHeight(projMesh.position.x, projMesh.position.z);
      if (projMesh.position.y <= ground || lifetime > 4.0) {
        clearInterval(interval);
        this.engine.spawnParticles(projMesh.position, 15, 0x854d0e, 3, 0.1);
        audio.playHeadSlam(0.3);
        this.scene.remove(projMesh);
      }
    }, 35);
  }

  takeDamage(amount, source = 'Enemy') {
    this.barkHp = Math.max(0, this.barkHp - amount);
    this.engine.spawnParticles(this.position, 15, 0x8b4513, 3, 0.15);
    if (this.barkHp <= 0) {
      // Tree knocked down / dormant! Revive with sap
      this.barkHp = 35;
      this.position.set(0, this.terrain.getHeight(0, 0) + 1.0, 10);
    }
  }

  // Check growth & day-by-day evolution milestones
  checkEvolution(currentDay) {
    if (this.growthStage >= 5) return;

    // Progression Requirements:
    // Stage 1 -> 2: Day 3 + 100 Biomass
    // Stage 2 -> 3: Day 6 + 250 Biomass
    // Stage 3 -> 4: Day 10 + 500 Biomass
    // Stage 4 -> 5 (Cosmic Ascension): Day 15 + 1000 Biomass + 3 Stardust
    const thresholds = [
      { reqDay: 2, reqBiomass: 100, reqStardust: 0 },
      { reqDay: 5, reqBiomass: 250, reqStardust: 0 },
      { reqDay: 9, reqBiomass: 500, reqStardust: 0 },
      { reqDay: 14, reqBiomass: 800, reqStardust: 3 }
    ];

    const nextTier = thresholds[this.growthStage - 1];
    if (nextTier && currentDay >= nextTier.reqDay && this.soilBiomass >= nextTier.reqBiomass && this.inventory.stardust >= nextTier.reqStardust) {
      this.evolveToNextStage();
    }
  }

  evolveToNextStage() {
    this.growthStage++;
    audio.playEvolution();
    this.engine.applyScreenShake(0.8);
    this.engine.spawnCosmicBurst(this.position, 50);

    // Stat bonuses
    this.maxBarkHp += 50;
    this.barkHp = this.maxBarkHp;

    if (this.growthStage === 5) {
      // Cosmic Ascension!
      this.speciesConfig.element = 'cosmic';
      this.speciesConfig.foliageType = 'cosmic_nebula';
      this.speciesConfig.foliageColor = '#c084fc';
      this.speciesConfig.barkColor = '#1e1435';
      this.speciesConfig.glowColor = 0xa855f7;
    }

    this.rebuildModel();
  }

  update(delta, input, dayNight, environment) {
    // 1. Mouse Look Orientation
    const mouse = input.consumeMouseDelta();
    this.yaw -= mouse.x;
    this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch - mouse.y));

    // 2. Head Slam Attack Animation & Timer
    if (this.isAttacking) {
      this.attackTimer -= delta;
      // Head tilts down violently, then recovers
      if (this.attackTimer > 0.35) {
        this.headSlamTilt = THREE.MathUtils.lerp(this.headSlamTilt, 0.9, delta * 18);
      } else {
        this.headSlamTilt = THREE.MathUtils.lerp(this.headSlamTilt, 0.0, delta * 12);
      }
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.headSlamTilt = 0;
      }
    }

    // 3. Survival Needs & Metabolism
    // Photosynthesis from sun
    const photoEff = dayNight.getPhotosynthesisEfficiency();
    if (photoEff > 0 && !this.isSwimming) {
      this.photosynthesis = Math.min(this.maxPhotosynthesis, this.photosynthesis + delta * 6.0 * photoEff);
    } else {
      this.photosynthesis = Math.max(0, this.photosynthesis - delta * 1.5);
    }

    // Root Burrow Hydration
    if (this.isRootBurrowed) {
      this.moisture = Math.min(this.maxMoisture, this.moisture + delta * 15);
      this.soilBiomass += delta * 2;
    } else {
      this.moisture = Math.max(0, this.moisture - delta * 0.8);
    }

    // Check Water & Swimming State
    const waterDepth = this.terrain.getWaterDepth(this.position.x, this.position.z);
    this.isSwimming = (waterDepth > 0.6);

    if (this.isSwimming) {
      // Refill moisture in water!
      this.moisture = Math.min(this.maxMoisture, this.moisture + delta * 20);
      this.isDisguised = false;
      this.isRootBurrowed = false;
    }

    // 4. Movement Logic (Blocked if camouflaged or root-burrowed)
    if (!this.isDisguised && !this.isRootBurrowed) {
      const moveDir = new THREE.Vector3();
      if (input.isKeyDown('KeyW')) moveDir.z += 1;
      if (input.isKeyDown('KeyS')) moveDir.z -= 1;
      if (input.isKeyDown('KeyA')) moveDir.x -= 1;
      if (input.isKeyDown('KeyD')) moveDir.x += 1;

      const isMoving = moveDir.lengthSq() > 0;
      if (isMoving) {
        moveDir.normalize();

        const canSprint = input.isKeyDown('ShiftLeft') && this.photosynthesis > 4 && !this.isExhausted && this.stamina > 5;
        const isSprinting = canSprint;

        if (isSprinting) {
          this.photosynthesis -= delta * 6;
          this.stamina = Math.max(0, this.stamina - delta * 25);
          if (this.stamina <= 0) {
            this.isExhausted = true;
            this.exhaustionTimer = 2.0;
          }
        } else {
          this.stamina = Math.min(this.maxStamina, this.stamina + delta * 30);
        }

        if (this.isExhausted) {
          this.exhaustionTimer -= delta;
          if (this.exhaustionTimer <= 0) {
            this.isExhausted = false;
          }
        }

        const baseSpeed = 5.2 * (this.speciesConfig.speedMult || 1.0);
        const swimSpeedMult = this.speciesConfig.presetKey === 'palm' ? 1.4 : 0.8;
        const currentSpeed = (this.isSwimming ? baseSpeed * swimSpeedMult : baseSpeed) * (isSprinting ? 1.6 : 1.0);

        // Rotate movement relative to player yaw
        const sin = Math.sin(this.yaw);
        const cos = Math.cos(this.yaw);
        const worldMoveX = moveDir.x * cos + moveDir.z * sin;
        const worldMoveZ = -moveDir.x * sin + moveDir.z * cos;

        this.position.x += worldMoveX * currentSpeed * delta;
        this.position.z += worldMoveZ * currentSpeed * delta;

        // Footstep / Swim sound timer
        this.stepTimer += delta * (isSprinting ? 1.8 : 1.0);
        if (this.stepTimer > 0.35) {
          this.stepTimer = 0;
          if (this.isSwimming) {
            audio.playSwimPaddle();
            this.engine.spawnWaterSplash(this.position, 8);
          } else {
            audio.playRootStep(this.growthStage * 0.15 + 0.85);
            if (isSprinting && this.engine) {
              this.engine.spawnParticles(this.position, 2, 0x654321, 1.2, 0.08);
            }
          }
        }
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina + delta * 35);
        if (this.isExhausted) {
          this.exhaustionTimer -= delta;
          if (this.exhaustionTimer <= 0) this.isExhausted = false;
        }
      }

      // Jump / Paddle up
      if (input.isKeyDown('Space')) {
        if (this.isSwimming) {
          this.velocity.y = 3.5;
        } else if (this.isGrounded) {
          this.velocity.y = 6.8;
          this.isGrounded = false;
          audio.playRootStep(1.3);
        }
      }
    }

    // 5. Physics & Terrain Elevation
    const groundHeight = this.terrain.getHeight(this.position.x, this.position.z);

    if (this.isSwimming) {
      // Buoyancy: float on water surface (y = 0.0)
      const targetY = 0.1;
      this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, delta * 6);
      this.velocity.y = 0;
      this.isGrounded = false;
    } else {
      // Gravity & Ground Snapping
      this.velocity.y -= 18.0 * delta;
      this.position.y += this.velocity.y * delta;

      const treeEyeHeight = 1.1 + (this.growthStage - 1) * 0.55;
      if (this.position.y <= groundHeight + treeEyeHeight) {
        this.position.y = groundHeight + treeEyeHeight;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    // Check Zonai Boost Pads (Ascend / High sky launch)
    if (environment && environment.zonaiPads) {
      for (const pad of environment.zonaiPads) {
        if (pad.position.distanceTo(this.position) < 2.0 && this.isGrounded) {
          this.velocity.y = 26.0;
          this.isGrounded = false;
          audio.playZonaiBoost?.();
          this.engine.spawnShockwave(pad.position, 4.5, 0x10b981);
          this.engine.spawnParticles(pad.position, 40, 0x34d399, 8, 0.2);
          this.engine.applyScreenShake(0.35);
          if (window.showGameNotification) {
            window.showGameNotification('🚀 ZONAI BOOST PAD LAUNCH! Catapulted into the sky!');
          }
          break;
        }
      }
    }

    // Check Corrupted Gloom Puddles
    if (environment && environment.gloomPuddles) {
      for (const gloom of environment.gloomPuddles) {
        if (gloom.position.distanceTo(this.position) < gloom.userData.radius) {
          if (this.inventory.sundelions > 0) {
            this.inventory.sundelions--;
            this.engine.spawnShockwave(this.position, 3.0, 0xfacc15);
            if (window.showGameNotification) {
              window.showGameNotification('🌼 Golden Sundelion consumed to ward off the deadly Gloom!');
            }
          } else {
            this.takeDamage(6 * delta, 'Malice Gloom');
            this.moisture = Math.max(0, this.moisture - 10 * delta);
            this.engine.spawnParticles(this.position, 3, 0x881337, 1.5, 0.08);
          }
          break;
        }
      }
    }

    // 6. Check Pickup Collisions (Dew, Acorns, Stardust, Sundelions, Silent Princess, Bomb Flowers, Poes)
    for (let i = environment.pickups.length - 1; i >= 0; i--) {
      const p = environment.pickups[i];
      if (p.position.distanceTo(this.position) < 2.0) {
        const u = p.userData;
        if (u.moistureGain) this.moisture = Math.min(this.maxMoisture, this.moisture + u.moistureGain);
        if (u.biomassGain) this.soilBiomass += u.biomassGain;
        if (u.ammoGain) this.inventory.acorns += u.ammoGain;
        if (u.hpGain) this.barkHp = Math.min(this.maxBarkHp, this.barkHp + u.hpGain);
        if (u.photosynthesisGain) this.photosynthesis = Math.min(this.maxPhotosynthesis, this.photosynthesis + u.photosynthesisGain);
        if (u.stardustGain) this.inventory.stardust = (this.inventory.stardust || 0) + u.stardustGain;
        if (u.sundelionGain) this.inventory.sundelions = (this.inventory.sundelions || 0) + u.sundelionGain;

        if (u.type === 'sundelion') {
          audio.playBlupeeChime?.();
          this.engine.spawnShockwave(p.position, 3.5, 0xfacc15);
          this.engine.spawnParticles(p.position, 25, 0xfacc15, 4, 0.15);
          if (window.showGameNotification) {
            window.showGameNotification('🌼 Harvested Golden Sundelion! (+40 Bark HP, +30 Sap, clears Gloom)');
          }
        } else if (u.type === 'silent_princess') {
          audio.playBubbulfrogChime?.();
          this.engine.spawnCosmicBurst(p.position, 35);
          if (window.showGameNotification) {
            window.showGameNotification('🌸 Collected Sacred Silent Princess! (+100 Photosynthesis, +50 Biomass)');
          }
        } else if (u.type === 'bomb_flower') {
          audio.playHeadSlam?.(0.4);
          this.engine.spawnParticles(p.position, 20, 0xea580c, 3, 0.12);
          if (window.showGameNotification) {
            window.showGameNotification('💣 Harvested Bomb Flower! (+3 Acorn Artillery Munitions)');
          }
        } else if (u.type === 'poe') {
          audio.playBlupeeChime?.();
          this.engine.spawnParticles(p.position, 15, 0x38bdf8, 3, 0.12);
          if (window.showGameNotification) {
            window.showGameNotification('👻 Captured Poe Spirit! (+1 Stardust, +15 Biomass)');
          }
        } else {
          audio.playPhotosynthesis?.() || audio.playRootStep(1.8);
          this.engine.spawnParticles(p.position, 10, 0x60a5fa, 2, 0.1);
        }

        this.scene.remove(p);
        environment.pickups.splice(i, 1);
      }
    }

    // Check Zelda-style Korok Puzzle solving
    if (environment && environment.checkKorokPuzzles) {
      environment.checkKorokPuzzles(this.position, (puzzle) => {
        this.inventory.korokSeeds = (this.inventory.korokSeeds || 0) + 1;
        this.soilBiomass += 60;
        this.photosynthesis = Math.min(this.maxPhotosynthesis, this.photosynthesis + 30);
        audio.playCosmicSlam();
        this.engine.spawnCosmicBurst(puzzle.position, 35);
        this.engine.spawnShockwave(puzzle.position, 3.5, 0x22c55e);
        if (window.showGameNotification) {
          window.showGameNotification(`✨ Yahaha! You solved the ${puzzle.name} and found a Korok Seed! (+1 Seed, +60 Biomass)`);
        }
      });
    }

    // Check Stardust item collisions from day/night cycle
    for (let i = dayNight.fallenStardustItems.length - 1; i >= 0; i--) {
      const s = dayNight.fallenStardustItems[i];
      if (s.position.distanceTo(this.position) < 2.2) {
        this.inventory.stardust++;
        this.soilBiomass += 60;
        audio.playCosmicSlam();
        this.engine.spawnCosmicBurst(s.position, 30);
        this.scene.remove(s);
        dayNight.fallenStardustItems.splice(i, 1);
      }
    }

    // Check growth progress
    this.checkEvolution(dayNight.day);

    // 7. Update 3D Model Positions and Camera
    if (this.thirdPersonModel) {
      this.thirdPersonModel.position.copy(this.position);
      this.thirdPersonModel.position.y -= (1.1 + (this.growthStage - 1) * 0.55); // Align feet with ground
      this.thirdPersonModel.rotation.y = this.yaw;

      // Animate root legs if moving
      if (this.thirdPersonModel.userData.legs) {
        const isMoving = input.isKeyDown('KeyW') || input.isKeyDown('KeyS') || input.isKeyDown('KeyA') || input.isKeyDown('KeyD');
        this.thirdPersonModel.userData.legs.forEach((leg, lIdx) => {
          leg.rotation.x = isMoving ? Math.sin(Date.now() * 0.015 + lIdx) * 0.4 : 0;
        });
      }

      // Head-slam tilt on model
      if (this.thirdPersonModel.userData.trunkMesh) {
        this.thirdPersonModel.userData.trunkMesh.rotation.x = this.headSlamTilt;
      }
    }

    // Camera Placement & First/Third Person View Handling
    if (this.cameraMode === 'first_person') {
      // Accurate First-Person Evermean knot-hole sight line
      this.camera.position.copy(this.position);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch - this.headSlamTilt * 0.7; // Screen dips with head slam!

      // Animate First-Person View Rig (arms, canopy, and roots)
      if (this.firstPersonModel) {
        const isMoving = input.isKeyDown('KeyW') || input.isKeyDown('KeyS') || input.isKeyDown('KeyA') || input.isKeyDown('KeyD');
        const isSprinting = input.isKeyDown('ShiftLeft') && this.photosynthesis > 5;
        const time = Date.now() * 0.006;
        const walkBobY = isMoving ? Math.sin(time * 2.2) * (isSprinting ? 0.035 : 0.018) : Math.sin(time * 0.8) * 0.006;
        const walkBobX = isMoving ? Math.cos(time * 1.1) * (isSprinting ? 0.025 : 0.012) : 0;

        // Recoil recovery
        this.rightArmRecoil = THREE.MathUtils.lerp(this.rightArmRecoil, 0, delta * 7);

        const arms = this.firstPersonModel.userData;

        // Head slam animation: arms pull back, swing forward & down, then recover
        const slamOffsetZ = this.isAttacking ? (this.attackTimer > 0.35 ? -0.15 : 0.22) : 0;
        const slamOffsetY = this.isAttacking ? (this.attackTimer > 0.35 ? 0.08 : -0.2) : 0;
        const slamRotX = this.headSlamTilt * 0.8;

        if (arms.leftArm) {
          arms.leftArm.position.x = -0.44 + walkBobX * 0.5;
          arms.leftArm.position.y = -0.38 + walkBobY + slamOffsetY;
          arms.leftArm.position.z = -0.62 + slamOffsetZ;
          arms.leftArm.rotation.x = 0.18 + slamRotX;
        }

        if (arms.rightArm) {
          arms.rightArm.position.x = 0.44 + walkBobX * 0.5;
          arms.rightArm.position.y = -0.38 + walkBobY + slamOffsetY;
          arms.rightArm.position.z = -0.62 + slamOffsetZ + this.rightArmRecoil;
          arms.rightArm.rotation.x = 0.18 + slamRotX - this.rightArmRecoil * 1.2;
        }

        // Canopy boughs sway gently overhead with wind & motion
        if (arms.canopyGroup) {
          const canopySway = Math.sin(time * 0.9) * 0.012;
          arms.canopyGroup.position.y = canopySway - this.headSlamTilt * 0.12;
          arms.canopyGroup.rotation.z = walkBobX * 0.2;
        }

        // Lower body & roots stride when looking down
        if (arms.roots && isMoving) {
          arms.roots.forEach((root, rIdx) => {
            root.rotation.x = Math.sin(time * 2.2 + rIdx * Math.PI) * (isSprinting ? 0.55 : 0.32);
          });
        }
      }
    } else {
      // Smooth third-person spherical camera with pitch orbit & ground anti-clipping
      const pitchClamped = Math.max(-0.65, Math.min(1.1, this.pitch));
      const dist = 4.8 + (this.growthStage - 1) * 1.3;
      const hDist = dist * Math.cos(pitchClamped);
      const vDist = dist * Math.sin(pitchClamped);
      const camX = this.position.x - Math.sin(this.yaw) * hDist;
      const camZ = this.position.z - Math.cos(this.yaw) * hDist;
      const camGround = this.terrain.getHeight(camX, camZ);
      const camY = Math.max(camGround + 1.2, this.position.y + 1.2 + vDist);

      const targetCamPos = new THREE.Vector3(camX, camY, camZ);
      this.camera.position.lerp(targetCamPos, delta * 18);
      this.camera.lookAt(this.position.x, this.position.y + 0.6, this.position.z);
    }

    // Ultrahand Magnetic Tether & Held Object Physics
    if (this.isUltrahandActive && this.heldUltrahandObject) {
      const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const holdPos = this.position.clone().addScaledVector(forward, 3.8);
      const groundH = this.terrain.getHeight(holdPos.x, holdPos.z);
      holdPos.y = Math.max(groundH + 0.8, this.position.y + 0.5 - this.pitch * 1.5);

      this.heldUltrahandObject.position.lerp(holdPos, delta * 12);
      if (this.engine) {
        this.engine.renderUltrahandTether(this.position, this.heldUltrahandObject.position);
      }
    } else if (this.engine) {
      this.engine.hideUltrahandTether();
    }

    // Dynamic Sylvan River & Lake running water proximity audio
    const riverX = Math.sin(this.position.z * 0.025) * 28.0;
    const distToRiver = Math.abs(this.position.x - riverX);
    const distToLake = Math.hypot(this.position.x, this.position.z - 65);
    const minWaterDist = Math.min(distToRiver, distToLake);
    audio.updateWaterProximity(minWaterDist);
  }
}

export const player = new PlayerEvermean();

