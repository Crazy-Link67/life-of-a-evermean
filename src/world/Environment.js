import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

// Procedural World Environment: Ordinary forest trees, Goblin outpost, Beaverfolk stilt village, Instanced grass, and Korok puzzles
export class Environment {
  constructor() {
    this.trees = [];
    this.breakables = [];
    this.pickups = [];
    this.puzzles = [];
    this.mushrooms = [];
    this.fireflies = null;
    this.fireflyPositions = [];
    this.campfireLight = null;
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

    // 7. Ancient Stone Ruins & Monoliths
    this.spawnAncientRuins();

    // 8. Glowing Bioluminescent Mushroom Groves
    this.spawnGlowingMushrooms(50);

    // 9. Mossy Granite Boulders & Fallen Logs
    this.spawnRockFormations(50);
    this.spawnFallenLogs(25);

    // 10. Water Lily Pads & Shoreline Reeds
    this.spawnWaterFlora();

    // 11. Goblin Encampment Campfire
    this.spawnCampfire();

    // 12. Floating Forest Fireflies
    this.spawnFireflies(120);
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

  // Ancient Stone Ruins & Monoliths (Zelda-style weathered stonework)
  spawnAncientRuins() {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 });
    const mossStoneMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.9 });
    const runeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.6 });

    // 1. Ancient Stone Archway at x: 20, z: -15
    const archGroup = new THREE.Group();
    const archY = this.terrain.getHeight(20, -15);
    archGroup.position.set(20, archY, -15);

    // Left & Right Pillars
    [-2.2, 2.2].forEach(px => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 4.8, 8), stoneMat);
      pillar.position.set(px, 2.4, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      archGroup.add(pillar);
    });

    // Lintel Top Arch Stone
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.7, 1.2), mossStoneMat);
    lintel.position.set(0, 5.0, 0);
    lintel.castShadow = true;
    archGroup.add(lintel);

    // Glowing Rune Core in Center
    const runeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), runeMat);
    runeCore.position.set(0, 3.2, 0);
    archGroup.add(runeCore);
    this.scene.add(archGroup);

    // 2. Ruined Broken Monoliths in the Northern Meadow (x: -40, z: -70)
    for (let m = 0; m < 5; m++) {
      const mx = -40 + (Math.random() - 0.5) * 25;
      const mz = -70 + (Math.random() - 0.5) * 25;
      const my = this.terrain.getHeight(mx, mz);
      const mono = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.55, 2.2 + Math.random() * 2.5, 6),
        stoneMat
      );
      mono.position.set(mx, my + 1.1, mz);
      mono.rotation.z = (Math.random() - 0.5) * 0.35; // Tilting ruined column
      mono.rotation.y = Math.random() * Math.PI;
      mono.castShadow = true;
      this.scene.add(mono);
    }
  }

  // Glowing Bioluminescent Mushroom Groves
  spawnGlowingMushrooms(count = 50) {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const colors = [
      { col: 0x06b6d4, emissive: 0x0891b2 }, // Cyan
      { col: 0xa855f7, emissive: 0x7e22ce }, // Purple
      { col: 0x10b981, emissive: 0x059669 }  // Emerald
    ];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 40);
      const z = (Math.random() - 0.5) * (this.terrain.size - 40);
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      const mGroup = new THREE.Group();
      mGroup.position.set(x, y, z);

      const pal = colors[i % colors.length];
      const capMat = new THREE.MeshStandardMaterial({
        color: pal.col,
        emissive: pal.emissive,
        emissiveIntensity: 0.7,
        roughness: 0.4
      });

      const stemHeight = 0.4 + Math.random() * 0.5;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, stemHeight, 6), stemMat);
      stem.position.y = stemHeight * 0.5;
      mGroup.add(stem);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      cap.position.y = stemHeight;
      mGroup.add(cap);

      this.scene.add(mGroup);
      this.mushrooms.push(mGroup);
    }
  }

  // Mossy Granite Boulders & River Stepping Stones
  spawnRockFormations(count = 50) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.9 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 40);
      const z = (Math.random() - 0.5) * (this.terrain.size - 40);
      const y = this.terrain.getHeight(x, z);
      const isSteppingStone = this.terrain.isWater(x, z);

      const scale = isSteppingStone ? 0.8 + Math.random() * 0.5 : 1.2 + Math.random() * 1.6;
      const mat = Math.random() < 0.45 ? mossMat : rockMat;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), mat);
      
      rock.position.set(x, isSteppingStone ? -0.1 : y + scale * 0.4, z);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
  }

  // Hollow Fallen Logs along meadows
  spawnFallenLogs(count = 25) {
    const barkTex = TextureGenerator.createBarkTexture(0x4a321d);
    const logMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.9 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 50);
      const z = (Math.random() - 0.5) * (this.terrain.size - 50);
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      const len = 3.5 + Math.random() * 3.0;
      const logGeom = new THREE.CylinderGeometry(0.38, 0.48, len, 8, 1, true); // Hollow tube
      const log = new THREE.Mesh(logGeom, logMat);

      log.rotation.z = Math.PI / 2;
      log.rotation.y = Math.random() * Math.PI;
      log.position.set(x, y + 0.35, z);
      log.castShadow = true;
      this.scene.add(log);
    }
  }

  // Water Lily Pads & Lakeside Reeds
  spawnWaterFlora() {
    const padMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6, side: THREE.DoubleSide });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 });

    // Lily Pads in the central lake (z: 65, x: 0)
    for (let i = 0; i < 28; i++) {
      const lx = (Math.random() - 0.5) * 32;
      const lz = 65 + (Math.random() - 0.5) * 32;
      if (!this.terrain.isWater(lx, lz)) continue;

      const padGroup = new THREE.Group();
      padGroup.position.set(lx, this.terrain.waterLevel + 0.04, lz);

      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.45 + Math.random() * 0.3, 8), padMat);
      pad.rotateX(-Math.PI / 2);
      padGroup.add(pad);

      // Pink Water Blossom
      if (Math.random() < 0.5) {
        const flower = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 6), flowerMat);
        flower.position.y = 0.1;
        padGroup.add(flower);
      }
      this.scene.add(padGroup);
    }

    // Cattail Reeds along riverbank
    for (let r = 0; r < 40; r++) {
      const rx = (Math.random() - 0.5) * 260;
      const rz = (Math.random() - 0.5) * 260;
      const ry = this.terrain.getHeight(rx, rz);
      if (ry > 0.0 && ry < 1.4) {
        // Near water edge
        const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.8 + Math.random() * 0.8, 4), reedMat);
        reed.position.set(rx, ry + 0.9, rz);
        reed.rotation.z = (Math.random() - 0.5) * 0.2;
        this.scene.add(reed);
      }
    }
  }

  // Woodcutter Goblin Campfire with flickering light
  spawnCampfire() {
    const cx = this.goblinCampCenter.x;
    const cz = this.goblinCampCenter.z;
    const cy = this.terrain.getHeight(cx, cz);

    const fireGroup = new THREE.Group();
    fireGroup.position.set(cx, cy, cz);

    // Stone fire pit ring
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
    for (let s = 0; s < 8; s++) {
      const angle = (s / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), stoneMat);
      stone.position.set(Math.cos(angle) * 0.9, 0.1, Math.sin(angle) * 0.9);
      fireGroup.add(stone);
    }

    // Fire logs
    const logMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    for (let l = 0; l < 3; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.1, 5), logMat);
      log.rotation.z = Math.PI / 3;
      log.rotation.y = l * (Math.PI / 1.5);
      log.position.y = 0.15;
      fireGroup.add(log);
    }

    // Glowing flame core
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.8, 6),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    flame.position.y = 0.5;
    fireGroup.add(flame);

    // Flickering Point Light
    this.campfireLight = new THREE.PointLight(0xf97316, 2.2, 22, 1.2);
    this.campfireLight.position.set(0, 1.2, 0);
    fireGroup.add(this.campfireLight);

    this.scene.add(fireGroup);
  }

  // Floating Forest Fireflies (Atmospheric Motes)
  spawnFireflies(count = 120) {
    const fireflyGeom = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 60);
      const z = (Math.random() - 0.5) * (this.terrain.size - 60);
      const y = Math.max(0.5, this.terrain.getHeight(x, z)) + 0.8 + Math.random() * 3.5;
      positions.push(x, y, z);
      this.fireflyPositions.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.5
      });
    }

    fireflyGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.fireflies = new THREE.Points(fireflyGeom, fireflyMat);
    this.scene.add(this.fireflies);
  }

  update(delta, time) {
    // Spin beaver village waterwheel
    if (this.beaverVillageGroup && this.beaverVillageGroup.userData.wheel) {
      this.beaverVillageGroup.userData.wheel.rotation.z += delta * 0.8;
    }

    // Spin Korok pinwheel and swirls
    this.puzzles.forEach(p => {
      if (p.meshGroup && p.meshGroup.userData.wheel) {
        p.meshGroup.userData.wheel.rotation.z += delta * 4.0;
      }
      if (p.id === 'lake_leaf_ring' && p.meshGroup) {
        p.meshGroup.rotation.y += delta * 0.6;
      }
    });

    // Flickering Campfire light
    if (this.campfireLight) {
      this.campfireLight.intensity = 1.8 + Math.sin(time * 12) * 0.4 + (Math.random() - 0.5) * 0.2;
    }

    // Floating gentle fireflies animation
    if (this.fireflies && this.fireflyPositions.length > 0) {
      const posAttr = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < this.fireflyPositions.length; i++) {
        const fp = this.fireflyPositions[i];
        const newX = fp.baseX + Math.sin(time * fp.speed + fp.phase) * 1.2;
        const newY = fp.baseY + Math.cos(time * fp.speed * 0.8 + fp.phase) * 0.6;
        const newZ = fp.baseZ + Math.sin(time * fp.speed * 0.6 + fp.phase) * 1.2;
        posAttr.setXYZ(i, newX, newY, newZ);
      }
      posAttr.needsUpdate = true;
    }

    // Gentle floating bob on pickups
    this.pickups.forEach((p, idx) => {
      p.rotation.y += delta * 1.5;
      p.position.y += Math.sin(time * 3 + idx) * 0.001;
    });
  }
}

export const environment = new Environment();

