import * as THREE from 'three';

export class Engine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.screenShake = 0;
    this.shakeDecay = 5.0;

    // Particle manager
    this.particles = [];
  }

  init(container, settings = {}) {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

    // 2. Camera
    const fov = settings.fov || 75;
    this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 2, 5);
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    if (THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    if (settings.shadows !== false) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    // 4. Lighting & Atmosphere
    this.ambientLight = new THREE.AmbientLight(0xfff3e0, 0.38);
    this.scene.add(this.ambientLight);

    // Dual-bounce realistic natural ambient light (sky bounce vs earth bounce)
    this.hemiLight = new THREE.HemisphereLight(0xb1e3ff, 0x3a2c1b, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Primary Sun Directional Light with 4096 Ultra-res PCF Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.45);
    this.sunLight.position.set(60, 100, 40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 320;
    const d = 75;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.03;
    this.scene.add(this.sunLight);

    // Dynamic Rim Backlight (TOTK silhouette edge highlights)
    this.rimLight = new THREE.DirectionalLight(0xffeedd, 0.45);
    this.rimLight.position.set(-60, 45, -40);
    this.scene.add(this.rimLight);

    // 5. Atmospheric Sky Dome & Sun Corona
    this.createSkyDome();

    // Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createSkyDome() {
    const skyGeom = new THREE.SphereGeometry(480, 32, 16);
    // Custom gradient shader or vertex colored sky
    const skyColors = [];
    const pos = skyGeom.attributes.position;
    const topColor = new THREE.Color(0x3a82ee);
    const horizonColor = new THREE.Color(0xa7d5f8);
    const groundColor = new THREE.Color(0x283b27);

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const col = new THREE.Color();
      if (y > 0) {
        const factor = Math.min(1, y / 300);
        col.copy(horizonColor).lerp(topColor, factor);
      } else {
        col.copy(horizonColor).lerp(groundColor, Math.min(1, -y / 100));
      }
      skyColors.push(col.r, col.g, col.b);
    }
    skyGeom.setAttribute('color', new THREE.Float32BufferAttribute(skyColors, 3));
    const skyMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.skyDome = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.skyDome);

    // Sun Corona Core Disc
    const sunGeom = new THREE.CircleGeometry(16, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff5c0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.sunDisc = new THREE.Mesh(sunGeom, sunMat);
    const sunDir = new THREE.Vector3(60, 100, 40).normalize().multiplyScalar(440);
    this.sunDisc.position.copy(sunDir);
    this.sunDisc.lookAt(0, 0, 0);
    this.scene.add(this.sunDisc);

    // Outer soft radiant corona halo
    const haloGeom = new THREE.CircleGeometry(48, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.sunHalo = new THREE.Mesh(haloGeom, haloMat);
    this.sunHalo.position.copy(sunDir);
    this.sunHalo.lookAt(0, 0, 0);
    this.scene.add(this.sunHalo);
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  applyScreenShake(amount = 0.5) {
    this.screenShake = Math.min(this.screenShake + amount, 1.2);
  }

  // Spawn visual particle effects
  spawnParticles(position, count = 15, color = 0x8b5a2b, speed = 4, size = 0.15, type = 'box') {
    const group = new THREE.Group();
    group.position.copy(position);

    let geom;
    if (type === 'box') {
      geom = new THREE.BoxGeometry(size, size, size);
    } else {
      geom = new THREE.DodecahedronGeometry(size);
    }

    const mat = new THREE.MeshLambertMaterial({ color });
    const items = [];

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.4
      );
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 1.2,
        (Math.random() - 0.5) * speed
      );
      items.push({ mesh, velocity, life: 1.0, decay: 1.5 + Math.random() });
      group.add(mesh);
    }

    this.scene.add(group);
    this.particles.push({ group, items });
  }

  // Water Splash Particles
  spawnWaterSplash(position, count = 20) {
    this.spawnParticles(position, count, 0x70c8ff, 3.5, 0.12, 'sphere');
  }

  // Dust Shockwave Ring on Head Slam
  spawnShockwave(position, radius = 2.5, color = 0xd2b48c) {
    const ringGeom = new THREE.RingGeometry(0.1, 0.4, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.copy(position);
    ring.position.y += 0.05;
    this.scene.add(ring);

    let scale = 1.0;
    const interval = setInterval(() => {
      scale += 0.4;
      ring.scale.set(scale, 1, scale);
      ringMat.opacity -= 0.08;
      if (ringMat.opacity <= 0) {
        clearInterval(interval);
        this.scene.remove(ring);
        ringGeom.dispose();
        ringMat.dispose();
      }
    }, 16);
  }

  // Cosmic Nebula Particle Burst
  spawnCosmicBurst(position, count = 35) {
    this.spawnParticles(position, count, 0xb82bf2, 6.0, 0.2, 'sphere');
    this.spawnParticles(position, count / 2, 0x00ffff, 4.5, 0.15, 'sphere');
  }

  update(delta) {
    // Screen shake decay
    if (this.screenShake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake * 0.2;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake * 0.2;
      this.screenShake = Math.max(0, this.screenShake - delta * this.shakeDecay);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pGroup = this.particles[i];
      let activeCount = 0;

      for (let j = 0; j < pGroup.items.length; j++) {
        const item = pGroup.items[j];
        if (item.life > 0) {
          item.velocity.y -= 9.8 * delta; // Gravity
          item.mesh.position.addScaledVector(item.velocity, delta);
          item.mesh.rotation.x += 4 * delta;
          item.mesh.rotation.y += 4 * delta;
          item.life -= delta * item.decay;
          item.mesh.scale.setScalar(Math.max(0.01, item.life));
          activeCount++;
        }
      }

      if (activeCount === 0) {
        this.scene.remove(pGroup.group);
        this.particles.splice(i, 1);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export const engine = new Engine();

