import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

// Procedural 3D Terrain with Rivers, Lakes, Biomes, and Height Queries
export class WorldTerrain {
  constructor() {
    this.terrainMesh = null;
    this.waterMesh = null;
    this.waterNormalMap = null;
    this.size = 360;
    this.segments = 160;
    this.waterLevel = 0.0;
    this.waveTimer = 0;
  }

  // Smooth pseudo-noise terrain height function
  getHeight(x, z) {
    // 1. Base rolling hills
    let h = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 6.0;
    h += Math.sin(x * 0.04 + 1.2) * Math.cos(z * 0.04 + 0.8) * 2.8;
    h += Math.sin((x + z) * 0.08) * 1.0;

    // 2. Winding River Channel: cuts through x ~= sin(z * 0.03) * 25
    const riverCenter = Math.sin(z * 0.025) * 28.0;
    const distToRiver = Math.abs(x - riverCenter);
    const riverWidth = 14.0;

    if (distToRiver < riverWidth) {
      const riverFactor = Math.cos((distToRiver / riverWidth) * (Math.PI / 2));
      h -= riverFactor * 5.5; // Dig riverbed below water level
    }

    // 3. Central Lake at z ~ 60, x ~ 0
    const lakeDx = x;
    const lakeDz = z - 65;
    const distToLake = Math.sqrt(lakeDx * lakeDx + lakeDz * lakeDz);
    const lakeRadius = 38.0;
    if (distToLake < lakeRadius) {
      const lakeFactor = Math.cos((distToLake / lakeRadius) * (Math.PI / 2));
      h -= lakeFactor * 6.5; // Deep lake basin
    }

    // 4. Woodcutter Goblin Outpost clearing at x: 65, z: -40
    const distToCamp = Math.hypot(x - 65, z - (-40));
    if (distToCamp < 25) {
      h = h * 0.3 + 1.5; // Flatten outpost ground
    }

    // 5. Beaverfolk Stilt Village riverbank at x: -28, z: 25
    const distToBeaver = Math.hypot(x - (-28), z - 25);
    if (distToBeaver < 20) {
      h = Math.max(-0.6, Math.min(1.2, h)); // Gentle river landing
    }

    return h;
  }

  isWater(x, z) {
    return this.getHeight(x, z) < this.waterLevel - 0.2;
  }

  getWaterDepth(x, z) {
    const groundY = this.getHeight(x, z);
    return Math.max(0, this.waterLevel - groundY);
  }

  generate(scene) {
    // 1. Terrain Mesh
    const geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = [];

    const grassColor = new THREE.Color(0x3a7d34);
    const lushColor = new THREE.Color(0x4e9c3e);
    const dirtColor = new THREE.Color(0x735135);
    const sandColor = new THREE.Color(0xd2b48c);
    const stoneColor = new THREE.Color(0x696969);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getHeight(x, z);
      pos.setY(i, y);

      // Vertex Coloring according to height and slope
      const col = new THREE.Color();
      if (y < this.waterLevel + 0.5) {
        // Shoreline sand
        col.copy(sandColor).offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
      } else if (y < this.waterLevel + 1.8) {
        // Riverbank rich dirt
        col.copy(dirtColor);
      } else if (y < 9.0) {
        // Sylvan grass
        const mix = (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 0.5;
        col.copy(grassColor).lerp(lushColor, Math.max(0, Math.min(1, mix)));
      } else {
        // High mountain stone
        col.copy(stoneColor);
      }
      colors.push(col.r, col.g, col.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const grassTex = TextureGenerator.createGrassTexture();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: grassTex,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: false
    });

    this.terrainMesh = new THREE.Mesh(geom, terrainMat);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.name = 'Terrain';
    scene.add(this.terrainMesh);

    // 2. Realistic River & Lake Water Surface with Wave Normal Map
    const waterGeom = new THREE.PlaneGeometry(this.size, this.size, 96, 96);
    waterGeom.rotateX(-Math.PI / 2);

    this.waterNormalMap = TextureGenerator.createWaterNormalMap();

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1488a8,
      roughness: 0.04,
      metalness: 0.55,
      normalMap: this.waterNormalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      transparent: true,
      opacity: 0.86
    });

    this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.waterMesh.position.y = this.waterLevel;
    this.waterMesh.receiveShadow = true;
    this.waterMesh.name = 'WaterPlane';
    scene.add(this.waterMesh);

    return this;
  }

  update(delta, time) {
    this.waveTimer += delta;
    // Animate water normal map UVs for moving ripples and surface chop
    if (this.waterNormalMap) {
      this.waterNormalMap.offset.x = (this.waveTimer * 0.025) % 1;
      this.waterNormalMap.offset.y = (this.waveTimer * 0.038) % 1;
    }
    // Gentle water surface tide animation
    if (this.waterMesh) {
      this.waterMesh.position.y = this.waterLevel + Math.sin(time * 1.6) * 0.05;
    }
  }
}

export const terrain = new WorldTerrain();

