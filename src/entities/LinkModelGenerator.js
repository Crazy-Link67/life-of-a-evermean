import * as THREE from 'three';
import { TextureGenerator } from '../core/TextureGenerator.js';

// Procedural 3D Model Generator for Link (Hero of Hyrule - Tears of the Kingdom)
// Faithful representation featuring the Champion's Tunic, Master Sword, Hylian Shield,
// Paraglider, Purah Pad, Zonai teardrop earrings, and King Rauru's glowing Zonai Right Arm.
export class LinkModelGenerator {

  // Create Tears of the Kingdom Sailcloth Paraglider Model
  static createParagliderModel() {
    const gliderGroup = new THREE.Group();
    gliderGroup.name = 'Paraglider';

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.75, roughness: 0.3 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.9 });

    // Sailcloth Canopy with curved aerodynamic camber
    const sailWidth = 2.6;
    const sailDepth = 1.35;
    const sailGeom = new THREE.PlaneGeometry(sailWidth, sailDepth, 16, 8);
    const pos = sailGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      // Parabolic arch across width and gentle curve back
      const arch = -0.18 * Math.pow(vx / (sailWidth * 0.5), 2);
      const pitch = -0.06 * Math.pow(vy / (sailDepth * 0.5), 2);
      pos.setZ(i, arch + pitch);
    }
    sailGeom.computeVertexNormals();

    const sailTex = TextureGenerator.createParagliderSailTexture();
    const sailMat = new THREE.MeshStandardMaterial({
      map: sailTex,
      side: THREE.DoubleSide,
      roughness: 0.65,
      metalness: 0.1
    });

    const sailMesh = new THREE.Mesh(sailGeom, sailMat);
    sailMesh.rotation.x = -Math.PI / 2 + 0.12; // Canopy flat overhead with slight tilt
    sailMesh.castShadow = true;
    gliderGroup.add(sailMesh);

    // Main transverse wooden spar (cross-beam)
    const mainSpar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, sailWidth + 0.1, 8), woodMat);
    mainSpar.rotation.z = Math.PI / 2;
    mainSpar.position.set(0, 0.02, 0.15);
    gliderGroup.add(mainSpar);

    // Front curved wooden leading rim
    const frontRim = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, sailWidth, 8), woodMat);
    frontRim.rotation.z = Math.PI / 2;
    frontRim.position.set(0, 0.06, -sailDepth * 0.45);
    gliderGroup.add(frontRim);

    // Longitudinal wooden ribs (3 arch ribs)
    [-sailWidth * 0.4, 0, sailWidth * 0.4].forEach(rx => {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, sailDepth, 6), woodMat);
      rib.rotation.x = Math.PI / 2;
      rib.position.set(rx, 0.03, 0);
      gliderGroup.add(rib);

      // Gold metal bracket caps at spar intersections
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), metalMat);
      cap.position.set(rx, 0.03, 0.15);
      gliderGroup.add(cap);
    });

    // Dual vertical hanging grip handles for Link's hands
    [-0.38, 0.38].forEach(hx => {
      // Suspension strut
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.65, 6), ropeMat);
      strut.position.set(hx, -0.32, 0.05);
      gliderGroup.add(strut);

      // Ergonomic leather hand grip at bottom
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.22, 8), woodMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(hx, -0.62, 0.05);
      gliderGroup.add(grip);
    });

    return gliderGroup;
  }

  // Create High-Fidelity Third-Person 3D Link Model
  static createLinkThirdPersonModel() {
    const linkGroup = new THREE.Group();
    linkGroup.name = 'LinkThirdPerson';

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 }); // Champion's Cyan Blue
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.85 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x271810, roughness: 0.75 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    // King Rauru's Corrupted Zonai Right Arm Materials
    const zonaiStoneMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5, metalness: 0.2 });
    const zonaiRuneMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.3,
      roughness: 0.2
    });

    // Master Sword Materials
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.25
    });
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.3 });

    // Hylian Shield Material with Smooth Vector Texture
    const shieldTex = TextureGenerator.createHylianShieldTexture();
    const shieldMat = new THREE.MeshStandardMaterial({
      map: shieldTex,
      metalness: 0.65,
      roughness: 0.25
    });
    const shieldRimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });

    // 1. Pelvis & Waist Belt
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.35), pantsMat);
    pelvis.position.y = 1.05;
    linkGroup.add(pelvis);

    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.08, 0.37), leatherMat);
    belt.position.y = 1.15;
    linkGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.39), goldMat);
    buckle.position.y = 1.15;
    linkGroup.add(buckle);

    // Purah Pad on Link's Left Hip
    const purahPadGroup = new THREE.Group();
    purahPadGroup.position.set(-0.31, 1.08, 0.05);
    purahPadGroup.rotation.set(0.1, 0.15, 0.25);
    const padBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.18), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
    purahPadGroup.add(padBody);
    // Glowing Blue Zonai Screen
    const padScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    padScreen.rotation.y = -Math.PI / 2;
    padScreen.position.x = -0.042;
    purahPadGroup.add(padScreen);
    // Golden Zonai Eye Ring
    const padEye = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 6, 12),
      goldMat
    );
    padEye.rotation.y = -Math.PI / 2;
    padEye.position.x = -0.043;
    purahPadGroup.add(padEye);
    linkGroup.add(purahPadGroup);

    // 2. Torso (Champion's Tunic)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.35, 0);

    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.36), tunicMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoGroup.add(torsoMesh);

    // White Champion's embroidery chevrons on chest
    const chevronL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.38), trimMat);
    chevronL.position.set(-0.14, 0.04, 0);
    chevronL.rotation.z = -0.3;
    torsoGroup.add(chevronL);

    const chevronR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.38), trimMat);
    chevronR.position.set(0.14, 0.04, 0);
    chevronR.rotation.z = 0.3;
    torsoGroup.add(chevronR);

    // Leather shoulder strap for sword scabbard
    const scabbardStrap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.39), leatherMat);
    scabbardStrap.rotation.z = 0.55;
    torsoGroup.add(scabbardStrap);

    linkGroup.add(torsoGroup);

    // 3. Head & Detailed Hylian Facial Features
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.82, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.3), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Pointed Hylian Ears
    [-0.17, 0.17].forEach((ex, idx) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), skinMat);
      ear.position.set(ex, 0.02, -0.02);
      ear.rotation.z = idx === 0 ? Math.PI / 3 : -Math.PI / 3;
      ear.rotation.y = idx === 0 ? 0.25 : -0.25;
      headGroup.add(ear);

      // King Rauru Zonai Teardrop Earring on Right Ear (idx === 1)
      if (idx === 1) {
        const earringLoop = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 10), goldMat);
        earringLoop.position.set(ex + 0.06, -0.06, -0.02);
        headGroup.add(earringLoop);

        const earringDrop = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 5), zonaiRuneMat);
        earringDrop.position.set(ex + 0.06, -0.11, -0.02);
        earringDrop.rotation.x = Math.PI;
        headGroup.add(earringDrop);
      }
    });

    // Flowing Blond Hair & Bangs
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.35), hairMat);
    hairTop.position.set(0, 0.14, -0.02);
    headGroup.add(hairTop);

    // Side hair locks
    [-0.17, 0.17].forEach(sx => {
      const sideLock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.22), hairMat);
      sideLock.position.set(sx, -0.05, 0.02);
      headGroup.add(sideLock);
    });

    // Back hair pony / locks
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.12), hairMat);
    backHair.position.set(0, -0.08, -0.16);
    headGroup.add(backHair);

    // Blue Eyes with pupils
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    [-0.08, 0.08].forEach(eyeX => {
      const eyeWhite = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.02), eyeWhiteMat);
      eyeWhite.position.set(eyeX, 0.02, 0.155);
      headGroup.add(eyeWhite);

      const iris = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.025), irisMat);
      iris.position.set(eyeX, 0.02, 0.158);
      headGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.028), pupilMat);
      pupil.position.set(eyeX, 0.02, 0.16);
      headGroup.add(pupil);

      // Eyebrows
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.02), hairMat);
      brow.position.set(eyeX, 0.055, 0.16);
      brow.rotation.z = (eyeX < 0 ? -0.12 : 0.12);
      headGroup.add(brow);
    });

    // Subtle Nose Bridge
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 4), skinMat);
    nose.position.set(0, -0.015, 0.165);
    nose.rotation.x = Math.PI / 2;
    headGroup.add(nose);

    linkGroup.add(headGroup);

    // 4. Left Arm (Champion's Sleeve & Gauntlet, holding shield or swinging)
    const armL = new THREE.Group();
    armL.position.set(-0.38, 1.58, 0);

    const bicepL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 0.16), tunicMat);
    bicepL.position.y = -0.14;
    armL.add(bicepL);

    const forearmL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.15), leatherMat);
    forearmL.position.y = -0.38;
    armL.add(forearmL);

    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skinMat);
    handL.position.y = -0.56;
    armL.add(handL);

    // In-Hand Hylian Shield on Left Arm (visible when blocking)
    const shieldInHand = new THREE.Group();
    shieldInHand.position.set(-0.06, -0.38, 0.18);
    shieldInHand.rotation.set(0.1, 0.35, -0.1);

    const inHandPlate = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.05), shieldMat);
    shieldInHand.add(inHandPlate);

    const inHandRim = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.04), shieldRimMat);
    inHandRim.position.z = -0.01;
    shieldInHand.add(inHandRim);

    // Leather arm straps on back of shield
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.08), leatherMat);
    strapL.position.set(0, 0, -0.06);
    shieldInHand.add(strapL);

    shieldInHand.visible = false; // Initially stowed on back
    armL.add(shieldInHand);

    linkGroup.add(armL);

    // 5. The Legendary Zonai Right Arm (King Rauru's Gift)
    const armR = new THREE.Group();
    armR.position.set(0.38, 1.58, 0);

    // Dark teal stone bicep with rune band
    const bicepR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 0.16), zonaiStoneMat);
    bicepR.position.y = -0.14;
    armR.add(bicepR);

    const runeBand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.17), zonaiRuneMat);
    runeBand.position.y = -0.14;
    armR.add(runeBand);

    // Glowing green Zonai stone forearm
    const forearmR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.15), zonaiStoneMat);
    forearmR.position.y = -0.38;
    armR.add(forearmR);

    // Intricate glowing runic circuit inlays on forearm
    const runeStripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.16), zonaiRuneMat);
    runeStripe.position.set(0.06, -0.38, 0);
    armR.add(runeStripe);

    // Radiant Zonai hand
    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.13), zonaiStoneMat);
    handR.position.y = -0.56;
    armR.add(handR);

    // Glowing palm / fingertip core
    const palmCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), zonaiRuneMat);
    palmCore.position.set(0, -0.58, 0.04);
    armR.add(palmCore);

    linkGroup.add(armR);

    // 6. Legs & Boots (Rigged for walking gait)
    const legL = new THREE.Group();
    legL.position.set(-0.16, 0.95, 0);
    const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.2), pantsMat);
    thighL.position.y = -0.21;
    legL.add(thighL);
    const calfL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.18), bootMat);
    calfL.position.y = -0.58;
    legL.add(calfL);
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.26), bootMat);
    footL.position.set(0, -0.84, 0.04);
    legL.add(footL);
    linkGroup.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.16, 0.95, 0);
    const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.2), pantsMat);
    thighR.position.y = -0.21;
    legR.add(thighR);
    const calfR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.18), bootMat);
    calfR.position.y = -0.58;
    legR.add(calfR);
    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.26), bootMat);
    footR.position.set(0, -0.84, 0.04);
    legR.add(footR);
    linkGroup.add(legR);

    // 7. Master Sword & Scabbard
    const swordGroup = new THREE.Group();
    // Gleaming silver blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.03), bladeMat);
    blade.position.y = 0.48;
    swordGroup.add(blade);

    // Blade tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), bladeMat);
    tip.position.y = 1.0;
    tip.rotation.y = Math.PI / 4;
    swordGroup.add(tip);

    // Blue winged crossguard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.07), guardMat);
    guard.position.y = 0.04;
    swordGroup.add(guard);

    // Golden Triforce Crest on crossguard
    const triforce = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), goldMat);
    triforce.position.set(0, 0.04, 0.04);
    swordGroup.add(triforce);

    // Green/Blue wrapped hilt grip & pommel
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 8), tunicMat);
    hilt.position.y = -0.14;
    swordGroup.add(hilt);

    const pommel = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05), goldMat);
    pommel.position.y = -0.28;
    swordGroup.add(pommel);

    swordGroup.scale.set(1.1, 1.1, 1.1);

    // Back Sheathed Sword Mount
    const backSwordGroup = swordGroup.clone();
    backSwordGroup.position.set(-0.12, 1.45, -0.24);
    backSwordGroup.rotation.set(0.2, 0.3, -Math.PI * 0.72);
    linkGroup.add(backSwordGroup);

    // In-hand Drawn Master Sword (for attack animation)
    swordGroup.position.set(0, -0.62, 0.15);
    swordGroup.rotation.x = Math.PI / 2;
    swordGroup.visible = false;
    armR.add(swordGroup);

    // 8. Hylian Shield on Back (uses smooth vector texture)
    const backShieldGroup = new THREE.Group();
    backShieldGroup.position.set(0.08, 1.42, -0.25);
    backShieldGroup.rotation.set(0.1, -0.2, 0.15);

    const backShieldPlate = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.05), shieldMat);
    backShieldGroup.add(backShieldPlate);

    const backShieldRim = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.04), shieldRimMat);
    backShieldRim.position.z = -0.01;
    backShieldGroup.add(backShieldRim);

    linkGroup.add(backShieldGroup);

    // 9. Paraglider Attached Overhead (toggled during gliding)
    const paraglider = LinkModelGenerator.createParagliderModel();
    paraglider.position.set(0, 2.22, 0);
    paraglider.visible = false;
    linkGroup.add(paraglider);

    // UserData references for procedural kinematics
    linkGroup.userData = {
      isLink: true,
      head: headGroup,
      torso: torsoGroup,
      armL,
      armR,
      legL,
      legR,
      legs: [legL, legR],
      drawnSword: swordGroup,
      backSword: backSwordGroup,
      shield: backShieldGroup,
      shieldInHand,
      paraglider,
      palmCore
    };

    return linkGroup;
  }

  // Create First-Person View Arms & Paraglider Rig for Link
  static createLinkFirstPersonModel() {
    const fpGroup = new THREE.Group();
    fpGroup.name = 'LinkFirstPerson';

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.65 });
    const tunicMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.8 });
    const zonaiStoneMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5, metalness: 0.2 });
    const zonaiRuneMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
      roughness: 0.2
    });
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.35
    });
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });

    // Hylian Shield for First-Person Blocking
    const shieldTex = TextureGenerator.createHylianShieldTexture();
    const fpShieldMat = new THREE.MeshStandardMaterial({
      map: shieldTex,
      metalness: 0.65,
      roughness: 0.25
    });
    const fpRimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });

    // 1. Left Arm (Champion's Sleeve & Gauntlet, with blockable shield)
    const armL = new THREE.Group();
    armL.position.set(-0.35, -0.28, -0.45);
    armL.rotation.set(0.2, 0.15, -0.1);

    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.42, 10), tunicMat);
    sleeveL.rotation.x = Math.PI / 2.6;
    armL.add(sleeveL);

    const gauntletL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.25, 10), leatherMat);
    gauntletL.position.set(0, -0.06, -0.2);
    gauntletL.rotation.x = Math.PI / 2.6;
    armL.add(gauntletL);

    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), skinMat);
    handL.position.set(0, -0.12, -0.36);
    armL.add(handL);

    // First Person Shield (raises into view on block)
    const fpShieldGroup = new THREE.Group();
    fpShieldGroup.position.set(0.05, -0.05, -0.28);
    fpShieldGroup.rotation.set(0.2, 0.3, -0.15);

    const fpPlate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 0.04), fpShieldMat);
    fpShieldGroup.add(fpPlate);

    const fpRim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.72, 0.03), fpRimMat);
    fpRim.position.z = -0.01;
    fpShieldGroup.add(fpRim);

    fpShieldGroup.visible = false; // Hidden until shield is raised
    armL.add(fpShieldGroup);

    fpGroup.add(armL);

    // 2. Right Arm (King Rauru's Glowing Zonai Arm with Master Sword!)
    const armR = new THREE.Group();
    armR.position.set(0.35, -0.28, -0.45);
    armR.rotation.set(0.2, -0.15, 0.1);

    const stoneArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.45, 12), zonaiStoneMat);
    stoneArmR.rotation.x = Math.PI / 2.6;
    armR.add(stoneArmR);

    // Glowing green Zonai rune circlet
    const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.015, 8, 16), zonaiRuneMat);
    runeRing.position.set(0, -0.04, -0.15);
    runeRing.rotation.x = Math.PI / 2.6;
    armR.add(runeRing);

    // Glowing Zonai hand holding Master Sword
    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), zonaiStoneMat);
    handR.position.set(0, -0.12, -0.36);
    armR.add(handR);

    // Master Sword in Right Hand
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0, -0.1, -0.36);
    swordGroup.rotation.set(-0.35, 0.1, -0.2);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.025), bladeMat);
    blade.position.set(0, 0.42, 0);
    swordGroup.add(blade);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), bladeMat);
    tip.position.set(0, 0.88, 0);
    tip.rotation.y = Math.PI / 4;
    swordGroup.add(tip);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), guardMat);
    guard.position.set(0, 0.02, 0);
    swordGroup.add(guard);

    const triforce = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), goldMat);
    triforce.position.set(0, 0.02, 0.035);
    swordGroup.add(triforce);

    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), tunicMat);
    hilt.position.set(0, -0.11, 0);
    swordGroup.add(hilt);

    armR.add(swordGroup);
    fpGroup.add(armR);

    // 3. First Person Paraglider View Canopy & Handles overhead
    const fpGlider = new THREE.Group();
    fpGlider.position.set(0, 0.48, -0.35);

    const fpSailGeom = new THREE.PlaneGeometry(1.9, 0.9, 8, 4);
    const fpSailTex = TextureGenerator.createParagliderSailTexture();
    const fpSail = new THREE.Mesh(fpSailGeom, new THREE.MeshStandardMaterial({
      map: fpSailTex,
      side: THREE.DoubleSide,
      roughness: 0.65
    }));
    fpSail.rotation.x = -Math.PI / 2 + 0.15;
    fpGlider.add(fpSail);

    const fpBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.8 })
    );
    fpBar.rotation.z = Math.PI / 2;
    fpGlider.add(fpBar);

    fpGlider.visible = false; // Visible only when gliding
    fpGroup.add(fpGlider);

    fpGroup.userData = {
      isLinkFP: true,
      armL,
      armR,
      sword: swordGroup,
      shieldFP: fpShieldGroup,
      paragliderFP: fpGlider,
      runeRing
    };

    return fpGroup;
  }
}

