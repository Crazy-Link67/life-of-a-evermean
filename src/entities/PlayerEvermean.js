import * as THREE from 'three';
import { TreeModelGenerator } from './TreeModelGenerator.js';
import { LinkModelGenerator } from './LinkModelGenerator.js';
import { audio } from '../core/AudioManager.js';
import { collision } from '../core/Collision.js';

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
      sundelions: 0,
      lightsOfBlessing: 0
    };

    // States
    this.isGrounded = false;
    this.isSwimming = false;
    this.isUnderwater = false;
    this.swimBubblesTimer = 0;
    this.isDisguised = false;
    this.isRootBurrowed = false;
    this.isAttacking = false;
    this.isGliding = false;
    this.attackTimer = 0;
    this.headSlamTilt = 0;
    this.rightArmRecoil = 0;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.launchCooldown = 0;
    this.walkCycle = 0;

    // 3D Models
    this.thirdPersonModel = null;
    this.firstPersonModel = null;
    this.gliderMesh = null;
    this.recallTrajectoryLine = null;
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

    // Zelda TOTK Recall System
    this.isRecallActive = false;
    this.recalledObject = null;

    // Head-bobbing & root-step timer
    this.stepTimer = 0;
    this.swimTimer = 0;

    // Secret Hero of Hyrule Link Mode (Toggle with L)
    this.isLinkMode = false;
    this.linkModelTP = null;
    this.linkModelFP = null;
    this.linkCombo = 0;
    this.linkComboTimer = 0;
    this.linkSlashTilt = 0;
    this.linkHearts = 6;
    this.linkMaxHearts = 6;
    this.zonaiEnergy = 100;
    this.zonaiMaxEnergy = 100;

    // Link Equipment & TOTK Inventory System
    this.isShieldRaised = false;
    this.equippedWeapon = { id: 'master_sword', name: 'Master Sword', atk: 30, icon: '🗡️', desc: 'The legendary blade that seals the darkness.' };
    this.equippedShield = { id: 'hylian_shield', name: 'Hylian Shield', def: 90, icon: '🛡️', desc: 'A legendary indestructible shield blessed by the Goddess.' };
    this.equippedArmor = { id: 'champions_leathers', name: "Champion's Leathers", def: 32, icon: '🥋', desc: 'Cyan tunic embroidered with white crests, restored by Zelda.' };

    this.totkInventory = {
      weapons: [
        { id: 'master_sword', name: 'Master Sword', atk: 30, icon: '🗡️', desc: 'The legendary blade that seals the darkness.' },
        { id: 'soldier_broadsword', name: "Soldier's Broadsword", atk: 16, icon: '⚔️', desc: 'A sleek steel blade used by Hyrulean knights.' },
        { id: 'rusty_claymore', name: 'Rusty Claymore', atk: 12, icon: '🗡️', desc: 'A weathered two-handed blade found in ruins.' }
      ],
      shields: [
        { id: 'hylian_shield', name: 'Hylian Shield', def: 90, icon: '🛡️', desc: 'A legendary indestructible shield blessed by the Goddess.' },
        { id: 'pot_lid', name: 'Pot Lid', def: 2, icon: '🥘', desc: 'A wooden soup pot lid, surprisingly good for parrying.' },
        { id: 'wooden_shield', name: 'Wooden Shield', def: 6, icon: '🛡️', desc: 'A lightweight shield carved from thick forest oak.' }
      ],
      armor: [
        { id: 'champions_leathers', name: "Champion's Leathers", def: 32, icon: '🥋', desc: 'Cyan tunic embroidered with white crests, restored by Zelda.' },
        { id: 'hylian_tunic', name: 'Hylian Tunic', def: 12, icon: '👕', desc: 'Standard comfortable traveling clothes.' },
        { id: 'glide_shirt', name: 'Glide Shirt', def: 18, icon: '🪂', desc: 'Aerodynamic flight suit crafted for sky diving mastery.' }
      ],
      materials: [
        { id: 'apple', name: 'Apple', qty: 6, icon: '🍎', desc: 'A crisp, sweet woodland fruit. Restores hearts when cooked.' },
        { id: 'hylian_shroom', name: 'Hylian Shroom', qty: 4, icon: '🍄', desc: 'A common mushroom found at the base of forest trees.' },
        { id: 'raw_meat', name: 'Raw Prime Meat', qty: 2, icon: '🥩', desc: 'High-grade fresh venison. Sizzles deliciously over campfires.' },
        { id: 'sundelion', name: 'Sundelion', qty: 3, icon: '🌼', desc: 'Wild golden blossom that flourishes in high sky sunlight. Cures gloom.' },
        { id: 'silent_princess', name: 'Silent Princess', qty: 2, icon: '🌸', desc: 'A rare and sacred flower beloved by Princess Zelda.' }
      ],
      meals: [
        { id: 'hearty_steamed_meat', name: 'Hearty Steamed Meat', hearts: 6, stamina: 60, icon: '🍲', desc: 'Savory simmered meat with herbs. Restores full hearts!' },
        { id: 'simmered_fruit', name: 'Energizing Simmered Fruit', hearts: 4, stamina: 100, icon: '🥗', desc: 'Warm sweet forest apples boiled to perfection. Refills stamina.' }
      ]
    };
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
    if (this.isLinkMode) {
      if (this.thirdPersonModel) this.thirdPersonModel.visible = false;
      if (this.firstPersonModel) this.firstPersonModel.visible = false;
      if (this.cameraMode === 'first_person') {
        if (this.linkModelTP) this.linkModelTP.visible = false;
        if (this.linkModelFP) this.linkModelFP.visible = true;
      } else {
        if (this.linkModelTP) this.linkModelTP.visible = true;
        if (this.linkModelFP) this.linkModelFP.visible = false;
      }
    } else {
      if (this.linkModelTP) this.linkModelTP.visible = false;
      if (this.linkModelFP) this.linkModelFP.visible = false;
      if (this.cameraMode === 'first_person') {
        if (this.thirdPersonModel) this.thirdPersonModel.visible = false;
        if (this.firstPersonModel) this.firstPersonModel.visible = true;
      } else {
        if (this.thirdPersonModel) this.thirdPersonModel.visible = true;
        if (this.firstPersonModel) this.firstPersonModel.visible = false;
      }
    }
  }

  toggleCameraMode() {
    this.cameraMode = (this.cameraMode === 'first_person') ? 'third_person' : 'first_person';
    this.updateModelVisibility();
    if (window.showGameNotification) {
      window.showGameNotification(this.cameraMode === 'first_person' ? '👁️ First-Person Sight' : '🌲 Third-Person Horizon View');
    }
  }

  // Secret Mode: Press L to Transform into Link (Hero of Hyrule - Tears of the Kingdom)
  toggleLinkMode() {
    this.isLinkMode = !this.isLinkMode;

    if (this.isLinkMode) {
      if (!this.linkModelTP && this.scene) {
        this.linkModelTP = LinkModelGenerator.createLinkThirdPersonModel();
        this.linkModelTP.position.copy(this.position);
        this.scene.add(this.linkModelTP);
      }
      if (!this.linkModelFP && this.camera) {
        this.linkModelFP = LinkModelGenerator.createLinkFirstPersonModel();
        this.camera.add(this.linkModelFP);
      }
      audio.playLinkTransform?.();
      audio.playZonaiBoost?.();
      if (this.engine) {
        this.engine.spawnCosmicBurst(this.position, 60);
        this.engine.spawnShockwave(this.position, 5.0, 0x10b981);
      }
      if (window.showGameNotification) {
        window.showGameNotification('🗡️ HERO OF HYRULE AWAKENED! Transformed into Link with King Rauru\'s Zonai Arm & Master Sword! (Click: Slash, R-Click: Spin Attack, L: Toggle)');
      }
    } else {
      audio.playEvolution?.();
      if (this.engine) {
        this.engine.spawnShockwave(this.position, 4.0, 0x22c55e);
      }
      if (window.showGameNotification) {
        window.showGameNotification('🌲 RESTORED GROVE WARDEN! Returned to Ancient Evermean form. (Press L to transform into Link)');
      }
    }

    this.updateModelVisibility();
  }

  // World Interactions: Lightroot activation in Depths, Sunken Zora Relic Chests in lakebed
  interactWorld(environment) {
    if (!environment) return false;

    // 1. Ancient Zonai Lightroot in The Depths realm
    if (environment.lightroot && !environment.lightroot.userData?.activated) {
      const rootPos = environment.lightroot.userData.position || environment.lightroot.position;
      const dist = this.position.distanceTo(rootPos);
      if (dist < 6.5) {
        environment.lightroot.userData.activated = true;
        audio.playLightrootIgnite?.();
        if (this.engine) {
          this.engine.spawnShockwave(rootPos, 18.0, 0xfacc15);
          this.engine.spawnCosmicBurst(rootPos, 80);
          this.engine.applyScreenShake(0.7);
        }

        // Turn Lightroot PointLight to brilliant brightness illuminating Depths
        environment.lightroot.traverse(child => {
          if (child.isPointLight) {
            child.intensity = 8.5;
            child.distance = 250;
          }
        });

        // Restore health, full moisture, grant blessings
        this.barkHp = this.maxBarkHp;
        this.moisture = this.maxMoisture;
        this.inventory.lightsOfBlessing = (this.inventory.lightsOfBlessing || 0) + 1;
        this.soilBiomass += 200;
        this.inventory.stardust = (this.inventory.stardust || 0) + 3;

        if (window.showGameNotification) {
          window.showGameNotification('🌟 LIGHTROOT AWAKENED! Ancient roots dispel the Depths Gloom! (+1 Light of Blessing, +200 Biomass, Full Restoration)');
        }
        return true;
      }
    }

    // 2. Sunken Ancient Zora Chests on Lakebed
    if (environment.underwaterChests) {
      for (const chest of environment.underwaterChests) {
        const chestPos = chest.userData?.position || chest.position;
        const dist = this.position.distanceTo(chestPos);
        if (dist < 4.0 && !chest.userData?.opened) {
          chest.userData.opened = true;
          chest.rotation.x = -0.4;
          audio.playChestOpen?.();
          if (this.engine) {
            this.engine.spawnShockwave(chestPos, 4.5, 0x38bdf8);
            this.engine.spawnCosmicBurst(chestPos, 45);
          }

          this.inventory.lightsOfBlessing = (this.inventory.lightsOfBlessing || 0) + 1;
          this.inventory.rupees = (this.inventory.rupees || 0) + 100;
          this.soilBiomass += 150;
          this.inventory.stardust = (this.inventory.stardust || 0) + 5;
          this.inventory.acorns = (this.inventory.acorns || 0) + 10;

          if (window.showGameNotification) {
            window.showGameNotification('🔱 Discovered Sunken Zora Relic Chest! (+1 Light of Blessing, +100 Rupees, +150 Biomass, +5 Stardust)');
          }
          return true;
        }
      }
    }

    return false;
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

  // Paraglider / Leaf Canopy deploy
  attachGliderMesh() {
    if (this.isLinkMode) {
      if (this.linkModelTP?.userData?.paraglider) {
        this.linkModelTP.userData.paraglider.visible = true;
      }
      if (this.linkModelFP?.userData?.paragliderFP) {
        this.linkModelFP.userData.paragliderFP.visible = true;
      }
      audio.playParagliderOpen?.();
      return;
    }

    if (this.gliderMesh || !this.thirdPersonModel) return;
    const glider = new THREE.Group();

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x15803d,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.55
    });

    const wingL = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 5), leafMat);
    wingL.rotation.z = Math.PI / 2 + 0.2;
    wingL.rotation.y = -0.3;
    wingL.position.set(-1.8, 0.2, 0);
    glider.add(wingL);

    const wingR = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 5), leafMat);
    wingR.rotation.z = -Math.PI / 2 - 0.2;
    wingR.rotation.y = 0.3;
    wingR.position.set(1.8, 0.2, 0);
    glider.add(wingR);

    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 6), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
    vine.rotation.z = Math.PI / 2;
    glider.add(vine);

    glider.position.set(0, 3.2 * (this.growthStage * 0.4 + 0.6), 0);
    this.thirdPersonModel.add(glider);
    this.gliderMesh = glider;
    audio.playGliderDeploy?.();
  }

  detachGliderMesh() {
    if (this.linkModelTP?.userData?.paraglider) {
      this.linkModelTP.userData.paraglider.visible = false;
    }
    if (this.linkModelFP?.userData?.paragliderFP) {
      this.linkModelFP.userData.paragliderFP.visible = false;
    }
    if (this.gliderMesh && this.thirdPersonModel) {
      this.thirdPersonModel.remove(this.gliderMesh);
      this.gliderMesh = null;
    }
  }

  // Render 3D golden chronomancy motion path
  renderRecallTrajectory(obj) {
    this.clearRecallTrajectory();
    if (!obj || !obj.userData.history || obj.userData.history.length < 2) return;

    const points = obj.userData.history.map(h => h.pos);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xfacc15,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    this.recallTrajectoryLine = new THREE.Line(geom, mat);
    this.scene.add(this.recallTrajectoryLine);
  }

  clearRecallTrajectory() {
    if (this.recallTrajectoryLine) {
      this.scene.remove(this.recallTrajectoryLine);
      this.recallTrajectoryLine.geometry?.dispose();
      this.recallTrajectoryLine.material?.dispose();
      this.recallTrajectoryLine = null;
    }
  }

  // Zelda TOTK Recall Ability (Key Z)
  toggleRecall(environment) {
    if (this.isRecallActive && this.recalledObject) {
      this.clearRecallTrajectory();
      this.recalledObject.userData.isRecalling = false;
      this.recalledObject = null;
      this.isRecallActive = false;
      audio.stopRecallHum?.();
      if (window.showGameNotification) {
        window.showGameNotification('⏳ Recall released.');
      }
      return;
    }

    // Collect all candidate objects from environment & 3D dungeon chambers
    const candidates = [];
    if (environment && environment.fusableObjects) candidates.push(...environment.fusableObjects);
    if (window.game && window.game.shrineSystem?.activeDungeon?.puzzleProps) {
      candidates.push(...window.game.shrineSystem.activeDungeon.puzzleProps);
    }

    let closestObj = null;
    let closestDist = 20.0;

    for (const obj of candidates) {
      const dist = obj.position.distanceTo(this.position);
      if (dist < closestDist && obj.userData.history && obj.userData.history.length > 3) {
        closestDist = dist;
        closestObj = obj;
      }
    }

    if (!closestObj) {
      for (const obj of candidates) {
        const dist = obj.position.distanceTo(this.position);
        if (dist < closestDist) {
          closestDist = dist;
          closestObj = obj;
        }
      }
    }

    if (!closestObj) {
      if (window.showGameNotification) {
        window.showGameNotification('❓ Stand near a movable boulder or prop to activate Recall!');
      }
      return;
    }

    this.isRecallActive = true;
    this.recalledObject = closestObj;
    closestObj.userData.isRecalling = true;

    this.renderRecallTrajectory(closestObj);

    audio.startRecallHum?.();
    audio.playRecallTick?.();
    if (this.engine) {
      this.engine.spawnCosmicBurst(closestObj.position, 45);
      this.engine.applyScreenShake(0.35);
    }

    if (window.showGameNotification) {
      window.showGameNotification(`⏳ RECALL ACTIVATED: Rewinding ${closestObj.userData.name || 'Object'} through time!`);
    }
  }

  // Head-Slam Attack: The classic TOTK tree monster slam!
  executeHeadSlam(environment, villagers) {
    if (this.isAttacking || this.moisture <= 5) return;

    if (this.isLinkMode) {
      this.executeLinkSwordSlash(environment, villagers);
      return;
    }

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

  // Secret Hero of Hyrule: Master Sword 3-Hit Slash Combo with Radiant Energy Beam
  executeLinkSwordSlash(environment, villagers) {
    this.isAttacking = true;
    this.attackTimer = 0.42;
    this.linkCombo = ((this.linkCombo || 0) + 1) % 3;

    audio.playMasterSwordSlash?.();
    this.engine.applyScreenShake(0.25);

    const forwardDir = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).normalize();
    const hitPoint = this.position.clone().addScaledVector(forwardDir, 2.2);

    const arcColor = (this.linkCombo === 2) ? 0x67e8f9 : 0x38bdf8;
    this.engine.spawnShockwave(hitPoint, 3.2, arcColor);
    this.engine.spawnParticles(hitPoint, 16, 0x67e8f9, 4, 0.12);

    // Full Health: Master Sword Fires Radiant Energy Blade!
    const isFullHp = (this.barkHp >= this.maxBarkHp || this.linkHearts >= this.linkMaxHearts);
    if (isFullHp) {
      audio.playMasterSwordBeam?.();
      this.fireMasterSwordBeam(villagers);
    }

    const slashDamage = 45 + this.linkCombo * 15;
    const slashRadius = 3.6;

    this.damageCreaturesInArea(villagers, hitPoint, slashRadius, slashDamage);

    if (environment && environment.breakables) {
      for (let i = environment.breakables.length - 1; i >= 0; i--) {
        const item = environment.breakables[i];
        if (item.position.distanceTo(hitPoint) < slashRadius) {
          item.userData.hp -= slashDamage;
          this.engine.spawnParticles(item.position, 12, 0x5c4033, 3, 0.12);
          if (item.userData.hp <= 0) {
            this.inventory.wood += item.userData.woodYield || 15;
            this.inventory.acorns += 2;
            this.soilBiomass += 15;
            this.engine.spawnParticles(item.position, 25, 0x2e7d32, 5, 0.2);
            this.scene.remove(item);
            environment.breakables.splice(i, 1);
          }
        }
      }
    }

    if (villagers && villagers.demonKing) {
      if (villagers.demonKing.position.distanceTo(hitPoint) < slashRadius + 2.2) {
        villagers.damageDemonKing(slashDamage, this.engine, audio, this);
      }
    }
  }

  fireMasterSwordBeam(villagers) {
    const forwardDir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();

    const beamGeom = new THREE.TorusGeometry(0.65, 0.08, 6, 16, Math.PI);
    beamGeom.rotateY(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeom, beamMat);
    beamMesh.position.copy(this.position);
    beamMesh.position.y += 1.4;
    beamMesh.rotation.y = this.yaw;
    this.scene.add(beamMesh);

    const vel = forwardDir.multiplyScalar(32);
    let lifetime = 0;

    const interval = setInterval(() => {
      lifetime += 0.035;
      beamMesh.position.addScaledVector(vel, 0.035);

      if (Math.random() < 0.5 && this.engine) {
        this.engine.spawnParticles(beamMesh.position, 2, 0x67e8f9, 1.2, 0.06);
      }

      if (villagers && villagers.demonKing) {
        if (villagers.demonKing.position.distanceTo(beamMesh.position) < 2.5) {
          clearInterval(interval);
          this.engine.spawnCosmicBurst(beamMesh.position, 25);
          villagers.damageDemonKing(55, this.engine, audio, this);
          this.scene.remove(beamMesh);
          return;
        }
      }

      if (villagers && villagers.goblins) {
        for (let g of villagers.goblins) {
          if (g.position.distanceTo(beamMesh.position) < 1.8) {
            clearInterval(interval);
            this.engine.spawnCosmicBurst(beamMesh.position, 25);
            villagers.damageGoblin(g, 60, this.engine, audio);
            this.scene.remove(beamMesh);
            return;
          }
        }
      }

      if (lifetime > 3.0) {
        clearInterval(interval);
        this.scene.remove(beamMesh);
      }
    }, 35);
  }

  // Hero of Hyrule 360 Spin Attack
  executeLinkSpinAttack(villagers) {
    this.isAttacking = true;
    this.attackTimer = 0.55;

    audio.playSpinAttack?.();
    this.engine.applyScreenShake(0.35);

    this.engine.spawnShockwave(this.position, 6.5, 0x38bdf8);
    this.engine.spawnParticles(this.position, 35, 0x67e8f9, 6.0, 0.18);

    const spinDamage = 75;
    const spinRadius = 6.5;

    this.damageCreaturesInArea(villagers, this.position, spinRadius, spinDamage);

    if (villagers && villagers.demonKing) {
      if (villagers.demonKing.position.distanceTo(this.position) < spinRadius + 2.0) {
        villagers.damageDemonKing(spinDamage, this.engine, audio, this);
      }
    }
  }

  // Secondary Action: Mantis Scythe Slash, Fire Burst, Lightning Arc, or Cosmic Singularity
  executeSecondaryAction(villagers) {
    if (this.isAttacking) return;

    if (this.isLinkMode) {
      this.executeLinkSpinAttack(villagers);
      return;
    }

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
    if (this.isLinkMode) {
      if (this.isShieldRaised) {
        // 100% Shield Block Deflection!
        audio.playShieldBlock?.();
        if (this.engine) {
          this.engine.spawnParticles(this.position, 14, 0xfacc15, 3.5, 0.1);
          this.engine.spawnShockwave(this.position, 2.2, 0x38bdf8);
        }
        if (window.showGameNotification) {
          window.showGameNotification(`🛡️ DEFLECTED! Attack blocked with ${this.equippedShield?.name || 'Hylian Shield'}! (0 Damage)`);
        }
        return;
      }

      const heartDmg = Math.max(0.5, Math.ceil((amount / 20) * 2) / 2);
      this.linkHearts = Math.max(0, this.linkHearts - heartDmg);
      this.barkHp = Math.max(0, this.barkHp - amount);
      this.engine.spawnParticles(this.position, 15, 0xef4444, 3, 0.15);
      if (this.linkHearts <= 0) {
        this.linkHearts = 3;
        this.barkHp = 50;
        this.position.set(10, 85.2, 52); // Return to Room of Awakening
        if (window.showGameNotification) {
          window.showGameNotification('🧚 A sacred fairy restored your spirit! Returned to the Room of Awakening.');
        }
      }
      return;
    }

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
        const swimSpeedMult = this.speciesConfig.presetKey === 'palm' ? 1.4 : 0.85;
        const glideSpeedMult = this.isGliding ? 1.45 : 1.0;
        const currentSpeed = (this.isSwimming ? baseSpeed * swimSpeedMult : baseSpeed) * (isSprinting ? 1.6 : 1.0) * glideSpeedMult;

        // Realistic kinematic body tilt while moving
        const targetRoll = -moveDir.x * (isSprinting ? 0.16 : 0.08);
        const targetPitch = moveDir.z * (isSprinting ? 0.12 : 0.06);
        this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, targetRoll, delta * 9);
        this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, targetPitch, delta * 9);

        // Rotate movement relative to player yaw
        const sin = Math.sin(this.yaw);
        const cos = Math.cos(this.yaw);
        const worldMoveX = moveDir.x * cos + moveDir.z * sin;
        const worldMoveZ = -moveDir.x * sin + moveDir.z * cos;

        this.position.x += worldMoveX * currentSpeed * delta;
        this.position.z += worldMoveZ * currentSpeed * delta;

        // Solid Obstacle Collision: resolve sliding against trees, full cylindrical logs, boulders, palisades, dungeon walls
        collision.resolvePlayerCollision(this.position, 0.55, 2.2);

        // Footstep / Swim sound timer
        this.stepTimer += delta * (isSprinting ? 1.8 : 1.0);
        if (this.stepTimer > 0.35) {
          this.stepTimer = 0;
          if (this.isSwimming) {
            audio.playSwimPaddle();
            this.engine.spawnWaterSplash(this.position, 8);
          } else if (this.isGrounded) {
            audio.playRootStep(this.growthStage * 0.15 + 0.85);
            if (isSprinting && this.engine) {
              this.engine.spawnParticles(this.position, 2, 0x654321, 1.2, 0.08);
            }
          }
        }
      } else {
        this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, 0, delta * 7);
        this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, 0, delta * 7);
        this.stamina = Math.min(this.maxStamina, this.stamina + delta * 35);
        if (this.isExhausted) {
          this.exhaustionTimer -= delta;
          if (this.exhaustionTimer <= 0) this.isExhausted = false;
        }
      }

      // 3D Underwater Swim Controls (Space to paddle up, ControlLeft/KeyC to dive, or pitch-based swim)
      if (this.isSwimming) {
        let verticalSwimSpeed = 0;
        if (input.isKeyDown('Space')) {
          verticalSwimSpeed += 4.5;
        }
        if (input.isKeyDown('ControlLeft') || input.isKeyDown('KeyC')) {
          verticalSwimSpeed -= 4.5;
        }
        if (input.isKeyDown('KeyW')) {
          verticalSwimSpeed += Math.sin(this.pitch) * 4.0;
        } else if (input.isKeyDown('KeyS')) {
          verticalSwimSpeed -= Math.sin(this.pitch) * 4.0;
        }
        this.velocity.y = THREE.MathUtils.lerp(this.velocity.y, verticalSwimSpeed, delta * 5.0);
      } else {
        // Jump (when grounded on dry land)
        if (input.isKeyDown('Space') && this.isGrounded) {
          this.velocity.y = 6.8;
          this.isGrounded = false;
          audio.playRootStep(1.3);
        }
      }
    }

    // 5. Physics & Terrain Elevation (including Great Sky Islands plateaus & Depths underworld)
    let effectiveGroundHeight = this.terrain.getHeight(this.position.x, this.position.z, this.position.y);
    let isOnSkyIsland = false;

    // Great Sky Island Diving Board explicit support (prevents falling off prematurely)
    if (Math.abs(this.position.x - 10) <= 2.6 && this.position.z >= 20.0 && this.position.z <= 36.0 && this.position.y >= 78.0) {
      effectiveGroundHeight = 84.5;
      isOnSkyIsland = true;
    }

    if (environment && environment.skyIslands) {
      for (const isl of environment.skyIslands) {
        const u = isl.userData;
        if (u && u.radius && u.surfaceY) {
          const dx = this.position.x - isl.position.x;
          const dz = this.position.z - isl.position.z;
          const distH = Math.hypot(dx, dz);
          if (distH <= u.radius + 1.2) {
            // Check if player is near or above this sky island surface
            if (this.position.y >= u.surfaceY - 2.8) {
              if (u.surfaceY > effectiveGroundHeight) {
                effectiveGroundHeight = u.surfaceY;
                isOnSkyIsland = true;
              }
            }
          }
        }
      }
    }

    // Check if player is inside an ancient 3D Zonai Dungeon Chamber
    if (window.game && window.game.shrineSystem) {
      const dFloor = window.game.shrineSystem.getDungeonFloor(this.position.x, this.position.y, this.position.z);
      if (dFloor !== null) {
        effectiveGroundHeight = dFloor;
      }
    }

    if (this.isSwimming) {
      // 3D Underwater Swimming & Natural Buoyancy
      this.position.y += this.velocity.y * delta;

      const waterSurface = this.terrain.waterLevel || 0.0;
      const isInputtingVertical = input.isKeyDown('Space') || input.isKeyDown('ControlLeft') || input.isKeyDown('KeyC') || (input.isKeyDown('KeyW') && Math.abs(this.pitch) > 0.2);
      if (!isInputtingVertical) {
        // Gentle natural buoyancy toward water surface
        this.position.y = THREE.MathUtils.lerp(this.position.y, Math.min(this.position.y + 0.4, waterSurface + 0.05), delta * 1.8);
        this.velocity.y *= Math.max(0, 1.0 - delta * 2.5);
      }

      // Lake Bed & Surface Bounds clamping
      const bedY = this.terrain.getHeight(this.position.x, this.position.z, this.position.y);
      const minSwimY = bedY + 0.85;
      const maxSwimY = waterSurface + 0.25;

      if (this.position.y < minSwimY) {
        this.position.y = minSwimY;
        if (this.velocity.y < 0) this.velocity.y = 0;
      }
      if (this.position.y > maxSwimY) {
        this.position.y = maxSwimY;
        if (this.velocity.y > 0) this.velocity.y = 0;
      }

      this.isGrounded = (this.position.y <= minSwimY + 0.1);
      if (this.isGliding) {
        this.isGliding = false;
        this.detachGliderMesh();
      }

      // Underwater State & Audio transitions
      const wasUnderwater = this.isUnderwater;
      this.isUnderwater = (this.position.y < waterSurface - 0.35);

      if (!wasUnderwater && this.isUnderwater) {
        audio.playDiveSplash?.();
        audio.startUnderwaterAmbience?.();
        if (this.engine) this.engine.spawnWaterSplash(this.position, 12);
      } else if (wasUnderwater && !this.isUnderwater) {
        audio.stopUnderwaterAmbience?.();
        audio.playSwimPaddle?.();
        if (this.engine) this.engine.spawnWaterSplash(this.position, 10);
      }

      // Emit bubbles when swimming underwater
      const isMovingUnderwater = input.isKeyDown('KeyW') || input.isKeyDown('KeyS') || input.isKeyDown('KeyA') || input.isKeyDown('KeyD');
      if (this.isUnderwater && isMovingUnderwater) {
        this.swimBubblesTimer = (this.swimBubblesTimer || 0) + delta;
        if (this.swimBubblesTimer > 0.2) {
          this.swimBubblesTimer = 0;
          if (this.engine) {
            this.engine.spawnParticles(this.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 3, 0xa5f3fc, 0.8, 0.06);
          }
        }
      }
    } else {
      // Zelda Deku Leaf / Paraglider gliding (hold Space mid-air while descending)
      if (!this.isGrounded && this.velocity.y < 0 && input.isKeyDown('Space') && this.stamina > 2) {
        if (!this.isGliding) {
          this.isGliding = true;
          this.attachGliderMesh();
        }
        // Smoothly settle at terminal descent speed (-2.8 m/s)
        this.velocity.y = THREE.MathUtils.lerp(this.velocity.y, -2.8, delta * 6);
        this.stamina = Math.max(0, this.stamina - delta * 6);
        this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, 0.18, delta * 8);

        if (this.stamina <= 0) {
          this.isGliding = false;
          this.detachGliderMesh();
        }
      } else if (this.isGliding) {
        this.isGliding = false;
        this.detachGliderMesh();
      }

      const treeEyeHeight = 1.1 + (this.growthStage - 1) * 0.55;
      const targetGroundedY = effectiveGroundHeight + treeEyeHeight;

      // Gravity & Ground Snapping (allows freefall into the Gloom Chasm down to -90m Depths!)
      if (!this.isGliding) {
        if (!this.isGrounded) {
          this.velocity.y -= 18.0 * delta;
          this.position.y += this.velocity.y * delta;
          if (this.position.y <= targetGroundedY) {
            this.position.y = targetGroundedY;
            this.velocity.y = 0;
            this.isGrounded = true;
            if (this.isGliding) {
              this.isGliding = false;
              this.detachGliderMesh();
            }
          }
        } else {
          // Check if walked off a ledge or cliff
          if (this.position.y > targetGroundedY + 0.25) {
            this.isGrounded = false;
          } else {
            // Smoothly conform to terrain without vibration
            this.position.y = THREE.MathUtils.lerp(this.position.y, targetGroundedY, Math.min(1.0, delta * 24));
            this.velocity.y = 0;
          }
        }
      }
    }

    // Resolve collision against obstacles again after vertical displacement
    collision.resolvePlayerCollision(this.position, 0.55, 2.2);

    // Check Zonai Boost Pads (Ascend / High sky launch) - 100% Reliable 2D Horizontal & Foot-Level Detection
    this.launchCooldown = Math.max(0, (this.launchCooldown || 0) - delta);
    if (this.launchCooldown <= 0 && environment && environment.zonaiPads) {
      const treeEyeHeight = 1.1 + (this.growthStage - 1) * 0.55;
      const footY = this.position.y - treeEyeHeight;

      for (const pad of environment.zonaiPads) {
        const dx = this.position.x - pad.position.x;
        const dz = this.position.z - pad.position.z;
        const distH = Math.hypot(dx, dz);
        const padRadius = pad.userData?.radius || 2.8;

        if (distH <= padRadius && Math.abs(footY - pad.position.y) < 3.2) {
          const launchVel = pad.userData?.launchVelocity || 68.0;
          this.velocity.y = launchVel; // High sky launch or depths ascend!
          this.isGrounded = false;
          this.launchCooldown = 0.8;
          if (this.isGliding) {
            this.isGliding = false;
            this.detachGliderMesh();
          }
          audio.playZonaiBoost?.();
          audio.playCosmicSlam?.();
          this.engine.spawnShockwave(pad.position, 7.5, 0x10b981);
          this.engine.spawnParticles(pad.position, 75, 0x34d399, 16, 0.3);
          this.engine.applyScreenShake(0.65);
          if (window.showGameNotification) {
            if (pad.userData?.isDepthsAscend) {
              window.showGameNotification('🚀 DEPTHS ASCEND GEYSER! Supercharged updraft launched you to the surface! (Hold Space to Glide)');
            } else {
              window.showGameNotification('🚀 ZONAI BOOST PAD LAUNCH! Catapulted into the Great Sky Islands! (Hold Space to Glide)');
            }
          }
          break;
        }
      }
    }

    // Zelda TOTK Recall System: Rewind loop and motion trail recorder
    const allRecallables = [];
    if (environment && environment.fusableObjects) allRecallables.push(...environment.fusableObjects);
    if (window.game && window.game.shrineSystem?.activeDungeon?.puzzleProps) {
      allRecallables.push(...window.game.shrineSystem.activeDungeon.puzzleProps);
    }

    for (const obj of allRecallables) {
      if (!obj.userData.history) {
        obj.userData.history = [];
      }

      if (obj.userData.isRecalling) {
        // Rewind object along its history path
        if (obj.userData.history.length > 0) {
          const prev = obj.userData.history.pop();
          const deltaPos = prev.pos.clone().sub(obj.position);
          obj.position.copy(prev.pos);
          if (prev.rot) obj.rotation.copy(prev.rot);

          // Update visible golden trajectory line
          if (this.recallTrajectoryLine && obj.userData.history.length > 1) {
            const points = obj.userData.history.map(h => h.pos);
            this.recallTrajectoryLine.geometry?.setFromPoints(points);
          }

          // Check if player is standing on or near this object: RIDE THE OBJECT!
          const treeEyeHeight = 1.1 + (this.growthStage - 1) * 0.55;
          const footY = this.position.y - treeEyeHeight;
          const distH = Math.hypot(this.position.x - obj.position.x, this.position.z - obj.position.z);
          if (distH < 3.2 && footY >= obj.position.y - 0.6 && footY <= obj.position.y + 3.0) {
            this.position.add(deltaPos);
            this.velocity.y = 0;
            this.isGrounded = true;
          }

          // Golden reverse gear particles & ticking sound
          if (this.engine && Math.random() < 0.4) {
            this.engine.spawnParticles(obj.position, 2, 0xfacc15, 1.2, 0.08);
          }
        } else {
          // Finished rewinding
          obj.userData.isRecalling = false;
          if (this.recalledObject === obj) {
            this.clearRecallTrajectory();
            this.recalledObject = null;
            this.isRecallActive = false;
            audio.stopRecallHum?.();
            if (window.showGameNotification) {
              window.showGameNotification('⏳ Recall finished rewinding object!');
            }
          }
        }
      } else {
        // Push current state to history buffer (cap at 240 frames ~ 5-6 seconds of history)
        if (!obj.userData.recordTimer) obj.userData.recordTimer = 0;
        obj.userData.recordTimer += delta;
        if (obj.userData.recordTimer > 0.04) {
          obj.userData.recordTimer = 0;
          obj.userData.history.push({
            pos: obj.position.clone(),
            rot: obj.rotation.clone()
          });
          if (obj.userData.history.length > 200) {
            obj.userData.history.shift();
          }
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

    // 7. Update 3D Model Positions, Procedural Kinematics & Camera
    if (this.isLinkMode) {
      const isMoving = input.isKeyDown('KeyW') || input.isKeyDown('KeyS') || input.isKeyDown('KeyA') || input.isKeyDown('KeyD');
      const isSprinting = input.isKeyDown('ShiftLeft') && this.stamina > 5;
      const walkSpeed = isSprinting ? 9.5 : 5.8;
      if (isMoving && this.isGrounded) {
        this.walkCycle = (this.walkCycle || 0) + delta * walkSpeed;
        if (this.stepTimer === 0) {
          audio.playLinkFootstep?.();
        }
      }

      // Check Shield Raising (KeyZ or Shift when not sprinting)
      this.isShieldRaised = input.isKeyDown('KeyZ') || (input.isKeyDown('ShiftLeft') && !isMoving);

      if (this.linkModelTP) {
        this.linkModelTP.position.copy(this.position);
        this.linkModelTP.position.y -= 1.1; // Place boots on ground
        this.linkModelTP.rotation.y = this.yaw;

        // Spin attack rotation
        if (this.isAttacking && this.attackTimer > 0 && this.attackTimer <= 0.55) {
          this.linkModelTP.rotation.y = this.yaw + (1 - this.attackTimer / 0.55) * Math.PI * 2;
        }

        const lLeg = this.linkModelTP.userData.legL || this.linkModelTP.userData.leftLeg;
        const rLeg = this.linkModelTP.userData.legR || this.linkModelTP.userData.rightLeg;
        if (lLeg && rLeg) {
          if (this.isGliding) {
            // Gliding: legs stream back slightly into the slipstream
            lLeg.rotation.x = -0.45;
            rLeg.rotation.x = -0.45;
            lLeg.rotation.z = -0.15;
            rLeg.rotation.z = 0.15;
          } else if (isMoving && this.isGrounded) {
            lLeg.rotation.x = Math.sin(this.walkCycle) * (isSprinting ? 0.75 : 0.45);
            rLeg.rotation.x = -Math.sin(this.walkCycle) * (isSprinting ? 0.75 : 0.45);
            lLeg.rotation.z = 0;
            rLeg.rotation.z = 0;
          } else {
            lLeg.rotation.x = THREE.MathUtils.lerp(lLeg.rotation.x, 0, delta * 8);
            rLeg.rotation.x = THREE.MathUtils.lerp(rLeg.rotation.x, 0, delta * 8);
            lLeg.rotation.z = 0;
            rLeg.rotation.z = 0;
          }
        }

        const lArm = this.linkModelTP.userData.armL || this.linkModelTP.userData.leftArm;
        const rArm = this.linkModelTP.userData.armR || this.linkModelTP.userData.rightArm;

        if (this.isGliding) {
          // Dual arms raised overhead gripping paraglider handles
          if (lArm) {
            lArm.rotation.set(-2.6, 0.2, -0.3);
            lArm.position.set(-0.38, 1.58, 0);
          }
          if (rArm) {
            rArm.rotation.set(-2.6, -0.2, 0.3);
            rArm.position.set(0.38, 1.58, 0);
          }
          if (this.linkModelTP.userData.shieldInHand) this.linkModelTP.userData.shieldInHand.visible = false;
          if (this.linkModelTP.userData.shield) this.linkModelTP.userData.shield.visible = true;
        } else if (this.isShieldRaised) {
          // Left arm raises shield in front of body defensively
          if (lArm) {
            lArm.rotation.set(-0.95, 0.55, -0.2);
            lArm.position.set(-0.25, 1.58, 0.2);
          }
          if (this.linkModelTP.userData.shieldInHand) this.linkModelTP.userData.shieldInHand.visible = true;
          if (this.linkModelTP.userData.shield) this.linkModelTP.userData.shield.visible = false;

          if (rArm) {
            rArm.position.set(0.38, 1.58, 0);
            rArm.rotation.set(0.3, -0.2, 0.1);
          }
        } else {
          if (this.linkModelTP.userData.shieldInHand) this.linkModelTP.userData.shieldInHand.visible = false;
          if (this.linkModelTP.userData.shield) this.linkModelTP.userData.shield.visible = true;

          if (lArm) {
            lArm.position.set(-0.38, 1.58, 0);
            if (isMoving && this.isGrounded) {
              lArm.rotation.x = -Math.sin(this.walkCycle) * 0.4;
              lArm.rotation.y = 0;
              lArm.rotation.z = 0;
            } else {
              lArm.rotation.x = THREE.MathUtils.lerp(lArm.rotation.x, 0, delta * 8);
              lArm.rotation.y = 0;
              lArm.rotation.z = 0;
            }
          }

          if (rArm) {
            rArm.position.set(0.38, 1.58, 0);
            if (this.isAttacking) {
              const swingProgress = (0.42 - this.attackTimer) / 0.42;
              rArm.rotation.x = -0.4 - Math.sin(swingProgress * Math.PI) * 1.5;
              rArm.rotation.y = -Math.sin(swingProgress * Math.PI) * 0.8;
            } else if (isMoving && this.isGrounded) {
              rArm.rotation.x = Math.sin(this.walkCycle) * 0.4;
              rArm.rotation.y = THREE.MathUtils.lerp(rArm.rotation.y, 0, delta * 8);
            } else {
              rArm.rotation.x = THREE.MathUtils.lerp(rArm.rotation.x, 0, delta * 8);
              rArm.rotation.y = THREE.MathUtils.lerp(rArm.rotation.y, 0, delta * 8);
            }
          }
        }

        if (this.linkModelTP.userData.palmCore) {
          this.linkModelTP.userData.palmCore.material.emissiveIntensity = 1.0 + Math.sin(Date.now() * 0.005) * 0.5;
        }
      }

      if (this.linkModelFP) {
        const fpArms = this.linkModelFP.userData;
        const time = Date.now() * 0.006;
        const bobY = isMoving ? Math.sin(time * 2.2) * (isSprinting ? 0.03 : 0.015) : Math.sin(time * 0.8) * 0.005;
        const bobX = isMoving ? Math.cos(time * 1.1) * (isSprinting ? 0.02 : 0.01) : 0;

        if (this.isGliding) {
          if (fpArms.paragliderFP) fpArms.paragliderFP.visible = true;
          if (fpArms.shieldFP) fpArms.shieldFP.visible = false;
          if (fpArms.armL) {
            fpArms.armL.position.set(-0.35, 0.28, -0.4);
            fpArms.armL.rotation.set(-0.9, 0.1, -0.15);
          }
          if (fpArms.armR) {
            fpArms.armR.position.set(0.35, 0.28, -0.4);
            fpArms.armR.rotation.set(-0.9, -0.1, 0.15);
          }
        } else if (this.isShieldRaised) {
          if (fpArms.paragliderFP) fpArms.paragliderFP.visible = false;
          if (fpArms.shieldFP) fpArms.shieldFP.visible = true;
          if (fpArms.armL) {
            fpArms.armL.position.set(-0.15, -0.12, -0.35);
            fpArms.armL.rotation.set(0.4, 0.35, -0.2);
          }
          if (fpArms.armR) {
            fpArms.armR.position.x = 0.42;
            fpArms.armR.position.y = -0.38;
            fpArms.armR.rotation.set(0.35, -0.2, 0.1);
          }
        } else {
          if (fpArms.paragliderFP) fpArms.paragliderFP.visible = false;
          if (fpArms.shieldFP) fpArms.shieldFP.visible = false;
          if (fpArms.armL) {
            fpArms.armL.position.x = -0.38 + bobX * 0.4;
            fpArms.armL.position.y = -0.35 + bobY;
            fpArms.armL.position.z = -0.45;
            fpArms.armL.rotation.set(0.2, 0.15, -0.1);
          }
          if (fpArms.armR) {
            fpArms.armR.position.x = 0.38 + bobX * 0.4;
            fpArms.armR.position.y = -0.35 + bobY;

            if (this.isAttacking) {
              const swingProgress = Math.max(0, Math.min(1, (0.42 - this.attackTimer) / 0.42));
              fpArms.rightArm.rotation.x = 0.2 + Math.sin(swingProgress * Math.PI) * 1.2;
              fpArms.rightArm.rotation.y = -Math.sin(swingProgress * Math.PI) * 0.9;
              fpArms.rightArm.position.z = -0.55 - Math.sin(swingProgress * Math.PI) * 0.25;
            } else {
              fpArms.rightArm.rotation.x = THREE.MathUtils.lerp(fpArms.rightArm.rotation.x, 0.2, delta * 10);
              fpArms.rightArm.rotation.y = THREE.MathUtils.lerp(fpArms.rightArm.rotation.y, 0, delta * 10);
              fpArms.rightArm.position.z = THREE.MathUtils.lerp(fpArms.rightArm.position.z, -0.55, delta * 10);
            }
          }
        }
      }
    }

    if (this.thirdPersonModel) {
      this.thirdPersonModel.position.copy(this.position);
      const baseFeetY = 1.1 + (this.growthStage - 1) * 0.55;
      this.thirdPersonModel.position.y -= baseFeetY;

      const isMoving = input.isKeyDown('KeyW') || input.isKeyDown('KeyS') || input.isKeyDown('KeyA') || input.isKeyDown('KeyD');
      const isSprinting = input.isKeyDown('ShiftLeft') && this.photosynthesis > 4 && !this.isExhausted;

      if (isMoving && this.isGrounded) {
        this.walkCycle = (this.walkCycle || 0) + delta * (isSprinting ? 9.5 : 5.8);
      }

      // Natural idle breathing sway
      const breathSway = !isMoving ? Math.sin(Date.now() * 0.0022) * 0.025 : 0;
      this.thirdPersonModel.rotation.z = this.bodyRoll;
      this.thirdPersonModel.rotation.x = this.bodyPitch + breathSway;

      // Vertical stride bobbing & hip yaw sway
      const strideBob = (isMoving && this.isGrounded) ? Math.abs(Math.sin(this.walkCycle)) * (isSprinting ? 0.12 : 0.06) : 0;
      this.thirdPersonModel.position.y += strideBob;

      const hipSway = (isMoving && this.isGrounded) ? Math.sin(this.walkCycle * 0.5) * (isSprinting ? 0.08 : 0.04) : 0;
      this.thirdPersonModel.rotation.y = this.yaw + hipSway;

      // Realistic Procedural Root Leg Walking Gait
      if (this.thirdPersonModel.userData.legs) {
        const heightMult = 1.0 + (this.growthStage - 1) * 0.35;
        this.thirdPersonModel.userData.legs.forEach((leg, lIdx) => {
          if (!this.isGrounded) {
            if (this.isGliding) {
              // Gliding: legs stream back into the wind
              leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, -0.65, delta * 8);
              leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, (lIdx % 2 === 0 ? 0.22 : -0.22), delta * 8);
              leg.position.y = THREE.MathUtils.lerp(leg.position.y, 0.6 * heightMult, delta * 8);
            } else {
              // Jump / falling: roots tuck up under trunk
              leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, -0.35, delta * 8);
              leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, 0, delta * 8);
              leg.position.y = THREE.MathUtils.lerp(leg.position.y, 0.6 * heightMult + 0.15, delta * 8);
            }
          } else if (isMoving) {
            // Alternating diagonal quadruped/hexapod root stride
            const phase = (lIdx % 2 === 0) ? 0 : Math.PI;
            const cycle = this.walkCycle + phase;
            const strideX = Math.sin(cycle);
            const liftY = Math.max(0, Math.cos(cycle));

            leg.rotation.x = strideX * (isSprinting ? 0.65 : 0.42);
            leg.rotation.z = Math.sin(cycle * 0.5) * 0.08;
            leg.position.y = 0.6 * heightMult + liftY * (isSprinting ? 0.22 : 0.12);
          } else {
            // Idle stance
            leg.rotation.x = THREE.MathUtils.lerp(leg.rotation.x, 0, delta * 8);
            leg.rotation.z = THREE.MathUtils.lerp(leg.rotation.z, 0, delta * 8);
            leg.position.y = THREE.MathUtils.lerp(leg.position.y, 0.6 * heightMult, delta * 8);
          }
        });
      }

      // Realistic Head-Slam Attack Tilt: wind-up recoil, explosive down-slam, ground impact squash
      if (this.thirdPersonModel.userData.trunkMesh) {
        let slamTilt = 0;
        if (this.isAttacking) {
          if (this.attackTimer > 0.42) {
            slamTilt = -0.38; // Wind-up trunk arch
          } else if (this.attackTimer > 0.12) {
            slamTilt = 1.15; // Ground impact slam
          } else {
            slamTilt = 0.0; // Recovery
          }
        }
        this.headSlamTilt = THREE.MathUtils.lerp(this.headSlamTilt, slamTilt, delta * 20);
        this.thirdPersonModel.userData.trunkMesh.rotation.x = this.headSlamTilt;
      }

      // Mantis Scythe Arms Animation
      if (this.thirdPersonModel.userData.scythes) {
        const scythes = this.thirdPersonModel.userData.scythes;
        if (this.isAttacking) {
          scythes.rotation.x = this.headSlamTilt * 1.3;
        } else if (isMoving && this.isGrounded) {
          scythes.rotation.x = Math.sin(this.walkCycle) * 0.25;
        } else {
          scythes.rotation.x = THREE.MathUtils.lerp(scythes.rotation.x, 0, delta * 8);
        }
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
      this.camera.position.lerp(targetCamPos, Math.min(1.0, delta * 18));
      this.camera.lookAt(this.position.x, this.position.y + 0.6, this.position.z);
    }

    // Ultrahand Magnetic Tether & Held Object Physics
    if (this.isUltrahandActive && this.heldUltrahandObject) {
      const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const holdPos = this.position.clone().addScaledVector(forward, 3.8);
      const groundH = this.terrain.getHeight(holdPos.x, holdPos.z);
      holdPos.y = Math.max(groundH + 0.8, this.position.y + 0.5 - this.pitch * 1.5);

      this.heldUltrahandObject.position.lerp(holdPos, Math.min(1.0, delta * 12));
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

  // Cook ingredients at a campfire into hearty meals
  cookIngredients(ingredientIds) {
    if (!ingredientIds || ingredientIds.length === 0) return null;

    // Deduct materials from inventory
    ingredientIds.forEach(id => {
      const mat = this.totkInventory.materials.find(m => m.id === id);
      if (mat && mat.qty > 0) mat.qty--;
    });
    this.totkInventory.materials = this.totkInventory.materials.filter(m => m.qty > 0);

    let meal = null;
    if (ingredientIds.includes('raw_meat')) {
      meal = {
        id: 'hearty_steamed_meat_' + Date.now(),
        name: 'Hearty Steamed Meat',
        hearts: 6,
        stamina: 60,
        icon: '🍲',
        desc: 'Tender simmered meat infused with wild herbs. Fully restores vitality!'
      };
    } else if (ingredientIds.includes('apple')) {
      meal = {
        id: 'simmered_fruit_' + Date.now(),
        name: 'Energizing Simmered Fruit',
        hearts: 4,
        stamina: 100,
        icon: '🥗',
        desc: 'Sweet stewed apples and wild greens. Restores full stamina wheel!'
      };
    } else if (ingredientIds.includes('sundelion')) {
      meal = {
        id: 'sunny_fried_wild_greens_' + Date.now(),
        name: 'Sunny Fried Wild Greens',
        hearts: 5,
        stamina: 40,
        icon: '🥗',
        desc: 'Golden sundelions fried in fragrant oil. Heals gloom and cures corrupted hearts!'
      };
    } else {
      meal = {
        id: 'simmered_medley_' + Date.now(),
        name: 'Simmered Medley',
        hearts: 3,
        stamina: 30,
        icon: '🥣',
        desc: 'A warm, filling mixture of wild ingredients.'
      };
    }

    this.totkInventory.meals.push(meal);
    audio.playCookingJingle?.();
    if (this.engine) {
      this.engine.spawnParticles(this.position, 20, 0xfacc15, 3.5, 0.12);
      this.engine.spawnShockwave(this.position, 2.5, 0x22c55e);
    }
    if (window.showGameNotification) {
      window.showGameNotification(`🍳 COOKED: ${meal.name}! (+${meal.hearts} Hearts, +${meal.stamina} Stamina)`);
    }
    return meal;
  }

  // Consume a meal to restore Link's hearts and stamina
  eatMeal(mealId) {
    const idx = this.totkInventory.meals.findIndex(m => m.id === mealId);
    if (idx === -1) return false;
    const meal = this.totkInventory.meals[idx];
    this.totkInventory.meals.splice(idx, 1);

    if (this.isLinkMode) {
      this.linkHearts = Math.min(this.linkMaxHearts, this.linkHearts + (meal.hearts || 3));
    }
    this.barkHp = Math.min(this.maxBarkHp, this.barkHp + (meal.hearts || 3) * 20);
    this.stamina = Math.min(this.maxStamina, this.stamina + (meal.stamina || 50));
    audio.playEatMeal?.();
    if (this.engine) {
      this.engine.spawnParticles(this.position, 16, 0x4ade80, 2.5, 0.1);
    }
    if (window.showGameNotification) {
      window.showGameNotification(`😋 Consumed ${meal.name}! Restored health and stamina.`);
    }
    return true;
  }

  // Equip a weapon, shield, or armor
  equipItem(category, item) {
    if (category === 'weapons') {
      this.equippedWeapon = item;
      audio.playEquipWeapon?.();
    } else if (category === 'shields') {
      this.equippedShield = item;
      audio.playEquipShield?.();
    } else if (category === 'armor') {
      this.equippedArmor = item;
      audio.playEquipArmor?.();
    }
    if (window.showGameNotification) {
      window.showGameNotification(`🛡️ Equipped ${item.name}!`);
    }
  }

  // Great Fairy Blessing
  receiveFairyBlessing(type = 'hearts') {
    if (type === 'hearts') {
      this.linkMaxHearts += 2;
      this.linkHearts = this.linkMaxHearts;
      this.maxBarkHp += 40;
      this.barkHp = this.maxBarkHp;
      if (window.showGameNotification) {
        window.showGameNotification(`🧚 GREAT FAIRY BLESSING: Max Hearts upgraded to ${this.linkMaxHearts}! Health fully restored!`);
      }
    } else {
      this.maxStamina += 25;
      this.stamina = this.maxStamina;
      if (window.showGameNotification) {
        window.showGameNotification('🧚 GREAT FAIRY BLESSING: Max Stamina upgraded! Stamina fully restored!');
      }
    }
    audio.playGreatFairyBlessing?.();
    if (this.engine) {
      this.engine.spawnCosmicBurst(this.position, 60);
      this.engine.spawnShockwave(this.position, 8.0, 0xec4899);
    }
  }
}

export const player = new PlayerEvermean();

