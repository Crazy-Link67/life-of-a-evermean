import * as THREE from 'three';
import { TreeModelGenerator } from '../entities/TreeModelGenerator.js';
import { accountSystem } from '../core/AccountSystem.js';

// Evermean Character Customizer Studio with Live 3D Preview
export class CustomizerUI {
  constructor() {
    this.container = null;
    this.previewScene = null;
    this.previewCamera = null;
    this.previewRenderer = null;
    this.previewModel = null;
    this.animId = null;

    // Current player configuration state
    this.config = {
      presetKey: 'oak',
      name: 'Great Oak Evermean',
      barkColor: '#5c4033',
      foliageColor: '#2e8540',
      foliageType: 'deciduous',
      faceType: 'knot_holes',
      eyeColor: '#facc15',
      accessories: 'lantern',
      legCount: 4,
      legType: 'pointy',
      crestType: 'blunt_stump',
      heightScale: 1.0,
      girthScale: 1.0,
      hasMantisScythes: false,
      hasAntlers: false,
      element: 'none'
    };

    this.onCompleteCallback = null;
  }

  init(onComplete) {
    this.onCompleteCallback = onComplete;

    this.container = document.createElement('div');
    this.container.id = 'customizer-container';
    this.container.innerHTML = `
      <style>
        #customizer-container {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #1e1b18 0%, #0c0a09 100%);
          display: none;
          z-index: 200;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          color: #f5f5f4;
        }
        .customizer-layout {
          display: flex;
          width: 100%;
          height: 100%;
        }
        /* Left: 3D Preview Viewport */
        .preview-pane {
          flex: 1.2;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        #preview-canvas-container {
          width: 100%;
          height: 100%;
        }
        .preview-badge {
          position: absolute;
          bottom: 30px;
          background: rgba(0,0,0,0.7);
          padding: 8px 18px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
          font-size: 13px;
          color: #fef08a;
          pointer-events: none;
        }
        /* Right: Customization Controls Panel */
        .controls-pane {
          flex: 1;
          max-width: 540px;
          background: rgba(24, 20, 16, 0.9);
          border-left: 1px solid rgba(139, 90, 43, 0.4);
          padding: 30px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .custom-title {
          font-size: 24px;
          font-weight: 800;
          color: #fde047;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .custom-desc {
          font-size: 13px;
          color: #a8a29e;
          line-height: 1.4;
        }
        .section-header {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #e2e8f0;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 6px;
        }
        /* Presets Grid */
        .presets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .preset-btn {
          background: #2b231d;
          border: 1px solid rgba(255,255,255,0.1);
          color: #e7e5e4;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s;
        }
        .preset-btn:hover, .preset-btn.active {
          background: #453427;
          border-color: #f59e0b;
          color: #fef08a;
        }
        .preset-cat {
          font-size: 10px;
          color: #a8a29e;
          font-weight: 500;
          display: block;
        }
        /* Sliders and Colors */
        .option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }
        .color-inputs {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        input[type="color"] {
          border: none;
          width: 38px;
          height: 32px;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
        }
        select, input[type="range"] {
          background: #2b231d;
          border: 1px solid rgba(255,255,255,0.15);
          color: #f5f5f4;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
        }
        .btn-start-game {
          background: linear-gradient(135deg, #eab308, #ca8a04);
          color: #000;
          font-size: 16px;
          font-weight: 800;
          padding: 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          margin-top: 10px;
          box-shadow: 0 4px 15px rgba(234, 179, 8, 0.4);
          transition: transform 0.15s;
        }
        .btn-start-game:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #facc15, #eab308);
        }
      </style>

      <div class="customizer-layout">
        <!-- 3D Preview -->
        <div class="preview-pane">
          <div id="preview-canvas-container"></div>
          <div id="preview-species-name" class="preview-badge">Oak Evermean (Baby Sprout Form)</div>
        </div>

        <!-- Controls -->
        <div class="controls-pane">
          <div>
            <div class="custom-title">Evermean Morphology Studio</div>
            <div class="custom-desc">Choose your lineage and shape your living tree creature before rooting into the world.</div>
          </div>

          <!-- Presets -->
          <div class="section-header">Evermean Archetypes (TOTK)</div>
          <div class="presets-grid" id="presets-container"></div>

          <!-- Customization Fields -->
          <div class="section-header">Bark & Timber</div>
          <div class="option-row">
            <span>Bark Wood Color</span>
            <div class="color-inputs">
              <input type="color" id="bark-color-picker" value="#5c4033">
            </div>
          </div>

          <div class="section-header">Canopy & Foliage</div>
          <div class="option-row">
            <span>Foliage Hue</span>
            <div class="color-inputs">
              <input type="color" id="foliage-color-picker" value="#2e8540">
            </div>
          </div>
          <div class="option-row">
            <span>Foliage Morphology</span>
            <select id="foliage-select">
              <option value="deciduous">Deciduous Canopy (Oak/Birch)</option>
              <option value="embers">Flaming Embers (Fire)</option>
              <option value="sparking">Sparking Storm Twigs (Lightning)</option>
              <option value="lush_flowering">Lush Moss & Blossoms (Grass)</option>
              <option value="icicle_needles">Glacial Icicle Needles (Frost)</option>
              <option value="scythe_twigs">Mantis Blade Twigs</option>
              <option value="cosmic_nebula">Celestial Cosmic Nebula</option>
            </select>
          </div>

          <div class="section-header">Root Legs & Head Crest</div>
          <div class="option-row">
            <span>Root-Leg Configuration</span>
            <select id="legs-select">
              <option value="3">3-Root Tripod (Agile Skitterer)</option>
              <option value="4" selected>4-Root Pointy Stompers (Heavy)</option>
              <option value="6">6-Root Mantis Stilts (Ambush)</option>
              <option value="8">8-Root Spider Claws (All-Terrain)</option>
            </select>
          </div>
          <div class="option-row">
            <span>Head / Stump Crest</span>
            <select id="crest-select">
              <option value="blunt_stump">Flat Wood-Grain Stump (TOTK Classic)</option>
              <option value="mantis_crest">Mantis Scythe Boughs</option>
              <option value="antler_boughs">Gnarled Branch Antlers (Stag)</option>
              <option value="spiked_crown">Splintered Thorny Crown</option>
              <option value="starlight_crown">Cosmic Astral Crown</option>
            </select>
          </div>

          <div class="section-header">Facial Carvings & Eye Glow</div>
          <div class="option-row">
            <span>Face Knot Carvings</span>
            <select id="face-select">
              <option value="knot_holes" selected>Dual Knot-Hole Eyes (TOTK Classic)</option>
              <option value="cyclops_knot">Single Cyclops Knot-Hole</option>
              <option value="sinister_slits">Sinister Slit Eyes</option>
              <option value="carved_mask">Ancient Wooden Mask</option>
            </select>
          </div>
          <div class="option-row">
            <span>Eye Glow Hue</span>
            <div class="color-inputs">
              <input type="color" id="eye-color-picker" value="#facc15">
            </div>
          </div>

          <div class="section-header">Woodland Accessories</div>
          <div class="option-row">
            <span>Living Adornments</span>
            <select id="accessories-select">
              <option value="none">None (Wild Forest Tree)</option>
              <option value="lantern" selected>Hanging Firefly Lantern</option>
              <option value="mushrooms">Shoulder Bioluminescent Mushrooms</option>
              <option value="moss">Draping Living Moss Tendrils</option>
              <option value="korok_charm">Carved Leaf Korok Charm</option>
            </select>
          </div>

          <div class="section-header">Tree Dimensions</div>
          <div class="option-row">
            <span>Trunk Height</span>
            <input type="range" id="height-slider" min="0.8" max="1.4" step="0.05" value="1.0">
          </div>
          <div class="option-row">
            <span>Trunk Girth</span>
            <input type="range" id="girth-slider" min="0.8" max="1.4" step="0.05" value="1.0">
          </div>

          <button id="btn-save-account-evermean" class="btn-menu" style="background: #14532d; border: 1.5px solid #22c55e; color: #86efac; padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 6px;">💾 Save as Main Evermean (Account Profile)</button>
          <button id="btn-start-game" class="btn-start-game">Root into the World (Awaken)</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.setup3DPreview();
    this.setupEvents();
  }

  setup3DPreview() {
    const previewBox = document.getElementById('preview-canvas-container');
    const width = previewBox.clientWidth || 500;
    const height = previewBox.clientHeight || 500;

    this.previewScene = new THREE.Scene();
    this.previewScene.background = new THREE.Color(0x181411);

    this.previewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.previewCamera.position.set(0, 1.8, 5.5);
    this.previewCamera.lookAt(0, 1.2, 0);

    this.previewRenderer = new THREE.WebGLRenderer({ antialias: true });
    this.previewRenderer.setSize(width, height);
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.previewRenderer.shadowMap.enabled = true;
    previewBox.appendChild(this.previewRenderer.domElement);

    // Studio lights
    const pAmbient = new THREE.AmbientLight(0xffffff, 0.7);
    this.previewScene.add(pAmbient);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    keyLight.position.set(4, 5, 4);
    this.previewScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.8);
    rimLight.position.set(-4, 3, -4);
    this.previewScene.add(rimLight);

    // Subtle stone pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.3, 24),
      new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 })
    );
    pedestal.position.y = -0.15;
    this.previewScene.add(pedestal);

    // Start preview animation loop
    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      if (this.previewModel) {
        this.previewModel.rotation.y += 0.008; // Smooth spin
      }
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    };
    animate();
  }

  setupEvents() {
    // Populate archetype buttons
    const presetsContainer = document.getElementById('presets-container');
    const presets = TreeModelGenerator.PRESETS;

    Object.keys(presets).forEach(key => {
      const p = presets[key];
      const btn = document.createElement('button');
      btn.className = `preset-btn ${key === 'oak' ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${p.name}</span>
        <span class="preset-cat">${p.category.toUpperCase()} • ${p.element.toUpperCase()}</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectPreset(key);
      });

      presetsContainer.appendChild(btn);
    });

    // Inputs
    document.getElementById('bark-color-picker').addEventListener('input', (e) => {
      this.config.barkColor = e.target.value;
      this.refreshPreviewModel();
    });

    document.getElementById('foliage-color-picker').addEventListener('input', (e) => {
      this.config.foliageColor = e.target.value;
      this.refreshPreviewModel();
    });

    document.getElementById('foliage-select').addEventListener('change', (e) => {
      this.config.foliageType = e.target.value;
      this.refreshPreviewModel();
    });

    document.getElementById('legs-select').addEventListener('change', (e) => {
      this.config.legCount = parseInt(e.target.value);
      this.refreshPreviewModel();
    });

    document.getElementById('crest-select').addEventListener('change', (e) => {
      this.config.crestType = e.target.value;
      this.config.hasMantisScythes = (e.target.value === 'mantis_crest');
      this.config.hasAntlers = (e.target.value === 'antler_boughs');
      this.refreshPreviewModel();
    });

    document.getElementById('face-select').addEventListener('change', (e) => {
      this.config.faceType = e.target.value;
      this.refreshPreviewModel();
    });

    document.getElementById('eye-color-picker').addEventListener('input', (e) => {
      this.config.eyeColor = e.target.value;
      this.refreshPreviewModel();
    });

    document.getElementById('accessories-select').addEventListener('change', (e) => {
      this.config.accessories = e.target.value;
      this.refreshPreviewModel();
    });

    document.getElementById('height-slider').addEventListener('input', (e) => {
      this.config.heightScale = parseFloat(e.target.value);
      this.refreshPreviewModel();
    });

    document.getElementById('girth-slider').addEventListener('input', (e) => {
      this.config.girthScale = parseFloat(e.target.value);
      this.refreshPreviewModel();
    });

    // Save as Main Evermean to Account Profile
    document.getElementById('btn-save-account-evermean').addEventListener('click', () => {
      accountSystem.saveCustomEvermean(this.config);
      if (window.showGameNotification) {
        window.showGameNotification('🌿 Saved this custom Evermean to your Player Account profile!');
      } else {
        alert('🌿 Saved this custom Evermean to your Player Account profile!');
      }
    });

    // Start Button
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.hide();
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.config);
      }
    });
  }

  selectPreset(key) {
    const p = TreeModelGenerator.PRESETS[key];
    if (!p) return;

    this.config = {
      ...this.config,
      ...p,
      presetKey: key
    };

    // Update UI controls
    document.getElementById('bark-color-picker').value = p.barkColor;
    document.getElementById('foliage-color-picker').value = p.foliageColor;
    document.getElementById('foliage-select').value = p.foliageType;
    document.getElementById('legs-select').value = p.legCount.toString();
    document.getElementById('crest-select').value = p.crestType;
    if (p.faceType) document.getElementById('face-select').value = p.faceType;
    if (p.eyeColor) document.getElementById('eye-color-picker').value = p.eyeColor;
    if (p.accessories) document.getElementById('accessories-select').value = p.accessories;

    document.getElementById('preview-species-name').textContent = `${p.name} (Baby Sprout Form)`;

    this.refreshPreviewModel();
  }

  refreshPreviewModel() {
    if (this.previewModel) {
      this.previewScene.remove(this.previewModel);
    }

    // Build the 3D model for preview at Stage 2 (Sapling) so full features/limbs are visible
    this.previewModel = TreeModelGenerator.createEvermeanModel(this.config, 2);
    this.previewModel.position.set(0, 0, 0);
    this.previewScene.add(this.previewModel);
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
      if (!this.previewRenderer) {
        this.setup3DPreview();
      } else {
        const previewBox = document.getElementById('preview-canvas-container');
        const width = previewBox.clientWidth || 500;
        const height = previewBox.clientHeight || 500;
        this.previewCamera.aspect = width / height;
        this.previewCamera.updateProjectionMatrix();
        this.previewRenderer.setSize(width, height);
      }

      const savedEvermean = accountSystem.getProfile()?.customEvermean;
      if (savedEvermean && savedEvermean.presetKey) {
        this.config = { ...this.config, ...savedEvermean };
        document.getElementById('bark-color-picker').value = this.config.barkColor || '#5c4033';
        document.getElementById('foliage-color-picker').value = this.config.foliageColor || '#2e8540';
        document.getElementById('foliage-select').value = this.config.foliageType || 'deciduous';
        document.getElementById('legs-select').value = (this.config.legCount || 4).toString();
        document.getElementById('crest-select').value = this.config.crestType || 'blunt_stump';
        document.getElementById('face-select').value = this.config.faceType || 'knot_holes';
        document.getElementById('eye-color-picker').value = this.config.eyeColor || '#facc15';
        document.getElementById('accessories-select').value = this.config.accessories || 'lantern';
        document.getElementById('preview-species-name').textContent = `${this.config.name || 'Custom Evermean'} (Profile Main)`;
        this.refreshPreviewModel();
      } else {
        this.selectPreset('oak');
      }
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }
  }
}

export const customizerUI = new CustomizerUI();

