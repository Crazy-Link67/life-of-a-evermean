// Complete Save, Load, Export, Import, and Settings Management System

const SAVE_KEY_PREFIX = 'evermean_save_';
const SETTINGS_KEY = 'evermean_settings';
const DEFAULT_SLOTS = ['autosave', 'slot1', 'slot2', 'slot3'];

export class SaveSystem {
  constructor() {
    this.currentSlot = 'autosave';
  }

  // Get all save metadata for the Load menu
  listSaves() {
    const saves = [];
    DEFAULT_SLOTS.forEach(slotId => {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + slotId);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          saves.push({
            slotId,
            isEmpty: false,
            timestamp: data.timestamp,
            day: data.growth?.day || 1,
            stageName: data.growth?.stageName || 'Sprout',
            speciesName: data.species?.name || 'Oak Evermean',
            barkColor: data.species?.customization?.barkColor || '#5c4033',
            foliageColor: data.species?.customization?.foliageColor || '#2e8b57',
            playTimeMinutes: Math.floor((data.playTime || 0) / 60)
          });
        } catch (e) {
          saves.push({ slotId, isEmpty: true });
        }
      } else {
        saves.push({ slotId, isEmpty: true });
      }
    });
    return saves;
  }

  // Check if any save exists (for Continue button)
  hasAnySave() {
    const list = this.listSaves();
    return list.some(s => !s.isEmpty);
  }

  // Get the most recently saved slot
  getLatestSaveSlot() {
    const list = this.listSaves().filter(s => !s.isEmpty);
    if (list.length === 0) return null;
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list[0].slotId;
  }

  // Save game to a specific slot
  saveGame(slotId = this.currentSlot, gameState) {
    if (!slotId) slotId = 'autosave';
    this.currentSlot = slotId;

    const dataToSave = {
      version: 1,
      timestamp: Date.now(),
      slotId,
      ...gameState
    };

    try {
      localStorage.setItem(SAVE_KEY_PREFIX + slotId, JSON.stringify(dataToSave));
      return { success: true, slotId };
    } catch (err) {
      console.error('Failed to save game:', err);
      return { success: false, error: err.message };
    }
  }

  // Load game from a specific slot
  loadGame(slotId) {
    if (!slotId) slotId = this.getLatestSaveSlot() || 'autosave';
    const raw = localStorage.getItem(SAVE_KEY_PREFIX + slotId);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw);
      this.currentSlot = slotId;
      return data;
    } catch (err) {
      console.error('Corrupted save data:', err);
      return null;
    }
  }

  // Export save data as a downloadable .json file
  exportSave(slotId = this.currentSlot) {
    const save = this.loadGame(slotId);
    if (!save) {
      alert('No save data found in this slot to export.');
      return false;
    }

    const species = save.species?.name || 'Evermean';
    const day = save.growth?.day || 1;
    const filename = `Evermean_Day${day}_${species.replace(/\s+/g, '_')}_${slotId}.json`;

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(save, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  }

  // Import save data from JSON text or File
  importSave(jsonString, targetSlot = 'slot1') {
    try {
      const data = JSON.parse(jsonString);
      if (!data.growth || !data.species) {
        throw new Error('Invalid Evermean save format: missing core survival data.');
      }
      data.slotId = targetSlot;
      data.timestamp = Date.now();
      localStorage.setItem(SAVE_KEY_PREFIX + targetSlot, JSON.stringify(data));
      this.currentSlot = targetSlot;
      return { success: true, data, slotId: targetSlot };
    } catch (err) {
      console.error('Failed to import save:', err);
      return { success: false, error: err.message };
    }
  }

  // Load and save player settings
  getSettings() {
    const defaultSettings = {
      fov: 75,
      renderDistance: 220,
      shadows: true,
      bloom: true,
      mouseSensitivity: 1.0,
      invertY: false,
      masterVolume: 0.8,
      sfxVolume: 0.9,
      ambientVolume: 0.6,
      musicVolume: 0.5,
      dayLengthMinutes: 10,
      difficulty: 'normal' // peaceful, normal, savage
    };

    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(raw) };
    } catch (e) {
      return defaultSettings;
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const saveSystem = new SaveSystem();

