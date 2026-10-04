import { audio } from '../core/AudioManager.js';

export class CreatorConnectModal {
  constructor() {
    this.container = null;
    this.activeTab = 'reviews';
    this.initStorage();
    this.init();
  }

  initStorage() {
    if (!localStorage.getItem('evermean_reviews')) {
      const defaultReviews = [
        {
          author: 'ZeldaExplorer_99',
          stars: 5,
          date: '2026-10-02',
          text: 'The Deku Leaf gliding and reaching the Great Sky Islands from the launch pads feels just like Tears of the Kingdom! Outstanding physics and animations.'
        },
        {
          author: 'SylvanKnight',
          stars: 5,
          date: '2026-10-03',
          text: 'The Recall ability rewinding falling boulders backwards in time is unbelievable. And fighting off Bokoblins with the head slam is so satisfying!'
        },
        {
          author: 'KorokSeedMaster',
          stars: 5,
          date: '2026-10-04',
          text: 'Yahaha! The hidden Korok puzzles and ancient Zonai shrines give so much depth. Love Crazy_link67 productions!'
        }
      ];
      localStorage.setItem('evermean_reviews', JSON.stringify(defaultReviews));
    }

    if (!localStorage.getItem('evermean_chat_messages')) {
      const defaultMessages = [
        {
          sender: 'Crazy_link67',
          isCreator: true,
          time: 'Just now',
          text: "Hey! Welcome to Life of an Evermean! I'm Crazy_link67, the creator. Feel free to leave a review, book a meeting, or message me right here!"
        }
      ];
      localStorage.setItem('evermean_chat_messages', JSON.stringify(defaultMessages));
    }

    if (!localStorage.getItem('evermean_booked_meetings')) {
      localStorage.setItem('evermean_booked_meetings', JSON.stringify([]));
    }
  }

  init() {
    if (document.getElementById('creator-connect-modal')) return;

    this.container = document.createElement('div');
    this.container.id = 'creator-connect-modal';
    this.container.style.position = 'fixed';
    this.container.style.inset = '0';
    this.container.style.backgroundColor = 'rgba(2, 6, 23, 0.88)';
    this.container.style.backdropFilter = 'blur(12px)';
    this.container.style.zIndex = '99999';
    this.container.style.display = 'none';
    this.container.style.justifyContent = 'center';
    this.container.style.alignItems = 'center';
    this.container.style.fontFamily = `'Cinzel', 'Noto Serif', serif, system-ui`;
    this.container.style.color = '#f1f5f9';
    this.container.style.padding = '20px';
    this.container.style.boxSizing = 'border-box';

    this.container.innerHTML = `
      <div style="background: linear-gradient(145deg, #091a24 0%, #030a10 100%); border: 1.5px solid #0ea5e9; border-radius: 20px; max-width: 860px; width: 100%; height: 86vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 60px rgba(14, 165, 233, 0.4);">
        
        <!-- Header -->
        <div style="padding: 18px 26px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.85);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #0ea5e9); display: flex; justify-content: center; align-items: center; font-size: 22px; box-shadow: 0 0 16px rgba(14, 165, 233, 0.6);">👑</div>
            <div>
              <h2 style="margin: 0; font-size: 20px; color: #38bdf8; letter-spacing: 1.5px; text-transform: uppercase;">Creator Studio: Crazy_link67</h2>
              <span style="font-size: 13px; color: #94a3b8;">Reviews, Direct Messages & Meeting Appointments | Powered by Google Antigravity</span>
            </div>
          </div>
          <button id="creator-close-x" style="background: transparent; border: none; font-size: 26px; color: #64748b; cursor: pointer; transition: color 0.2s;">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; background: rgba(15, 23, 42, 0.7); border-bottom: 1px solid #1e293b; padding: 0 20px;">
          <button class="creator-tab-btn" data-tab="reviews" style="padding: 14px 22px; background: transparent; border: none; border-bottom: 2px solid #0ea5e9; color: #38bdf8; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer;">⭐ Reviews & Ratings</button>
          <button class="creator-tab-btn" data-tab="chat" style="padding: 14px 22px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #94a3b8; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer;">💬 Chat with Creator</button>
          <button class="creator-tab-btn" data-tab="booking" style="padding: 14px 22px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #94a3b8; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer;">📅 Book Meeting</button>
        </div>

        <!-- Tab Body Container -->
        <div id="creator-body-area" style="flex: 1; padding: 24px; overflow-y: auto;">
          <!-- Content dynamically rendered -->
        </div>

      </div>
    `;

    document.body.appendChild(this.container);

    // Event bindings
    document.getElementById('creator-close-x').onclick = () => this.hide();

    const tabs = this.container.querySelectorAll('.creator-tab-btn');
    tabs.forEach(btn => {
      btn.onclick = () => {
        tabs.forEach(t => {
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#94a3b8';
        });
        btn.style.borderBottomColor = '#0ea5e9';
        btn.style.color = '#38bdf8';
        this.activeTab = btn.getAttribute('data-tab');
        this.renderTabContent(this.activeTab);
      };
    });

    this.renderTabContent('reviews');
  }

  show(defaultTab = 'reviews') {
    if (this.container) {
      this.container.style.display = 'flex';
      this.activeTab = defaultTab;
      const tabs = this.container.querySelectorAll('.creator-tab-btn');
      tabs.forEach(t => {
        const matches = t.getAttribute('data-tab') === defaultTab;
        t.style.borderBottomColor = matches ? '#0ea5e9' : 'transparent';
        t.style.color = matches ? '#38bdf8' : '#94a3b8';
      });
      this.renderTabContent(this.activeTab);
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  renderTabContent(tabKey) {
    const area = document.getElementById('creator-body-area');
    if (!area) return;

    if (tabKey === 'reviews') {
      const reviews = JSON.parse(localStorage.getItem('evermean_reviews') || '[]');
      const avg = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length).toFixed(1) : '5.0';

      area.innerHTML = `
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <!-- Write Review Form -->
          <div style="flex: 1; min-width: 300px; background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 14px; padding: 20px;">
            <h3 style="margin: 0 0 12px 0; color: #38bdf8; font-size: 18px;">✍️ Post Your Review</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8;">Help us improve Life of an Evermean with your rating and thoughts!</p>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 6px;">Your Name / Call-sign:</label>
              <input type="text" id="review-author" placeholder="e.g. SylvanTreant_42" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box;" />
            </div>

            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 6px;">Rating:</label>
              <div id="star-picker" style="font-size: 26px; cursor: pointer; display: flex; gap: 6px; color: #facc15;">
                <span class="star" data-val="1">★</span>
                <span class="star" data-val="2">★</span>
                <span class="star" data-val="3">★</span>
                <span class="star" data-val="4">★</span>
                <span class="star" data-val="5">★</span>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 6px;">Review Comments:</label>
              <textarea id="review-text" rows="4" placeholder="What do you think of the Sky Islands, Recall, Shrines, and Multiplayer?" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box; resize: vertical;"></textarea>
            </div>

            <button id="submit-review-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #0284c7, #0ea5e9); border: none; border-radius: 8px; color: #fff; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
              Submit Review ⭐
            </button>
          </div>

          <!-- Existing Reviews List -->
          <div style="flex: 1.2; min-width: 320px; display: flex; flex-direction: column; gap: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 12px 18px; border-radius: 10px; border: 1px solid #334155;">
              <div>
                <span style="font-size: 24px; font-weight: 700; color: #facc15;">${avg}</span>
                <span style="font-size: 18px; color: #facc15;"> ★★★★★</span>
              </div>
              <span style="font-size: 13px; color: #94a3b8;">${reviews.length} Verified Reviews</span>
            </div>

            <div id="reviews-feed" style="max-height: 440px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
              ${reviews.slice().reverse().map(r => `
                <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid #1e293b; border-radius: 10px; padding: 14px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <b style="color: #38bdf8; font-size: 14px;">${r.author}</b>
                    <span style="color: #facc15; font-size: 14px;">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 13.5px; color: #cbd5e1; line-height: 1.5;">${r.text}</p>
                  <span style="font-size: 11px; color: #64748b;">${r.date}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      let selectedStars = 5;
      const starSpans = area.querySelectorAll('.star');
      starSpans.forEach(s => {
        s.onclick = () => {
          selectedStars = parseInt(s.getAttribute('data-val'));
          starSpans.forEach(sp => {
            const val = parseInt(sp.getAttribute('data-val'));
            sp.style.color = val <= selectedStars ? '#facc15' : '#475569';
          });
        };
      });

      const submitBtn = document.getElementById('submit-review-btn');
      submitBtn.onclick = () => {
        const author = document.getElementById('review-author').value.trim() || 'ForestTraveler';
        const text = document.getElementById('review-text').value.trim();
        if (!text) {
          alert('Please enter your review feedback!');
          return;
        }

        reviews.push({
          author,
          stars: selectedStars,
          date: new Date().toISOString().split('T')[0],
          text
        });
        localStorage.setItem('evermean_reviews', JSON.stringify(reviews));
        audio.playCosmicSlam?.();
        if (window.showGameNotification) {
          window.showGameNotification('⭐ Thank you for your review! It has been posted.');
        }
        this.renderTabContent('reviews');
      };
    } else if (tabKey === 'chat') {
      const messages = JSON.parse(localStorage.getItem('evermean_chat_messages') || '[]');

      area.innerHTML = `
        <div style="display: flex; flex-direction: column; height: 100%; background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 14px; overflow: hidden;">
          <!-- Chat Messages Container -->
          <div id="creator-chat-box" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; min-height: 380px;">
            ${messages.map(m => `
              <div style="align-self: ${m.isCreator ? 'flex-start' : 'flex-end'}; max-width: 80%;">
                <div style="font-size: 12px; color: #94a3b8; margin-bottom: 4px; text-align: ${m.isCreator ? 'left' : 'right'};">
                  ${m.sender} <span style="font-size: 10px; color: #64748b;">${m.time}</span>
                </div>
                <div style="background: ${m.isCreator ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'linear-gradient(135deg, #0284c7, #0ea5e9)'}; border: 1px solid ${m.isCreator ? '#38bdf8' : '#38bdf8'}; border-radius: 12px; padding: 12px 16px; font-size: 14px; color: #fff; line-height: 1.5; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
                  ${m.text}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Chat Input -->
          <div style="padding: 16px; background: rgba(15, 23, 42, 0.95); border-top: 1px solid #1e293b; display: flex; gap: 12px;">
            <input type="text" id="creator-chat-input" placeholder="Type a message to Crazy_link67..." style="flex: 1; padding: 12px 18px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 10px; color: #fff; font-family: inherit; font-size: 14px; outline: none;" />
            <button id="creator-chat-send" style="padding: 12px 24px; background: linear-gradient(135deg, #0284c7, #0ea5e9); border: none; border-radius: 10px; color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
              Send 🚀
            </button>
          </div>
        </div>
      `;

      const chatBox = document.getElementById('creator-chat-box');
      chatBox.scrollTop = chatBox.scrollHeight;

      const sendMsg = () => {
        const input = document.getElementById('creator-chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';

        const playerMsg = {
          sender: 'You',
          isCreator: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text
        };
        messages.push(playerMsg);
        localStorage.setItem('evermean_chat_messages', JSON.stringify(messages));
        this.renderTabContent('chat');

        // Simulated intelligent Creator Response
        setTimeout(() => {
          let replyText = "Thanks for the message! I'm constantly testing new TOTK abilities and multiplayer improvements. Have you tried launching to the Great Sky Islands yet?";
          const lower = text.toLowerCase();
          if (lower.includes('sky') || lower.includes('island') || lower.includes('glide')) {
            replyText = "Awesome! The Sky Islands were built at Y=82 to 92 with Deku Leaf glider aerodynamics. So glad you got to soar through the clouds!";
          } else if (lower.includes('shrine') || lower.includes('dungeon') || lower.includes('blessing')) {
            replyText = "The Zonai Shrines have 3 sanctum trials! Don't forget to trade your Lights of Blessing with the Goddess Hylia statue for extra Bark HP or Stamina!";
          } else if (lower.includes('multiplayer') || lower.includes('online') || lower.includes('room')) {
            replyText = "The multiplayer now uses multi-STUN servers and mesh relaying! You can host a world or join any room code with friends.";
          } else if (lower.includes('recall') || lower.includes('z')) {
            replyText = "Press [Z] near movable objects to activate Recall! It tracks motion histories and rewinds objects through time just like Zelda: Tears of the Kingdom!";
          } else if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
            replyText = "Hey there! Thanks so much for playing Life of an Evermean! What species did you pick for your tree?";
          }

          const creatorReply = {
            sender: 'Crazy_link67',
            isCreator: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: replyText
          };
          messages.push(creatorReply);
          localStorage.setItem('evermean_chat_messages', JSON.stringify(messages));
          audio.playBlupeeChime?.();
          this.renderTabContent('chat');
        }, 1200);
      };

      document.getElementById('creator-chat-send').onclick = sendMsg;
      document.getElementById('creator-chat-input').onkeydown = (e) => {
        if (e.key === 'Enter') sendMsg();
      };
    } else if (tabKey === 'booking') {
      const bookings = JSON.parse(localStorage.getItem('evermean_booked_meetings') || '[]');

      area.innerHTML = `
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          
          <!-- Booking Form -->
          <div style="flex: 1; min-width: 320px; background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 14px; padding: 22px;">
            <h3 style="margin: 0 0 10px 0; color: #38bdf8; font-size: 18px;">📅 Schedule a Chat Meeting</h3>
            <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8;">Reserve a 1-on-1 virtual chat session with Crazy_link67 to discuss game development, features, and co-op!</p>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px;">Your Name / Handle:</label>
                <input type="text" id="book-name" placeholder="e.g. ZeldaFan_Hero" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box;" />
              </div>

              <div>
                <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px;">Contact (Discord / Email):</label>
                <input type="text" id="book-contact" placeholder="e.g. link#1234 or player@realm.com" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box;" />
              </div>

              <div style="display: flex; gap: 12px;">
                <div style="flex: 1;">
                  <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px;">Select Date:</label>
                  <input type="date" id="book-date" value="${new Date(Date.now() + 86400000).toISOString().split('T')[0]}" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box;" />
                </div>
                <div style="flex: 1;">
                  <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px;">Time Slot:</label>
                  <select id="book-time" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box;">
                    <option value="2:00 PM EST">2:00 PM EST</option>
                    <option value="3:30 PM EST">3:30 PM EST</option>
                    <option value="5:00 PM EST">5:00 PM EST</option>
                    <option value="7:30 PM EST">7:30 PM EST</option>
                  </select>
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 13px; color: #cbd5e1; margin-bottom: 5px;">Discussion Agenda:</label>
                <select id="book-agenda" style="width: 100%; padding: 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 8px; color: #fff; font-family: inherit; font-size: 14px; box-sizing: border-box;">
                  <option value="Game Feedback & Feature Suggestions">Game Feedback & Feature Suggestions</option>
                  <option value="Zelda TOTK Mechanics Discussion">Zelda TOTK Mechanics Discussion</option>
                  <option value="Multiplayer Co-op Playtest">Multiplayer Co-op Playtest</option>
                  <option value="General Community Chat">General Community Chat</option>
                </select>
              </div>

              <button id="book-submit-btn" style="margin-top: 6px; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); border: none; border-radius: 8px; color: #fff; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                Confirm & Book Meeting 🎫
              </button>
            </div>
          </div>

          <!-- Confirmed Meeting Passes -->
          <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 14px;">
            <h4 style="margin: 0; color: #fde047; font-size: 16px;">🎟️ Your Confirmed Meeting Passes</h4>
            
            ${bookings.length === 0 ? `
              <div style="background: rgba(15, 23, 42, 0.4); border: 1px dashed #475569; border-radius: 10px; padding: 24px; text-align: center; color: #94a3b8; font-size: 13.5px;">
                No meetings scheduled yet. Fill out the reservation form to book your slot with Crazy_link67!
              </div>
            ` : bookings.map(b => `
              <div style="background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(6, 78, 59, 0.3) 100%); border: 1px solid #10b981; border-radius: 12px; padding: 16px; position: relative; box-shadow: 0 4px 18px rgba(16, 185, 129, 0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 11px; background: #065f46; color: #6ee7b7; padding: 2px 8px; border-radius: 4px; font-weight: 700;">PASS: ${b.code}</span>
                  <span style="font-size: 12px; color: #34d399;">● Confirmed</span>
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">${b.agenda}</div>
                <div style="font-size: 13px; color: #a7f3d0; margin-bottom: 2px;">📅 ${b.date} at ${b.time}</div>
                <div style="font-size: 12px; color: #94a3b8;">Attendee: ${b.name} (${b.contact})</div>
              </div>
            `).join('')}
          </div>

        </div>
      `;

      const submitBtn = document.getElementById('book-submit-btn');
      submitBtn.onclick = () => {
        const name = document.getElementById('book-name').value.trim();
        const contact = document.getElementById('book-contact').value.trim();
        const date = document.getElementById('book-date').value;
        const time = document.getElementById('book-time').value;
        const agenda = document.getElementById('book-agenda').value;

        if (!name || !contact) {
          alert('Please enter your name and contact handle!');
          return;
        }

        const code = `LINK-${Math.floor(1000 + Math.random() * 9000)}`;
        bookings.unshift({
          code,
          name,
          contact,
          date,
          time,
          agenda
        });
        localStorage.setItem('evermean_booked_meetings', JSON.stringify(bookings));
        audio.playCosmicSlam?.();
        if (window.showGameNotification) {
          window.showGameNotification(`🎫 Meeting Booked with Crazy_link67! Pass Code: ${code}`);
        }
        this.renderTabContent('booking');
      };
    }
  }
}

