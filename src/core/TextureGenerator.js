import * as THREE from 'three';

// Procedural PBR Canvas Texture Generator
// Generates high-fidelity diffuse, normal, and roughness maps client-side with 0KB network payload
export class TextureGenerator {
  // Generate high-resolution seamless grass & moss ground texture
  static createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base lush forest green
    ctx.fillStyle = '#2f6d28';
    ctx.fillRect(0, 0, 512, 512);

    // Multi-frequency noise for earthy soil, moss, and mineral variation
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 44;
      const mossNoise = Math.sin((i / 4) * 0.055) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise * 0.55));              // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise + mossNoise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.35));       // B
    }
    ctx.putImageData(imgData, 0, 0);

    // Fine grass blades and clover details
    for (let b = 0; b < 1600; b++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 4 + Math.random() * 8;
      const angle = (Math.random() - 0.5) * 1.3;

      ctx.strokeStyle = Math.random() < 0.45 ? '#52ab3d' : (Math.random() < 0.8 ? '#23581c' : '#7bc75b');
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
      ctx.stroke();
    }

    // Micro clover specks
    for (let c = 0; c < 120; c++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      ctx.fillStyle = 'rgba(110, 200, 80, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  // Generate realistic gnarled tree bark with vertical grooves & lichen
  static createBarkTexture(baseHex = 0x5c4033, roughness = 0.85) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const baseCol = new THREE.Color(baseHex);
    ctx.fillStyle = `rgb(${Math.floor(baseCol.r * 255)}, ${Math.floor(baseCol.g * 255)}, ${Math.floor(baseCol.b * 255)})`;
    ctx.fillRect(0, 0, 512, 512);

    // Deep vertical furrow lines and grain
    for (let x = 0; x < 512; x += 4 + Math.floor(Math.random() * 8)) {
      const shade = Math.random() < 0.5 ? 'rgba(20, 10, 5, 0.45)' : 'rgba(200, 170, 130, 0.25)';
      ctx.strokeStyle = shade;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      let cx = x;
      ctx.moveTo(cx, 0);
      for (let y = 0; y < 512; y += 16) {
        cx += (Math.random() - 0.5) * 4;
        ctx.lineTo(cx, y);
      }
      ctx.stroke();
    }

    // Lichen and moss specks
    for (let m = 0; m < 140; m++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      const lr = 3 + Math.random() * 6;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(78, 120, 56, 0.35)' : 'rgba(160, 180, 140, 0.3)';
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
  }

  // Generate normal map for tree bark to react dynamically to sun lighting
  static createBarkNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Neutral normal base (128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Vertical ridges
    for (let x = 0; x < 256; x += 6) {
      const grad = ctx.createLinearGradient(x, 0, x + 6, 0);
      grad.addColorStop(0, 'rgb(90, 128, 240)');
      grad.addColorStop(0.5, 'rgb(128, 128, 255)');
      grad.addColorStop(1, 'rgb(166, 128, 240)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 6, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
  }

  // High-fidelity terrain normal map with micro-crags, rocky ridges and pebbles
  static createTerrainDetailNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;

    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const idx = (y * 512 + x) * 4;
        // Multi-scale procedural rock & ground bump
        const n1 = Math.sin(x * 0.08) * Math.cos(y * 0.08);
        const n2 = Math.sin((x + y) * 0.18) * 0.5;
        const n3 = Math.cos((x * 0.4 - y * 0.35)) * 0.25;
        const grain = (Math.random() - 0.5) * 0.2;

        const bumpX = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2 + grain) * 55;
        const bumpY = (Math.cos(x * 0.08) * Math.sin(y * 0.08) * 0.5 + Math.sin((y - x) * 0.18) * 0.3 + grain) * 55;

        d[idx] = Math.floor(Math.max(0, Math.min(255, 128 + bumpX)));
        d[idx + 1] = Math.floor(Math.max(0, Math.min(255, 128 + bumpY)));
        d[idx + 2] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(24, 24);
    return texture;
  }

  // Water normal map for realistic shimmering waves and ripples
  // Water normal map for realistic shimmering waves, cross-wind ripples, and caustics
  static createWaterNormalMap() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    const imgData = ctx.getImageData(0, 0, 256, 256);
    const d = imgData.data;

    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const idx = (y * 256 + x) * 4;
        // Multi-wave interference harmonics
        const wave1X = Math.sin(x * 0.11) * Math.cos(y * 0.08);
        const wave1Y = Math.cos(x * 0.08) * Math.sin(y * 0.12);
        const wave2X = Math.sin((x + y) * 0.16) * 0.55;
        const wave2Y = Math.cos((x - y) * 0.14) * 0.55;
        const wave3X = Math.sin(x * 0.28 + y * 0.2) * 0.25;
        const wave3Y = Math.cos(y * 0.3 - x * 0.15) * 0.25;

        const nx = wave1X + wave2X + wave3X;
        const ny = wave1Y + wave2Y + wave3Y;

        d[idx] = Math.floor(Math.max(0, Math.min(255, 128 + nx * 68)));     // X normal
        d[idx + 1] = Math.floor(Math.max(0, Math.min(255, 128 + ny * 68))); // Y normal
        d[idx + 2] = 255;                                                    // Z normal
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  // Stylized billboard grass blade texture for instanced field tufts
  static createGrassTuftTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 64, 128);

    // Draw clustered stylized grass blades with soft sunlight tips
    const blades = [
      { x: 32, topX: 18, h: 112, w: 7, color: '#3d8c2c', tipColor: '#86efac' },
      { x: 32, topX: 46, h: 104, w: 6, color: '#4da638', tipColor: '#a7f3d0' },
      { x: 32, topX: 28, h: 124, w: 8, color: '#5ebf45', tipColor: '#bbf7d0' },
      { x: 32, topX: 54, h: 88,  w: 5, color: '#367c26', tipColor: '#4ade80' },
      { x: 32, topX: 10, h: 94,  w: 6, color: '#68d14d', tipColor: '#dcfce7' }
    ];

    blades.forEach(b => {
      const grad = ctx.createLinearGradient(b.x, 128, b.topX, 128 - b.h);
      grad.addColorStop(0, '#1c4d15');
      grad.addColorStop(0.4, b.color);
      grad.addColorStop(1, b.tipColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(b.x - b.w / 2, 128);
      ctx.quadraticCurveTo(b.x, 128 - b.h * 0.6, b.topX, 128 - b.h);
      ctx.quadraticCurveTo(b.x + b.w / 3, 128 - b.h * 0.6, b.x + b.w / 2, 128);
      ctx.closePath();
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Realistic cut tree log cross-section with concentric growth rings, radial heartwood fissures, and bark rim
  static createWoodRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base sapwood color
    ctx.fillStyle = '#c8a265';
    ctx.fillRect(0, 0, 256, 256);

    const cx = 128;
    const cy = 128;

    // Dark heartwood center gradient
    const heartGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 115);
    heartGrad.addColorStop(0, '#78461b');
    heartGrad.addColorStop(0.35, '#99632f');
    heartGrad.addColorStop(0.85, '#cba56e');
    heartGrad.addColorStop(1, '#664322');
    ctx.fillStyle = heartGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 116, 0, Math.PI * 2);
    ctx.fill();

    // Concentric growth rings
    for (let r = 8; r < 114; r += 2.2 + Math.random() * 2.0) {
      ctx.strokeStyle = Math.random() < 0.6 ? 'rgba(70, 38, 14, 0.45)' : 'rgba(165, 120, 65, 0.35)';
      ctx.lineWidth = 0.8 + Math.random() * 1.2;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
        const wobble = Math.sin(a * 4 + r * 0.2) * 1.5 + Math.sin(a * 7) * 0.8;
        const x = cx + Math.cos(a) * (r + wobble);
        const y = cy + Math.sin(a) * (r + wobble);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Radial drying cracks / fissures from heartwood outward
    for (let crack = 0; crack < 6; crack++) {
      const angle = (crack / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const crackLen = 40 + Math.random() * 65;
      ctx.strokeStyle = 'rgba(25, 12, 4, 0.7)';
      ctx.lineWidth = 1.2 + Math.random() * 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let px = cx;
      let py = cy;
      for (let dist = 10; dist < crackLen; dist += 10) {
        px = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 4;
        py = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 4;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Outer bark collar rim
    ctx.strokeStyle = '#3d2514';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, 121, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Realistic natural granite / cliff rock texture with mineral veins, lichen, and micro-crags
  static createRockTexture(baseHex = 0x5a6069, hasLichen = true) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const col = new THREE.Color(baseHex);
    ctx.fillStyle = `rgb(${Math.floor(col.r * 255)}, ${Math.floor(col.g * 255)}, ${Math.floor(col.b * 255)})`;
    ctx.fillRect(0, 0, 512, 512);

    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 55;
      const speckle = Math.random() < 0.08 ? (Math.random() < 0.5 ? -40 : 45) : 0;
      d[i] = Math.max(0, Math.min(255, d[i] + noise + speckle));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise * 0.95 + speckle));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise * 0.9 + speckle));
    }
    ctx.putImageData(imgData, 0, 0);

    // Quartz / mineral veins
    for (let v = 0; v < 5; v++) {
      ctx.strokeStyle = Math.random() < 0.5 ? 'rgba(235, 235, 240, 0.45)' : 'rgba(40, 42, 45, 0.4)';
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      let vx = Math.random() * 512;
      let vy = 0;
      ctx.moveTo(vx, vy);
      for (let y = 0; y < 512; y += 20) {
        vx += (Math.random() - 0.5) * 22;
        ctx.lineTo(vx, y);
      }
      ctx.stroke();
    }

    // Moss & Lichen colonies
    if (hasLichen) {
      for (let l = 0; l < 80; l++) {
        const lx = Math.random() * 512;
        const ly = Math.random() * 512;
        const lr = 3 + Math.random() * 8;
        const isGoldLichen = Math.random() < 0.35;
        ctx.fillStyle = isGoldLichen ? 'rgba(202, 138, 4, 0.4)' : 'rgba(74, 124, 46, 0.45)';
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  // Multi-tone realistic foliage texture with branch veins, translucent sunlight highlights and organic leaf shapes
  static createLeafTexture(baseHex = 0x2e8540, tipHex = 0x86efac) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const baseCol = new THREE.Color(baseHex);
    const tipCol = new THREE.Color(tipHex);

    // Deep forest underlayer
    ctx.fillStyle = `rgb(${Math.floor(baseCol.r * 180)}, ${Math.floor(baseCol.g * 180)}, ${Math.floor(baseCol.b * 180)})`;
    ctx.fillRect(0, 0, 256, 256);

    // Scatter realistic leaf clusters
    for (let i = 0; i < 900; i++) {
      const lx = Math.random() * 256;
      const ly = Math.random() * 256;
      const angle = Math.random() * Math.PI * 2;
      const leafLen = 6 + Math.random() * 10;
      const leafWidth = 3 + Math.random() * 4;

      const t = Math.random();
      const lr = Math.floor((baseCol.r * (1 - t) + tipCol.r * t) * 255);
      const lg = Math.floor((baseCol.g * (1 - t) + tipCol.g * t) * 255);
      const lb = Math.floor((baseCol.b * (1 - t) + tipCol.b * t) * 255);

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      ctx.fillStyle = `rgb(${lr}, ${lg}, ${lb})`;

      ctx.beginPath();
      ctx.ellipse(0, 0, leafLen, leafWidth, 0, 0, Math.PI * 2);
      ctx.fill();

      // Central leaf vein
      ctx.strokeStyle = `rgba(30, 70, 20, 0.45)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-leafLen, 0);
      ctx.lineTo(leafLen, 0);
      ctx.stroke();

      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  // Realistic papery birch bark with dark horizontal lenticels and peeling parchment curls
  static createBirchBarkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base pale cream/white
    ctx.fillStyle = '#f1ece1';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle paper grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 18;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);

    // Characteristic dark horizontal lenticels (birch slits)
    for (let y = 10; y < 512; y += 12 + Math.random() * 20) {
      const count = 3 + Math.floor(Math.random() * 4);
      for (let c = 0; c < count; c++) {
        const x = Math.random() * 450;
        const width = 12 + Math.random() * 45;
        const h = 2 + Math.random() * 4;

        ctx.fillStyle = Math.random() < 0.75 ? '#241e17' : '#524334';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y, width / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Peeling curl shadow
        ctx.strokeStyle = 'rgba(180, 160, 130, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + width, y + h);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 4);
    return texture;
  }

  // Ancient Zonai carved stone texture with green-gold swirling spirals, Mesoamerican relief and gold leaf inlay
  static createZonaiStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Weathered dark teal-slate stone
    ctx.fillStyle = '#1e2e2b';
    ctx.fillRect(0, 0, 512, 512);

    // Stone texture grain
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 35;
      d[i] = Math.max(0, Math.min(255, d[i] + n * 0.6));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.8));
    }
    ctx.putImageData(imgData, 0, 0);

    // Zonai carved spiral glyphs
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)'; // Luminescent Zonai green
    ctx.lineWidth = 3.5;

    for (let gx = 64; gx < 512; gx += 128) {
      for (let gy = 64; gy < 512; gy += 128) {
        // Spiral
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.15) {
          const r = a * 5.0;
          const sx = gx + Math.cos(a) * r;
          const sy = gy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // Gold inlay dots
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(gx, gy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Carved masonry stone brick joints
    ctx.strokeStyle = 'rgba(10, 20, 18, 0.7)';
    ctx.lineWidth = 3;
    for (let by = 0; by < 512; by += 128) {
      ctx.beginPath();
      ctx.moveTo(0, by);
      ctx.lineTo(512, by);
      ctx.stroke();

      const offset = (by % 256 === 0) ? 0 : 64;
      for (let bx = offset; bx < 512; bx += 128) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx, by + 128);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  // Ancient Temple of Time marble and ruin pillar texture with fluting and Zonai gold inlay
  static createRuinPillarTexture(baseHex = 0xdad3c1) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Ancient off-white limestone / temple marble base
    const baseCol = new THREE.Color(baseHex);
    ctx.fillStyle = `rgb(${Math.floor(baseCol.r * 255)}, ${Math.floor(baseCol.g * 255)}, ${Math.floor(baseCol.b * 255)})`;
    ctx.fillRect(0, 0, 512, 512);

    // Stone grain noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 32;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.95));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.85));
    }
    ctx.putImageData(imgData, 0, 0);

    // Vertical fluted column shadow and highlight channels
    for (let x = 0; x < 512; x += 32) {
      const grad = ctx.createLinearGradient(x, 0, x + 32, 0);
      grad.addColorStop(0, 'rgba(80, 70, 60, 0.28)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
      grad.addColorStop(1, 'rgba(60, 50, 45, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 32, 512);
    }

    // Weathered horizontal joints and decorative Zonai golden bands
    for (let y = 64; y < 512; y += 128) {
      ctx.strokeStyle = 'rgba(70, 60, 50, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      // Golden frieze trim near joints
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, y - 12, 512, 6);
    }

    // Lichen specks
    for (let m = 0; m < 60; m++) {
      const lx = Math.random() * 512;
      const ly = Math.random() * 512;
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(74, 90, 64, 0.3)' : 'rgba(168, 162, 158, 0.35)';
      ctx.beginPath();
      ctx.arc(lx, ly, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);
    return texture;
  }

  // Weathered goblin hide skin texture with pores, muscle creases, and scars
  static createGoblinSkinTexture(baseHex = 0xc2410c) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const col = new THREE.Color(baseHex);
    ctx.fillStyle = `rgb(${Math.floor(col.r * 255)}, ${Math.floor(col.g * 255)}, ${Math.floor(col.b * 255)})`;
    ctx.fillRect(0, 0, 256, 256);

    const imgData = ctx.getImageData(0, 0, 256, 256);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 32;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.7));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.5));
    }
    ctx.putImageData(imgData, 0, 0);

    // Leather creases & battle scratches
    for (let s = 0; s < 6; s++) {
      ctx.strokeStyle = 'rgba(70, 15, 5, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sx = Math.random() * 200;
      const sy = Math.random() * 200;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 20 + Math.random() * 30, sy + (Math.random() - 0.5) * 15);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Realistic animal fur texture with directional hair grain and highlight depth (for Beaverfolk, Deer, Foxes)
  static createFurTexture(baseHex = 0x854d0e, highlightHex = 0xd97706) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const bCol = new THREE.Color(baseHex);
    const hCol = new THREE.Color(highlightHex);

    ctx.fillStyle = `rgb(${Math.floor(bCol.r * 220)}, ${Math.floor(bCol.g * 220)}, ${Math.floor(bCol.b * 220)})`;
    ctx.fillRect(0, 0, 256, 256);

    // Directional hair strands
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const len = 4 + Math.random() * 7;
      const isTip = Math.random() < 0.4;
      const col = isTip ? hCol : bCol;

      ctx.strokeStyle = `rgba(${Math.floor(col.r * 255)}, ${Math.floor(col.g * 255)}, ${Math.floor(col.b * 255)}, 0.6)`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 2, y + len);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  // Depths gloom obsidian texture with pulsing crimson/magenta malice veins
  static createGloomMaliceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Pitch obsidian black
    ctx.fillStyle = '#0d0208';
    ctx.fillRect(0, 0, 256, 256);

    // Malice pulsing veins
    ctx.strokeStyle = '#be185d'; // Deep crimson magenta
    ctx.lineWidth = 3.5;
    for (let v = 0; v < 8; v++) {
      ctx.beginPath();
      let vx = Math.random() * 256;
      let vy = Math.random() * 256;
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 6; s++) {
        vx += (Math.random() - 0.5) * 60;
        vy += (Math.random() - 0.5) * 60;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // Hot malice core threads
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    for (let v = 0; v < 6; v++) {
      ctx.beginPath();
      let vx = Math.random() * 256;
      let vy = Math.random() * 256;
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 5; s++) {
        vx += (Math.random() - 0.5) * 50;
        vy += (Math.random() - 0.5) * 50;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  // Realistic bird plumage feather texture
  static createFeatherTexture(baseHex = 0xf8fafc, accentHex = 0xe2e8f0) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const bCol = new THREE.Color(baseHex);
    const aCol = new THREE.Color(accentHex);

    ctx.fillStyle = `rgb(${Math.floor(bCol.r * 255)}, ${Math.floor(bCol.g * 255)}, ${Math.floor(bCol.b * 255)})`;
    ctx.fillRect(0, 0, 128, 128);

    // Overlapping feather barbs
    for (let y = 0; y < 128; y += 12) {
      for (let x = 0; x < 128; x += 16) {
        ctx.fillStyle = `rgba(${Math.floor(aCol.r * 240)}, ${Math.floor(aCol.g * 240)}, ${Math.floor(aCol.b * 240)}, 0.5)`;
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 9, 0, Math.PI);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Smooth Vector Tears of the Kingdom Paraglider Sailcloth Texture
  static createParagliderSailTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Warm cream canvas cloth base
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#fef9ee');
    grad.addColorStop(0.5, '#fef3c7');
    grad.addColorStop(1, '#fde68a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle fabric weave texture
    ctx.strokeStyle = 'rgba(180, 140, 90, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // 2. Dark brown geometric border trim along the edges
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, 480, 480);

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 4;
    ctx.strokeRect(26, 26, 460, 460);

    // Corner decorative Zonai diamond runes
    [[40, 40], [472, 40], [40, 472], [472, 472]].forEach(([cx, cy]) => {
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14);
      ctx.lineTo(cx + 14, cy);
      ctx.lineTo(cx, cy + 14);
      ctx.lineTo(cx - 14, cy);
      ctx.closePath();
      ctx.fill();
    });

    // 3. Golden Triforce at the top center of the canopy
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;

    const drawTri = (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.866, y + s * 0.5);
      ctx.lineTo(x - s * 0.866, y + s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    drawTri(256, 110, 24);
    drawTri(235, 148, 24);
    drawTri(277, 148, 24);

    // 4. Crimson Red Loftwing Royal Crest in Center
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;

    // Body & head
    ctx.beginPath();
    ctx.arc(256, 260, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, 230);
    ctx.lineTo(268, 205);
    ctx.lineTo(244, 205);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sweeping Wing Left
    ctx.beginPath();
    ctx.moveTo(240, 250);
    ctx.bezierCurveTo(180, 210, 110, 230, 70, 310);
    ctx.bezierCurveTo(120, 310, 170, 290, 235, 275);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing Left feathers
    [100, 135, 175].forEach(fx => {
      ctx.beginPath();
      ctx.moveTo(fx, 280);
      ctx.lineTo(fx - 18, 335);
      ctx.lineTo(fx + 10, 300);
      ctx.closePath();
      ctx.fill();
    });

    // Sweeping Wing Right
    ctx.beginPath();
    ctx.moveTo(272, 250);
    ctx.bezierCurveTo(332, 210, 402, 230, 442, 310);
    ctx.bezierCurveTo(392, 310, 342, 290, 277, 275);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing Right feathers
    [412, 377, 337].forEach(fx => {
      ctx.beginPath();
      ctx.moveTo(fx, 280);
      ctx.lineTo(fx + 18, 335);
      ctx.lineTo(fx - 10, 300);
      ctx.closePath();
      ctx.fill();
    });

    // Tail Feathers
    ctx.beginPath();
    ctx.moveTo(256, 280);
    ctx.lineTo(235, 410);
    ctx.lineTo(256, 385);
    ctx.lineTo(277, 410);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  // Smooth Vector Hylian Shield Texture
  static createHylianShieldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Royal Blue Background with radial sheen
    const bg = ctx.createRadialGradient(256, 220, 40, 256, 256, 250);
    bg.addColorStop(0, '#2563eb');
    bg.addColorStop(0.6, '#1d4ed8');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 512);

    // Silver Bevel Edge
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 18;
    ctx.strokeRect(18, 18, 476, 476);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 456, 456);

    // Golden Triforce
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;

    const drawT = (x, y, s) => {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s * 0.866, y + s * 0.5);
      ctx.lineTo(x - s * 0.866, y + s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    drawT(256, 120, 32);
    drawT(228, 172, 32);
    drawT(284, 172, 32);

    // Crimson Loftwing Crest
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;

    // Head / Body
    ctx.beginPath();
    ctx.arc(256, 290, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Wings
    ctx.beginPath();
    ctx.moveTo(256, 280);
    ctx.bezierCurveTo(180, 230, 90, 280, 60, 360);
    ctx.bezierCurveTo(130, 350, 190, 330, 256, 310);
    ctx.bezierCurveTo(322, 330, 382, 350, 452, 360);
    ctx.bezierCurveTo(422, 280, 332, 230, 256, 280);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lower Shield Heraldry Chevron
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(256, 450);
    ctx.lineTo(190, 390);
    ctx.lineTo(210, 390);
    ctx.lineTo(256, 430);
    ctx.lineTo(302, 390);
    ctx.lineTo(322, 390);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    return texture;
  }

  // Great Fairy Floral Petal Texture
  static createGreatFairyPetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#831843');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Golden ethereal vein lines
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(128, 256);
      ctx.quadraticCurveTo(60 + i * 25, 120, 80 + i * 20, 10);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }
}


