import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

// Procedural 3D Terrain with Rivers, Lakes, Biomes, and Height Queries
export class WorldTerrain {
  constructor() {
    this.terrainMesh = null;
    this.waterMesh = null;
    this.waterNormalMap = null;
    this.size = 640;
    this.segments = 200;
    this.waterLevel = 0.0;
    this.waveTimer = 0;
    this.chasmCenter = new THREE.Vector2(120, 120);
    this.depthsFloorY = -90.0;
  }

  // Realistic multi-octave fractal terrain height function with natural erosion & landmark basins
  getHeight(x, z, currentY = 10) {
    // 0. Check if player is down in The Depths realm (y < -35)
    if (currentY < -35) {
      // Subterranean underworld floor with jagged obsidian plateaus and gloom trenches
      let dh = this.depthsFloorY;
      dh += Math.sin(x * 0.03 + 1.2) * Math.cos(z * 0.028 + 0.5) * 3.5;
      dh += Math.sin(x * 0.08 - z * 0.07) * 1.2;
      return dh;
    }

    // 1. Continental macro swell & mountain knolls (low freq, high amplitude)
    let h = Math.sin(x * 0.007 + 0.4) * Math.cos(z * 0.006 + 0.6) * 12.0;

    // 2. Rolling hills and undulating forest valleys (mid freq)
    h += Math.sin(x * 0.018 + 1.4) * Math.cos(z * 0.015 + 0.8) * 5.5;

    // 3. Craggy rock ridges & mountain bluffs (ridge noise: 1 - |sin|)
    const rNoise = 1.0 - Math.abs(Math.sin(x * 0.032 + z * 0.021));
    h += (rNoise * rNoise) * 4.8;

    // 4. Northwest High Mountain Crest (Rocky Peaks)
    if (x < -80 && z < -60) {
      const mDist = Math.hypot(x - (-180), z - (-150));
      if (mDist < 140) {
        const mFactor = Math.cos((mDist / 140) * (Math.PI / 2));
        h += (mFactor * mFactor) * 18.0;
      }
    }

    // 5. Subtle micro ground loam undulations
    h += Math.sin((x * 0.08 + z * 0.06)) * 0.75;
    h += Math.cos(x * 0.12 - z * 0.1) * 0.35;

    // 6. Winding River Channel: cuts smoothly through x ~= sin(z * 0.018) * 42
    const riverCenter = Math.sin(z * 0.018) * 42.0;
    const distToRiver = Math.abs(x - riverCenter);
    const riverWidth = 18.0;

    if (distToRiver < riverWidth) {
      const riverFactor = Math.cos((distToRiver / riverWidth) * (Math.PI / 2));
      h -= (riverFactor * riverFactor) * 7.5; // Deep parabolic river basin for underwater diving!
    }

    // 7. Central Sylvan Lake Basin at z ~ 75, x ~ 0 (Expansive deep diving lake)
    const lakeDx = x;
    const lakeDz = z - 75;
    const distToLake = Math.sqrt(lakeDx * lakeDx + lakeDz * lakeDz);
    const lakeRadius = 56.0;
    if (distToLake < lakeRadius) {
      const lakeFactor = Math.cos((distToLake / lakeRadius) * (Math.PI / 2));
      h -= (lakeFactor * lakeFactor) * 9.2; // 9.2 meters deep for full 3D underwater exploration!
    }

    // 8. Woodland Clearing & Spawn Haven at x: 0, z: 10
    const distToSpawn = Math.hypot(x, z - 10);
    if (distToSpawn < 26) {
      h = THREE.MathUtils.lerp(1.4, h, distToSpawn / 26);
    }

    // 9. Camp 1: Woodcutter Goblin Outpost clearing at x: 75, z: -50
    const distToCamp1 = Math.hypot(x - 75, z - (-50));
    if (distToCamp1 < 28) {
      h = h * 0.25 + 2.0;
    }

    // 10. Camp 2: Mountain Skull Fortress at x: -180, z: -150
    const distToCamp2 = Math.hypot(x - (-180), z - (-150));
    if (distToCamp2 < 34) {
      h = h * 0.3 + 14.5; // High fortress plateau
    }

    // 11. Camp 3: River Marauder Encampment at x: -70, z: 130
    const distToCamp3 = Math.hypot(x - (-70), z - 130);
    if (distToCamp3 < 26) {
      h = Math.max(0.6, Math.min(2.5, h)); // Riverside landing
    }

    // 12. Camp 4: Ruined Castle Stronghold at x: 190, z: -140
    const distToCamp4 = Math.hypot(x - 190, z - (-140));
    if (distToCamp4 < 32) {
      h = h * 0.3 + 6.0; // Ancient ruined stone terrace
    }

    // 13. Beaverfolk Stilt Village riverbank at x: -35, z: 30
    const distToBeaver = Math.hypot(x - (-35), z - 30);
    if (distToBeaver < 24) {
      h = Math.max(-0.6, Math.min(1.2, h));
    }

    // 14. Proper Gloom Chasm Descent at x: 120, z: 120 (Plunges from surface to -90m Depths!)
    const distToChasm = Math.hypot(x - this.chasmCenter.x, z - this.chasmCenter.y);
    if (distToChasm < 28) {
      if (distToChasm <= 14) {
        // Direct open chasm vertical pit plunging down to the Depths floor!
        h = this.depthsFloorY;
      } else {
        // Steep conical crater walls
        const t = (distToChasm - 14) / 14; // 0 at inner rim, 1 at outer rim
        const surfaceRimY = Math.max(3.0, h);
        h = THREE.MathUtils.lerp(this.depthsFloorY, surfaceRimY, t * t);
      }
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
    // 1. High-Resolution Realistic Terrain Mesh
    this.segments = 180;
    const geom = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.getHeight(x, z));
    }

    geom.computeVertexNormals();

    const normals = geom.attributes.normal;
    const colors = [];

    // Authentic Zelda: TOTK Palette
    const meadowGrass = new THREE.Color(0x387e2b);
    const sunnyGrass = new THREE.Color(0x56a63c);
    const darkGrass = new THREE.Color(0x28631f);
    const forestLoam = new THREE.Color(0x5c4632);
    const cliffRock = new THREE.Color(0x4a4744);
    const darkStrata = new THREE.Color(0x363330);
    const shoreSand = new THREE.Color(0xc7ab7a);
    const wetPebble = new THREE.Color(0x8a7758);
    const gloomScorched = new THREE.Color(0x18040d);
    const maliceCrimson = new THREE.Color(0x831843);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ny = normals.getY(i);
      const slope = 1.0 - Math.max(0, ny); // 0 = perfectly flat, 1 = sheer cliff

      const distToChasm = Math.hypot(x - this.chasmCenter.x, z - this.chasmCenter.y);
      const col = new THREE.Color();

      if (distToChasm < 28) {
        // Gloom Chasm Malice Scorch & Obsidian Abyss
        const factor = (28 - distToChasm) / 28;
        col.copy(gloomScorched).lerp(maliceCrimson, factor);
      } else if (y < this.waterLevel + 0.4) {
        // Waterline & Shoreline Sand / Riverbed
        const sandMix = THREE.MathUtils.clamp((y - (this.waterLevel - 3.0)) / 3.4, 0, 1);
        col.copy(wetPebble).lerp(shoreSand, sandMix);
        col.offsetHSL(0, 0, (Math.random() - 0.5) * 0.04);
      } else if (slope > 0.35) {
        // Steep Rock Crags & Cliff Bluffs (Slope-Based Rock Splatting)
        const rockMix = THREE.MathUtils.clamp((slope - 0.35) / 0.35, 0, 1);
        col.copy(cliffRock).lerp(darkStrata, rockMix);
        // Subtle sedimentary horizontal banding
        const strata = Math.sin(y * 1.5) * 0.04;
        col.offsetHSL(0, 0, strata);
      } else if (slope > 0.20) {
        // Intermediate transition: Forest loam, dry roots and mossy rock
        const transMix = (slope - 0.20) / 0.15;
        const grassBase = meadowGrass.clone().offsetHSL(0, 0, (Math.sin(x * 0.1 + z * 0.1) * 0.05));
        col.copy(grassBase).lerp(forestLoam, transMix);
      } else {
        // Flat Meadows, Plains, and Woodland Glades
        const patchNoise = (Math.sin(x * 0.05) + Math.cos(z * 0.05)) * 0.5;
        col.copy(meadowGrass).lerp(sunnyGrass, THREE.MathUtils.clamp(patchNoise + 0.4, 0, 1));
        if (Math.sin(x * 0.18 + z * 0.15) > 0.7) {
          col.lerp(darkGrass, 0.4); // Clover & shaded moss patches
        }
      }

      colors.push(col.r, col.g, col.b);
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const grassTex = TextureGenerator.createGrassTexture();
    const terrainNormalMap = TextureGenerator.createTerrainDetailNormalMap();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: grassTex,
      normalMap: terrainNormalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.82,
      metalness: 0.04,
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

