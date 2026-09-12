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

    // Deduct resources
    playerEvermean.inventory.wood -= bp.woodCost;
    playerEvermean.soilBiomass -= bp.biomassCost;
    if (bp.stardustCost > 0) playerEvermean.inventory.stardust -= bp.stardustCost;

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
    }

    structGroup.userData = {
      typeId,
      name: bp.name,
      hp: 200,
      spawnTimer: 10
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

