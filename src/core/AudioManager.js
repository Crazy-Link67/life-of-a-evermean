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
}

export const audio = new AudioManager();

