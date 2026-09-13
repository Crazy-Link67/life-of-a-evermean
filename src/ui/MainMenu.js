import { saveSystem } from '../core/SaveSystem.js';
import { audio } from '../core/AudioManager.js';
import { input } from '../core/Input.js';

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
        <button id="btn-mode-toggle" class="btn-menu" style="border-color: #3b82f6; color: #93c5fd; background: #162235;">🖥️ Mode: PC Controls (Click to Switch)</button>
        <button id="btn-install-pc" class="btn-menu" style="border-color: #10b981; color: #6ee7b7; font-weight: 800; background: #0e291e; box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);">📥 Install on PC / Computer</button>
        <button id="btn-save" class="btn-menu">💾 Save Game</button>
        <button id="btn-load" class="btn-menu">📂 Load Game</button>
        <button id="btn-export" class="btn-menu">📤 Export Save (.json)</button>
        <button id="btn-import" class="btn-menu">📥 Import Save (.json)</button>
        <button id="btn-settings" class="btn-menu">⚙️ Settings</button>
        <button id="btn-github" class="btn-menu" style="border-color: #38bdf8; color: #7dd3fc;">⭐ GitHub Repository</button>
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

      <!-- Direct PC Installation Modal -->
      <div id="modal-install-pc" class="menu-modal-overlay">
        <div class="menu-modal" style="border-color: #10b981; max-width: 560px;">
          <div class="modal-header">
            <div class="modal-title" style="color: #6ee7b7;">📥 Install Life of an Evermean on PC</div>
            <button id="btn-close-install-pc" class="btn-menu" style="padding: 4px 10px; font-size: 12px;">✕</button>
          </div>
          <div style="font-size: 13.5px; line-height: 1.6; color: #e2e8f0; margin-bottom: 16px;">
            Install directly on your computer to play in a dedicated standalone window with full GPU performance, offline play, and desktop shortcuts!
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
            <!-- Option 1: Native PWA Install -->
            <div style="background: #14281e; border: 1.5px solid #059669; border-radius: 10px; padding: 12px;">
              <div style="font-weight: 800; color: #6ee7b7; font-size: 14px; margin-bottom: 3px;">Option 1: One-Click Native PC App</div>
              <div style="font-size: 12px; color: #a7f3d0; margin-bottom: 8px;">Installs directly into Windows Apps, Start Menu, and Desktop as a native program.</div>
              <button id="btn-do-native-install" class="btn-menu btn-primary" style="background: linear-gradient(135deg, #059669, #047857); border-color: #34d399; width: 100%;">
                ⚡ Trigger Direct Browser Install
              </button>
            </div>

            <!-- Option 2: Download Windows Desktop Shortcut -->
            <div style="background: #1e1b2e; border: 1.5px solid #8b5cf6; border-radius: 10px; padding: 12px;">
              <div style="font-weight: 800; color: #c4b5fd; font-size: 14px; margin-bottom: 3px;">Option 2: Download Windows Desktop Shortcut (.url)</div>
              <div style="font-size: 12px; color: #ddd6fe; margin-bottom: 8px;">Downloads a ready-to-use desktop icon file. Put it on your Windows Desktop to launch instantly!</div>
              <button id="btn-download-url-shortcut" class="btn-menu" style="border-color: #8b5cf6; color: #c4b5fd; width: 100%;">
                🖥️ Download Desktop Shortcut (.url)
              </button>
            </div>

            <!-- Option 3: Download Standalone App Launcher -->
            <div style="background: #1a2332; border: 1.5px solid #3b82f6; border-radius: 10px; padding: 12px;">
              <div style="font-weight: 800; color: #93c5fd; font-size: 14px; margin-bottom: 3px;">Option 3: Download Standalone App Launcher (.bat)</div>
              <div style="font-size: 12px; color: #bfdbfe; margin-bottom: 8px;">Runs Edge or Chrome in frameless standalone app mode with zero browser tabs or toolbars.</div>
              <button id="btn-download-bat-launcher" class="btn-menu" style="border-color: #3b82f6; color: #93c5fd; width: 100%;">
                🚀 Download Standalone Launcher (.bat)
              </button>
            </div>
          </div>

          <div style="font-size: 12px; color: #94a3b8; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
            💡 <strong>Tip for Edge / Chrome:</strong> You can also install anytime by clicking the <strong>Install / App Available icon [⊕]</strong> at the right edge of your address bar.
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

    // PC / Mobile Mode Switch Button
    document.getElementById('btn-mode-toggle').addEventListener('click', () => {
      const newMode = input.toggleMode();
      this.updateModeButton();
      if (window.showGameNotification) {
        window.showGameNotification(newMode === 'pc' ? '🖥️ Switched to PC Mode (Mouse Look + Keyboard)' : '📱 Switched to Mobile Mode (Touch Joystick + Buttons)');
      }
    });

    // Direct PC Install Button (Opens Modal)
    document.getElementById('btn-install-pc').addEventListener('click', () => {
      document.getElementById('modal-install-pc').style.display = 'flex';
    });

    document.getElementById('btn-close-install-pc').addEventListener('click', () => {
      document.getElementById('modal-install-pc').style.display = 'none';
    });

    // Option 1: Native PWA Install
    document.getElementById('btn-do-native-install').addEventListener('click', () => {
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            document.getElementById('modal-install-pc').style.display = 'none';
            if (window.showGameNotification) window.showGameNotification('✅ Life of an Evermean installed on your PC!');
          }
          window.deferredPrompt = null;
        });
      } else {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) {
          alert('✅ Life of an Evermean is already running as an installed PC application!');
        } else {
          alert('Direct Install:\n\n• Look at the right side of your address bar in Chrome or Edge and click the Install icon [⊕].\n• Or click browser menu (⋮) -> "Install Life of an Evermean".');
        }
      }
    });

    // Option 2: Download Windows Desktop Shortcut (.url)
    document.getElementById('btn-download-url-shortcut').addEventListener('click', () => {
      const currentUrl = window.location.href;
      const iconUrl = new URL('./icon.svg', window.location.href).href;
      const urlContent = `[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,0\r\n[InternetShortcut]\r\nIDList=\r\nURL=${currentUrl}\r\nIconIndex=0\r\nIconFile=${iconUrl}\r\n`;
      const blob = new Blob([urlContent], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Life of an Evermean.url';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.showGameNotification) window.showGameNotification('📥 Downloaded Windows Desktop Shortcut! Drag it to your Desktop.');
    });

    // Option 3: Download Standalone App Launcher (.bat)
    document.getElementById('btn-download-bat-launcher').addEventListener('click', () => {
      const targetUrl = window.location.href;
      const batContent = `@echo off\r\ntitle Life of an Evermean - Cosmic Ascension\r\necho Launching Life of an Evermean in standalone desktop app mode...\r\nstart msedge --app="${targetUrl}" || start chrome --app="${targetUrl}" || start "" "${targetUrl}"\r\n`;
      const blob = new Blob([batContent], { type: 'application/x-bat' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Launch_Evermean_PC.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (window.showGameNotification) window.showGameNotification('📥 Downloaded Windows App Launcher (.bat)! Run it to play in standalone mode.');
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
      document.getElementById('modal-settings').style.display = 'none';
      this.applySettings();
    });

    document.getElementById('btn-close-slots').addEventListener('click', () => {
      document.getElementById('modal-slots').style.display = 'none';
    });

    this.updateModeButton();
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

  updateModeButton() {
    const btn = document.getElementById('btn-mode-toggle');
    if (!btn) return;
    if (input.mode === 'pc') {
      btn.innerHTML = '🖥️ Mode: PC Controls (Click to Switch to 📱 Mobile)';
      btn.style.borderColor = '#3b82f6';
      btn.style.color = '#93c5fd';
      btn.style.background = '#162235';
    } else {
      btn.innerHTML = '📱 Mode: Mobile Controls (Click to Switch to 🖥️ PC)';
      btn.style.borderColor = '#f59e0b';
      btn.style.color = '#fef08a';
      btn.style.background = '#2e1f0e';
    }
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
      this.refreshContinueButton();
      this.updateModeButton();
      if (document.exitPointerLock) document.exitPointerLock();
    }
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }
}

export const mainMenu = new MainMenu();

