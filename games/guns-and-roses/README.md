# Guns & Roses - Combat Arena

A multiplayer wave-based arena combat game with Monafuku as the playable character.

## Game Features Implemented

### Core Mechanics
- ✅ Solo and multiplayer modes
- ✅ Multisynq session integration (waiting room, lobby management)
- ✅ 10-wave progression system
- ✅ Enemy spawning with increasing difficulty per wave
- ✅ Boss encounters after enemy waves cleared
- ✅ Player HP: 10 base, regenerates 1 HP every 10 seconds
- ✅ Wave clear: Full HP recovery + 5-second countdown to next wave
- ✅ Solo mode ends when player dies

### Combat System
- ✅ Click-to-fire shooting mechanics
- ✅ Three weapon types: Pistol (20 ammo), Machine Gun (200 ammo), Flamethrower (20 gas, -2 per use)
- ✅ Enemy bloom effect after 10 seconds of spawning
- ✅ Enemy seed bullet attacks (1 HP damage, 3-second interval)
- ✅ Boss bullets from Wave 5 deal 2 HP damage
- ✅ Friendly fire disabled (bullets don't damage allies)
- ✅ Weapon drops from boss (random: Flamethrower or Machine Gun)

### Items & Pickups
- ✅ Ammo drops from defeated enemies (default pistol ammo only)
- ✅ Medical kits from Wave 5 enemies (full HP recovery)
- ✅ Auto-pickup when player is adjacent to items
- ✅ Items despawn after 5 seconds if not collected
- ✅ Medical kits not picked up if HP is full

### Score & Leaderboard
- ✅ Kill tracking: 1 point per enemy, 2 points per boss, +1 per wave after Wave 5
- ✅ Multiplayer leaderboard (ranked by kills)
- ✅ Solo mode: Player name and kill count only (no ranking)
- ✅ End-game podium: Top 3 players displayed
- ✅ 30-second auto-exit or manual exit from end screen

### UI/UX
- ✅ Leaderboard sidebar in multiplayer
- ✅ Exit button (top left)
- ✅ Wave counter
- ✅ Health bar with numeric display
- ✅ Weapon and ammo display
- ✅ Player controls: WASD or Arrow keys to move, Click to shoot
- ✅ Waiting room for multiplayer setup

## Game Balance (Configurable)

**Waves/Enemies:**
- Wave 1: 15 enemies + boss (HP: 20)
- Each wave: +5 enemies, boss HP +5
- Boss becomes progressively faster and stronger

**Player Progression:**
- Starting HP: 10
- Regen: 1 HP every 10 seconds
- Wave clear full restore
- Weapon variety for strategic depth

**Enemy Behavior:**
- Spawn at map perimeter, walk toward nearest player
- Bloom (gain shoot ability) after 10 seconds
- Fire seed bullets at 3-second interval
- Removed enemies drop ammo

## Assets & Customization

### Integrated Graphics ✅
- **Player avatar:** Monafuku sprite sheet (4 animation rows × 4 frames each = 256×320px)
  - Row 1: Walk animation
  - Row 2: Jump animation (available for future use)
  - Row 3: Shoot animation (triggers on fire)
  - Row 4: Get Hurt animation (triggers when damaged)
- **Game board floor:** Grass texture (tiled seamlessly)
- **Bullet sprite:** Used when player shoots (auto-rotates to face direction)
  - Size: 24×16px per frame
  - Source: Bullet.png first row (top-left frame)

### Sprite Animation Logic ✅
- **Walk:** Plays when moving (WASD/Arrow keys)
- **Shoot:** Shows frame 3 when firing (300ms duration)
- **Hurt:** Animates on damage taken (500ms flashback)
- **Idle:** Frame 1 (standing still)
- Each frame displays for ~100ms, creating smooth 4-frame loops

### To Add More Assets:
1. **Enemy sprites (Soilder.png):** Ready in assets folder, add rendering to updateGameDisplay
2. **Boss sprites (Boss.png):** Ready in assets folder, integrate similar to player sprite
3. **Explosion effects:** Use rows 2-4 from Bullet.png for impact/hit effects
4. **Weapon effects:** Add muzzle flash, trails, flame FX
5. **UI graphics:** Weapon icons, ammo display, health icons

## Multisynq Integration

- API Key: Configured in `script.js` (line 31)
- App ID: `love-idol-agency.guns-and-roses`
- Session model/view: `GarModel` and `GarView` (stubs ready for expansion)
- Rooms support custom IDs and passwords
- Game-started blocking: Ready to implement (check session state in waiting room)

## Next Steps & Features to Add

1. **Teleportation Spawn Animation:** Visual teleport effect with lightning particles when players spawn
2. **Game-Started Blocking:** Prevent late joins after wave 1 begins (show "Game Started" message)
3. **Dead Player Spectating:** Allow dead players to switch view between alive teammates
4. **Enhanced Enemy AI:** Cone of vision, fleeing behavior, swarm tactics
5. **Special Weapons Visuals:** Fire trails for flamethrower, muzzle flashes for machine gun
6. **Sound Effects:** Wave alerts, gunfire, enemy spawn/death, victory/defeat
7. **Full Multisynq Sync:** Player position/state sharing, synchronized wave progression
8. **Weapon Selection UI:** Pre-game loadout customization
9. **Map Variety:** Multiple arena layouts with obstacles
10. **Difficulty Modifiers:** Hard mode, custom wave counts, boss scaling
11. **Daily Challenges:** Bonus waves, limited ammo runs, modifier combinations
12. **Cosmetics:** Character skins, weapon skins, effects
13. **Tutorial/Onboarding:** Guided first wave explaining mechanics

## File Structure
```
games/guns-and-roses/
├── index.html         (UI, menus, game board)
├── script.js          (Game logic, Multisynq integration, mechanics)
├── assets/            (Player/enemy sprites, UI graphics - add here as created)
└── README.md          (This file)
```

## Debug Console Commands

To test gameplay quickly, open browser console and run:
```javascript
// Start solo game
startSoloGame();

// Instantly clear current wave
gameState.enemies = [];
gameState.boss = null;

// Give player max ammo
playerData.ammo = 999;

// Jump to wave 5
gameState.wave = 5;
startWave();

// Check current state
console.log(gameState, playerData);
```

---
**Version 0.1.0** - Beta Foundation Ready for Asset Integration and Polish
