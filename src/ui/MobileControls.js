import { input } from '../core/Input.js';

// Virtual Touch On-Screen Controls for Mobile Mode
// Includes 360° Virtual Joystick, Touch Camera Look Zone, and Circular Action Buttons
export class MobileControls {
  constructor() {
    this.container = null;
    this.joystickBase = null;
    this.joystickKnob = null;
    this.joystickTouchId = null;
    this.joystickOrigin = { x: 0, y: 0 };
    this.lookTouchId = null;
    this.lastLookPos = { x: 0, y: 0 };
    this.maxRadius = 50;
    this.isEnabled = false;
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'mobile-controls-container';
    this.container.innerHTML = `
      <style>
        #mobile-controls-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 120;
          display: none;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }

        /* Virtual Joystick */
        .joystick-zone {
          position: absolute;
          bottom: 30px;
          left: 30px;
          width: 130px;
          height: 130px;
          pointer-events: auto;
        }
        .joystick-base {
          width: 100%;
          height: 100%;
          background: rgba(18, 14, 10, 0.65);
          border: 2px solid rgba(245, 158, 11, 0.6);
          border-radius: 50%;
          position: relative;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        .joystick-knob {
          width: 54px;
          height: 54px;
          background: radial-gradient(circle, #f59e0b 0%, #b45309 100%);
          border: 2px solid #fef08a;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
          transition: transform 0.05s ease-out;
        }

        /* Touch Camera Swipe Area */
        .camera-swipe-zone {
          position: absolute;
          top: 0;
          right: 0;
          width: 55%;
          height: 65%;
          pointer-events: auto;
          touch-action: none;
        }

        /* Action Buttons Cluster (Bottom Right) */
        .action-cluster {
          position: absolute;
          bottom: 25px;
          right: 25px;
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .action-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-touch {
          background: rgba(20, 16, 12, 0.78);
          border: 2px solid rgba(245, 158, 11, 0.6);
          color: #fef08a;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: system-ui, sans-serif;
          font-weight: 800;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          touch-action: manipulation;
          transition: transform 0.08s ease, background 0.08s ease;
        }
        .btn-touch:active {
          transform: scale(0.88);
          background: rgba(245, 158, 11, 0.45);
          border-color: #fef08a;
        }
        .btn-touch-icon {
          font-size: 20px;
          line-height: 1;
        }
        .btn-touch-label {
          font-size: 9px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 2px;
          color: #e5e5e5;
        }

        /* Large Head-Slam Primary Button */
        .btn-primary-slam {
          width: 76px;
          height: 76px;
          background: radial-gradient(circle, #b45309 0%, #78350f 100%);
          border: 2.5px solid #f59e0b;
        }
        .btn-primary-slam .btn-touch-icon {
          font-size: 26px;
        }
        .btn-primary-slam .btn-touch-label {
          font-size: 10px;
          font-weight: 900;
          color: #fef08a;
        }

        /* Medium Secondary Action Buttons */
        .btn-action-med {
          width: 58px;
          height: 58px;
        }

        /* Small Utility Buttons (Top Right) */
        .top-utility-cluster {
          position: absolute;
          top: 18px;
          right: 18px;
          pointer-events: auto;
          display: flex;
          gap: 10px;
        }
        .btn-utility {
          width: 44px;
          height: 44px;
          background: rgba(18, 14, 10, 0.8);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          color: #fff;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }
        .btn-utility:active {
          transform: scale(0.9);
          border-color: #f59e0b;
        }
      </style>

      <!-- 1. Left Thumbstick Zone -->
      <div class="joystick-zone" id="touch-joystick-zone">
        <div class="joystick-base" id="touch-joystick-base">
          <div class="joystick-knob" id="touch-joystick-knob"></div>
        </div>
      </div>

      <!-- 2. Right Camera Look Swipe Zone -->
      <div class="camera-swipe-zone" id="touch-camera-zone"></div>

      <!-- 3. Top Utility Buttons (View Toggle & Mode Switch) -->
      <div class="top-utility-cluster">
        <button id="btn-touch-view" class="btn-utility" title="Switch First/Third Person">👁️</button>
        <button id="btn-touch-build" class="btn-utility" title="Colony Build Menu">🏛️</button>
      </div>

      <!-- 4. Bottom Right Action Cluster -->
      <div class="action-cluster">
        <div class="action-row">
          <!-- Camouflage Disguise -->
          <button id="btn-touch-camo" class="btn-touch btn-action-med">
            <span class="btn-touch-icon">🍃</span>
            <span class="btn-touch-label">Camo</span>
          </button>
          <!-- Root Burrow -->
          <button id="btn-touch-burrow" class="btn-touch btn-action-med">
            <span class="btn-touch-icon">🪵</span>
            <span class="btn-touch-label">Burrow</span>
          </button>
        </div>

        <div class="action-row">
          <!-- Acorn Slingshot -->
          <button id="btn-touch-acorn" class="btn-touch btn-action-med">
            <span class="btn-touch-icon">🌰</span>
            <span class="btn-touch-label">Sling</span>
          </button>
          <!-- Jump / Paddle -->
          <button id="btn-touch-jump" class="btn-touch btn-action-med">
            <span class="btn-touch-icon">🦘</span>
            <span class="btn-touch-label">Jump</span>
          </button>
          <!-- Primary TOTK Head-Slam -->
          <button id="btn-touch-slam" class="btn-touch btn-primary-slam">
            <span class="btn-touch-icon">💥</span>
            <span class="btn-touch-label">SLAM</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.joystickBase = document.getElementById('touch-joystick-base');
    this.joystickKnob = document.getElementById('touch-joystick-knob');

    this.bindJoystick();
    this.bindCameraLook();
    this.bindActionButtons();

    // Listen to mode changes from InputManager
    input.onModeChange((mode) => {
      this.updateVisibility();
    });

    this.updateVisibility();
  }

  updateVisibility() {
    if (this.container) {
      const isMobile = (input.mode === 'mobile');
      this.container.style.display = isMobile ? 'block' : 'none';
      this.isEnabled = isMobile;
    }
  }

  // Bind Virtual Joystick (Movement & Sprint)
  bindJoystick() {
    const zone = document.getElementById('touch-joystick-zone');

    const onStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          const rect = this.joystickBase.getBoundingClientRect();
          this.joystickOrigin = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
          this.handleJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onMove = (e) => {
      if (this.joystickTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.handleJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const onEnd = (e) => {
      if (this.joystickTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          this.joystickKnob.style.transform = 'translate(-50%, -50%)';
          // Release all virtual movement keys
          input.setVirtualKey('KeyW', false);
          input.setVirtualKey('KeyS', false);
          input.setVirtualKey('KeyA', false);
          input.setVirtualKey('KeyD', false);
          input.setVirtualKey('ShiftLeft', false);
          break;
        }
      }
    };

    zone.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: false });
    window.addEventListener('touchcancel', onEnd, { passive: false });
  }

  handleJoystickMove(clientX, clientY) {
    const dx = clientX - this.joystickOrigin.x;
    const dy = clientY - this.joystickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    const normX = knobX / this.maxRadius;
    const normY = knobY / this.maxRadius;

    // Movement threshold (deadzone 0.25)
    input.setVirtualKey('KeyW', normY < -0.3);
    input.setVirtualKey('KeyS', normY > 0.3);
    input.setVirtualKey('KeyA', normX < -0.3);
    input.setVirtualKey('KeyD', normX > 0.3);

    // Auto-sprint if tilted past 75%
    input.setVirtualKey('ShiftLeft', clampedDist > (this.maxRadius * 0.75));
  }

  // Bind Camera Look Swipe Area (Right half of screen)
  bindCameraLook() {
    const swipeZone = document.getElementById('touch-camera-zone');

    swipeZone.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.lookTouchId === null) {
          this.lookTouchId = touch.identifier;
          this.lastLookPos = { x: touch.clientX, y: touch.clientY };
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.lookTouchId) {
          const deltaX = touch.clientX - this.lastLookPos.x;
          const deltaY = touch.clientY - this.lastLookPos.y;
          this.lastLookPos = { x: touch.clientX, y: touch.clientY };

          // Feed into camera yaw and pitch
          input.addMouseDelta(deltaX * 1.8, deltaY * 1.8);
          break;
        }
      }
    }, { passive: false });

    const endLook = (e) => {
      if (this.lookTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.lookTouchId) {
          this.lookTouchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchend', endLook, { passive: false });
    window.addEventListener('touchcancel', endLook, { passive: false });
  }

  // Bind Action Buttons
  bindActionButtons() {
    const attachButton = (elemId, onDown, onUp = null) => {
      const btn = document.getElementById(elemId);
      if (!btn) return;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.vibrate) navigator.vibrate(10);
        onDown();
      }, { passive: false });

      if (onUp) {
        btn.addEventListener('touchend', (e) => {
          e.preventDefault();
          onUp();
        }, { passive: false });
        btn.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          onUp();
        }, { passive: false });
      }
    };

    // 💥 Head-Slam Attack
    attachButton('btn-touch-slam', () => {
      input.triggerAction('Mouse0');
    });

    // 🌰 Acorn Slingshot
    attachButton('btn-touch-acorn', () => {
      input.triggerAction('KeyQ');
    });

    // 🍃 Camouflage Disguise
    attachButton('btn-touch-camo', () => {
      input.triggerAction('KeyC');
    });

    // 🪵 Root Burrow Hydration
    attachButton('btn-touch-burrow', () => {
      input.triggerAction('KeyR');
    });

    // 🦘 Jump / Swim Paddle
    attachButton('btn-touch-jump',
      () => input.setVirtualKey('Space', true),
      () => input.setVirtualKey('Space', false)
    );

    // 👁️ View Toggle (First/Third Person)
    attachButton('btn-touch-view', () => {
      input.triggerAction('KeyV');
    });

    // 🏛️ Build Menu
    attachButton('btn-touch-build', () => {
      input.triggerAction('KeyB');
    });
  }
}

export const mobileControls = new MobileControls();

