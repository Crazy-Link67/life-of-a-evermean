// First-Person PointerLock & Control Manager (Supports PC & Mobile Modes)

export class InputManager {
  constructor() {
    this.keys = {};
    this.mouseButtons = {};
    this.mouseDelta = { x: 0, y: 0 };
    this.isPointerLocked = false;
    this.sensitivity = 1.0;
    this.invertY = false;

    // Detect initial mode from localStorage or device touch capability
    const savedMode = localStorage.getItem('evermean_control_mode');
    const isTouchDevice = ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));
    this.mode = savedMode || (isTouchDevice ? 'mobile' : 'pc');

    this.onActionCallbacks = new Map();
    this.onModeChangeCallbacks = [];
  }

  init(domElement) {
    this.domElement = domElement;

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Trigger action callbacks for single-press keys
      if (this.onActionCallbacks.has(e.code)) {
        this.onActionCallbacks.get(e.code)(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Pointer Lock Listeners (Only active in PC mode)
    domElement.addEventListener('click', () => {
      if (this.mode === 'pc' && !this.isPointerLocked && document.pointerLockElement !== domElement) {
        domElement.requestPointerLock().catch(() => {});
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === domElement);
    });

    // Mouse Movement
    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDelta.x += e.movementX * this.sensitivity * 0.002;
        this.mouseDelta.y += (this.invertY ? -1 : 1) * e.movementY * this.sensitivity * 0.002;
      }
    });

    // Mouse Buttons
    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      this.mouseButtons[e.button] = true;

      if (e.button === 0 && this.onActionCallbacks.has('Mouse0')) {
        this.onActionCallbacks.get('Mouse0')(e);
      }
      if (e.button === 2 && this.onActionCallbacks.has('Mouse2')) {
        this.onActionCallbacks.get('Mouse2')(e);
      }
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false;
    });

    // Prevent context menu on right click in canvas
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Set Control Mode ('pc' or 'mobile')
  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    localStorage.setItem('evermean_control_mode', mode);

    if (this.mode === 'mobile' && this.isPointerLocked) {
      this.unlockPointer();
    }

    this.onModeChangeCallbacks.forEach((cb) => cb(this.mode));
  }

  // Toggle between PC and Mobile mode
  toggleMode() {
    const nextMode = (this.mode === 'pc') ? 'mobile' : 'pc';
    this.setMode(nextMode);
    return nextMode;
  }

  onModeChange(callback) {
    this.onModeChangeCallbacks.push(callback);
  }

  // Set virtual key state for touch controls
  setVirtualKey(code, isPressed) {
    this.keys[code] = !!isPressed;
  }

  // Trigger an action callback programmatically (e.g. from mobile touch buttons)
  triggerAction(actionKey) {
    if (this.onActionCallbacks.has(actionKey)) {
      this.onActionCallbacks.get(actionKey)();
    }
  }

  // Add mouse delta from touch swipes
  addMouseDelta(dx, dy) {
    this.mouseDelta.x += dx * this.sensitivity * 0.002;
    this.mouseDelta.y += (this.invertY ? -1 : 1) * dy * this.sensitivity * 0.002;
  }

  onAction(actionKey, callback) {
    this.onActionCallbacks.set(actionKey, callback);
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  isMouseDown(button) {
    return !!this.mouseButtons[button];
  }

  consumeMouseDelta() {
    const delta = { x: this.mouseDelta.x, y: this.mouseDelta.y };
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
    return delta;
  }

  unlockPointer() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  requestPointerLock() {
    if (this.mode === 'pc' && this.domElement && document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock().catch(() => {});
    }
  }
}

export const input = new InputManager();
