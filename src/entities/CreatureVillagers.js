import * as THREE from 'three';

// Advanced Creature & Wildlife System
// Features: Detailed Bokoblin Woodcutters, Expressive Beaverfolk, Leaf-Masked Koroks, and Forest Deer
export class CreatureVillagers {
  constructor() {
    this.goblins = [];
    this.beavers = [];
    this.koroks = [];
    this.deer = [];
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
      if (colony && colony.structures.length > 0 && Math.random() < 0.05 && u.state === 'patrol') {
        raidTarget = colony.structures[0].group.position;
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
}

export const villagers = new CreatureVillagers();
