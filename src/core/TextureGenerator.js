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

    // Multi-frequency noise for earthy soil and moss variation
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      const mossNoise = Math.sin((i / 4) * 0.05) * 15;
      data[i] = Math.max(0, Math.min(255, data[i] + noise * 0.6));       // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise + mossNoise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.4)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // Fine grass blades and clover details
    for (let b = 0; b < 1200; b++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 3 + Math.random() * 7;
      const angle = (Math.random() - 0.5) * 1.2;

      ctx.strokeStyle = Math.random() < 0.4 ? '#4da33a' : '#22521c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
      ctx.stroke();
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

  // Water normal map for realistic shimmering waves and ripples
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
        const waveX = Math.sin(x * 0.12) * Math.cos(y * 0.08);
        const waveY = Math.cos(x * 0.09) * Math.sin(y * 0.14);
        d[idx] = Math.floor(128 + waveX * 60);     // X normal
        d[idx + 1] = Math.floor(128 + waveY * 60); // Y normal
        d[idx + 2] = 255;                          // Z normal
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

    // Draw clustered stylized grass blades
    const blades = [
      { x: 32, topX: 20, h: 110, w: 7, color: '#3d8c2c' },
      { x: 32, topX: 44, h: 100, w: 6, color: '#4da638' },
      { x: 32, topX: 28, h: 122, w: 8, color: '#5ebf45' },
      { x: 32, topX: 52, h: 85,  w: 5, color: '#367c26' },
      { x: 32, topX: 12, h: 92,  w: 6, color: '#68d14d' }
    ];

    blades.forEach(b => {
      ctx.fillStyle = b.color;
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
}

