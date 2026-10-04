export class WikiModal {
  constructor() {
    this.container = null;
    this.activeTab = 'lore';
    this.init();
  }

  init() {
    if (document.getElementById('wiki-modal-overlay')) return;

    this.container = document.createElement('div');
    this.container.id = 'wiki-modal-overlay';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.backgroundColor = 'rgba(2, 6, 23, 0.88)';
    this.container.style.backdropFilter = 'blur(12px)';
    this.container.style.zIndex = '99999';
    this.container.style.display = 'none';
    this.container.style.justifyContent = 'center';
    this.container.style.alignItems = 'center';
    this.container.style.fontFamily = `'Cinzel', 'Noto Serif', serif, system-ui`;
    this.container.style.color = '#e2e8f0';
    this.container.style.padding = '20px';
    this.container.style.boxSizing = 'border-box';

    this.container.innerHTML = `
      <div style="background: linear-gradient(145deg, #0f172a 0%, #020617 100%); border: 1.5px solid #38bdf8; border-radius: 20px; max-width: 900px; width: 100%; height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 60px rgba(56, 189, 248, 0.35);">
        
        <!-- Header -->
        <div style="padding: 20px 28px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.8);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="font-size: 32px; filter: drop-shadow(0 0 10px #38bdf8);">📖</span>
            <div>
              <h2 style="margin: 0; font-size: 22px; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase;">The Evermean Codex & Wikipedia</h2>
              <span style="font-size: 13px; color: #94a3b8;">Comprehensive Guide to the Sylvan Realm, Zonai Lore, & Mechanics</span>
            </div>
          </div>
          <button id="wiki-close-x" style="background: transparent; border: none; font-size: 26px; color: #64748b; cursor: pointer; transition: color 0.2s;">✕</button>
        </div>

        <!-- Search Bar -->
        <div style="padding: 12px 28px; background: rgba(30, 41, 59, 0.5); border-bottom: 1px solid #1e293b;">
          <input type="text" id="wiki-search-input" placeholder="🔍 Search articles (e.g., Recall, Shrines, Glider, Sky Islands, Chuchu)..." style="width: 100%; padding: 10px 16px; background: rgba(15, 23, 42, 0.8); border: 1px solid #475569; border-radius: 8px; color: #f8fafc; font-family: inherit; font-size: 14px; outline: none; box-sizing: border-box;" />
        </div>

        <!-- Main Body: Tabs Sidebar + Content -->
        <div style="display: flex; flex: 1; overflow: hidden;">
          
          <!-- Sidebar Nav Tabs -->
          <div style="width: 240px; background: rgba(15, 23, 42, 0.6); border-right: 1px solid #1e293b; display: flex; flex-direction: column; gap: 4px; padding: 14px; overflow-y: auto;">
            <button class="wiki-tab-btn" data-tab="lore" style="text-align: left; padding: 10px 14px; background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; color: #38bdf8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">🌿 Lore & Story</button>
            <button class="wiki-tab-btn" data-tab="abilities" style="text-align: left; padding: 10px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">⚡ Abilities & Recall</button>
            <button class="wiki-tab-btn" data-tab="shrines" style="text-align: left; padding: 10px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">🌀 Shrines & Dungeons</button>
            <button class="wiki-tab-btn" data-tab="skyislands" style="text-align: left; padding: 10px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">☁️ Sky Islands & Glide</button>
            <button class="wiki-tab-btn" data-tab="bestiary" style="text-align: left; padding: 10px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">🦊 Wildlife & Bestiary</button>
            <button class="wiki-tab-btn" data-tab="building" style="text-align: left; padding: 10px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">🏰 Civilization & Towns</button>
            <button class="wiki-tab-btn" data-tab="credits" style="text-align: left; padding: 10px 14px; background: transparent; border: 1px solid transparent; border-radius: 8px; color: #94a3b8; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;">🌟 Acknowledgements</button>
          </div>

          <!-- Content Viewer -->
          <div id="wiki-content-area" style="flex: 1; padding: 24px 32px; overflow-y: auto; line-height: 1.7; font-size: 15px; color: #cbd5e1;">
            <!-- Rendered Tab Content -->
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(this.container);

    // Wire events
    document.getElementById('wiki-close-x').onclick = () => this.hide();
    
    const tabBtns = this.container.querySelectorAll('.wiki-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => {
          b.style.background = 'transparent';
          b.style.borderColor = 'transparent';
          b.style.color = '#94a3b8';
        });
        btn.style.background = '#1e293b';
        btn.style.borderColor = '#38bdf8';
        btn.style.color = '#38bdf8';
        this.activeTab = btn.getAttribute('data-tab');
        this.renderTabContent(this.activeTab);
      };
    });

    const searchInput = document.getElementById('wiki-search-input');
    searchInput.oninput = (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        this.renderTabContent(this.activeTab);
        return;
      }
      this.renderSearchResults(q);
    };

    this.renderTabContent('lore');
  }

  show() {
    if (this.container) {
      this.container.style.display = 'flex';
      this.renderTabContent(this.activeTab);
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  renderTabContent(tabKey) {
    const area = document.getElementById('wiki-content-area');
    if (!area) return;

    if (tabKey === 'lore') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">The Legend of the Evermean</h3>
        <p>In the vast woodlands of Hyrule, trees are not merely static flora. Deep within the ancient soil lies a sentient pulse—the <b>Evermean</b>. Awakened during the great Upheaval when ancient Zonai relics descended from the celestial firmament, Evermeans are guardian treants endowed with woodland bio-energy, deep-burrowing root systems, and sap-infused consciousness.</p>
        <div style="background: rgba(30, 41, 59, 0.4); border-left: 4px solid #10b981; padding: 14px 18px; margin: 18px 0; border-radius: 0 8px 8px 0;">
          <b>The Great Upheaval:</b> The sky split asunder, raising the Great Sky Islands high above Hyrule and unveiling ancient Zonai Shrines filled with divine Lights of Blessing.
        </div>
        <p>As an Evermean, your journey begins as a humble sapling. By absorbing sunlight through photosynthesis, tapping groundwater through root burrows, and overcoming woodcutters and corrupted monsters, you ascend across 5 evolutionary stages, culminating in the transcendent <b>Cosmic Stardust Arbor</b>.</p>
      `;
    } else if (tabKey === 'abilities') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">Evermean & Zonai Abilities</h3>
        
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 700; color: #facc15; font-size: 16px; margin-bottom: 4px;">⏳ Recall — Time Reversal (Key: [Z])</div>
            <div>The signature <i>Tears of the Kingdom</i> chronomancy power. Stand near any movable boulder or dropped Zonai prop and press <b>[Z]</b> to reverse its motion backwards along its historical trajectory. Essential for resetting puzzle mechanisms or riding falling sky debris back to the heavens!</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 700; color: #22c55e; font-size: 16px; margin-bottom: 4px;">🧲 Ultrahand & Fusion (Key: [U] / [F])</div>
            <div>Harness magnetic Zonai tractor beams to levitate, reposition, and fuse environmental debris, logs, and stone boulders into bridges, barricades, or catastrophic tree-branch weapons.</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 16px; margin-bottom: 4px;">🍃 Deku Leaf Paraglider (Hold [SPACE] Mid-Air)</div>
            <div>When launched from high peaks or Zonai boost pads, hold <b>[Space]</b> while descending to deploy your canopy glider wings. Steer freely through the clouds while slowly consuming stamina.</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 700; color: #fb923c; font-size: 16px; margin-bottom: 4px;">💥 Head-Slam Attack (Key: [SPACE] / Left Click)</div>
            <div>The iconic Evermean tree monster strike. Tilt violently forward and crash your crown onto the earth, dealing crushing area-of-effect damage to Bokoblins and cutting axes.</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 10px; padding: 16px;">
            <div style="font-weight: 700; color: #a855f7; font-size: 16px; margin-bottom: 4px;">🌱 Root-Burrow (Key: [R]) & Disguise (Key: [C])</div>
            <div>Burrow deep roots into the soil to absorb moisture and biomass, or freeze into an innocent stationary tree to ambush unsuspecting lumberjacks.</div>
          </div>
        </div>
      `;
    } else if (tabKey === 'shrines') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">Ancient Zonai Shrines & Goddess Blessings</h3>
        <p>Three ancient Zonai Shrines crowned with green spiral energy vortices are scattered across the realm:</p>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          <div style="border-left: 3px solid #10b981; padding-left: 14px;">
            <b style="color: #6ee7b7;">1. Shrine of the Living Roots (Grove Plateau):</b>
            <div>Trial of Woodland Vitality. Channel your photosynthetic energy into the central Zonai glyph altar to awaken the fast travel matrix and claim a Light of Blessing.</div>
          </div>
          <div style="border-left: 3px solid #06b6d4; padding-left: 14px;">
            <b style="color: #67e8f9;">2. Shrine of Magnetic Flow (River Canyon):</b>
            <div>Trial of Ultrahand Resonance. Manipulate floating magnetic monoliths across the water rift to bridge the sacred sanctum.</div>
          </div>
          <div style="border-left: 3px solid #f59e0b; padding-left: 14px;">
            <b style="color: #fde047;">3. Shrine of Temporal Reversal (North Ruins):</b>
            <div>Trial of Recall. Use the time-reversal ability to reverse rotating stone gears and navigate the void platform.</div>
          </div>
        </div>

        <div style="background: rgba(6, 78, 59, 0.4); border: 1px solid #10b981; border-radius: 10px; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; color: #fde047;">🕊️ Goddess Hylia Statue (Central Glade)</h4>
          <p style="margin: 0;">Visit the winged Goddess Statue in the sacred glade. Offer your conquered <b>Lights of Blessing</b> to receive divine upgrades: exchange for <b>Heart Vessels (+30 Max Bark HP)</b> or <b>Stamina Vessels (+25 Max Stamina)</b>.</p>
        </div>
      `;
    } else if (tabKey === 'skyislands') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">Great Sky Islands & Launch Dynamics</h3>
        <p>Suspended high above the clouds at <b>Y = 82 to Y = 92</b> meters float the Great Sky Islands—ancient platforms overgrown with golden flora, sacred Sundelions, and Zonai ruins.</p>
        
        <h4 style="color: #34d399; margin: 16px 0 8px 0;">🚀 How to Reach the Great Sky Islands:</h4>
        <ol style="padding-left: 20px; line-height: 1.8;">
          <li>Locate a glowing green <b>Zonai Launch Pad</b> on the terrain.</li>
          <li>Step directly onto the pad center to trigger a catapult boost propelling you upward at <b>62 m/s</b>.</li>
          <li>At the apex of your launch, press and hold <b>[Space]</b> to deploy your Deku Leaf Glider.</li>
          <li>Steer towards the floating sky plateaus and touch down safely. Sky island collision geometry fully supports walking, exploring, and harvesting high-altitude relics!</li>
        </ol>

        <div style="background: rgba(30, 41, 59, 0.5); padding: 12px 16px; border-radius: 8px; margin-top: 14px; border: 1px solid #475569;">
          💡 <b>Tip:</b> Watch out for high-flying <i>Aerocudas</i>! You can fire Acorn Artillery [F] while in mid-air to blast them out of the sky.
        </div>
      `;
    } else if (tabKey === 'bestiary') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">Hyrule Bestiary & Wildlife</h3>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <b style="color: #f87171;">👺 Bokoblin Woodcutters:</b>
            <div style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Hostile axes-wielding bandits attempting to harvest your precious timber. Defeat them for wood and biomass.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <b style="color: #38bdf8;">💧 Elemental Chuchus:</b>
            <div style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Gelatinous blobs of Fire, Ice, and Electric elements. Defeat them to collect Chuchu Jelly for crafting.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <b style="color: #a78bfa;">🐇 Luminescent Blupees:</b>
            <div style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Glowing blue rabbit spirits. Striking them drops sparkling Indian Rupee gems!</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <b style="color: #4ade80;">🐸 Cave Bubbulfrogs:</b>
            <div style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Mystic amphibious spirits clinging to rocks. Drop rare Bubbul Gems.</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <b style="color: #fde047;">🐔 Sacred Cuccos:</b>
            <div style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Docile farm chickens. ⚠️ <b>WARNING:</b> Attacking a Cucco repeatedly will summon a relentless flock of avenging Cuccos!</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px;">
            <b style="color: #fb923c;">🦊 Woodland Foxes:</b>
            <div style="font-size: 13.5px; color: #94a3b8; margin-top: 4px;">Peaceful woodland companions. Interacting gently with them restores your moisture and bark vitality.</div>
          </div>
        </div>
      `;
    } else if (tabKey === 'building') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">Civilization & Town Construction</h3>
        <p>Press <b>[B]</b> at any time to open the Master Architect Build Menu. Construct sprawling treehouse villages, defense bastions, and automated infrastructure:</p>

        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><b>Woodland Treehouse:</b> Shelters friendly forest critters and generates +1 Biomass/sec.</li>
          <li><b>Sylvan Watchtower:</b> Provides sniper platforms and expands your realm's vision.</li>
          <li><b>Fortified Wall:</b> Stops rampaging goblin hordes from breaching your forest glade.</li>
          <li><b>Catapult Turret:</b> Automatically launches explosive acorn shells at approaching enemies.</li>
          <li><b>Deep Water Well:</b> Taps groundwater reserves to continuously hydrate nearby Evermeans.</li>
          <li><b>Solar Light Shrine:</b> Channels golden solar energy to sustain photosynthesis during nighttime.</li>
        </ul>
      `;
    } else if (tabKey === 'credits') {
      area.innerHTML = `
        <h3 style="color: #38bdf8; font-size: 22px; margin-top: 0;">Special Acknowledgements & Credits</h3>
        
        <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 16px;">
          <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid #eab308; border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #fde047; font-size: 18px;">🗡️ The Legend of Zelda Creators (Nintendo)</h4>
            <p style="margin: 0; line-height: 1.7; color: #e2e8f0;">
              Our deepest creative admiration and tribute to <b>Shigeru Miyamoto</b>, <b>Eiji Aonuma</b>, <b>Hidemaro Fujibayashi</b>, and the magnificent Nintendo development team. <i>The Legend of Zelda: Tears of the Kingdom</i> and <i>Breath of the Wild</i> redefined open-world freedom, physics simulation, and emergent creativity. The Evermean monsters, Zonai sky islands, Ultrahand fusion, Recall time-reversal, and Korok puzzles in this game are crafted with utmost love and reverence for their masterpiece.
            </p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid #10b981; border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #34d399; font-size: 18px;">⚡ Google Antigravity Team</h4>
            <p style="margin: 0; line-height: 1.7; color: #e2e8f0;">
              Immense gratitude to the <b>Google DeepMind Antigravity</b> engineering team. The advanced agentic AI pair-programming architecture, context-driven tools, and multi-file reasoning made the rapid procedural engineering, WebRTC P2P multiplayer mesh, and 3D WebGL physics possible in real time.
            </p>
          </div>

          <div style="background: rgba(15, 23, 42, 0.7); border: 1.5px solid #38bdf8; border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 18px;">🎬 Crazy_link67 Productions</h4>
            <p style="margin: 0; line-height: 1.7; color: #e2e8f0;">
              Directed & Produced by <b>Crazy_link67</b> with an animated Harry Potter Niffler tirelessly crafting lines of code on a laptop! Thank you to all players, builders, and forest explorers for joining our universe.
            </p>
          </div>
        </div>
      `;
    }
  }

  renderSearchResults(query) {
    const area = document.getElementById('wiki-content-area');
    if (!area) return;

    const topics = [
      { key: 'abilities', title: 'Recall (Time Reversal)', desc: 'Press [Z] to rewind objects through time along their motion history.' },
      { key: 'abilities', title: 'Ultrahand & Fusion', desc: 'Press [U] to magnetically grab objects, [F] to fuse them to your branches.' },
      { key: 'skyislands', title: 'Great Sky Islands & Glider', desc: 'Step on Zonai launch pads to rocket to Y=90, then hold Space to deploy leaf glider.' },
      { key: 'shrines', title: 'Ancient Zonai Shrines', desc: 'Complete 3 trial sanctums across the realm to earn Lights of Blessing.' },
      { key: 'shrines', title: 'Goddess Hylia Statue', desc: 'Exchange Lights of Blessing for Heart Vessels (+Max HP) and Stamina Vessels.' },
      { key: 'bestiary', title: 'Bokoblins & Goblins', desc: 'Lumberjack enemies carrying woodcutter axes that drop timber upon defeat.' },
      { key: 'bestiary', title: 'Chuchus & Blupees', desc: 'Elemental fire/ice/lightning jelly creatures and rupee-dropping glowing rabbits.' },
      { key: 'bestiary', title: 'Cuccos & Cucco Revenge', desc: 'Farm chickens that summon a deadly flock if provoked!' },
      { key: 'building', title: 'Civilization Town Building', desc: 'Press [B] to construct treehouses, towers, walls, catapults, and solar shrines.' },
      { key: 'credits', title: 'Acknowledgements & Credits', desc: 'Tribute to Nintendo Zelda creators and Google Antigravity.' }
    ];

    const matches = topics.filter(t => t.title.toLowerCase().includes(query) || t.desc.toLowerCase().includes(query));

    if (matches.length === 0) {
      area.innerHTML = `<p style="color: #94a3b8; font-style: italic;">No articles matching "${query}". Try searching for 'Recall', 'Glider', 'Shrines', or 'Chuchu'.</p>`;
      return;
    }

    let html = `<h3 style="color: #38bdf8;">Search Results for "${query}"</h3><div style="display: flex; flex-direction: column; gap: 12px;">`;
    matches.forEach(m => {
      html += `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 14px; cursor: pointer;" onclick="document.querySelector('.wiki-tab-btn[data-tab=${m.key}]').click()">
          <div style="font-weight: 700; color: #fde047; font-size: 15px;">${m.title}</div>
          <div style="color: #cbd5e1; font-size: 13.5px; margin-top: 4px;">${m.desc}</div>
        </div>
      `;
    });
    html += `</div>`;
    area.innerHTML = html;
  }
}

