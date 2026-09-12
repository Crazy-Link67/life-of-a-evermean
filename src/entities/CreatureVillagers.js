import * as THREE from 'three';

// NPC AI: Woodcutter Goblins (hostile lumberjacks) and Beaverfolk (friendly river dwellers)
export class CreatureVillagers {
  constructor() {
    this.goblins = [];
    this.beavers = [];
    this.scene = null;
    this.terrain = null;
  }

  init(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;

    // Spawn Woodcutter Goblins around camp (x: 65, z: -40)
    for (let i = 0; i < 6; i++) {
      this.spawnGoblin(65 + (Math.random() - 0.5) * 20, -40 + (Math.random() - 0.5) * 20);
    }

    // Spawn River Beaverfolk around village (x: -28, z: 25)
    for (let i = 0; i < 5; i++) {
      this.spawnBeaver(-28 + (Math.random() - 0.5) * 16, 25 + (Math.random() - 0.5) * 16);
    }
  }

  // Create a 3D Woodcutter Goblin carrying an iron axe
  spawnGoblin(x, z) {
    const y = this.terrain.getHeight(x, z);
    const goblinGroup = new THREE.Group();
    goblinGroup.position.set(x, y, z);

    // Goblin Body (Greenish skin, leather vest)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x6b8e23, roughness: 0.8 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x71717a, roughness: 0.4, metalness: 0.7 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.7, 6), vestMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    goblinGroup.add(torso);

    // Head with pointy ears
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), skinMat);
    head.position.y = 1.35;
    goblinGroup.add(head);

    [-0.24, 0.24].forEach(earX => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 4), skinMat);
      ear.rotateZ(earX > 0 ? -Math.PI / 3 : Math.PI / 3);
      ear.position.set(earX, 1.4, 0);
      goblinGroup.add(ear);
    });

    // Legs
    [-0.15, 0.15].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 5), vestMat);
      leg.position.set(lx, 0.3, 0);
      goblinGroup.add(leg);
    });

    // Woodcutter Axe
    const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), vestMat);
    axeHandle.rotation.x = Math.PI / 3;
    axeHandle.position.set(0.35, 0.8, 0.25);
    const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.22), ironMat);
    axeBlade.position.set(0, 0.35, 0);
    axeHandle.add(axeBlade);
    goblinGroup.add(axeHandle);

    goblinGroup.userData = {
      isGoblin: true,
      hp: 45,
      maxHp: 45,
      speed: 3.5,
      attackDamage: 12,
      attackCooldown: 0,
      state: 'patrol', // patrol, chase, attack
      targetPos: new THREE.Vector3(x, y, z),
      patrolTimer: Math.random() * 4,
      campCenter: new THREE.Vector3(65, 0, -40)
    };

    this.scene.add(goblinGroup);
    this.goblins.push(goblinGroup);
  }

  // Create friendly River Beaver/Otter Folk
  spawnBeaver(x, z) {
    const y = Math.max(0.0, this.terrain.getHeight(x, z));
    const beaverGroup = new THREE.Group();
    beaverGroup.position.set(x, y, z);

    const furMat = new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.9 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xa07855, roughness: 0.9 });

    // Beaver Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), furMat);
    body.scale.set(1.0, 0.8, 1.4);
    body.position.y = 0.3;
    body.castShadow = true;
    beaverGroup.add(body);

    // Paddle Tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.5), furMat);
    tail.position.set(0, 0.15, -0.6);
    tail.rotation.x = -0.2;
    beaverGroup.add(tail);

    // Head
    const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 7, 7), bellyMat);
    bHead.position.set(0, 0.4, 0.45);
    beaverGroup.add(bHead);

    beaverGroup.userData = {
      isBeaver: true,
      speed: 2.2,
      swimSpeed: 4.0,
      state: 'swim_or_wander',
      targetPos: new THREE.Vector3(x, y, z),
      timer: Math.random() * 5,
      homeCenter: new THREE.Vector3(-28, 0, 25)
    };

    this.scene.add(beaverGroup);
    this.beavers.push(beaverGroup);
  }

  update(delta, playerEvermean, engine, audio) {
    const playerPos = playerEvermean.position;
    const isPlayerDisguised = playerEvermean.isDisguised;

    // 1. Update Woodcutter Goblins AI
    for (let i = this.goblins.length - 1; i >= 0; i--) {
      const g = this.goblins[i];
      const u = g.userData;

      if (u.attackCooldown > 0) u.attackCooldown -= delta;

      const distToPlayer = g.position.distanceTo(playerPos);

      // Behavior Logic:
      // If player is disguised as a normal tree (`isPlayerDisguised`), goblins IGNORE the player!
      if (!isPlayerDisguised && distToPlayer < 18) {
        // Spotted the moving Evermean tree monster! RUSH TO CHOP IT!
        u.state = 'chase';
        const dir = new THREE.Vector3().subVectors(playerPos, g.position).normalize();
        g.position.x += dir.x * u.speed * delta;
        g.position.z += dir.z * u.speed * delta;
        g.rotation.y = Math.atan2(dir.x, dir.z);

        // Attack if in melee range
        if (distToPlayer < 2.2 && u.attackCooldown <= 0) {
          u.attackCooldown = 1.5;
          // Goblin swings axe at Evermean
          audio.playHeadSlam(0.4);
          playerEvermean.takeDamage(u.attackDamage, 'Axe Chop');
          engine.applyScreenShake(0.2);
        }
      } else {
        // Normal patrol around camp
        u.state = 'patrol';
        u.patrolTimer -= delta;
        if (u.patrolTimer <= 0) {
          u.patrolTimer = 3 + Math.random() * 4;
          u.targetPos.set(
            u.campCenter.x + (Math.random() - 0.5) * 30,
            0,
            u.campCenter.z + (Math.random() - 0.5) * 30
          );
        }

        const toTarget = new THREE.Vector3().subVectors(u.targetPos, g.position);
        if (toTarget.length() > 1.0) {
          toTarget.normalize();
          g.position.x += toTarget.x * (u.speed * 0.5) * delta;
          g.position.z += toTarget.z * (u.speed * 0.5) * delta;
          g.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        }
      }

      // Height snapping
      g.position.y = this.terrain.getHeight(g.position.x, g.position.z);
    }

    // 2. Update Friendly Beavers AI
    this.beavers.forEach(b => {
      const u = b.userData;
      u.timer -= delta;
      if (u.timer <= 0) {
        u.timer = 4 + Math.random() * 5;
        u.targetPos.set(
          u.homeCenter.x + (Math.random() - 0.5) * 25,
          0,
          u.homeCenter.z + (Math.random() - 0.5) * 25
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
      }

      const gh = this.terrain.getHeight(b.position.x, b.position.z);
      b.position.y = isWater ? 0.0 : gh;
    });
  }

  // Damage goblin when player hits them with Head-Slam or Mantis Scythe
  damageGoblin(goblinMesh, amount, engine, audio) {
    const u = goblinMesh.userData;
    u.hp -= amount;

    // Knockback
    const knockDir = new THREE.Vector3(Math.sin(goblinMesh.rotation.y + Math.PI), 0, Math.cos(goblinMesh.rotation.y + Math.PI));
    goblinMesh.position.addScaledVector(knockDir, 2.5);

    engine.spawnParticles(goblinMesh.position, 12, 0x6b8e23, 3, 0.1);

    if (u.hp <= 0) {
      // Goblin Defeated! Drops timber and fertilizer
      engine.spawnParticles(goblinMesh.position, 25, 0x8b4513, 5, 0.15);
      this.scene.remove(goblinMesh);
      const idx = this.goblins.indexOf(goblinMesh);
      if (idx !== -1) this.goblins.splice(idx, 1);
      return { defeated: true, woodReward: 20, biomassReward: 30 };
    }

    return { defeated: false };
  }
}

export const villagers = new CreatureVillagers();

