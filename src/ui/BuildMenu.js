import { colony } from '../entities/EvermeanColony.js';
import { audio } from '../core/AudioManager.js';
import { multiplayer } from '../net/MultiplayerManager.js';

// Evermean Grove Construction Menu
export class BuildMenu {
  constructor() {
    this.container = null;
    this.isOpen = false;
    this.playerEvermean = null;
    this.engine = null;
  }

  init(playerEvermean, engine) {
    this.playerEvermean = playerEvermean;
    this.engine = engine;

    this.container = document.createElement('div');
    this.container.id = 'build-menu-container';
    this.container.innerHTML = `
      <style>
        #build-menu-container {
          position: absolute;
          inset: 0;
          background: rgba(8, 6, 4, 0.85);
          backdrop-filter: blur(10px);
          display: none;
          justify-content: center;
          align-items: center;
          z-index: 100;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
        }
        .build-modal {
          background: #1c1511;
          border: 2px solid #8b5a2b;
          border-radius: 16px;
          padding: 24px;
          max-width: 820px;
          width: 90%;
          box-shadow: 0 16px 48px rgba(0,0,0,0.8);
          color: #f5f5f4;
        }
        .build-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(139, 90, 43, 0.4);
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .build-title {
          font-size: 20px;
          font-weight: 800;
          color: #fde047;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .build-resources {
          display: flex;
          gap: 16px;
          font-size: 13px;
          font-weight: 700;
        }
        .build-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 14px;
        }
        .build-card {
          background: #281e18;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.15s, border-color 0.15s;
        }
        .build-card:hover {
          transform: translateY(-2px);
          border-color: #f59e0b;
        }
        .card-name {
          font-size: 14px;
          font-weight: 700;
          color: #fef08a;
          margin-bottom: 4px;
        }
        .card-desc {
          font-size: 11px;
          color: #a8a29e;
          line-height: 1.4;
          margin-bottom: 10px;
          flex-grow: 1;
        }
        .card-costs {
          display: flex;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 10px;
        }
        .cost-tag {
          background: rgba(0,0,0,0.4);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .btn-construct {
          background: #ca8a04;
          color: #000;
          font-weight: 800;
          font-size: 12px;
          border: none;
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-construct:hover {
          background: #eab308;
        }
        .btn-close-build {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          color: #d6d3d1;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-close-build:hover {
          background: rgba(255,255,255,0.1);
        }
      </style>

      <div class="build-modal">
        <div class="build-header">
          <div class="build-title">🏛️ Evermean Grove Civilization</div>
          <div class="build-resources">
            <span id="bm-wood">🪵 0</span>
            <span id="bm-bio">🌱 0</span>
            <span id="bm-star">✨ 0</span>
            <button id="btn-close-modal" class="btn-close-build">Close (B)</button>
          </div>
        </div>

        <div class="build-grid" id="build-cards-container"></div>
      </div>
    `;

    document.body.appendChild(this.container);

    document.getElementById('btn-close-modal').addEventListener('click', () => {
      this.close();
    });

    this.renderCards();
  }

  renderCards() {
    const grid = document.getElementById('build-cards-container');
    if (!grid) return;

    grid.innerHTML = '';
    const bps = colony.blueprints;

    Object.keys(bps).forEach(key => {
      const bp = bps[key];
      const card = document.createElement('div');
      card.className = 'build-card';

      let starCostTag = bp.stardustCost > 0 ? `<span class="cost-tag">✨ ${bp.stardustCost}</span>` : '';
      let korokCostTag = bp.korokCost > 0 ? `<span class="cost-tag">🍃 ${bp.korokCost} Seed</span>` : '';

      card.innerHTML = `
        <div class="card-name">${bp.name}</div>
        <div class="card-desc">${bp.description}</div>
        <div class="card-costs">
          <span class="cost-tag">🪵 ${bp.woodCost}</span>
          <span class="cost-tag">🌱 ${bp.biomassCost}</span>
          ${starCostTag}
          ${korokCostTag}
        </div>
        <button class="btn-construct" data-id="${bp.id}">Plant / Construct</button>
      `;

      card.querySelector('.btn-construct').addEventListener('click', () => {
        this.construct(bp.id);
      });

      grid.appendChild(card);
    });
  }

  construct(typeId) {
    if (!this.playerEvermean) return;

    // Place structure 4 meters in front of player
    const forwardX = Math.sin(this.playerEvermean.yaw) * 4.0;
    const forwardZ = Math.cos(this.playerEvermean.yaw) * 4.0;
    const buildPos = this.playerEvermean.position.clone();
    buildPos.x += forwardX;
    buildPos.z += forwardZ;
    buildPos.y = this.playerEvermean.terrain.getHeight(buildPos.x, buildPos.z);

    const res = colony.buildStructure(typeId, buildPos, this.playerEvermean);
    if (res.success) {
      audio.playDisguise();
      this.engine.spawnParticles(buildPos, 25, 0x8b5a2b, 4, 0.2);
      this.updateResources();
      this.close();
      multiplayer.broadcastBuild(typeId, buildPos);
    } else {
      alert(`Cannot build: ${res.reason}`);
    }
  }

  updateResources() {
    if (!this.playerEvermean) return;
    document.getElementById('bm-wood').textContent = `🪵 ${this.playerEvermean.inventory.wood}`;
    document.getElementById('bm-bio').textContent = `🌱 ${Math.floor(this.playerEvermean.soilBiomass)}`;
    document.getElementById('bm-star').textContent = `✨ ${this.playerEvermean.inventory.stardust}`;
  }

  open() {
    if (!this.container) return;
    this.isOpen = true;
    this.container.style.display = 'flex';
    this.updateResources();
    if (document.exitPointerLock) document.exitPointerLock();
  }

  close() {
    if (!this.container) return;
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }
}

export const buildMenu = new BuildMenu();

