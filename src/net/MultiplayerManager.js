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
    this.remotePlayers = new Map(); // id -> { id, username, friendCode, config, model, targetPos, targetYaw, hp, maxHp, speechBubble }
    this.scene = null;
    this.terrain = null;
    this.engine = null;
    this.localPlayer = null;
    this.onChatCallbacks = [];
    this.onRoomChangeCallbacks = [];
    this.onScoreCallbacks = [];
    this.arenaScores = { localWins: 0, remoteWins: 0 };
    this.syncTimer = 0;
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
      position: this.localPlayer ? this.localPlayer.position : { x: 0, y: 2, z: 0 },
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
      this.channel.close();
      this.channel = null;
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
    if (!window.BroadcastChannel) return;

    this.channel = new BroadcastChannel(`evermean_room_${this.currentRoom}`);
    this.channel.onmessage = (event) => {
      this.handleNetworkMessage(event.data);
    };
  }

  broadcast(packet) {
    if (this.channel) {
      this.channel.postMessage({
        ...packet,
        senderId: accountSystem.getProfile().id,
        timestamp: Date.now()
      });
    }
  }

  // Network Packet Dispatcher
  handleNetworkMessage(data) {
    if (!data || data.senderId === accountSystem.getProfile().id) return;

    switch (data.type) {
      case 'PLAYER_JOIN': {
        this.addRemotePlayer(data);
        // Respond with our state so newcomer knows we are here
        const profile = accountSystem.getProfile();
        this.broadcast({
          type: 'PLAYER_HEARTBEAT',
          id: profile.id,
          username: profile.username,
          friendCode: profile.friendCode,
          config: profile.customEvermean,
          stage: this.localPlayer ? this.localPlayer.growthStage : 1,
          position: this.localPlayer ? this.localPlayer.position : { x: 0, y: 2, z: 0 },
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
        if (!this.remotePlayers.has(data.id)) {
          this.addRemotePlayer(data);
        } else {
          this.updateRemotePlayerState(data);
        }
        if (data.roomMode && !this.isHost) {
          this.roomMode = data.roomMode;
        }
        break;
      }

      case 'PLAYER_STATE': {
        this.updateRemotePlayerState(data);
        break;
      }

      case 'PLAYER_ATTACK': {
        this.handleRemoteAttack(data);
        break;
      }

      case 'PVP_HIT': {
        if (data.targetId === accountSystem.getProfile().id && this.localPlayer) {
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
        this.displaySpeechBubble(data.id, data.text);
        this.onChatCallbacks.forEach((cb) => cb(data.username, data.text, data.friendCode));
        break;
      }

      case 'PLAYER_LEAVE': {
        this.removeRemotePlayer(data.id);
        break;
      }
    }
  }

  // Create 3D Remote Evermean Avatar
  addRemotePlayer(data) {
    if (this.remotePlayers.has(data.id)) return;

    const model = TreeModelGenerator.createEvermeanModel(data.config || {}, data.stage || 1);
    if (data.position) model.position.copy(data.position);
    if (this.scene) this.scene.add(model);

    // Create 3D Nameplate Sprite above player head
    const nameplate = this.createNameplate(data.username || 'Evermean', data.friendCode || '');
    nameplate.position.y = 3.2 * (data.config?.heightScale || 1.0);
    model.add(nameplate);

    const remoteObj = {
      id: data.id,
      username: data.username,
      friendCode: data.friendCode,
      config: data.config,
      model,
      nameplate,
      targetPos: new THREE.Vector3().copy(data.position || { x: 0, y: 0, z: 0 }),
      targetYaw: data.yaw || 0,
      hp: data.hp || 100,
      maxHp: 100,
      speechBubble: null
    };

    this.remotePlayers.set(data.id, remoteObj);
  }

  // Update remote player coordinates
  updateRemotePlayerState(data) {
    const remote = this.remotePlayers.get(data.id);
    if (!remote) return;

    if (data.position) remote.targetPos.set(data.position.x, data.position.y, data.position.z);
    if (data.yaw !== undefined) remote.targetYaw = data.yaw;
    if (data.hp !== undefined) remote.hp = data.hp;

    if (remote.model && data.isAttacking && remote.model.userData.trunkMesh) {
      remote.model.userData.trunkMesh.rotation.x = 0.8;
    }
  }

  // Remote head-slam or special attack
  handleRemoteAttack(data) {
    const remote = this.remotePlayers.get(data.id);
    if (!remote) return;

    if (this.engine) {
      const slamPoint = new THREE.Vector3().copy(data.position);
      this.engine.spawnShockwave(slamPoint, 2.5, data.glowColor || 0xca8a04);
      this.engine.spawnParticles(slamPoint, 20, 0x8b5a2b, 4, 0.15);
    }
  }

  removeRemotePlayer(id) {
    const remote = this.remotePlayers.get(id);
    if (remote) {
      if (remote.model && this.scene) this.scene.remove(remote.model);
      this.remotePlayers.delete(id);
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
    const remote = this.remotePlayers.get(playerId);
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
    if (this.syncTimer > 0.05 && this.localPlayer) {
      this.syncTimer = 0;
      this.broadcast({
        type: 'PLAYER_STATE',
        id: accountSystem.getProfile().id,
        position: { x: this.localPlayer.position.x, y: this.localPlayer.position.y, z: this.localPlayer.position.z },
        yaw: this.localPlayer.yaw,
        pitch: this.localPlayer.pitch,
        isAttacking: this.localPlayer.isAttacking,
        isDisguised: this.localPlayer.isDisguised,
        isBurrowed: this.localPlayer.isRootBurrowed,
        hp: this.localPlayer.barkHp
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
  }
}

export const multiplayer = new MultiplayerManager();

