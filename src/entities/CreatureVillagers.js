import * as THREE from 'three';

// Advanced Creature & Wildlife System
// Features: Detailed Bokoblin Woodcutters, Expressive Beaverfolk, Leaf-Masked Koroks, and Forest Deer
export class CreatureVillagers {
  constructor() {
    this.goblins = [];
    this.beavers = [];
    this.koroks = [];
    this.deer = [];
    this.blupees = [];
    this.chuchus = [];
    this.bubbulfrogs = [];
    this.cuccos = [];
    this.aerocudas = [];
    this.dondons = [];
    this.foxes = [];
    this.cuccoSwarm = [];
    this.scene = null;
    this.terrain = null;
    this.animTime = 0;
    this.raidActive = false;
    this.raidTimer = 0;
  }

  init(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // 1. Spawn Woodcutter Goblins around camp (x: 65, z: -40)
    for (let i = 0; i < 7; i++) {
      this.spawnGoblin(65 + (Math.random() - 0.5) * 22, -40 + (Math.random() - 0.5) * 22, i === 0);
    }

    // 2. Spawn River Beaverfolk around village (x: -28, z: 25)
    for (let i = 0; i < 6; i++) {
      this.spawnBeaver(-28 + (Math.random() - 0.5) * 18, 25 + (Math.random() - 0.5) * 18);
    }

    // 3. Spawn Woodland Deer in the peaceful western meadow (x: -70, z: -20)
    for (let i = 0; i < 4; i++) {
      this.spawnDeer(-70 + (Math.random() - 0.5) * 25, -20 + (Math.random() - 0.5) * 25);
    }

    // 4. Spawn Blupees in sacred woodland glade (x: -65, z: -15)
    for (let i = 0; i < 3; i++) {
      this.spawnBlupee(-65 + (Math.random() - 0.5) * 20, -15 + (Math.random() - 0.5) * 20);
    }

    // 5. Spawn Elemental Chuchus (Grass, Fire, Electric, Frost)
    const chuchuTypes = ['grass', 'grass', 'fire', 'electric', 'grass', 'frost'];
    const chuchuCoords = [
      [25, -15], [35, -25], [10, 40], [-45, 15], [-50, -45], [0, -35]
    ];
    chuchuCoords.forEach((coord, idx) => {
      this.spawnChuchu(coord[0], coord[1], chuchuTypes[idx % chuchuTypes.length]);
    });

    // 6. Spawn Bubbulfrogs near rock formations & cliff foothills
    this.spawnBubbulfrog(48, 48);
    this.spawnBubbulfrog(-55, 55);
    this.spawnBubbulfrog(72, -18);

    // 7. Spawn Cuccos around the Beaverfolk village
    for (let i = 0; i < 5; i++) {
      this.spawnCucco(-22 + (Math.random() - 0.5) * 16, 30 + (Math.random() - 0.5) * 16);
    }

    // 8. Spawn Aerocudas soaring above the canopy
    for (let i = 0; i < 4; i++) {
      this.spawnAerocuda((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, 14 + Math.random() * 6);
    }

    // 9. Spawn Dondons grazing near mountain slopes
    this.spawnDondon(28, 62);
    this.spawnDondon(-35, 68);

    // 10. Spawn Woodland Grassland Foxes in the eastern hills
    for (let i = 0; i < 4; i++) {
      this.spawnFox(45 + (Math.random() - 0.5) * 25, 20 + (Math.random() - 0.5) * 25);
    }
  }

  // ==========================================
  // 1. HIGH-DETAIL BOKOBLIN-STYLE WOODCUTTER GOBLIN
  // ==========================================
  spawnGoblin(x, z, isCaptain = false) {
    const y = this.terrain.getHeight(x, z);
    const goblin = new THREE.Group();
    goblin.position.set(x, y, z);

    // Color palette
    const skinHex = isCaptain ? 0x991b1b : 0xc2410c; // Captain is fierce crimson, scouts are burnt orange/red
    const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.7 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.35, metalness: 0.8 });
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // 1. Torso & Leather Armor
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.75, 8), vestMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    goblin.add(torso);

    // Spiked Shoulder Pad (Pauldrons)
    const pauldron = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), ironMat);
    pauldron.position.set(-0.35, 1.15, 0);
    goblin.add(pauldron);

    // 2. Sculpted Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), skinMat);
    head.position.set(0, 1.35, 0.05);
    head.scale.set(1.0, 0.95, 1.1);
    head.castShadow = true;
    goblin.add(head);

    // Brow & Snout with Tusks
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.16), skinMat);
    snout.position.set(0, 1.28, 0.22);
    goblin.add(snout);

    // White curved tusks
    [-0.07, 0.07].forEach(tx => {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 4), boneMat);
      tusk.position.set(tx, 1.32, 0.28);
      tusk.rotation.x = Math.PI * 0.75;
      goblin.add(tusk);
    });

    // Glowing Eyes
    [-0.09, 0.09].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), eyeGlowMat);
      eye.position.set(ex, 1.4, 0.22);
      goblin.add(eye);
    });

    // Pointy Goblin Ears with Ring Piercing
    [-0.26, 0.26].forEach((earX, idx) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 5), skinMat);
      ear.rotation.z = earX > 0 ? -Math.PI / 2.8 : Math.PI / 2.8;
      ear.rotation.x = -0.15;
      ear.position.set(earX, 1.42, -0.02);
      goblin.add(ear);

      if (idx === 1) {
        // Brass earring hoop
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), boneMat);
        ring.position.set(earX + 0.06, 1.38, 0);
        goblin.add(ring);
      }
    });

    // Horned Skull Helmet for Captain / Leader
    if (isCaptain) {
      const helm = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.35, 6), ironMat);
      helm.position.set(0, 1.6, 0);
      goblin.add(helm);
      [-0.2, 0.2].forEach(hx => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.25, 4), boneMat);
        horn.position.set(hx, 1.62, 0.05);
        horn.rotation.z = hx > 0 ? -0.4 : 0.4;
        goblin.add(horn);
      });
    }

    // 3. Articulated Legs (for walk cycles)
    const legL = new THREE.Group();
    const legR = new THREE.Group();
    legL.position.set(-0.16, 0.5, 0);
    legR.position.set(0.16, 0.5, 0);

    const legGeom = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 6);
    const legMeshL = new THREE.Mesh(legGeom, vestMat);
    legMeshL.position.y = -0.25;
    legL.add(legMeshL);

    const legMeshR = new THREE.Mesh(legGeom, vestMat);
    legMeshR.position.y = -0.25;
    legR.add(legMeshR);

    goblin.add(legL);
    goblin.add(legR);

    // 4. Arms & Notched Woodcutter Axe
    const armR = new THREE.Group();
    armR.position.set(0.38, 1.1, 0);

    const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6), skinMat);
    armMesh.position.y = -0.2;
    armR.add(armMesh);

    // Iron Woodcutter Axe
    const axeGroup = new THREE.Group();
    axeGroup.position.set(0, -0.4, 0.1);
    const axeHaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 5), vestMat);
    axeHaft.position.y = 0.2;
    axeGroup.add(axeHaft);

    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.28), ironMat);
    axeHead.position.set(0, 0.6, 0.08);
    axeGroup.add(axeHead);
    armR.add(axeGroup);
    goblin.add(armR);

    // Left Arm with Wooden Buckler Shield
    const armL = new THREE.Group();
    armL.position.set(-0.38, 1.1, 0);
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.45, 6), skinMat);
    armLMesh.position.y = -0.2;
    armL.add(armLMesh);

    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 10), vestMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(0, -0.3, 0.15);
    armL.add(shield);
    goblin.add(armL);

    goblin.userData = {
      isGoblin: true,
      isCaptain,
      hp: isCaptain ? 90 : 45,
      maxHp: isCaptain ? 90 : 45,
      speed: isCaptain ? 4.2 : 3.4,
      attackDamage: isCaptain ? 22 : 12,
      attackCooldown: 0,
      state: 'patrol',
      targetPos: new THREE.Vector3(x, y, z),
      patrolTimer: Math.random() * 4,
      campCenter: new THREE.Vector3(65, 0, -40),
      legL,
      legR,
      armR,
      armL,
      swingProgress: 0
    };

    this.scene.add(goblin);
    this.goblins.push(goblin);
    return goblin;
  }

  // ==========================================
  // 2. HIGH-DETAIL RIVER BEAVERFOLK
  // ==========================================
  spawnBeaver(x, z) {
    const y = Math.max(0.0, this.terrain.getHeight(x, z));
    const beaver = new THREE.Group();
    beaver.position.set(x, y, z);

    const furMat = new THREE.MeshStandardMaterial({ color: 0x5c3822, roughness: 0.85 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xa17855, roughness: 0.9 });
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x382315, roughness: 0.9 });

    // Plump Body with soft belly
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), furMat);
    body.scale.set(0.9, 0.85, 1.35);
    body.position.y = 0.32;
    body.castShadow = true;
    beaver.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), bellyMat);
    belly.scale.set(0.85, 0.7, 1.1);
    belly.position.set(0, 0.26, 0.1);
    beaver.add(belly);

    // Sculpted Snout with Chisel Buckteeth
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), furMat);
    head.position.set(0, 0.44, 0.45);
    beaver.add(head);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bellyMat);
    snout.scale.set(1.2, 0.8, 1.0);
    snout.position.set(0, 0.4, 0.65);
    beaver.add(snout);

    // Shiny black nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), noseMat);
    nose.position.set(0, 0.46, 0.76);
    beaver.add(nose);

    // Two prominent beaver teeth
    [-0.035, 0.035].forEach(tx => {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.02), toothMat);
      tooth.position.set(tx, 0.34, 0.74);
      beaver.add(tooth);
    });

    // Dark button eyes
    [-0.12, 0.12].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), noseMat);
      eye.position.set(ex, 0.52, 0.58);
      beaver.add(eye);
    });

    // Wide Paddle Tail (cross-hatched)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.2, -0.55);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.55), tailMat);
    tail.position.z = -0.25;
    tail.castShadow = true;
    tailGroup.add(tail);
    beaver.add(tailGroup);

    // Little swimming paws
    const pawL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.14), tailMat);
    pawL.position.set(-0.25, 0.12, 0.3);
    const pawR = pawL.clone();
    pawR.position.x = 0.25;
    beaver.add(pawL);
    beaver.add(pawR);

    beaver.userData = {
      isBeaver: true,
      speed: 2.3,
      swimSpeed: 4.5,
      state: 'swim_or_wander',
      targetPos: new THREE.Vector3(x, y, z),
      timer: Math.random() * 5,
      homeCenter: new THREE.Vector3(-28, 0, 25),
      tailGroup,
      pawL,
      pawR
    };

    this.scene.add(beaver);
    this.beavers.push(beaver);
    return beaver;
  }

  // ==========================================
  // 3. KOROK FOREST SPIRITS (ZELDA TOTK INSPIRED)
  // ==========================================
  spawnKorok(position, leafType = 'oak') {
    const korok = new THREE.Group();
    korok.position.copy(position);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });
    const leafHex = leafType === 'oak' ? 0x22c55e : (leafType === 'maple' ? 0xf97316 : 0xeab308);
    const leafMat = new THREE.MeshStandardMaterial({ color: leafHex, roughness: 0.6, side: THREE.DoubleSide });
    const faceMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });

    // Chubby Twig Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.55, 8), woodMat);
    body.position.y = 0.35;
    body.castShadow = true;
    korok.add(body);

    // Stitched Traveler Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.18), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 }));
    pack.position.set(0, 0.4, -0.2);
    korok.add(pack);

    // Leaf Mask with eyes & smile cutouts
    const mask = new THREE.Mesh(new THREE.CircleGeometry(0.26, 8), leafMat);
    mask.position.set(0, 0.45, 0.2);
    korok.add(mask);

    // Cute face markings
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.035, 6), faceMat);
      eye.position.set(ex, 0.48, 0.21);
      korok.add(eye);
    });
    const smile = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.05, 8, 1, 0, Math.PI), faceMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.38, 0.21);
    korok.add(smile);

    // Spinning Propeller Sprout on Head
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0.7, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 4), woodMat);
    stem.position.y = 0.1;
    propGroup.add(stem);

    const propBlade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.06), leafMat);
    propBlade.position.y = 0.2;
    propGroup.add(propBlade);
    korok.add(propGroup);

    korok.userData = {
      isKorok: true,
      propGroup,
      baseY: position.y,
      bounceSpeed: 4.0,
      sparkleTimer: 0
    };

    this.scene.add(korok);
    this.koroks.push(korok);
    return korok;
  }

  // ==========================================
  // 4. WOODLAND FOREST DEER / ELK
  // ==========================================
  spawnDeer(x, z) {
    const y = this.terrain.getHeight(x, z);
    const deer = new THREE.Group();
    deer.position.set(x, y, z);

    const furMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.8 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.85 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // Slender Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.1, 8), furMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.0;
    body.castShadow = true;
    deer.add(body);

    // Graceful Upright Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.7, 6), furMat);
    neck.position.set(0, 1.35, 0.45);
    neck.rotation.x = 0.5;
    deer.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), furMat);
    head.scale.set(0.8, 0.9, 1.3);
    head.position.set(0, 1.68, 0.65);
    deer.add(head);

    // Dark Gentle Eyes
    [-0.12, 0.12].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
      eye.position.set(ex, 1.72, 0.75);
      deer.add(eye);
    });

    // Velvet Antlers
    [-0.14, 0.14].forEach(ax => {
      const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.55, 4), antlerMat);
      mainBeam.position.set(ax, 1.95, 0.55);
      mainBeam.rotation.z = ax > 0 ? -0.3 : 0.3;
      mainBeam.rotation.x = -0.2;
      deer.add(mainBeam);

      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.25, 4), antlerMat);
      tine.position.set(ax * 1.5, 2.05, 0.65);
      tine.rotation.z = ax > 0 ? -0.7 : 0.7;
      deer.add(tine);
    });

    // Four Graceful Legs
    const legPositions = [
      [-0.18, 0.5, 0.35],
      [0.18, 0.5, 0.35],
      [-0.18, 0.5, -0.35],
      [0.18, 0.5, -0.35]
    ];
    const legs = [];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 1.0, 5), furMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      deer.add(leg);
      legs.push(leg);
    });

    deer.userData = {
      isDeer: true,
      speed: 4.5,
      fleeSpeed: 9.0,
      state: 'graze',
      grazeTimer: 2 + Math.random() * 5,
      targetPos: new THREE.Vector3(x, y, z),
      homeCenter: new THREE.Vector3(-70, 0, -20),
      legs
    };

    this.scene.add(deer);
    this.deer.push(deer);
    return deer;
  }

  // ==========================================
  // 5. BLUPEE - GLOWING MYTHICAL SPIRIT RABBIT (TOTK)
  // ==========================================
  spawnBlupee(x, z) {
    const y = this.terrain.getHeight(x, z);
    const blupee = new THREE.Group();
    blupee.position.set(x, y, z);

    const spiritMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.88,
      roughness: 0.2
    });
    const spotMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xbae6fd,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Plump rabbit body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), spiritMat);
    body.scale.set(0.85, 0.9, 1.25);
    body.position.y = 0.24;
    body.castShadow = true;
    blupee.add(body);

    // Dappled spots on back
    [-0.08, 0.08].forEach(sx => {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), spotMat);
      spot.position.set(sx, 0.35, -0.05);
      blupee.add(spot);
    });

    // Gentle rabbit head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), spiritMat);
    head.position.set(0, 0.38, 0.28);
    blupee.add(head);

    // Glowing white eyes
    [-0.09, 0.09].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
      eye.position.set(ex, 0.44, 0.38);
      blupee.add(eye);
    });

    // Tall feathered spirit ears
    const earL = new THREE.Group();
    const earR = new THREE.Group();
    earL.position.set(-0.08, 0.48, 0.2);
    earR.position.set(0.08, 0.48, 0.2);

    [-1, 1].forEach((dir, idx) => {
      const g = idx === 0 ? earL : earR;
      const earCone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.42, 5), spiritMat);
      earCone.position.y = 0.2;
      earCone.rotation.z = dir * 0.18;
      earCone.rotation.x = -0.2;
      g.add(earCone);

      // Feathered tips
      const tuft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.02), spotMat);
      tuft.position.set(dir * 0.04, 0.38, -0.04);
      g.add(tuft);
      blupee.add(g);
    });

    // Fluffy glowing tail puff
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), spotMat);
    tail.position.set(0, 0.22, -0.32);
    blupee.add(tail);

    blupee.userData = {
      isBlupee: true,
      speed: 3.5,
      fleeSpeed: 11.5,
      state: 'graze',
      grazeTimer: 3 + Math.random() * 4,
      targetPos: new THREE.Vector3(x, y, z),
      homeCenter: new THREE.Vector3(x, 0, z),
      earL,
      earR,
      sparkleTimer: 0
    };

    this.scene.add(blupee);
    this.blupees.push(blupee);
    return blupee;
  }

  // ==========================================
  // 6. ELEMENTAL CHUCHUS (TOTK JELLY SLIMES)
  // ==========================================
  spawnChuchu(x, z, type = 'grass') {
    const y = this.terrain.getHeight(x, z);
    const chuchu = new THREE.Group();
    chuchu.position.set(x, y, z);

    const colors = {
      grass: { main: 0x22c55e, emissive: 0x15803d, drop: 'grass_jelly' },
      fire: { main: 0xef4444, emissive: 0xb91c1c, drop: 'fire_jelly' },
      electric: { main: 0xfacc15, emissive: 0xa16207, drop: 'electric_jelly' },
      frost: { main: 0x7dd3fc, emissive: 0x0284c7, drop: 'ice_jelly' }
    };
    const c = colors[type] || colors.grass;

    const jellyMat = new THREE.MeshStandardMaterial({
      color: c.main,
      emissive: c.emissive,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.1
    });
    const coreMat = new THREE.MeshStandardMaterial({
      color: c.emissive,
      roughness: 0.3
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Outer translucent jelly dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), jellyMat);
    dome.position.y = 0.35;
    dome.castShadow = true;
    chuchu.add(dome);

    // Floating internal core nucleus
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), coreMat);
    core.position.y = 0.32;
    chuchu.add(core);

    // Floating eyes on front surface
    [-0.1, 0.1].forEach(ex => {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), eyeWhiteMat);
      eyeWhite.position.set(ex, 0.38, 0.32);
      chuchu.add(eyeWhite);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
      pupil.position.set(ex, 0.38, 0.37);
      chuchu.add(pupil);
    });

    chuchu.userData = {
      isChuchu: true,
      type,
      hp: 20,
      speed: 2.4,
      jumpTimer: 1.5 + Math.random() * 2,
      isJumping: false,
      jumpVy: 0,
      dome,
      core,
      targetPos: new THREE.Vector3(x, y, z),
      homeCenter: new THREE.Vector3(x, 0, z)
    };

    this.scene.add(chuchu);
    this.chuchus.push(chuchu);
    return chuchu;
  }

  // ==========================================
  // 7. BUBBULFROG - CAVE & MOUNTAIN SACRED SPIRIT (TOTK)
  // ==========================================
  spawnBubbulfrog(x, z) {
    const y = this.terrain.getHeight(x, z);
    const frog = new THREE.Group();
    frog.position.set(x, y, z);

    const frogMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });
    const sacMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });

    // Broad Amphibian Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), frogMat);
    body.scale.set(1.25, 0.85, 1.3);
    body.position.y = 0.4;
    body.castShadow = true;
    frog.add(body);

    // Glowing Pulsing Vocal Throat Sac
    const sac = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), sacMat);
    sac.position.set(0, 0.32, 0.42);
    frog.add(sac);

    // Crystal horns atop head
    [-0.18, 0, 0.18].forEach((hx, i) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.35 + (i === 1 ? 0.1 : 0), 4), crystalMat);
      horn.position.set(hx, 0.68, 0.2);
      horn.rotation.x = -0.3;
      horn.rotation.z = hx * 0.4;
      frog.add(horn);
    });

    // Large crystal frog eyes
    [-0.24, 0.24].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), crystalMat);
      eye.position.set(ex, 0.58, 0.32);
      frog.add(eye);
    });

    // Webbed feet
    [[-0.38, 0.1, 0.25], [0.38, 0.1, 0.25], [-0.42, 0.1, -0.28], [0.42, 0.1, -0.28]].forEach(fp => {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.24), frogMat);
      foot.position.set(fp[0], fp[1], fp[2]);
      frog.add(foot);
    });

    frog.userData = {
      isBubbulfrog: true,
      hp: 35,
      bubbleTimer: 2.2,
      sac,
      bubbles: []
    };

    this.scene.add(frog);
    this.bubbulfrogs.push(frog);
    return frog;
  }

  // ==========================================
  // 8. CUCCO - LEGENDARY HYRULE CHICKEN (TOTK)
  // ==========================================
  spawnCucco(x, z) {
    const y = this.terrain.getHeight(x, z);
    const cucco = new THREE.Group();
    cucco.position.set(x, y, z);

    const featherMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.75 });
    const combMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // Plump white body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), featherMat);
    body.scale.set(0.85, 0.95, 1.2);
    body.position.y = 0.28;
    body.castShadow = true;
    cucco.add(body);

    // Head with bright red comb & wattle
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), featherMat);
    head.position.set(0, 0.48, 0.22);
    cucco.add(head);

    const comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.18), combMat);
    comb.position.set(0, 0.6, 0.2);
    cucco.add(comb);

    const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.06), combMat);
    wattle.position.set(0, 0.4, 0.3);
    cucco.add(wattle);

    // Yellow beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.46, 0.36);
    cucco.add(beak);

    // Tiny black bead eyes
    [-0.08, 0.08].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eye.position.set(ex, 0.51, 0.28);
      cucco.add(eye);
    });

    // Flapping wings
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.28), featherMat);
    wingL.position.set(-0.21, 0.32, 0);
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.28), featherMat);
    wingR.position.set(0.21, 0.32, 0);
    cucco.add(wingL);
    cucco.add(wingR);

    // Tail feathers
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.18), featherMat);
    tail.rotation.x = 0.5;
    tail.position.set(0, 0.42, -0.28);
    cucco.add(tail);

    cucco.userData = {
      isCucco: true,
      hitCount: 0,
      speed: 2.2,
      flutterSpeed: 6.5,
      state: 'peck',
      timer: 2.0,
      cluckTimer: 3.5 + Math.random() * 5,
      wingL,
      wingR,
      homeCenter: new THREE.Vector3(x, 0, z)
    };

    this.scene.add(cucco);
    this.cuccos.push(cucco);
    return cucco;
  }

  // ==========================================
  // 9. AEROCUDA - WINGED SKY PREDATOR (TOTK)
  // ==========================================
  spawnAerocuda(x, z, altitude = 15) {
    const aerocuda = new THREE.Group();
    aerocuda.position.set(x, altitude, z);

    const skinMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, side: THREE.DoubleSide });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

    // Torso
    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.8, 6), skinMat);
    torso.rotation.x = Math.PI / 2;
    aerocuda.add(torso);

    // Large glowing cyclops eye
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    eye.position.set(0, 0.05, 0.38);
    aerocuda.add(eye);

    // Large leathery wings
    const wingL = new THREE.Group();
    wingL.position.set(-0.2, 0, 0);
    const wingMeshL = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), wingMat);
    wingMeshL.position.set(-0.6, 0, 0);
    wingMeshL.rotation.x = Math.PI / 2;
    wingL.add(wingMeshL);
    aerocuda.add(wingL);

    const wingR = new THREE.Group();
    wingR.position.set(0.2, 0, 0);
    const wingMeshR = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), wingMat);
    wingMeshR.position.set(0.6, 0, 0);
    wingMeshR.rotation.x = Math.PI / 2;
    wingR.add(wingMeshR);
    aerocuda.add(wingR);

    aerocuda.userData = {
      isAerocuda: true,
      hp: 25,
      altitude,
      orbitCenter: new THREE.Vector3(x, altitude, z),
      orbitRadius: 18 + Math.random() * 14,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.6 + Math.random() * 0.4,
      wingL,
      wingR
    };

    this.scene.add(aerocuda);
    this.aerocudas.push(aerocuda);
    return aerocuda;
  }

  // ==========================================
  // 10. DONDON - LUMINOUS STONE HORNED BEAST (TOTK)
  // ==========================================
  spawnDondon(x, z) {
    const y = this.terrain.getHeight(x, z);
    const dondon = new THREE.Group();
    dondon.position.set(x, y, z);

    const hideMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.95 });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });

    // Bulky reptile body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 2.2, 8), hideMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.95;
    body.castShadow = true;
    dondon.add(body);

    // Thick head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.8), hideMat);
    head.position.set(0, 1.1, 1.3);
    dondon.add(head);

    // Massive curved horns
    [-0.38, 0.38].forEach(hx => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 5), hornMat);
      horn.position.set(hx, 1.45, 1.4);
      horn.rotation.x = -0.4;
      horn.rotation.z = hx > 0 ? -0.5 : 0.5;
      dondon.add(horn);
    });

    // Spines studded with glowing luminous ore crystals on back
    for (let i = 0; i < 6; i++) {
      const ore = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 + Math.random() * 0.08, 0), crystalMat);
      ore.position.set((Math.random() - 0.5) * 0.4, 1.55, -0.6 + i * 0.3);
      dondon.add(ore);
    }

    // 4 Heavy Stumpy Legs
    [[-0.48, 0.4, 0.7], [0.48, 0.4, 0.7], [-0.48, 0.4, -0.7], [0.48, 0.4, -0.7]].forEach(lp => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 6), hideMat);
      leg.position.set(lp[0], lp[1], lp[2]);
      dondon.add(leg);
    });

    dondon.userData = {
      isDondon: true,
      speed: 1.2,
      state: 'graze',
      timer: 6.0,
      homeCenter: new THREE.Vector3(x, 0, z)
    };

    this.scene.add(dondon);
    this.dondons.push(dondon);
    return dondon;
  }

  // ==========================================
  // 11. WOODLAND GRASSLAND FOX (Hyrule Fox)
  // ==========================================
  spawnFox(x, z) {
    const y = this.terrain.getHeight(x, z);
    const fox = new THREE.Group();
    fox.position.set(x, y, z);

    const coatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    // Slender Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), coatMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.45;
    body.castShadow = true;
    fox.add(body);

    // White Chest
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), whiteMat);
    chest.position.set(0, 0.52, 0.28);
    fox.add(chest);

    // Head
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 6), coatMat);
    head.position.set(0, 0.65, 0.45);
    head.rotation.x = Math.PI / 2.8;
    fox.add(head);

    // White Muzzle / Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), blackMat);
    nose.position.set(0, 0.58, 0.65);
    fox.add(nose);

    // Eyes
    [-0.07, 0.07].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), eyeMat);
      eye.position.set(ex, 0.7, 0.52);
      fox.add(eye);
    });

    // Triangular Ears with black tips
    [-0.08, 0.08].forEach(earX => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), blackMat);
      ear.position.set(earX, 0.82, 0.4);
      ear.rotation.z = earX > 0 ? -0.2 : 0.2;
      fox.add(ear);
    });

    // Bushy Tail with White Tip
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.45, -0.35);
    const tailBase = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 6), coatMat);
    tailBase.rotation.x = -Math.PI / 3;
    tailBase.position.y = 0.15;
    tailBase.position.z = -0.15;
    tailGroup.add(tailBase);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 6), whiteMat);
    tailTip.position.set(0, 0.32, -0.28);
    tailTip.rotation.x = -Math.PI / 3;
    tailGroup.add(tailTip);
    fox.add(tailGroup);

    // Four Legs
    const legs = [];
    [[-0.1, 0.22, 0.2], [0.1, 0.22, 0.2], [-0.1, 0.22, -0.2], [0.1, 0.22, -0.2]].forEach(lp => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.44, 4), blackMat);
      leg.position.set(lp[0], lp[1], lp[2]);
      fox.add(leg);
      legs.push(leg);
    });

    fox.userData = {
      isFox: true,
      homeCenter: new THREE.Vector3(x, 0, z),
      targetPos: new THREE.Vector3(x, 0, z),
      timer: 0,
      legs,
      tail: tailGroup,
      speed: 3.8,
      fleeTimer: 0
    };

    this.scene.add(fox);
    this.foxes.push(fox);
    return fox;
  }

  // ==========================================
  // UPDATE LOOP & DYNAMIC AI BEHAVIORS
  // ==========================================
  update(delta, playerEvermean, engine, audio, colony) {
    this.animTime += delta;
    const playerPos = playerEvermean.position;
    const isPlayerDisguised = playerEvermean.isDisguised;

    // 1. UPDATE BOKOBLIN WOODCUTTERS
    for (let i = this.goblins.length - 1; i >= 0; i--) {
      const g = this.goblins[i];
      const u = g.userData;

      if (u.attackCooldown > 0) u.attackCooldown -= delta;

      const distToPlayer = g.position.distanceTo(playerPos);

      // Check if raiding grove structures
      let raidTarget = null;
      if (colony && colony.structures && colony.structures.length > 0 && Math.random() < 0.05 && u.state === 'patrol') {
        const targetStruct = colony.structures[Math.floor(Math.random() * colony.structures.length)];
        if (targetStruct && targetStruct.position) {
          raidTarget = targetStruct.position;
        }
      }

      if (!isPlayerDisguised && distToPlayer < 20) {
        // Chase player tree monster!
        u.state = 'chase';
        const dir = new THREE.Vector3().subVectors(playerPos, g.position).normalize();
        g.position.x += dir.x * u.speed * delta;
        g.position.z += dir.z * u.speed * delta;
        g.rotation.y = Math.atan2(dir.x, dir.z);

        // Animate running legs
        const runCycle = Math.sin(this.animTime * 12);
        u.legL.rotation.x = runCycle * 0.7;
        u.legR.rotation.x = -runCycle * 0.7;

        // Attack in range
        if (distToPlayer < 2.3 && u.attackCooldown <= 0) {
          u.attackCooldown = 1.4;
          u.swingProgress = 1.0;
          audio.playHeadSlam(0.4);
          playerEvermean.takeDamage(u.attackDamage, 'Woodcutter Axe Chop');
          engine.applyScreenShake(0.25);
        }
      } else {
        // Peaceful patrol around camp
        u.state = 'patrol';
        u.patrolTimer -= delta;
        if (u.patrolTimer <= 0) {
          u.patrolTimer = 3.5 + Math.random() * 4;
          const dest = raidTarget || u.campCenter;
          u.targetPos.set(
            dest.x + (Math.random() - 0.5) * 28,
            0,
            dest.z + (Math.random() - 0.5) * 28
          );
        }

        const toTarget = new THREE.Vector3().subVectors(u.targetPos, g.position);
        if (toTarget.length() > 1.2) {
          toTarget.normalize();
          g.position.x += toTarget.x * (u.speed * 0.45) * delta;
          g.position.z += toTarget.z * (u.speed * 0.45) * delta;
          g.rotation.y = Math.atan2(toTarget.x, toTarget.z);

          const walkCycle = Math.sin(this.animTime * 6);
          u.legL.rotation.x = walkCycle * 0.4;
          u.legR.rotation.x = -walkCycle * 0.4;
        } else {
          u.legL.rotation.x = 0;
          u.legR.rotation.x = 0;
        }
      }

      // Smooth axe attack swing animation
      if (u.swingProgress > 0) {
        u.swingProgress -= delta * 3.5;
        const swing = Math.sin(u.swingProgress * Math.PI);
        u.armR.rotation.x = -swing * 1.6;
      } else {
        u.armR.rotation.x = 0.2;
      }

      g.position.y = this.terrain.getHeight(g.position.x, g.position.z);
    }

    // 2. UPDATE BEAVERFOLK (waddling & swimming)
    this.beavers.forEach(b => {
      const u = b.userData;
      u.timer -= delta;
      if (u.timer <= 0) {
        u.timer = 4 + Math.random() * 5;
        u.targetPos.set(
          u.homeCenter.x + (Math.random() - 0.5) * 26,
          0,
          u.homeCenter.z + (Math.random() - 0.5) * 26
        );
      }

      const toTarget = new THREE.Vector3().subVectors(u.targetPos, b.position);
      const isWater = this.terrain.isWater(b.position.x, b.position.z);
      const speed = isWater ? u.swimSpeed : u.speed;

      if (toTarget.length() > 0.8) {
        toTarget.normalize();
        b.position.x += toTarget.x * speed * delta;
        b.position.z += toTarget.z * speed * delta;
        b.rotation.y = Math.atan2(toTarget.x, toTarget.z);

        // Swimming tail paddle wag or land waddle
        if (isWater) {
          u.tailGroup.rotation.y = Math.sin(this.animTime * 10) * 0.5;
          b.rotation.z = Math.sin(this.animTime * 8) * 0.08;
        } else {
          u.tailGroup.rotation.y = 0;
          b.rotation.z = Math.sin(this.animTime * 6) * 0.15; // Waddle
        }
      }

      const gh = this.terrain.getHeight(b.position.x, b.position.z);
      b.position.y = isWater ? 0.05 : gh;
    });

    // 3. UPDATE KOROK FOREST SPIRITS (gentle hover and pinwheel spin)
    this.koroks.forEach(k => {
      const u = k.userData;
      u.propGroup.rotation.y += delta * 12.0; // Fast spinning propeller
      k.position.y = u.baseY + Math.sin(this.animTime * u.bounceSpeed) * 0.2 + 0.3;
      k.rotation.y += delta * 0.4;
    });

    // 4. UPDATE WOODLAND DEER (grazing & stealth awareness)
    this.deer.forEach(d => {
      const u = d.userData;
      const distToPlayer = d.position.distanceTo(playerPos);

      // If player gets close while NOT disguised, deer is startled and flees!
      if (!isPlayerDisguised && distToPlayer < 14) {
        u.state = 'flee';
        const fleeDir = new THREE.Vector3().subVectors(d.position, playerPos).normalize();
        d.position.x += fleeDir.x * u.fleeSpeed * delta;
        d.position.z += fleeDir.z * u.fleeSpeed * delta;
        d.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);

        // Leaping leg sprint animation
        const leap = Math.sin(this.animTime * 14);
        u.legs[0].rotation.x = leap * 0.6;
        u.legs[1].rotation.x = -leap * 0.6;
        u.legs[2].rotation.x = -leap * 0.6;
        u.legs[3].rotation.x = leap * 0.6;
      } else {
        // Peaceful grazing
        u.state = 'graze';
        u.grazeTimer -= delta;
        if (u.grazeTimer <= 0) {
          u.grazeTimer = 3 + Math.random() * 5;
          u.targetPos.set(
            u.homeCenter.x + (Math.random() - 0.5) * 35,
            0,
            u.homeCenter.z + (Math.random() - 0.5) * 35
          );
        }

        const toTarget = new THREE.Vector3().subVectors(u.targetPos, d.position);
        if (toTarget.length() > 1.0) {
          toTarget.normalize();
          d.position.x += toTarget.x * (u.speed * 0.4) * delta;
          d.position.z += toTarget.z * (u.speed * 0.4) * delta;
          d.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        }
      }

      d.position.y = this.terrain.getHeight(d.position.x, d.position.z);
    });

    // 5. UPDATE BLUPEES (mythical glowing spirit rabbit)
    for (let i = this.blupees.length - 1; i >= 0; i--) {
      const b = this.blupees[i];
      const u = b.userData;
      const distToPlayer = b.position.distanceTo(playerPos);

      // Ear twitch
      if (u.earL && u.earR) {
        const earWiggle = Math.sin(this.animTime * 8) * 0.1;
        u.earL.rotation.z = -0.18 + earWiggle;
        u.earR.rotation.z = 0.18 - earWiggle;
      }

      // Startled if player approaches while not disguised!
      if (!isPlayerDisguised && distToPlayer < 16) {
        u.state = 'flee';
        const fleeDir = new THREE.Vector3().subVectors(b.position, playerPos).normalize();
        b.position.x += fleeDir.x * u.fleeSpeed * delta;
        b.position.z += fleeDir.z * u.fleeSpeed * delta;
        b.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);

        // Bouncy hops
        const hop = Math.abs(Math.sin(this.animTime * 14)) * 0.45;
        b.position.y = this.terrain.getHeight(b.position.x, b.position.z) + hop;

        u.sparkleTimer -= delta;
        if (u.sparkleTimer <= 0) {
          u.sparkleTimer = 0.12;
          engine.spawnParticles(b.position, 2, 0x38bdf8, 1.5, 0.08);
        }
      } else {
        u.state = 'graze';
        u.grazeTimer -= delta;
        if (u.grazeTimer <= 0) {
          u.grazeTimer = 3 + Math.random() * 4;
          u.targetPos.set(
            u.homeCenter.x + (Math.random() - 0.5) * 30,
            0,
            u.homeCenter.z + (Math.random() - 0.5) * 30
          );
        }

        const toTarget = new THREE.Vector3().subVectors(u.targetPos, b.position);
        if (toTarget.length() > 0.8) {
          toTarget.normalize();
          b.position.x += toTarget.x * (u.speed * 0.5) * delta;
          b.position.z += toTarget.z * (u.speed * 0.5) * delta;
          b.rotation.y = Math.atan2(toTarget.x, toTarget.z);
          const gentleHop = Math.abs(Math.sin(this.animTime * 6)) * 0.15;
          b.position.y = this.terrain.getHeight(b.position.x, b.position.z) + gentleHop;
        } else {
          b.position.y = this.terrain.getHeight(b.position.x, b.position.z);
        }
      }
    }

    // 6. UPDATE ELEMENTAL CHUCHUS (bouncing jelly slimes)
    for (let i = this.chuchus.length - 1; i >= 0; i--) {
      const c = this.chuchus[i];
      const u = c.userData;
      const distToPlayer = c.position.distanceTo(playerPos);

      u.jumpTimer -= delta;
      if (u.jumpTimer <= 0) {
        u.jumpTimer = 1.6 + Math.random() * 2.2;
        u.isJumping = true;
        u.jumpVy = 5.5;
        audio.playChuchuSquish?.();

        // If player is close and not disguised, hop towards player
        if (!isPlayerDisguised && distToPlayer < 14) {
          const dir = new THREE.Vector3().subVectors(playerPos, c.position).normalize();
          u.targetPos.copy(c.position).addScaledVector(dir, 2.5);
        } else {
          u.targetPos.set(
            u.homeCenter.x + (Math.random() - 0.5) * 20,
            0,
            u.homeCenter.z + (Math.random() - 0.5) * 20
          );
        }
      }

      // Jump Physics & Squash-and-Stretch
      const ground = this.terrain.getHeight(c.position.x, c.position.z);
      if (u.isJumping) {
        u.jumpVy -= 16 * delta;
        c.position.y += u.jumpVy * delta;

        // Stretch vertically while ascending
        if (u.jumpVy > 0) {
          c.scale.set(0.82, 1.28, 0.82);
        } else {
          c.scale.set(0.95, 1.05, 0.95);
        }

        // Move horizontally during jump
        const toTarget = new THREE.Vector3().subVectors(u.targetPos, c.position);
        toTarget.y = 0;
        if (toTarget.length() > 0.3) {
          toTarget.normalize();
          c.position.x += toTarget.x * u.speed * delta;
          c.position.z += toTarget.z * u.speed * delta;
          c.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        }

        // Landing
        if (c.position.y <= ground) {
          c.position.y = ground;
          u.isJumping = false;
          u.jumpVy = 0;
          // Squash flat on ground
          c.scale.set(1.35, 0.65, 1.35);
        }
      } else {
        // Recover from squash back to normal scale
        c.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 8);
        c.position.y = ground;
      }
    }

    // 7. UPDATE BUBBULFROGS (cliff spirit & glowing floating bubbles)
    this.bubbulfrogs.forEach(frog => {
      const u = frog.userData;
      // Pulse glowing throat sac
      const pulse = 1.0 + Math.sin(this.animTime * 3.5) * 0.22;
      if (u.sac) u.sac.scale.set(pulse, pulse, pulse);

      // Periodically blow out glowing iridescent bubbles
      u.bubbleTimer -= delta;
      if (u.bubbleTimer <= 0) {
        u.bubbleTimer = 3.2 + Math.random() * 2;
        const bubbleGeom = new THREE.SphereGeometry(0.18 + Math.random() * 0.1, 8, 8);
        const bubbleMat = new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.65,
          roughness: 0.1
        });
        const bubbleMesh = new THREE.Mesh(bubbleGeom, bubbleMat);
        bubbleMesh.position.set(
          frog.position.x + (Math.random() - 0.5) * 0.4,
          frog.position.y + 0.6,
          frog.position.z + 0.4
        );
        this.scene.add(bubbleMesh);
        u.bubbles.push({
          mesh: bubbleMesh,
          vy: 0.8 + Math.random() * 0.5,
          vx: (Math.random() - 0.5) * 0.4,
          vz: (Math.random() - 0.5) * 0.4,
          life: 5.0
        });
      }

      // Animate floating bubbles
      for (let bIdx = u.bubbles.length - 1; bIdx >= 0; bIdx--) {
        const bub = u.bubbles[bIdx];
        bub.life -= delta;
        bub.mesh.position.y += bub.vy * delta;
        bub.mesh.position.x += (bub.vx + Math.sin(this.animTime * 2 + bIdx) * 0.2) * delta;
        bub.mesh.position.z += bub.vz * delta;

        if (bub.life <= 0) {
          engine.spawnParticles(bub.mesh.position, 6, 0x38bdf8, 1, 0.08);
          this.scene.remove(bub.mesh);
          u.bubbles.splice(bIdx, 1);
        }
      }
    });

    // 8. UPDATE CUCCOS (pecking, wing flapping, & Cucco Revenge Swarm)
    this.cuccos.forEach(cucco => {
      const u = cucco.userData;
      u.cluckTimer -= delta;
      if (u.cluckTimer <= 0) {
        u.cluckTimer = 4.0 + Math.random() * 6;
        if (Math.random() < 0.4) audio.playCuccoCluck?.();
      }

      u.timer -= delta;
      if (u.timer <= 0) {
        u.timer = 2.5 + Math.random() * 3.5;
        u.targetPos = new THREE.Vector3(
          u.homeCenter.x + (Math.random() - 0.5) * 22,
          0,
          u.homeCenter.z + (Math.random() - 0.5) * 22
        );
      }

      const toTarget = new THREE.Vector3().subVectors(u.targetPos, cucco.position);
      if (toTarget.length() > 0.8) {
        toTarget.normalize();
        cucco.position.x += toTarget.x * (u.speed * 0.6) * delta;
        cucco.position.z += toTarget.z * (u.speed * 0.6) * delta;
        cucco.rotation.y = Math.atan2(toTarget.x, toTarget.z);

        // Flap wings while walking
        const wingFlap = Math.sin(this.animTime * 12) * 0.35;
        if (u.wingL) u.wingL.rotation.z = wingFlap;
        if (u.wingR) u.wingR.rotation.z = -wingFlap;
      } else {
        // Head peck
        cucco.rotation.x = Math.sin(this.animTime * 4) * 0.15;
      }

      cucco.position.y = this.terrain.getHeight(cucco.position.x, cucco.position.z);
    });

    // Active Cucco Swarm Update
    for (let sIdx = this.cuccoSwarm.length - 1; sIdx >= 0; sIdx--) {
      const sw = this.cuccoSwarm[sIdx];
      sw.life -= delta;

      // Swarm dive-bombs in circular cyclone around player
      sw.angle += delta * 4.5;
      const targetX = playerPos.x + Math.cos(sw.angle) * sw.radius;
      const targetZ = playerPos.z + Math.sin(sw.angle) * sw.radius;
      const targetY = playerPos.y + 0.8 + Math.sin(this.animTime * 8 + sIdx) * 1.2;

      sw.mesh.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 6);
      sw.mesh.lookAt(playerPos);

      // Violent wing flapping
      if (sw.wingL) sw.wingL.rotation.z = Math.sin(this.animTime * 24) * 0.8;
      if (sw.wingR) sw.wingR.rotation.z = -Math.sin(this.animTime * 24) * 0.8;

      // Peck damage on collision
      if (sw.mesh.position.distanceTo(playerPos) < 1.4 && Math.random() < 0.08) {
        playerEvermean.takeDamage(3, 'Cucco Flock Peck');
        engine.spawnParticles(playerPos, 8, 0xf8fafc, 2, 0.1);
        engine.applyScreenShake(0.12);
      }

      if (sw.life <= 0) {
        engine.spawnParticles(sw.mesh.position, 14, 0xf8fafc, 3, 0.12);
        this.scene.remove(sw.mesh);
        this.cuccoSwarm.splice(sIdx, 1);
      }
    }

    // 9. UPDATE AEROCUDAS (soaring winged sky predators)
    this.aerocudas.forEach(a => {
      const u = a.userData;
      u.orbitAngle += u.orbitSpeed * delta * 0.6;
      a.position.x = u.orbitCenter.x + Math.cos(u.orbitAngle) * u.orbitRadius;
      a.position.z = u.orbitCenter.z + Math.sin(u.orbitAngle) * u.orbitRadius;
      a.position.y = u.altitude + Math.sin(this.animTime * 1.8) * 1.5;

      // Point forward along orbit tangent
      a.rotation.y = -u.orbitAngle + Math.PI / 2;
      a.rotation.z = Math.sin(this.animTime * 1.5) * 0.15; // Banking turn

      // Wing flapping cycle
      const flap = Math.sin(this.animTime * 8) * 0.45;
      if (u.wingL) u.wingL.rotation.z = flap;
      if (u.wingR) u.wingR.rotation.z = -flap;
    });

    // 10. UPDATE DONDONS (gentle luminous stone beasts)
    this.dondons.forEach(d => {
      const u = d.userData;
      u.timer -= delta;
      if (u.timer <= 0) {
        u.timer = 5.0 + Math.random() * 5;
        u.targetPos = new THREE.Vector3(
          u.homeCenter.x + (Math.random() - 0.5) * 20,
          0,
          u.homeCenter.z + (Math.random() - 0.5) * 20
        );
      }

      const toTarget = new THREE.Vector3().subVectors(u.targetPos, d.position);
      if (toTarget.length() > 1.2) {
        toTarget.normalize();
        d.position.x += toTarget.x * (u.speed * 0.5) * delta;
        d.position.z += toTarget.z * (u.speed * 0.5) * delta;
        d.rotation.y = Math.atan2(toTarget.x, toTarget.z);
      }
      d.position.y = this.terrain.getHeight(d.position.x, d.position.z);
    });

    // 11. UPDATE WOODLAND FOXES (nimble scampering, curious if disguised, flees if exposed)
    this.foxes.forEach(f => {
      const u = f.userData;
      if (u.fleeTimer > 0) u.fleeTimer -= delta;

      const distToPlayer = f.position.distanceTo(playerPos);
      let moveSpeed = u.speed;

      if (u.fleeTimer > 0 || (distToPlayer < 7.0 && !isPlayerDisguised)) {
        // Flee rapidly away from player
        const fleeDir = new THREE.Vector3().subVectors(f.position, playerPos).normalize();
        f.position.addScaledVector(fleeDir, u.speed * 1.5 * delta);
        f.rotation.y = Math.atan2(fleeDir.x, fleeDir.z);
        moveSpeed = u.speed * 1.5;
      } else {
        // Idle wander or gentle curiosity towards disguised player
        u.timer -= delta;
        if (u.timer <= 0) {
          u.timer = 3.5 + Math.random() * 4.0;
          if (distToPlayer < 9.0 && isPlayerDisguised) {
            // Fox cautiously investigates the disguised "tree"
            u.targetPos = playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3));
          } else {
            u.targetPos = new THREE.Vector3(
              u.homeCenter.x + (Math.random() - 0.5) * 24,
              0,
              u.homeCenter.z + (Math.random() - 0.5) * 24
            );
          }
        }

        const toTarget = new THREE.Vector3().subVectors(u.targetPos, f.position);
        if (toTarget.length() > 0.6) {
          toTarget.normalize();
          f.position.x += toTarget.x * u.speed * delta;
          f.position.z += toTarget.z * u.speed * delta;
          f.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        }
      }

      // Animate legs
      const legWalk = Math.sin(this.animTime * (moveSpeed > u.speed ? 14 : 7)) * 0.45;
      if (u.legs) {
        u.legs[0].rotation.x = legWalk;
        u.legs[1].rotation.x = -legWalk;
        u.legs[2].rotation.x = -legWalk;
        u.legs[3].rotation.x = legWalk;
      }
      if (u.tail) {
        u.tail.rotation.y = Math.sin(this.animTime * 6) * 0.3;
      }

      f.position.y = this.terrain.getHeight(f.position.x, f.position.z);
    });
  }

  // Interact with or hit Fox
  interactFox(foxMesh, engine, audio, player, isAttack = false) {
    const u = foxMesh.userData;
    audio.playRootStep?.(1.8);
    engine.spawnParticles(foxMesh.position, 14, 0xd97706, 3, 0.12);
    u.fleeTimer = 5.0;
    if (isAttack) {
      if (window.showGameNotification) {
        window.showGameNotification('🦊 The nimble Fox scampered away into the underbrush!');
      }
    } else {
      player.inventory.acorns = (player.inventory.acorns || 0) + 2;
      player.soilBiomass += 25;
      if (window.showGameNotification) {
        window.showGameNotification('🦊 The friendly Hyrule Fox dropped 2 Acorns & Biomass!');
      }
    }
  }

  // Damage goblin with optional Ambush Critical Damage
  damageGoblin(goblinMesh, amount, engine, audio, isSneakStrike = false) {
    const u = goblinMesh.userData;
    const finalDamage = isSneakStrike ? amount * 3.0 : amount;
    u.hp -= finalDamage;

    // Knockback away from attack
    const knockDir = new THREE.Vector3(Math.sin(goblinMesh.rotation.y + Math.PI), 0, Math.cos(goblinMesh.rotation.y + Math.PI));
    goblinMesh.position.addScaledVector(knockDir, isSneakStrike ? 4.5 : 2.5);

    engine.spawnParticles(goblinMesh.position, isSneakStrike ? 24 : 12, 0xc2410c, 4, 0.12);

    if (u.hp <= 0) {
      // Goblin Defeated! Drops timber, fertilizer, and acorns
      engine.spawnParticles(goblinMesh.position, 35, 0x8b4513, 6, 0.18);
      this.scene.remove(goblinMesh);
      const idx = this.goblins.indexOf(goblinMesh);
      if (idx !== -1) this.goblins.splice(idx, 1);
      return {
        defeated: true,
        woodReward: u.isCaptain ? 45 : 20,
        biomassReward: u.isCaptain ? 50 : 30,
        acornReward: u.isCaptain ? 8 : 4
      };
    }

    return { defeated: false, damageDealt: finalDamage };
  }

  // Damage Blupee (drops Rupee/Stardust burst and vanishes)
  damageBlupee(blupeeMesh, amount, engine, audio, player) {
    audio.playBlupeeChime?.();
    engine.spawnParticles(blupeeMesh.position, 35, 0x38bdf8, 5, 0.15);
    engine.spawnCosmicBurst(blupeeMesh.position, 25);

    player.inventory.stardust = (player.inventory.stardust || 0) + 2;
    player.soilBiomass += 40;
    if (player.inventory.rupees !== undefined) player.inventory.rupees += 20;

    if (window.showGameNotification) {
      window.showGameNotification('✨ Yahaha! The mythical Blupee dropped sparkling Stardust & Rupees! (+2 Stardust, +40 Biomass)');
    }

    this.scene.remove(blupeeMesh);
    const idx = this.blupees.indexOf(blupeeMesh);
    if (idx !== -1) this.blupees.splice(idx, 1);
  }

  // Damage Elemental Chuchu (drops jelly & elemental explosion)
  damageChuchu(chuchuMesh, amount, engine, audio, player) {
    const u = chuchuMesh.userData;
    audio.playChuchuSquish?.();

    if (u.type === 'fire') {
      audio.playFireBurst?.();
      engine.spawnShockwave(chuchuMesh.position, 3.5, 0xef4444);
      engine.spawnParticles(chuchuMesh.position, 30, 0xef4444, 4, 0.15);
      if (window.showGameNotification) window.showGameNotification('🔥 Fire Chuchu exploded! (+1 Fire Jelly)');
    } else if (u.type === 'electric') {
      audio.playThunderSlam?.();
      engine.spawnShockwave(chuchuMesh.position, 4.0, 0xfacc15);
      engine.spawnParticles(chuchuMesh.position, 30, 0xfacc15, 5, 0.15);
      if (window.showGameNotification) window.showGameNotification('⚡ Electric Chuchu discharged! (+1 Electric Jelly)');
    } else {
      // Grass jelly heals player
      player.barkHp = Math.min(player.maxBarkHp, player.barkHp + 30);
      player.moisture = Math.min(player.maxMoisture, player.moisture + 25);
      engine.spawnParticles(chuchuMesh.position, 25, 0x22c55e, 3, 0.15);
      if (window.showGameNotification) window.showGameNotification('🍃 Grass Chuchu defeated! Restored +30 Bark HP & +25 Sap Moisture.');
    }

    player.soilBiomass += 20;
    if (player.inventory.chuchuJelly !== undefined) player.inventory.chuchuJelly++;

    this.scene.remove(chuchuMesh);
    const idx = this.chuchus.indexOf(chuchuMesh);
    if (idx !== -1) this.chuchus.splice(idx, 1);
  }

  // Damage Bubbulfrog (drops divine Bubbul Gem)
  damageBubbulfrog(frogMesh, amount, engine, audio, player) {
    audio.playBubbulfrogChime?.();
    engine.spawnCosmicBurst(frogMesh.position, 45);
    engine.spawnShockwave(frogMesh.position, 4.5, 0x38bdf8);

    player.inventory.stardust = (player.inventory.stardust || 0) + 3;
    player.soilBiomass += 65;
    if (player.inventory.bubbulGems !== undefined) player.inventory.bubbulGems++;

    if (window.showGameNotification) {
      window.showGameNotification('💎 Sacred Bubbul Gem collected from Bubbulfrog! (+3 Stardust, +65 Biomass)');
    }

    this.scene.remove(frogMesh);
    const idx = this.bubbulfrogs.indexOf(frogMesh);
    if (idx !== -1) this.bubbulfrogs.splice(idx, 1);
  }

  // Hit Cucco (flutters, increments hit count, triggers Cucco Swarm if provoked 3x)
  hitCucco(cuccoMesh, engine, audio, player) {
    const u = cuccoMesh.userData;
    u.hitCount = (u.hitCount || 0) + 1;
    audio.playCuccoCluck?.();
    engine.spawnParticles(cuccoMesh.position, 10, 0xf8fafc, 2.5, 0.1);

    // Flutter upwards
    cuccoMesh.position.y += 2.0;

    if (u.hitCount >= 3) {
      this.triggerCuccoSwarm(player, engine, audio);
      u.hitCount = 0;
    } else {
      if (window.showGameNotification) {
        window.showGameNotification(`🐔 Angry Cucco ruffled! (${u.hitCount}/3 hits before swarm attack!)`);
      }
    }
  }

  // Trigger Legendary Cucco Revenge Swarm
  triggerCuccoSwarm(player, engine, audio) {
    audio.playCuccoFlock?.();
    engine.applyScreenShake(0.4);

    if (window.showGameNotification) {
      window.showGameNotification('⚠️ SQUAWK! YOU PROVOKED THE CUCCO SWARM! RUN FOR COVER!');
    }

    const playerPos = player.position;
    const featherMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
    const combMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

    for (let i = 0; i < 9; i++) {
      const swCucco = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), featherMat);
      body.scale.set(0.85, 0.9, 1.2);
      swCucco.add(body);

      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.14), combMat);
      comb.position.set(0, 0.35, 0.1);
      swCucco.add(comb);

      const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.28), featherMat);
      wingL.position.set(-0.21, 0.1, 0);
      const wingR = wingL.clone();
      wingR.position.x = 0.21;
      swCucco.add(wingL);
      swCucco.add(wingR);

      // Spawn high above player
      const angle = (i / 9) * Math.PI * 2;
      swCucco.position.set(
        playerPos.x + Math.cos(angle) * 12,
        playerPos.y + 14 + Math.random() * 4,
        playerPos.z + Math.sin(angle) * 12
      );

      this.scene.add(swCucco);
      this.cuccoSwarm.push({
        mesh: swCucco,
        angle,
        radius: 3.5 + Math.random() * 4.5,
        life: 11.0,
        wingL,
        wingR
      });
    }
  }

  // Damage Aerocuda (shoots down flying sky beast)
  damageAerocuda(aerocudaMesh, amount, engine, audio, player) {
    const u = aerocudaMesh.userData;
    u.hp -= amount;
    engine.spawnParticles(aerocudaMesh.position, 15, 0x1e293b, 3, 0.12);

    if (u.hp <= 0) {
      audio.playHeadSlam?.(0.4);
      engine.spawnParticles(aerocudaMesh.position, 30, 0xfacc15, 5, 0.18);
      player.inventory.acorns += 6;
      player.soilBiomass += 45;

      if (window.showGameNotification) {
        window.showGameNotification('🎯 Shot down the soaring Aerocuda! (+6 Acorns, +45 Biomass)');
      }

      this.scene.remove(aerocudaMesh);
      const idx = this.aerocudas.indexOf(aerocudaMesh);
      if (idx !== -1) this.aerocudas.splice(idx, 1);
    }
  }
}

export const villagers = new CreatureVillagers();
