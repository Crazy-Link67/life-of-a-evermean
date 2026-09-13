// Account & Profile Management System
// Handles persistent player profiles, custom Friend Codes, Friends List,
// Friend Requests, and gameplay stats saved in localStorage.

export class AccountSystem {
  constructor() {
    this.storageKey = 'evermean_player_account_v1';
    this.profile = this.loadOrCreateProfile();
    this.onProfileUpdateCallbacks = [];
  }

  // Load profile from localStorage or create a fresh new one
  loadOrCreateProfile() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.friendCode) return parsed;
      } catch (e) {
        console.warn('Failed to parse account profile, initializing new one:', e);
      }
    }

    // Generate random 6-character Friend Code (e.g., EVR-7392)
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const code = `EVR-${codeNum}`;
    const defaultNames = ['GroveWarden', 'OakSentinel', 'AncientBough', 'BrambleClaw', 'ForestSprite', 'TimberBeast'];
    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)] + Math.floor(10 + Math.random() * 89);

    const initialProfile = {
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      username: randomName,
      friendCode: code,
      createdAt: Date.now(),
      stats: {
        survivalDays: 1,
        arenaWins: 0,
        arenaLosses: 0,
        goblinsDefeated: 0,
        korokSeeds: 0,
        structuresBuilt: 0,
        coopSessions: 0
      },
      friends: [], // Array of { friendCode, username, addedAt }
      friendRequests: [], // Array of { fromCode, fromName, sentAt }
      customEvermean: {
        presetKey: 'oak',
        name: 'Custom Great Oak',
        barkColor: '#5c4033',
        barkRoughness: 0.88,
        foliageColor: '#2e8540',
        foliageType: 'deciduous',
        faceType: 'knot_holes',
        eyeColor: '#facc15',
        accessories: 'lantern',
        legCount: 4,
        legType: 'pointy',
        crestType: 'antler_boughs',
        heightScale: 1.0,
        girthScale: 1.0,
        hasMantisScythes: false,
        element: 'none'
      },
      campaign: {
        currentChapter: 1,
        unlockedChapter: 1,
        completedObjectives: []
      }
    };

    this.saveToStorage(initialProfile);
    return initialProfile;
  }

  saveToStorage(profile = this.profile) {
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
    this.notifyUpdate();
  }

  getProfile() {
    return this.profile;
  }

  setUsername(newUsername) {
    if (!newUsername || newUsername.trim().length === 0) return;
    this.profile.username = newUsername.trim().substring(0, 18);
    this.saveToStorage();
  }

  saveCustomEvermean(config) {
    this.profile.customEvermean = { ...this.profile.customEvermean, ...config };
    this.saveToStorage();
  }

  // --- Friend Request System ---
  // Send a Friend Request to a given Friend Code
  sendFriendRequest(targetCode, targetName = 'Unknown Evermean') {
    const cleanCode = targetCode.trim().toUpperCase();
    if (cleanCode === this.profile.friendCode) {
      return { success: false, reason: 'You cannot send a friend request to yourself!' };
    }

    // Check if already friends
    if (this.profile.friends.some((f) => f.friendCode === cleanCode)) {
      return { success: false, reason: 'Already in your Friends List!' };
    }

    // Dispatch broadcast event across local network bus so recipient receives request
    const requestPacket = {
      type: 'FRIEND_REQUEST',
      fromCode: this.profile.friendCode,
      fromName: this.profile.username,
      targetCode: cleanCode,
      sentAt: Date.now()
    };

    // Broadcast through local network / cross-tab bus
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('evermean_net_bus');
      bc.postMessage(requestPacket);
      bc.close();
    }

    return { success: true, message: `Friend request sent to ${cleanCode}!` };
  }

  // Receive incoming friend request from network
  receiveFriendRequest(fromCode, fromName) {
    if (fromCode === this.profile.friendCode) return;
    if (this.profile.friends.some((f) => f.friendCode === fromCode)) return;
    if (this.profile.friendRequests.some((r) => r.fromCode === fromCode)) return;

    this.profile.friendRequests.push({
      fromCode,
      fromName: fromName || fromCode,
      sentAt: Date.now()
    });
    this.saveToStorage();

    if (window.showGameNotification) {
      window.showGameNotification(`💌 New Friend Request from ${fromName} (${fromCode})!`);
    }
  }

  // Accept incoming friend request
  acceptFriendRequest(fromCode) {
    const idx = this.profile.friendRequests.findIndex((r) => r.fromCode === fromCode);
    if (idx === -1) return false;

    const req = this.profile.friendRequests.splice(idx, 1)[0];
    this.profile.friends.push({
      friendCode: req.fromCode,
      username: req.fromName,
      addedAt: Date.now()
    });
    this.saveToStorage();

    // Broadcast accept response back
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('evermean_net_bus');
      bc.postMessage({
        type: 'FRIEND_ACCEPTED',
        targetCode: req.fromCode,
        fromCode: this.profile.friendCode,
        fromName: this.profile.username
      });
      bc.close();
    }

    return true;
  }

  // Reject incoming friend request
  rejectFriendRequest(fromCode) {
    this.profile.friendRequests = this.profile.friendRequests.filter((r) => r.fromCode !== fromCode);
    this.saveToStorage();
  }

  // Remove existing friend
  removeFriend(friendCode) {
    this.profile.friends = this.profile.friends.filter((f) => f.friendCode !== friendCode);
    this.saveToStorage();
  }

  // Record stats updates
  recordStat(statKey, delta = 1) {
    if (!this.profile.stats) this.profile.stats = {};
    this.profile.stats[statKey] = (this.profile.stats[statKey] || 0) + delta;
    this.saveToStorage();
  }

  onUpdate(callback) {
    this.onProfileUpdateCallbacks.push(callback);
  }

  notifyUpdate() {
    this.onProfileUpdateCallbacks.forEach((cb) => cb(this.profile));
  }

  // Export Account as JSON backup
  exportAccount() {
    const jsonStr = JSON.stringify(this.profile, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Evermean_Account_${this.profile.username}_${this.profile.friendCode}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Import Account JSON
  importAccount(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.friendCode && parsed.username) {
        this.profile = parsed;
        this.saveToStorage();
        return { success: true };
      }
      return { success: false, error: 'Invalid Account file format' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const accountSystem = new AccountSystem();

