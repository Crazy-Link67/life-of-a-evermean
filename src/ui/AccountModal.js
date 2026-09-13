import { accountSystem } from '../core/AccountSystem.js';

// Account Profile, Stats, and Friend Requests Modal UI
export class AccountModal {
  constructor() {
    this.container = null;
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'modal-account-container';
    this.container.innerHTML = `
      <style>
        #modal-account-container {
          position: absolute;
          inset: 0;
          background: rgba(8, 6, 4, 0.85);
          backdrop-filter: blur(8px);
          z-index: 210;
          display: none;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          color: #f5f5f4;
        }

        .acc-card {
          background: #1a1410;
          border: 2px solid #8b5a2b;
          border-radius: 14px;
          padding: 24px;
          width: 560px;
          max-width: 92%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 16px 40px rgba(0,0,0,0.8);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .acc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 12px;
        }
        .acc-title {
          font-size: 20px;
          font-weight: 800;
          color: #fef08a;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .acc-section {
          background: #241b14;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 14px;
        }
        .acc-sec-title {
          font-size: 13px;
          font-weight: 700;
          color: #f59e0b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .profile-row {
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .username-input {
          background: #140e0a;
          border: 1px solid #8b5a2b;
          color: #fef08a;
          font-size: 16px;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 6px;
          flex: 1;
        }
        .friend-code-badge {
          background: #0f172a;
          border: 1.5px solid #38bdf8;
          color: #7dd3fc;
          font-family: monospace;
          font-size: 14px;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .friend-code-badge:hover {
          background: #1e293b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .stat-box {
          background: #16100c;
          padding: 8px 10px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .stat-num {
          font-size: 16px;
          font-weight: 800;
          color: #fde047;
        }
        .stat-name {
          font-size: 10px;
          color: #a8a29e;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .friend-form {
          display: flex;
          gap: 8px;
          margin-top: 6px;
        }
        .friend-input {
          background: #140e0a;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          flex: 1;
          font-family: monospace;
          text-transform: uppercase;
        }
        .btn-acc {
          background: #ca8a04;
          border: none;
          color: #000;
          font-weight: 800;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-acc:hover {
          background: #eab308;
        }

        .friend-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .btn-sm-del {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          color: #fca5a5;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }
        .btn-sm-accept {
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid #22c55e;
          color: #86efac;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
        }
      </style>

      <div class="acc-card">
        <div class="acc-header">
          <div class="acc-title">🌿 Player Account & Friends</div>
          <button id="btn-close-acc" class="btn-acc" style="background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 4px 10px;">✕</button>
        </div>

        <!-- 1. Profile & Friend Code -->
        <div class="acc-section">
          <div class="acc-sec-title">Identity & Friend Code</div>
          <div class="profile-row">
            <input type="text" id="acc-username-input" class="username-input" maxlength="18" placeholder="Enter Username...">
            <div id="acc-friend-code" class="friend-code-badge" title="Click to copy your Friend Code">
              <span>📋</span> <span id="acc-code-text">EVR-0000</span>
            </div>
          </div>
        </div>

        <!-- 2. Gameplay Stats -->
        <div class="acc-section">
          <div class="acc-sec-title">Grove Statistics</div>
          <div class="stats-grid">
            <div class="stat-box">
              <div id="stat-wins" class="stat-num">0</div>
              <div class="stat-name">Arena Wins</div>
            </div>
            <div class="stat-box">
              <div id="stat-days" class="stat-num">1</div>
              <div class="stat-name">Survival Days</div>
            </div>
            <div class="stat-box">
              <div id="stat-goblins" class="stat-num">0</div>
              <div class="stat-name">Goblins Axed</div>
            </div>
            <div class="stat-box">
              <div id="stat-koroks" class="stat-num">0</div>
              <div class="stat-name">Korok Seeds</div>
            </div>
            <div class="stat-box">
              <div id="stat-built" class="stat-num">0</div>
              <div class="stat-name">Structures</div>
            </div>
            <div class="stat-box">
              <div id="stat-campaign" class="stat-num">Ch. 1</div>
              <div class="stat-name">Campaign</div>
            </div>
          </div>
        </div>

        <!-- 3. Send Friend Request -->
        <div class="acc-section">
          <div class="acc-sec-title">Send Friend Request</div>
          <div class="friend-form">
            <input type="text" id="acc-target-code" class="friend-input" placeholder="Enter Friend Code (e.g. EVR-7821)..." maxlength="10">
            <button id="btn-send-req" class="btn-acc">💌 Send</button>
          </div>
        </div>

        <!-- 4. Incoming Friend Requests -->
        <div class="acc-section" id="acc-req-section" style="display: none;">
          <div class="acc-sec-title" style="color: #6ee7b7;">💌 Incoming Friend Requests</div>
          <div id="acc-requests-list"></div>
        </div>

        <!-- 5. Friends List -->
        <div class="acc-section">
          <div class="acc-sec-title">Friends List (<span id="acc-friend-count">0</span>)</div>
          <div id="acc-friends-list" style="max-height: 120px; overflow-y: auto;">
            <div style="font-size: 12px; color: #a8a29e; text-align: center; padding: 12px;">No friends added yet. Share your Friend Code with other players!</div>
          </div>
        </div>

        <!-- 6. Export / Backup -->
        <div style="display: flex; gap: 10px;">
          <button id="btn-export-acc" class="btn-acc" style="flex: 1; background: #251c16; border: 1px solid rgba(255,255,255,0.2); color: #fef08a;">💾 Export Account Backup</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-close-acc').addEventListener('click', () => this.hide());

    // Copy Friend Code
    document.getElementById('acc-friend-code').addEventListener('click', () => {
      const code = accountSystem.getProfile().friendCode;
      navigator.clipboard?.writeText(code);
      if (window.showGameNotification) {
        window.showGameNotification(`📋 Copied Friend Code: ${code} to clipboard!`);
      }
    });

    // Username Input Change
    document.getElementById('acc-username-input').addEventListener('change', (e) => {
      accountSystem.setUsername(e.target.value);
      if (window.showGameNotification) {
        window.showGameNotification(`✅ Username changed to ${accountSystem.getProfile().username}`);
      }
    });

    // Send Friend Request
    document.getElementById('btn-send-req').addEventListener('click', () => {
      const input = document.getElementById('acc-target-code');
      const targetCode = input.value;
      if (!targetCode) return;

      const res = accountSystem.sendFriendRequest(targetCode);
      if (res.success) {
        input.value = '';
        if (window.showGameNotification) window.showGameNotification(`💌 ${res.message}`);
      } else {
        alert(res.reason);
      }
    });

    // Export Account Backup
    document.getElementById('btn-export-acc').addEventListener('click', () => {
      accountSystem.exportAccount();
    });

    accountSystem.onUpdate(() => this.renderData());
  }

  renderData() {
    const p = accountSystem.getProfile();
    document.getElementById('acc-username-input').value = p.username;
    document.getElementById('acc-code-text').textContent = p.friendCode;

    // Stats
    document.getElementById('stat-wins').textContent = p.stats?.arenaWins || 0;
    document.getElementById('stat-days').textContent = p.stats?.survivalDays || 1;
    document.getElementById('stat-goblins').textContent = p.stats?.goblinsDefeated || 0;
    document.getElementById('stat-koroks').textContent = p.stats?.korokSeeds || 0;
    document.getElementById('stat-built').textContent = p.stats?.structuresBuilt || 0;
    document.getElementById('stat-campaign').textContent = `Ch. ${p.campaign?.unlockedChapter || 1}`;

    // Incoming Requests
    const reqSection = document.getElementById('acc-req-section');
    const reqList = document.getElementById('acc-requests-list');
    if (p.friendRequests && p.friendRequests.length > 0) {
      reqSection.style.display = 'block';
      reqList.innerHTML = p.friendRequests
        .map(
          (r) => `
        <div class="friend-item">
          <div>
            <div style="font-weight: 700; color: #fef08a;">${r.fromName}</div>
            <div style="font-size: 11px; color: #7dd3fc; font-family: monospace;">${r.fromCode}</div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-sm-accept" onclick="window.acceptEvermeanFriend('${r.fromCode}')">Accept</button>
            <button class="btn-sm-del" onclick="window.rejectEvermeanFriend('${r.fromCode}')">Decline</button>
          </div>
        </div>
      `
        )
        .join('');
    } else {
      reqSection.style.display = 'none';
      reqList.innerHTML = '';
    }

    // Friends List
    const fCount = document.getElementById('acc-friend-count');
    const fList = document.getElementById('acc-friends-list');
    fCount.textContent = p.friends?.length || 0;

    if (p.friends && p.friends.length > 0) {
      fList.innerHTML = p.friends
        .map(
          (f) => `
        <div class="friend-item">
          <div>
            <div style="font-weight: 700; color: #fff;">${f.username}</div>
            <div style="font-size: 11px; color: #7dd3fc; font-family: monospace;">${f.friendCode}</div>
          </div>
          <button class="btn-sm-del" onclick="window.removeEvermeanFriend('${f.friendCode}')">Remove</button>
        </div>
      `
        )
        .join('');
    } else {
      fList.innerHTML = '<div style="font-size: 12px; color: #a8a29e; text-align: center; padding: 12px;">No friends added yet. Share your Friend Code!</div>';
    }

    window.acceptEvermeanFriend = (code) => accountSystem.acceptFriendRequest(code);
    window.rejectEvermeanFriend = (code) => accountSystem.rejectFriendRequest(code);
    window.removeEvermeanFriend = (code) => accountSystem.removeFriend(code);
  }

  show() {
    if (this.container) {
      this.renderData();
      this.container.style.display = 'flex';
    }
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }
}

export const accountModal = new AccountModal();

