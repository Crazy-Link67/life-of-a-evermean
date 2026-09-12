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

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    if (settings.shadows !== false) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.set(60, 100, 40);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 300;
    const d = 70;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Resize Handler
    window.addEventListener('resize', () => this.onWindowResize());
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

