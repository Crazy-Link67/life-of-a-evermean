import { saveSystem } from '../core/SaveSystem.js';
import { audio } from '../core/AudioManager.js';

// Starting Menu with Continue, New Game, Save, Load, Export, Import, and Settings
export class MainMenu {
  constructor() {
    this.container = null;
    this.activeModal = null;
    this.callbacks = {};
  }

  init(callbacks = {}) {
    this.callbacks = callbacks;

    this.container = document.createElement('div');
    this.container.id = 'main-menu-container';
    this.container.innerHTML = `
      <style>
        #main-menu-container {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(12, 10, 8, 0.95) 0%, rgba(28, 20, 14, 0.9) 100%);
          z-index: 150;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          color: #f5f5f4;
        }

        .title-box {
          text-align: center;
          margin-bottom: 30px;
        }
        .game-title {
          font-size: 46px;
          font-weight: 900;
          letter-spacing: 2px;
          color: #fef08a;
          text-shadow: 0 4px 20px rgba(254, 240, 138, 0.4);
          margin-bottom: 6px;
        }
        .game-subtitle {
          font-size: 15px;
          font-weight: 600;
          color: #a8a29e;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 320px;
        }
        .btn-menu {
          background: #251c16;
          border: 1px solid rgba(139, 90, 43, 0.5);
          color: #fef3c7;
          font-size: 15px;
          font-weight: 700;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .btn-menu:hover:not(:disabled) {
          background: #3f2c20;
          border-color: #f59e0b;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }
        .btn-menu:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          border-color: rgba(255,255,255,0.1);
        }
        .btn-primary {
          background: linear-gradient(135deg, #d97706, #b45309);
          border-color: #f59e0b;
          color: #fff;
        }

        /* Generic Modal Overlay for Save/Load/Export/Import/Settings */
        .menu-modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 160;
        }
        .menu-modal {
          background: #1c1511;
          border: 2px solid #8b5a2b;
          border-radius: 14px;
          padding: 24px;
          width: 520px;
          max-width: 90%;
          box-shadow: 0 16px 40px rgba(0,0,0,0.8);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 800;
          color: #fef08a;
        }
        .slot-card {
          background: #2b2019;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slot-info-title {
          font-size: 14px;
          font-weight: 700;
          color: #f5f5f4;
        }
        .slot-info-sub {
          font-size: 11px;
          color: #a8a29e;
          margin-top: 2px;
        }
        .btn-slot-action {
          background: #ca8a04;
          border: none;
          color: #000;
          font-weight: 800;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-slot-action:hover {
          background: #eab308;
        }
        .setting-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          font-size: 13px;
        }
        .setting-field input[type="range"] {
          width: 180px;
        }
      </style>

      <div class="title-box">
        <div class="game-title">LIFE OF AN EVERMEAN</div>
        <div class="game-subtitle">Cosmic Ascension</div>
      </div>

      <div class="menu-buttons">
        <button id="btn-continue" class="btn-menu btn-primary" disabled>▶ Continue</button>
        <button id="btn-new-game" class="btn-menu">🌱 New Game (Customizer)</button>
        <button id="btn-save" class="btn-menu">💾 Save Game</button>
        <button id="btn-load" class="btn-menu">📂 Load Game</button>
        <button id="btn-export" class="btn-menu">📤 Export Save (.json)</button>
        <button id="btn-import" class="btn-menu">📥 Import Save (.json)</button>
        <button id="btn-settings" class="btn-menu">⚙️ Settings</button>
        <button id="btn-github" class="btn-menu" style="border-color: #38bdf8; color: #7dd3fc;">⭐ GitHub Repository</button>
        <button id="btn-install-pwa" class="btn-menu" style="border-color: #a855f7; color: #d8b4fe;">📲 Install App (PWA)</button>
      </div>

      <!-- Save/Load Modal -->
      <div id="modal-slots" class="menu-modal-overlay">
        <div class="menu-modal">
          <div class="modal-header">
            <div id="slots-modal-title" class="modal-title">Save / Load Game</div>
            <button id="btn-close-slots" class="btn-menu" style="padding: 4px 10px; font-size: 12px;">✕</button>
          </div>
          <div id="slots-list-container"></div>
        </div>
      </div>

      <!-- Settings Modal -->
      <div id="modal-settings" class="menu-modal-overlay">
        <div class="menu-modal">
          <div class="modal-header">
            <div class="modal-title">⚙️ Game Settings</div>
            <button id="btn-close-settings" class="btn-menu" style="padding: 4px 10px; font-size: 12px;">✕</button>
          </div>
          <div class="setting-field">
            <span>Field of View (FOV)</span>
            <input type="range" id="set-fov" min="60" max="110" value="75">
          </div>
          <div class="setting-field">
            <span>Mouse Sensitivity</span>
            <input type="range" id="set-sens" min="0.4" max="2.5" step="0.1" value="1.0">
          </div>
          <div class="setting-field">
            <span>Master Volume</span>
            <input type="range" id="set-vol-master" min="0" max="1" step="0.05" value="0.8">
          </div>
          <div class="setting-field">
            <span>SFX Volume (Wood / Slams)</span>
            <input type="range" id="set-vol-sfx" min="0" max="1" step="0.05" value="0.9">
          </div>
          <div class="setting-field">
            <span>Ambient & Wind Volume</span>
            <input type="range" id="set-vol-ambient" min="0" max="1" step="0.05" value="0.6">
          </div>
        </div>
      </div>

      <!-- Hidden file input for Import Save -->
      <input type="file" id="import-file-input" accept=".json" style="display: none;">
    `;

    document.body.appendChild(this.container);

    this.setupEvents();
    this.refreshContinueButton();
  }

  setupEvents() {
    // Continue
    document.getElementById('btn-continue').addEventListener('click', () => {
      audio.init();
      this.hide();
      if (this.callbacks.onContinue) this.callbacks.onContinue();
    });

    // New Game
    document.getElementById('btn-new-game').addEventListener('click', () => {
      audio.init();
      this.hide();
      if (this.callbacks.onNewGame) this.callbacks.onNewGame();
    });

    // Save Game Button
    document.getElementById('btn-save').addEventListener('click', () => {
      this.openSlotsModal('save');
    });

    // Load Game Button
    document.getElementById('btn-load').addEventListener('click', () => {
      this.openSlotsModal('load');
    });

    // Export Save Button
    document.getElementById('btn-export').addEventListener('click', () => {
      this.openSlotsModal('export');
    });

    // Import Save Button
    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = saveSystem.importSave(ev.target.result, 'slot1');
        if (res.success) {
          alert(`Save imported successfully into Slot 1! Loading imported journey...`);
          this.hide();
          if (this.callbacks.onLoadSlot) this.callbacks.onLoadSlot('slot1');
        } else {
          alert(`Failed to import save: ${res.error}`);
        }
      };
      reader.readAsText(file);
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
      document.getElementById('modal-settings').style.display = 'flex';
    });

    // GitHub Repository Link
    document.getElementById('btn-github').addEventListener('click', () => {
      window.open('https://github.com/Crazy-Link67/life-of-a-evermean', '_blank');
    });

    // Install PWA Button
    document.getElementById('btn-install-pwa').addEventListener('click', () => {
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            document.getElementById('btn-install-pwa').style.display = 'none';
          }
          window.deferredPrompt = null;
        });
      } else {
        alert('To install Life of an Evermean as an app:\n\n• On Chrome / Edge (Desktop): Click the install button in the right side of the address bar.\n• On iOS (Safari): Tap the Share icon and choose "Add to Home Screen".\n• On Android (Chrome): Tap the menu (⋮) and select "Install app".');
      }
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      document.getElementById('modal-settings').style.display = 'none';
      this.applySettings();
    });

    document.getElementById('btn-close-slots').addEventListener('click', () => {
      document.getElementById('modal-slots').style.display = 'none';
    });
  }

  openSlotsModal(mode) {
    const modal = document.getElementById('modal-slots');
    const title = document.getElementById('slots-modal-title');
    const listContainer = document.getElementById('slots-list-container');

    const titles = {
      save: '💾 Save Game to Slot',
      load: '📂 Load Game from Slot',
      export: '📤 Export Save to JSON File'
    };
    title.textContent = titles[mode] || 'Slots';

    listContainer.innerHTML = '';
    const saves = saveSystem.listSaves();

    saves.forEach(s => {
      const card = document.createElement('div');
      card.className = 'slot-card';

      let infoText = s.isEmpty
        ? '<div class="slot-info-sub">Empty Slot</div>'
        : `<div class="slot-info-sub">Day ${s.day} (${s.stageName}) • ${s.speciesName} • ${new Date(s.timestamp).toLocaleDateString()}</div>`;

      let btnLabel = 'Select';
      if (mode === 'save') btnLabel = 'Save Here';
      else if (mode === 'load') btnLabel = s.isEmpty ? 'Empty' : 'Load Game';
      else if (mode === 'export') btnLabel = s.isEmpty ? 'Empty' : 'Export File';

      card.innerHTML = `
        <div>
          <div class="slot-info-title">${s.slotId.toUpperCase()}</div>
          ${infoText}
        </div>
        <button class="btn-slot-action" ${s.isEmpty && mode !== 'save' ? 'disabled' : ''}>${btnLabel}</button>
      `;

      card.querySelector('.btn-slot-action').addEventListener('click', () => {
        if (mode === 'save') {
          if (this.callbacks.onSaveSlot) this.callbacks.onSaveSlot(s.slotId);
          modal.style.display = 'none';
          alert(`Game saved to ${s.slotId.toUpperCase()}!`);
          this.refreshContinueButton();
        } else if (mode === 'load') {
          modal.style.display = 'none';
          this.hide();
          if (this.callbacks.onLoadSlot) this.callbacks.onLoadSlot(s.slotId);
        } else if (mode === 'export') {
          saveSystem.exportSave(s.slotId);
          modal.style.display = 'none';
        }
      });

      listContainer.appendChild(card);
    });

    modal.style.display = 'flex';
  }

  refreshContinueButton() {
    const btnContinue = document.getElementById('btn-continue');
    const hasSave = saveSystem.hasAnySave();
    if (btnContinue) {
      btnContinue.disabled = !hasSave;
      if (hasSave) {
        const latestSlot = saveSystem.getLatestSaveSlot();
        const data = saveSystem.loadGame(latestSlot);
        if (data) {
          btnContinue.innerHTML = `▶ Continue (Day ${data.growth?.day || 1} ${data.species?.name || 'Evermean'})`;
        }
      }
    }
  }

  applySettings() {
    const fov = parseInt(document.getElementById('set-fov').value);
    const sens = parseFloat(document.getElementById('set-sens').value);
    const master = parseFloat(document.getElementById('set-vol-master').value);
    const sfx = parseFloat(document.getElementById('set-vol-sfx').value);
    const ambient = parseFloat(document.getElementById('set-vol-ambient').value);

    audio.setVolumes({ master, sfx, ambient });
    saveSystem.saveSettings({ fov, mouseSensitivity: sens, masterVolume: master, sfxVolume: sfx, ambientVolume: ambient });

    if (this.callbacks.onUpdateSettings) {
      this.callbacks.onUpdateSettings({ fov, mouseSensitivity: sens });
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
      this.refreshContinueButton();
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }
}

export const mainMenu = new MainMenu();

