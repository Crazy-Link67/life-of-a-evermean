// In-Game First-Person Survival HUD with Zelda / TOTK Wood-Carved Aesthetic

export class HUD {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    this.container.innerHTML = `
      <style>
        #hud-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          user-select: none;
          display: none;
        }

        /* Top Left: Survival Stats Bars */
        .stat-panel {
          position: absolute;
          top: 18px;
          left: 20px;
          background: rgba(18, 14, 10, 0.75);
          backdrop-filter: blur(8px);
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid rgba(139, 90, 43, 0.4);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          min-width: 250px;
        }
        .stat-row {
          margin-bottom: 8px;
        }
        .stat-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #d1b89d;
          margin-bottom: 3px;
        }
        .bar-track {
          width: 100%;
          height: 9px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 5px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.15s ease-out;
        }
        .hp-fill { background: linear-gradient(90deg, #16a34a, #4ade80); }
        .moisture-fill { background: linear-gradient(90deg, #0284c7, #38bdf8); }
        .photo-fill { background: linear-gradient(90deg, #eab308, #fef08a); }
        .biomass-fill { background: linear-gradient(90deg, #9333ea, #d946ef); }

        /* Top Center: Day / Night & Stage Banner */
        .top-center-banner {
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(18, 14, 10, 0.8);
          backdrop-filter: blur(8px);
          padding: 10px 24px;
          border-radius: 30px;
          border: 1px solid rgba(139, 90, 43, 0.5);
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        }
        .day-title {
          font-size: 16px;
          font-weight: 800;
          color: #fef08a;
          letter-spacing: 1px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        .stage-subtitle {
          font-size: 12px;
          color: #d8b4fe;
          font-weight: 600;
          margin-top: 2px;
        }

        /* Top Right: Civilization & Inventory Resources */
        .resource-panel {
          position: absolute;
          top: 18px;
          right: 20px;
          background: rgba(18, 14, 10, 0.75);
          backdrop-filter: blur(8px);
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid rgba(139, 90, 43, 0.4);
          display: flex;
          gap: 16px;
        }
        .resource-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #f5f5f4;
          font-size: 13px;
          font-weight: 700;
        }

        /* Center Reticle */
        .crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border: 1.5px solid rgba(255, 255, 255, 0.6);
          border-radius: 50%;
        }

        /* Status Badges */
        .status-badge-container {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }
        .status-badge {
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid #38bdf8;
          color: #7dd3fc;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: none;
          box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
        }

        /* Bottom Controls Bar */
        .controls-hint-bar {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(12, 10, 8, 0.8);
          backdrop-filter: blur(6px);
          padding: 8px 20px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a8a29e;
          font-size: 12px;
          display: flex;
          gap: 14px;
          white-space: nowrap;
        }
        .key-badge {
          background: rgba(255, 255, 255, 0.15);
          color: #fafaf9;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
        }
      </style>

      <!-- Survival Bars -->
      <div class="stat-panel">
        <div class="stat-row">
          <div class="stat-label">
            <span>Bark Integrity</span>
            <span id="bark-val">100 / 100</span>
          </div>
          <div class="bar-track"><div id="bark-bar" class="bar-fill hp-fill" style="width: 100%;"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-label">
            <span>Sap Moisture</span>
            <span id="moisture-val">100%</span>
          </div>
          <div class="bar-track"><div id="moisture-bar" class="bar-fill moisture-fill" style="width: 100%;"></div></div>
        </div>
        <div class="stat-row">
          <div class="stat-label">
            <span>Photosynthesis</span>
            <span id="photo-val">50%</span>
          </div>
          <div class="bar-track"><div id="photo-bar" class="bar-fill photo-fill" style="width: 50%;"></div></div>
        </div>
        <div class="stat-row" style="margin-bottom: 0;">
          <div class="stat-label">
            <span>Growth Biomass</span>
            <span id="biomass-val">0 / 100</span>
          </div>
          <div class="bar-track"><div id="biomass-bar" class="bar-fill biomass-fill" style="width: 0%;"></div></div>
        </div>
      </div>

      <!-- Top Banner -->
      <div class="top-center-banner">
        <div id="day-counter" class="day-title">DAY 1 - MORNING</div>
        <div id="growth-stage-title" class="stage-subtitle">🌱 Baby Sprout Evermean</div>
      </div>

      <!-- Resources -->
      <div class="resource-panel">
        <div class="resource-item">🪵 <span id="res-wood">20</span> Wood</div>
        <div class="resource-item">🌰 <span id="res-acorns">5</span> Acorns</div>
        <div class="resource-item">✨ <span id="res-stardust">0</span> Stardust</div>
      </div>

      <!-- Crosshair -->
      <div class="crosshair"></div>

      <!-- Badges -->
      <div class="status-badge-container">
        <div id="disguise-badge" class="status-badge" style="border-color: #22c55e; color: #86efac;">
          🌳 DISGUISED AS TREE (Patrols Walk Past)
        </div>
        <div id="swim-badge" class="status-badge">
          🌊 SWIMMING (Buoyant Wood - Space to Paddle)
        </div>
        <div id="burrow-badge" class="status-badge" style="border-color: #eab308; color: #fde047;">
          🪵 ROOT-BURROWED (Hydrating from Groundwater)
        </div>
      </div>

      <!-- Bottom Keybinds -->
      <div class="controls-hint-bar">
        <span><span class="key-badge">L-Click</span> Head-Slam</span>
        <span><span class="key-badge">R-Click</span> Special / Scythe</span>
        <span><span class="key-badge">C</span> Tree Disguise</span>
        <span><span class="key-badge">R</span> Burrow</span>
        <span><span class="key-badge">Q</span> Spore Shot</span>
        <span><span class="key-badge">Space</span> Jump / Swim</span>
        <span><span class="key-badge">B</span> Build Grove</span>
        <span><span class="key-badge">V</span> 1st/3rd View</span>
        <span><span class="key-badge">Esc</span> Menu</span>
      </div>
    `;

    document.body.appendChild(this.container);
  }

  show() {
    if (this.container) this.container.style.display = 'block';
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }

  update(player, dayNight) {
    if (!this.container) return;

    // 1. Bars
    const barkPct = Math.max(0, Math.min(100, (player.barkHp / player.maxBarkHp) * 100));
    document.getElementById('bark-bar').style.width = `${barkPct}%`;
    document.getElementById('bark-val').textContent = `${Math.floor(player.barkHp)} / ${player.maxBarkHp}`;

    const moistPct = Math.max(0, Math.min(100, (player.moisture / player.maxMoisture) * 100));
    document.getElementById('moisture-bar').style.width = `${moistPct}%`;
    document.getElementById('moisture-val').textContent = `${Math.floor(moistPct)}%`;

    const photoPct = Math.max(0, Math.min(100, (player.photosynthesis / player.maxPhotosynthesis) * 100));
    document.getElementById('photo-bar').style.width = `${photoPct}%`;
    document.getElementById('photo-val').textContent = `${Math.floor(photoPct)}%`;

    const biomassPct = Math.min(100, (player.soilBiomass % 100));
    document.getElementById('biomass-bar').style.width = `${biomassPct}%`;
    document.getElementById('biomass-val').textContent = `${Math.floor(player.soilBiomass)} Bio`;

    // 2. Day / Night Banner
    const isDay = dayNight.isDay();
    const timeWord = isDay ? (dayNight.timeOfDay < 0.5 ? 'MORNING' : 'AFTERNOON') : 'NIGHT';
    document.getElementById('day-counter').textContent = `DAY ${dayNight.day} - ${timeWord}`;

    const stageIcons = ['🌱', '🌿', '🌳', '👑', '🌌'];
    const sIdx = player.growthStage - 1;
    const stageName = player.stageNames[sIdx] || 'Evermean';
    const specName = player.speciesConfig?.name || 'Evermean';
    document.getElementById('growth-stage-title').textContent = `${stageIcons[sIdx] || '🌳'} ${stageName} (${specName})`;

    // 3. Resources
    document.getElementById('res-wood').textContent = player.inventory.wood;
    document.getElementById('res-acorns').textContent = player.inventory.acorns;
    document.getElementById('res-stardust').textContent = player.inventory.stardust;

    // 4. Badges
    document.getElementById('disguise-badge').style.display = player.isDisguised ? 'block' : 'none';
    document.getElementById('swim-badge').style.display = player.isSwimming ? 'block' : 'none';
    document.getElementById('burrow-badge').style.display = player.isRootBurrowed ? 'block' : 'none';
  }
}

export const hud = new HUD();

