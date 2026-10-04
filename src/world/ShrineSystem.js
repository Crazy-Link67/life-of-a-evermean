import * as THREE from 'three';
import { audio } from '../core/AudioManager.js';
import { TextureGenerator } from '../core/TextureGenerator.js';
import { collision } from '../core/Collision.js';

export class ShrineSystem {
  constructor(scene, engine, terrain) {
    this.scene = scene;
    this.engine = engine;
    this.terrain = terrain;

    this.shrines = [];
    this.activeShrineModal = null;
    this.goddessStatue = null;
    this.activeDungeon = null;
    this.dungeonChambers = [];
    this.warpCooldown = 0;

    this.initShrines();
    this.initGoddessStatue();
    this.initDungeonChambers();
    this.createShrineUI();
  }

  initShrines() {
    const shrineDefs = [
      {
        id: 'roots_shrine',
        name: 'Shrine of the Living Roots',
        subtitle: 'Trial of Vitality & Growth',
        x: 45,
        z: -45,
        description: 'Descend into the ancient subterranean root sanctum. Solve the Zonai sphere pedestal puzzle to reach the Sage Altar.',
        dungeonId: 'roots_dungeon',
        completed: false,
        activated: false
      },
      {
        id: 'magnetic_shrine',
        name: 'Shrine of Magnetic Flow',
        subtitle: 'Trial of Ultrahand Resonance',
        x: -65,
        z: 45,
        description: 'Enter the magnetic abyss chamber. Use Ultrahand to bridge the gap with heavy metallic slabs and depress the pressure switch.',
        dungeonId: 'magnetic_dungeon',
        completed: false,
        activated: false
      },
      {
        id: 'temporal_shrine',
        name: 'Shrine of Temporal Reversal',
        subtitle: 'Trial of Time-Reversal Recall',
        x: 35,
        z: 110,
        description: 'Venture into the chamber of chronomancy. Use Recall on descending boulders and ride them backward up the ramp to the altar.',
        dungeonId: 'temporal_dungeon',
        completed: false,
        activated: false
      },
      {
        id: 'submerged_shrine',
        name: 'Shrine of Submerged Currents',
        subtitle: 'Trial of the Sunken Deep',
        x: -15,
        z: 75,
        description: 'Descend into the flooded aquatic grotto. Dive underwater to reach and trigger the submerged ancient crystal switch.',
        dungeonId: 'submerged_dungeon',
        completed: false,
        activated: false
      },
      {
        id: 'flame_shrine',
        name: 'Shrine of Malice & Flame',
        subtitle: 'Trial of Sacred Pyromancy',
        x: 180,
        z: -120,
        description: 'Enter the ruined sanctum. Ignite both ancient braziers using flame attacks or fused explosive bomb flowers to unlock the inner vault.',
        dungeonId: 'flame_dungeon',
        completed: false,
        activated: false
      }
    ];

    const stoneTex = TextureGenerator.createZonaiStoneTexture();
    const rockTex = TextureGenerator.createRockTexture(0x334155, true);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.88,
      metalness: 0.15
    });
    const archMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: 0.72,
      emissive: 0x064e3b,
      emissiveIntensity: 0.25
    });

    shrineDefs.forEach(def => {
      const y = this.terrain ? this.terrain.getHeight(def.x, def.z) : 0;
      const group = new THREE.Group();
      group.position.set(def.x, y, def.z);

      // 1. Base Stone Foundation (Zonai stepped pyramid / platform)
      const baseGeom = new THREE.CylinderGeometry(4.5, 5.8, 1.4, 8);
      const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
      baseMesh.position.y = 0.7;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Solid collision for shrine foundation
      collision.addCylinder(def.x, def.z, 4.6, y - 0.5, y + 1.8, 'ShrineBase_' + def.id);

      // 2. Zonai Shrine Shell Pillars / Arch
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.8, 1.0), archMat);
      leftPillar.position.set(-2.2, 3.0, 0);
      group.add(leftPillar);

      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 4.8, 1.0), archMat);
      rightPillar.position.set(2.2, 3.0, 0);
      group.add(rightPillar);

      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 1.4), archMat);
      crossBeam.position.set(0, 5.4, 0);
      group.add(crossBeam);

      // 3. Central Zonai Glyphs Pedestal
      const pedestalGeom = new THREE.CylinderGeometry(0.8, 1.0, 1.3, 6);
      const pedMat = new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        emissive: 0x0d9488,
        emissiveIntensity: 0.45
      });
      const pedestal = new THREE.Mesh(pedestalGeom, pedMat);
      pedestal.position.set(0, 1.8, 0);
      group.add(pedestal);

      // 4. Iconic Green Zonai Spiral Energy Vortex Rings floating overhead
      const spiralGroup = new THREE.Group();
      spiralGroup.position.set(0, 6.6, 0);

      const ringGeom = new THREE.TorusGeometry(1.8, 0.14, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.85
      });
      const ring1 = new THREE.Mesh(ringGeom, ringMat);
      ring1.rotation.x = Math.PI / 2.5;
      spiralGroup.add(ring1);

      const ringGeom2 = new THREE.TorusGeometry(1.2, 0.1, 8, 24);
      const ring2 = new THREE.Mesh(ringGeom2, ringMat.clone());
      ring2.rotation.x = -Math.PI / 3;
      ring2.rotation.y = 0.4;
      spiralGroup.add(ring2);

      const coreGeom = new THREE.OctahedronGeometry(0.5, 0);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0 });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      spiralGroup.add(coreMesh);

      group.add(spiralGroup);

      // 5. Point light for atmospheric radiance
      const light = new THREE.PointLight(0x10b981, 2.4, 24);
      light.position.set(0, 4.5, 0);
      group.add(light);

      def.meshGroup = group;
      def.spiralGroup = spiralGroup;
      def.pointLight = light;
      def.surfacePos = new THREE.Vector3(def.x, y + 1.2, def.z);

      this.scene.add(group);
      this.shrines.push(def);
    });
  }

  initGoddessStatue() {
    const gx = 0;
    const gz = 14;
    const gy = this.terrain ? this.terrain.getHeight(gx, gz) : 0;

    const group = new THREE.Group();
    group.position.set(gx, gy, gz);

    // Stone Plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
    );
    plinth.position.y = 0.4;
    group.add(plinth);

    // Goddess Robe Body
    const robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, emissive: 0x334155, emissiveIntensity: 0.2 })
    );
    robe.position.y = 1.9;
    group.add(robe);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 1.2), wingMat);
    wingL.position.set(-0.7, 2.4, -0.4);
    wingL.rotation.y = -0.4;
    group.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 1.2), wingMat);
    wingR.position.set(0.7, 2.4, -0.4);
    wingR.rotation.y = 0.4;
    group.add(wingR);

    // Halo
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    halo.position.set(0, 3.4, 0);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const light = new THREE.PointLight(0xfef08a, 1.8, 14);
    light.position.set(0, 2.8, 0);
    group.add(light);

    this.scene.add(group);
    this.goddessStatue = {
      position: new THREE.Vector3(gx, gy, gz),
      group
    };
  }

  // -------------------------------------------------------------
  // Full 3D Zonai Trial Dungeon Chambers
  // -------------------------------------------------------------
  initDungeonChambers() {
    const dungeonConfigs = [
      {
        id: 'roots_dungeon',
        shrineId: 'roots_shrine',
        name: 'Sanctum of the Living Roots',
        origin: new THREE.Vector3(150, -45, -150),
        size: { x: 26, y: 14, z: 46 },
        puzzleType: 'sphere_socket',
        reward: { light: 1, biomass: 100, wood: 40, item: 'Ancient Amber' }
      },
      {
        id: 'magnetic_dungeon',
        shrineId: 'magnetic_shrine',
        name: 'Sanctum of Magnetic Flow',
        origin: new THREE.Vector3(-150, -45, -150),
        size: { x: 26, y: 14, z: 52 },
        puzzleType: 'magnetic_bridge',
        reward: { light: 1, biomass: 120, stardust: 1, item: 'Zonai Energy Cell' }
      },
      {
        id: 'temporal_dungeon',
        shrineId: 'temporal_shrine',
        name: 'Sanctum of Temporal Reversal',
        origin: new THREE.Vector3(0, -45, -260),
        size: { x: 26, y: 16, z: 54 },
        puzzleType: 'recall_ramp',
        reward: { light: 1, biomass: 150, stardust: 2, item: 'Ancient Chrono Blade' }
      },
      {
        id: 'submerged_dungeon',
        shrineId: 'submerged_shrine',
        name: 'Sanctum of Submerged Currents',
        origin: new THREE.Vector3(-220, -45, 0),
        size: { x: 28, y: 16, z: 50 },
        puzzleType: 'submerged_currents',
        reward: { light: 1, biomass: 130, stardust: 1, item: 'Sacred Zora Pearl' }
      },
      {
        id: 'flame_dungeon',
        shrineId: 'flame_shrine',
        name: 'Sanctum of Malice & Flame',
        origin: new THREE.Vector3(220, -45, 0),
        size: { x: 28, y: 16, z: 52 },
        puzzleType: 'flame_braziers',
        reward: { light: 1, biomass: 180, stardust: 2, item: 'Forest King Ruby' }
      }
    ];

    dungeonConfigs.forEach(cfg => {
      const dungeon = this.buildDungeonChamber(cfg);
      this.dungeonChambers.push(dungeon);
    });
  }

  buildDungeonChamber(cfg) {
    const group = new THREE.Group();
    group.position.copy(cfg.origin);

    const stoneTex = TextureGenerator.createZonaiStoneTexture();
    const rockTex = TextureGenerator.createRockTexture(0x1e293b, true);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      roughness: 0.85,
      metalness: 0.2
    });
    const runeMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      emissive: 0x059669,
      emissiveIntensity: 0.85,
      roughness: 0.4
    });

    // 1. Floor
    const floorGeom = new THREE.BoxGeometry(cfg.size.x, 1.2, cfg.size.z);
    const floor = new THREE.Mesh(floorGeom, stoneMat);
    floor.position.set(0, -0.6, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // Glowing Zonai Energy Floor Inlays
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, cfg.size.z - 4), runeMat);
    inlay.position.set(0, 0.03, 0);
    group.add(inlay);

    // 2. Solid Chamber Walls with registered collision
    const halfX = cfg.size.x / 2;
    const halfZ = cfg.size.z / 2;
    const ox = cfg.origin.x;
    const oy = cfg.origin.y;
    const oz = cfg.origin.z;

    const wallL = new THREE.Mesh(new THREE.BoxGeometry(1.2, cfg.size.y, cfg.size.z), stoneMat);
    wallL.position.set(-halfX, cfg.size.y / 2, 0);
    group.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(1.2, cfg.size.y, cfg.size.z), stoneMat);
    wallR.position.set(halfX, cfg.size.y / 2, 0);
    group.add(wallR);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(cfg.size.x, cfg.size.y, 1.2), stoneMat);
    wallBack.position.set(0, cfg.size.y / 2, halfZ);
    group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.size.x, cfg.size.y, 1.2), stoneMat);
    wallFront.position.set(0, cfg.size.y / 2, -halfZ);
    group.add(wallFront);

    // Register all 4 outer walls in collision system
    collision.addBox(ox - halfX - 1.0, ox - halfX + 0.6, oz - halfZ, oz + halfZ, oy, oy + cfg.size.y, 'DungeonWall_L_' + cfg.id);
    collision.addBox(ox + halfX - 0.6, ox + halfX + 1.0, oz - halfZ, oz + halfZ, oy, oy + cfg.size.y, 'DungeonWall_R_' + cfg.id);
    collision.addBox(ox - halfX, ox + halfX, oz + halfZ - 0.6, oz + halfZ + 1.0, oy, oy + cfg.size.y, 'DungeonWall_Back_' + cfg.id);
    collision.addBox(ox - halfX, ox + halfX, oz - halfZ - 1.0, oz - halfZ + 0.6, oy, oy + cfg.size.y, 'DungeonWall_Front_' + cfg.id);

    // 3. Torches & Sconces
    [-1, 1].forEach(side => {
      [-12, 0, 12].forEach(zPos => {
        const torchLight = new THREE.PointLight(0x10b981, 2.4, 20);
        torchLight.position.set(side * (halfX - 1.4), 3.5, zPos);
        group.add(torchLight);

        const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), runeMat);
        sconce.position.set(side * (halfX - 0.6), 3.2, zPos);
        group.add(sconce);
      });
    });

    // 4. Entrance & Exit Warp Pad (Green glowing Zonai rings at -Z end)
    const entrancePad = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.35, 16), runeMat);
    entrancePad.position.set(0, 0.18, -halfZ + 5);
    group.add(entrancePad);

    const exitRings = new THREE.Mesh(new THREE.RingGeometry(0.8, 2.2, 16), new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide }));
    exitRings.rotation.x = -Math.PI / 2;
    exitRings.position.set(0, 0.36, -halfZ + 5);
    group.add(exitRings);

    // 5. Sage Altar Platform & Opening Treasure Chest (+Z end)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0.2, halfZ - 6);

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.2, 1.0, 8), stoneMat);
    dais.position.y = 0.5;
    altarGroup.add(dais);

    const shrineCore = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 1.6), runeMat);
    shrineCore.position.y = 2.4;
    altarGroup.add(shrineCore);

    // Sage blessing aura rings
    const auraRings = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 6, 24), new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    auraRings.rotation.x = Math.PI / 2;
    auraRings.position.y = 2.4;
    altarGroup.add(auraRings);

    const altarLight = new THREE.PointLight(0x34d399, 3.0, 18);
    altarLight.position.y = 3.0;
    altarGroup.add(altarLight);

    // Interactive Sage Treasure Chest in front of altar
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 1.05, -2.4);

    const chestBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.7, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.85, roughness: 0.25 })
    );
    chestBase.position.y = 0.35;
    chestGroup.add(chestBase);

    const chestLidPivot = new THREE.Group();
    chestLidPivot.position.set(0, 0.7, -0.5);
    const chestLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 })
    );
    chestLid.rotation.z = Math.PI / 2;
    chestLid.position.set(0, 0, 0.5);
    chestLidPivot.add(chestLid);
    chestGroup.add(chestLidPivot);

    altarGroup.add(chestGroup);
    group.add(altarGroup);

    // 6. Interactive Dungeon Puzzle Mechanisms
    let puzzleProps = [];
    cfg.chestLidPivot = chestLidPivot;
    cfg.chestGroup = chestGroup;
    cfg.isChestOpened = false;

    if (cfg.puzzleType === 'sphere_socket') {
      // Trial 1: Zonai Sphere & Socket Puzzle
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x0f766e, roughness: 0.3 })
      );
      sphere.position.set(5, 1.2, -4);
      sphere.userData = {
        isFusable: true,
        fuseType: 'boulder',
        name: 'Zonai Puzzle Sphere'
      };
      group.add(sphere);
      puzzleProps.push(sphere);

      const socket = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.25, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, roughness: 0.5 })
      );
      socket.rotation.x = Math.PI / 2;
      socket.position.set(0, 0.15, 6);
      group.add(socket);

      // Gate blocking the altar room
      const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.4), stoneMat);
      gate.position.set(0, 3, 10);
      group.add(gate);

      cfg.sphere = sphere;
      cfg.socket = socket;
      cfg.gate = gate;
      cfg.solved = false;
    } else if (cfg.puzzleType === 'magnetic_bridge') {
      // Trial 2: Magnetic Void Chasm & Pressure Plate
      const chasmVoid = new THREE.Mesh(new THREE.BoxGeometry(cfg.size.x - 2, 0.1, 14), new THREE.MeshBasicMaterial({ color: 0x020617 }));
      chasmVoid.position.set(0, 0.05, 0);
      group.add(chasmVoid);

      // Movable Magnetic Slabs
      for (let s = 0; s < 2; s++) {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(4.8, 0.4, 8.5),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 })
        );
        slab.position.set(-6 + s * 12, 0.4, -6);
        slab.userData = {
          isFusable: true,
          fuseType: 'log',
          name: 'Magnetic Zonai Bridge Slab'
        };
        group.add(slab);
        puzzleProps.push(slab);
      }

      // Pressure Plate on far side of chasm
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.8, 0.2, 12),
        new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x10b981, roughness: 0.4 })
      );
      plate.position.set(0, 0.1, 10);
      group.add(plate);

      const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.4), stoneMat);
      gate.position.set(0, 3, 13);
      group.add(gate);

      cfg.plate = plate;
      cfg.gate = gate;
      cfg.solved = false;
    } else if (cfg.puzzleType === 'recall_ramp') {
      // Trial 3: Chronomancy Ramp & Rolling Boulder
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 24), stoneMat);
      ramp.rotation.x = 0.25;
      ramp.position.set(0, 3.2, 0);
      group.add(ramp);

      const rollingBoulder = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.6, 1),
        new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.7 })
      );
      rollingBoulder.position.set(0, 6.5, 10);
      rollingBoulder.userData = {
        isFusable: true,
        fuseType: 'boulder',
        name: 'Ancient Rolling Boulder',
        history: [],
        rampTimer: 0
      };
      group.add(rollingBoulder);
      puzzleProps.push(rollingBoulder);
      cfg.rollingBoulder = rollingBoulder;
      cfg.solved = true;
    } else if (cfg.puzzleType === 'submerged_currents') {
      // Trial 4: Flooded Water Chamber with Submerged Crystal Switch
      const waterVolume = new THREE.Mesh(
        new THREE.BoxGeometry(cfg.size.x - 2, 5.0, 20),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          transparent: true,
          opacity: 0.75,
          roughness: 0.05
        })
      );
      waterVolume.position.set(0, 2.5, 0);
      group.add(waterVolume);

      // Submerged crystal switch
      const switchCrystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.0),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.9 })
      );
      switchCrystal.position.set(0, 1.2, 0);
      group.add(switchCrystal);

      const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.4), stoneMat);
      gate.position.set(0, 3, 11);
      group.add(gate);

      cfg.switchCrystal = switchCrystal;
      cfg.gate = gate;
      cfg.solved = false;
    } else if (cfg.puzzleType === 'flame_braziers') {
      // Trial 5: Dual Braziers to ignite
      const brazierMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
      cfg.braziers = [];

      [-4, 4].forEach((bx, idx) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.6, 8), brazierMat);
        b.position.set(bx, 0.8, 8);
        group.add(b);

        const flameLight = new THREE.PointLight(0xff4500, 0, 15);
        flameLight.position.set(bx, 2.0, 8);
        group.add(flameLight);

        cfg.braziers.push({ mesh: b, light: flameLight, lit: false, pos: new THREE.Vector3(bx, 1.6, 8) });
      });

      const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.4), stoneMat);
      gate.position.set(0, 3, 11);
      group.add(gate);

      cfg.gate = gate;
      cfg.solved = false;
    }

    this.scene.add(group);

    return {
      cfg,
      group,
      entranceWorldPos: cfg.origin.clone().add(new THREE.Vector3(0, 1.2, -halfZ + 5)),
      altarWorldPos: cfg.origin.clone().add(new THREE.Vector3(0, 1.8, halfZ - 6)),
      chestWorldPos: cfg.origin.clone().add(new THREE.Vector3(0, 1.2, halfZ - 8.4)),
      altarGroup,
      puzzleProps
    };
  }

  // Check if player is inside any 3D dungeon chamber for collision & floor height
  getDungeonFloor(px, py, pz) {
    for (const d of this.dungeonChambers) {
      const orig = d.cfg.origin;
      const sz = d.cfg.size;
      const minX = orig.x - sz.x / 2;
      const maxX = orig.x + sz.x / 2;
      const minZ = orig.z - sz.z / 2;
      const maxZ = orig.z + sz.z / 2;
      const minY = orig.y - 4.0;
      const maxY = orig.y + sz.y + 4.0;

      if (px >= minX && px <= maxX && pz >= minZ && pz <= maxZ && py >= minY && py <= maxY) {
        // Player is inside this dungeon chamber
        let floorY = orig.y;

        // Check ramp collision if inside temporal dungeon
        if (d.cfg.puzzleType === 'recall_ramp') {
          if (Math.abs(px - orig.x) <= 4.2 && pz >= orig.z - 12 && pz <= orig.z + 12) {
            const t = (pz - (orig.z - 12)) / 24;
            floorY = orig.y + t * 6.0;
          }
        }

        return floorY;
      }
    }
    return null;
  }

  createShrineUI() {
    if (document.getElementById('shrine-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'shrine-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.display = 'none';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.backgroundColor = 'rgba(2, 6, 23, 0.85)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.zIndex = '9999';
    modal.style.fontFamily = `'Cinzel', 'Noto Serif', serif, system-ui`;

    modal.innerHTML = `
      <div style="background: linear-gradient(145deg, #091e1d 0%, #061517 100%); border: 2px solid #10b981; border-radius: 18px; padding: 32px; max-width: 580px; width: 90%; color: #e6fffa; box-shadow: 0 0 50px rgba(16, 185, 129, 0.45); text-align: center; position: relative;">
        <div id="shrine-vortex-icon" style="font-size: 52px; margin-bottom: 12px; filter: drop-shadow(0 0 16px #34d399);">🌀</div>
        <h2 id="shrine-title" style="margin: 0 0 6px 0; font-size: 26px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2px;">Ancient Zonai Shrine</h2>
        <h4 id="shrine-subtitle" style="margin: 0 0 18px 0; font-size: 15px; color: #6ee7b7; font-weight: 400; font-style: italic;">Trial of Vitality & Wisdom</h4>
        
        <div id="shrine-body" style="background: rgba(4, 47, 46, 0.5); border: 1px solid #14b8a6; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 15px; line-height: 1.6; color: #ccfbf1; text-align: left;">
          Trial description goes here...
        </div>

        <div style="display: flex; gap: 14px; justify-content: center;">
          <button id="shrine-action-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-family: inherit; font-size: 16px; font-weight: 700; padding: 12px 28px; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            Enter 3D Dungeon Chamber
          </button>
          <button id="shrine-close-btn" style="background: rgba(30, 41, 59, 0.8); color: #94a3b8; font-family: inherit; font-size: 15px; padding: 12px 24px; border: 1px solid #475569; border-radius: 10px; cursor: pointer; transition: all 0.2s;">
            Depart
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('shrine-close-btn').addEventListener('click', () => {
      this.closeShrineModal();
    });
  }

  update(delta, player) {
    if (!player) return;

    this.warpCooldown = Math.max(0, this.warpCooldown - delta);

    // 1. Swirl surface Zonai rings overhead & walk-in detection
    this.shrines.forEach(shrine => {
      if (shrine.spiralGroup) {
        shrine.spiralGroup.rotation.y += delta * 1.2;
        shrine.spiralGroup.children[0].rotation.z += delta * 0.8;
      }

      // Walk-In Shrine Access: walk right into the green archway to enter!
      const dist = shrine.meshGroup.position.distanceTo(player.position);
      if (dist < 2.5 && !this.activeDungeon && this.warpCooldown <= 0) {
        this.enterDungeonChamber(shrine, player);
        return;
      } else if (dist < 4.8 && !this.activeShrineModal && !this.activeDungeon) {
        if (window.setInteractPrompt) {
          const status = shrine.completed ? 'Walk In / [E] to Enter' : 'Walk In / [E] to Enter 3D Trial:';
          window.setInteractPrompt(`${status} ${shrine.name}`);
        }
      }
    });

    // 2. Goddess statue proximity
    if (this.goddessStatue && !this.activeDungeon) {
      const gDist = this.goddessStatue.position.distanceTo(player.position);
      if (gDist < 3.8 && !this.activeShrineModal) {
        if (window.setInteractPrompt) {
          window.setInteractPrompt(`[E] Pray to Goddess Statue (Blessings: ${player.inventory.lightsOfBlessing || 0})`);
        }
      }
    }

    // 3. Inside 3D Dungeon Chamber logic & Altar
    if (this.activeDungeon) {
      const d = this.activeDungeon;

      // Check Altar proximity
      const altarDist = player.position.distanceTo(d.altarWorldPos);
      if (altarDist < 3.8) {
        if (window.setInteractPrompt) {
          window.setInteractPrompt(`[E] Claim Sage Blessing & Complete Dungeon!`);
        }
      }

      // Check Exit Warp Pad: step directly on green pad to ascend to surface!
      const exitDist = player.position.distanceTo(d.entranceWorldPos);
      if (exitDist < 1.8 && this.warpCooldown <= 0) {
        this.exitDungeon(player);
        return;
      } else if (exitDist < 3.2) {
        if (window.setInteractPrompt) {
          window.setInteractPrompt(`Step on Pad or [E] to Ascend to Surface of Hyrule`);
        }
      }

      // Dynamic Dungeon Puzzles
      if (d.cfg.puzzleType === 'sphere_socket' && !d.cfg.solved) {
        const sphere = d.cfg.sphere;
        const socketPos = d.cfg.origin.clone().add(new THREE.Vector3(0, 0, 6));
        const distToSocket = sphere.position.distanceTo(new THREE.Vector3(0, 0, 6));

        if (distToSocket < 1.8) {
          d.cfg.solved = true;
          sphere.position.set(0, 0.8, 6);
          audio.playShrineChime?.();
          audio.playCosmicSlam?.();
          this.engine.spawnCosmicBurst(socketPos, 45);
          if (window.showGameNotification) {
            window.showGameNotification('✨ Puzzle Solved: Ancient Sanctum Gate Unlocked!');
          }
          d.cfg.gate.position.y = -2.5;
        }
      } else if (d.cfg.puzzleType === 'magnetic_bridge' && !d.cfg.solved) {
        // Step on pressure plate on far side of chasm
        const platePos = d.cfg.origin.clone().add(new THREE.Vector3(0, 0.1, 10));
        const distToPlate = player.position.distanceTo(platePos);
        if (distToPlate < 2.2) {
          d.cfg.solved = true;
          d.cfg.plate.position.y = -0.05;
          audio.playShrineChime?.();
          audio.playCosmicSlam?.();
          this.engine.spawnCosmicBurst(platePos, 45);
          if (window.showGameNotification) {
            window.showGameNotification('⚡ Resonance Triggered: Sanctuary Portcullis Raised!');
          }
          d.cfg.gate.position.y = -2.5;
        }
      } else if (d.cfg.puzzleType === 'recall_ramp') {
        const b = d.cfg.rollingBoulder;
        if (!b.userData.isRecalling) {
          b.userData.rampTimer += delta * 1.8;
          const rampT = (Math.sin(b.userData.rampTimer) + 1) * 0.5;
          b.position.z = 10 - rampT * 22;
          b.position.y = 6.5 - rampT * 5.5;
          b.rotation.x += delta * 4;
        }
      } else if (d.cfg.puzzleType === 'submerged_currents') {
        const switchPos = d.cfg.origin.clone().add(new THREE.Vector3(0, 1.2, 0));
        const distToSwitch = player.position.distanceTo(switchPos);
        if (distToSwitch < 3.2 && !d.cfg.solved) {
          if (window.setInteractPrompt) {
            window.setInteractPrompt('[E] Activate Submerged Zonai Switch');
          }
        }
      } else if (d.cfg.puzzleType === 'flame_braziers' && !d.cfg.solved) {
        const allLit = d.cfg.braziers.every(b => b.lit);
        if (allLit) {
          d.cfg.solved = true;
          audio.playShrineChime?.();
          audio.playCosmicSlam?.();
          this.engine.spawnCosmicBurst(d.cfg.origin.clone().add(new THREE.Vector3(0, 3, 11)), 50);
          if (window.showGameNotification) {
            window.showGameNotification('🔥 Dual Braziers Kindled: Sacred Vault Unsealed!');
          }
          d.cfg.gate.position.y = -2.5;
        }
      }

      // Check Treasure Chest Proximity
      if (d.chestWorldPos) {
        const chestDist = player.position.distanceTo(d.chestWorldPos);
        if (chestDist < 3.0 && !d.cfg.isChestOpened) {
          if (window.setInteractPrompt) {
            window.setInteractPrompt(`[E] Open Sage Treasure Chest (${d.cfg.reward?.item || 'Relic'})`);
          }
        }
      }
    }
  }

  interact(player) {
    if (!player) return false;

    // 1. Inside 3D Dungeon: Interact with Chest, Puzzles, Altar or Exit
    if (this.activeDungeon) {
      const d = this.activeDungeon;

      // Check Chest
      if (d.chestWorldPos) {
        const chestDist = player.position.distanceTo(d.chestWorldPos);
        if (chestDist < 3.2 && !d.cfg.isChestOpened) {
          this.openDungeonChest(d, player);
          return true;
        }
      }

      // Check Submerged Switch
      if (d.cfg.puzzleType === 'submerged_currents' && !d.cfg.solved) {
        const switchPos = d.cfg.origin.clone().add(new THREE.Vector3(0, 1.2, 0));
        if (player.position.distanceTo(switchPos) < 3.4) {
          d.cfg.solved = true;
          d.cfg.switchCrystal.material.emissiveIntensity = 2.0;
          d.cfg.gate.position.y = -2.5;
          audio.playShrineChime?.();
          audio.playCosmicSlam?.();
          this.engine.spawnCosmicBurst(switchPos, 45);
          if (window.showGameNotification) {
            window.showGameNotification('🌊 Water Grotto Switch Activated: Underwater Sanctuary Opened!');
          }
          return true;
        }
      }

      // Check Flame Braziers
      if (d.cfg.puzzleType === 'flame_braziers' && !d.cfg.solved) {
        for (const b of d.cfg.braziers) {
          const worldBPos = d.cfg.origin.clone().add(b.pos);
          if (player.position.distanceTo(worldBPos) < 3.5 && !b.lit) {
            b.lit = true;
            b.light.intensity = 3.5;
            audio.playCosmicSlam?.();
            this.engine.spawnParticles(worldBPos, 35, 0xff4500, 6, 0.25);
            if (window.showGameNotification) {
              window.showGameNotification('🔥 Ancient Brazier Ignited!');
            }
            return true;
          }
        }
      }

      // Check Altar
      const altarDist = player.position.distanceTo(d.altarWorldPos);
      if (altarDist < 4.0) {
        this.claimDungeonAltarBlessing(d, player);
        return true;
      }

      // Check Exit
      const exitDist = player.position.distanceTo(d.entranceWorldPos);
      if (exitDist < 3.5) {
        this.exitDungeon(player);
        return true;
      }
      return false;
    }

    // 2. Surface: Goddess Statue
    if (this.goddessStatue) {
      const gDist = this.goddessStatue.position.distanceTo(player.position);
      if (gDist < 4.0) {
        this.openGoddessModal(player);
        return true;
      }
    }

    // 3. Surface: Enter 3D Shrine Dungeon
    for (const shrine of this.shrines) {
      const dist = shrine.meshGroup.position.distanceTo(player.position);
      if (dist < 4.5) {
        this.enterDungeonChamber(shrine, player);
        return true;
      }
    }

    return false;
  }

  openDungeonChest(dungeon, player) {
    const cfg = dungeon.cfg;
    if (cfg.isChestOpened) return;

    cfg.isChestOpened = true;
    if (cfg.chestLidPivot) {
      cfg.chestLidPivot.rotation.x = -Math.PI * 0.55;
    }

    audio.playCosmicSlam?.();
    audio.playShrineChime?.();
    this.engine.spawnCosmicBurst(dungeon.chestWorldPos, 60);
    this.engine.applyScreenShake(0.4);

    const r = cfg.reward || {};
    player.inventory.lightsOfBlessing = (player.inventory.lightsOfBlessing || 0) + (r.light || 1);
    player.soilBiomass += (r.biomass || 100);
    if (r.wood) player.inventory.wood = (player.inventory.wood || 0) + r.wood;
    if (r.stardust) player.inventory.stardust = (player.inventory.stardust || 0) + r.stardust;

    if (window.showGameNotification) {
      window.showGameNotification(`🎁 TREASURE CLAIMED: ${r.item || 'Relic'}! Received +1 Light of Blessing & +${r.biomass} Biomass!`);
    }
  }

  enterDungeonChamber(shrine, player) {
    const dungeon = this.dungeonChambers.find(d => d.cfg.shrineId === shrine.id);
    if (!dungeon) return;

    this.activeDungeon = dungeon;
    this.warpCooldown = 2.0;
    audio.playShrineChime?.();
    audio.playZonaiBoost?.();

    // Teleport player into the 3D dungeon chamber entrance, stepping forward into room
    player.position.copy(dungeon.entranceWorldPos).add(new THREE.Vector3(0, 0.4, 3.2));
    player.velocity.set(0, 0, 0);
    player.isGrounded = true;

    this.engine.spawnCosmicBurst(player.position, 45);

    if (window.showGameNotification) {
      window.showGameNotification(`🌀 Stepped into 3D Zonai Trial: ${dungeon.cfg.name}!`);
    }
  }

  exitDungeon(player) {
    if (!this.activeDungeon) return;

    const shrine = this.shrines.find(s => s.id === this.activeDungeon.cfg.shrineId);
    this.activeDungeon = null;
    this.warpCooldown = 2.0;

    audio.playShrineChime?.();
    if (shrine) {
      // Safely place player on surface in front of the entrance arch
      player.position.copy(shrine.surfacePos).add(new THREE.Vector3(0, 0.4, 4.2));
    }
    player.velocity.set(0, 0, 0);
    player.isGrounded = true;

    this.engine.spawnCosmicBurst(player.position, 40);
    if (window.showGameNotification) {
      window.showGameNotification('🌿 Returned to the surface of Hyrule.');
    }
  }

  claimDungeonAltarBlessing(dungeon, player) {
    const shrine = this.shrines.find(s => s.id === dungeon.cfg.shrineId);
    if (shrine && !shrine.completed) {
      shrine.completed = true;
      shrine.activated = true;
      shrine.pointLight.color.setHex(0xfacc15); // Golden glow
      shrine.spiralGroup.children.forEach(c => {
        if (c.material) c.material.color.setHex(0xfde047);
      });

      player.inventory.lightsOfBlessing = (player.inventory.lightsOfBlessing || 0) + 1;
      player.barkHp = player.maxBarkHp;
      player.photosynthesis = player.maxPhotosynthesis;

      audio.playCosmicSlam?.();
      audio.playShrineChime?.();
      this.engine.spawnCosmicBurst(player.position, 70);
      this.engine.applyScreenShake(0.7);

      if (window.showGameNotification) {
        window.showGameNotification(`✨ TRIUMPH! Conquered ${dungeon.cfg.name}! Received +1 Light of Blessing 🔮 (Total: ${player.inventory.lightsOfBlessing})`);
      }
    } else {
      audio.playShrineChime?.();
      player.barkHp = player.maxBarkHp;
      player.photosynthesis = player.maxPhotosynthesis;
      if (window.showGameNotification) {
        window.showGameNotification('🌿 Full Restoration: Health & Photosynthesis Maximized!');
      }
    }

    // Auto-warp to surface after ceremony
    setTimeout(() => {
      this.exitDungeon(player);
    }, 1800);
  }

  openGoddessModal(player) {
    const modal = document.getElementById('shrine-modal');
    if (!modal) return;

    this.activeShrineModal = { isGoddess: true };
    modal.style.display = 'flex';

    document.getElementById('shrine-vortex-icon').textContent = '🕊️';
    document.getElementById('shrine-title').textContent = 'Goddess Hylia Statue';
    document.getElementById('shrine-subtitle').textContent = 'Sacred Altar of Blessings';

    const blessings = player.inventory.lightsOfBlessing || 0;
    const body = document.getElementById('shrine-body');

    body.innerHTML = `
      <p style="margin: 0 0 12px 0;"><i>"Noble Evermean protector of the woods... You who have conquered the Zonai shrines and obtained the sacred Lights of Blessing."</i></p>
      <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #facc15;">
        You currently possess: <b style="color: #fde047; font-size: 18px;">${blessings}</b> Light${blessings === 1 ? '' : 's'} of Blessing.
      </div>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">Offer 1 Light of Blessing to receive either a Heart Vessel (+30 Max Bark HP) or a Stamina Vessel (+25 Max Stamina).</p>
    `;

    const actionBtn = document.getElementById('shrine-action-btn');
    if (blessings >= 1) {
      actionBtn.textContent = 'Exchange: +30 Max Bark HP';
      actionBtn.style.display = 'inline-block';
      actionBtn.onclick = () => {
        player.inventory.lightsOfBlessing--;
        player.maxBarkHp += 30;
        player.barkHp = player.maxBarkHp;
        audio.playCosmicSlam?.();
        this.engine.spawnCosmicBurst(player.position, 40);
        if (window.showGameNotification) {
          window.showGameNotification('💖 Max Bark HP increased by +30!');
        }
        this.closeShrineModal();
      };

      const departBtn = document.getElementById('shrine-close-btn');
      departBtn.textContent = 'Exchange: +25 Max Stamina';
      departBtn.style.color = '#34d399';
      departBtn.onclick = () => {
        player.inventory.lightsOfBlessing--;
        player.maxStamina += 25;
        player.stamina = player.maxStamina;
        audio.playCosmicSlam?.();
        this.engine.spawnCosmicBurst(player.position, 40);
        if (window.showGameNotification) {
          window.showGameNotification('⚡ Max Stamina increased by +25!');
        }
        this.closeShrineModal();
      };
    } else {
      actionBtn.textContent = 'Seek More Shrines';
      actionBtn.onclick = () => this.closeShrineModal();
      const departBtn = document.getElementById('shrine-close-btn');
      departBtn.textContent = 'Depart';
      departBtn.style.color = '#94a3b8';
      departBtn.onclick = () => this.closeShrineModal();
    }
  }

  closeShrineModal() {
    const modal = document.getElementById('shrine-modal');
    if (modal) modal.style.display = 'none';
    this.activeShrineModal = null;
    const departBtn = document.getElementById('shrine-close-btn');
    if (departBtn) {
      departBtn.textContent = 'Depart';
      departBtn.style.color = '#94a3b8';
      departBtn.onclick = () => this.closeShrineModal();
    }
    const icon = document.getElementById('shrine-vortex-icon');
    if (icon) icon.textContent = '🌀';
  }
}
