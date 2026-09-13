import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

// Procedural World Environment: Ordinary forest trees, Goblin outpost, Beaverfolk stilt village, Instanced grass, and Korok puzzles
export class Environment {
  constructor() {
    this.trees = [];
    this.breakables = [];
    this.pickups = [];
    this.puzzles = [];
    this.grassMesh = null;
    this.goblinCampCenter = new THREE.Vector3(65, 0, -40);
    this.beaverVillageCenter = new THREE.Vector3(-28, 0, 25);
  }

  generate(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // 1. Scatter Ordinary Forest Trees (for Evermean Camouflage & Harvesting)
    this.spawnNormalForestTrees(180);

    // 2. Build Woodcutter Goblin Encampment
    this.buildGoblinCamp();

    // 3. Build River Beaverfolk Stilt Village
    this.buildBeaverVillage();

    // 4. Scatter Survival Foragables (Dew drops, Compost, Acorns)
    this.spawnForagables(80);

    // 5. Scatter 3D Instanced Wind-blown Grass Tufts & Wildflowers
    this.spawnInstancedFoliage(650);

    // 6. Spawn Interactive Zelda-style Korok Puzzles
    this.spawnKorokPuzzles();
  }

  // Ordinary forest trees that the player blends into
  spawnNormalForestTrees(count) {
    const barkTex = TextureGenerator.createBarkTexture(0x4a3728);
    const barkNormal = TextureGenerator.createBarkNormalMap();
    const birchBarkTex = TextureGenerator.createBarkTexture(0xdfdad0);

    const trunkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.85
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      roughness: 0.65,
      flatShading: false
    });
    const birchTrunkMat = new THREE.MeshStandardMaterial({
      map: birchBarkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.75
    });
    const birchLeafMat = new THREE.MeshStandardMaterial({
      color: 0x7cb342,
      roughness: 0.65,
      flatShading: false
    });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 40);
      const z = (Math.random() - 0.5) * (this.terrain.size - 40);

      // Don't spawn inside deep water or on top of villages
      if (this.terrain.isWater(x, z)) continue;
      if (Math.hypot(x - this.goblinCampCenter.x, z - this.goblinCampCenter.z) < 22) continue;
      if (Math.hypot(x - this.beaverVillageCenter.x, z - this.beaverVillageCenter.z) < 18) continue;

      const y = this.terrain.getHeight(x, z);
      const isBirch = Math.random() < 0.35;
      const height = 3.5 + Math.random() * 2.5;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, y, z);

      // Trunk
      const trunkGeom = new THREE.CylinderGeometry(0.25, 0.4, height, 7);
      const trunk = new THREE.Mesh(trunkGeom, isBirch ? birchTrunkMat : trunkMat);
      trunk.position.y = height * 0.5;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Canopy
      const leafCount = 4 + Math.floor(Math.random() * 3);
      for (let l = 0; l < leafCount; l++) {
        const leafGeom = new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.6, 1);
        const foliage = new THREE.Mesh(leafGeom, isBirch ? birchLeafMat : leafMat);
        foliage.position.set(
          (Math.random() - 0.5) * 1.5,
          height + (Math.random() - 0.2) * 1.5,
          (Math.random() - 0.5) * 1.5
        );
        foliage.castShadow = true;
        treeGroup.add(foliage);
      }

      treeGroup.userData = {
        isBreakableTree: true,
        hp: 40,
        woodYield: 15,
        position: new THREE.Vector3(x, y, z)
      };

      this.scene.add(treeGroup);
      this.trees.push(treeGroup);
      this.breakables.push(treeGroup);
    }
  }

  // Woodcutter Goblin Encampment
  buildGoblinCamp() {
    const cx = this.goblinCampCenter.x;
    const cz = this.goblinCampCenter.z;
    const cy = this.terrain.getHeight(cx, cz);
    this.goblinCampCenter.y = cy;

    const campGroup = new THREE.Group();
    campGroup.position.set(cx, cy, cz);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const palisadeMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.95 });

    // 1. Central Bonfire
    const fireBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.4, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    campGroup.add(fireBase);

    // Glowing fire pit light
    const campLight = new THREE.PointLight(0xff6600, 2.0, 18);
    campLight.position.set(0, 1.0, 0);
    campGroup.add(campLight);

    // 2. Palisades / Spiked Wall Stakes
    const fenceRadius = 16;
    for (let a = 0; a < Math.PI * 2; a += 0.45) {
      if (a > 0.8 && a < 1.4) continue; // Gap for gate
      const fx = Math.cos(a) * fenceRadius;
      const fz = Math.sin(a) * fenceRadius;
      const fy = this.terrain.getHeight(cx + fx, cz + fz) - cy;

      const stakeGeom = new THREE.ConeGeometry(0.18, 2.6, 5);
      const stake = new THREE.Mesh(stakeGeom, palisadeMat);
      stake.position.set(fx, fy + 1.2, fz);
      stake.castShadow = true;
      campGroup.add(stake);
    }

    // 3. Goblin Watchtower
    const tower = new THREE.Group();
    tower.position.set(10, 0, 10);
    [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6, 6), woodMat);
      leg.position.set(px, 3, pz);
      tower.add(leg);
    });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), woodMat);
    platform.position.set(0, 6, 0);
    tower.add(platform);
    campGroup.add(tower);

    // 4. Chopped tree logs & weapon rack (sign of woodcutter aggression!)
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 6), woodMat);
      log.rotateZ(Math.PI / 2);
      log.position.set(-5 + l * 0.7, 0.3, -4);
      campGroup.add(log);
    }

    this.scene.add(campGroup);
  }

  // River Beaverfolk Stilt Village
  buildBeaverVillage() {
    const bx = this.beaverVillageCenter.x;
    const bz = this.beaverVillageCenter.z;
    const by = 0.4; // Platform rests slightly above water level
    this.beaverVillageCenter.y = by;

    const villageGroup = new THREE.Group();
    villageGroup.position.set(bx, by, bz);

    const plankMat = new THREE.MeshStandardMaterial({ color: 0x8b6542, roughness: 0.8 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0xc8ad7f, roughness: 0.95 });

    // 1. Wooden Stilt Pier & Docks
    const dock = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 12), plankMat);
    dock.castShadow = true;
    villageGroup.add(dock);

    // Stilts under the dock into riverbed
    [[-6, -4], [6, -4], [-6, 4], [6, 4], [0, 0]].forEach(([sx, sz]) => {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.5, 6), plankMat);
      stilt.position.set(sx, -2, sz);
      villageGroup.add(stilt);
    });

    // 2. Thatched Beaver Huts
    [-4, 4].forEach(hx => {
      const hut = new THREE.Group();
      hut.position.set(hx, 0.2, 0);

      // Walls
      const walls = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 2.4, 8), plankMat);
      walls.position.y = 1.2;
      hut.add(walls);

      // Thatch Conical Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.8, 8), thatchMat);
      roof.position.y = 3.1;
      hut.add(roof);

      villageGroup.add(hut);
    });

    // 3. Waterwheel in river
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(-9, -0.2, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.15, 6, 12), plankMat);
    wheelGroup.add(rim);
    for (let p = 0; p < 6; p++) {
      const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.2), plankMat);
      paddle.position.set(Math.cos(p * Math.PI / 3) * 1.5, Math.sin(p * Math.PI / 3) * 1.5, 0);
      paddle.rotation.z = p * Math.PI / 3;
      wheelGroup.add(paddle);
    }
    villageGroup.add(wheelGroup);
    villageGroup.userData.wheel = wheelGroup;

    this.scene.add(villageGroup);
    this.beaverVillageGroup = villageGroup;
  }

  // Survival Foragables (Dew drops for moisture, Biomass for soil, Acorns for projectile ammo)
  spawnForagables(count) {
    const dewMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.1, transparent: true, opacity: 0.85 });
    const acornMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });
    const biomassMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 40);
      const z = (Math.random() - 0.5) * (this.terrain.size - 40);
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      const randType = Math.random();

      let mesh;
      let pickupData;

      if (randType < 0.35) {
        // Dew Drop: Restores Moisture
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), dewMat);
        pickupData = { type: 'dew', name: 'Morning Dew Drop', moistureGain: 25 };
      } else if (randType < 0.7) {
        // Acorn: Ammo & Nutrients
        mesh = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 6), acornMat);
        pickupData = { type: 'acorn', name: 'Heavy Oak Acorn', ammoGain: 3, biomassGain: 10 };
      } else {
        // Forest Compost: Restores Soil Nutrients for Growth
        mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), biomassMat);
        pickupData = { type: 'biomass', name: 'Lush Forest Compost', biomassGain: 35 };
      }

      mesh.position.set(x, y + 0.25, z);
      mesh.userData = pickupData;
      this.scene.add(mesh);
      this.pickups.push(mesh);
    }
  }

  // Scatter 3D Instanced Wind-blown Grass Tufts & Wildflowers
  spawnInstancedFoliage(count = 650) {
    // 1. Instanced Grass Tufts (Blades)
    const tuftTex = TextureGenerator.createGrassTuftTexture();
    const tuftMat = new THREE.MeshLambertMaterial({
      map: tuftTex,
      transparent: true,
      alphaTest: 0.3,
      side: THREE.DoubleSide
    });

    // Cross-quad blade geometry
    const planeA = new THREE.PlaneGeometry(0.8, 0.9);
    planeA.translate(0, 0.45, 0);
    const planeB = planeA.clone().rotateY(Math.PI / 2);
    
    // Combine two crossed planes for volumetric look
    const grassGeom = new THREE.BufferGeometry();
    const posArr = new Float32Array([...planeA.attributes.position.array, ...planeB.attributes.position.array]);
    const uvArr = new Float32Array([...planeA.attributes.uv.array, ...planeB.attributes.uv.array]);
    grassGeom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    grassGeom.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));

    this.grassMesh = new THREE.InstancedMesh(grassGeom, tuftMat, count);
    const dummy = new THREE.Object3D();
    let validCount = 0;

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 30);
      const z = (Math.random() - 0.5) * (this.terrain.size - 30);
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      const scale = 0.8 + Math.random() * 0.6;
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      this.grassMesh.setMatrixAt(validCount, dummy.matrix);
      validCount++;
    }

    this.grassMesh.count = validCount;
    this.grassMesh.receiveShadow = true;
    this.scene.add(this.grassMesh);

    // 2. Wildflower clumps (Red, Yellow, Sky Blue)
    const flowerColors = [0xff4d6d, 0xfacc15, 0x38bdf8, 0xe879f9];
    flowerColors.forEach((fColor, cIdx) => {
      const fMat = new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.5 });
      const fGeom = new THREE.DodecahedronGeometry(0.18, 0);
      const fMesh = new THREE.InstancedMesh(fGeom, fMat, 60);
      let fCount = 0;

      for (let j = 0; j < 60; j++) {
        const x = (Math.random() - 0.5) * (this.terrain.size - 60);
        const z = (Math.random() - 0.5) * (this.terrain.size - 60);
        if (this.terrain.isWater(x, z)) continue;

        const y = this.terrain.getHeight(x, z);
        dummy.position.set(x, y + 0.35, z);
        dummy.scale.setScalar(0.7 + Math.random() * 0.5);
        dummy.updateMatrix();
        fMesh.setMatrixAt(fCount, dummy.matrix);
        fCount++;
      }
      fMesh.count = fCount;
      this.scene.add(fMesh);
    });
  }

  // Spawn Interactive Zelda-style Korok Puzzles
  spawnKorokPuzzles() {
    // 1. Swirling Golden Water Leaf Ring in Central Lake (z: 65, x: 0)
    const leafRingGroup = new THREE.Group();
    leafRingGroup.position.set(0, this.terrain.waterLevel + 0.05, 65);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
      roughness: 0.6
    });

    const ringRadius = 3.2;
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const leafMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.3), leafMat);
      leafMesh.position.set(Math.cos(angle) * ringRadius, 0, Math.sin(angle) * ringRadius);
      leafMesh.rotation.y = angle + Math.PI / 4;
      leafRingGroup.add(leafMesh);
    }

    this.scene.add(leafRingGroup);
    this.puzzles.push({
      id: 'lake_leaf_ring',
      type: 'dive_in_ring',
      name: 'Lake Leaf Swirl',
      position: new THREE.Vector3(0, 0, 65),
      radius: ringRadius + 0.8,
      solved: false,
      meshGroup: leafRingGroup
    });

    // 2. Ancient Korok Rock Ring on Hilltop (x: -50, z: -50)
    const rockRingGroup = new THREE.Group();
    const rockY = this.terrain.getHeight(-50, -50);
    rockRingGroup.position.set(-50, rockY, -50);

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 });

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.2, 1), Math.random() < 0.4 ? mossMat : rockMat);
      rock.position.set(Math.cos(angle) * 3.5, 0.2, Math.sin(angle) * 3.5);
      rock.castShadow = true;
      rockRingGroup.add(rock);
    }

    // Glowing center pedestal stone
    const centerStone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.7, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x7e22ce, emissiveIntensity: 0.5 })
    );
    centerStone.position.y = 0.15;
    rockRingGroup.add(centerStone);

    this.scene.add(rockRingGroup);
    this.puzzles.push({
      id: 'hilltop_rock_ring',
      type: 'stand_in_center',
      name: 'Mystic Stone Ring',
      position: new THREE.Vector3(-50, rockY, -50),
      radius: 2.2,
      solved: false,
      meshGroup: rockRingGroup
    });

    // 3. Korok Pinwheel on Rocky Bluff (x: 45, z: 45)
    const pinwheelGroup = new THREE.Group();
    const bluffY = this.terrain.getHeight(45, 45);
    pinwheelGroup.position.set(45, bluffY, 45);

    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    stick.position.y = 0.8;
    pinwheelGroup.add(stick);

    const wheel = new THREE.Group();
    wheel.position.y = 1.6;
    const colors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981];
    for (let p = 0; p < 4; p++) {
      const petal = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.02, 0.08),
        new THREE.MeshBasicMaterial({ color: colors[p] })
      );
      petal.rotation.z = p * Math.PI / 2;
      petal.position.x = 0.12;
      wheel.add(petal);
    }
    pinwheelGroup.add(wheel);
    pinwheelGroup.userData.wheel = wheel;

    this.scene.add(pinwheelGroup);
    this.puzzles.push({
      id: 'cliff_pinwheel',
      type: 'approach_pinwheel',
      name: 'Breezy Pinwheel',
      position: new THREE.Vector3(45, bluffY, 45),
      radius: 3.5,
      solved: false,
      meshGroup: pinwheelGroup
    });
  }

  // Check if player position triggers / solves any Korok puzzle
  checkKorokPuzzles(playerPos, onSolveCallback) {
    for (let p of this.puzzles) {
      if (p.solved) continue;
      const dist = Math.hypot(playerPos.x - p.position.x, playerPos.z - p.position.z);
      if (dist < p.radius) {
        p.solved = true;
        // Celebration visual effect
        if (p.meshGroup) {
          p.meshGroup.position.y += 0.5;
        }
        if (onSolveCallback) {
          onSolveCallback(p);
        }
      }
    }
  }

  update(delta, time) {
    // Spin beaver village waterwheel
    if (this.beaverVillageGroup && this.beaverVillageGroup.userData.wheel) {
      this.beaverVillageGroup.userData.wheel.rotation.z += delta * 0.8;
    }

    // Spin Korok pinwheel
    this.puzzles.forEach(p => {
      if (p.meshGroup && p.meshGroup.userData.wheel) {
        p.meshGroup.userData.wheel.rotation.z += delta * 4.0;
      }
      // Swirl lake leaf ring
      if (p.id === 'lake_leaf_ring' && p.meshGroup) {
        p.meshGroup.rotation.y += delta * 0.6;
      }
    });

    // Gentle floating bob on pickups
    this.pickups.forEach((p, idx) => {
      p.rotation.y += delta * 1.5;
      p.position.y += Math.sin(time * 3 + idx) * 0.001;
    });
  }
}

export const environment = new Environment();

