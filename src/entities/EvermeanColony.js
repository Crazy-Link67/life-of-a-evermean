import * as THREE from 'three';
import { TreeModelGenerator } from './TreeModelGenerator.js';

// Evermean Civilization & Grove Building System
export class EvermeanColony {
  constructor() {
    this.structures = [];
    this.citizenEvermeans = [];
    this.scene = null;
    this.terrain = null;

    // Building blueprints with resource costs
    this.blueprints = {
      heartTree: {
        id: 'heartTree',
        name: 'Heart Tree of the Grove',
        description: 'The monumental core of your Evermean civilization. Claims territory and radiates growth aura.',
        woodCost: 40,
        biomassCost: 50,
        stardustCost: 0
      },
      incubator: {
        id: 'incubator',
        name: 'Sapling Incubator',
        description: 'Sacred compost hollow that periodically awakens baby Evermean sprouts to follow and assist you.',
        woodCost: 25,
        biomassCost: 35,
        stardustCost: 0
      },
      brambleWall: {
        id: 'brambleWall',
        name: 'Living Bramble Wall',
        description: 'Thick, thorny root barrier that repels and pricks woodcutter axe-wielders.',
        woodCost: 15,
        biomassCost: 15,
        stardustCost: 0
      },
      sapBasin: {
        id: 'sapBasin',
        name: 'Grove Sap Basin',
        description: 'Catches rain and groundwater; continuously restores moisture to nearby Evermeans.',
        woodCost: 20,
        biomassCost: 20,
        stardustCost: 0
      },
      sunSpire: {
        id: 'sunSpire',
        name: 'Sunlight Spire',
        description: 'Focuses solar rays to boost daytime photosynthesis energy regeneration by 50%.',
        woodCost: 30,
        biomassCost: 40,
        stardustCost: 0
      },
      starlightMonolith: {
        id: 'starlightMonolith',
        name: 'Starlight Monolith',
        description: 'Cosmic obelisk that channels nighttime star showers, accelerating your cosmic evolution.',
        woodCost: 50,
        biomassCost: 60,
        stardustCost: 2
      },
      sporeTurret: {
        id: 'sporeTurret',
        name: 'Living Spore Sentry',
        description: 'Defensive botanical turret that fires piercing thorn darts at approaching woodcutter goblins.',
        woodCost: 25,
        biomassCost: 30,
        stardustCost: 0
      },
      spiritHollow: {
        id: 'spiritHollow',
        name: 'Korok Spirit Nursery',
        description: 'Sanctuary for rescued Koroks. Accelerates soil biomass and attracts magical forest wisps.',
        woodCost: 35,
        biomassCost: 40,
        korokCost: 1,
        stardustCost: 0
      },
      tradingPost: {
        id: 'tradingPost',
        name: 'Beaver Trading Post',
        description: 'River dock where friendly Beaverfolk barter rare Stardust and enchanted sap for harvested timber.',
        woodCost: 30,
        biomassCost: 25,
        stardustCost: 0
      }
    };
  }

  init(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
  }

  // Build a structure at the specified position
  buildStructure(typeId, position, playerEvermean) {
    const bp = this.blueprints[typeId];
    if (!bp) return { success: false, reason: 'Unknown structure type' };

    // Check resource requirements
    if (playerEvermean.inventory.wood < bp.woodCost) {
      return { success: false, reason: `Need ${bp.woodCost} Wood (have ${playerEvermean.inventory.wood})` };
    }
    if (playerEvermean.soilBiomass < bp.biomassCost) {
      return { success: false, reason: `Need ${bp.biomassCost} Biomass (have ${Math.floor(playerEvermean.soilBiomass)})` };
    }
    if (bp.stardustCost > 0 && playerEvermean.inventory.stardust < bp.stardustCost) {
      return { success: false, reason: `Need ${bp.stardustCost} Cosmic Stardust (have ${playerEvermean.inventory.stardust})` };
    }
    if (bp.korokCost > 0 && (playerEvermean.inventory.korokSeeds || 0) < bp.korokCost) {
      return { success: false, reason: `Need ${bp.korokCost} Korok Seed (have ${playerEvermean.inventory.korokSeeds || 0})` };
    }

    // Deduct resources
    playerEvermean.inventory.wood -= bp.woodCost;
    playerEvermean.soilBiomass -= bp.biomassCost;
    if (bp.stardustCost > 0) playerEvermean.inventory.stardust -= bp.stardustCost;
    if (bp.korokCost > 0) playerEvermean.inventory.korokSeeds -= bp.korokCost;

    // Create 3D Structure Mesh
    const structGroup = new THREE.Group();
    structGroup.position.set(position.x, position.y, position.z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4e3620, roughness: 0.85 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.7, flatShading: true });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 0.8 });

    if (typeId === 'heartTree') {
      // Magnificent Ancient Tree Monument
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 5.5, 9), woodMat);
      trunk.position.y = 2.75;
      trunk.castShadow = true;
      structGroup.add(trunk);

      for (let i = 0; i < 5; i++) {
        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), leafMat);
        foliage.position.set(
          (Math.random() - 0.5) * 2.5,
          5.0 + Math.random() * 1.5,
          (Math.random() - 0.5) * 2.5
        );
        structGroup.add(foliage);
      }
    } else if (typeId === 'incubator') {
      // Circular root compost nest
      const nest = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.4, 6, 12), woodMat);
      nest.rotateX(Math.PI / 2);
      nest.position.y = 0.3;
      structGroup.add(nest);

      // Spawning light
      const pLight = new THREE.PointLight(0x84cc16, 1.2, 8);
      pLight.position.y = 0.8;
      structGroup.add(pLight);
    } else if (typeId === 'brambleWall') {
      // Intertwined thorny root spikes
      for (let i = 0; i < 4; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.5, 5), woodMat);
        spike.rotateZ((Math.random() - 0.5) * 0.4);
        spike.rotateX((Math.random() - 0.5) * 0.4);
        spike.position.set((i - 1.5) * 0.7, 1.25, 0);
        structGroup.add(spike);
      }
    } else if (typeId === 'sapBasin') {
      // Hollow wooden pool with glowing sap water
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.1, 0.8, 8), woodMat);
      bowl.position.y = 0.4;
      structGroup.add(bowl);
      const water = new THREE.Mesh(new THREE.CircleGeometry(1.3, 8), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 }));
      water.rotateX(-Math.PI / 2);
      water.position.y = 0.75;
      structGroup.add(water);
    } else if (typeId === 'sunSpire') {
      // Tall Solar Crystal Spire
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.6, 5.0, 6), woodMat);
      spire.position.y = 2.5;
      structGroup.add(spire);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308 }));
      gem.position.y = 5.2;
      structGroup.add(gem);
    } else if (typeId === 'starlightMonolith') {
      // Cosmic Starlight Obelisk
      const obelisk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.8, 0.9), glowMat);
      obelisk.position.y = 2.4;
      structGroup.add(obelisk);
    } else if (typeId === 'sporeTurret') {
      // Defensive botanical thorn turret
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 2.2, 7), woodMat);
      stem.position.y = 1.1;
      structGroup.add(stem);

      const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), new THREE.MeshStandardMaterial({
        color: 0x15803d,
        roughness: 0.6,
        emissive: 0x166534,
        emissiveIntensity: 0.3
      }));
      head.position.y = 2.4;
      structGroup.add(head);

      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(0, 2.4, 0.6);
      structGroup.add(nozzle);
      structGroup.userData.turretHead = head;
    } else if (typeId === 'spiritHollow') {
      // Korok Sanctuary hollow with glowing spirit
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 3.2, 8), woodMat);
      trunk.position.y = 1.6;
      structGroup.add(trunk);

      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 1), leafMat);
      canopy.position.y = 3.6;
      structGroup.add(canopy);

      // Glowing forest wisp
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x86efac })
      );
      wisp.position.set(0, 1.8, 1.2);
      structGroup.add(wisp);
      structGroup.userData.wisp = wisp;
    } else if (typeId === 'tradingPost') {
      // Timber river trading dock with lanterns
      const dock = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 2.5), woodMat);
      dock.position.y = 0.15;
      structGroup.add(dock);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 5), woodMat);
      post.position.set(1.4, 1.1, 1.0);
      structGroup.add(post);

      const lantern = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.22, 0),
        new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.9 })
      );
      lantern.position.set(1.4, 2.0, 1.0);
      structGroup.add(lantern);
    }

    structGroup.userData = {
      typeId,
      name: bp.name,
      hp: 250,
      spawnTimer: 10,
      turretCooldown: 0,
      tradeCooldown: 0
    };

    this.scene.add(structGroup);
    this.structures.push(structGroup);

    // If incubator, spawn an initial Baby Evermean Sprout follower!
    if (typeId === 'incubator') {
      this.spawnCitizenEvermean(position.x + 2, position.z + 2, playerEvermean.speciesConfig);
    }

    return { success: true, name: bp.name };
  }

  // Spawn an allied NPC Baby Evermean that scurries and assists
  spawnCitizenEvermean(x, z, speciesConfig = {}) {
    const babyModel = TreeModelGenerator.createEvermeanModel({
      ...speciesConfig,
      name: 'Baby Evermean Sprout'
    }, 1);

    const y = this.terrain.getHeight(x, z);
    babyModel.position.set(x, y, z);
    babyModel.userData.isCitizen = true;
    babyModel.userData.hp = 30;
    babyModel.userData.speed = 4.2;

    this.scene.add(babyModel);
    this.citizenEvermeans.push(babyModel);
  }

  update(delta, playerEvermean, time) {
    // 1. Update Structures (Sap Basins heal player, Incubators spawn sprouts)
    this.structures.forEach(st => {
      const u = st.userData;

      if (u.typeId === 'sapBasin') {
        // Hydrate player if nearby
        if (st.position.distanceTo(playerEvermean.position) < 8.0) {
          playerEvermean.moisture = Math.min(playerEvermean.maxMoisture, playerEvermean.moisture + delta * 12);
        }
      } else if (u.typeId === 'incubator') {
        u.spawnTimer -= delta;
        if (u.spawnTimer <= 0 && this.citizenEvermeans.length < 5) {
          u.spawnTimer = 45; // Spawn baby every 45s
          this.spawnCitizenEvermean(st.position.x + 2, st.position.z + 2, playerEvermean.speciesConfig);
        }
      } else if (u.typeId === 'spiritHollow') {
        // Korok wisp bobbing & passive biomass growth
        if (u.wisp) {
          u.wisp.position.y = 1.8 + Math.sin(time * 3) * 0.2;
        }
        playerEvermean.soilBiomass += delta * 1.5;
      } else if (u.typeId === 'tradingPost') {
        // Beaver trading: visit dock to trade lumber for Stardust
        if (u.tradeCooldown > 0) u.tradeCooldown -= delta;
        if (u.tradeCooldown <= 0 && st.position.distanceTo(playerEvermean.position) < 5.5) {
          if (playerEvermean.inventory.wood >= 15) {
            u.tradeCooldown = 40.0;
            playerEvermean.inventory.wood -= 15;
            playerEvermean.inventory.stardust = (playerEvermean.inventory.stardust || 0) + 1;
            playerEvermean.inventory.acorns += 3;
            if (window.showGameNotification) {
              window.showGameNotification('🦫 Beaver Trade: Exchanged 15 Wood for 1 Cosmic Stardust & 3 Acorns!');
            }
          }
        }
      }
    });

    // 2. Update Baby Evermean Citizen Followers
    this.citizenEvermeans.forEach((c, idx) => {
      // Follow the player tree like baby ducklings!
      const followOffset = new THREE.Vector3(
        Math.cos(idx * 1.5 + time) * 3.5,
        0,
        Math.sin(idx * 1.5 + time) * 3.5
      );
      const targetPos = playerEvermean.position.clone().add(followOffset);
      const dist = c.position.distanceTo(targetPos);

      if (dist > 1.2) {
        const dir = new THREE.Vector3().subVectors(targetPos, c.position).normalize();
        c.position.x += dir.x * c.userData.speed * delta;
        c.position.z += dir.z * c.userData.speed * delta;
        c.rotation.y = Math.atan2(dir.x, dir.z);

        // Skitter root legs animation
        if (c.userData.legs) {
          c.userData.legs.forEach((leg, lIdx) => {
            leg.rotation.x = Math.sin(time * 12 + lIdx) * 0.35;
          });
        }
      }
      c.position.y = this.terrain.getHeight(c.position.x, c.position.z);
    });
  }
}

export const colony = new EvermeanColony();

