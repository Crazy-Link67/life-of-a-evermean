import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

// Procedural 3D Evermean Generator: creates authentic TOTK-styled living tree models
// with tree bark, gnarled limbs, pointy root legs, and customizable elemental/animal adaptations.

export class TreeModelGenerator {
  // Pre-configured species presets
  static PRESETS = {
    oak: {
      name: 'Great Oak Evermean',
      category: 'classic',
      description: 'The ancient sturdy forest disguise tree from Tears of the Kingdom. Heavy bark armor, massive shockwave head-slam.',
      barkColor: '#5c4033',
      barkRoughness: 0.9,
      foliageColor: '#2e8540',
      foliageType: 'deciduous',
      legCount: 4,
      legType: 'sturdy',
      crestType: 'blunt_stump',
      barkHealthMult: 1.5,
      speedMult: 0.9,
      slamRadiusMult: 1.4,
      element: 'none'
    },
    birch: {
      name: 'Pale Birch Evermean',
      category: 'classic',
      description: 'Slender, pale-barked woodland stalker. Agile pointy roots allow high-speed skittering and leaping.',
      barkColor: '#eae5d8',
      barkRoughness: 0.7,
      foliageColor: '#85a832',
      foliageType: 'deciduous',
      legCount: 3,
      legType: 'pointy',
      crestType: 'blunt_stump',
      barkHealthMult: 0.85,
      speedMult: 1.35,
      slamRadiusMult: 0.9,
      element: 'none'
    },
    fire: {
      name: 'Infernal Fire Evermean',
      category: 'elemental',
      description: 'Born in volcanic woodlands. Smoldering charred bark with glowing molten fissures, flame slam ignites ground.',
      barkColor: '#221915',
      barkRoughness: 0.95,
      foliageColor: '#ff4d00',
      foliageType: 'embers',
      legCount: 4,
      legType: 'pointy',
      crestType: 'spiked_crown',
      barkHealthMult: 1.1,
      speedMult: 1.0,
      slamRadiusMult: 1.3,
      element: 'fire',
      glowColor: 0xff3b00
    },
    lightning: {
      name: 'Stormvolt Lightning Evermean',
      category: 'elemental',
      description: 'Ancient tree shattered by lightning, coursing with thunderous sap. High agility, electric shockwave slam.',
      barkColor: '#323c46',
      barkRoughness: 0.8,
      foliageColor: '#00e5ff',
      foliageType: 'sparking',
      legCount: 4,
      legType: 'pointy',
      crestType: 'spiked_crown',
      barkHealthMult: 0.95,
      speedMult: 1.25,
      slamRadiusMult: 1.2,
      element: 'lightning',
      glowColor: 0x00f0ff
    },
    grass: {
      name: 'Verdant Flora Evermean',
      category: 'elemental',
      description: 'Deep rainforest guardian draped in vibrant moss and blooming vines. Accelerated photosynthesis and root regeneration.',
      barkColor: '#473d2a',
      barkRoughness: 0.85,
      foliageColor: '#10b943',
      foliageType: 'lush_flowering',
      legCount: 4,
      legType: 'sturdy',
      crestType: 'foliage_knot',
      barkHealthMult: 1.2,
      speedMult: 1.05,
      slamRadiusMult: 1.1,
      element: 'grass',
      glowColor: 0x34d399
    },
    frost: {
      name: 'Glacial Frost Evermean',
      category: 'elemental',
      description: 'Sub-zero mountain timber coated in hard permafrost and icicles. Freezes water beneath roots and chills targets.',
      barkColor: '#c5d8e6',
      barkRoughness: 0.75,
      foliageColor: '#7dd3fc',
      foliageType: 'icicle_needles',
      legCount: 4,
      legType: 'pointy',
      crestType: 'spiked_crown',
      barkHealthMult: 1.3,
      speedMult: 0.95,
      slamRadiusMult: 1.15,
      element: 'frost',
      glowColor: 0xbae6fd
    },
    mantis: {
      name: 'Praying Mantis Evermean',
      category: 'animal',
      description: 'A terrifying woodland mimic tree fused with raptorial wooden scythe boughs and pointy tripod roots. Ambush predator.',
      barkColor: '#4a5320',
      barkRoughness: 0.85,
      foliageColor: '#65a30d',
      foliageType: 'scythe_twigs',
      legCount: 6,
      legType: 'mantis_claws',
      crestType: 'mantis_crest',
      hasMantisScythes: true,
      barkHealthMult: 1.0,
      speedMult: 1.2,
      slamRadiusMult: 1.1,
      element: 'beast',
      glowColor: 0x84cc16
    },
    stag: {
      name: 'Horned Stag Evermean',
      category: 'animal',
      description: 'Dense ironwood trunk adorned with towering gnarled branch antlers. Charging head-ram tears through defenses.',
      barkColor: '#483526',
      barkRoughness: 0.9,
      foliageColor: '#365314',
      foliageType: 'deciduous',
      legCount: 4,
      legType: 'sturdy',
      crestType: 'antler_boughs',
      hasAntlers: true,
      barkHealthMult: 1.4,
      speedMult: 1.1,
      slamRadiusMult: 1.35,
      element: 'beast'
    },
    spider: {
      name: 'Arachnid Weaver Evermean',
      category: 'animal',
      description: 'Hollow burl trunk walking on 8 gnarled pointy wooden roots. Skitters rapidly across all terrain, weaving bramble vines.',
      barkColor: '#27201c',
      barkRoughness: 0.9,
      foliageColor: '#450a0a',
      foliageType: 'spiky',
      legCount: 8,
      legType: 'spider_roots',
      crestType: 'hollow_knot',
      barkHealthMult: 1.05,
      speedMult: 1.3,
      slamRadiusMult: 1.0,
      element: 'beast'
    },
    cosmic: {
      name: 'Ascended Cosmic Evermean',
      category: 'cosmic',
      description: 'The ultimate apex form. An ancient world-tree trunk pulsing with starlight leylines and a swirling nebula canopy.',
      barkColor: '#1e1435',
      barkRoughness: 0.7,
      foliageColor: '#c084fc',
      foliageType: 'cosmic_nebula',
      legCount: 4,
      legType: 'pointy',
      crestType: 'starlight_crown',
      barkHealthMult: 2.5,
      speedMult: 1.4,
      slamRadiusMult: 2.0,
      element: 'cosmic',
      glowColor: 0xa855f7
    }
  };

  // Build a complete, organic 3D Evermean model
  static createEvermeanModel(config = {}, stage = 1) {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'EvermeanRoot';

    // Scaling based on growth stage (1: Sprout, 2: Sapling, 3: Mature, 4: Elder, 5: Cosmic)
    const stageScales = [0.45, 0.75, 1.0, 1.45, 1.8];
    const baseScale = stageScales[Math.min(stage - 1, stageScales.length - 1)];
    const heightMult = (config.heightScale || 1.0) * baseScale;
    const girthMult = (config.girthScale || 1.0) * baseScale;

    // Materials
    const barkColorHex = new THREE.Color(config.barkColor || '#5c4033');
    const barkMaterial = new THREE.MeshStandardMaterial({
      color: barkColorHex,
      roughness: config.barkRoughness !== undefined ? config.barkRoughness : 0.88,
      metalness: 0.08
    });

    const foliageColorHex = new THREE.Color(config.foliageColor || '#2e8540');
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: foliageColorHex,
      roughness: 0.7,
      flatShading: true
    });

    // Special glowing material for elemental veins or cosmic stardust
    let glowMaterial = null;
    if (config.glowColor || config.element === 'cosmic' || config.element === 'fire' || config.element === 'lightning') {
      const glowHex = config.glowColor || 0xa855f7;
      glowMaterial = new THREE.MeshBasicMaterial({
        color: glowHex,
        wireframe: config.element === 'lightning'
      });
    }

    // 1. Trunk Body (Gnarled, tapering cylinder with wooden texture)
    const trunkHeight = 2.4 * heightMult;
    const trunkRadiusBottom = 0.42 * girthMult;
    const trunkRadiusTop = 0.28 * girthMult;

    const trunkGeom = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusBottom, trunkHeight, 10, 5);
    // Add organic jitter to vertices to make it look gnarled like a real tree
    const pos = trunkGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const angle = Math.atan2(pos.getZ(i), pos.getX(i));
      const dist = Math.sqrt(pos.getX(i) ** 2 + pos.getZ(i) ** 2);
      const wobble = Math.sin(y * 3.0 + angle * 2.0) * 0.04 * girthMult;
      pos.setX(i, Math.cos(angle) * (dist + wobble));
      pos.setZ(i, Math.sin(angle) * (dist + wobble));
    }
    trunkGeom.computeVertexNormals();

    const trunkMesh = new THREE.Mesh(trunkGeom, barkMaterial);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    trunkMesh.position.y = trunkHeight * 0.5 + 0.6 * heightMult; // Lifted above roots
    trunkMesh.name = 'Trunk';
    rootGroup.add(trunkMesh);

    // Glowing elemental veins or bark knots
    if (glowMaterial) {
      const veinGeom = new THREE.TorusGeometry(trunkRadiusBottom * 0.9, 0.03 * girthMult, 6, 12);
      veinGeom.rotateX(Math.PI / 2);
      const veinMesh = new THREE.Mesh(veinGeom, glowMaterial);
      veinMesh.position.y = -trunkHeight * 0.2;
      trunkMesh.add(veinMesh);

      const veinMesh2 = veinMesh.clone();
      veinMesh2.position.y = trunkHeight * 0.25;
      veinMesh2.scale.setScalar(0.75);
      trunkMesh.add(veinMesh2);
    }

    // 2. Pointy Root Legs (Authentic TOTK Up-rooted tree legs)
    const legCount = config.legCount || 4;
    const legType = config.legType || 'pointy';
    const legLength = 1.0 * heightMult;
    const rootLegsGroup = new THREE.Group();
    rootLegsGroup.name = 'RootLegsGroup';

    const legs = [];

    for (let i = 0; i < legCount; i++) {
      const angle = (i / legCount) * Math.PI * 2 + (Math.random() * 0.1);
      const legPivot = new THREE.Group();
      legPivot.position.set(0, 0.6 * heightMult, 0);
      legPivot.rotation.y = angle;

      // Leg segment 1: Upper gnarled root angling outward
      const upperRootGeom = new THREE.CylinderGeometry(0.12 * girthMult, 0.16 * girthMult, legLength * 0.6, 6);
      upperRootGeom.rotateZ(-Math.PI / 4.5);
      upperRootGeom.translate(legLength * 0.22, -legLength * 0.15, 0);

      const upperRoot = new THREE.Mesh(upperRootGeom, barkMaterial);
      upperRoot.castShadow = true;
      legPivot.add(upperRoot);

      // Leg segment 2: Pointy lower root tapering into a sharp wooden spear point
      const pointGeom = new THREE.ConeGeometry(0.12 * girthMult, legLength * 0.7, 6);
      pointGeom.rotateZ(Math.PI / 9);
      pointGeom.translate(legLength * 0.42, -legLength * 0.55, 0);

      const pointyTip = new THREE.Mesh(pointGeom, barkMaterial);
      pointyTip.castShadow = true;
      legPivot.add(pointyTip);

      rootLegsGroup.add(legPivot);
      legs.push(legPivot);
    }

    rootGroup.add(rootLegsGroup);
    rootGroup.userData.legs = legs;

    // 3. Tree Head / Canopy / Foliage
    const headGroup = new THREE.Group();
    headGroup.position.y = trunkHeight * 0.5;
    trunkMesh.add(headGroup);

    // Tree Stump Flat Top (TOTK characteristic wood-grain rings)
    const stumpTopGeom = new THREE.CylinderGeometry(trunkRadiusTop, trunkRadiusTop * 1.05, 0.08 * heightMult, 10);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.barkColor || '#5c4033').clone().offsetHSL(0.05, -0.1, 0.15),
      roughness: 0.95
    });
    const stumpTop = new THREE.Mesh(stumpTopGeom, ringMaterial);
    stumpTop.position.y = 0.04 * heightMult;
    headGroup.add(stumpTop);

    // Foliage Clusters
    const foliageGroup = new THREE.Group();
    foliageGroup.name = 'FoliageGroup';

    if (config.foliageType === 'cosmic_nebula' || config.element === 'cosmic') {
      // Swirling glowing stellar cluster
      for (let c = 0; c < 7; c++) {
        const sphereGeom = new THREE.DodecahedronGeometry((0.45 + Math.random() * 0.3) * girthMult, 1);
        const starMat = new THREE.MeshStandardMaterial({
          color: c % 2 === 0 ? 0xc084fc : 0x38bdf8,
          emissive: c % 2 === 0 ? 0x9333ea : 0x0284c7,
          emissiveIntensity: 0.7,
          roughness: 0.4,
          flatShading: true,
          transparent: true,
          opacity: 0.9
        });
        const blob = new THREE.Mesh(sphereGeom, starMat);
        blob.position.set(
          (Math.random() - 0.5) * 1.2 * girthMult,
          (0.3 + Math.random() * 0.6) * heightMult,
          (Math.random() - 0.5) * 1.2 * girthMult
        );
        foliageGroup.add(blob);
      }
    } else {
      // Natural / Elemental Foliage Puffs
      const puffCount = config.foliageType === 'spiky' ? 10 : 6;
      for (let p = 0; p < puffCount; p++) {
        let fGeom;
        if (config.foliageType === 'icicle_needles' || config.foliageType === 'spiky') {
          fGeom = new THREE.ConeGeometry((0.25 + Math.random() * 0.2) * girthMult, 0.7 * heightMult, 5);
          fGeom.rotateX(Math.random() * 0.4);
        } else {
          fGeom = new THREE.DodecahedronGeometry((0.4 + Math.random() * 0.25) * girthMult, 1);
        }

        const puff = new THREE.Mesh(fGeom, foliageMaterial);
        puff.castShadow = true;
        puff.position.set(
          (Math.random() - 0.5) * 1.1 * girthMult,
          (0.2 + Math.random() * 0.5) * heightMult,
          (Math.random() - 0.5) * 1.1 * girthMult
        );
        foliageGroup.add(puff);
      }
    }
    headGroup.add(foliageGroup);

    // 4. Special Animal Adaptations (Praying Mantis Scythe Arms, Stag Antlers, etc.)
    if (config.hasMantisScythes || config.presetKey === 'mantis' || config.crestType === 'mantis_crest') {
      // Two gnarled tree branches shaped into raptorial Mantis scythes
      const scythesGroup = new THREE.Group();
      scythesGroup.name = 'MantisScythes';

      [-1, 1].forEach((side) => {
        const scytheArm = new THREE.Group();
        scytheArm.position.set(side * 0.35 * girthMult, 0.1 * heightMult, 0.2 * girthMult);

        // Branch Humerus
        const humerusGeom = new THREE.CylinderGeometry(0.08 * girthMult, 0.11 * girthMult, 0.8 * heightMult, 6);
        humerusGeom.rotateX(Math.PI / 3);
        humerusGeom.rotateZ(side * Math.PI / 8);
        const humerus = new THREE.Mesh(humerusGeom, barkMaterial);
        humerus.castShadow = true;
        scytheArm.add(humerus);

        // Wooden Scythe Blade (Curved sharp limb)
        const bladeGeom = new THREE.ConeGeometry(0.12 * girthMult, 1.1 * heightMult, 5);
        bladeGeom.rotateX(-Math.PI / 2.2);
        bladeGeom.rotateZ(side * -Math.PI / 12);
        bladeGeom.translate(0, -0.3 * heightMult, 0.45 * heightMult);

        // Sharp wooden blade edge with leaf accents
        const bladeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(config.barkColor || '#4a5320').offsetHSL(0, 0.1, -0.05),
          roughness: 0.6
        });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);
        blade.castShadow = true;
        scytheArm.add(blade);

        scythesGroup.add(scytheArm);
      });

      headGroup.add(scythesGroup);
      rootGroup.userData.scythes = scythesGroup;
    }

    if (config.hasAntlers || config.crestType === 'antler_boughs') {
      // Massive gnarled wooden branch antlers
      [-1, 1].forEach(side => {
        const antlerBranch = new THREE.Group();
        antlerBranch.position.set(side * 0.25 * girthMult, 0.2 * heightMult, 0);

        const mainBeamGeom = new THREE.CylinderGeometry(0.06 * girthMult, 0.1 * girthMult, 0.9 * heightMult, 5);
        mainBeamGeom.rotateZ(side * Math.PI / 4.5);
        mainBeamGeom.rotateX(-Math.PI / 8);
        const mainBeam = new THREE.Mesh(mainBeamGeom, barkMaterial);
        mainBeam.castShadow = true;
        antlerBranch.add(mainBeam);

        // Antler tines
        [0.2, 0.5, 0.7].forEach((tineY, idx) => {
          const tineGeom = new THREE.ConeGeometry(0.04 * girthMult, 0.4 * heightMult, 4);
          tineGeom.rotateZ(side * (Math.PI / 3 + idx * 0.2));
          tineGeom.translate(side * 0.2 * heightMult, tineY * heightMult, 0.1);
          const tine = new THREE.Mesh(tineGeom, barkMaterial);
          antlerBranch.add(tine);
        });

        headGroup.add(antlerBranch);
      });
    }

    rootGroup.userData.headGroup = headGroup;
    rootGroup.userData.trunkMesh = trunkMesh;
    rootGroup.userData.config = config;
    rootGroup.userData.stage = stage;

    return rootGroup;
  }

  // Create Authentic Zelda TOTK Evermean First-Person View Rig
  // Includes gnarled bark-textured limbs, twig claws, natural upper canopy bough framing,
  // and visible root claws when looking down towards the soil.
  static createFirstPersonViewModel(config = {}, stage = 1) {
    const fpGroup = new THREE.Group();
    fpGroup.name = 'FirstPersonViewModel';

    // Bark PBR material matching the player's tree species
    const barkColorHex = new THREE.Color(config.barkColor || '#5c4033');
    const barkTex = TextureGenerator.createBarkTexture(barkColorHex.getHex(), config.barkRoughness !== undefined ? config.barkRoughness : 0.88);
    const barkNormal = TextureGenerator.createBarkNormalMap();

    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: barkNormal,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: config.barkRoughness !== undefined ? config.barkRoughness : 0.88,
      metalness: 0.08
    });

    const leafColorHex = new THREE.Color(config.foliageColor || '#2e8540');
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColorHex,
      roughness: 0.7,
      flatShading: true
    });

    // Glowing elemental veins
    let glowMat = null;
    if (config.glowColor || config.element === 'cosmic' || config.element === 'fire' || config.element === 'lightning') {
      const glowHex = config.glowColor || 0xa855f7;
      glowMat = new THREE.MeshBasicMaterial({
        color: glowHex,
        wireframe: config.element === 'lightning'
      });
    }

    const isMantis = config.hasMantisScythes || config.presetKey === 'mantis' || config.crestType === 'mantis_crest';

    // 1. Gnarled Branch Arms & Claws reaching into the view
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.44, -0.38, -0.62);
    leftArm.rotation.set(0.18, 0.35, -0.25);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.44, -0.38, -0.62);
    rightArm.rotation.set(0.18, -0.35, 0.25);

    [leftArm, rightArm].forEach((arm, idx) => {
      const side = idx === 0 ? -1 : 1;

      if (isMantis) {
        // Mantis wooden scythe arm
        const branchGeom = new THREE.CylinderGeometry(0.045, 0.075, 0.65, 7);
        branchGeom.rotateX(Math.PI / 3.8);
        const branch = new THREE.Mesh(branchGeom, barkMat);
        arm.add(branch);

        const scytheBladeGeom = new THREE.ConeGeometry(0.065, 0.85, 5);
        scytheBladeGeom.rotateX(-Math.PI / 2.3);
        scytheBladeGeom.translate(0, -0.15, 0.4);
        const bladeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(config.barkColor || '#4a5320').offsetHSL(0, 0.1, -0.05),
          roughness: 0.55
        });
        const blade = new THREE.Mesh(scytheBladeGeom, bladeMat);
        arm.add(blade);
      } else {
        // Gnarled Evermean branch arm: Upper bough
        const upperBoughGeom = new THREE.CylinderGeometry(0.055, 0.08, 0.45, 6);
        upperBoughGeom.rotateX(Math.PI / 3.2);
        upperBoughGeom.rotateZ(side * 0.15);
        const upperBough = new THREE.Mesh(upperBoughGeom, barkMat);
        arm.add(upperBough);

        // Forearm limb angling forward
        const forearmGeom = new THREE.CylinderGeometry(0.04, 0.058, 0.48, 6);
        forearmGeom.rotateX(Math.PI / 2.6);
        forearmGeom.translate(side * 0.04, 0.08, 0.28);
        const forearm = new THREE.Mesh(forearmGeom, barkMat);
        arm.add(forearm);

        // Pointed wooden twig claw fingers (3 main fingers + thumb claw)
        const fingerOffsets = [
          { x: -0.045, angleY: -0.2, length: 0.22 },
          { x: 0.0, angleY: 0.0, length: 0.26 },
          { x: 0.045, angleY: 0.2, length: 0.22 },
          { x: -side * 0.065, angleY: -side * 0.35, length: 0.18 } // Thumb twig
        ];

        fingerOffsets.forEach((f) => {
          const twigGeom = new THREE.ConeGeometry(0.018, f.length, 5);
          twigGeom.rotateX(Math.PI / 2.2);
          twigGeom.rotateY(f.angleY);
          twigGeom.translate(side * 0.04 + f.x, 0.16, 0.48);
          const twig = new THREE.Mesh(twigGeom, barkMat);
          arm.add(twig);
        });

        // Glowing elemental ring around wrist
        if (glowMat) {
          const wristVeinGeom = new THREE.TorusGeometry(0.055, 0.012, 6, 12);
          const vein = new THREE.Mesh(wristVeinGeom, glowMat);
          vein.position.set(side * 0.04, 0.14, 0.4);
          arm.add(vein);
        }

        // Fresh green leaf sprouts on elbow & wrist
        const sproutGeom = new THREE.DodecahedronGeometry(0.09, 0);
        const sprout = new THREE.Mesh(sproutGeom, leafMat);
        sprout.position.set(side * 0.09, 0.04, 0.15);
        arm.add(sprout);
      }

      fpGroup.add(arm);
    });

    // 2. Overhead Canopy Bough Framing: Looking out from inside the tree's living crown
    const canopyGroup = new THREE.Group();
    canopyGroup.name = 'FirstPersonCanopy';

    [-1, 1].forEach((side) => {
      const boughGroup = new THREE.Group();
      boughGroup.position.set(side * 0.52, 0.38, -0.48);

      // Arching wooden bough across top corner
      const boughGeom = new THREE.CylinderGeometry(0.03, 0.06, 0.45, 5);
      boughGeom.rotateZ(side * -Math.PI / 3.5);
      boughGeom.rotateX(0.2);
      const bough = new THREE.Mesh(boughGeom, barkMat);
      boughGroup.add(bough);

      // Lush canopy foliage puffs framing the upper periphery
      if (config.foliageType === 'cosmic_nebula' || config.element === 'cosmic') {
        for (let p = 0; p < 3; p++) {
          const starGeom = new THREE.DodecahedronGeometry(0.16 + p * 0.04, 1);
          const starMat = new THREE.MeshStandardMaterial({
            color: p % 2 === 0 ? 0xc084fc : 0x38bdf8,
            emissive: p % 2 === 0 ? 0x9333ea : 0x0284c7,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85
          });
          const puff = new THREE.Mesh(starGeom, starMat);
          puff.position.set(side * (0.05 + p * 0.06), 0.04 - p * 0.03, p * 0.05);
          boughGroup.add(puff);
        }
      } else {
        for (let p = 0; p < 3; p++) {
          let leafPuffGeom;
          if (config.foliageType === 'icicle_needles' || config.foliageType === 'spiky') {
            leafPuffGeom = new THREE.ConeGeometry(0.12, 0.32, 4);
            leafPuffGeom.rotateX(0.3);
          } else {
            leafPuffGeom = new THREE.DodecahedronGeometry(0.16 + p * 0.04, 1);
          }
          const puff = new THREE.Mesh(leafPuffGeom, leafMat);
          puff.position.set(side * (0.05 + p * 0.06), 0.04 - p * 0.03, p * 0.05);
          boughGroup.add(puff);
        }
      }

      canopyGroup.add(boughGroup);
    });
    fpGroup.add(canopyGroup);

    // 3. Lower Trunk & Root Leg Knuckles (Visible when pitching camera down towards feet)
    const lowerBody = new THREE.Group();
    lowerBody.name = 'FirstPersonLowerBody';
    lowerBody.position.set(0, -0.75, 0.12);

    // Lower trunk bark cylinder
    const trunkCylGeom = new THREE.CylinderGeometry(0.24, 0.35, 0.8, 8);
    const trunkCyl = new THREE.Mesh(trunkCylGeom, barkMat);
    trunkCyl.position.y = -0.15;
    lowerBody.add(trunkCyl);

    // Visible root leg claws
    const rootLegs = [];
    [-1, 1].forEach((side) => {
      const rootPivot = new THREE.Group();
      rootPivot.position.set(side * 0.22, -0.4, 0.05);

      const rootGeom = new THREE.ConeGeometry(0.08, 0.6, 5);
      rootGeom.rotateX(Math.PI / 4);
      rootGeom.rotateZ(side * -Math.PI / 8);
      rootGeom.translate(0, -0.18, 0.22);
      const rootMesh = new THREE.Mesh(rootGeom, barkMat);
      rootPivot.add(rootMesh);

      lowerBody.add(rootPivot);
      rootLegs.push(rootPivot);
    });
    fpGroup.add(lowerBody);

    fpGroup.userData.leftArm = leftArm;
    fpGroup.userData.rightArm = rightArm;
    fpGroup.userData.canopyGroup = canopyGroup;
    fpGroup.userData.lowerBody = lowerBody;
    fpGroup.userData.roots = rootLegs;

    return fpGroup;
  }
}

