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
      korokSeeds: 0
    };

    // States
    this.isGrounded = false;
    this.isSwimming = false;
    this.isDisguised = false;
    this.isRootBurrowed = false;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.headSlamTilt = 0;

    // 3D Models
    this.thirdPersonModel = null;
    this.firstPersonModel = null;
    this.scene = null;
    this.camera = null;
    this.terrain = null;
    this.engine = null;

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

    // 2. First Person View Model (Arms & branches in front of camera)
    this.firstPersonModel = TreeModelGenerator.createFirstPersonViewModel(this.speciesConfig);
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
  }

  // Head-Slam Attack: The classic TOTK tree monster slam!
  executeHeadSlam(environment, villagers) {
    if (this.isAttacking || this.moisture <= 5) return;

    this.isAttacking = true;
    this.attackTimer = 0.65;
    const isMantis = this.speciesConfig.hasMantisScythes;
    const power = 1.0 + (this.growthStage - 1) * 0.35;

    // Audio & Screen Shake
    audio.playHeadSlam(power, isMantis);
    this.engine.applyScreenShake(0.5 * power);

    // Consume slight stamina/moisture
    this.moisture = Math.max(0, this.moisture - 4);

    // Shockwave particle & ground ring
    const forwardDir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    const slamPoint = this.position.clone().addScaledVector(forwardDir, 2.0 * power);
    slamPoint.y = this.terrain.getHeight(slamPoint.x, slamPoint.z);

    this.engine.spawnShockwave(slamPoint, 2.5 * power, this.speciesConfig.glowColor || 0x8b5a2b);
    this.engine.spawnParticles(slamPoint, 25, 0x654321, 5 * power, 0.18);

    // Damage bonus if ambushing from camouflage disguise!
    const isSneakStrike = this.isDisguised;
    const baseDamage = (25 + this.growthStage * 15);

    if (isSneakStrike) {
      this.engine.applyScreenShake(0.8);
      this.engine.spawnShockwave(slamPoint, 4.0, 0xf59e0b);
      this.isDisguised = false;
    }

    // 1. Check hitting Woodcutter Goblins
    villagers.goblins.forEach(goblin => {
      if (goblin.position.distanceTo(slamPoint) < 3.8 * (this.speciesConfig.slamRadiusMult || 1.0)) {
        const res = villagers.damageGoblin(goblin, baseDamage, this.engine, audio, isSneakStrike);
        if (res.defeated) {
          this.inventory.wood += res.woodReward;
          this.soilBiomass += res.biomassReward;
          if (res.acornReward) this.inventory.acorns += res.acornReward;
        }
      }
    });

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

    if (isMantis) {
      // Razor-sharp wooden Mantis scythe sweep
      audio.playMantisSlash();
      this.engine.spawnParticles(hitPoint, 20, 0x84cc16, 4.5, 0.1);

      villagers.goblins.forEach(g => {
        if (g.position.distanceTo(hitPoint) < 3.2) {
          villagers.damageGoblin(g, 40, this.engine, audio);
        }
      });
    } else if (element === 'fire') {
      audio.playFireBurst();
      this.engine.spawnParticles(hitPoint, 30, 0xff4500, 5, 0.15);
      villagers.goblins.forEach(g => {
        if (g.position.distanceTo(hitPoint) < 4.0) {
          villagers.damageGoblin(g, 35, this.engine, audio);
        }
      });
    } else if (element === 'lightning') {
      audio.playThunderSlam();
      this.engine.spawnParticles(hitPoint, 25, 0x00e5ff, 6, 0.12);
      this.engine.applyScreenShake(0.3);
      villagers.goblins.forEach(g => {
        if (g.position.distanceTo(hitPoint) < 5.0) {
          villagers.damageGoblin(g, 38, this.engine, audio);
        }
      });
    } else if (element === 'cosmic' || this.growthStage === 5) {
      // Cosmic Gravity Singularity Detonation
      audio.playCosmicSlam();
      this.engine.spawnCosmicBurst(hitPoint, 40);
      this.engine.applyScreenShake(0.6);
      villagers.goblins.forEach(g => {
        if (g.position.distanceTo(hitPoint) < 7.0) {
          villagers.damageGoblin(g, 75, this.engine, audio);
        }
      });
    } else {
      // Pointy Root Leg thrust forward
      audio.playRootStep(1.4);
      this.engine.spawnParticles(hitPoint, 15, 0x8b5a2b, 3.5, 0.1);
      villagers.goblins.forEach(g => {
        if (g.position.distanceTo(hitPoint) < 2.8) {
          villagers.damageGoblin(g, 25, this.engine, audio);
        }
      });
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

        const isSprinting = input.isKeyDown('ShiftLeft') && this.photosynthesis > 5;
        if (isSprinting) this.photosynthesis -= delta * 8;

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
          }
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

      const treeEyeHeight = 0.8 + (this.growthStage - 1) * 0.45;
      if (this.position.y <= groundHeight + treeEyeHeight) {
        this.position.y = groundHeight + treeEyeHeight;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    }

    // 6. Check Pickup Collisions (Dew, Acorns, Stardust)
    for (let i = environment.pickups.length - 1; i >= 0; i--) {
      const p = environment.pickups[i];
      if (p.position.distanceTo(this.position) < 2.0) {
        const u = p.userData;
        if (u.moistureGain) this.moisture = Math.min(this.maxMoisture, this.moisture + u.moistureGain);
        if (u.biomassGain) this.soilBiomass += u.biomassGain;
        if (u.ammoGain) this.inventory.acorns += u.ammoGain;
        audio.playPhotosynthesis?.() || audio.playRootStep(1.8);
        this.engine.spawnParticles(p.position, 10, 0x60a5fa, 2, 0.1);
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
      this.thirdPersonModel.position.y -= (0.8 + (this.growthStage - 1) * 0.45); // Align feet with ground
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

    // Camera Placement
    if (this.cameraMode === 'first_person') {
      this.camera.position.copy(this.position);
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch - this.headSlamTilt * 0.7; // Screen dips with head slam!

      // Animate first-person view arms (sway with movement & attack)
      if (this.firstPersonModel) {
        const arms = this.firstPersonModel.userData;
        const bob = Math.sin(Date.now() * 0.01) * 0.02;
        if (arms.leftArm) arms.leftArm.position.y = -0.4 + bob - this.headSlamTilt * 0.3;
        if (arms.rightArm) arms.rightArm.position.y = -0.4 + bob - this.headSlamTilt * 0.3;
      }
    } else {
      // Third-person camera behind tree
      const dist = 4.5 + (this.growthStage - 1) * 1.2;
      const camX = this.position.x - Math.sin(this.yaw) * dist;
      const camZ = this.position.z - Math.cos(this.yaw) * dist;
      const camY = Math.max(groundHeight + 1.0, this.position.y + 2.2);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.position.x, this.position.y + 0.8, this.position.z);
    }
  }
}

export const player = new PlayerEvermean();

