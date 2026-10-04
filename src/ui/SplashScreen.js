import { audio } from '../core/AudioManager.js';

export class SplashScreen {
  constructor(onFinish) {
    this.onFinish = onFinish;
    this.container = null;
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'splash-screen-overlay';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.backgroundColor = '#030712';
    this.container.style.zIndex = '999999';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.justifyContent = 'center';
    this.container.style.alignItems = 'center';
    this.container.style.fontFamily = `'Cinzel', 'Trajan Pro', serif, system-ui`;
    this.container.style.color = '#f8fafc';
    this.container.style.textAlign = 'center';
    this.container.style.padding = '24px';
    this.container.style.boxSizing = 'border-box';
    this.container.style.overflowY = 'auto';

    this.container.innerHTML = `
      <style>
        @keyframes nifflerType {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-1.5deg); }
          75% { transform: translateY(-2px) rotate(1.5deg); }
        }
        @keyframes pawLeft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pawRight {
          0%, 100% { transform: translateY(-6px); }
          50% { transform: translateY(0); }
        }
        @keyframes coinGleam {
          0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
          50% { transform: scale(1.15) rotate(12deg); filter: brightness(1.4); }
        }
        @keyframes matrixPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; text-shadow: 0 0 10px #34d399; }
        }
        @keyframes fadePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .splash-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 1px solid #34d399;
          color: #ffffff;
          font-family: inherit;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2px;
          padding: 14px 44px;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
          transition: all 0.25s ease;
          text-transform: uppercase;
        }
        .splash-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 35px rgba(52, 211, 153, 0.8);
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        }
      </style>

      <div style="max-width: 780px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 20px;">
        
        <!-- Studio Banner -->
        <div style="letter-spacing: 4px; font-size: 14px; color: #10b981; text-transform: uppercase; font-weight: 600;">
          Presents
        </div>

        <h1 style="margin: 0; font-size: clamp(28px, 5vw, 44px); letter-spacing: 4px; text-transform: uppercase; background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 20px rgba(245, 158, 11, 0.4));">
          Crazy_link67 Productions
        </h1>

        <!-- Animated Harry Potter Niffler on Computer -->
        <div style="position: relative; width: 280px; height: 180px; margin: 10px 0;">
          <svg viewBox="0 0 280 180" width="100%" height="100%">
            <!-- Desk -->
            <rect x="20" y="145" width="240" height="12" rx="4" fill="#334155" stroke="#475569" stroke-width="1.5" />
            <rect x="40" y="157" width="12" height="23" fill="#1e293b" />
            <rect x="228" y="157" width="12" height="23" fill="#1e293b" />

            <!-- Laptop Base & Screen -->
            <path d="M 120 145 L 195 145 L 190 140 L 125 140 Z" fill="#64748b" />
            <rect x="145" y="85" width="65" height="55" rx="3" fill="#0f172a" stroke="#94a3b8" stroke-width="2" transform="rotate(-6 145 85)" />
            <!-- Code on screen -->
            <rect x="148" y="89" width="57" height="47" rx="2" fill="#022c22" transform="rotate(-6 148 89)" />
            <g style="animation: matrixPulse 1.8s infinite ease-in-out;">
              <text x="152" y="103" fill="#34d399" font-size="7" font-family="monospace" transform="rotate(-6 152 103)">&gt; Zelda TOTK</text>
              <text x="151" y="113" fill="#6ee7b7" font-size="6" font-family="monospace" transform="rotate(-6 151 113)">&gt; Recall = ON</text>
              <text x="150" y="123" fill="#a7f3d0" font-size="6" font-family="monospace" transform="rotate(-6 150 123)">&gt; SkyIslands++</text>
            </g>

            <!-- Niffler Character -->
            <g style="animation: nifflerType 1.2s infinite ease-in-out;">
              <!-- Fluffy Body / Fur -->
              <ellipse cx="90" cy="115" rx="36" ry="32" fill="#1f1813" stroke="#3d2c1f" stroke-width="2" />
              <!-- Pouch overflowing with gold -->
              <path d="M 75 110 Q 90 135 105 110 Z" fill="#2e2118" />
              <!-- Pouch Gold Coins -->
              <circle cx="85" cy="114" r="5" fill="#facc15" stroke="#ca8a04" stroke-width="1" />
              <circle cx="95" cy="113" r="4.5" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
              <circle cx="90" cy="120" r="4" fill="#fde047" />

              <!-- Head -->
              <circle cx="108" cy="92" r="18" fill="#1f1813" />
              <!-- Duck-like Beak / Snout -->
              <ellipse cx="124" cy="94" rx="14" ry="7" fill="#d97706" stroke="#b45309" stroke-width="1.2" />
              <ellipse cx="120" cy="92" rx="2" ry="1.5" fill="#78350f" />
              <!-- Beady Dark Eye with sparkle -->
              <circle cx="112" cy="87" r="3.5" fill="#000000" />
              <circle cx="113.2" cy="85.8" r="1.2" fill="#ffffff" />

              <!-- Left Typing Paw -->
              <g style="animation: pawLeft 0.3s infinite ease-in-out;">
                <ellipse cx="126" cy="134" rx="7" ry="4" fill="#d97706" />
                <line x1="129" y1="132" x2="133" y2="137" stroke="#78350f" stroke-width="1" />
              </g>

              <!-- Right Typing Paw -->
              <g style="animation: pawRight 0.3s infinite ease-in-out;">
                <ellipse cx="134" cy="137" rx="7" ry="4" fill="#d97706" />
                <line x1="137" y1="135" x2="141" y2="140" stroke="#78350f" stroke-width="1" />
              </g>
            </g>

            <!-- Scattered Shiny Gold Coins & Gems on the Desk -->
            <g style="animation: coinGleam 2.5s infinite ease-in-out;">
              <ellipse cx="45" cy="144" rx="8" ry="3.5" fill="#facc15" stroke="#b45309" stroke-width="0.8" />
              <ellipse cx="54" cy="143" rx="7" ry="3" fill="#fbbf24" stroke="#b45309" stroke-width="0.8" />
              <polygon points="68,143 72,138 76,143 72,148" fill="#38bdf8" />
              <ellipse cx="218" cy="144" rx="8" ry="3.5" fill="#facc15" stroke="#b45309" stroke-width="0.8" />
              <polygon points="232,143 236,137 240,143 236,149" fill="#a855f7" />
            </g>
          </svg>
        </div>

        <div style="font-size: 14px; color: #94a3b8; font-style: italic;">
          "The loyal Niffler is hard at work compiling the ancient Zonai realms..."
        </div>

        <!-- Acknowledgements Section -->
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; border-radius: 14px; padding: 18px 24px; font-size: 13.5px; line-height: 1.6; color: #cbd5e1; max-width: 680px; width: 100%;">
          <div style="font-weight: 700; color: #fde047; margin-bottom: 8px; font-size: 15px; letter-spacing: 1px;">
            🌟 SPECIAL ACKNOWLEDGEMENTS & TRIBUTE 🌟
          </div>
          <p style="margin: 0 0 10px 0;">
            🗡️ <b>To the Zelda Creators (Nintendo):</b> Heartfelt credit and homage to Shigeru Miyamoto, Eiji Aonuma, and the legendary Nintendo team for creating <i>The Legend of Zelda: Tears of the Kingdom</i> and <i>Breath of the Wild</i> — the timeless inspiration behind the Evermean tree-folk, Zonai technology, Koroks, Shrines, Ultrahand, and Recall abilities.
          </p>
          <p style="margin: 0; color: #6ee7b7;">
            ⚡ <b>To Google Antigravity:</b> Deep gratitude to the Google DeepMind Antigravity team for the revolutionary pair-programming agentic platform that powered the architecture, procedural generation, WebRTC networking, and shaders of this game.
          </p>
        </div>

        <!-- Start Button -->
        <div style="margin-top: 10px;">
          <button id="splash-continue-btn" class="splash-btn">
            Enter Evermean Realm ▶
          </button>
        </div>
        <div style="font-size: 12px; color: #64748b;">
          Click anywhere or press [ENTER / SPACE] to proceed
        </div>

      </div>
    `;

    document.body.appendChild(this.container);

    const finish = () => {
      if (!this.container) return;
      audio.playCosmicSlam?.();
      this.container.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      this.container.style.opacity = '0';
      this.container.style.transform = 'scale(1.05)';
      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        if (this.onFinish) this.onFinish();
      }, 600);
    };

    const btn = document.getElementById('splash-continue-btn');
    if (btn) btn.addEventListener('click', finish);

    const onKey = (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        window.removeEventListener('keydown', onKey);
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
  }
}

