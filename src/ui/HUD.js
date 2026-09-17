import * as THREE from 'three';
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
          top: 44px;
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
        @keyframes spinReticle {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .compass-item {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }
      </style>

      <!-- Top Compass Bar (Zelda TOTK Style) -->
      <div id="hud-compass-bar" style="position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 340px; height: 26px; background: rgba(18, 14, 10, 0.88); backdrop-filter: blur(8px); border: 1px solid rgba(139, 90, 43, 0.5); border-radius: 13px; overflow: hidden; pointer-events: none; z-index: 10; box-shadow: 0 4px 16px rgba(0,0,0,0.5);">
        <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: #facc15; transform: translateX(-50%); z-index: 3; box-shadow: 0 0 6px #facc15;"></div>
        <div id="compass-track" style="position: relative; width: 100%; height: 100%;"></div>
      </div>

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
        <!-- Active Room Pill Indicator -->
        <div id="hud-room-indicator" style="display: none; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.85); border: 1.5px solid #0284c7; border-radius: 9999px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; backdrop-filter: blur(8px); cursor: pointer; pointer-events: auto; margin-top: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.5);" title="Click to copy Room Code & Invite Link!">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8;"></span>
          <span>World Room: <strong id="hud-room-code-text" style="color: #38bdf8; font-family: monospace; font-size: 12px; letter-spacing: 0.8px;">GROVE-XX</strong></span>
          <span id="hud-room-copy-badge" style="background: rgba(56, 189, 248, 0.25); border: 1px solid #38bdf8; border-radius: 4px; padding: 2px 7px; font-size: 10px; color: #7dd3fc; font-weight: 800;">📋 Copy</span>
        </div>
      </div>

      <!-- Arena PvP Duel Banner -->
      <div id="arena-hud-banner" class="top-center-banner" style="display: none; border-color: #ef4444; background: rgba(30, 10, 10, 0.9);">
        <div style="font-size: 11px; font-weight: 800; color: #fca5a5; letter-spacing: 1px;">⚔️ EVERMEAN ARENA COLOSSEUM</div>
        <div style="font-size: 18px; font-weight: 900; color: #fef08a;"><span id="arena-time">02:00</span></div>
        <div style="font-size: 12px; color: #cbd5e1;">Score: <strong style="color: #4ade80;" id="arena-local-score">0</strong> Wins | <span id="arena-opponents">0 Remote Duelists</span></div>
      </div>

      <!-- Top Right: Resources & Quick Online Buttons -->
      <div style="position: absolute; top: 18px; right: 20px; display: flex; gap: 8px; align-items: center; pointer-events: auto;">
        <div class="resource-panel" style="position: static; display: flex; flex-wrap: wrap; max-width: 320px; gap: 6px 12px;">
          <div class="resource-item">🪵 <span id="res-wood">20</span> Wood</div>
          <div class="resource-item">🌰 <span id="res-acorns">5</span> Acorns</div>
          <div class="resource-item">🍃 <span id="res-korok">0</span> Seeds</div>
          <div class="resource-item">✨ <span id="res-stardust">0</span> Stardust</div>
          <div class="resource-item" id="res-item-rupees" style="color: #67e8f9;">💎 <span id="res-rupees">0</span> Rupees</div>
          <div class="resource-item" id="res-item-jelly" style="color: #a7f3d0;">🧪 <span id="res-jelly">0</span> Jelly</div>
          <div class="resource-item" id="res-item-bubbul" style="color: #c084fc;">🔮 <span id="res-bubbul">0</span> Bubbul</div>
          <div class="resource-item" id="res-item-sundelion" style="color: #fde047;">🌼 <span id="res-sundelion">0</span> Sun</div>
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
        <div style="display: flex; gap: 6px; flex-wrap: wrap; max-width: 380px;">
          <button class="btn-creator-spawn" data-type="sprout_minion" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🌱 Sprout</button>
          <button class="btn-creator-spawn" data-type="deer" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦌 Deer</button>
          <button class="btn-creator-spawn" data-type="beaver" style="background: #27272a; border: 1px solid #71717a; color: #e4e4e7; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦫 Beaver</button>
          <button class="btn-creator-spawn" data-type="fox" style="background: #27272a; border: 1px solid #d97706; color: #fde68a; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦊 Fox</button>
          <button class="btn-creator-spawn" data-type="blupee" style="background: #27272a; border: 1px solid #0284c7; color: #7dd3fc; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🐰 Blupee</button>
          <button class="btn-creator-spawn" data-type="chuchu" style="background: #27272a; border: 1px solid #16a34a; color: #86efac; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">💧 Chuchu</button>
          <button class="btn-creator-spawn" data-type="bubbulfrog" style="background: #27272a; border: 1px solid #9333ea; color: #d8b4fe; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🐸 Bubbul</button>
          <button class="btn-creator-spawn" data-type="cucco" style="background: #27272a; border: 1px solid #dc2626; color: #fca5a5; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🐔 Cucco</button>
          <button class="btn-creator-spawn" data-type="aerocuda" style="background: #27272a; border: 1px solid #475569; color: #cbd5e1; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦇 Aerocuda</button>
          <button class="btn-creator-spawn" data-type="dondon" style="background: #27272a; border: 1px solid #0891b2; color: #a5f3fc; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer;">🦏 Dondon</button>
          <button class="btn-creator-spawn" data-type="zonai_pad" style="background: #0f766e; border: 1px solid #34d399; color: #a7f3d0; font-size: 11px; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-weight: 700;">🚀 Zonai Pad</button>
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

      <!-- Circular Stamina Wheel (Zelda TOTK Style) -->
      <div id="stamina-wheel-container" style="position: absolute; top: 50%; left: calc(50% + 36px); transform: translateY(-50%); width: 50px; height: 50px; pointer-events: none; opacity: 0; transition: opacity 0.25s ease; z-index: 50;">
        <svg width="50" height="50" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="18" fill="rgba(15, 12, 8, 0.75)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="5" />
          <circle id="stamina-wheel-circle" cx="25" cy="25" r="18" fill="none" stroke="#22c55e" stroke-width="5" stroke-dasharray="113.1" stroke-dashoffset="0" stroke-linecap="round" transform="rotate(-90 25 25)" />
          <text id="stamina-wheel-icon" x="25" y="29" text-anchor="middle" fill="#86efac" font-size="11" font-weight="900">⚡</text>
        </svg>
      </div>

      <!-- Ultrahand Reticle & Interaction HUD -->
      <div id="ultrahand-reticle" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 34px; height: 34px; border: 2px dashed #10b981; border-radius: 50%; display: none; pointer-events: none; animation: spinReticle 6s linear infinite; box-shadow: 0 0 16px rgba(16, 185, 129, 0.7); z-index: 20;"></div>
      <div id="ultrahand-action-prompt" style="position: absolute; top: calc(50% + 26px); left: 50%; transform: translateX(-50%); background: rgba(6, 78, 59, 0.9); border: 1.5px solid #10b981; color: #a7f3d0; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; display: none; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.6); z-index: 25;">
        [E] Drop | [F] Fuse to Head
      </div>

      <!-- Equipped Fused Item Badge -->
      <div id="fused-item-badge" style="position: absolute; bottom: 80px; right: 20px; background: rgba(18, 14, 10, 0.88); backdrop-filter: blur(8px); border: 1.5px solid #ca8a04; border-radius: 12px; padding: 8px 14px; display: none; align-items: center; gap: 8px; color: #fef08a; font-size: 12px; font-weight: 700; box-shadow: 0 4px 16px rgba(0,0,0,0.5); z-index: 30;">
        <span id="fused-item-icon" style="font-size: 20px;">🪨</span>
        <div>
          <div id="fused-item-name" style="font-weight: 800; color: #fef08a;">Fused Granite Boulder</div>
          <div id="fused-item-stats" style="font-size: 10px; color: #cbd5e1;">+2.5x Slam Damage | Durability: 6/6</div>
        </div>
      </div>

      <!-- Topographic Parchment Map Overlay (M) -->
      <div id="topographic-map-overlay" style="position: absolute; inset: 0; background: rgba(10, 8, 6, 0.88); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 1000; pointer-events: auto;">
        <div style="position: relative; width: 85vw; max-width: 680px; height: 80vh; max-height: 620px; background: #e8d8b8; border: 4px solid #5c3a21; border-radius: 16px; box-shadow: 0 16px 50px rgba(0,0,0,0.85); display: flex; flex-direction: column; overflow: hidden; font-family: 'Segoe UI', serif;">
          <div style="background: #3e2716; color: #fef08a; padding: 10px 18px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #5c3a21;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🗺️</span>
              <span style="font-size: 15px; font-weight: 800; letter-spacing: 1px;">SYLVAN FOREST TOPOGRAPHIC ATLAS</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 11px; color: #d1b89d;">Click Map to Ping Waypoint | [M] Close</span>
              <button id="btn-close-map" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; border-radius: 6px; width: 26px; height: 26px; cursor: pointer; font-weight: 900;">✕</button>
            </div>
          </div>
          <div style="flex: 1; position: relative; overflow: hidden; background: #eedfc5;">
            <canvas id="topographic-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
          </div>
          <div style="background: #2b1b10; color: #e5d5c0; padding: 8px 16px; font-size: 11px; display: flex; justify-content: space-around; border-top: 2px solid #5c3a21; font-weight: 600;">
            <span>🟢 Evermean (You)</span>
            <span>🏝️ Sky Islands</span>
            <span>🕳️ Ancient Chasm</span>
            <span>🦫 Beaver Village</span>
            <span>👹 Bokoblin Camp</span>
            <span>📍 Waypoint Beacon</span>
            <span>🌲 Remote Players</span>
          </div>
        </div>
      </div>

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
        <span><span class="key-badge">E</span> Ultrahand</span>
        <span><span class="key-badge">F</span> Fuse</span>
        <span><span class="key-badge">G</span> Ping</span>
        <span><span class="key-badge">M</span> Map</span>
        <span><span class="key-badge">C</span> Camo</span>
        <span><span class="key-badge">R</span> Burrow</span>
        <span><span class="key-badge">Q</span> Acorn</span>
        <span><span class="key-badge">Space</span> Jump / Swim</span>
        <span><span class="key-badge">B</span> Build</span>
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

    // Click on Room Indicator Pill to copy Room Code & Direct Invite Link
    const roomPill = document.getElementById('hud-room-indicator');
    if (roomPill) {
      roomPill.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = multiplayer.currentRoom;
        if (!code) return;
        const url = new URL(window.location.href);
        url.hash = `room=${code}`;
        navigator.clipboard.writeText(url.href).then(() => {
          const badge = document.getElementById('hud-room-copy-badge');
          if (badge) {
            badge.textContent = '✅ Copied!';
            setTimeout(() => (badge.textContent = '📋 Copy'), 2000);
          }
          if (window.showGameNotification) {
            window.showGameNotification(`🔗 Copied direct invite link for Room ${code}!`);
          }
        }).catch(() => {
          navigator.clipboard.writeText(code);
          if (window.showGameNotification) {
            window.showGameNotification(`📋 Copied Room Code ${code}!`);
          }
        });
      });
    }

    // Topographic Map Listeners
    const mapCanvas = document.getElementById('topographic-canvas');
    if (mapCanvas) {
      mapCanvas.addEventListener('click', (e) => {
        const rect = mapCanvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) / rect.width;
        const clickY = (e.clientY - rect.top) / rect.height;
        const worldMin = -100;
        const worldSpan = 200;
        const targetX = worldMin + clickX * worldSpan;
        const targetZ = worldMin + clickY * worldSpan;
        if (multiplayer) {
          multiplayer.broadcastPing(new THREE.Vector3(targetX, 0, targetZ));
          if (window.game && window.game.player) {
            this.drawTopographicMap(window.game.player, window.game.terrain, multiplayer);
          }
        }
      });
    }

    const closeMapBtn = document.getElementById('btn-close-map');
    if (closeMapBtn) {
      closeMapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeMap();
      });
    }
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

    // Active Room Indicator Pill State
    const roomIndicator = document.getElementById('hud-room-indicator');
    if (roomIndicator) {
      if (multiplayer && multiplayer.currentRoom) {
        roomIndicator.style.display = 'flex';
        const codeText = document.getElementById('hud-room-code-text');
        if (codeText) codeText.textContent = multiplayer.currentRoom;
      } else {
        roomIndicator.style.display = 'none';
      }
    }

    // 3. Resources (Wood, Acorns, Korok Seeds, Stardust, Rupees, Jelly, Bubbul Gems, Sundelions)
    document.getElementById('res-wood').textContent = player.inventory.wood;
    document.getElementById('res-acorns').textContent = player.inventory.acorns;
    document.getElementById('res-korok').textContent = player.inventory.korokSeeds || 0;
    document.getElementById('res-stardust').textContent = player.inventory.stardust;
    const resRupees = document.getElementById('res-rupees');
    if (resRupees) resRupees.textContent = player.inventory.rupees || 0;
    const resJelly = document.getElementById('res-jelly');
    if (resJelly) resJelly.textContent = player.inventory.chuchuJelly || 0;
    const resBubbul = document.getElementById('res-bubbul');
    if (resBubbul) resBubbul.textContent = player.inventory.bubbulGems || 0;
    const resSun = document.getElementById('res-sundelion');
    if (resSun) resSun.textContent = player.inventory.sundelions || 0;

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

    // 7. Dynamic Zelda TOTK Systems: Compass, Stamina Wheel, Ultrahand & Map
    this.updateCompass(player);
    this.updateStaminaWheel(player);
    this.updateUltrahandHud(player);

    const mapOverlay = document.getElementById('topographic-map-overlay');
    if (mapOverlay && mapOverlay.style.display === 'flex') {
      this.drawTopographicMap(player, window.game?.terrain, multiplayer);
    }
  }

  // Toggle Topographic Atlas Map
  toggleMap(player = null, terrain = null, mp = null) {
    const overlay = document.getElementById('topographic-map-overlay');
    if (!overlay) return;
    const isOpen = overlay.style.display === 'flex';
    if (isOpen) {
      this.closeMap();
    } else {
      this.openMap(player, terrain, mp);
    }
  }

  openMap(player = null, terrain = null, mp = null) {
    const overlay = document.getElementById('topographic-map-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
    const p = player || window.game?.player;
    const t = terrain || window.game?.terrain;
    const m = mp || multiplayer;
    this.drawTopographicMap(p, t, m);
  }

  closeMap() {
    const overlay = document.getElementById('topographic-map-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    if (input && input.mode === 'pc') {
      input.requestPointerLock();
    }
  }

  // Update Zelda TOTK Top Compass Bar
  updateCompass(player) {
    const track = document.getElementById('compass-track');
    if (!track || !player || !player.position) return;

    const width = 340;
    const halfW = width / 2;
    const fov = Math.PI * 0.75;

    const landmarks = [
      { name: 'N', yaw: 0, color: '#facc15', isCardinal: true },
      { name: 'E', yaw: Math.PI / 2, color: '#d1b89d', isCardinal: true },
      { name: 'S', yaw: Math.PI, color: '#d1b89d', isCardinal: true },
      { name: 'W', yaw: -Math.PI / 2, color: '#d1b89d', isCardinal: true },
      { name: '🏝️ Sky', x: 50, z: 60, color: '#38bdf8' },
      { name: '🕳️ Chasm', x: 75, z: 70, color: '#a855f7' },
      { name: '🦫 Beaver', x: -28, z: 25, color: '#f97316' },
      { name: '💧 Lake', x: 0, z: 65, color: '#06b6d4' },
      { name: '👹 Camp', x: 65, z: -40, color: '#ef4444' }
    ];

    if (multiplayer && multiplayer.activeBeacons) {
      multiplayer.activeBeacons.forEach((b) => {
        landmarks.push({ name: '📍 Ping', x: b.pos.x, z: b.pos.z, color: '#38bdf8' });
      });
    }

    if (multiplayer && multiplayer.remotePlayers) {
      multiplayer.remotePlayers.forEach((rp) => {
        landmarks.push({ name: `🌲 ${rp.username}`, x: rp.targetPos.x, z: rp.targetPos.z, color: '#4ade80' });
      });
    }

    let html = '';
    landmarks.forEach((lm) => {
      let targetAngle = lm.yaw;
      if (lm.x !== undefined && lm.z !== undefined) {
        const dx = lm.x - player.position.x;
        const dz = lm.z - player.position.z;
        targetAngle = Math.atan2(dx, dz);
      }

      let diff = targetAngle - player.yaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      if (Math.abs(diff) < fov / 2) {
        const xPos = halfW + (diff / (fov / 2)) * halfW;
        html += `<span class="compass-item" style="left: ${xPos}px; color: ${lm.color};">${lm.name}</span>`;
      }
    });

    track.innerHTML = html;
  }

  // Update Zelda TOTK Circular Stamina Wheel
  updateStaminaWheel(player) {
    const container = document.getElementById('stamina-wheel-container');
    const circle = document.getElementById('stamina-wheel-circle');
    const icon = document.getElementById('stamina-wheel-icon');
    if (!container || !circle || !player) return;

    const staminaPct = Math.max(0, Math.min(1, (player.stamina || 100) / (player.maxStamina || 100)));
    const circum = 113.1;
    circle.style.strokeDashoffset = circum * (1 - staminaPct);

    if (player.isExhausted) {
      circle.style.stroke = '#ef4444';
      if (icon) icon.textContent = '⚠️';
      container.style.opacity = '1';
    } else {
      circle.style.stroke = '#22c55e';
      if (icon) icon.textContent = '⚡';
      if (staminaPct < 0.98) {
        container.style.opacity = '1';
      } else {
        container.style.opacity = '0';
      }
    }
  }

  // Update Ultrahand Reticle & Fused Item Indicator
  updateUltrahandHud(player) {
    const reticle = document.getElementById('ultrahand-reticle');
    const prompt = document.getElementById('ultrahand-action-prompt');
    const fusedBadge = document.getElementById('fused-item-badge');

    if (reticle && prompt) {
      if (player.isUltrahandActive) {
        reticle.style.display = 'block';
        prompt.style.display = 'block';
      } else {
        reticle.style.display = 'none';
        prompt.style.display = 'none';
      }
    }

    if (fusedBadge) {
      if (player.fusedItem) {
        fusedBadge.style.display = 'flex';
        const nameEl = document.getElementById('fused-item-name');
        const statsEl = document.getElementById('fused-item-stats');
        const iconEl = document.getElementById('fused-item-icon');
        if (nameEl) nameEl.textContent = `Fused: ${player.fusedItem.name}`;
        if (statsEl) {
          const mult = player.fusedItem.type === 'bomb_flower' ? '4.0x Explosion' : (player.fusedItem.type === 'boulder' ? '2.5x Slam' : '1.4x Sweep');
          statsEl.textContent = `+${mult} | Durability: ${player.fusedItem.durability}/${player.fusedItem.maxDurability}`;
        }
        if (iconEl) {
          iconEl.textContent = player.fusedItem.type === 'bomb_flower' ? '💣' : (player.fusedItem.type === 'boulder' ? '🪨' : '🪵');
        }
      } else {
        fusedBadge.style.display = 'none';
      }
    }
  }

  // Draw 2D Parchment Topographic Map
  drawTopographicMap(player, terrain, mp) {
    const canvas = document.getElementById('topographic-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (canvas.width !== Math.floor(rect.width) || canvas.height !== Math.floor(rect.height)) {
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
    }
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Vintage Parchment Background
    ctx.fillStyle = '#eedfc5';
    ctx.fillRect(0, 0, w, h);

    const worldMin = -100;
    const worldSpan = 200;
    const toCanvasX = (wx) => ((wx - worldMin) / worldSpan) * w;
    const toCanvasY = (wz) => ((wz - worldMin) / worldSpan) * h;

    // Topographic contour rings
    ctx.strokeStyle = '#d7c4a3';
    ctx.lineWidth = 1.5;
    for (let r = 15; r <= 85; r += 14) {
      ctx.beginPath();
      ctx.arc(toCanvasX(20), toCanvasY(20), (r / worldSpan) * w, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sylvan River
    ctx.beginPath();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = Math.max(6, (12 / worldSpan) * w);
    ctx.lineCap = 'round';
    for (let z = -90; z <= 90; z += 5) {
      const rx = Math.sin(z * 0.025) * 28.0;
      const cx = toCanvasX(rx);
      const cy = toCanvasY(z);
      if (z === -90) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Sylvan Lake
    ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(65), (22 / worldSpan) * w, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ancient Chasm crater
    ctx.fillStyle = 'rgba(126, 34, 206, 0.35)';
    ctx.beginPath();
    ctx.arc(toCanvasX(75), toCanvasY(70), (14 / worldSpan) * w, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Landmarks
    const landmarks = [
      { name: 'Sky Islands', x: 50, z: 60, icon: '🏝️' },
      { name: 'Ancient Chasm', x: 75, z: 70, icon: '🕳️' },
      { name: 'Beaver Village', x: -28, z: 25, icon: '🦫' },
      { name: 'Bokoblin Camp', x: 65, z: -40, icon: '👹' },
      { name: 'Sylvan Lake', x: 0, z: 65, icon: '💧' }
    ];

    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    landmarks.forEach((lm) => {
      const cx = toCanvasX(lm.x);
      const cy = toCanvasY(lm.z);
      ctx.fillText(lm.icon, cx, cy);
      ctx.fillStyle = '#451a03';
      ctx.fillText(lm.name, cx, cy + 13);
    });

    // Active Waypoint Beacons
    if (mp && mp.activeBeacons) {
      mp.activeBeacons.forEach((b) => {
        const cx = toCanvasX(b.pos.x);
        const cy = toCanvasY(b.pos.z);
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillText('📍', cx, cy - 2);
      });
    }

    // Remote Players
    if (mp && mp.remotePlayers) {
      mp.remotePlayers.forEach((rp) => {
        const cx = toCanvasX(rp.targetPos.x);
        const cy = toCanvasY(rp.targetPos.z);
        ctx.fillText('🌲', cx, cy);
        ctx.fillStyle = '#166534';
        ctx.fillText(rp.username, cx, cy + 12);
      });
    }

    // Local Player Position & Orientation Arrow
    if (player && player.position) {
      const px = toCanvasX(player.position.x);
      const py = toCanvasY(player.position.z);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-player.yaw);

      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(5, -6);
      ctx.lineTo(0, -4);
      ctx.lineTo(-5, -6);
      ctx.closePath();
      ctx.fillStyle = '#16a34a';
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#14532d';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('You', px, py + 20);
    }
  }
}

export const hud = new HUD();
