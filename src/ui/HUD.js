import { input } from '../core/Input.js';
import { creatorMode } from '../core/CreatorMode.js';
import { arena } from '../core/ArenaManager.js';
import { campaign } from '../core/CampaignManager.js';
import { multiplayer } from '../net/MultiplayerManager.js';
import { accountModal } from './AccountModal.js';
import { multiplayerLobby } from './MultiplayerLobbyModal.js';

// In-Game First-Person Survival HUD with Zelda / TOTK Aesthetic
// Displays Survival Stats, Quest Objectives Tracker, Korok Seeds, and Toast Notifications

export class HUD {
  constructor() {
    this.container = null;
    this.notificationTimeout = null;
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
          background: rgba(18, 14, 10, 0.85);
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

        /* Top Right: Inventory Resources */
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

        /* Mid-Left: Quest Objectives Tracker */
        .quest-panel {
          position: absolute;
          top: 240px;
          left: 20px;
          background: rgba(18, 14, 10, 0.75);
          backdrop-filter: blur(8px);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(139, 90, 43, 0.4);
          max-width: 280px;
          color: #f5f5f4;
        }
        .quest-header {
          font-size: 12px;
          font-weight: 800;
          color: #facc15;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .quest-item {
          font-size: 12px;
          line-height: 1.4;
          margin-bottom: 6px;
          color: #d6d3d1;
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }
        .quest-item.done {
          color: #4ade80;
          text-decoration: line-through;
          opacity: 0.75;
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

        /* First-Person Evermean Sight Knot-Hole Vignette */
        #evermean-sight-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0) 62%, rgba(45, 26, 12, 0.28) 85%, rgba(20, 10, 4, 0.65) 100%);
          box-shadow: inset 0 0 80px rgba(168, 85, 247, 0.08);
          transition: box-shadow 0.3s ease, opacity 0.3s ease;
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

        /* Toast Notification Banner */
        .toast-banner {
          position: absolute;
          top: 85px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(17, 24, 39, 0.9);
          border: 1.5px solid #f59e0b;
          color: #fef08a;
          padding: 10px 24px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 8px 30px rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
          pointer-events: none;
          z-index: 999;
          white-space: nowrap;
        }
        .toast-banner.show {
          opacity: 1;
          transform: translateX(-50%) translateY(5px);
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
      <div id="standard-top-banner" class="top-center-banner">
        <div id="day-counter" class="day-title">DAY 1 - MORNING</div>
        <div id="growth-stage-title" class="stage-subtitle">🌱 Baby Sprout Evermean</div>
      </div>

      <!-- Arena PvP Duel Banner -->
      <div id="arena-hud-banner" class="top-center-banner" style="display: none; border-color: #ef4444; background: rgba(30, 10, 10, 0.9);">
        <div style="font-size: 11px; font-weight: 800; color: #fca5a5; letter-spacing: 1px;">⚔️ EVERMEAN ARENA COLOSSEUM</div>
        <div style="font-size: 18px; font-weight: 900; color: #fef08a;"><span id="arena-time">02:00</span></div>
        <div style="font-size: 12px; color: #cbd5e1;">Score: <strong style="color: #4ade80;" id="arena-local-score">0</strong> Wins | <span id="arena-opponents">0 Remote Duelists</span></div>
      </div>

      <!-- Top Right: Resources & Quick Online Buttons -->
      <div style="position: absolute; top: 18px; right: 20px; display: flex; gap: 8px; align-items: center; pointer-events: auto;">
        <div class="resource-panel" style="position: static;">
          <div class="resource-item">🪵 <span id="res-wood">20</span> Wood</div>
          <div class="resource-item">🌰 <span id="res-acorns">5</span> Acorns</div>
          <div class="resource-item">🍃 <span id="res-korok">0</span> Seeds</div>
          <div class="resource-item">✨ <span id="res-stardust">0</span> Stardust</div>
        </div>
        <button id="btn-hud-mp" style="background: rgba(8, 51, 68, 0.85); border: 1px solid #06b6d4; color: #67e8f9; padding: 10px 14px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer; backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.4);">🌐 Online</button>
        <button id="btn-hud-acc" style="background: rgba(14, 41, 30, 0.85); border: 1px solid #10b981; color: #6ee7b7; padding: 10px 14px; border-radius: 12px; font-size: 12px; font-weight: 700; cursor: pointer; backdrop-filter: blur(8px); box-shadow: 0 4px 16px rgba(0,0,0,0.4);">🌿 Friends</button>
      </div>

      <!-- Quest / Objectives Tracker -->
      <div class="quest-panel">
        <div class="quest-header" id="quest-header-title">📜 Forest Objectives</div>
        <div id="quest-items-list">
          <div class="quest-item" id="q-wood"><span>🪵</span> Harvest 40 Wood from trees</div>
          <div class="quest-item" id="q-korok"><span>🍃</span> Solve a Korok puzzle (Lake/Hill)</div>
          <div class="quest-item" id="q-build"><span>🏛️</span> Construct a Grove structure (B)</div>
          <div class="quest-item" id="q-ambush"><span>⚡</span> Land an Ambush Strike from disguise</div>
        </div>
      </div>

      <!-- Creator Mode Toolbox -->
      <div id="creator-hud-bar" style="position: absolute; bottom: 65px; left: 20px; background: rgba(18, 14, 10, 0.85); backdrop-filter: blur(8px); border: 1.5px solid #ec4899; border-radius: 12px; padding: 10px 14px; display: none; flex-direction: column; gap: 8px; pointer-events: auto; z-index: 100; box-shadow: 0 8px 30px rgba(0,0,0,0.7);">
        <div style="font-size: 12px; font-weight: 800; color: #f472b6; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <span>🛠️ CREATOR TOOLBOX</span>
          <button id="btn-hud-flight" style="background: #be185d; border: 1px solid #f472b6; color: #fff; font-size: 11px; padding: 3px 8px; border-radius: 5px; cursor: pointer; font-weight: 700;">🕊️ Flight: OFF (F)</button>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn-creator-spawn" data-type="sprout_minion" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🌱 Sprout</button>
          <button class="btn-creator-spawn" data-type="deer" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦌 Deer</button>
          <button class="btn-creator-spawn" data-type="beaver" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦫 Beaver</button>
          <button class="btn-creator-spawn" data-type="goblin_spar" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">👹 Goblin</button>
          <button class="btn-creator-spawn" data-type="shrooms" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🍄 Mushroom</button>
          <button class="btn-creator-spawn" data-type="ancient_monolith" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🗿 Monolith</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #d4d4d8;">
          <span>Time of Day</span>
          <input type="range" id="creator-time-slider" min="0" max="1" step="0.05" value="0.3" style="width: 110px; cursor: pointer;">
        </div>
      </div>

      <!-- Toast Banner -->
      <div id="hud-toast" class="toast-banner">Notification</div>

      <!-- Crosshair & Evermean Knot-Hole Sight Vignette -->
      <div class="crosshair"></div>
      <div id="evermean-sight-vignette"></div>

      <!-- Badges -->
      <div class="status-badge-container">
        <div id="disguise-badge" class="status-badge" style="border-color: #22c55e; color: #86efac;">
          🌳 DISGUISED AS TREE (Goblins walk past)
        </div>
        <div id="ambush-badge" class="status-badge" style="border-color: #f59e0b; color: #fde047; box-shadow: 0 0 16px rgba(245,158,11,0.5);">
          ⚡ SNEAK-STRIKE READY (3x CRITICAL DAMAGE)
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
        <span><span class="key-badge">C</span> Camouflage</span>
        <span><span class="key-badge">R</span> Burrow</span>
        <span><span class="key-badge">Q</span> Acorn Slingshot</span>
        <span><span class="key-badge">Space</span> Jump / Swim</span>
        <span><span class="key-badge">B</span> Build Grove</span>
        <span><span class="key-badge">V</span> View</span>
        <span><span class="key-badge">Esc</span> Menu</span>
        <span><button id="hud-mode-toggle" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fef08a; padding: 2px 8px; border-radius: 4px; font-weight: 800; cursor: pointer; pointer-events: auto;">🖥️ PC</button></span>
      </div>
    `;

    document.body.appendChild(this.container);

    // Sync HUD with PC/Mobile Mode
    const modeBtn = document.getElementById('hud-mode-toggle');
    const hintBar = this.container.querySelector('.controls-hint-bar');

    const updateHudMode = (mode) => {
      if (modeBtn) {
        modeBtn.innerHTML = (mode === 'pc') ? '🖥️ PC Mode' : '📱 Mobile Mode';
      }
      if (hintBar) {
        hintBar.style.display = (mode === 'pc') ? 'flex' : 'none';
      }
    };

    if (modeBtn) {
      modeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = input.toggleMode();
        updateHudMode(next);
        if (window.showGameNotification) {
          window.showGameNotification(next === 'pc' ? '🖥️ Switched to PC Mode' : '📱 Switched to Mobile Mode');
        }
      });
    }

    input.onModeChange((mode) => updateHudMode(mode));
    updateHudMode(input.mode);

    // Global Toast Notification function
    window.showGameNotification = (msg) => {
      const toast = document.getElementById('hud-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
      this.notificationTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 4000);
    };

    // Quick Online & Account Buttons
    const btnMp = document.getElementById('btn-hud-mp');
    if (btnMp) {
      btnMp.addEventListener('click', (e) => {
        e.stopPropagation();
        multiplayerLobby.show();
      });
    }

    const btnAcc = document.getElementById('btn-hud-acc');
    if (btnAcc) {
      btnAcc.addEventListener('click', (e) => {
        e.stopPropagation();
        accountModal.show();
      });
    }

    // Creator Mode Toolbar listeners
    const flightBtn = document.getElementById('btn-hud-flight');
    if (flightBtn) {
      flightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        creatorMode.toggleFlight();
      });
    }

    const timeSlider = document.getElementById('creator-time-slider');
    if (timeSlider) {
      timeSlider.addEventListener('input', (e) => {
        creatorMode.setTimeOfDay(parseFloat(e.target.value));
      });
    }

    const spawnButtons = this.container.querySelectorAll('.btn-creator-spawn');
    spawnButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        creatorMode.spawnProp(btn.dataset.type);
      });
    });
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

    // 2. Day / Night Banner & Arena Colosseum Banner
    const isArena = arena.isActive || multiplayer.roomMode === 'arena';
    const arenaBanner = document.getElementById('arena-hud-banner');
    const stdBanner = document.getElementById('standard-top-banner');

    if (isArena) {
      if (arenaBanner) arenaBanner.style.display = 'block';
      if (stdBanner) stdBanner.style.display = 'none';
      const mins = Math.floor(Math.max(0, arena.roundTimer) / 60);
      const secs = Math.floor(Math.max(0, arena.roundTimer) % 60).toString().padStart(2, '0');
      const timeEl = document.getElementById('arena-time');
      if (timeEl) timeEl.textContent = `${mins}:${secs}`;
      const scoreEl = document.getElementById('arena-local-score');
      if (scoreEl) scoreEl.textContent = multiplayer.arenaScores.localWins;
      const oppEl = document.getElementById('arena-opponents');
      if (oppEl) oppEl.textContent = `${multiplayer.remotePlayers.size} Remote Duelists`;
    } else {
      if (arenaBanner) arenaBanner.style.display = 'none';
      if (stdBanner) stdBanner.style.display = 'block';

      const isDay = dayNight.isDay();
      const timeWord = isDay ? (dayNight.timeOfDay < 0.5 ? 'MORNING' : 'AFTERNOON') : 'NIGHT';
      document.getElementById('day-counter').textContent = `DAY ${dayNight.day} - ${timeWord}`;

      const stageIcons = ['🌱', '🌿', '🌳', '👑', '🌌'];
      const sIdx = player.growthStage - 1;
      const stageName = player.stageNames[sIdx] || 'Evermean';
      const specName = player.speciesConfig?.name || 'Evermean';
      document.getElementById('growth-stage-title').textContent = `${stageIcons[sIdx] || '🌳'} ${stageName} (${specName})`;
    }

    // Creator Mode Toolbar State
    const creatorBar = document.getElementById('creator-hud-bar');
    if (creatorBar) {
      creatorBar.style.display = creatorMode.isActive ? 'flex' : 'none';
      const flightBtn = document.getElementById('btn-hud-flight');
      if (flightBtn) {
        flightBtn.textContent = creatorMode.isFlying ? '🕊️ Flight: ON (F)' : '🕊️ Flight: OFF (F)';
        flightBtn.style.background = creatorMode.isFlying ? '#059669' : '#be185d';
      }
    }

    // 3. Resources
    document.getElementById('res-wood').textContent = player.inventory.wood;
    document.getElementById('res-acorns').textContent = player.inventory.acorns;
    document.getElementById('res-korok').textContent = player.inventory.korokSeeds || 0;
    document.getElementById('res-stardust').textContent = player.inventory.stardust;

    // 4. Badges
    document.getElementById('disguise-badge').style.display = player.isDisguised ? 'block' : 'none';
    document.getElementById('ambush-badge').style.display = player.isDisguised ? 'block' : 'none';
    document.getElementById('swim-badge').style.display = player.isSwimming ? 'block' : 'none';
    document.getElementById('burrow-badge').style.display = player.isRootBurrowed ? 'block' : 'none';

    // 5. Quest / Campaign Checklist State
    if (campaign.isActive) {
      const ch = campaign.getCurrentChapterData();
      const titleEl = document.getElementById('quest-header-title');
      if (titleEl) titleEl.textContent = `📜 ${ch.title}`;
      const listEl = document.getElementById('quest-items-list');
      if (listEl) {
        listEl.innerHTML = ch.objectives
          .map(
            (o) => `
          <div class="quest-item ${o.done ? 'done' : ''}">
            <span>${o.done ? '✅' : '⏳'}</span> ${o.text}
          </div>
        `
          )
          .join('');
      }
    } else {
      const titleEl = document.getElementById('quest-header-title');
      if (titleEl) titleEl.textContent = '📜 Forest Objectives';
      const qWood = document.getElementById('q-wood');
      if (qWood && player.inventory.wood >= 40) qWood.classList.add('done');
      const qKorok = document.getElementById('q-korok');
      if (qKorok && (player.inventory.korokSeeds || 0) >= 1) qKorok.classList.add('done');
    }

    // 6. First-Person Evermean Knot-Hole Sight Vignette
    const vignette = document.getElementById('evermean-sight-vignette');
    if (vignette) {
      vignette.style.display = (player.cameraMode === 'first_person') ? 'block' : 'none';
      if (player.isDisguised) {
        vignette.style.boxShadow = 'inset 0 0 110px rgba(34, 197, 94, 0.3)';
      } else if (player.barkHp < 30) {
        vignette.style.boxShadow = 'inset 0 0 110px rgba(239, 68, 68, 0.35)';
      } else {
        const glowHex = player.speciesConfig?.glowColor ? `#${player.speciesConfig.glowColor.toString(16).padStart(6, '0')}` : 'rgba(168, 85, 247, 0.1)';
        vignette.style.boxShadow = `inset 0 0 85px ${glowHex}`;
      }
    }
  }
}

export const hud = new HUD();
