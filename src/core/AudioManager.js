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
    this.underwaterGain = null;
    this.underwaterSource = null;
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

    osc.type = 'sine';
    osc.frequency.setValueAtTime((85 + Math.random() * 20) * pitchMult, t);
    osc.frequency.exponentialRampToValueAtTime(30 * pitchMult, t + 0.06);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);

    // Subtle soft grass / soil rustle
    const noiseBuffer = this.createNoiseBuffer(0.04);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260 * pitchMult;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.035, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

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

  // Ambient Forest & Wind procedural soundscape (calm, smooth, no annoying high-pitch noise)
  startAmbientSoundscape() {
    if (!this.ctx) return;

    // Wind noise loop - gentle whispering breeze
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.012; // Very gentle ambient floor

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    whiteNoise.start();
  }

  // Soft mellow wood whistle
  playGentleBird() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 550;

    osc.type = 'sine';
    const baseF = 440;
    osc.frequency.setValueAtTime(baseF, t);
    osc.frequency.exponentialRampToValueAtTime(baseF + 80, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(baseF, t + 0.25);

    gain.gain.setValueAtTime(0.005, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    osc.start(t);
    osc.stop(t + 0.32);
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

  // Zelda TOTK Recall Clock Tick
  playRecallTick() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Recall Golden Time-Reverse Hum
  startRecallHum() {
    if (!this.ctx || this.recallOsc) return;
    this.resume();
    const t = this.ctx.currentTime;

    this.recallOsc = this.ctx.createOscillator();
    this.recallGain = this.ctx.createGain();

    this.recallOsc.type = 'sawtooth';
    this.recallOsc.frequency.setValueAtTime(220, t);
    this.recallOsc.frequency.linearRampToValueAtTime(280, t + 0.3);

    this.recallGain.gain.setValueAtTime(0.001, t);
    this.recallGain.gain.linearRampToValueAtTime(0.16, t + 0.2);

    this.recallOsc.connect(this.recallGain);
    this.recallGain.connect(this.sfxGain);
    this.recallOsc.start(t);
  }

  stopRecallHum() {
    if (!this.ctx || !this.recallOsc) return;
    const t = this.ctx.currentTime;
    if (this.recallGain) {
      this.recallGain.gain.linearRampToValueAtTime(0.001, t + 0.1);
    }
    setTimeout(() => {
      try {
        if (this.recallOsc) {
          this.recallOsc.stop();
          this.recallOsc.disconnect();
          this.recallOsc = null;
        }
      } catch (e) {}
    }, 120);
  }

  // Paraglider / Leaf Canopy deploy whoosh
  playGliderDeploy() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.35);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.linearRampToValueAtTime(1400, t + 0.12);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Ancient Zonai Shrine Completion Chime & Divine Flourish
  playShrineChime() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Harmonic bell chime chord
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.2, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 2.4);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 2.5);
    });
  }

  // Zelda-style Treasure Chest Opening Fanfare
  playChestOpen() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Ascending brass/reed arpeggio
    const notes = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99, 987.77];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);

      gain.gain.setValueAtTime(0.18, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.38);
    });

    // Grand culminating golden chord chime
    setTimeout(() => {
      if (!this.ctx) return;
      const tEnd = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, tEnd);
        gain.gain.setValueAtTime(0.28, tEnd);
        gain.gain.exponentialRampToValueAtTime(0.001, tEnd + 1.8);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(tEnd);
        osc.stop(tEnd + 1.9);
      });
    }, notes.length * 90);
  }

  // Ancient Zonai Lightroot Ignition Booming Reverberation
  playLightrootIgnite() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Deep subterranean resonant sub-bass surge
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(55, t);
    subOsc.frequency.exponentialRampToValueAtTime(110, t + 1.8);

    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 3.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + 3.3);

    // Radiant ascending sacred harmonic flourish
    [220, 277.18, 329.63, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + 0.4 + idx * 0.15);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, t + 0.4 + idx * 0.15 + 1.2);

      gain.gain.setValueAtTime(0.22, t + 0.4 + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + idx * 0.15 + 2.5);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + 0.4 + idx * 0.15);
      osc.stop(t + 0.4 + idx * 0.15 + 2.6);
    });
  }

  // Dive Splash sound when breaching water surface downwards
  playDiveSplash() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.5);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.45);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Deep underwater muffled soundscape
  startUnderwaterAmbience() {
    if (!this.ctx || this.underwaterSource) return;
    this.resume();

    const buffer = this.createNoiseBuffer(2.5);
    if (!buffer) return;

    this.underwaterSource = this.ctx.createBufferSource();
    this.underwaterSource.buffer = buffer;
    this.underwaterSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220; // Deep muffled aquatic lowpass

    this.underwaterGain = this.ctx.createGain();
    this.underwaterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.underwaterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.4);

    this.underwaterSource.connect(filter);
    filter.connect(this.underwaterGain);
    this.underwaterGain.connect(this.ambientGain);
    this.underwaterSource.start();
  }

  stopUnderwaterAmbience() {
    if (!this.ctx || !this.underwaterSource) return;
    const t = this.ctx.currentTime;
    if (this.underwaterGain) {
      this.underwaterGain.gain.linearRampToValueAtTime(0.001, t + 0.3);
    }
    setTimeout(() => {
      try {
        if (this.underwaterSource) {
          this.underwaterSource.stop();
          this.underwaterSource.disconnect();
          this.underwaterSource = null;
        }
      } catch (e) {}
    }, 350);
  }

  // Master Sword Swift Slash Whoosh
  playMasterSwordSlash() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Metallic blade ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);

    // Aerodynamic whoosh
    const buffer = this.createNoiseBuffer(0.15);
    if (buffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(500, t + 0.12);
      filter.Q.value = 2.5;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.15, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Master Sword Radiant Energy Beam
  playMasterSwordBeam() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    [880, 1318.5, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, t + idx * 0.03 + 0.25);

      gain.gain.setValueAtTime(0.14, t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.32);
    });
  }

  // Spin Attack Whirlwind
  playSpinAttack() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.42);

    // Culminating bell finish
    setTimeout(() => {
      if (!this.ctx) return;
      const tEnd = this.ctx.currentTime;
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'sine';
      bOsc.frequency.setValueAtTime(1046.5, tEnd);
      bGain.gain.setValueAtTime(0.2, tEnd);
      bGain.gain.exponentialRampToValueAtTime(0.001, tEnd + 0.8);
      bOsc.connect(bGain);
      bGain.connect(this.sfxGain);
      bOsc.start(tEnd);
      bOsc.stop(tEnd + 0.85);
    }, 280);
  }

  // Legendary Zelda Tears of the Kingdom Title Screen Fanfare
  playTotkTitleFanfare() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Resonant opening chord (Eb minor / Db majestic)
    const chord1 = [155.56, 233.08, 311.13, 466.16];
    chord1.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 2.3);
    });

    // Soaring melody notes (The signature TOTK Erhu / French Horn phrase)
    const melody = [
      { f: 466.16, d: 0.4, time: 0.35 },
      { f: 523.25, d: 0.4, time: 0.75 },
      { f: 622.25, d: 0.7, time: 1.15 },
      { f: 587.33, d: 0.5, time: 1.85 },
      { f: 466.16, d: 0.6, time: 2.35 },
      { f: 698.46, d: 1.5, time: 2.95 }
    ];

    melody.forEach(m => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(m.f, t + m.time);

      gain.gain.setValueAtTime(0.18, t + m.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + m.time + m.d);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + m.time);
      osc.stop(t + m.time + m.d + 0.1);
    });
  }

  // Link Transformation Sound Effect
  playLinkTransform() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Zonai divine rush
    [329.63, 493.88, 659.25, 987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      osc.frequency.linearRampToValueAtTime(freq * 1.08, t + idx * 0.07 + 0.3);

      gain.gain.setValueAtTime(0.2, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.65);
    });
  }

  // Metallic Shield Parry & Deflection Clang
  playShieldBlock() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Resonant metallic ping
    [780, 1150, 1850].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, t + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 8.0;

      gain.gain.setValueAtTime(0.18 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Cloth Sailcloth Paraglider Deploy Swoosh
  playParagliderOpen() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const noiseBuffer = this.createNoiseBuffer(0.35);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.exponentialRampToValueAtTime(950, t + 0.08);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.32);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Iconic Uplifting Zelda Cooking Fanfare
  playCookingJingle() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Upbeat cooking notes (C5, D5, E5, G5, A5, C6)
    const notes = [
      { f: 523.25, time: 0.00, dur: 0.10 },
      { f: 587.33, time: 0.11, dur: 0.10 },
      { f: 659.25, time: 0.22, dur: 0.10 },
      { f: 783.99, time: 0.33, dur: 0.10 },
      { f: 880.00, time: 0.44, dur: 0.12 },
      { f: 1046.50, time: 0.58, dur: 0.45 }
    ];

    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.time);

      gain.gain.setValueAtTime(0.22, t + n.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur + 0.05);
    });
  }

  // Cheerful Meal Eating Chime
  playEatMeal() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.15, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.28);
    });
  }

  // Ethereal Great Fairy Fountain Blessing Fanfare
  playGreatFairyBlessing() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Harp arpeggio
    const harpNotes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    harpNotes.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + idx * 0.08);

      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.65);
    });
  }

  // Equipment Click / Buckle Sounds
  playEquipWeapon() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playEquipShield() {
    this.playEquipWeapon();
  }

  playEquipArmor() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(0.08);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      noise.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(t);
    }
  }

  // Soft leather boot step on turf
  playLinkFootstep() {
    if (!this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.05);

    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }
}

export const audio = new AudioManager();

