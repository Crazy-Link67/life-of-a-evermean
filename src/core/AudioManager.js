// Procedural Web Audio Synthesizer for Life of an Evermean
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.musicGain = null;

    this.settings = {
      master: 0.8,
      sfx: 0.9,
      ambient: 0.6,
      music: 0.5
    };

    this.ambientNodes = [];
    this.isInitialized = false;

    // Weather & Dynamic Soundscape Nodes
    this.rainGain = null;
    this.rainSource = null;
    this.waterGain = null;
    this.waterSource = null;
    this.ultrahandOsc = null;
    this.ultrahandGain = null;
    this.currentWeather = 'CLEAR';
    this.lastPianoTime = 0;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.settings.master;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.settings.sfx;
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.settings.ambient;
      this.ambientGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.settings.music;
      this.musicGain.connect(this.masterGain);

      this.startAmbientSoundscape();
      this.initWeatherAndWaterAudio();
      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not be initialized:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(settings) {
    if (settings.master !== undefined) {
      this.settings.master = settings.master;
      if (this.masterGain) this.masterGain.gain.value = settings.master;
    }
    if (settings.sfx !== undefined) {
      this.settings.sfx = settings.sfx;
      if (this.sfxGain) this.sfxGain.gain.value = settings.sfx;
    }
    if (settings.ambient !== undefined) {
      this.settings.ambient = settings.ambient;
      if (this.ambientGain) this.ambientGain.gain.value = settings.ambient;
    }
    if (settings.music !== undefined) {
      this.settings.music = settings.music;
      if (this.musicGain) this.musicGain.gain.value = settings.music;
    }
  }

  // Helper for generating noise buffers
  createNoiseBuffer(duration = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Root-leg skitter footstep sound (wooden tap on soil)
  playRootStep(pitchMult = 1.0) {
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime((110 + Math.random() * 30) * pitchMult, t);
    osc.frequency.exponentialRampToValueAtTime(35 * pitchMult, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);

    // Add wooden click
    const noiseBuffer = this.createNoiseBuffer(0.05);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600 * pitchMult;
      filter.Q.value = 3;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.15, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Violent TOTK Head-Slam sound: Low rumble, wood snap, ground shockwave
  playHeadSlam(power = 1.0, isMantis = false) {
    if (!this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140 * power, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

    subGain.gain.setValueAtTime(0.7 * Math.min(power, 1.5), t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.45);

    // Wood snap / crunch
    const noiseBuffer = this.createNoiseBuffer(0.3);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = isMantis ? 'highpass' : 'bandpass';
      filter.frequency.value = isMantis ? 1200 : 450;
      filter.Q.value = 2;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.5 * power, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
    }

    // Wood creak overtone
    const creakOsc = this.ctx.createOscillator();
    const creakGain = this.ctx.createGain();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(isMantis ? 400 : 180, t);
    creakOsc.frequency.linearRampToValueAtTime(isMantis ? 120 : 60, t + 0.2);

    creakGain.gain.setValueAtTime(0.3 * power, t);
    creakGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    creakOsc.connect(creakGain);
    creakGain.connect(this.sfxGain);
    creakOsc.start(t);
    creakOsc.stop(t + 0.25);
  }

  // Mantis Scythe Slash
  playMantisSlash() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.2);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.15);
      filter.Q.value = 4;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Camouflage / Tree Disguise Root Anchor sound
  playDisguise() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Water Swimming & Splashing
  playSwimPaddle() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.25);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, t);
      filter.frequency.linearRampToValueAtTime(800, t + 0.1);
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Elemental: Fire Burst
  playFireBurst() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.5);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Elemental: Lightning Thunder Strike
  playThunderSlam() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Cosmic Singularity & Ascension sound
  playCosmicSlam() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Ethereal chord
    [220, 329.63, 440, 554.37, 659.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.6);

      gain.gain.setValueAtTime(0.15, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.04);
      osc.stop(t + 0.9);
    });
  }

  // Level Up / Evolution Fanfare
  playEvolution() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C Major arpeggio
    notes.forEach((note, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, t + idx * 0.08);

      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.45);
    });
  }

  // Cucco cluck sound
  playCuccoCluck() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Cucco flock revenge attack screech
  playCuccoFlock() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const f = 600 + i * 150 + Math.random() * 100;
      osc.frequency.setValueAtTime(f, t + i * 0.05);
      osc.frequency.linearRampToValueAtTime(f + 300, t + i * 0.05 + 0.1);
      gain.gain.setValueAtTime(0.15, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.22);
    }
  }

  // Blupee celestial bell chime & rupee sparkles
  playBlupeeChime() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.18, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.4);
    });
  }

  // Chuchu squish & pop
  playChuchuSquish() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Bubbulfrog divine bubble pop chime
  playBubbulfrogChime() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    [440, 659.25, 880, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.55);
    });
  }

  // Zonai rocket / fan high-energy burst
  playZonaiBoost() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.35);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  // Ambient Forest & Wind procedural soundscape
  startAmbientSoundscape() {
    if (!this.ctx) return;

    // Wind noise loop
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.25;

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    whiteNoise.start();

    // Occasional gentle wood groan / bird chirp interval
    setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (Math.random() < 0.3) {
        this.playGentleBird();
      }
    }, 4000);
  }

  playGentleBird() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseF = 1800 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseF, t);
    osc.frequency.exponentialRampToValueAtTime(baseF + 400, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(baseF, t + 0.12);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ambientGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  initWeatherAndWaterAudio() {
    if (!this.ctx) return;

    // 1. Looping Rain Noise Node
    const rainNoiseBuffer = this.createNoiseBuffer(2.0);
    if (rainNoiseBuffer) {
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = rainNoiseBuffer;
      this.rainSource.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 1100;
      rainFilter.Q.value = 0.85;

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = 0.0001; // silent initially

      this.rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ambientGain);
      this.rainSource.start();
    }

    // 2. Looping River / Lake Running Water Sound Node
    const waterNoiseBuffer = this.createNoiseBuffer(2.0);
    if (waterNoiseBuffer) {
      this.waterSource = this.ctx.createBufferSource();
      this.waterSource.buffer = waterNoiseBuffer;
      this.waterSource.loop = true;

      const waterFilter = this.ctx.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 480;

      this.waterGain = this.ctx.createGain();
      this.waterGain.gain.value = 0.0001;

      this.waterSource.connect(waterFilter);
      waterFilter.connect(this.waterGain);
      this.waterGain.connect(this.ambientGain);
      this.waterSource.start();
    }
  }

  setWeatherAudio(weatherType) {
    this.currentWeather = weatherType;
    if (!this.ctx || !this.rainGain) return;

    const t = this.ctx.currentTime;
    let targetRainVol = 0.0001;
    if (weatherType === 'RAIN') {
      targetRainVol = 0.28;
    } else if (weatherType === 'THUNDERSTORM') {
      targetRainVol = 0.42;
    }

    this.rainGain.gain.setTargetAtTime(targetRainVol, t, 1.2);
  }

  // Update river water trickling volume based on distance to river or lake (0 - 18 meters)
  updateWaterProximity(distanceToWater) {
    if (!this.ctx || !this.waterGain) return;
    const t = this.ctx.currentTime;
    let vol = 0.0001;
    if (distanceToWater < 18.0) {
      vol = Math.max(0.0001, (1.0 - (distanceToWater / 18.0)) * 0.26);
    }
    this.waterGain.gain.setTargetAtTime(vol, t, 0.4);
  }

  // Rolling Thunder sound with sub-bass crash and trailing echo
  playThunder(distance = 1.0) {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sub rumble oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(65, t);
    subOsc.frequency.exponentialRampToValueAtTime(22, t + 1.2);

    const distFactor = Math.max(0.2, 1.0 - distance * 0.4);
    subGain.gain.setValueAtTime(0.6 * distFactor, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 2.0);

    // Crackle noise burst
    const noiseBuffer = this.createNoiseBuffer(0.9);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.linearRampToValueAtTime(120, t + 0.9);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35 * distFactor, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Zelda TOTK Ultrahand Magnetic Beam Hum
  startUltrahandHum() {
    if (!this.ctx || this.ultrahandOsc) return;
    this.resume();
    const t = this.ctx.currentTime;

    this.ultrahandOsc = this.ctx.createOscillator();
    this.ultrahandGain = this.ctx.createGain();

    this.ultrahandOsc.type = 'sine';
    this.ultrahandOsc.frequency.setValueAtTime(320, t);

    this.ultrahandGain.gain.setValueAtTime(0.001, t);
    this.ultrahandGain.gain.linearRampToValueAtTime(0.18, t + 0.15);

    this.ultrahandOsc.connect(this.ultrahandGain);
    this.ultrahandGain.connect(this.sfxGain);
    this.ultrahandOsc.start(t);
  }

  stopUltrahandHum() {
    if (!this.ctx || !this.ultrahandOsc) return;
    const t = this.ctx.currentTime;
    if (this.ultrahandGain) {
      this.ultrahandGain.gain.linearRampToValueAtTime(0.001, t + 0.1);
    }
    setTimeout(() => {
      try {
        if (this.ultrahandOsc) {
          this.ultrahandOsc.stop();
          this.ultrahandOsc.disconnect();
          this.ultrahandOsc = null;
        }
      } catch (e) {}
    }, 120);
  }

  // Zelda TOTK Fuse Latch Chime (The signature Zonai latch sound)
  playFuseLatch() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Dual-tone Zonai chime
    [587.33, 880.0, 1174.66].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.22, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.45);
    });
  }

  // Bokoblin Alert Horn blast
  playBokoblinHorn() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(145, t);
    osc.frequency.linearRampToValueAtTime(175, t + 0.15);
    osc.frequency.linearRampToValueAtTime(160, t + 0.45);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // Yahaha! Korok Chime
  playKorokYahaha() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1320, t);
    osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.1);

    gain1.gain.setValueAtTime(0.25, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.22);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2093, t + 0.12);
    gain2.gain.setValueAtTime(0.25, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.12);
    osc2.stop(t + 0.38);
  }

  // Procedural Zelda BOTW / TOTK Melodic Piano Flourish
  playZeldaPianoFlourish(theme = 'day') {
    if (!this.ctx) return;
    this.resume();
    const now = Date.now();
    if (now - this.lastPianoTime < 7000) return; // Sparse, thoughtful pauses between phrases
    this.lastPianoTime = now;

    const t = this.ctx.currentTime;

    // Pentatonic scale frequencies
    const dayScale = [293.66, 369.99, 440.0, 493.88, 587.33, 739.99]; // D major / Lydian
    const nightScale = [220.0, 261.63, 329.63, 392.0, 440.0, 523.25]; // A minor sylvan
    const scale = theme === 'night' ? nightScale : dayScale;

    // Pick 3 to 4 notes to play in gentle succession
    const noteCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < noteCount; i++) {
      const noteFreq = scale[Math.floor(Math.random() * scale.length)];
      const noteDelay = i * (0.24 + Math.random() * 0.18);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, t + noteDelay);

      // Piano envelope: fast attack, warm sustain, long gentle decay
      gain.gain.setValueAtTime(0.12, t + noteDelay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDelay + 1.4);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + noteDelay);
      osc.stop(t + noteDelay + 1.5);
    }
  }
}

export const audio = new AudioManager();

