import * as THREE from 'three';

// Day & Night Cycle with Orbiting Sun/Moon, Sky Coloring, Star Showers, and Day Milestones
export class DayNightCycle {
  constructor() {
    this.day = 1;
    this.timeOfDay = 0.3; // Start in mid-morning
    this.dayDurationSeconds = 360; // 6 minutes per full day/night cycle
    this.sunMesh = null;
    this.moonMesh = null;
    this.starfield = null;
    this.shootingStars = [];
    this.fallenStardustItems = [];
    this.meteorFellTonight = false;
    this.onNewDayCallback = null;

    // Dynamic Weather State Machine
    this.weather = 'CLEAR'; // 'CLEAR', 'OVERCAST', 'RAIN', 'THUNDERSTORM'
    this.weatherTimer = 0;
    this.nextWeatherInterval = 130;
    this.lightningCooldown = 15;
    this.pianoTimer = 0;
  }

  init(scene, engine) {
    this.scene = scene;
    this.engine = engine;

    // 1. Sun Sphere Mesh
    const sunGeom = new THREE.SphereGeometry(6, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff5c0 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    scene.add(this.sunMesh);

    // 2. Moon Sphere Mesh
    const moonGeom = new THREE.SphereGeometry(4.5, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xd9e8f5 });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    scene.add(this.moonMesh);

    // 3. Starfield Sphere
    const starCount = 600;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = [];
    const starColors = [];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 380;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)); // Mostly dome above
      const z = r * Math.sin(phi) * Math.sin(theta);
      starPositions.push(x, y, z);

      const isCosmic = Math.random() < 0.2;
      const starCol = isCosmic ? new THREE.Color(0xc084fc) : new THREE.Color(0xffffff);
      starColors.push(starCol.r, starCol.g, starCol.b);
    }

    starGeom.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.0
    });
    this.starfield = new THREE.Points(starGeom, starMat);
    scene.add(this.starfield);
  }

  setTime(day, timeOfDay) {
    this.day = day;
    this.timeOfDay = timeOfDay;
  }

  isDay() {
    return this.timeOfDay >= 0.22 && this.timeOfDay <= 0.78;
  }

  getPhotosynthesisEfficiency() {
    if (!this.isDay()) return 0.0;
    // Peak at 0.5 (noon)
    const middayDist = Math.abs(this.timeOfDay - 0.5);
    return Math.max(0, 1.0 - (middayDist / 0.28));
  }

  update(delta, playerPos) {
    const prevTime = this.timeOfDay;
    this.timeOfDay += delta / this.dayDurationSeconds;

    // Check for day rollover (midnight to morning)
    if (this.timeOfDay >= 1.0) {
      this.timeOfDay -= 1.0;
      this.day++;
      if (this.onNewDayCallback) {
        this.onNewDayCallback(this.day);
      }
    }

    // Calculate Sun and Moon orbital angles
    const angle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
    const orbitRadius = 180;

    const sunX = Math.cos(angle) * orbitRadius;
    const sunY = Math.sin(angle) * orbitRadius;
    const sunZ = Math.sin(angle * 0.5) * 40;

    if (this.sunMesh) {
      this.sunMesh.position.set(sunX + playerPos.x, sunY, sunZ + playerPos.z);
    }
    if (this.moonMesh) {
      this.moonMesh.position.set(-sunX + playerPos.x, -sunY, -sunZ + playerPos.z);
    }

    // Update Sun Directional Light & Rim Light
    if (this.engine && this.engine.sunLight) {
      const sunHeightRatio = Math.sin(angle);
      if (sunHeightRatio > -0.1) {
        this.engine.sunLight.position.set(sunX, Math.max(10, sunY), sunZ);
        const dayIntensity = Math.max(0.1, sunHeightRatio * 1.45);
        this.engine.sunLight.intensity = dayIntensity;
        this.engine.sunLight.color.setHex(sunHeightRatio < 0.2 ? 0xffaa55 : 0xfffaed);
        if (this.engine.rimLight) {
          this.engine.rimLight.position.set(-sunX * 0.75, Math.max(15, -sunY * 0.3 + 20), -sunZ * 0.75);
          this.engine.rimLight.intensity = dayIntensity * 0.38;
        }
      } else {
        // Moonlight at night
        this.engine.sunLight.position.set(-sunX, Math.max(10, -sunY), -sunZ);
        this.engine.sunLight.intensity = 0.28;
        this.engine.sunLight.color.setHex(0xa0c4ff);
        if (this.engine.rimLight) {
          this.engine.rimLight.intensity = 0.12;
        }
      }
    }

    // Update Sun Corona position in Sky Dome
    if (this.engine && this.engine.sunDisc) {
      const coronaDir = new THREE.Vector3(sunX, Math.max(-50, sunY), sunZ).normalize().multiplyScalar(440);
      this.engine.sunDisc.position.copy(coronaDir);
      this.engine.sunDisc.lookAt(0, 0, 0);
      this.engine.sunDisc.visible = sunY > -10;
      if (this.engine.sunHalo) {
        this.engine.sunHalo.position.copy(coronaDir);
        this.engine.sunHalo.lookAt(0, 0, 0);
        this.engine.sunHalo.visible = sunY > -10;
      }
    }

    // Sky and Fog Colors (Adjusted dynamically for time of day & weather)
    let skyColor = new THREE.Color();
    let fogDensity = 0.007;

    if (this.timeOfDay > 0.2 && this.timeOfDay < 0.3) {
      // Dawn (0.2 - 0.3): Deep purple -> golden orange
      const t = (this.timeOfDay - 0.2) / 0.1;
      skyColor.setHex(0x3a1c52).lerp(new THREE.Color(0xf68e5f), t);
    } else if (this.timeOfDay >= 0.3 && this.timeOfDay <= 0.7) {
      // Daytime (0.3 - 0.7): Bright blue sky
      skyColor.setHex(0x60a5fa);
    } else if (this.timeOfDay > 0.7 && this.timeOfDay < 0.8) {
      // Sunset (0.7 - 0.8): Fiery crimson -> dark navy
      const t = (this.timeOfDay - 0.7) / 0.1;
      skyColor.setHex(0xe11d48).lerp(new THREE.Color(0x0f172a), t);
    } else {
      // Night (0.8 - 0.2): Deep cosmic midnight
      skyColor.setHex(0x070b19);
      fogDensity = 0.009;
    }

    // Blend in weather effects
    if (this.weather === 'OVERCAST') {
      skyColor.lerp(new THREE.Color(0x94a3b8), 0.6);
      fogDensity = 0.011;
    } else if (this.weather === 'RAIN') {
      skyColor.lerp(new THREE.Color(0x475569), 0.75);
      fogDensity = 0.014;
    } else if (this.weather === 'THUNDERSTORM') {
      skyColor.lerp(new THREE.Color(0x1e293b), 0.85);
      fogDensity = 0.017;
    }

    if (this.scene) {
      this.scene.background = skyColor;
      if (this.scene.fog) {
        this.scene.fog.color.copy(skyColor);
        this.scene.fog.density = fogDensity;
      }
    }

    // Weather timer cycle
    this.weatherTimer += delta;
    if (this.weatherTimer > this.nextWeatherInterval) {
      this.weatherTimer = 0;
      this.nextWeatherInterval = 120 + Math.random() * 90;
      const roll = Math.random();
      if (roll < 0.45) this.setWeather('CLEAR');
      else if (roll < 0.70) this.setWeather('OVERCAST');
      else if (roll < 0.88) this.setWeather('RAIN');
      else this.setWeather('THUNDERSTORM');
    }

    // Thunderstorm lightning strikes
    if (this.weather === 'THUNDERSTORM') {
      this.lightningCooldown -= delta;
      if (this.lightningCooldown <= 0) {
        this.lightningCooldown = 12 + Math.random() * 16;
        if (this.engine) this.engine.triggerLightning(0.3);
      }
    }

    // Procedural Zelda Piano Flourish interval during peaceful sylvan travel
    this.pianoTimer += delta;
    if (this.pianoTimer > 18) {
      this.pianoTimer = 0;
      if (Math.random() < 0.65) {
        import('../core/AudioManager.js').then(({ audio }) => {
          audio.playZeldaPianoFlourish(this.isDay() ? 'day' : 'night');
        });
      }
    }

    // Night Starfield Opacity
    if (this.starfield) {
      const nightFactor = !this.isDay() && (this.weather === 'CLEAR') ? 1.0 : 0.0;
      this.starfield.material.opacity = THREE.MathUtils.lerp(this.starfield.material.opacity, nightFactor, delta * 2.0);
      this.starfield.position.copy(playerPos);
      this.starfield.rotation.y += delta * 0.01;
    }

    // Reset meteor trigger when day arrives
    if (this.isDay()) {
      this.meteorFellTonight = false;
    }

    // Rare Night Meteor / Celestial Event: At most 1 per night, and only if no star fragment is on ground
    if (!this.isDay() && !this.meteorFellTonight && this.fallenStardustItems.length === 0 && Math.random() < delta * 0.005) {
      this.meteorFellTonight = true;
      this.spawnMeteor(playerPos);
    }
  }

  setWeather(type) {
    this.weather = type;
    if (this.engine) {
      this.engine.setRaining(type === 'RAIN' || type === 'THUNDERSTORM');
    }
    import('../core/AudioManager.js').then(({ audio }) => {
      audio.setWeatherAudio(type);
    });
    if (window.showGameNotification) {
      if (type === 'RAIN') window.showGameNotification('🌧️ Sylvan showers fall over the grove.');
      else if (type === 'THUNDERSTORM') window.showGameNotification('⛈️ A fierce thunderstorm rolls across the canopy!');
      else if (type === 'CLEAR') window.showGameNotification('☀️ The skies clear over the forest.');
    }
  }

  // Shoot a rare falling star down towards the ground
  spawnMeteor(playerPos) {
    if (this.fallenStardustItems.length > 0) return;

    const meteorGeom = new THREE.SphereGeometry(0.45, 8, 8);
    const meteorMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const meteor = new THREE.Mesh(meteorGeom, meteorMat);

    const startX = playerPos.x + (Math.random() - 0.5) * 60;
    const startZ = playerPos.z + (Math.random() - 0.5) * 60;
    const targetY = 1.0;

    meteor.position.set(startX, 60, startZ);
    this.scene.add(meteor);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      -30,
      (Math.random() - 0.5) * 10
    );

    const checkImpact = setInterval(() => {
      meteor.position.addScaledVector(velocity, 0.05);
      if (meteor.position.y <= targetY) {
        clearInterval(checkImpact);
        // Explode into Cosmic Stardust Fragment that player can absorb
        this.engine.spawnCosmicBurst(meteor.position);
        this.createStardustPickup(meteor.position.clone());
        this.scene.remove(meteor);
      }
    }, 50);
  }

  // A glowing collectible star fragment on the ground (capped to 1 active)
  createStardustPickup(position) {
    while (this.fallenStardustItems.length >= 1) {
      const old = this.fallenStardustItems.pop();
      if (old) this.scene.remove(old);
    }

    const starGeom = new THREE.OctahedronGeometry(0.35);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xa855f7,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const starMesh = new THREE.Mesh(starGeom, starMat);
    starMesh.position.copy(position);
    starMesh.position.y = Math.max(0.5, position.y);
    starMesh.castShadow = true;
    starMesh.userData = { isStardust: true, value: 25 };

    this.scene.add(starMesh);
    this.fallenStardustItems.push(starMesh);
  }
}

export const dayNight = new DayNightCycle();

