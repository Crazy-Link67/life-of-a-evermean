import * as THREE from 'three';
import { TreeModelGenerator } from '../entities/TreeModelGenerator.js';
import { accountSystem } from '../core/AccountSystem.js';

// Local Network & Online P2P Multiplayer Manager
// Supports Social Grove Lobbies, Co-op Survival World, and Arena PvP Colosseum Battles
export class MultiplayerManager {
  constructor() {
    this.currentRoom = null;
    this.roomMode = 'social'; // 'social', 'coop', 'arena'
    this.isHost = false;
    this.channel = null;
    this.remotePlayers = new Map(); // playerKey -> { id, playerKey, username, friendCode, config, model, targetPos, targetYaw, hp, maxHp, speechBubble }
    this.scene = null;
    this.terrain = null;
    this.engine = null;
    this.localPlayer = null;
    this.onChatCallbacks = [];
    this.onRoomChangeCallbacks = [];
    this.onScoreCallbacks = [];
    this.arenaScores = { localWins: 0, remoteWins: 0 };
    this.syncTimer = 0;
    this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    this.seenPackets = new Set();
    this.peer = null;
    this.peerConnections = new Map();
  }

  init(scene, terrain, engine, player) {
    this.scene = scene;
    this.terrain = terrain;
    this.engine = engine;
    this.localPlayer = player;
  }

  // Host a new Room
  hostRoom(roomCode, mode = 'social') {
    this.leaveRoom();
    this.currentRoom = roomCode.trim().toUpperCase();
    this.roomMode = mode;
    this.isHost = true;
    this.setupNetworkChannel();

    // Broadcast host announcement
    this.broadcast({
      type: 'ROOM_ANNOUNCE',
      roomCode: this.currentRoom,
      mode: this.roomMode,
      hostName: accountSystem.getProfile().username
    });

    this.notifyRoomChange();
    return this.currentRoom;
  }

  // Join an existing Room by code
  joinRoom(roomCode) {
    this.leaveRoom();
    this.currentRoom = roomCode.trim().toUpperCase();
    this.isHost = false;
    this.setupNetworkChannel();

    const profile = accountSystem.getProfile();

    // Announce presence
    this.broadcast({
      type: 'PLAYER_JOIN',
      id: profile.id,
      username: profile.username,
      friendCode: profile.friendCode,
      config: profile.customEvermean,
      stage: this.localPlayer ? this.localPlayer.growthStage : 1,
      position: this.localPlayer ? { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z } : { x: 0, y: 2, z: 0 },
      yaw: this.localPlayer ? this.localPlayer.yaw : 0
    });

    this.notifyRoomChange();
  }

  // Leave active Room
  leaveRoom() {
    if (!this.currentRoom) return;

    this.broadcast({
      type: 'PLAYER_LEAVE',
      id: accountSystem.getProfile().id
    });

    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
      this.channel = null;
    }

    if (this.peerConnections) {
      this.peerConnections.forEach((conn) => {
        try { conn.close(); } catch (e) {}
      });
      this.peerConnections.clear();
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }

    // Clean up all remote 3D models
    this.remotePlayers.forEach((p) => {
      if (p.model && this.scene) this.scene.remove(p.model);
    });
    this.remotePlayers.clear();

    this.currentRoom = null;
    this.isHost = false;
    this.notifyRoomChange();
  }

  setupNetworkChannel() {
    // 1. Same-device / cross-tab broadcast channel
    if (window.BroadcastChannel) {
      try {
        this.channel = new BroadcastChannel(`evermean_room_${this.currentRoom}`);
        this.channel.onmessage = (event) => {
          this.handleNetworkMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    // 2. Cross-device WebRTC online server mesh via PeerJS
    this.setupWebRTC();
  }

  setupWebRTC() {
    const cleanRoom = this.currentRoom.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hostPeerId = `evermean-room-${cleanRoom}`;

    const initPeer = () => {
      if (!window.Peer) return;

      const peerConfig = {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      };

      if (this.isHost) {
        try {
          this.peer = new window.Peer(hostPeerId, peerConfig);

          this.peer.on('open', (id) => {
            console.log('👑 PeerJS Host Online with ID:', id);
            if (window.showGameNotification) {
              window.showGameNotification(`🌐 Online WebRTC Server Active! Room: ${this.currentRoom}`);
            }
          });

          this.peer.on('connection', (conn) => {
            conn.on('open', () => {
              console.log('🔗 Client connected to host via WebRTC:', conn.peer);
              this.peerConnections.set(conn.peer, conn);

              const profile = accountSystem.getProfile();
              const welcomePacket = {
                type: 'PLAYER_HEARTBEAT',
                id: profile.id,
                username: profile.username,
                friendCode: profile.friendCode,
                config: profile.customEvermean,
                stage: this.localPlayer ? this.localPlayer.growthStage : 1,
                position: this.localPlayer ? { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z } : { x: 0, y: 2, z: 0 },
                yaw: this.localPlayer ? this.localPlayer.yaw : 0,
                hp: this.localPlayer ? this.localPlayer.barkHp : 100,
                roomMode: this.roomMode,
                senderSessionId: this.sessionId,
                packetId: 'pkt_' + Math.random().toString(36).substring(2, 9)
              };
              conn.send(welcomePacket);
            });

            conn.on('data', (data) => {
              this.handleNetworkMessage(data);
              // Relay to all other connected clients
              this.peerConnections.forEach((otherConn, otherId) => {
                if (otherId !== conn.peer && otherConn.open) {
                  otherConn.send(data);
                }
              });
            });

            conn.on('close', () => {
              this.peerConnections.delete(conn.peer);
            });
            conn.on('error', () => {
              this.peerConnections.delete(conn.peer);
            });
          });

          this.peer.on('error', (err) => {
            console.warn('PeerJS Host Notice:', err);
          });
        } catch (e) {
          console.warn('PeerJS init error:', e);
        }
      } else {
        // Client joining room
        try {
          this.peer = new window.Peer(peerConfig);

          this.peer.on('open', (myPeerId) => {
            console.log('🚀 PeerJS Client Online with ID:', myPeerId);
            const hostConn = this.peer.connect(hostPeerId, { reliable: true });

            hostConn.on('open', () => {
              console.log('✅ Connected to Host via WebRTC!');
              this.peerConnections.set(hostPeerId, hostConn);

              const profile = accountSystem.getProfile();
              const joinPacket = {
                type: 'PLAYER_JOIN',
                id: profile.id,
                username: profile.username,
                friendCode: profile.friendCode,
                config: profile.customEvermean,
                stage: this.localPlayer ? this.localPlayer.growthStage : 1,
                position: this.localPlayer ? { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z } : { x: 0, y: 2, z: 0 },
                yaw: this.localPlayer ? this.localPlayer.yaw : 0,
                senderSessionId: this.sessionId,
                packetId: 'pkt_' + Math.random().toString(36).substring(2, 9)
              };
              hostConn.send(joinPacket);
              if (window.showGameNotification) {
                window.showGameNotification(`🌐 Connected to Online Host for Room ${this.currentRoom}!`);
              }
            });

            hostConn.on('data', (data) => {
              this.handleNetworkMessage(data);
            });

            hostConn.on('close', () => {
              this.peerConnections.delete(hostPeerId);
            });
            hostConn.on('error', () => {
              this.peerConnections.delete(hostPeerId);
            });
          });

          this.peer.on('error', (err) => {
            console.warn('PeerJS Client Notice:', err);
          });
        } catch (e) {
          console.warn('PeerJS client error:', e);
        }
      }
    };

    if (window.Peer) {
      initPeer();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.onload = () => initPeer();
      document.head.appendChild(script);
    }
  }

  broadcast(packet) {
    const packetId = packet.packetId || ('pkt_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36));
    const fullPacket = {
      ...packet,
      packetId,
      senderId: accountSystem.getProfile().id,
      senderSessionId: this.sessionId,
      timestamp: Date.now()
    };

    // 1. BroadcastChannel (local tabs / windows)
    if (this.channel) {
      try {
        this.channel.postMessage(fullPacket);
      } catch (e) {}
    }

    // 2. WebRTC Peer Connections (internet / cross-device)
    this.peerConnections.forEach((conn) => {
      if (conn && conn.open) {
        try {
          conn.send(fullPacket);
        } catch (e) {}
      }
    });
  }

  // Network Packet Dispatcher
  handleNetworkMessage(data) {
    if (!data || data.senderSessionId === this.sessionId) return;

    // Deduplicate packets
    if (data.packetId) {
      if (this.seenPackets.has(data.packetId)) return;
      this.seenPackets.add(data.packetId);
      if (this.seenPackets.size > 250) {
        const iter = this.seenPackets.values();
        for (let i = 0; i < 60; i++) this.seenPackets.delete(iter.next().value);
      }
    }

    const playerKey = data.senderSessionId || data.id;

    switch (data.type) {
      case 'PLAYER_JOIN': {
        this.addRemotePlayer(data, playerKey);
        // Respond with our state so newcomer knows we are here
        const profile = accountSystem.getProfile();
        this.broadcast({
          type: 'PLAYER_HEARTBEAT',
          id: profile.id,
          username: profile.username,
          friendCode: profile.friendCode,
          config: profile.customEvermean,
          stage: this.localPlayer ? this.localPlayer.growthStage : 1,
          position: this.localPlayer ? { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z } : { x: 0, y: 2, z: 0 },
          yaw: this.localPlayer ? this.localPlayer.yaw : 0,
          hp: this.localPlayer ? this.localPlayer.barkHp : 100,
          roomMode: this.roomMode
        });
        if (window.showGameNotification) {
          window.showGameNotification(`🌲 ${data.username} (${data.friendCode}) joined the grove!`);
        }
        break;
      }

      case 'PLAYER_HEARTBEAT': {
        if (!this.remotePlayers.has(playerKey)) {
          this.addRemotePlayer(data, playerKey);
        } else {
          this.updateRemotePlayerState(data, playerKey);
        }
        if (data.roomMode && !this.isHost) {
          this.roomMode = data.roomMode;
        }
        break;
      }

      case 'PLAYER_STATE': {
        this.updateRemotePlayerState(data, playerKey);
        break;
      }

      case 'PLAYER_ATTACK': {
        this.handleRemoteAttack(data);
        break;
      }

      case 'PVP_HIT': {
        if ((data.targetSessionId === this.sessionId || data.targetId === accountSystem.getProfile().id) && this.localPlayer) {
          this.localPlayer.takeDamage(data.damage, data.attackerName || 'Arena Rival');
          if (this.localPlayer.barkHp <= 0) {
            this.arenaScores.remoteWins++;
            this.broadcast({
              type: 'ARENA_DEFEAT',
              loserName: accountSystem.getProfile().username,
              winnerId: data.attackerId,
              winnerName: data.attackerName
            });
            accountSystem.recordStat('arenaLosses', 1);
            if (window.showGameNotification) {
              window.showGameNotification(`💥 You were defeated by ${data.attackerName} in the Arena!`);
            }
          }
        }
        break;
      }

      case 'ARENA_DEFEAT': {
        if (data.winnerId === accountSystem.getProfile().id) {
          this.arenaScores.localWins++;
          accountSystem.recordStat('arenaWins', 1);
          if (window.showGameNotification) {
            window.showGameNotification(`🏆 Victory! You defeated ${data.loserName} in the Arena Colosseum! (+1 Win)`);
          }
          if (this.engine) this.engine.spawnCosmicBurst(this.localPlayer.position, 60);
        }
        this.notifyScoreUpdate();
        break;
      }

      case 'CHAT_MSG': {
        this.displaySpeechBubble(playerKey, data.text);
        this.onChatCallbacks.forEach((cb) => cb(data.username, data.text, data.friendCode));
        break;
      }

      case 'PLAYER_LEAVE': {
        this.removeRemotePlayer(playerKey);
        break;
      }
    }
  }

  // Create 3D Remote Evermean Avatar
  addRemotePlayer(data, key = null) {
    const playerKey = key || data.senderSessionId || data.id;
    if (this.remotePlayers.has(playerKey)) {
      this.updateRemotePlayerState(data, playerKey);
      return;
    }

    // Clean up any stale/duplicate session for this player ID
    if (data.id) {
      for (const [k, v] of this.remotePlayers.entries()) {
        if (v.id === data.id && k !== playerKey) {
          if (v.model && this.scene) this.scene.remove(v.model);
          this.remotePlayers.delete(k);
        }
      }
    }

    let displayName = data.username || 'Evermean';
    if (data.id === accountSystem.getProfile().id && data.senderSessionId !== this.sessionId) {
      displayName += ' (Visitor)';
    }

    const model = TreeModelGenerator.createEvermeanModel(data.config || {}, data.stage || 1);
    const posX = data.position?.x || 0;
    const posZ = data.position?.z || 0;
    const posY = data.position?.y !== undefined ? data.position.y : (this.terrain ? this.terrain.getHeight(posX, posZ) : 1);
    model.position.set(posX, posY, posZ);
    if (data.yaw !== undefined) model.rotation.y = data.yaw;

    if (this.scene) this.scene.add(model);

    // Create 3D Nameplate Sprite above player head
    const nameplate = this.createNameplate(displayName, data.friendCode || '');
    nameplate.position.y = 3.2 * (data.config?.heightScale || 1.0);
    model.add(nameplate);

    const remoteObj = {
      id: data.id,
      playerKey,
      username: displayName,
      friendCode: data.friendCode,
      config: data.config,
      model,
      nameplate,
      targetPos: new THREE.Vector3(posX, posY, posZ),
      targetYaw: data.yaw || 0,
      hp: data.hp || 100,
      maxHp: 100,
      speechBubble: null,
      lastSeen: Date.now()
    };

    this.remotePlayers.set(playerKey, remoteObj);
  }

  // Update remote player coordinates
  updateRemotePlayerState(data, key = null) {
    const playerKey = key || data.senderSessionId || data.id;
    let remote = this.remotePlayers.get(playerKey);
    if (!remote && data.id) {
      for (const v of this.remotePlayers.values()) {
        if (v.id === data.id) {
          remote = v;
          break;
        }
      }
    }
    if (!remote) return;

    remote.lastSeen = Date.now();
    if (data.position) remote.targetPos.set(data.position.x, data.position.y, data.position.z);
    if (data.yaw !== undefined) remote.targetYaw = data.yaw;
    if (data.hp !== undefined) remote.hp = data.hp;

    if (remote.model && data.isAttacking && remote.model.userData.trunkMesh) {
      remote.model.userData.trunkMesh.rotation.x = 0.8;
    }
  }

  // Remote head-slam or special attack
  handleRemoteAttack(data) {
    const playerKey = data.senderSessionId || data.id;
    let remote = this.remotePlayers.get(playerKey);
    if (!remote && data.id) {
      for (const v of this.remotePlayers.values()) {
        if (v.id === data.id) {
          remote = v;
          break;
        }
      }
    }

    if (this.engine) {
      const slamPoint = new THREE.Vector3();
      if (data.position) {
        slamPoint.set(data.position.x, data.position.y, data.position.z);
      } else if (remote) {
        slamPoint.copy(remote.targetPos);
      } else {
        return;
      }
      this.engine.spawnShockwave(slamPoint, 2.5, data.glowColor || 0xca8a04);
      this.engine.spawnParticles(slamPoint, 20, 0x8b5a2b, 4, 0.15);
    }
  }

  removeRemotePlayer(key) {
    let remote = this.remotePlayers.get(key);
    let targetKey = key;
    if (!remote) {
      for (const [k, v] of this.remotePlayers.entries()) {
        if (v.id === key || v.playerKey === key) {
          remote = v;
          targetKey = k;
          break;
        }
      }
    }
    if (remote) {
      if (remote.model && this.scene) this.scene.remove(remote.model);
      this.remotePlayers.delete(targetKey);
      if (window.showGameNotification) {
        window.showGameNotification(`🍂 ${remote.username} left the grove.`);
      }
    }
  }

  // Create Billboard 3D Canvas Nameplate
  createNameplate(name, code) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(18, 14, 10, 0.75)';
    ctx.roundRect(10, 8, 236, 48, 10);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, 128, 32);

    ctx.fillStyle = '#a8a29e';
    ctx.font = '12px monospace';
    ctx.fillText(code, 128, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1);
    return sprite;
  }

  // Display 3D Speech Bubble above remote Evermean
  displaySpeechBubble(playerId, text) {
    let remote = this.remotePlayers.get(playerId);
    if (!remote) {
      for (const v of this.remotePlayers.values()) {
        if (v.id === playerId || v.playerKey === playerId) {
          remote = v;
          break;
        }
      }
    }
    if (!remote || !remote.model) return;

    if (remote.speechBubble) remote.model.remove(remote.speechBubble);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.roundRect(8, 8, 240, 64, 12);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text.substring(0, 24), 128, 42);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const bubbleSprite = new THREE.Sprite(spriteMat);
    bubbleSprite.scale.set(2.8, 0.9, 1);
    bubbleSprite.position.y = 4.0;
    remote.model.add(bubbleSprite);
    remote.speechBubble = bubbleSprite;

    setTimeout(() => {
      if (remote.model && bubbleSprite) remote.model.remove(bubbleSprite);
    }, 4500);
  }

  // Send In-Game Text Chat
  sendChat(text) {
    if (!text || !text.trim()) return;
    const profile = accountSystem.getProfile();
    const cleanText = text.trim().substring(0, 80);

    this.broadcast({
      type: 'CHAT_MSG',
      id: profile.id,
      username: profile.username,
      friendCode: profile.friendCode,
      text: cleanText
    });

    this.onChatCallbacks.forEach((cb) => cb(profile.username, cleanText, profile.friendCode));
  }

  // Trigger PvP Hit in Arena
  checkPvpHit(localAttackPos, power = 1.0) {
    if (this.roomMode !== 'arena') return;

    this.remotePlayers.forEach((remote) => {
      if (remote.model && remote.model.position.distanceTo(localAttackPos) < (2.8 * power)) {
        const damage = Math.floor(25 * power);
        this.broadcast({
          type: 'PVP_HIT',
          targetId: remote.id,
          targetSessionId: remote.playerKey,
          attackerId: accountSystem.getProfile().id,
          attackerName: accountSystem.getProfile().username,
          damage
        });
        if (this.engine) this.engine.spawnParticles(remote.model.position, 20, 0xef4444, 4, 0.15);
      }
    });
  }

  onChat(callback) {
    this.onChatCallbacks.push(callback);
  }

  onRoomChange(callback) {
    this.onRoomChangeCallbacks.push(callback);
  }

  onScoreUpdate(callback) {
    this.onScoreCallbacks.push(callback);
  }

  notifyRoomChange() {
    this.onRoomChangeCallbacks.forEach((cb) => cb(this.currentRoom, this.roomMode, this.isHost));
  }

  notifyScoreUpdate() {
    this.onScoreCallbacks.forEach((cb) => cb(this.arenaScores));
  }

  // Called each frame from main game loop
  update(delta) {
    if (!this.currentRoom) return;

    // 1. Broadcast local player state periodically (20 times per sec)
    this.syncTimer += delta;
    if (this.syncTimer > 0.05 && this.localPlayer && this.localPlayer.position) {
      this.syncTimer = 0;
      this.broadcast({
        type: 'PLAYER_STATE',
        id: accountSystem.getProfile().id,
        position: { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z },
        yaw: this.localPlayer.yaw || 0,
        pitch: this.localPlayer.pitch || 0,
        isAttacking: !!this.localPlayer.isAttacking,
        isDisguised: !!this.localPlayer.isDisguised,
        isBurrowed: !!this.localPlayer.isRootBurrowed,
        hp: this.localPlayer.barkHp || 100
      });
    }

    // 2. Smoothly interpolate remote player positions and rotations
    this.remotePlayers.forEach((remote) => {
      if (remote.model) {
        remote.model.position.lerp(remote.targetPos, delta * 12);
        remote.model.rotation.y = THREE.MathUtils.lerp(remote.model.rotation.y, remote.targetYaw, delta * 12);

        // Animate root legs on moving remote Evermeans
        if (remote.model.userData.legs) {
          const isMoving = remote.model.position.distanceTo(remote.targetPos) > 0.05;
          remote.model.userData.legs.forEach((leg, idx) => {
            leg.rotation.x = isMoving ? Math.sin(Date.now() * 0.015 + idx) * 0.4 : 0;
          });
        }
      }
    });

    // 3. Prune disconnected / timed-out players after 15 seconds of silence
    const now = Date.now();
    this.remotePlayers.forEach((remote, key) => {
      if (remote.lastSeen && (now - remote.lastSeen > 15000)) {
        this.removeRemotePlayer(key);
      }
    });
  }
}

export const multiplayer = new MultiplayerManager();

