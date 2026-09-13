import { accountSystem } from './AccountSystem.js';

// Campaign Story Mode Manager
// Delivers 5 narrative story chapters with objectives, cinematic dialogue, and progression
export class CampaignManager {
  constructor() {
    this.isActive = false;
    this.currentChapter = 1;
    this.chapters = [
      {
        id: 1,
        title: 'Chapter 1: The Great Awakening',
        intro: 'For decades, you stood as a silent tree in the Hyrule forest. Now, the ancient earth pulses—awake, uproot, and claim your destiny!',
        objectives: [
          { id: 'c1_break_camo', text: 'Break out of camouflage and take your first steps', done: false },
          { id: 'c1_harvest_wood', text: 'Harvest 25 Wood from ordinary forest trees', done: false },
          { id: 'c1_defeat_scout', text: 'Defeat 1 Woodcutter Goblin scout with a Head-Slam', done: false }
        ],
        reward: { biomass: 60, title: 'Grove Sprout' }
      },
      {
        id: 2,
        title: 'Chapter 2: The Beaver River Alliance',
        intro: 'The river Beaverfolk are being harassed by woodcutter goblin axes. Travel down the river and forge a pact!',
        objectives: [
          { id: 'c2_reach_village', text: 'Reach the Beaverfolk Stilt Village (-28, 25)', done: false },
          { id: 'c2_swim_river', text: 'Paddle and swim across the river waters', done: false },
          { id: 'c2_build_basin', text: 'Construct a Grove Sap Basin near the water', done: false }
        ],
        reward: { biomass: 100, acorns: 15, title: 'River Guardian' }
      },
      {
        id: 3,
        title: 'Chapter 3: Rise of the Sacred Grove',
        intro: 'Your roots yearn for permanent civilization. Plant the Heart Tree and assemble the sacred grove sanctuary.',
        objectives: [
          { id: 'c3_solve_korok', text: 'Solve a Korok forest puzzle and rescue a spirit', done: false },
          { id: 'c3_build_heart_tree', text: 'Construct the monumental Heart Tree of the Grove', done: false },
          { id: 'c3_deploy_turret', text: 'Build a Living Spore Sentry to defend your grove', done: false }
        ],
        reward: { biomass: 150, stardust: 1, title: 'Grove Architect' }
      },
      {
        id: 4,
        title: 'Chapter 4: Assault on Woodcutter Fortress',
        intro: 'The Woodcutter Goblins have established a fortified palisade outpost. Infiltrate under camouflage and strike!',
        objectives: [
          { id: 'c4_infiltrate_camp', text: 'Infiltrate the Goblin Encampment (65, -40)', done: false },
          { id: 'c4_sneak_strike', text: 'Land an Ambush Sneak-Strike from disguise (3x Crit)', done: false },
          { id: 'c4_defeat_captain', text: 'Defeat the armored Goblin Captain', done: false }
        ],
        reward: { biomass: 200, wood: 50, title: 'Bane of Woodcutters' }
      },
      {
        id: 5,
        title: 'Chapter 5: Ascension into the Stars',
        intro: 'A cosmic meteor shower illuminates the night sky. Channel starlight and evolve into the legendary Cosmic Evermean!',
        objectives: [
          { id: 'c5_collect_star', text: 'Absorb a fallen Cosmic Stardust fragment at night', done: false },
          { id: 'c5_build_monolith', text: 'Construct the Starlight Monolith', done: false },
          { id: 'c5_ascend', text: 'Achieve Ascension to Stage 5: Cosmic Evermean', done: false }
        ],
        reward: { biomass: 300, stardust: 5, title: 'Ascended Cosmic Evermean' }
      }
    ];

    this.onChapterUpdateCallbacks = [];
  }

  startCampaign(chapterNum = 1) {
    this.isActive = true;
    this.currentChapter = Math.max(1, Math.min(this.chapters.length, chapterNum));
    const ch = this.getCurrentChapterData();
    ch.objectives.forEach((o) => (o.done = false));

    if (window.showGameNotification) {
      window.showGameNotification(`📜 ${ch.title}: ${ch.intro}`);
    }

    this.notifyUpdate();
  }

  stopCampaign() {
    this.isActive = false;
    this.notifyUpdate();
  }

  getCurrentChapterData() {
    return this.chapters[this.currentChapter - 1] || this.chapters[0];
  }

  // Complete a specific objective
  completeObjective(objId, player, audio) {
    if (!this.isActive) return;

    const ch = this.getCurrentChapterData();
    const obj = ch.objectives.find((o) => o.id === objId);
    if (obj && !obj.done) {
      obj.done = true;
      if (audio && audio.playPhotosynthesis) audio.playPhotosynthesis();
      if (window.showGameNotification) {
        window.showGameNotification(`✨ Objective Complete: ${obj.text}!`);
      }

      // Check if all chapter objectives are done
      if (ch.objectives.every((o) => o.done)) {
        this.advanceChapter(player);
      } else {
        this.notifyUpdate();
      }
    }
  }

  advanceChapter(player) {
    const ch = this.getCurrentChapterData();
    if (player && ch.reward) {
      if (ch.reward.biomass) player.soilBiomass += ch.reward.biomass;
      if (ch.reward.wood) player.inventory.wood += ch.reward.wood;
      if (ch.reward.acorns) player.inventory.acorns += ch.reward.acorns;
      if (ch.reward.stardust) player.inventory.stardust += ch.reward.stardust;
    }

    // Update account progress
    accountSystem.getProfile().campaign.unlockedChapter = Math.max(
      accountSystem.getProfile().campaign.unlockedChapter,
      this.currentChapter + 1
    );
    accountSystem.saveToStorage();

    if (window.showGameNotification) {
      window.showGameNotification(`🎉 CHAPTER COMPLETE! ${ch.title} Cleared! Reward: ${ch.reward.title}`);
    }

    if (this.currentChapter < this.chapters.length) {
      this.currentChapter++;
      const nextCh = this.getCurrentChapterData();
      nextCh.objectives.forEach((o) => (o.done = false));
      setTimeout(() => {
        if (window.showGameNotification) {
          window.showGameNotification(`📜 ${nextCh.title}: ${nextCh.intro}`);
        }
      }, 4000);
    } else {
      if (window.showGameNotification) {
        window.showGameNotification(`🌟 CAMPAIGN CONQUERED! You have ascended as the eternal ruler of the forest!`);
      }
    }

    this.notifyUpdate();
  }

  onUpdate(callback) {
    this.onChapterUpdateCallbacks.push(callback);
  }

  notifyUpdate() {
    this.onChapterUpdateCallbacks.forEach((cb) => cb(this.isActive, this.getCurrentChapterData()));
  }
}

export const campaign = new CampaignManager();

