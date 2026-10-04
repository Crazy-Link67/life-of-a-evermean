import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';
import { collision } from '../core/Collision.js';

// Procedural World Environment: Realistic forest trees, 5 Battling camps, Beaverfolk stilt village,
// Proper Chasm & Depths Underworld, Underwater diving features, Full solid logs, and Korok puzzles
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
    this.zonaiPads = [];
    this.gloomPuddles = [];
    this.skyIslands = [];
    this.fusableObjects = [];
    this.chasmCavern = null;
    this.lightroot = null;
    this.depthsLaunchPad = null;
    this.underwaterChests = [];
    this.greatFairyFountain = null;
    this.templeOfTime = null;
    this.bargainerStatue = null;
    this.fairyOrbs = [];

    // 5 Unique Battling Camps across the enlarged 640m map
    this.goblinCampCenter = new THREE.Vector3(75, 0, -50);          // Camp 1: Woodcutter Goblin Outpost
    this.mountainFortressCenter = new THREE.Vector3(-180, 0, -150); // Camp 2: Mountain Skull Fortress
    this.riverMarauderCenter = new THREE.Vector3(-70, 0, 130);      // Camp 3: River Marauder Encampment
    this.ruinedCastleCenter = new THREE.Vector3(190, 0, -140);      // Camp 4: Ruined Castle Stronghold
    this.depthsCampCenter = new THREE.Vector3(130, -90, 130);       // Camp 5: Depths Gloom Excavation Camp
    this.beaverVillageCenter = new THREE.Vector3(-35, 0, 30);       // Peaceful Beaverfolk Village
  }

  generate(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // Reset solid collision obstacles
    collision.clear();

    // 1. Scatter Realistic Forest Trees (Oaks, Birches, Pines with collision)
    this.spawnNormalForestTrees(280);

    // 2. Build All 5 Battling Camps across the world
    this.buildAllCamps();

    // 3. Build River Beaverfolk Stilt Village
    this.buildBeaverVillage();

    // 4. Scatter Survival Foragables (Rare Dew drops, Compost, Acorns)
    this.spawnForagables(32);

    // 5. Scatter 3D Instanced Wind-blown Grass Tufts & Wildflowers
    this.spawnInstancedFoliage(2400);

    // 6. Spawn Interactive Zelda-style Korok Puzzles
    this.spawnKorokPuzzles();

    // 7. Ancient Stone Ruins & Monoliths
    this.spawnAncientRuins();

    // 8. Glowing Bioluminescent Mushroom Groves
    this.spawnGlowingMushrooms(35);

    // 9. Mossy Granite Boulders & Full Solid Cylindrical Fallen Logs
    this.spawnRockFormations(80);
    this.spawnFallenLogs(40);

    // 10. Water Lily Pads & Shoreline Reeds
    this.spawnWaterFlora();

    // 11. Goblin Encampment Campfire & Fortress Torches
    this.spawnCampfire();

    // 12. Floating Forest Fireflies
    this.spawnFireflies(160);

    // 13. Zelda: Tears of the Kingdom Legendary Flora & Zonai Devices
    this.spawnSundelions(24);
    this.spawnSilentPrincesses(12);
    this.spawnBombFlowers(20);
    this.spawnPoes(35);
    this.spawnZonaiBoostPads();
    this.spawnGloomPuddles();

    // 14. Floating Sylvan Sky Islands & Cascading Waterfalls
    this.spawnSkyIslands();

    // 15. Proper Gloom Chasm Abyss & The Depths Underworld Realm (y = -90)
    this.spawnProperChasmAndDepths();

    // 16. Deep Underwater Features & Sunken Treasure Chests
    this.spawnUnderwaterFeatures();

    // 17. Tears of the Kingdom Landmarks: Great Fairy Fountain, Temple of Time & Bargainer Statue
    this.spawnGreatFairyFountain();
    this.spawnTempleOfTime();
    this.spawnBargainerStatue();
  }

  // Ordinary forest trees with rich procedural textures, branching boughs, and solid collision
  spawnNormalForestTrees(count) {
    const oakBarkTex = TextureGenerator.createBarkTexture(0x4a3728);
    const barkNormal = TextureGenerator.createBarkNormalMap();
    const birchBarkTex = TextureGenerator.createBirchBarkTexture();
    const pineBarkTex = TextureGenerator.createBarkTexture(0x5c2c16);

    const oakTrunkMat = new THREE.MeshStandardMaterial({
      map: oakBarkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.88
    });
    const birchTrunkMat = new THREE.MeshStandardMaterial({
      map: birchBarkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.75
    });
    const pineTrunkMat = new THREE.MeshStandardMaterial({
      map: pineBarkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.9
    });

    const oakLeafTex = TextureGenerator.createLeafTexture(0x28631f, 0x86efac);
    const birchLeafTex = TextureGenerator.createLeafTexture(0x65a30d, 0xdcfce7);
    const pineLeafTex = TextureGenerator.createLeafTexture(0x14532d, 0x4ade80);

    const oakLeafMat = new THREE.MeshStandardMaterial({ map: oakLeafTex, roughness: 0.65 });
    const birchLeafMat = new THREE.MeshStandardMaterial({ map: birchLeafTex, roughness: 0.6 });
    const pineLeafMat = new THREE.MeshStandardMaterial({ map: pineLeafTex, roughness: 0.7 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 60);
      const z = (Math.random() - 0.5) * (this.terrain.size - 60);

      // Don't spawn inside deep water, spawn haven, or on top of camp centers
      if (this.terrain.isWater(x, z)) continue;
      if (Math.hypot(x, z - 10) < 22) continue; // Woodland spawn haven clearance
      if (Math.hypot(x - this.goblinCampCenter.x, z - this.goblinCampCenter.z) < 24) continue;
      if (Math.hypot(x - this.mountainFortressCenter.x, z - this.mountainFortressCenter.z) < 32) continue;
      if (Math.hypot(x - this.riverMarauderCenter.x, z - this.riverMarauderCenter.z) < 26) continue;
      if (Math.hypot(x - this.ruinedCastleCenter.x, z - this.ruinedCastleCenter.z) < 30) continue;
      if (Math.hypot(x - this.beaverVillageCenter.x, z - this.beaverVillageCenter.z) < 20) continue;
      if (Math.hypot(x - this.terrain.chasmCenter.x, z - this.terrain.chasmCenter.y) < 32) continue;

      const y = this.terrain.getHeight(x, z);
      const rnd = Math.random();
      const isBirch = rnd < 0.3;
      const isPine = rnd >= 0.3 && rnd < 0.6;
      const isOak = rnd >= 0.6;

      const height = isPine ? 5.5 + Math.random() * 3.0 : 3.8 + Math.random() * 2.4;
      const trunkRadius = isPine ? 0.32 : (isOak ? 0.45 : 0.28);

      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, y, z);

      // Trunk
      const trunkMat = isBirch ? birchTrunkMat : (isPine ? pineTrunkMat : oakTrunkMat);
      const trunkGeom = new THREE.CylinderGeometry(trunkRadius * 0.75, trunkRadius, height, 8);
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = height * 0.5;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Branch boughs
      for (let b = 0; b < 3; b++) {
        const bAngle = (b / 3) * Math.PI * 2 + Math.random() * 0.5;
        const bLen = 1.0 + Math.random() * 0.8;
        const bGeom = new THREE.CylinderGeometry(0.08, 0.14, bLen, 5);
        bGeom.rotateZ(Math.PI / 3.4);
        bGeom.translate(bLen * 0.4, 0, 0);
        const branchMesh = new THREE.Mesh(bGeom, trunkMat);
        branchMesh.position.y = height * 0.65 + b * 0.4;
        branchMesh.rotation.y = bAngle;
        branchMesh.castShadow = true;
        treeGroup.add(branchMesh);
      }

      // Foliage
      const leafMat = isBirch ? birchLeafMat : (isPine ? pineLeafMat : oakLeafMat);
      if (isPine) {
        // Tiered coniferous pagoda pine layers
        for (let tier = 0; tier < 4; tier++) {
          const tierY = height * 0.45 + tier * (height * 0.16);
          const tierRadius = 2.4 - tier * 0.45;
          const coneGeom = new THREE.ConeGeometry(tierRadius, 2.2, 7);
          const cone = new THREE.Mesh(coneGeom, leafMat);
          cone.position.y = tierY;
          cone.castShadow = true;
          treeGroup.add(cone);
        }
      } else {
        // Multi-cluster deciduous organic canopy
        const leafCount = 5 + Math.floor(Math.random() * 4);
        for (let l = 0; l < leafCount; l++) {
          const leafGeom = new THREE.DodecahedronGeometry(1.3 + Math.random() * 0.65, 1);
          const foliage = new THREE.Mesh(leafGeom, leafMat);
          foliage.position.set(
            (Math.random() - 0.5) * 2.2,
            height + (Math.random() - 0.2) * 1.8,
            (Math.random() - 0.5) * 2.2
          );
          foliage.castShadow = true;
          treeGroup.add(foliage);
        }
      }

      const treeId = 'Tree_' + i;
      treeGroup.userData = {
        isBreakableTree: true,
        hp: 40,
        woodYield: 15,
        treeId,
        position: new THREE.Vector3(x, y, z)
      };

      this.scene.add(treeGroup);
      this.trees.push(treeGroup);
      this.breakables.push(treeGroup);

      // Register solid trunk collision (cannot walk through tree trunks!)
      collision.addCylinder(x, z, trunkRadius + 0.12, y - 0.5, y + height + 1.0, treeId);
    }
  }

  // Build All 5 Unique Battling Camps Across the Expanded Map
  buildAllCamps() {
    this.buildWoodcutterCamp();
    this.buildMountainSkullFortress();
    this.buildRiverMarauderCamp();
    this.buildRuinedCastleCamp();
    this.buildDepthsExcavationCamp();
  }

  // 1. Woodcutter Goblin Encampment (Eastern Forest clearing)
  buildWoodcutterCamp() {
    const cx = this.goblinCampCenter.x;
    const cz = this.goblinCampCenter.z;
    const cy = this.terrain.getHeight(cx, cz);
    this.goblinCampCenter.y = cy;

    const campGroup = new THREE.Group();
    campGroup.position.set(cx, cy, cz);

    const woodTex = TextureGenerator.createBarkTexture(0x452b1a);
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });
    const palisadeMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.95 });

    // Central Bonfire
    const fireBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.45, 8), new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
    campGroup.add(fireBase);
    const campLight = new THREE.PointLight(0xff6600, 2.4, 22);
    campLight.position.set(0, 1.2, 0);
    campGroup.add(campLight);

    // Palisades / Spiked Wall Stakes with collision
    const fenceRadius = 18;
    for (let a = 0; a < Math.PI * 2; a += 0.38) {
      if (a > 0.8 && a < 1.5) continue; // Gate gap
      const fx = Math.cos(a) * fenceRadius;
      const fz = Math.sin(a) * fenceRadius;
      const fy = this.terrain.getHeight(cx + fx, cz + fz) - cy;

      const stake = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.8, 6), palisadeMat);
      stake.position.set(fx, fy + 1.4, fz);
      stake.castShadow = true;
      campGroup.add(stake);

      collision.addCylinder(cx + fx, cz + fz, 0.3, cy + fy - 0.5, cy + fy + 3.0, 'Palisade_1');
    }

    // Goblin Watchtower
    const tower = new THREE.Group();
    tower.position.set(12, 0, 12);
    [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.5, 6), woodMat);
      leg.position.set(px, 3.2, pz);
      tower.add(leg);
      collision.addCylinder(cx + 12 + px, cz + 12 + pz, 0.25, cy - 0.5, cy + 6.5, 'TowerPost_1');
    });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.6), woodMat);
    platform.position.set(0, 6.5, 0);
    tower.add(platform);
    campGroup.add(tower);

    // Chopped wood piles
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.8, 8, 1, false), woodMat);
      log.rotateZ(Math.PI / 2);
      log.position.set(-6 + l * 0.8, 0.35, -5);
      campGroup.add(log);
    }

    this.scene.add(campGroup);
  }

  // 2. Mountain Skull Fortress (Northwestern crags: fortified rocky stronghold)
  buildMountainSkullFortress() {
    const cx = this.mountainFortressCenter.x;
    const cz = this.mountainFortressCenter.z;
    const cy = this.terrain.getHeight(cx, cz);
    this.mountainFortressCenter.y = cy;

    const fortGroup = new THREE.Group();
    fortGroup.position.set(cx, cy, cz);

    const rockTex = TextureGenerator.createRockTexture(0x3f3f46, true);
    const fortStoneMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.9 });
    const woodTex = TextureGenerator.createBarkTexture(0x3e2723);
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.9 });

    // Massive Stone Skull Cave Gateway
    const skullRock = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5, 1), fortStoneMat);
    skullRock.position.set(0, 4.5, -8);
    skullRock.scale.set(1.2, 1.0, 0.9);
    fortGroup.add(skullRock);
    collision.addSphere(cx, cy + 4.5, cz - 8, 6.2, 'SkullRockFort');

    // Dual High Sniper Watchtowers
    [-14, 14].forEach(tx => {
      const tower = new THREE.Group();
      tower.position.set(tx, 0, 10);
      [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.5, 6), woodMat);
        post.position.set(px, 3.75, pz);
        tower.add(post);
        collision.addCylinder(cx + tx + px, cz + 10 + pz, 0.3, cy - 0.5, cy + 7.5, 'FortTowerPost');
      });
      const topDeck = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 3.8), woodMat);
      topDeck.position.set(0, 7.5, 0);
      tower.add(topDeck);
      fortGroup.add(tower);
    });

    // Spiked Wall Perimeter
    const wallRadius = 24;
    for (let a = 0; a < Math.PI * 2; a += 0.32) {
      if (a > 1.2 && a < 1.9) continue; // Gate opening
      const wx = Math.cos(a) * wallRadius;
      const wz = Math.sin(a) * wallRadius;
      const stake = new THREE.Mesh(new THREE.ConeGeometry(0.3, 3.8, 6), woodMat);
      stake.position.set(wx, 1.9, wz);
      stake.castShadow = true;
      fortGroup.add(stake);
      collision.addCylinder(cx + wx, cz + wz, 0.35, cy - 0.5, cy + 4.0, 'FortPalisade');
    }

    // Central War Bonfire
    const firePit = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0x18181b }));
    firePit.position.set(0, 0.25, 0);
    fortGroup.add(firePit);
    const fireLight = new THREE.PointLight(0xef4444, 3.0, 28);
    fireLight.position.set(0, 2.0, 0);
    fortGroup.add(fireLight);

    // Explosive Powder Barrels (Red Zonai Bomb Barrels)
    for (let b = 0; b < 3; b++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 1.1, 8),
        new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 })
      );
      barrel.position.set(-5 + b * 1.2, 0.55, 4);
      barrel.userData = { isExplosiveBarrel: true, name: 'Explosive Bomb Barrel' };
      fortGroup.add(barrel);
      collision.addCylinder(cx - 5 + b * 1.2, cz + 4, 0.48, cy, cy + 1.2, 'BombBarrel');
    }

    // Heavy Tribal Loot Chest
    const chest = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.1, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x854d0e, metalness: 0.7, roughness: 0.3 })
    );
    chest.position.set(0, 0.55, -4);
    chest.userData = { isLootChest: true, loot: 'Fortress Treasure (30 Wood, 100 Biomass, 2 Rubies)' };
    fortGroup.add(chest);

    this.scene.add(fortGroup);
  }

  // 3. River Marauder Encampment (Southern riverbanks & stilt docks)
  buildRiverMarauderCamp() {
    const cx = this.riverMarauderCenter.x;
    const cz = this.riverMarauderCenter.z;
    const cy = this.terrain.getHeight(cx, cz);
    this.riverMarauderCenter.y = cy;

    const campGroup = new THREE.Group();
    campGroup.position.set(cx, cy, cz);

    const plankTex = TextureGenerator.createBarkTexture(0x5c4033);
    const plankMat = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.85 });

    // Riverside Raft Docks
    const dock = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 10), plankMat);
    dock.position.set(0, 0.25, 0);
    dock.receiveShadow = true;
    campGroup.add(dock);

    // Dock Stilts
    [[-6, -4], [6, -4], [-6, 4], [6, 4]].forEach(([sx, sz]) => {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4.0, 6), plankMat);
      stilt.position.set(sx, -1.8, sz);
      campGroup.add(stilt);
      collision.addCylinder(cx + sx, cz + sz, 0.3, cy - 3.5, cy + 1.0, 'RiverStilt');
    });

    // Lookout Raft Tower
    const tower = new THREE.Group();
    tower.position.set(5, 0.5, -3);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 5.0, 5), plankMat);
      p.position.set(px, 2.5, pz);
      tower.add(p);
      collision.addCylinder(cx + 5 + px, cz - 3 + pz, 0.2, cy, cy + 5.5, 'RaftTowerPost');
    });
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 2.8), plankMat);
    platform.position.set(0, 5.0, 0);
    tower.add(platform);
    campGroup.add(tower);

    // River Loot Cage
    const cage = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.0, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x475569, wireframe: true })
    );
    cage.position.set(-4, 1.2, 2);
    campGroup.add(cage);
    collision.addBox(cx - 5.0, cx - 3.0, cz + 1.0, cz + 3.0, cy, cy + 2.5, 'RiverCage');

    this.scene.add(campGroup);
  }

  // 4. Ruined Castle Stronghold (Northeastern Ancient Fortress)
  buildRuinedCastleCamp() {
    const cx = this.ruinedCastleCenter.x;
    const cz = this.ruinedCastleCenter.z;
    const cy = this.terrain.getHeight(cx, cz);
    this.ruinedCastleCenter.y = cy;

    const fortGroup = new THREE.Group();
    fortGroup.position.set(cx, cy, cz);

    const stoneTex = TextureGenerator.createZonaiStoneTexture();
    const rockTex = TextureGenerator.createRockTexture(0x475569, true);
    const castleMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.9 });
    const runeMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.7 });

    // Ruined Rampart Walls
    [
      { x: 0, z: -14, w: 22, h: 4.5, d: 2.2 },
      { x: -11, z: 0, w: 2.2, h: 4.0, d: 24 },
      { x: 11, z: 0, w: 2.2, h: 4.0, d: 24 }
    ].forEach((wall, idx) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.w, wall.h, wall.d), castleMat);
      mesh.position.set(wall.x, wall.h * 0.5, wall.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      fortGroup.add(mesh);
      collision.addBox(
        cx + wall.x - wall.w * 0.5, cx + wall.x + wall.w * 0.5,
        cz + wall.z - wall.d * 0.5, cz + wall.z + wall.d * 0.5,
        cy - 0.5, cy + wall.h + 0.5,
        'CastleWall_' + idx
      );
    });

    // Castle Stone Columns
    [[-8, -8], [8, -8], [-8, 6], [8, 6]].forEach(([px, pz], idx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 5.5, 8), runeMat);
      col.position.set(px, 2.75, pz);
      col.castShadow = true;
      fortGroup.add(col);
      collision.addCylinder(cx + px, cz + pz, 0.85, cy - 0.5, cy + 5.5, 'CastleColumn_' + idx);
    });

    // Chieftain Stone Dais Throne
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.5, 0.8, 8), castleMat);
    dais.position.set(0, 0.4, -6);
    fortGroup.add(dais);

    // Ancient Royal Chest
    const royalChest = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.85, roughness: 0.25 })
    );
    royalChest.position.set(0, 1.2, -6);
    royalChest.userData = { isRoyalChest: true, name: 'Ancient Royal Chest' };
    fortGroup.add(royalChest);

    this.scene.add(fortGroup);
  }

  // 5. Depths Gloom Excavation Camp (Located in subterranean depths at y = -90)
  buildDepthsExcavationCamp() {
    const cx = this.depthsCampCenter.x;
    const cy = this.depthsCampCenter.y;
    const cz = this.depthsCampCenter.z;

    const campGroup = new THREE.Group();
    campGroup.position.set(cx, cy, cz);

    const maliceTex = TextureGenerator.createGloomMaliceTexture();
    const gloomMat = new THREE.MeshStandardMaterial({ map: maliceTex, roughness: 0.8 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.3 });

    // Gloom Mining Carts
    for (let c = 0; c < 2; c++) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.6), ironMat);
      cart.position.set(-4 + c * 8, 0.6, -3);
      campGroup.add(cart);
      collision.addBox(cx - 5.5 + c * 8, cx - 2.5 + c * 8, cz - 4, cz - 2, cy - 0.5, cy + 2.0, 'MineCart_' + c);
    }

    // Glowing Purple Gloom Braziers
    [-6, 6].forEach(bx => {
      const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.4, 6), ironMat);
      brazier.position.set(bx, 0.7, 4);
      campGroup.add(brazier);
      const bLight = new THREE.PointLight(0xa855f7, 2.5, 18);
      bLight.position.set(bx, 1.6, 4);
      campGroup.add(bLight);
    });

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
  spawnInstancedFoliage(count = 1400) {
    // 1. Instanced Grass Tufts (Blades)
    const tuftTex = TextureGenerator.createGrassTuftTexture();
    const tuftMat = new THREE.MeshLambertMaterial({
      map: tuftTex,
      transparent: true,
      alphaTest: 0.3,
      side: THREE.DoubleSide
    });

    // Dynamic wind sway shader injection (Breath of the Wild / TOTK wind simulation)
    tuftMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      tuftMat.userData.shader = shader;
      shader.vertexShader = `
        uniform float uTime;
      ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        if (position.y > 0.1) {
          float windX = sin(uTime * 2.6 + position.x * 0.35 + position.z * 0.35) * 0.18;
          float windZ = cos(uTime * 1.9 + position.z * 0.28) * 0.12;
          transformed.x += windX * (position.y / 0.9);
          transformed.z += windZ * (position.y / 0.9);
        }
        `
      );
    };
    this.tuftMat = tuftMat;

    // Cross-quad blade geometry
    const planeA = new THREE.PlaneGeometry(0.85, 0.95);
    planeA.translate(0, 0.47, 0);
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

  // Ancient Stone Ruins & Monoliths (Zelda-style weathered stonework with collision)
  spawnAncientRuins() {
    const stoneTex = TextureGenerator.createRockTexture(0x57534e, true);
    const mossTex = TextureGenerator.createRockTexture(0x44403c, true);
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92 });
    const mossStoneMat = new THREE.MeshStandardMaterial({ map: mossTex, roughness: 0.88 });
    const runeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75 });

    // 1. Ancient Stone Archway at x: 20, z: -15
    const archGroup = new THREE.Group();
    const archY = this.terrain.getHeight(20, -15);
    archGroup.position.set(20, archY, -15);

    // Left & Right Pillars with collision
    [-2.2, 2.2].forEach((px, idx) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 4.8, 8), stoneMat);
      pillar.position.set(px, 2.4, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      archGroup.add(pillar);
      collision.addCylinder(20 + px, -15, 0.7, archY, archY + 5.0, 'ArchPillar_' + idx);
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
    for (let m = 0; m < 6; m++) {
      const mx = -40 + (Math.random() - 0.5) * 35;
      const mz = -70 + (Math.random() - 0.5) * 35;
      const my = this.terrain.getHeight(mx, mz);
      const monoH = 2.4 + Math.random() * 2.8;
      const mono = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.58, monoH, 7),
        stoneMat
      );
      mono.position.set(mx, my + monoH * 0.5, mz);
      mono.rotation.z = (Math.random() - 0.5) * 0.35;
      mono.rotation.y = Math.random() * Math.PI;
      mono.castShadow = true;
      this.scene.add(mono);

      collision.addCylinder(mx, mz, 0.6, my, my + monoH, 'Monolith_' + m);
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
      const x = (Math.random() - 0.5) * (this.terrain.size - 60);
      const z = (Math.random() - 0.5) * (this.terrain.size - 60);
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

  // Mossy Granite Boulders & Stepping Stones with authentic rock texture and solid collision
  spawnRockFormations(count = 80) {
    const rockTex = TextureGenerator.createRockTexture(0x57606e, false);
    const mossTex = TextureGenerator.createRockTexture(0x405338, true);
    const rockMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.92 });
    const mossMat = new THREE.MeshStandardMaterial({ map: mossTex, roughness: 0.88 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 60);
      const z = (Math.random() - 0.5) * (this.terrain.size - 60);
      if (Math.hypot(x, z - 10) < 22) continue;
      const y = this.terrain.getHeight(x, z);
      const isSteppingStone = this.terrain.isWater(x, z);

      const scale = isSteppingStone ? 0.9 + Math.random() * 0.5 : 1.3 + Math.random() * 1.8;
      const mat = Math.random() < 0.45 ? mossMat : rockMat;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), mat);

      rock.position.set(x, isSteppingStone ? -0.1 : y + scale * 0.35, z);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      rock.receiveShadow = true;
      rock.userData = {
        isFusable: true,
        fuseType: 'boulder',
        name: 'Granite Boulder',
        scale
      };
      this.scene.add(rock);

      if (!isSteppingStone) {
        this.fusableObjects.push(rock);
        // Solid spherical obstacle collision
        collision.addSphere(x, y + scale * 0.35, z, scale * 0.85, 'Rock_' + i);
      }
    }
  }

  // Full Solid Cylindrical Fallen Hardwood Logs with growth rings and solid capsule collision
  spawnFallenLogs(count = 40) {
    const barkTex = TextureGenerator.createBarkTexture(0x4a321d);
    const barkNormal = TextureGenerator.createBarkNormalMap();
    const ringTex = TextureGenerator.createWoodRingTexture();

    const logMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.88
    });
    const capMat = new THREE.MeshStandardMaterial({
      map: ringTex,
      roughness: 0.85
    });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 60);
      const z = (Math.random() - 0.5) * (this.terrain.size - 60);
      if (this.terrain.isWater(x, z)) continue;
      if (Math.hypot(x, z - 10) < 22) continue;

      const y = this.terrain.getHeight(x, z);
      const len = 3.8 + Math.random() * 3.2;
      const rTop = 0.38 + Math.random() * 0.08;
      const rBot = 0.46 + Math.random() * 0.08;

      const logGroup = new THREE.Group();
      logGroup.position.set(x, y + rBot * 0.85, z);
      const rotY = Math.random() * Math.PI;
      logGroup.rotation.y = rotY;

      // FULL solid cylinder (openEnded: false - eliminates hollow tube look!)
      const logGeom = new THREE.CylinderGeometry(rTop, rBot, len, 16, 1, false);
      logGeom.rotateZ(Math.PI / 2);
      const logMesh = new THREE.Mesh(logGeom, logMat);
      logMesh.castShadow = true;
      logMesh.receiveShadow = true;
      logGroup.add(logMesh);

      // Authentic concentric tree-ring end caps on both ends of the log
      const capTop = new THREE.Mesh(new THREE.CircleGeometry(rTop, 16), capMat);
      capTop.position.set(len * 0.5 + 0.005, 0, 0);
      capTop.rotation.y = Math.PI / 2;
      logGroup.add(capTop);

      const capBot = new THREE.Mesh(new THREE.CircleGeometry(rBot, 16), capMat);
      capBot.position.set(-len * 0.5 - 0.005, 0, 0);
      capBot.rotation.y = -Math.PI / 2;
      logGroup.add(capBot);

      logGroup.userData = {
        isFusable: true,
        fuseType: 'log',
        name: 'Hardwood Solid Log'
      };
      this.scene.add(logGroup);
      this.fusableObjects.push(logGroup);

      // Solid capsule collision (player cannot walk through fallen logs!)
      const halfLen = len * 0.5;
      const dx = Math.cos(rotY) * halfLen;
      const dz = -Math.sin(rotY) * halfLen;
      collision.addCapsule(x - dx, z - dz, x + dx, z + dz, Math.max(rTop, rBot), y - 0.5, y + 1.6, 'Log_' + i);
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

  // 13. Golden Sundelions (TOTK: cures Gloom fatigue & heals bark)
  spawnSundelions(count = 16) {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 50);
      const z = (Math.random() - 0.5) * (this.terrain.size - 50);
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      if (y < 1.0) continue; // Only sunny hills & knolls

      const flower = new THREE.Group();
      flower.position.set(x, y + 0.1, z);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 5), stemMat);
      stem.position.y = 0.25;
      flower.add(stem);

      const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 8), centerMat);
      disk.position.y = 0.5;
      flower.add(disk);

      for (let p = 0; p < 8; p++) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), petalMat);
        const angle = (p / 8) * Math.PI * 2;
        petal.position.set(Math.cos(angle) * 0.16, 0.5, Math.sin(angle) * 0.16);
        petal.rotation.y = angle;
        petal.rotation.z = Math.PI / 2;
        flower.add(petal);
      }

      flower.userData = {
        type: 'sundelion',
        name: 'Golden Sundelion',
        hpGain: 40,
        moistureGain: 30,
        sundelionGain: 1
      };

      this.scene.add(flower);
      this.pickups.push(flower);
    }
  }

  // 14. Silent Princess (Rare Sacred Flower of Hyrule)
  spawnSilentPrincesses(count = 8) {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.9,
      roughness: 0.2
    });
    const stamenMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 22;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      const flower = new THREE.Group();
      flower.position.set(x, y + 0.1, z);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.65, 5), stemMat);
      stem.position.y = 0.32;
      stem.rotation.z = 0.1;
      flower.add(stem);

      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 4), petalMat);
        const pAngle = (p / 5) * Math.PI * 2;
        petal.position.set(Math.cos(pAngle) * 0.1, 0.65, Math.sin(pAngle) * 0.1);
        petal.rotation.x = -0.35;
        petal.rotation.y = pAngle;
        flower.add(petal);
      }

      const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), stamenMat);
      stamen.position.set(0, 0.62, 0);
      flower.add(stamen);

      flower.userData = {
        type: 'silent_princess',
        name: 'Silent Princess',
        photosynthesisGain: 100,
        biomassGain: 50
      };

      this.scene.add(flower);
      this.pickups.push(flower);
    }
  }

  // 15. Bomb Flowers (TOTK explosive flora)
  spawnBombFlowers(count = 12) {
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      emissive: 0x9a3412,
      emissiveIntensity: 0.5,
      roughness: 0.4
    });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 60);
      const z = (Math.random() - 0.5) * (this.terrain.size - 60);
      if (this.terrain.isWater(x, z)) continue;

      const y = this.terrain.getHeight(x, z);
      const bomb = new THREE.Group();
      bomb.position.set(x, y + 0.2, z);

      const bulb = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), bulbMat);
      bulb.position.y = 0.24;
      bulb.scale.set(1, 1.1, 1);
      bomb.add(bulb);

      for (let l = 0; l < 4; l++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.1), leafMat);
        const lAngle = (l / 4) * Math.PI * 2;
        leaf.position.set(Math.cos(lAngle) * 0.12, 0.45, Math.sin(lAngle) * 0.12);
        leaf.rotation.y = lAngle;
        leaf.rotation.x = 0.4;
        bomb.add(leaf);
      }

      bomb.userData = {
        type: 'bomb_flower',
        name: 'Bomb Flower',
        ammoGain: 3,
        biomassGain: 20,
        isFusable: true,
        fuseType: 'bomb_flower'
      };

      this.scene.add(bomb);
      this.pickups.push(bomb);
      this.fusableObjects.push(bomb);
    }
  }

  // 16. Drifting Poe Spirits (TOTK luminous souls)
  spawnPoes(count = 18) {
    const poeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1
    });

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * (this.terrain.size - 50);
      const z = (Math.random() - 0.5) * (this.terrain.size - 50);
      const y = Math.max(0.6, this.terrain.getHeight(x, z)) + 0.5 + Math.random() * 0.8;

      const poe = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 1), poeMat);
      poe.position.set(x, y, z);
      poe.userData = {
        type: 'poe',
        name: 'Poe Spirit',
        stardustGain: 1,
        biomassGain: 15,
        baseY: y,
        floatOffset: Math.random() * Math.PI * 2
      };

      this.scene.add(poe);
      this.pickups.push(poe);
    }
  }

  // 17. Ancient Zonai Boost Pads (Sky launch catapults with visible vertical sky light beacons)
  spawnZonaiBoostPads() {
    const padLocations = [
      [8, 14],     // Right next to the starting woodland grove!
      [18, 12],
      [-45, -30],
      [55, 35],
      [38, -32],   // Near Living Roots Shrine
      [-42, 28],   // Near Magnetic Flow Shrine
      [10, 68]     // Near Sylvan Lake & Temporal Shrine
    ];

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.8, roughness: 0.25 });
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.2,
      roughness: 0.15
    });
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const skyBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });

    padLocations.forEach(loc => {
      const x = loc[0];
      const z = loc[1];
      const y = this.terrain.getHeight(x, z);

      const padGroup = new THREE.Group();
      padGroup.position.set(x, y + 0.08, z);

      // Stepped Zonai Stone Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 0.25, 16), baseMat);
      base.receiveShadow = true;
      padGroup.add(base);

      // Glowing Zonai Glyphs Ring
      const glyphRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.1, 8, 28), ringMat);
      glyphRing.rotation.x = Math.PI / 2;
      glyphRing.position.y = 0.14;
      padGroup.add(glyphRing);

      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 12), ringMat);
      core.position.y = 0.14;
      padGroup.add(core);

      // Pulsing Green Sky Light Pillar reaching up to the clouds
      const skyBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.8, 48, 12, 1, true), skyBeaconMat);
      skyBeacon.position.y = 24.0;
      padGroup.add(skyBeacon);

      // Point Light for dramatic ground glow
      const padLight = new THREE.PointLight(0x10b981, 2.5, 16);
      padLight.position.set(0, 1.2, 0);
      padGroup.add(padLight);

      padGroup.userData = {
        isZonaiPad: true,
        radius: 2.6,
        glyphRing,
        skyBeacon
      };

      this.scene.add(padGroup);
      this.zonaiPads.push(padGroup);
    });
  }

  // 18. Corrupted Gloom / Malice Pools
  spawnGloomPuddles() {
    const gloomMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0x4c0519,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.5
    });

    const locations = [
      [-40, -70, 5.0],
      [68, -25, 4.2]
    ];

    locations.forEach(loc => {
      const x = loc[0];
      const z = loc[1];
      const radius = loc[2];
      const y = this.terrain.getHeight(x, z);

      const gloom = new THREE.Mesh(new THREE.CircleGeometry(radius, 16), gloomMat);
      gloom.position.set(x, y + 0.04, z);
      gloom.rotation.x = -Math.PI / 2;
      gloom.userData = { radius };

      this.scene.add(gloom);
      this.gloomPuddles.push(gloom);
    });
  }

  update(delta, time) {
    // Dynamic wind sway across foliage tufts
    if (this.tuftMat && this.tuftMat.userData && this.tuftMat.userData.shader) {
      this.tuftMat.userData.shader.uniforms.uTime.value = time;
    }

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

    // Gentle floating bob & rotation on pickups (Sundelions, Poes, etc.)
    this.pickups.forEach((p, idx) => {
      p.rotation.y += delta * 1.5;
      if (p.userData && p.userData.type === 'poe') {
        p.position.y = p.userData.baseY + Math.sin(time * 3 + (p.userData.floatOffset || 0)) * 0.25;
      } else {
        p.position.y += Math.sin(time * 3 + idx) * 0.001;
      }
    });

    // Zonai Boost Pad animations
    this.zonaiPads.forEach((pad, idx) => {
      const u = pad.userData;
      if (u && u.glyphRing) {
        u.glyphRing.rotation.z += delta * 1.2;
      }
      if (u && u.beam) {
        u.beam.material.opacity = 0.35 + Math.sin(time * 6 + idx) * 0.18;
      }
    });

    // Sky Island animated waterfalls & glowing sacred crystals
    if (this.skyIslands) {
      this.skyIslands.forEach(isl => {
        if (isl.userData && isl.userData.crystal) {
          isl.userData.crystal.rotation.y += delta * 0.8;
          isl.userData.crystal.rotation.x = Math.sin(time * 1.6) * 0.12;
        }
      });
    }

    // Great Fairy Fountain floating fairy orbs
    if (this.fairyOrbs) {
      this.fairyOrbs.forEach((orb, oIdx) => {
        orb.position.y += delta * 0.45;
        orb.position.x += Math.sin(time * 2.5 + oIdx) * 0.02;
        orb.position.z += Math.cos(time * 2.5 + oIdx) * 0.02;
        if (orb.position.y > (orb.userData.startY || 1.0) + 3.8) {
          orb.position.y = (orb.userData.startY || 1.0);
        }
      });
    }
  }

  // 14. Floating Zelda TOTK Sylvan Sky Islands with Cascading Waterfalls
  spawnSkyIslands() {
    const islands = [
      { x: 10, y: 82, z: 45, radius: 24, name: 'Great Sylvan Sky Island' },
      { x: -55, y: 92, z: -35, radius: 18, name: 'Ancient Temple Sky Altar' }
    ];

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.7 });
    const runeMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.7 });
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.05,
      metalness: 0.4,
      side: THREE.DoubleSide
    });

    islands.forEach(isl => {
      const group = new THREE.Group();
      group.position.set(isl.x, isl.y, isl.z);

      // Inverted Rock Cone Bottom
      const baseCone = new THREE.Mesh(new THREE.ConeGeometry(isl.radius, 22, 14), stoneMat);
      baseCone.rotation.x = Math.PI; // point downwards
      baseCone.position.y = -11;
      baseCone.castShadow = true;
      group.add(baseCone);

      // Flat Lush Grass Plateau
      const topPlateau = new THREE.Mesh(new THREE.CylinderGeometry(isl.radius, isl.radius, 2.5, 16), grassMat);
      topPlateau.position.y = 1.25;
      topPlateau.receiveShadow = true;
      group.add(topPlateau);

      // Ancient Zonai Temple Columns
      for (let c = 0; c < 6; c++) {
        const angle = (c / 6) * Math.PI * 2;
        const cx = Math.cos(angle) * (isl.radius * 0.65);
        const cz = Math.sin(angle) * (isl.radius * 0.65);
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 5.5, 8), stoneMat);
        col.position.set(cx, 4.0, cz);
        col.castShadow = true;
        group.add(col);
      }

      // Center Sacred Zonai Monolith Altar
      const altar = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.8, 4.0), stoneMat);
      altar.position.y = 2.4;
      group.add(altar);

      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), runeMat);
      crystal.position.y = 4.2;
      group.add(crystal);

      // Cascading Sky Waterfall plunging downward toward lake below
      const fallHeight = isl.y;
      const waterfall = new THREE.Mesh(new THREE.PlaneGeometry(6.5, fallHeight), waterMat);
      waterfall.position.set(isl.radius * 0.85, -fallHeight * 0.5 + 2, 0);
      waterfall.rotation.y = Math.PI / 2;
      group.add(waterfall);

      // Sacred Room of Awakening & Sky Diving Board on Great Sky Island
      if (isl.name === 'Great Sylvan Sky Island') {
        const awakeningGroup = new THREE.Group();
        awakeningGroup.position.set(0, 2.5, 7); // World: (10, 84.5, 52)

        // Circular stone chamber wall
        const chamberWall = new THREE.Mesh(
          new THREE.CylinderGeometry(8.5, 8.5, 5.0, 16, 1, true, Math.PI * 0.25, Math.PI * 1.5),
          stoneMat
        );
        chamberWall.position.y = 2.5;
        awakeningGroup.add(chamberWall);

        // Stone Ceiling with opening
        const ceiling = new THREE.Mesh(new THREE.RingGeometry(2.5, 8.5, 16), stoneMat);
        ceiling.rotation.x = -Math.PI / 2;
        ceiling.position.y = 5.0;
        awakeningGroup.add(ceiling);

        // Glowing Turquoise Awakening Pool
        const poolBorder = new THREE.Mesh(
          new THREE.TorusGeometry(3.2, 0.35, 8, 24),
          new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5 })
        );
        poolBorder.rotation.x = Math.PI / 2;
        poolBorder.position.y = 0.15;
        awakeningGroup.add(poolBorder);

        const poolWater = new THREE.Mesh(
          new THREE.CircleGeometry(3.0, 24),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.85
          })
        );
        poolWater.rotation.x = -Math.PI / 2;
        poolWater.position.y = 0.18;
        awakeningGroup.add(poolWater);

        // Central pedestal where Link awakens
        const pedestal = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.4, 0.4, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
        );
        pedestal.position.y = 0.2;
        awakeningGroup.add(pedestal);

        // King Rauru glowing Zonai right hand glyph
        const handGlyph = new THREE.Mesh(
          new THREE.RingGeometry(0.4, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.5 })
        );
        handGlyph.rotation.x = -Math.PI / 2;
        handGlyph.position.y = 0.42;
        awakeningGroup.add(handGlyph);

        const awakenLight = new THREE.PointLight(0x38bdf8, 3.0, 18);
        awakenLight.position.set(0, 3.0, 0);
        awakeningGroup.add(awakenLight);

        // Exit Archway Portal leading forward toward the sky diving board
        const archL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), stoneMat);
        archL.position.set(-2.2, 2.25, -6.5);
        awakeningGroup.add(archL);
        const archR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.5, 0.8), stoneMat);
        archR.position.set(2.2, 2.25, -6.5);
        awakeningGroup.add(archR);
        const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.8, 0.8), stoneMat);
        archTop.position.set(0, 4.5, -6.5);
        awakeningGroup.add(archTop);

        group.add(awakeningGroup);

        // Sky Island Diving Board Ledge projecting into open air
        const divingLedge = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 10.0), stoneMat);
        divingLedge.position.set(0, 2.5, -18); // World: (10, 84.5, 27)
        divingLedge.receiveShadow = true;
        group.add(divingLedge);

        // Golden Zonai glyph trim at tip of diving board
        const tipTrim = new THREE.Mesh(
          new THREE.BoxGeometry(3.7, 0.65, 0.6),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308, emissiveIntensity: 0.8 })
        );
        tipTrim.position.set(0, 2.5, -22.8);
        group.add(tipTrim);

        this.divingBoardPosition = new THREE.Vector3(isl.x, isl.y + 2.8, isl.z - 18);
      }

      group.userData = { waterfall, crystal, name: isl.name, radius: isl.radius, surfaceY: isl.y + 2.5 };

      this.scene.add(group);
      this.skyIslands.push(group);
    });

    // Add Aligned Ground Launch Boost Pad directly below Great Sky Island at (10, 45)
    if (this.zonaiPads) {
      const groundY = this.terrain.getHeight(10, 45);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.7, roughness: 0.3 });
      const padRingMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.95 });
      const pad = new THREE.Group();
      pad.position.set(10, groundY + 0.1, 45);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.35, 16), padMat);
      pad.add(base);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 2.1, 16), padRingMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.2;
      pad.add(ring);
      this.scene.add(pad);
      this.zonaiPads.push(pad);
    }
  }

  // 15. Proper Gloom Chasm Abyss & The Depths Underworld Realm (y = -90)
  spawnProperChasmAndDepths() {
    const cx = this.terrain.chasmCenter.x;
    const cz = this.terrain.chasmCenter.y;
    const surfaceY = 4.0;
    const depthsY = this.terrain.depthsFloorY; // -90.0

    const chasmGroup = new THREE.Group();
    const rockTex = TextureGenerator.createRockTexture(0x18181b, false);
    const maliceTex = TextureGenerator.createGloomMaliceTexture();
    const obsidianMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.95 });
    const gloomMaliceMat = new THREE.MeshStandardMaterial({ map: maliceTex, roughness: 0.8 });

    // 1. Surface Chasm Jagged Obsidian Teeth Spires circling the abyss mouth
    for (let s = 0; s < 18; s++) {
      const angle = (s / 18) * Math.PI * 2;
      const r = 24.0 + (Math.random() - 0.5) * 3.0;
      const sx = cx + Math.cos(angle) * r;
      const sz = cz + Math.sin(angle) * r;
      const sy = this.terrain.getHeight(sx, sz, surfaceY);

      const h = 5.0 + Math.random() * 5.0;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.6, h, 6), obsidianMat);
      spire.position.set(sx, sy + h * 0.45, sz);
      spire.rotation.z = (Math.random() - 0.5) * 0.35;
      spire.rotation.x = (Math.random() - 0.5) * 0.35;
      spire.castShadow = true;
      chasmGroup.add(spire);

      collision.addCylinder(sx, sz, 1.4, sy - 1, sy + h, 'ChasmSpire_' + s);
    }

    // Ominous Crimson Gloom Abyss Core Light at the mouth of the pit
    const chasmLight = new THREE.PointLight(0xe11d48, 3.5, 45);
    chasmLight.position.set(cx, surfaceY - 8.0, cz);
    chasmGroup.add(chasmLight);

    // 2. The Depths Subterranean Realm (Floor at y = -90)
    const depthsFloorGeom = new THREE.PlaneGeometry(380, 380, 48, 48);
    depthsFloorGeom.rotateX(-Math.PI / 2);
    const depthsFloor = new THREE.Mesh(depthsFloorGeom, gloomMaliceMat);
    depthsFloor.position.set(cx, depthsY, cz);
    depthsFloor.receiveShadow = true;
    chasmGroup.add(depthsFloor);

    // Towering Ancient Zonai Lightroot at (cx - 25, depthsY, cz - 25)
    const rootGroup = new THREE.Group();
    rootGroup.position.set(cx - 25, depthsY, cz - 25);

    const rootBarkTex = TextureGenerator.createBarkTexture(0x2d241c);
    const rootTrunkMat = new THREE.MeshStandardMaterial({ map: rootBarkTex, roughness: 0.9 });
    const lightrootGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    // Gigantic world-root trunk reaching 42m into the darkness
    const rootTrunk = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.8, 42, 8), rootTrunkMat);
    rootTrunk.position.y = 21;
    rootGroup.add(rootTrunk);
    collision.addCylinder(cx - 25, cz - 25, 4.6, depthsY, depthsY + 42, 'LightrootTrunk');

    // Glowing Golden Lightroot Bulb Canopy
    const rootBulb = new THREE.Mesh(new THREE.DodecahedronGeometry(5.5, 2), lightrootGoldMat);
    rootBulb.position.y = 42;
    rootGroup.add(rootBulb);

    const rootLight = new THREE.PointLight(0xfef08a, 4.5, 80);
    rootLight.position.set(0, 36, 0);
    rootGroup.add(rootLight);

    // Sacred Activation Core at foot level
    const coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), lightrootGoldMat);
    coreMesh.position.set(0, 1.8, 4.8);
    rootGroup.add(coreMesh);

    rootGroup.userData = {
      isLightroot: true,
      activated: false,
      name: 'Great Underground Lightroot',
      position: new THREE.Vector3(cx - 25, depthsY, cz - 25)
    };
    chasmGroup.add(rootGroup);
    this.lightroot = rootGroup;

    // 3. Zonai Ascend Geyser / Updraft Launch Pad (Directly beneath the chasm hole to launch back up!)
    const geyserGroup = new THREE.Group();
    geyserGroup.position.set(cx, depthsY + 0.1, cz);

    const padMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.8, roughness: 0.3 });
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 0.95 });

    const geyserBase = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.4, 16), padMat);
    geyserGroup.add(geyserBase);

    const geyserRing = new THREE.Mesh(new THREE.RingGeometry(1.2, 3.0, 16), ringMat);
    geyserRing.rotation.x = -Math.PI / 2;
    geyserRing.position.y = 0.22;
    geyserGroup.add(geyserRing);

    // Vertical updraft beam reaching from -90 up to surface
    const beamGeom = new THREE.CylinderGeometry(2.4, 2.4, 95, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.y = 47.5;
    geyserGroup.add(beam);

    geyserGroup.userData = {
      isZonaiPad: true,
      isDepthsAscend: true,
      radius: 3.5,
      position: new THREE.Vector3(cx, depthsY, cz),
      launchVelocity: 85.0
    };
    chasmGroup.add(geyserGroup);
    this.zonaiPads.push(geyserGroup);
    this.depthsLaunchPad = geyserGroup;

    // Subterranean glowing crystals scattered across the Depths
    for (let c = 0; c < 24; c++) {
      const dist = 18.0 + Math.random() * 85.0;
      const angle = Math.random() * Math.PI * 2;
      const crx = cx + Math.cos(angle) * dist;
      const crz = cz + Math.sin(angle) * dist;

      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(0.6 + Math.random() * 0.5, 3.0 + Math.random() * 4.0, 6),
        c % 2 === 0 ? new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.8 })
                    : new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x7e22ce, emissiveIntensity: 0.8 })
      );
      crystal.position.set(crx, depthsY + 1.5, crz);
      crystal.rotation.z = (Math.random() - 0.5) * 0.4;
      chasmGroup.add(crystal);
    }

    // 4. Demon King Malice Sanctum (y = -90) at (cx + 35, depthsY, cz + 30)
    const sanctumGroup = new THREE.Group();
    sanctumGroup.position.set(cx + 35, depthsY, cz + 30);

    const altarPlateau = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 20, 1.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 })
    );
    altarPlateau.position.y = 0.9;
    altarPlateau.receiveShadow = true;
    sanctumGroup.add(altarPlateau);

    // Crimson Malice Spire Columns surrounding the throne
    for (let p = 0; p < 8; p++) {
      const pAngle = (p / 8) * Math.PI * 2;
      const px = Math.cos(pAngle) * 15;
      const pz = Math.sin(pAngle) * 15;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(1.4, 12, 6),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 })
      );
      spire.position.set(px, 6, pz);
      spire.castShadow = true;
      sanctumGroup.add(spire);
      collision.addCylinder(cx + 35 + px, cz + 30 + pz, 1.5, depthsY, depthsY + 12, 'SanctumSpire_' + p);
    }

    // Pulsing Gloom Heart Core in center
    const gloomCoreMat = new THREE.MeshStandardMaterial({
      color: 0x881337,
      emissive: 0xe11d48,
      emissiveIntensity: 1.4,
      roughness: 0.3
    });
    const gloomHeart = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), gloomCoreMat);
    gloomHeart.position.y = 4.5;
    sanctumGroup.add(gloomHeart);

    const sanctumLight = new THREE.PointLight(0xe11d48, 4.5, 50);
    sanctumLight.position.set(0, 5, 0);
    sanctumGroup.add(sanctumLight);

    sanctumGroup.userData = {
      isMaliceSanctum: true,
      gloomHeart,
      center: new THREE.Vector3(cx + 35, depthsY, cz + 30)
    };
    chasmGroup.add(sanctumGroup);
    this.maliceSanctum = sanctumGroup;

    this.scene.add(chasmGroup);
    this.chasmCavern = chasmGroup;
  }

  // 16. Deep Underwater Features in Central Sylvan Lake & Sunken Treasures
  spawnUnderwaterFeatures() {
    const lx = 0;
    const lz = 75;
    const lakeBedY = -8.5;

    const waterGroup = new THREE.Group();
    waterGroup.position.set(lx, 0, lz);

    const stoneTex = TextureGenerator.createRockTexture(0x475569, true);
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 });

    // 1. Sunken Ancient Temple Pillars on the lake floor
    [[-12, -8], [12, -8], [-12, 10], [12, 10]].forEach(([px, pz], idx) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 6.5, 8), stoneMat);
      pillar.position.set(px, lakeBedY + 3.25, pz);
      pillar.rotation.z = (Math.random() - 0.5) * 0.2;
      waterGroup.add(pillar);
      collision.addCylinder(lx + px, lz + pz, 0.85, lakeBedY, lakeBedY + 6.5, 'SunkenPillar_' + idx);
    });

    // 2. Sunken Ancient Zora Treasure Chest resting on the deep lake bed
    const chestMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.25 });
    const sunkenChest = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.0), chestMat);
    sunkenChest.position.set(4, lakeBedY + 0.55, 6);
    sunkenChest.userData = {
      isUnderwaterChest: true,
      name: 'Sunken Zora Relic Chest',
      opened: false,
      position: new THREE.Vector3(lx + 4, lakeBedY + 0.55, lz + 6)
    };
    waterGroup.add(sunkenChest);
    this.underwaterChests.push(sunkenChest);

    // Glowing underwater beacon light
    const pearlLight = new THREE.PointLight(0x38bdf8, 2.0, 16);
    pearlLight.position.set(4, lakeBedY + 1.2, 6);
    waterGroup.add(pearlLight);

    // 3. Tall Bioluminescent River Kelp fronds
    const kelpMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    for (let k = 0; k < 18; k++) {
      const kx = (Math.random() - 0.5) * 45;
      const kz = (Math.random() - 0.5) * 45;
      const kelp = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 5.5 + Math.random() * 2.5), kelpMat);
      kelp.position.set(kx, lakeBedY + 3.0, kz);
      kelp.rotation.y = Math.random() * Math.PI;
      waterGroup.add(kelp);
    }

    this.scene.add(waterGroup);
  }

  // 17. Great Fairy Fountain with Iridescent Floral Bud & Magic Pool
  spawnGreatFairyFountain() {
    const fx = -80;
    const fz = -60;
    const fy = this.terrain.getHeight(fx, fz);

    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(fx, fy, fz);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85
    });

    // 1. Ornate Circular Basin
    const basin = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.55, 8, 32), stoneMat);
    basin.rotation.x = Math.PI / 2;
    basin.position.y = 0.35;
    basin.receiveShadow = true;
    fountainGroup.add(basin);

    // 2. Crystal Magic Pool Water
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(5.0, 32),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.88,
        roughness: 0.1
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.4;
    fountainGroup.add(pool);

    // 3. Great Fairy Giant Floral Bud with Iridescent Petals
    const budGroup = new THREE.Group();
    budGroup.position.set(0, 0.4, 0);

    const petalTex = TextureGenerator.createGreatFairyPetalTexture();
    const petalMat = new THREE.MeshStandardMaterial({
      map: petalTex,
      side: THREE.DoubleSide,
      roughness: 0.5,
      metalness: 0.15
    });

    // 8 Arching Floral Petals forming the magical bulb
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petalMesh = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.4, 5), petalMat);
      petalMesh.position.set(Math.cos(angle) * 1.4, 1.2, Math.sin(angle) * 1.4);
      petalMesh.rotation.y = angle;
      petalMesh.rotation.z = 0.35;
      petalMesh.castShadow = true;
      budGroup.add(petalMesh);
    }

    // Inner Glowing Rose Flower Heart
    const innerHeart = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2, 1),
      new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xec4899,
        emissiveIntensity: 1.4
      })
    );
    innerHeart.position.y = 1.4;
    budGroup.add(innerHeart);

    fountainGroup.add(budGroup);

    // Ethereal Fairy Light
    const fairyLight = new THREE.PointLight(0xf472b6, 3.5, 25);
    fairyLight.position.set(0, 3.0, 0);
    fountainGroup.add(fairyLight);

    // Floating Fairy Orb Sprites
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xfbcfe8 });
    for (let o = 0; o < 8; o++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), orbMat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.5 + Math.random() * 3.2;
      const oy = 0.6 + Math.random() * 2.5;
      orb.position.set(Math.cos(angle) * dist, oy, Math.sin(angle) * dist);
      orb.userData = { startY: 0.6 + Math.random() * 0.8 };
      fountainGroup.add(orb);
      this.fairyOrbs.push(orb);
    }

    fountainGroup.userData = {
      isGreatFairy: true,
      name: 'Great Fairy Tera Fountain',
      budGroup,
      position: new THREE.Vector3(fx, fy, fz)
    };

    this.scene.add(fountainGroup);
    this.greatFairyFountain = fountainGroup;

    // Solid collision around fountain perimeter
    collision.addCylinder(fx, fz, 5.4, fy - 1, fy + 4.5, 'GreatFairyFountain');
  }

  // 18. Temple of Time on the Great Sky Island
  spawnTempleOfTime() {
    const tx = 10;
    const tz = 95;
    const ty = 84.5;

    const templeGroup = new THREE.Group();
    templeGroup.position.set(tx, ty, tz);

    const stoneTex = TextureGenerator.createRuinPillarTexture();
    const templeMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    // Raised Stone Platform
    const dais = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 24), templeMat);
    dais.position.y = 0.6;
    dais.receiveShadow = true;
    templeGroup.add(dais);

    // 8 Majestic Zonai Fluted Columns
    const colCoords = [
      [-6, 0.6, -9], [6, 0.6, -9],
      [-6, 0.6, -3], [6, 0.6, -3],
      [-6, 0.6, 3],  [6, 0.6, 3],
      [-6, 0.6, 9],  [6, 0.6, 9]
    ];

    colCoords.forEach(([cx, cy, cz], idx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 9.0, 10), templeMat);
      col.position.set(cx, cy + 4.5, cz);
      col.castShadow = true;
      templeGroup.add(col);

      collision.addCylinder(tx + cx, tz + cz, 0.85, ty, ty + 9.5, 'TempleCol_' + idx);
    });

    // Grand Entrance Pediment Arch (Zonai Architecture)
    const pediment = new THREE.Mesh(new THREE.ConeGeometry(9.5, 4.0, 4), templeMat);
    pediment.rotation.y = Math.PI / 4;
    pediment.position.set(0, 11.5, -9);
    templeGroup.add(pediment);

    // Golden Triforce Crest on Pediment
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.85), goldMat);
    crest.position.set(0, 11.2, -8.2);
    templeGroup.add(crest);

    // Sacred Temple Altar & Golden Bell
    const altar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 2.2), templeMat);
    altar.position.set(0, 1.9, 7.5);
    templeGroup.add(altar);

    const runeMat = new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x10b981, emissiveIntensity: 1.2 });
    const altarGlyph = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.85, 8), runeMat);
    altarGlyph.rotation.x = -Math.PI / 2;
    altarGlyph.position.set(0, 2.62, 7.5);
    templeGroup.add(altarGlyph);

    // Golden Bell suspended aloft
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.9, 1.6, 10), goldMat);
    bell.position.set(0, 8.5, 0);
    templeGroup.add(bell);

    const templeLight = new THREE.PointLight(0x38bdf8, 2.5, 24);
    templeLight.position.set(0, 5.0, 7.5);
    templeGroup.add(templeLight);

    templeGroup.userData = {
      isTempleOfTime: true,
      name: 'Temple of Time',
      position: new THREE.Vector3(tx, ty, tz)
    };

    this.scene.add(templeGroup);
    this.templeOfTime = templeGroup;
  }

  // 19. Bargainer Statue in The Depths
  spawnBargainerStatue() {
    const cx = this.depthsCampCenter.x - 65;
    const cz = this.depthsCampCenter.z + 45;
    const cy = -90;

    const statueGroup = new THREE.Group();
    statueGroup.position.set(cx, cy, cz);

    const obsidMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
    const poeEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Colossal 4-faced monolith base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 5.5, 14.0, 8), obsidMat);
    base.position.y = 7.0;
    base.castShadow = true;
    statueGroup.add(base);

    // 4 Glowing Poe Eyes on each cardinal face
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(ang => {
      [-0.6, 0.6].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.2), poeEyeMat);
        eye.position.set(
          Math.cos(ang) * 4.2 + Math.sin(ang) * ex,
          10.5,
          Math.sin(ang) * 4.2 - Math.cos(ang) * ex
        );
        statueGroup.add(eye);
      });
    });

    // Dark crimson eerie aura light
    const statueLight = new THREE.PointLight(0xdc2626, 4.0, 28);
    statueLight.position.set(0, 11.0, 0);
    statueGroup.add(statueLight);

    statueGroup.userData = {
      isBargainerStatue: true,
      name: 'Bargainer Statue',
      position: new THREE.Vector3(cx, cy, cz)
    };

    this.scene.add(statueGroup);
    this.bargainerStatue = statueGroup;

    collision.addCylinder(cx, cz, 5.2, cy, cy + 15, 'BargainerStatue');
  }
}

export const environment = new Environment();

