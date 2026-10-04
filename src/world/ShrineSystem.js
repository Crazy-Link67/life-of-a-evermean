import * as THREE from 'three';
import { audio } from '../core/AudioManager.js';

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
        x: 42,
        z: -38,
        description: 'Descend into the ancient subterranean root sanctum. Solve the Zonai sphere pedestal puzzle to reach the Sage Altar.',
        dungeonId: 'roots_dungeon',
        completed: false,
        activated: false
      },
      {
        id: 'magnetic_shrine',
        name: 'Shrine of Magnetic Flow',
        subtitle: 'Trial of Ultrahand Resonance',
        x: -48,
        z: 32,
        description: 'Enter the magnetic abyss chamber. Use Ultrahand to bridge the gap with heavy metallic slabs.',
        dungeonId: 'magnetic_dungeon',
        completed: false,
        activated: false
      },
      {
        id: 'temporal_shrine',
        name: 'Shrine of Temporal Reversal',
        subtitle: 'Trial of Time-Reversal Recall',
        x: 15,
        z: 75,
        description: 'Venture into the chamber of chronomancy. Use Recall on descending boulders and ride them backward up the ramp to the altar.',
        dungeonId: 'temporal_dungeon',
        completed: false,
        activated: false
      }
    ];

    shrineDefs.forEach(def => {
      const y = this.terrain ? this.terrain.getHeight(def.x, def.z) : 0;
      const group = new THREE.Group();
      group.position.set(def.x, y, def.z);

      // 1. Base Stone Foundation (Zonai stepped pyramid / platform)
      const baseGeom = new THREE.CylinderGeometry(4.5, 5.8, 1.4, 8);
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
        metalness: 0.15
      });
      const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
      baseMesh.position.y = 0.7;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // 2. Zonai Shrine Shell Pillars / Arch
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.7,
        emissive: 0x064e3b,
        emissiveIntensity: 0.2
      });

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
      const light = new THREE.PointLight(0x10b981, 2.0, 20);
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
        puzzleType: 'sphere_socket'
      },
      {
        id: 'magnetic_dungeon',
        shrineId: 'magnetic_shrine',
        name: 'Sanctum of Magnetic Flow',
        origin: new THREE.Vector3(-150, -45, -150),
        size: { x: 26, y: 14, z: 52 },
        puzzleType: 'magnetic_bridge'
      },
      {
        id: 'temporal_dungeon',
        shrineId: 'temporal_shrine',
        name: 'Sanctum of Temporal Reversal',
        origin: new THREE.Vector3(0, -45, -260),
        size: { x: 26, y: 16, z: 54 },
        puzzleType: 'recall_ramp'
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

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      roughness: 0.4
    });

    // 1. Floor
    const floorGeom = new THREE.BoxGeometry(cfg.size.x, 1.2, cfg.size.z);
    const floor = new THREE.Mesh(floorGeom, stoneMat);
    floor.position.set(0, -0.6, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // Glowing Zonai Energy Floor Inlays
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, cfg.size.z - 4), runeMat);
    inlay.position.set(0, 0.03, 0);
    group.add(inlay);

    // 2. Walls (Left, Right, Back, Front)
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(1.0, cfg.size.y, cfg.size.z), stoneMat);
    wallL.position.set(-cfg.size.x / 2, cfg.size.y / 2, 0);
    group.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(1.0, cfg.size.y, cfg.size.z), stoneMat);
    wallR.position.set(cfg.size.x / 2, cfg.size.y / 2, 0);
    group.add(wallR);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(cfg.size.x, cfg.size.y, 1.0), stoneMat);
    wallBack.position.set(0, cfg.size.y / 2, cfg.size.z / 2);
    group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(cfg.size.x, cfg.size.y, 1.0), stoneMat);
    wallFront.position.set(0, cfg.size.y / 2, -cfg.size.z / 2);
    group.add(wallFront);

    // 3. Torches & Atmosphere
    [-1, 1].forEach(side => {
      [-12, 0, 12].forEach(zPos => {
        const torchLight = new THREE.PointLight(0x10b981, 2.2, 18);
        torchLight.position.set(side * (cfg.size.x / 2 - 1.2), 3.5, zPos);
        group.add(torchLight);

        const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), runeMat);
        sconce.position.set(side * (cfg.size.x / 2 - 0.6), 3.2, zPos);
        group.add(sconce);
      });
    });

    // 4. Entrance Elevator Warp Platform (At -Z end of chamber)
    const entrancePad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 12), runeMat);
    entrancePad.position.set(0, 0.15, -cfg.size.z / 2 + 5);
    group.add(entrancePad);

    // 5. Sage Altar Sarcophagus (At +Z end of chamber)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0.2, cfg.size.z / 2 - 6);

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.0, 1.0, 8), stoneMat);
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

    const altarLight = new THREE.PointLight(0x34d399, 2.8, 16);
    altarLight.position.y = 3.0;
    altarGroup.add(altarLight);

    group.add(altarGroup);

    // 6. Interactive Dungeon Puzzle Mechanisms
    let puzzleProps = [];

    if (cfg.puzzleType === 'sphere_socket') {
      // Puzzle: Ancient Zonai Root Sphere & Socket
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x14b8a6, emissive: 0x0f766e, roughness: 0.3 })
      );
      sphere.position.set(4, 1.2, -4);
      sphere.userData = {
        isFusable: true,
        fuseType: 'boulder',
        name: 'Zonai Puzzle Sphere'
      };
      group.add(sphere);
      puzzleProps.push(sphere);

      // Target socket
      const socket = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.25, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309, roughness: 0.5 })
      );
      socket.rotation.x = Math.PI / 2;
      socket.position.set(0, 0.15, 6);
      group.add(socket);

      // Gate blocking the altar
      const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.4), stoneMat);
      gate.position.set(0, 3, 10);
      group.add(gate);

      cfg.sphere = sphere;
      cfg.socket = socket;
      cfg.gate = gate;
      cfg.solved = false;
    } else if (cfg.puzzleType === 'magnetic_bridge') {
      // Void chasm in middle
      const chasmVoid = new THREE.Mesh(new THREE.BoxGeometry(cfg.size.x - 2, 0.1, 14), new THREE.MeshBasicMaterial({ color: 0x020617 }));
      chasmVoid.position.set(0, 0.05, 0);
      group.add(chasmVoid);

      // Movable Magnetic Slabs
      for (let s = 0; s < 2; s++) {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(4.5, 0.4, 8.5),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 })
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
    } else if (cfg.puzzleType === 'recall_ramp') {
      // Steep ramp
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 24), stoneMat);
      ramp.rotation.x = 0.25;
      ramp.position.set(0, 3.2, 0);
      group.add(ramp);

      // Rolling boulder with rolling trajectory
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
    }

    this.scene.add(group);

    return {
      cfg,
      group,
      entranceWorldPos: cfg.origin.clone().add(new THREE.Vector3(0, 1.2, -cfg.size.z / 2 + 5)),
      altarWorldPos: cfg.origin.clone().add(new THREE.Vector3(0, 1.8, cfg.size.z / 2 - 6)),
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

    // 1. Swirl surface Zonai rings overhead
    this.shrines.forEach(shrine => {
      if (shrine.spiralGroup) {
        shrine.spiralGroup.rotation.y += delta * 1.2;
        shrine.spiralGroup.children[0].rotation.z += delta * 0.8;
      }

      // Proximity prompt on surface
      const dist = shrine.meshGroup.position.distanceTo(player.position);
      if (dist < 4.2 && !this.activeShrineModal && !this.activeDungeon) {
        if (window.setInteractPrompt) {
          const status = shrine.completed ? 'Enter Conquered' : 'Enter 3D Trial Chamber of';
          window.setInteractPrompt(`[E] ${status} ${shrine.name}`);
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

      // Check Exit Warp proximity
      const exitDist = player.position.distanceTo(d.entranceWorldPos);
      if (exitDist < 3.2) {
        if (window.setInteractPrompt) {
          window.setInteractPrompt(`[E] Ascend Back to Surface of Hyrule`);
        }
      }

      // Dynamic Dungeon Puzzles
      if (d.cfg.puzzleType === 'sphere_socket' && !d.cfg.solved) {
        const sphere = d.cfg.sphere;
        const socketPos = d.cfg.origin.clone().add(new THREE.Vector3(0, 0, 6));
        const distToSocket = sphere.position.distanceTo(new THREE.Vector3(0, 0, 6));

        if (distToSocket < 1.6) {
          d.cfg.solved = true;
          sphere.position.set(0, 0.8, 6);
          audio.playShrineChime?.();
          audio.playCosmicSlam?.();
          this.engine.spawnCosmicBurst(socketPos, 45);
          if (window.showGameNotification) {
            window.showGameNotification('✨ Puzzle Solved: Ancient Sanctum Gate Unlocked!');
          }
          // Lower gate
          d.cfg.gate.position.y = -2.0;
        }
      } else if (d.cfg.puzzleType === 'recall_ramp') {
        const b = d.cfg.rollingBoulder;
        if (!b.userData.isRecalling) {
          b.userData.rampTimer += delta * 1.8;
          // Rolling boulder motion down the ramp
          const rampT = (Math.sin(b.userData.rampTimer) + 1) * 0.5;
          b.position.z = 10 - rampT * 22;
          b.position.y = 6.5 - rampT * 5.5;
          b.rotation.x += delta * 4;
        }
      }
    }
  }

  interact(player) {
    if (!player) return false;

    // 1. Inside 3D Dungeon: Interact with Altar or Exit
    if (this.activeDungeon) {
      const d = this.activeDungeon;
      const altarDist = player.position.distanceTo(d.altarWorldPos);
      if (altarDist < 4.0) {
        this.claimDungeonAltarBlessing(d, player);
        return true;
      }

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

  enterDungeonChamber(shrine, player) {
    const dungeon = this.dungeonChambers.find(d => d.cfg.shrineId === shrine.id);
    if (!dungeon) return;

    this.activeDungeon = dungeon;
    audio.playShrineChime?.();
    audio.playZonaiBoost?.();

    // Teleport player into the 3D dungeon chamber entrance elevator
    player.position.copy(dungeon.entranceWorldPos);
    player.position.y += 0.5;
    player.velocity.set(0, 0, 0);
    player.isGrounded = true;

    this.engine.spawnCosmicBurst(player.position, 50);
    this.engine.applyScreenShake(0.5);

    if (window.showGameNotification) {
      window.showGameNotification(`🌀 Descended into 3D Zonai Trial: ${dungeon.cfg.name}!`);
    }
  }

  exitDungeon(player) {
    if (!this.activeDungeon) return;

    const shrine = this.shrines.find(s => s.id === this.activeDungeon.cfg.shrineId);
    this.activeDungeon = null;

    audio.playShrineChime?.();
    if (shrine) {
      player.position.copy(shrine.surfacePos);
      player.position.y += 0.5;
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
