import { multiplayer } from '../net/MultiplayerManager.js';
import { accountSystem } from '../core/AccountSystem.js';

// Multiplayer Lobby Browser, Host/Join, and In-Game Text Chat UI
export class MultiplayerLobbyModal {
  constructor() {
    this.container = null;
    this.chatOverlay = null;
    this.chatInput = null;
    this.chatMessages = null;
  }

  init() {
    // 1. Lobby Modal
    this.container = document.createElement('div');
    this.container.id = 'modal-multiplayer-container';
    this.container.innerHTML = `
      <style>
        #modal-multiplayer-container {
          position: absolute;
          inset: 0;
          background: rgba(8, 6, 4, 0.85);
          backdrop-filter: blur(8px);
          z-index: 215;
          display: none;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          color: #f5f5f4;
        }

        .lobby-card {
          background: #18120e;
          border: 2px solid #ca8a04;
          border-radius: 14px;
          padding: 24px;
          width: 580px;
          max-width: 92%;
          box-shadow: 0 16px 40px rgba(0,0,0,0.85);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 10px;
        }
        .lobby-title {
          font-size: 20px;
          font-weight: 800;
          color: #fde047;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lobby-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 8px;
        }
        .tab-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #d1d5db;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }
        .tab-btn.active {
          background: #ca8a04;
          border-color: #facc15;
          color: #000;
        }

        .mode-option-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        .mode-card {
          background: #251b14;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .mode-card:hover {
          border-color: #f59e0b;
          transform: translateY(-2px);
        }
        .mode-card.selected {
          border-color: #f59e0b;
          background: #3a281b;
          box-shadow: 0 0 12px rgba(245,158,11,0.3);
        }
        .mode-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .mode-title {
          font-size: 13px;
          font-weight: 800;
          color: #fef08a;
        }
        .mode-desc {
          font-size: 10px;
          color: #a8a29e;
          margin-top: 4px;
          line-height: 1.3;
        }

        .join-box {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .room-input {
          background: #100b08;
          border: 1.5px solid #ca8a04;
          color: #fef08a;
          font-family: monospace;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 2px;
          padding: 10px 14px;
          border-radius: 8px;
          flex: 1;
          text-transform: uppercase;
        }

        .btn-mp {
          background: linear-gradient(135deg, #d97706, #b45309);
          border: 1px solid #f59e0b;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .btn-mp:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
        }

        .active-room-bar {
          background: #14281e;
          border: 1.5px solid #22c55e;
          border-radius: 8px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      </style>

      <div class="lobby-card">
        <div class="lobby-header">
          <div class="lobby-title">🌐 Local Network & Online Multiplayer</div>
          <button id="btn-close-mp" class="btn-mp" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 4px 10px;">✕</button>
        </div>

        <!-- Active Room Status Banner -->
        <div id="active-room-container" style="display: none;">
          <div class="active-room-bar">
            <div>
              <div style="font-size: 12px; color: #86efac; font-weight: 700;">CONNECTED TO ROOM</div>
              <div id="active-room-name" style="font-size: 18px; font-weight: 900; color: #fef08a; font-family: monospace;">GROVE-42</div>
            </div>
            <button id="btn-leave-room" class="btn-mp" style="background: #ef4444; border-color: #f87171; padding: 6px 14px; font-size: 12px;">Leave Room</button>
          </div>
        </div>

        <!-- Mode Select: Host Room -->
        <div id="tab-host-pane">
          <div style="font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase;">1. Choose Multiplayer Experience:</div>
          <div class="mode-option-grid">
            <div class="mode-card selected" data-mode="social">
              <div class="mode-icon">🌸</div>
              <div class="mode-title">Social Grove</div>
              <div class="mode-desc">Hang out, spatial chat, inspect custom trees, explore peaceful woods.</div>
            </div>
            <div class="mode-card" data-mode="coop">
              <div class="mode-icon">🌲</div>
              <div class="mode-title">Co-op Survival</div>
              <div class="mode-desc">Share world, build Evermean colony, survive goblin woodcutter raids.</div>
            </div>
            <div class="mode-card" data-mode="arena">
              <div class="mode-icon">⚔️</div>
              <div class="mode-title">Arena PvP</div>
              <div class="mode-desc">Head-slam shockwave duels, acorn shootouts, round scoreboard.</div>
            </div>
          </div>

          <div style="margin-top: 14px; display: flex; gap: 8px;">
            <input type="text" id="host-custom-room-input" class="room-input" style="font-size: 13px; letter-spacing: 1px;" placeholder="Custom Room Code (leave blank for random)..." maxlength="16">
            <button id="btn-create-host-room" class="btn-mp" style="white-space: nowrap;">👑 Host World & Get Room Code</button>
          </div>

          <!-- Dedicated Hosted Room Details & Copy Card -->
          <div id="hosted-success-card" style="display: none; margin-top: 14px; background: #14281e; border: 2px solid #10b981; border-radius: 12px; padding: 16px; text-align: center; box-shadow: 0 0 24px rgba(16, 185, 129, 0.3);">
            <div style="font-size: 15px; font-weight: 800; color: #6ee7b7; margin-bottom: 3px;">🎉 World Hosted Successfully!</div>
            <div style="font-size: 12px; color: #a7f3d0; margin-bottom: 10px;">Share this Room Code or link with other players to explore and battle together:</div>
            
            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 12px;">
              <div id="hosted-code-display" style="font-size: 24px; font-weight: 900; color: #fef08a; font-family: monospace; letter-spacing: 3px; background: rgba(0,0,0,0.6); padding: 8px 18px; border-radius: 8px; border: 1.5px solid #ca8a04;">GROVE-42</div>
              <button id="btn-copy-hosted-code" class="btn-mp" style="background: #059669; border-color: #34d399; padding: 8px 14px; font-size: 13px;">📋 Copy Code</button>
            </div>

            <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 12px;">
              <button id="btn-copy-hosted-link" class="btn-mp" style="background: #1e293b; border-color: #38bdf8; color: #7dd3fc; font-size: 12px; padding: 6px 14px;">🔗 Copy Invite Link</button>
            </div>

            <button id="btn-enter-hosted-world" class="btn-mp" style="background: linear-gradient(135deg, #10b981, #059669); border-color: #34d399; font-size: 15px; width: 100%; padding: 11px;">▶ Enter World & Play Now</button>
          </div>
        </div>

        <!-- Join by Code -->
        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
          <div style="font-size: 13px; font-weight: 700; color: #38bdf8; text-transform: uppercase;">2. Join an Existing Room:</div>
          <div class="join-box">
            <input type="text" id="join-room-code-input" class="room-input" placeholder="Enter Room Code (e.g. GROVE-42)..." maxlength="12">
            <button id="btn-join-room-code" class="btn-mp" style="background: linear-gradient(135deg, #0284c7, #0369a1); border-color: #38bdf8;">🚀 Join</button>
          </div>
        </div>

        <!-- Online Friends Quick Join -->
        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
          <div style="font-size: 13px; font-weight: 700; color: #c084fc; text-transform: uppercase; margin-bottom: 6px;">3. Friends List (<span id="mp-friend-count">0</span>):</div>
          <div id="mp-friends-list" style="max-height: 100px; overflow-y: auto; font-size: 13px; color: #a8a29e;">
            No friends added yet. Open Account to add friends with Friend Codes!
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // 2. In-Game Chat HUD Overlay
    this.createChatOverlay();

    this.bindEvents();
  }

  createChatOverlay() {
    this.chatOverlay = document.createElement('div');
    this.chatOverlay.id = 'hud-chat-overlay';
    this.chatOverlay.innerHTML = `
      <style>
        #hud-chat-overlay {
          position: absolute;
          bottom: 70px;
          left: 20px;
          width: 320px;
          pointer-events: none;
          z-index: 130;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chat-log {
          max-height: 140px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          pointer-events: none;
        }

        .chat-line {
          background: rgba(15, 12, 9, 0.75);
          backdrop-filter: blur(4px);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          color: #f5f5f4;
          border-left: 3px solid #ca8a04;
          word-break: break-word;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        .chat-author {
          font-weight: 800;
          color: #fde047;
          margin-right: 6px;
        }

        .chat-input-bar {
          display: none;
          pointer-events: auto;
        }
        .chat-input {
          width: 100%;
          background: rgba(18, 14, 10, 0.9);
          border: 1.5px solid #ca8a04;
          border-radius: 8px;
          color: #fff;
          font-size: 13px;
          padding: 6px 10px;
          outline: none;
        }
      </style>

      <div class="chat-log" id="hud-chat-log"></div>
      <div class="chat-input-bar" id="hud-chat-input-bar">
        <input type="text" id="hud-chat-input" class="chat-input" placeholder="Type message (Press Enter to send)..." maxlength="80">
      </div>
    `;

    document.body.appendChild(this.chatOverlay);

    this.chatInput = document.getElementById('hud-chat-input');
    this.chatMessages = document.getElementById('hud-chat-log');

    // Press Enter to toggle chat input
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const inputBar = document.getElementById('hud-chat-input-bar');
        if (!inputBar) return;
        if (inputBar.style.display === 'block') {
          // Send message
          const text = this.chatInput.value.trim();
          if (text) {
            multiplayer.sendChat(text);
            this.chatInput.value = '';
          }
          inputBar.style.display = 'none';
          this.chatInput.blur();
        } else if (multiplayer.currentRoom) {
          inputBar.style.display = 'block';
          this.chatInput.focus();
        }
      }
    });

    multiplayer.onChat((username, text) => {
      this.addChatMessage(username, text);
    });
  }

  addChatMessage(username, text) {
    if (!this.chatMessages) return;
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.innerHTML = `<span class="chat-author">${username}:</span>${text}`;
    this.chatMessages.appendChild(line);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (line && line.parentNode) line.parentNode.removeChild(line);
    }, 15000);
  }

  bindEvents() {
    document.getElementById('btn-close-mp').addEventListener('click', () => this.hide());

    // Mode Selection Cards
    let selectedMode = 'social';
    const modeCards = this.container.querySelectorAll('.mode-card');
    modeCards.forEach((card) => {
      card.addEventListener('click', () => {
        modeCards.forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedMode = card.dataset.mode;
      });
    });

    // Create & Host Room
    document.getElementById('btn-create-host-room').addEventListener('click', () => {
      const customInput = document.getElementById('host-custom-room-input');
      let code = customInput ? customInput.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : '';
      if (!code) {
        const roomNum = Math.floor(10 + Math.random() * 89);
        code = `GROVE-${roomNum}`;
      } else if (!code.startsWith('GROVE-') && code.length < 8) {
        code = `GROVE-${code}`;
      }

      multiplayer.hostRoom(code, selectedMode);
      this.renderActiveRoom();

      // Display the dedicated Hosted Success Card with the code & copy buttons
      const successCard = document.getElementById('hosted-success-card');
      const codeDisplay = document.getElementById('hosted-code-display');
      if (successCard && codeDisplay) {
        codeDisplay.textContent = code;
        successCard.style.display = 'block';
      }

      if (window.showGameNotification) {
        window.showGameNotification(`👑 Hosted Room ${code} (${selectedMode.toUpperCase()})! Share code with friends.`);
      }
    });

    // Copy Hosted Code Button
    document.getElementById('btn-copy-hosted-code').addEventListener('click', () => {
      const code = document.getElementById('hosted-code-display').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('btn-copy-hosted-code');
        btn.textContent = '✅ Copied!';
        setTimeout(() => (btn.textContent = '📋 Copy Code'), 2500);
        if (window.showGameNotification) window.showGameNotification(`📋 Copied Room Code ${code} to clipboard!`);
      });
    });

    // Copy Hosted Invite Link Button
    document.getElementById('btn-copy-hosted-link').addEventListener('click', () => {
      const code = document.getElementById('hosted-code-display').textContent;
      const url = new URL(window.location.href);
      url.hash = `room=${code}`;
      navigator.clipboard.writeText(url.href).then(() => {
        const btn = document.getElementById('btn-copy-hosted-link');
        btn.textContent = '✅ Link Copied!';
        setTimeout(() => (btn.textContent = '🔗 Copy Invite Link'), 2500);
        if (window.showGameNotification) window.showGameNotification(`🔗 Copied direct invite link for ${code}!`);
      });
    });

    // Enter Hosted World Now
    document.getElementById('btn-enter-hosted-world').addEventListener('click', () => {
      this.hide();
      if (this.onEnterGameCallback) this.onEnterGameCallback();
    });

    // Join Room by Code
    const doJoin = () => {
      const code = document.getElementById('join-room-code-input').value.trim();
      if (!code) return;
      multiplayer.joinRoom(code);
      this.renderActiveRoom();
      if (window.showGameNotification) {
        window.showGameNotification(`🚀 Connected to Room ${code.toUpperCase()}!`);
      }
      this.hide();
      if (this.onEnterGameCallback) this.onEnterGameCallback();
    };

    document.getElementById('btn-join-room-code').addEventListener('click', doJoin);
    document.getElementById('join-room-code-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doJoin();
    });

    // Leave Room
    document.getElementById('btn-leave-room').addEventListener('click', () => {
      multiplayer.leaveRoom();
      this.renderActiveRoom();
      const successCard = document.getElementById('hosted-success-card');
      if (successCard) successCard.style.display = 'none';
      if (window.showGameNotification) {
        window.showGameNotification('👋 Left multiplayer room.');
      }
    });

    multiplayer.onRoomChange(() => this.renderActiveRoom());

    // Auto-detect invite link from URL
    const checkUrlForRoom = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      let targetRoom = null;
      if (hash.includes('room=')) {
        targetRoom = hash.split('room=')[1].split('&')[0];
      } else if (search.includes('room=')) {
        targetRoom = new URLSearchParams(search).get('room');
      }
      if (targetRoom) {
        const clean = targetRoom.trim().toUpperCase();
        const joinInput = document.getElementById('join-room-code-input');
        if (joinInput) joinInput.value = clean;
        setTimeout(() => {
          multiplayer.joinRoom(clean);
          this.renderActiveRoom();
          if (this.onEnterGameCallback) this.onEnterGameCallback();
          if (window.showGameNotification) window.showGameNotification(`🚀 Auto-connected to Room ${clean} from link!`);
        }, 600);
      }
    };
    checkUrlForRoom();
  }

  onEnterGame(callback) {
    this.onEnterGameCallback = callback;
  }

  renderActiveRoom() {
    const banner = document.getElementById('active-room-container');
    const name = document.getElementById('active-room-name');
    if (!banner) return;

    if (multiplayer.currentRoom) {
      banner.style.display = 'block';
      name.textContent = `${multiplayer.currentRoom} (${multiplayer.roomMode.toUpperCase()})`;
    } else {
      banner.style.display = 'none';
    }

    // Update Friends List in modal
    const p = accountSystem.getProfile();
    const fCount = document.getElementById('mp-friend-count');
    const fList = document.getElementById('mp-friends-list');
    if (fCount && fList) {
      fCount.textContent = p.friends?.length || 0;
      if (p.friends && p.friends.length > 0) {
        fList.innerHTML = p.friends
          .map(
            (f) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
            <div><strong style="color: #fde047;">${f.username}</strong> (${f.friendCode})</div>
            <button class="btn-mp" style="padding: 2px 10px; font-size: 11px;" onclick="window.quickJoinFriendRoom('${f.friendCode}')">Join World</button>
          </div>
        `
          )
          .join('');
      }
    }

    window.quickJoinFriendRoom = (code) => {
      multiplayer.joinRoom(`GROVE-${code.replace('EVR-', '')}`);
      this.hide();
    };
  }

  show() {
    if (this.container) {
      this.renderActiveRoom();
      this.container.style.display = 'flex';
    }
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }
}

export const multiplayerLobby = new MultiplayerLobbyModal();

