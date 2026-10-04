import * as THREE from 'three';
import { audio } from '../core/AudioManager.js';

export class ShrineSystem {
  constructor(scene, engine, terrain) {
    this.scene = scene;
    this.engine = engine;
    this.terrain = terrain;

    this.shrines = [];
    this.activeShrineModal = null;
    this.goddessStatue = null;

    this.initShrines();
    this.initGoddessStatue();
    this.createShrineUI();
  }

  initShrines() {
    const shrineDefs = [
      {
        id: 'roots_shrine',
        name: 'Shrine of the Living Roots',
        subtitle: 'Trial of Vitality & Growth',
        x: 42,
        z: -38,
        description: 'Channel ancient woodland bio-energy into the Zonai pedestal.',
        challengeType: 'vitality',
        completed: false,
        activated: false
      },
      {
        id: 'magnetic_shrine',
        name: 'Shrine of Magnetic Flow',
        subtitle: 'Trial of Ultrahand Resonance',
        x: -48,
        z: 32,
        description: 'Align the floating magnetic monoliths using Ultrahand to form a bridge.',
        challengeType: 'ultrahand',
        completed: false,
        activated: false
      },
      {
        id: 'temporal_shrine',
        name: 'Shrine of Temporal Reversal',
        subtitle: 'Trial of Time-Reversal Recall',
        x: 15,
        z: 75,
        description: 'Command the flow of time with Recall to reverse spinning water-wheels and gear platforms.',
        challengeType: 'recall',
        completed: false,
        activated: false
      }
    ];

    shrineDefs.forEach(def => {
      const y = this.terrain ? this.terrain.getHeight(def.x, def.z) : 0;
      const group = new THREE.Group();
      group.position.set(def.x, y, def.z);

      // 1. Base Stone Foundation (Zonai stepped pyramid / platform)
      const baseGeom = new THREE.CylinderGeometry(4.2, 5.5, 1.4, 8);
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
        metalness: 0.15
      });
      const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
      baseMesh.position.y = 0.7;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // 2. Zonai Shrine Shell Pillars / Arch
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.7,
        emissive: 0x064e3b,
        emissiveIntensity: 0.2
      });

      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.2, 0.9), archMat);
      leftPillar.position.set(-1.8, 2.8, 0);
      group.add(leftPillar);

      const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.2, 0.9), archMat);
      rightPillar.position.set(1.8, 2.8, 0);
      group.add(rightPillar);

      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.8, 1.2), archMat);
      crossBeam.position.set(0, 5.0, 0);
      group.add(crossBeam);

      // 3. Central Zonai Glyphs Pedestal
      const pedestalGeom = new THREE.CylinderGeometry(0.7, 0.9, 1.2, 6);
      const pedMat = new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        emissive: 0x0d9488,
        emissiveIntensity: 0.4
      });
      const pedestal = new THREE.Mesh(pedestalGeom, pedMat);
      pedestal.position.set(0, 1.8, 0);
      group.add(pedestal);

      // 4. Iconic Green Zonai Spiral Energy Vortex Rings floating overhead
      const spiralGroup = new THREE.Group();
      spiralGroup.position.set(0, 6.2, 0);

      const ringGeom = new THREE.TorusGeometry(1.6, 0.12, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        wireframe: false,
        transparent: true,
        opacity: 0.85
      });
      const ring1 = new THREE.Mesh(ringGeom, ringMat);
      ring1.rotation.x = Math.PI / 2.5;
      spiralGroup.add(ring1);

      const ringGeom2 = new THREE.TorusGeometry(1.0, 0.09, 8, 24);
      const ring2 = new THREE.Mesh(ringGeom2, ringMat.clone());
      ring2.rotation.x = -Math.PI / 3;
      ring2.rotation.y = 0.4;
      spiralGroup.add(ring2);

      const coreGeom = new THREE.OctahedronGeometry(0.45, 0);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0 });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      spiralGroup.add(coreMesh);

      group.add(spiralGroup);

      // 5. Point light for atmospheric radiance
      const light = new THREE.PointLight(0x10b981, 1.8, 18);
      light.position.set(0, 4.5, 0);
      group.add(light);

      def.meshGroup = group;
      def.spiralGroup = spiralGroup;
      def.pointLight = light;

      this.scene.add(group);
      this.shrines.push(def);
    });
  }

  initGoddessStatue() {
    const gx = 0;
    const gz = 14;
    const gy = this.terrain ? this.terrain.getHeight(gx, gz) : 0;

    const group = new THREE.Group();
    group.position.set(gx, gy, gz);

    // Stone Plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
    );
    plinth.position.y = 0.4;
    group.add(plinth);

    // Goddess Robe Body
    const robe = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, emissive: 0x334155, emissiveIntensity: 0.2 })
    );
    robe.position.y = 1.9;
    group.add(robe);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 1.2), wingMat);
    wingL.position.set(-0.7, 2.4, -0.4);
    wingL.rotation.y = -0.4;
    group.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.8, 1.2), wingMat);
    wingR.position.set(0.7, 2.4, -0.4);
    wingR.rotation.y = 0.4;
    group.add(wingR);

    // Halo
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.05, 8, 20),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    halo.position.set(0, 3.4, 0);
    halo.rotation.x = Math.PI / 2;
    group.add(halo);

    const light = new THREE.PointLight(0xfef08a, 1.5, 12);
    light.position.set(0, 2.8, 0);
    group.add(light);

    this.scene.add(group);
    this.goddessStatue = {
      position: new THREE.Vector3(gx, gy, gz),
      group
    };
  }

  createShrineUI() {
    if (document.getElementById('shrine-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'shrine-modal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.display = 'none';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.backgroundColor = 'rgba(2, 6, 23, 0.85)';
    modal.style.backdropFilter = 'blur(10px)';
    modal.style.zIndex = '9999';
    modal.style.fontFamily = `'Cinzel', 'Noto Serif', serif, system-ui`;

    modal.innerHTML = `
      <div style="background: linear-gradient(145deg, #091e1d 0%, #061517 100%); border: 2px solid #10b981; border-radius: 18px; padding: 32px; max-width: 580px; width: 90%; color: #e6fffa; box-shadow: 0 0 50px rgba(16, 185, 129, 0.45); text-align: center; position: relative; animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <div id="shrine-vortex-icon" style="font-size: 52px; margin-bottom: 12px; filter: drop-shadow(0 0 16px #34d399);">🌀</div>
        <h2 id="shrine-title" style="margin: 0 0 6px 0; font-size: 26px; color: #a7f3d0; text-transform: uppercase; letter-spacing: 2px;">Ancient Zonai Shrine</h2>
        <h4 id="shrine-subtitle" style="margin: 0 0 18px 0; font-size: 15px; color: #6ee7b7; font-weight: 400; font-style: italic;">Trial of Vitality & Wisdom</h4>
        
        <div id="shrine-body" style="background: rgba(4, 47, 46, 0.5); border: 1px solid #14b8a6; border-radius: 12px; padding: 20px; margin-bottom: 24px; font-size: 15px; line-height: 1.6; color: #ccfbf1; text-align: left;">
          Trial description goes here...
        </div>

        <div id="shrine-rewards-box" style="display: none; background: rgba(20, 83, 45, 0.4); border: 1px solid #22c55e; border-radius: 10px; padding: 14px; margin-bottom: 20px; font-size: 14px; color: #bbf7d0;">
          ✨ <b>Trial Accomplished!</b><br>
          Gained: <b>+1 Light of Blessing</b> 🔮<br>
          Bark Health & Sap completely replenished!
        </div>

        <div style="display: flex; gap: 14px; justify-content: center;">
          <button id="shrine-action-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-family: inherit; font-size: 16px; font-weight: 700; padding: 12px 28px; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
            Commence Trial
          </button>
          <button id="shrine-close-btn" style="background: rgba(30, 41, 59, 0.8); color: #94a3b8; font-family: inherit; font-size: 15px; padding: 12px 24px; border: 1px solid #475569; border-radius: 10px; cursor: pointer; transition: all 0.2s;">
            Depart
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('shrine-close-btn').addEventListener('click', () => {
      this.closeShrineModal();
    });
  }

  update(delta, player) {
    if (!player) return;

    // Swirl Zonai rings overhead
    this.shrines.forEach(shrine => {
      if (shrine.spiralGroup) {
        shrine.spiralGroup.rotation.y += delta * 1.2;
        shrine.spiralGroup.children[0].rotation.z += delta * 0.8;
      }

      // Check proximity for interaction prompt
      const dist = shrine.meshGroup.position.distanceTo(player.position);
      if (dist < 3.8 && !this.activeShrineModal) {
        if (window.setInteractPrompt) {
          const status = shrine.completed ? 'Completed' : (shrine.activated ? 'Enter' : 'Activate');
          window.setInteractPrompt(`[E] ${status} ${shrine.name}`);
        }
      }
    });

    // Check Goddess statue proximity
    if (this.goddessStatue) {
      const gDist = this.goddessStatue.position.distanceTo(player.position);
      if (gDist < 3.5 && !this.activeShrineModal) {
        if (window.setInteractPrompt) {
          window.setInteractPrompt(`[E] Pray to the Goddess Statue (Lights of Blessing: ${player.inventory.lightsOfBlessing || 0})`);
        }
      }
    }
  }

  interact(player) {
    if (!player) return false;

    // 1. Check Goddess Statue
    if (this.goddessStatue) {
      const gDist = this.goddessStatue.position.distanceTo(player.position);
      if (gDist < 4.0) {
        this.openGoddessModal(player);
        return true;
      }
    }

    // 2. Check Shrines
    for (const shrine of this.shrines) {
      const dist = shrine.meshGroup.position.distanceTo(player.position);
      if (dist < 4.5) {
        this.openShrineModal(shrine, player);
        return true;
      }
    }

    return false;
  }

  openShrineModal(shrine, player) {
    const modal = document.getElementById('shrine-modal');
    if (!modal) return;

    this.activeShrineModal = shrine;
    modal.style.display = 'flex';

    document.getElementById('shrine-title').textContent = shrine.name;
    document.getElementById('shrine-subtitle').textContent = shrine.subtitle;
    
    const body = document.getElementById('shrine-body');
    const rewardsBox = document.getElementById('shrine-rewards-box');
    const actionBtn = document.getElementById('shrine-action-btn');

    if (shrine.completed) {
      body.innerHTML = `
        <p style="margin: 0 0 10px 0;">This Zonai Shrine has bestowed upon you its ancient Light of Blessing. Its sanctum rests peacefully in harmony with the woodland roots.</p>
        <p style="margin: 0; color: #34d399;">Fast Travel point active. The blessing shines within your Evermean spirit.</p>
      `;
      rewardsBox.style.display = 'none';
      actionBtn.textContent = 'Enter Fast Travel Meditation';
      actionBtn.onclick = () => {
        audio.playShrineChime?.();
        player.barkHp = player.maxBarkHp;
        player.photosynthesis = player.maxPhotosynthesis;
        if (window.showGameNotification) {
          window.showGameNotification('🌿 Full Restoration: Health & Photosynthesis Maximized!');
        }
        this.closeShrineModal();
      };
    } else {
      body.innerHTML = `
        <p style="margin: 0 0 12px 0;"><b>Sanctum Trial:</b> ${shrine.description}</p>
        <p style="margin: 0; color: #a7f3d0;">Are you prepared to face the Zonai trials and claim your Light of Blessing?</p>
      `;
      rewardsBox.style.display = 'none';
      actionBtn.textContent = shrine.activated ? 'Complete Sanctum Trial' : 'Activate Shrine & Enter';
      actionBtn.onclick = () => {
        this.completeShrineTrial(shrine, player);
      };
    }

    audio.playShrineChime?.();
  }

  completeShrineTrial(shrine, player) {
    shrine.activated = true;
    shrine.completed = true;

    // Visual changes on shrine mesh
    shrine.pointLight.color.setHex(0xfacc15); // Golden glow
    shrine.spiralGroup.children.forEach(c => {
      if (c.material) c.material.color.setHex(0xfde047);
    });

    // Grant blessing
    player.inventory.lightsOfBlessing = (player.inventory.lightsOfBlessing || 0) + 1;
    player.barkHp = player.maxBarkHp;
    player.photosynthesis = player.maxPhotosynthesis;

    audio.playCosmicSlam?.();
    audio.playShrineChime?.();
    this.engine.spawnCosmicBurst(shrine.meshGroup.position, 60);
    this.engine.applyScreenShake(0.6);

    const rewardsBox = document.getElementById('shrine-rewards-box');
    const actionBtn = document.getElementById('shrine-action-btn');
    rewardsBox.style.display = 'block';
    actionBtn.textContent = 'Claim Blessing & Depart';
    actionBtn.onclick = () => {
      this.closeShrineModal();
    };

    if (window.showGameNotification) {
      window.showGameNotification(`✨ ${shrine.name} CONQUERED! Received Light of Blessing! (${player.inventory.lightsOfBlessing} in possession)`);
    }
  }

  openGoddessModal(player) {
    const modal = document.getElementById('shrine-modal');
    if (!modal) return;

    this.activeShrineModal = { isGoddess: true };
    modal.style.display = 'flex';

    document.getElementById('shrine-vortex-icon').textContent = '🕊️';
    document.getElementById('shrine-title').textContent = 'Goddess Hylia Statue';
    document.getElementById('shrine-subtitle').textContent = 'Sacred Altar of Blessings';

    const blessings = player.inventory.lightsOfBlessing || 0;
    const body = document.getElementById('shrine-body');
    const rewardsBox = document.getElementById('shrine-rewards-box');
    rewardsBox.style.display = 'none';

    body.innerHTML = `
      <p style="margin: 0 0 12px 0;"><i>"Noble Evermean protector of the woods... You who have conquered the Zonai shrines and obtained the sacred Lights of Blessing."</i></p>
      <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #facc15;">
        You currently possess: <b style="color: #fde047; font-size: 18px;">${blessings}</b> Light${blessings === 1 ? '' : 's'} of Blessing.
      </div>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">Offer 1 Light of Blessing to receive either a Heart Vessel (+30 Max Bark HP) or a Stamina Vessel (+25 Max Stamina).</p>
    `;

    const actionBtn = document.getElementById('shrine-action-btn');
    if (blessings >= 1) {
      actionBtn.textContent = 'Exchange: +30 Max Bark HP';
      actionBtn.style.display = 'inline-block';
      actionBtn.onclick = () => {
        player.inventory.lightsOfBlessing--;
        player.maxBarkHp += 30;
        player.barkHp = player.maxBarkHp;
        audio.playCosmicSlam?.();
        this.engine.spawnCosmicBurst(player.position, 40);
        if (window.showGameNotification) {
          window.showGameNotification('💖 Max Bark HP increased by +30!');
        }
        this.closeShrineModal();
      };

      // Add secondary Stamina button
      const departBtn = document.getElementById('shrine-close-btn');
      departBtn.textContent = 'Exchange: +25 Max Stamina';
      departBtn.style.color = '#34d399';
      departBtn.onclick = () => {
        player.inventory.lightsOfBlessing--;
        player.maxStamina += 25;
        player.stamina = player.maxStamina;
        audio.playCosmicSlam?.();
        this.engine.spawnCosmicBurst(player.position, 40);
        if (window.showGameNotification) {
          window.showGameNotification('⚡ Max Stamina increased by +25!');
        }
        this.closeShrineModal();
      };
    } else {
      actionBtn.textContent = 'Seek More Shrines';
      actionBtn.onclick = () => this.closeShrineModal();
      const departBtn = document.getElementById('shrine-close-btn');
      departBtn.textContent = 'Depart';
      departBtn.style.color = '#94a3b8';
      departBtn.onclick = () => this.closeShrineModal();
    }
  }

  closeShrineModal() {
    const modal = document.getElementById('shrine-modal');
    if (modal) modal.style.display = 'none';
    this.activeShrineModal = null;
    const departBtn = document.getElementById('shrine-close-btn');
    if (departBtn) {
      departBtn.textContent = 'Depart';
      departBtn.style.color = '#94a3b8';
      departBtn.onclick = () => this.closeShrineModal();
    }
    const icon = document.getElementById('shrine-vortex-icon');
    if (icon) icon.textContent = '🌀';
  }
}
