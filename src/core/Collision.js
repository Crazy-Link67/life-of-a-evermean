import * as THREE from 'three';

// High-Performance 2D/3D Solid Collision System for Life of an Evermean
// Prevents player and entities from walking through trees, full cylindrical logs,
// boulders, ancient ruins, goblin camp palisades, and dungeon walls.
export class CollisionSystem {
  constructor() {
    this.cylinders = [];  // Vertical cylinders: { x, z, radius, minY, maxY, name }
    this.capsules = [];   // Horizontal oriented capsules (for fallen logs): { x1, z1, x2, z2, radius, minY, maxY, name }
    this.boxes = [];      // Axis-aligned / oriented boxes: { minX, maxX, minZ, maxZ, minY, maxY, name }
    this.spheres = [];    // Spheres: { x, y, z, radius, name }
  }

  clear() {
    this.cylinders.length = 0;
    this.capsules.length = 0;
    this.boxes.length = 0;
    this.spheres.length = 0;
  }

  // Register a vertical cylindrical obstacle (tree trunks, stone pillars, watchtower posts)
  addCylinder(x, z, radius, minY = -200, maxY = 200, name = 'CylinderObstacle') {
    this.cylinders.push({ x, z, radius, minY, maxY, name });
    return this.cylinders[this.cylinders.length - 1];
  }

  // Register a horizontal oriented cylinder / capsule (e.g. fallen hardwood logs)
  addCapsule(x1, z1, x2, z2, radius, minY = -200, maxY = 200, name = 'LogCapsule') {
    this.capsules.push({ x1, z1, x2, z2, radius, minY, maxY, name });
    return this.capsules[this.capsules.length - 1];
  }

  // Register an axis-aligned box obstacle (dungeon walls, camp barricades, stone slabs)
  addBox(minX, maxX, minZ, maxZ, minY = -200, maxY = 200, name = 'BoxObstacle') {
    this.boxes.push({ minX, maxX, minZ, maxZ, minY, maxY, name });
    return this.boxes[this.boxes.length - 1];
  }

  // Register a 3D spherical obstacle (granite boulders, rock clusters)
  addSphere(x, y, z, radius, name = 'SphereObstacle') {
    this.spheres.push({ x, y, z, radius, name });
    return this.spheres[this.spheres.length - 1];
  }

  // Remove obstacles matching a specific name or reference
  removeByName(name) {
    this.cylinders = this.cylinders.filter(c => c.name !== name);
    this.capsules = this.capsules.filter(c => c.name !== name);
    this.boxes = this.boxes.filter(b => b.name !== name);
    this.spheres = this.spheres.filter(s => s.name !== name);
  }

  // Resolve player collision against all solid obstacles in the world.
  // Modifies playerPos in-place with smooth sliding response.
  // Returns true if any collision was resolved.
  resolvePlayerCollision(playerPos, playerRadius = 0.55, playerHeight = 2.2) {
    let collided = false;
    const px = playerPos.x;
    const py = playerPos.y;
    const pz = playerPos.z;
    const footY = py - playerHeight * 0.5;
    const headY = py + playerHeight * 0.5;

    // 1. Resolve Vertical Cylinders (Tree trunks, pillars, posts)
    for (let i = 0; i < this.cylinders.length; i++) {
      const c = this.cylinders[i];
      if (headY < c.minY || footY > c.maxY) continue;

      const dx = playerPos.x - c.x;
      const dz = playerPos.z - c.z;
      const distSq = dx * dx + dz * dz;
      const minDist = playerRadius + c.radius;

      if (distSq < minDist * minDist && distSq > 0.00001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const pushX = (dx / dist) * overlap;
        const pushZ = (dz / dist) * overlap;
        playerPos.x += pushX;
        playerPos.z += pushZ;
        collided = true;
      }
    }

    // 2. Resolve Horizontal Capsules (Full fallen logs)
    for (let i = 0; i < this.capsules.length; i++) {
      const cap = this.capsules[i];
      if (headY < cap.minY || footY > cap.maxY) continue;

      // Project player position onto the capsule line segment (x1, z1) -> (x2, z2)
      const segDx = cap.x2 - cap.x1;
      const segDz = cap.z2 - cap.z1;
      const segLenSq = segDx * segDx + segDz * segDz;

      let t = 0;
      if (segLenSq > 0.0001) {
        t = ((playerPos.x - cap.x1) * segDx + (playerPos.z - cap.z1) * segDz) / segLenSq;
        t = Math.max(0, Math.min(1, t));
      }

      const closestX = cap.x1 + t * segDx;
      const closestZ = cap.z1 + t * segDz;

      const dx = playerPos.x - closestX;
      const dz = playerPos.z - closestZ;
      const distSq = dx * dx + dz * dz;
      const minDist = playerRadius + cap.radius;

      if (distSq < minDist * minDist && distSq > 0.00001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        playerPos.x += (dx / dist) * overlap;
        playerPos.z += (dz / dist) * overlap;
        collided = true;
      }
    }

    // 3. Resolve Axis-Aligned Boxes (Dungeon chamber walls, camp palisades)
    for (let i = 0; i < this.boxes.length; i++) {
      const b = this.boxes[i];
      if (headY < b.minY || footY > b.maxY) continue;

      // Closest point on box
      const cx = Math.max(b.minX, Math.min(playerPos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(playerPos.z, b.maxZ));

      const dx = playerPos.x - cx;
      const dz = playerPos.z - cz;
      const distSq = dx * dx + dz * dz;

      // If player is inside box or overlapping perimeter
      if (playerPos.x >= b.minX && playerPos.x <= b.maxX &&
          playerPos.z >= b.minZ && playerPos.z <= b.maxZ) {
        // Player is strictly inside: push to nearest face
        const dLeft = playerPos.x - b.minX;
        const dRight = b.maxX - playerPos.x;
        const dFront = playerPos.z - b.minZ;
        const dBack = b.maxZ - playerPos.z;
        const minEdge = Math.min(dLeft, dRight, dFront, dBack);

        if (minEdge === dLeft) playerPos.x = b.minX - playerRadius;
        else if (minEdge === dRight) playerPos.x = b.maxX + playerRadius;
        else if (minEdge === dFront) playerPos.z = b.minZ - playerRadius;
        else playerPos.z = b.maxZ + playerRadius;
        collided = true;
      } else if (distSq < playerRadius * playerRadius && distSq > 0.00001) {
        // Overlapping exterior edge
        const dist = Math.sqrt(distSq);
        const overlap = playerRadius - dist;
        playerPos.x += (dx / dist) * overlap;
        playerPos.z += (dz / dist) * overlap;
        collided = true;
      }
    }

    // 4. Resolve 3D Spheres (Granite boulders & rock clusters)
    for (let i = 0; i < this.spheres.length; i++) {
      const s = this.spheres[i];
      const dx = playerPos.x - s.x;
      const dy = playerPos.y - s.y;
      const dz = playerPos.z - s.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const minDist = playerRadius + s.radius;

      if (distSq < minDist * minDist && distSq > 0.00001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        // Apply horizontal-biased push
        const hDist = Math.hypot(dx, dz);
        if (hDist > 0.001) {
          playerPos.x += (dx / hDist) * overlap;
          playerPos.z += (dz / hDist) * overlap;
        } else {
          playerPos.x += overlap;
        }
        collided = true;
      }
    }

    return collided;
  }
}

export const collision = new CollisionSystem();
