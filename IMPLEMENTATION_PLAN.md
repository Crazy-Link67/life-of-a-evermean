# Overhaul: Realistic 3D Graphics, High-Detail Animated Creatures, and Expanded Gameplay

Transform *Life of an Evermean* into a visually stunning, immersive 3D Zelda-inspired ecosystem with realistic environment rendering, expressive creature models, and deep gameplay mechanics.

---

## 1. Graphics & Visual Realism Overhaul

### Current Limitations:
- Flat vertex colors on terrain with no tactile texture, normal variation, or ground detail.
- Static, flat water plane without waves, shoreline foam, or specular reflections.
- Flat sky background with simple fog; sun and moon are basic single-color spheres.
- Trees and foliage use flat-shaded low-poly blocks without leaf variety, ambient occlusion, or wind sway.

### Proposed Graphical Enhancements:
1. **Procedural PBR Texturing System**:
   - Create a lightweight procedural texture generator module (`src/core/TextureGenerator.js`) creating:
     - **Rich Woodland Terrain Texture**: Grass blades, moss patches, pebble-strewn dirt, and river mud normal maps.
     - **Tree Bark Texture**: Deep gnarled ridges, lichen spots, and tactile bump maps for all Evermean presets and forest trees.
     - **Foliage Leaf Texture**: Translucent leaf veins with roughness variation for realistic light penetration.
2. **Realistic Animated Water Shader**:
   - Upgrade river and lake water with multi-layered wave displacement, dynamic caustic highlights, Fresnel depth opacity, and animated white-water shoreline foam.
3. **Atmospheric Sky & Hemispheric Lighting**:
   - Replace flat sky background with a multi-stop atmospheric gradient dome that transitions dynamically (golden dawn, crisp midday cerulean, burning sunset orange/purple, deep starry twilight).
   - Add realistic Sun/Moon glow halos and soft ambient bounce light (`HemisphereLight` simulating sky bounce vs ground bounce).
4. **Instanced 3D Grass & Flower Tufts**:
   - Scatter thousands of instanced wind-blown 3D grass clusters, clover patches, and blooming wildflowers across the forest floor with gentle wind oscillation.

---

## 2. Creature Visuals & Animation Remodel

### Current Limitations:
- Woodcutter Goblins are simple cylinders and spheres without eyes, clothing detail, facial expression, or walk cycles.
- Beaverfolk are simple oblong shapes without paws, facial snouts, whiskers, or animated swimming strokes.

### Proposed Remodels & New Creatures:
1. **Woodcutter Goblin (Bokoblin-inspired) Overhaul**:
   - **Detailed Anatomy**: Menacing glowing yellow eyes, sculpted snout with tusks, curved goblin ears with metal ring piercings, spiked leather shoulder armor, woven rope belt, and wrapped arm bracers.
   - **Weapon Details**: Notched iron woodcutter axe with chipped blade and wrapped grip, and a wooden buckler shield.
   - **Dynamic Animations**: Fluid walk/sprint cycle with swinging arms, axe-ready alert stance, anticipation wind-up before chops, and recoil when hit.
2. **River Beaverfolk Overhaul**:
   - **Detailed Anatomy**: Soft textured pelt, detailed snout with prominent white chisel teeth, dark twitching nose, round ears, paddle tail with scaled cross-hatch texture, and webbed paws.
   - **Animations**: Realistic waddling land gait, smooth aquatic diving and surface swimming with ripples behind the paddle tail.
3. **New Creature: Korok Forest Spirits**:
   - Charming leafy creatures with leaf-face masks (oak leaf, maple leaf, ginkgo leaf), wooden twig bodies, stitched backpacks, and spinning propeller sprouts.
   - Playful idle bounces, joyful giggles when discovered, and magical sparkle dust trails.
4. **New Creature: Woodland Forest Elk / Deer**:
   - Elegant passive forest wildlife with velvet antlers that graze peacefully in clearings and dart away if the player moves abruptly while not disguised as a tree.

---

## 3. Gameplay Expansion ("More Things to Do")

### Current Limitations:
- Gameplay consists primarily of wandering, slamming normal trees for wood, slamming goblins, and placing basic structures.

### New Gameplay Systems:
1. **Korok Puzzles & Seed Collection**:
   - Hidden across the world: swirling autumn leaf rings in lakes, suspicious rock circles, and fluttering pinwheels on high hilltops.
   - Discovering and solving these reveals a Korok who gifts you **Korok Seeds** and **Forest Essences**.
2. **Ambush & Sneak-Strike Mechanic**:
   - Evermeans in Zelda are disguise predators. When rooted (`R`) or standing still in disguise near normal trees, passing Woodcutters are oblivious.
   - Attacking from disguise triggers a **Sneak-Strike Ambush (3x Critical Damage)** with camera impact and flying wood chips!
3. **Acorn Ranged Slingshot / Spore Volley**:
   - Press **Right Click** (or on-screen Aim button on mobile) to fire gathered acorns or explosive fungal spores as ranged projectiles against distant woodcutters or to pop high Korok targets.
4. **Goblin Raids & Grove Defense**:
   - Every 2–3 days (or triggered during a Blood Moon night), the Woodcutter Camp launches a raiding party to chop down your Grove structures.
   - Defend your colony using your Evermean powers and newly built defenses!
5. **New Grove Buildings & Defenses in `EvermeanColony.js`**:
   - **Spore Sentry Turret**: Shoots piercing thorn darts at approaching woodcutter goblins.
   - **Spirit Hollow / Korok Nursery**: Housing for rescued forest spirits who automatically forage nearby dew, wood, and seeds.
   - **Beaverfolk Trading Post**: River dock where friendly beavers trade rare stardust, ancient sap, and unique seeds for lumber.
6. **Milestone Objectives & Lore Tracker**:
   - Dynamic quest tracker in the HUD showing goals (e.g., "Find 3 Hidden Koroks", "Repel the Woodcutter Encroachment", "Evolve into Elder Warden", "Construct a Spore Turret").

---

## Proposed File Changes

### Core Graphics & Shaders
- `src/core/TextureGenerator.js`: Procedural canvas generators for bark normals/diffuse, terrain PBR textures, leaf translucency, and grass textures.
- `src/core/Engine.js`: Add hemisphere bounce lighting, sky gradient dome, improved shadow bias/cascades, and screen effects.
- `src/world/WorldTerrain.js`: Apply procedural terrain PBR detail textures, normal maps, and dynamic animated water shader with shoreline foam.
- `src/world/Environment.js`: Instanced 3D grass clusters, blooming wildflowers, swaying reeds, and interactive puzzle elements (Korok leaf rings, rock circles).

### Creature Models & AI
- `src/entities/CreatureVillagers.js`: Remodel Woodcutter Goblins, Beaverfolk, add Korok Forest Spirits and Forest Elk/Deer, and implement Goblin colony raid AI events.

### Player & Gameplay Systems
- `src/entities/PlayerEvermean.js`: Add Acorn Slingshot / Ranged projectile firing, Sneak-Strike Ambush damage, and Korok seed inventory.
- `src/entities/EvermeanColony.js`: Add Spore Turret, Spirit Hollow, and Beaver Trading Post buildings, plus raid defense mechanics.
- `src/ui/HUD.js`: Add Ranged Aim reticle, Korok Seed counter, Quest / Objectives tracker, and Ambush indicator.

