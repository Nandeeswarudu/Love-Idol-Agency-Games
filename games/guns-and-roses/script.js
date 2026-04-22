const menuScreen = document.getElementById("menuScreen");
const playMenu = document.getElementById("playMenu");
const createRoomScreen = document.getElementById("createRoomScreen");
const enterRoomScreen = document.getElementById("enterRoomScreen");
const waitingRoomScreen = document.getElementById("waitingRoomScreen");
const gameScreen = document.getElementById("gameScreen");
const endGameScreen = document.getElementById("endGameScreen");
const botNameScreen = document.getElementById("botNameScreen");

const createRoomNameInput = document.getElementById("createRoomName");
const createRoomPasswordInput = document.getElementById("createRoomPassword");
const enterRoomNameInput = document.getElementById("enterRoomName");
const enterRoomPasswordInput = document.getElementById("enterRoomPassword");
const botPlayerNameInput = document.getElementById("botPlayerNameInput");

const gameBoard = document.getElementById("gameBoard");
const waveCounter = document.getElementById("waveCounter");
const playerStats = document.getElementById("playerStats");
const leaderboardList = document.getElementById("leaderboardList");
const gameLeaderboardSidebar = document.getElementById("gameleaderboard");
const waveCountdownOverlay = document.getElementById("waveCountdownOverlay");
const healthFill = document.getElementById("healthFill");
const healthText = document.getElementById("healthText");
const weaponDisplay = document.getElementById("weaponDisplay");
const ammoDisplay = document.getElementById("ammoDisplay");
const ammoType = document.getElementById("ammoType");
const podiumList = document.getElementById("podiumList");
const endGameTimer = document.getElementById("endGameTimer");
const waitingRoomStatus = document.getElementById("waitingRoomStatus");
const waitingArenaId = document.getElementById("waitingArenaId");
const waitingPlayerCount = document.getElementById("waitingPlayerCount");
const waitingPlayerName = document.getElementById("waitingPlayerName");
const waitingGameStatus = document.getElementById("waitingGameStatus");

const MULTISYNQ_API_KEY = "2K41cE6ZiuL3ZlbSpnLNecbuDwojRN4e23o7NRVThV";
const APP_ID = "love-idol-agency.guns-and-roses";
const DEFAULT_PASSWORD = "gar2026";

const GAME_CONFIG = {
  MAX_WAVES: 10,
  INITIAL_ENEMIES: 15,
  ENEMIES_PER_WAVE: 5,
  INITIAL_BOSS_HP: 20,
  BOSS_HP_INCREMENT: 5,
  PLAYER_START_HP: 50,
  PLAYER_START_AMMO: 20,
  HP_REGEN_INTERVAL: 10000,
  HP_REGEN_AMOUNT: 1,
  WAVE_START_DELAY: 3500,
  WAVE_CLEAR_DELAY: 5000,
  ENEMY_BLOOM_DELAY: 30000,
  ENEMY_SHOOT_INTERVAL: 3000,
  ITEM_DESPAWN_TIME: 5000,
  BOARD_WIDTH: 1200,
  BOARD_HEIGHT: 675,
};

// Debug toggle: set false to restore normal enemy-first wave flow.
const DEBUG_BOSS_FIRST = false;

let gameMode = "solo";
let currentSession = null;
let localPlayerId = `player-${Math.random().toString(36).slice(2, 8)}`;
let lastFrameTime = 0;
let gameState = null;

const keysPressed = {
  w: false,
  a: false,
  s: false,
  d: false,
  arrowup: false,
  arrowdown: false,
  arrowleft: false,
  arrowright: false,
};

const MOVEMENT_CONFIG = {
  SPEED: 2,
  DIAGONAL_REDUCTION: 0.7,
};

const AI_CONFIG = {
  ENEMY_MOVE_SPEED: 0.5,
  BOSS_MOVE_SPEED: 0.7,
  BOSS_CHASE_STOP_RANGE: 40,
  BOSS_MELEE_RANGE: 70,
  BOSS_MELEE_COOLDOWN: 1100,
  BOSS_RANGED_COOLDOWN: GAME_CONFIG.ENEMY_SHOOT_INTERVAL,
  BOSS_MELEE_HIT_FRAME: 2,
  BOSS_DEATH_HOLD_MS: 1800,
  BOSS_DEATH_FRAME_RATE: 140,
};

let playerData = {
  id: localPlayerId,
  name: "Player",
  hp: GAME_CONFIG.PLAYER_START_HP,
  maxHp: GAME_CONFIG.PLAYER_START_HP,
  x: 0,
  y: 0,
  kills: 0,
  weapon: "pistol",
  ammo: GAME_CONFIG.PLAYER_START_AMMO,
  alive: false,
  score: 0,
  spriteAnimationFrame: 0,
  spriteAnimationRow: 0,
  spriteState: "idle",
  lastMoveTime: Date.now(),
  lastShootTime: 0,
  lastHurtTime: 0,
  lastSpriteUpdate: 0,
  facing: 1,
};

let waveData = {
  current: 0,
  started: false,
  enemies: [],
  boss: null,
  enemiesCleared: false,
  cleared: false,
};

let projectiles = [];
let pickupItems = [];
let leaderboardPlayers = [];

const WEAPONS = {
  pistol: { name: "Pistol", maxAmmo: 20, fireRate: 100 },
  flamethrower: { name: "Flamethrower", maxAmmo: 20, fireRate: 50, consumePerShot: 2 },
  machinegun: { name: "Machine Gun", maxAmmo: 200, fireRate: 50 },
};

const SPRITE_CONFIG = {
  FRAME_WIDTH: 64,
  FRAME_HEIGHT: 80,
  SHEET_WIDTH: 256,
  SHEET_HEIGHT: 320,
  COLS: 4,
  ROWS: 4,
  FRAME_RATE: 150,
  SPRITE_ROWS: {
    walk: 0,
    jump: 1,
    shoot: 2,
    hurt: 3,
  },
};

const ENEMY_SPRITE_CONFIG = {
  SHEET_WIDTH: 612,
  SHEET_HEIGHT: 408,
  SOURCE_OFFSET_X: 91,
  SOURCE_OFFSET_Y: 37,
  SOURCE_FRAME_WIDTH: 84,
  SOURCE_FRAME_HEIGHT: 70,
  COLS: 5,
  ROWS: 5,
  FRAME_RATE: 120,
  SPRITE_ROWS: {
    walk: 0,
    attack: 1,
    death: 4,
  },
};
ENEMY_SPRITE_CONFIG.FRAME_WIDTH = ENEMY_SPRITE_CONFIG.SOURCE_FRAME_WIDTH;
ENEMY_SPRITE_CONFIG.FRAME_HEIGHT = ENEMY_SPRITE_CONFIG.SOURCE_FRAME_HEIGHT;

const BOSS_SPRITE_CONFIG = {
  SHEET_WIDTH: 612,
  SHEET_HEIGHT: 408,
  COLS: 4,
  ROWS: 4,
  SOURCE_OFFSET_X: 0,
  SOURCE_OFFSET_Y: 0,
  CELL_WIDTH: 153,
  CELL_HEIGHT: 102,
  // New sheet is cleanly packed; no inset needed.
  CROP_INSET_X: 0,
  CROP_INSET_Y: 0,
  DISPLAY_SCALE: 0.62,
  FRAME_RATE: 110,
  SPRITE_ROWS: {
    walk: 0,   // row 1
    attack: 1, // row 2
    death: 3,  // row 4
  },
  FRAMES: {
    walk: 4,
    attack: 4,
    death: 4,
  },
  FRAME_SEQUENCE: {
    walk: [0, 1, 2, 3],
    // Skip col 1 in attack (wide detached projectile burst looks like frame bleed).
    attack: [0, 2, 3, 2],
    death: [0, 1, 2, 3],
  },
  // Make death clearly readable: row 3 transition, then row 4 collapse.
  DEATH_SEQUENCE: [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 3, col: 0 },
    { row: 3, col: 1 },
    { row: 3, col: 2 },
    { row: 3, col: 3 },
  ],
};
BOSS_SPRITE_CONFIG.FRAME_WIDTH = Math.max(1, BOSS_SPRITE_CONFIG.CELL_WIDTH - BOSS_SPRITE_CONFIG.CROP_INSET_X * 2);
BOSS_SPRITE_CONFIG.FRAME_HEIGHT = Math.max(1, BOSS_SPRITE_CONFIG.CELL_HEIGHT - BOSS_SPRITE_CONFIG.CROP_INSET_Y * 2);

const BULLET_CONFIG = {
  FRAME_WIDTH: 48,
  FRAME_HEIGHT: 32,
  SHEET_WIDTH: 192,
  SHEET_HEIGHT: 160,
  COLS: 4,
  ROWS: 5,
};

const bossSpriteImage = new Image();
bossSpriteImage.src = "assets/Boss.png";

function getPlayerSpritePosition() {
  const col = playerData.spriteAnimationFrame % SPRITE_CONFIG.COLS;
  const row = playerData.spriteAnimationRow;
  const x = Math.round(col * SPRITE_CONFIG.FRAME_WIDTH);
  const y = Math.round(row * SPRITE_CONFIG.FRAME_HEIGHT);
  return { x, y };
}

function getBulletSpritePosition(frameIndex = 0) {
  const scaleFactor = 0.5;
  const col = frameIndex % BULLET_CONFIG.COLS;
  const row = 0;
  const x = col * BULLET_CONFIG.FRAME_WIDTH * scaleFactor;
  const y = row * BULLET_CONFIG.FRAME_HEIGHT * scaleFactor;
  return { x, y };
}

function getEnemySpritePosition(enemy) {
  const col = enemy.spriteAnimationFrame % ENEMY_SPRITE_CONFIG.COLS;
  const row = enemy.spriteAnimationRow;
  const x = ENEMY_SPRITE_CONFIG.SOURCE_OFFSET_X + col * ENEMY_SPRITE_CONFIG.SOURCE_FRAME_WIDTH;
  const y = ENEMY_SPRITE_CONFIG.SOURCE_OFFSET_Y + row * ENEMY_SPRITE_CONFIG.SOURCE_FRAME_HEIGHT;
  return { x, y };
}

function getBossSpritePosition(boss) {
  let safeFrame = 0;
  let row = BOSS_SPRITE_CONFIG.SPRITE_ROWS[boss.state] ?? BOSS_SPRITE_CONFIG.SPRITE_ROWS.walk;

  if (boss.state === "dead" && Array.isArray(BOSS_SPRITE_CONFIG.DEATH_SEQUENCE) && BOSS_SPRITE_CONFIG.DEATH_SEQUENCE.length > 0) {
    const deathIndex = Math.min(boss.spriteAnimationFrame, BOSS_SPRITE_CONFIG.DEATH_SEQUENCE.length - 1);
    const deathFrame = BOSS_SPRITE_CONFIG.DEATH_SEQUENCE[deathIndex];
    row = deathFrame.row;
    safeFrame = deathFrame.col;
  } else {
    const frameSequence =
      BOSS_SPRITE_CONFIG.FRAME_SEQUENCE[boss.state] || BOSS_SPRITE_CONFIG.FRAME_SEQUENCE.walk;
    const frameLimit = frameSequence.length;
    const safeFrameIndex = Math.min(boss.spriteAnimationFrame, frameLimit - 1);
    safeFrame = frameSequence[safeFrameIndex];
  }
  const x =
    BOSS_SPRITE_CONFIG.SOURCE_OFFSET_X +
    safeFrame * BOSS_SPRITE_CONFIG.CELL_WIDTH +
    BOSS_SPRITE_CONFIG.CROP_INSET_X;
  const y =
    BOSS_SPRITE_CONFIG.SOURCE_OFFSET_Y +
    row * BOSS_SPRITE_CONFIG.CELL_HEIGHT +
    BOSS_SPRITE_CONFIG.CROP_INSET_Y;
  const width = BOSS_SPRITE_CONFIG.FRAME_WIDTH;
  const height = BOSS_SPRITE_CONFIG.FRAME_HEIGHT;
  return { x, y, width, height };
}

function showScreen(screen) {
  const setHidden = (element, hidden) => {
    if (!element) return;
    element.classList.toggle("hidden", hidden);
  };

  setHidden(menuScreen, screen !== "menu");
  setHidden(playMenu, screen !== "play");
  setHidden(createRoomScreen, screen !== "createRoom");
  setHidden(enterRoomScreen, screen !== "enterRoom");
  setHidden(waitingRoomScreen, screen !== "waiting");
  setHidden(gameScreen, screen !== "game");
  setHidden(endGameScreen, screen !== "endGame");
  setHidden(botNameScreen, screen !== "botName");
}

function normalizeRoomValue(value, fallback) {
  const sanitized = value.trim().replace(/\s+/g, "-");
  return sanitized || fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function getAlivePlayers() {
  return (gameState?.players || []).filter(
    (p) => p && p.alive && p.hp > 0 && Number.isFinite(p.x) && Number.isFinite(p.y)
  );
}

function syncLocalPlayerToGameState() {
  if (!gameState) return;
  if (!Array.isArray(gameState.players)) {
    gameState.players = [playerData];
    return;
  }

  const existing = gameState.players.find((p) => p.id === playerData.id);
  if (existing) {
    existing.x = playerData.x;
    existing.y = playerData.y;
    existing.hp = playerData.hp;
    existing.alive = playerData.alive;
    existing.name = playerData.name;
  } else {
    gameState.players.push(playerData);
  }
}

function getNearestAlivePlayer(fromX, fromY) {
  const alivePlayers = getAlivePlayers();
  if (alivePlayers.length === 0) return null;

  let nearest = alivePlayers[0];
  let nearestDist = distance(fromX, fromY, nearest.x, nearest.y);

  for (let i = 1; i < alivePlayers.length; i += 1) {
    const candidate = alivePlayers[i];
    const dist = distance(fromX, fromY, candidate.x, candidate.y);
    if (dist < nearestDist) {
      nearest = candidate;
      nearestDist = dist;
    }
  }

  return { player: nearest, dist: nearestDist };
}

function getNearestEnemy(fromX, fromY) {
  const enemies = gameState.enemies.filter(e => e.state !== 'dead');
  if (gameState.boss && gameState.boss.state !== 'dead') enemies.push(gameState.boss);
  if (enemies.length === 0) return null;
  let nearest = enemies[0];
  let minDist = distance(fromX, fromY, nearest.x, nearest.y);
  enemies.forEach(e => {
    const d = distance(fromX, fromY, e.x, e.y);
    if (d < minDist) { minDist = d; nearest = e; }
  });
  return { enemy: nearest, dist: minDist };
}

function triggerBossDeath(now, killerId) {
  if (!gameState?.boss) return;
  const boss = gameState.boss;
  if (boss.state === "dead") return;

  boss.hp = 0;
  boss.state = "dead";
  boss.killerId = killerId;
  boss.attackMode = null;
  boss.attackTargetId = null;
  boss.meleeHitDone = false;
  boss.spriteAnimationFrame = 0;
  boss.lastSpriteUpdate = now;
  boss.deathStartedAt = now;
  boss.deathFinishedAt = null;
  boss.nextShootTime = Number.MAX_SAFE_INTEGER;
  boss.deathHandled = false;
  boss.facing = 1;
  boss.deadAt = now;
  boss.bloomed = true;
}

function initializeGameState() {
  // Capture current bot if we are in bot mode so it's not lost when resetting gameState
  const currentBot = gameState?.bot;
  gameState = {
    wave: 1,
    waveStartTime: null,
    waveCleared: false,
    waveAlertShown: false,
    enemies: [],
    boss: null,
    bot: currentBot,
    projectiles: [],
    pickups: [],
    players: [],
    gameActive: true,
    gameEnded: false,
    endGameTime: null,
    waveCountdown: 0,
  };

  // Strictly ensure players list is populated correctly for the chosen mode
  if (gameMode === "bot" && currentBot) {
    gameState.players = [playerData, currentBot];
  } else {
    gameState.players = [playerData];
  }

  const rect = gameBoard.getBoundingClientRect();
  const boardW = rect.width || GAME_CONFIG.BOARD_WIDTH;
  const boardH = rect.height || GAME_CONFIG.BOARD_HEIGHT;

  playerData.hp = playerData.maxHp;
  playerData.ammo = GAME_CONFIG.PLAYER_START_AMMO;
  playerData.weapon = "pistol";
  playerData.kills = 0;
  playerData.alive = true;
  playerData.spriteAnimationFrame = 0;
  playerData.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.walk;
  playerData.lastMoveTime = Date.now();
  playerData.lastShootTime = 0;
  playerData.lastHurtTime = 0;
  playerData.alive = true;
  playerData.x = boardW / 2;
  playerData.y = boardH / 2;

  startWave();
}

function startWave() {
  if (gameState.wave > GAME_CONFIG.MAX_WAVES) {
    endGame();
    return;
  }

  waveData.current = gameState.wave;
  waveData.started = false;
  waveData.enemiesCleared = false;
  waveData.cleared = false;

  // VITAL: Restore game active flags so shooting and AI logic resume for the new wave
  gameState.gameActive = true;
  gameState.gameEnded = false;

  // Revive all players and replenish ammo at the start of every wave
  gameState.players.forEach(p => {
    p.hp = p.maxHp;
    p.alive = true;
    if (p.ammo < 50) p.ammo = 50;
  });

  gameState.waveCountdown = 3;
  
  const countdownInterval = setInterval(() => {
    if (!gameState || !gameState.gameActive) {
      clearInterval(countdownInterval);
      return;
    }

    gameState.waveCountdown--;

    if (gameState.waveCountdown <= 0) {
      clearInterval(countdownInterval);
      
      if (DEBUG_BOSS_FIRST) {
        waveData.started = true;
        gameState.enemies = [];
        spawnBoss();
      } else {
        waveData.started = true;
        const enemyCount = GAME_CONFIG.INITIAL_ENEMIES + (gameState.wave - 1) * GAME_CONFIG.ENEMIES_PER_WAVE;
        spawnEnemyWave(enemyCount);
      }
    }
  }, 1000);
}

function spawnEnemyWave(count) {
  gameState.enemies = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = 150 + Math.random() * 50;
    const enemy = {
      id: `enemy-${Date.now()}-${i}`,
      x: gameBoard.clientWidth / 2 + Math.cos(angle) * distance,
      y: gameBoard.clientHeight / 2 + Math.sin(angle) * distance,
      hp: 1,
      maxHp: 1,
      targetPlayerId: null,
      spawnTime: Date.now(),
      bloomed: false,
      nextShootTime: Date.now() + GAME_CONFIG.ENEMY_SHOOT_INTERVAL,
      type: "regular",
      state: "walk",
      spriteAnimationRow: ENEMY_SPRITE_CONFIG.SPRITE_ROWS.walk,
      spriteAnimationFrame: 0,
      lastSpriteUpdate: Date.now(),
      facing: 1,
      deathTime: null,
    };

    gameState.enemies.push(enemy);
  }

  updateGameDisplay();
}

function spawnBoss() {
  const bossHp = GAME_CONFIG.INITIAL_BOSS_HP + (gameState.wave - 1) * GAME_CONFIG.BOSS_HP_INCREMENT;
  gameState.boss = {
    id: `boss-${Date.now()}`,
    x: gameBoard.clientWidth / 2,
    y: gameBoard.clientHeight / 2,
    hp: bossHp,
    maxHp: bossHp,
    spawnTime: Date.now(),
    bloomed: false,
    nextShootTime: Date.now() + GAME_CONFIG.ENEMY_SHOOT_INTERVAL,
    type: "boss",
    state: "walk",
    attackMode: null,
    attackTargetId: null,
    meleeHitDone: false,
    spriteAnimationFrame: 0,
    lastSpriteUpdate: Date.now(),
    deathStartedAt: null,
    deathFinishedAt: null,
    facing: 1,
    deathHandled: false,
  };
}

function updateGameDisplay() {
  if (!gameState) return;

  const rect = gameBoard.getBoundingClientRect();

  if (gameLeaderboardSidebar) {
    gameLeaderboardSidebar.classList.toggle("hidden", gameMode === "solo");
  }

  gameBoard.innerHTML = "";

  gameState.enemies.forEach((enemy) => {
    const el = document.createElement("div");
    el.className = "game-entity enemy-sprite";
    el.style.left = `${Math.round(clamp(enemy.x - ENEMY_SPRITE_CONFIG.FRAME_WIDTH / 2, 0, rect.width - ENEMY_SPRITE_CONFIG.FRAME_WIDTH))}px`;
    el.style.top = `${Math.round(clamp(enemy.y - ENEMY_SPRITE_CONFIG.FRAME_HEIGHT / 2, 0, rect.height - ENEMY_SPRITE_CONFIG.FRAME_HEIGHT))}px`;
    const enemyPos = getEnemySpritePosition(enemy);
    el.style.backgroundPosition = `-${enemyPos.x}px -${enemyPos.y}px`;
    el.style.transform = enemy.facing === -1 ? "scaleX(-1)" : "scaleX(1)";
    
    const healthBar = document.createElement("div");
    healthBar.className = "entity-health-bar";
    const healthFill = document.createElement("div");
    healthFill.className = "entity-health-fill";
    healthFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
    if (enemy.facing === -1) healthBar.style.transform = "translateX(-50%) scaleX(-1)";
    healthBar.appendChild(healthFill);
    el.appendChild(healthBar);

    gameBoard.appendChild(el);
  });

  if (gameState.boss) {
    const el = document.createElement("div");
    el.className = "game-entity boss-sprite";
    const bossPos = getBossSpritePosition(gameState.boss);
    const renderWidth = Math.max(1, Math.round(bossPos.width * BOSS_SPRITE_CONFIG.DISPLAY_SCALE));
    const renderHeight = Math.max(1, Math.round(bossPos.height * BOSS_SPRITE_CONFIG.DISPLAY_SCALE));
    el.style.width = `${renderWidth}px`;
    el.style.height = `${renderHeight}px`;
    el.style.left = `${Math.round(clamp(gameState.boss.x - renderWidth / 2, 0, rect.width - renderWidth))}px`;
    el.style.top = `${Math.round(clamp(gameState.boss.y - renderHeight / 2, 0, rect.height - renderHeight))}px`;

    const healthBar = document.createElement("div");
    healthBar.className = "entity-health-bar";
    const healthFill = document.createElement("div");
    healthFill.className = "entity-health-fill";
    healthFill.style.width = `${(gameState.boss.hp / gameState.boss.maxHp) * 100}%`;
    healthBar.appendChild(healthFill);
    el.appendChild(healthBar);

    const bossCanvas = document.createElement("canvas");
    bossCanvas.className = "boss-sprite-canvas";
    bossCanvas.width = bossPos.width;
    bossCanvas.height = bossPos.height;
    bossCanvas.style.width = `${renderWidth}px`;
    bossCanvas.style.height = `${renderHeight}px`;
    const bossCtx = bossCanvas.getContext("2d");
    if (bossCtx && bossSpriteImage.complete) {
      bossCtx.imageSmoothingEnabled = false;
      if (gameState.boss.facing === -1) {
        bossCtx.translate(bossPos.width, 0);
        bossCtx.scale(-1, 1);
      }
      bossCtx.drawImage(
        bossSpriteImage,
        bossPos.x,
        bossPos.y,
        bossPos.width,
        bossPos.height,
        0,
        0,
        bossPos.width,
        bossPos.height
      );
    }
    el.appendChild(bossCanvas);

    gameBoard.appendChild(el);
  }

  gameState.projectiles.forEach((proj) => {
    const el = document.createElement("div");
    el.className = `game-entity ${proj.fromPlayer ? "bullet" : "seed-bullet"}`;
    el.style.left = `${clamp(proj.x - 12, 0, rect.width)}px`;
    el.style.top = `${clamp(proj.y - 8, 0, rect.height)}px`;
    
    if (proj.fromPlayer) {
      const bulletPos = getBulletSpritePosition(proj.frame);
      el.style.backgroundPosition = `-${bulletPos.x}px -${bulletPos.y}px`;
      const angleDeg = (proj.angle * 180) / Math.PI;
      el.style.transform = `rotate(${angleDeg}deg)`;
    }
    
    gameBoard.appendChild(el);
  });

  gameState.pickups.forEach((pickup) => {
    const el = document.createElement("div");
    el.className = `game-entity pickup-item pickup-${pickup.type}`;
    el.textContent = pickup.type === "ammo" ? "A" : pickup.type === "medkit" ? "+" : "W";
    el.style.left = `${clamp(pickup.x, 0, rect.width)}px`;
    el.style.top = `${clamp(pickup.y, 0, rect.height)}px`;
    gameBoard.appendChild(el);
  });

  gameState.players.forEach(p => {
    if (!p.alive && p.id !== playerData.id) return;
    const pEl = document.createElement("div");
    pEl.className = "game-entity player-avatar";
    pEl.style.left = `${Math.round(clamp(p.x - SPRITE_CONFIG.FRAME_WIDTH / 2, 0, rect.width - SPRITE_CONFIG.FRAME_WIDTH))}px`;
    pEl.style.top = `${Math.round(clamp(p.y - SPRITE_CONFIG.FRAME_HEIGHT / 2, 0, rect.height - SPRITE_CONFIG.FRAME_HEIGHT))}px`;

    const col = p.spriteAnimationFrame % SPRITE_CONFIG.COLS;
    const row = p.spriteAnimationRow;
    pEl.style.backgroundPosition = `-${Math.round(col * SPRITE_CONFIG.FRAME_WIDTH)}px -${Math.round(row * SPRITE_CONFIG.FRAME_HEIGHT)}px`;
    pEl.style.transform = p.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';

    const nameLabel = document.createElement("div");
    nameLabel.className = "entity-name-label";
    nameLabel.textContent = p.name;
    if (p.facing === -1) nameLabel.style.transform = "translateX(-50%) scaleX(-1)";
    pEl.appendChild(nameLabel);

    const pHealthBar = document.createElement("div");
    pHealthBar.className = "entity-health-bar";
    const pHealthFill = document.createElement("div");
    pHealthFill.className = "entity-health-fill";
    pHealthFill.style.width = `${(p.hp / p.maxHp) * 100}%`;
    if (p.facing === -1) pHealthBar.style.transform = "translateX(-50%) scaleX(-1)";
    pHealthBar.appendChild(pHealthFill);
    pEl.appendChild(pHealthBar);

    const pAmmo = document.createElement("div");
    pAmmo.className = "player-ammo-mini";
    pAmmo.textContent = p.ammo;
    if (p.facing === -1) pAmmo.style.transform = "translateX(-50%) scaleX(-1)";
    pEl.appendChild(pAmmo);

    gameBoard.appendChild(pEl);
  });

  if (waveCountdownOverlay) {
    if (gameState.waveCountdown > 0) {
      if (waveCountdownOverlay.textContent !== String(gameState.waveCountdown)) {
        waveCountdownOverlay.textContent = gameState.waveCountdown;
        // Re-trigger the pulse animation on every number change
        waveCountdownOverlay.style.animation = 'none';
        waveCountdownOverlay.offsetHeight; /* trigger reflow */
        waveCountdownOverlay.style.animation = null;
      }
      waveCountdownOverlay.classList.remove("hidden");
    } else {
      waveCountdownOverlay.classList.add("hidden");
    }
  }

  updateHUD();
  updateLeaderboard();
}

function updateHUD() {
  healthFill.style.width = `${(playerData.hp / playerData.maxHp) * 100}%`;
  healthText.textContent = `${playerData.hp}/${playerData.maxHp}`;
  weaponDisplay.textContent = WEAPONS[playerData.weapon].name;
  ammoDisplay.textContent = playerData.ammo;

  if (gameState.waveCountdown > 0) {
    waveCounter.textContent = `Wave ${gameState.wave} - Preparing...`;
  } else if (waveData.started) {
    const count = gameState.enemies.length + (gameState.boss ? 1 : 0);
    waveCounter.textContent = `Wave ${gameState.wave} - ${count} remaining`;
  } else {
    waveCounter.textContent = `Wave ${gameState.wave}`;
  }

  playerStats.textContent = gameMode === "solo" ? `Kills: ${playerData.kills}` : `${playerData.name}`;
}

function updateLeaderboard() {
  if (gameMode === "solo") return;

  const players = (gameMode === "bot") ? gameState.players : leaderboardPlayers;
  leaderboardList.innerHTML = "";
  const sortedPlayers = [...(players || [])].sort((a, b) => b.kills - a.kills);

  sortedPlayers.forEach((player, index) => {
    const entry = document.createElement("div");
    entry.className = "leaderboard-entry";
    entry.innerHTML = `
      <div class="leaderboard-rank">#${index + 1}</div>
      <div class="leaderboard-name">${player.name}</div>
      <div class="leaderboard-kills">${player.kills}</div>
    `;
    leaderboardList.appendChild(entry);
  });
}

function handleShoot(x, y) {
  if (!playerData.alive || !gameState.gameActive) return;

  playerData.lastShootTime = Date.now();
  
  const dx = x - playerData.x;
  playerData.facing = dx >= 0 ? 1 : -1;

  if (playerData.weapon === "pistol" && playerData.ammo > 0) {
    playerData.ammo -= 1;
    fireProjectile(playerData.x, playerData.y, x, y, true, playerData.id);
  } else if (playerData.weapon === "machinegun" && playerData.ammo > 0) {
    playerData.ammo -= 1;
    fireProjectile(playerData.x, playerData.y, x, y, true, playerData.id);
  } else if (playerData.weapon === "flamethrower" && playerData.ammo >= 2) {
    playerData.ammo -= 2;
    for (let i = 0; i < 3; i++) {
      const vx = Math.random() - 0.5;
      const vy = Math.random() - 0.5;
      const mag = Math.sqrt(vx * vx + vy * vy);
      fireProjectile(playerData.x, playerData.y, playerData.x + (vx / mag) * 100, playerData.y + (vy / mag) * 100, true, playerData.id);
    }
  }
}

function fireProjectile(fromX, fromY, toX, toY, fromPlayer, shooterId) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = 6;

  const angle = Math.atan2(dy, dx);

  gameState.projectiles.push({
    x: fromX,
    y: fromY,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    fromPlayer,
    shooterId,
    createdAt: Date.now(),
    hitTime: null,
    angle,
    frame: 0,
    state: 'shot',
  });
}

function updatePlayerMovement(dt) {
  if (!playerData.alive || !gameState || !gameState.gameActive) return;

  const rect = gameBoard.getBoundingClientRect();
  let moveX = 0;
  let moveY = 0;
  let moved = false;
  
  // Normalize speed to 60fps (dt will be ~1.0 at 60fps)
  const adjustedSpeed = MOVEMENT_CONFIG.SPEED * dt;

  if (keysPressed.w || keysPressed.arrowup) { moveY -= adjustedSpeed; moved = true; }
  if (keysPressed.s || keysPressed.arrowdown) { moveY += adjustedSpeed; moved = true; }
  if (keysPressed.a || keysPressed.arrowleft) { moveX -= adjustedSpeed; moved = true; }
  if (keysPressed.d || keysPressed.arrowright) { moveX += adjustedSpeed; moved = true; }

  if (moved) {
    if (moveX !== 0 && moveY !== 0) {
      moveX *= MOVEMENT_CONFIG.DIAGONAL_REDUCTION;
      moveY *= MOVEMENT_CONFIG.DIAGONAL_REDUCTION;
    }
    playerData.x = clamp(playerData.x + moveX, SPRITE_CONFIG.FRAME_WIDTH / 2, rect.width - SPRITE_CONFIG.FRAME_WIDTH / 2);
    playerData.y = clamp(playerData.y + moveY, SPRITE_CONFIG.FRAME_HEIGHT / 2, rect.height - SPRITE_CONFIG.FRAME_HEIGHT / 2);
    playerData.lastMoveTime = Date.now();
  }
}

function updateBotLogic(dt) {
  if (gameMode !== "bot" || !gameState.bot || !gameState.bot.alive) return;
  const bot = gameState.bot;
  const now = Date.now();

  const targetData = getNearestEnemy(bot.x, bot.y);
  if (targetData) {
    const { enemy, dist } = targetData;
    const dx = enemy.x - bot.x;
    const dy = enemy.y - bot.y;
    bot.facing = dx >= 0 ? 1 : -1;

    const PREFERRED_DIST = 180; // bot tries to stay ~180px away
    const rect = gameBoard.getBoundingClientRect();
    const boardW = rect.width || GAME_CONFIG.BOARD_WIDTH;
    const boardH = rect.height || GAME_CONFIG.BOARD_HEIGHT;

    let moveX = 0;
    let moveY = 0;

    if (dist > PREFERRED_DIST + 30) {
      // Too far — move toward enemy
      moveX = (dx / dist) * MOVEMENT_CONFIG.SPEED * 0.8 * dt;
      moveY = (dy / dist) * MOVEMENT_CONFIG.SPEED * 0.8 * dt;
    } else if (dist < PREFERRED_DIST - 30) {
      // Too close — back away from enemy
      moveX = -(dx / dist) * MOVEMENT_CONFIG.SPEED * 0.8 * dt;
      moveY = -(dy / dist) * MOVEMENT_CONFIG.SPEED * 0.8 * dt;
    } else {
      // In preferred range — strafe perpendicular to keep moving
      // Use a slow strafe direction that flips based on bot's ID to vary bots
      const strafeDir = bot.id.charCodeAt(bot.id.length - 1) % 2 === 0 ? 1 : -1;
      moveX = (-dy / dist) * MOVEMENT_CONFIG.SPEED * 0.5 * dt * strafeDir;
      moveY = (dx / dist) * MOVEMENT_CONFIG.SPEED * 0.5 * dt * strafeDir;
    }

    bot.x = clamp(bot.x + moveX, SPRITE_CONFIG.FRAME_WIDTH / 2, boardW - SPRITE_CONFIG.FRAME_WIDTH / 2);
    bot.y = clamp(bot.y + moveY, SPRITE_CONFIG.FRAME_HEIGHT / 2, boardH - SPRITE_CONFIG.FRAME_HEIGHT / 2);

    // Always animate walk when moving
    bot.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.walk;
    if (now - bot.lastSpriteUpdate > SPRITE_CONFIG.FRAME_RATE) {
      bot.spriteAnimationFrame = (bot.spriteAnimationFrame + 1) % 4;
      bot.lastSpriteUpdate = now;
    }

    if (now - bot.lastShootTime > 600 && bot.ammo > 0) {
      bot.lastShootTime = now;
      bot.ammo--;
      fireProjectile(bot.x, bot.y, enemy.x, enemy.y, true, bot.id);
    }
  } else {
    // No enemies — wander toward the player like a buddy would between waves
    const rect = gameBoard.getBoundingClientRect();
    const boardW = rect.width || GAME_CONFIG.BOARD_WIDTH;
    const boardH = rect.height || GAME_CONFIG.BOARD_HEIGHT;

    // Pick up a new wander target every 2 seconds or if none set yet
    if (!bot.wanderTarget || now - bot.wanderTargetTime > 2000) {
      // Wander toward the player with a small random offset so they don't stack
      const offsetX = (Math.random() - 0.5) * 120;
      const offsetY = (Math.random() - 0.5) * 120;
      bot.wanderTarget = {
        x: clamp(playerData.x + offsetX, SPRITE_CONFIG.FRAME_WIDTH / 2, boardW - SPRITE_CONFIG.FRAME_WIDTH / 2),
        y: clamp(playerData.y + offsetY, SPRITE_CONFIG.FRAME_HEIGHT / 2, boardH - SPRITE_CONFIG.FRAME_HEIGHT / 2),
      };
      bot.wanderTargetTime = now;
    }

    const wx = bot.wanderTarget.x - bot.x;
    const wy = bot.wanderTarget.y - bot.y;
    const wDist = Math.sqrt(wx * wx + wy * wy);

    if (wDist > 10) {
      bot.facing = wx >= 0 ? 1 : -1;
      bot.x += (wx / wDist) * MOVEMENT_CONFIG.SPEED * 0.6 * dt;
      bot.y += (wy / wDist) * MOVEMENT_CONFIG.SPEED * 0.6 * dt;
      bot.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.walk;
      if (now - bot.lastSpriteUpdate > SPRITE_CONFIG.FRAME_RATE) {
        bot.spriteAnimationFrame = (bot.spriteAnimationFrame + 1) % 4;
        bot.lastSpriteUpdate = now;
      }
    } else {
      // Reached wander point — pick a new one next tick
      bot.wanderTarget = null;
      bot.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.walk;
      bot.spriteAnimationFrame = 0;
    }
  }

  gameState.pickups = gameState.pickups.filter((pickup) => {
    if (distance(bot.x, bot.y, pickup.x, pickup.y) < 30) {
      if (pickup.type === "ammo") bot.ammo += 15;
      return false;
    }
    return true;
  });
}

function updateGameLogic(dt) {
  if (!gameState || !gameState.gameActive) return;

  const now = Date.now();

  updatePlayerMovement(dt);
  updateBotLogic(dt);
  syncLocalPlayerToGameState();

  if (playerData.alive && playerData.hp > 0) {
    const timeSinceHurt = now - playerData.lastHurtTime || Infinity;
    const timeSinceShoot = now - playerData.lastShootTime || Infinity;
    const timeIdleSinceMove = now - playerData.lastMoveTime;
    
    const canUpdateFrame = now - playerData.lastSpriteUpdate > SPRITE_CONFIG.FRAME_RATE;

    if (playerData.hp < playerData.maxHp && timeSinceHurt < 500) {
      playerData.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.hurt;
      if (canUpdateFrame) {
        playerData.spriteAnimationFrame = (playerData.spriteAnimationFrame + 1) % 4;
        playerData.lastSpriteUpdate = now;
      }
    } else if (timeSinceShoot < 300) {
      playerData.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.shoot;
      playerData.spriteAnimationFrame = 2;
    } else if (timeIdleSinceMove < 300) {
      playerData.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.walk;
      if (canUpdateFrame) {
        playerData.spriteAnimationFrame = (playerData.spriteAnimationFrame + 1) % 4;
        playerData.lastSpriteUpdate = now;
      }
    } else {
      playerData.spriteAnimationRow = SPRITE_CONFIG.SPRITE_ROWS.walk;
      playerData.spriteAnimationFrame = 0;
    }
  }

  gameState.enemies = gameState.enemies.filter((enemy) => {
    if (enemy.state === "dead") {
      return now - enemy.deathTime < 500;
    }
    return true;
  });

  gameState.enemies.forEach((enemy) => {
    if (enemy.state === "dead") {
      if (now - enemy.lastSpriteUpdate > ENEMY_SPRITE_CONFIG.FRAME_RATE) {
        enemy.spriteAnimationFrame = Math.min(enemy.spriteAnimationFrame + 1, ENEMY_SPRITE_CONFIG.COLS - 1);
        enemy.lastSpriteUpdate = now;
      }
      return;
    }

    if (enemy.state === "attack") {
      if (now - enemy.lastSpriteUpdate > ENEMY_SPRITE_CONFIG.FRAME_RATE) {
        enemy.spriteAnimationFrame += 1;
        enemy.lastSpriteUpdate = now;
        if (enemy.spriteAnimationFrame >= ENEMY_SPRITE_CONFIG.COLS) {
          enemy.state = "walk";
          enemy.spriteAnimationRow = ENEMY_SPRITE_CONFIG.SPRITE_ROWS.walk;
          enemy.spriteAnimationFrame = 0;
        }
      }
    } else {
      if (now - enemy.lastSpriteUpdate > ENEMY_SPRITE_CONFIG.FRAME_RATE) {
        enemy.spriteAnimationFrame = (enemy.spriteAnimationFrame + 1) % ENEMY_SPRITE_CONFIG.COLS;
        enemy.lastSpriteUpdate = now;
      }
    }

    const timeSinceSpawn = now - enemy.spawnTime;

    if (timeSinceSpawn > GAME_CONFIG.ENEMY_BLOOM_DELAY && !enemy.bloomed) {
      enemy.bloomed = true;
    }

    const targetData = getNearestAlivePlayer(enemy.x, enemy.y);
    if (targetData) {
      const target = targetData.player;
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = targetData.dist;
      enemy.facing = dx >= 0 ? 1 : -1;
      const speed = AI_CONFIG.ENEMY_MOVE_SPEED;

      if (dist > 5 && enemy.state !== "dead") {
        enemy.x += (dx / dist) * speed * dt;
        enemy.y += (dy / dist) * speed * dt;
      }

      if (enemy.bloomed && now >= enemy.nextShootTime) {
        const bulletDamage = gameState.wave >= 5 && enemy.type === "boss" ? 2 : 1;
        enemy.state = "attack";
        enemy.spriteAnimationRow = ENEMY_SPRITE_CONFIG.SPRITE_ROWS.attack;
        enemy.spriteAnimationFrame = 0;
        enemy.lastSpriteUpdate = now;
        fireProjectile(enemy.x, enemy.y, target.x, target.y, false);
        enemy.nextShootTime = now + GAME_CONFIG.ENEMY_SHOOT_INTERVAL;
      }
    }
  });

  if (gameState.boss) {
    const boss = gameState.boss;
    if (boss.state === "dead") {
      const deathFrameCount = (BOSS_SPRITE_CONFIG.DEATH_SEQUENCE || []).length || (BOSS_SPRITE_CONFIG.FRAME_SEQUENCE.death || []).length || BOSS_SPRITE_CONFIG.FRAMES.death;
      if (now - boss.lastSpriteUpdate > AI_CONFIG.BOSS_DEATH_FRAME_RATE) {
        boss.spriteAnimationFrame = Math.min(boss.spriteAnimationFrame + 1, deathFrameCount - 1);
        boss.lastSpriteUpdate = now;
      }

      if (boss.spriteAnimationFrame >= deathFrameCount - 1 && !boss.deathFinishedAt) {
        boss.deathFinishedAt = now;
      }

      if (
        !boss.deathHandled &&
        boss.deathFinishedAt &&
        now - boss.deathFinishedAt >= AI_CONFIG.BOSS_DEATH_HOLD_MS
      ) {
        boss.deathHandled = true;
        gameState.boss = null;
        
        const killer = gameState.players.find(p => p.id === boss.killerId);
        if (killer) killer.kills += (1 + gameState.wave);

        if (gameState.wave === GAME_CONFIG.MAX_WAVES) {
          endGame();
        } else {
          waveData.cleared = true;
          setTimeout(() => {
            gameState.wave += 1;
            startWave();
          }, GAME_CONFIG.WAVE_CLEAR_DELAY);
        }
      }
    } else {
      if (boss.hp <= 0) {
        triggerBossDeath(now, null);
      }

      if (boss.state === "dead") {
        // Death state is now fully initialized; defer frame stepping to next tick.
        // This guarantees row-4 starts from frame 0 visibly.
      } else {
        if (now - boss.lastSpriteUpdate > BOSS_SPRITE_CONFIG.FRAME_RATE) {
          if (boss.state === "attack") {
            const attackFrameCount = (BOSS_SPRITE_CONFIG.FRAME_SEQUENCE.attack || []).length || BOSS_SPRITE_CONFIG.FRAMES.attack;
            boss.spriteAnimationFrame += 1;

            if (
              boss.attackMode === "melee" &&
              !boss.meleeHitDone &&
              boss.spriteAnimationFrame >= AI_CONFIG.BOSS_MELEE_HIT_FRAME
            ) {
              const meleeTargetData = getNearestAlivePlayer(boss.x, boss.y);
              if (meleeTargetData && meleeTargetData.dist <= AI_CONFIG.BOSS_MELEE_RANGE + 20) {
                const meleeTarget = meleeTargetData.player;
              meleeTarget.hp = Math.max(0, meleeTarget.hp - 2);
              meleeTarget.lastHurtTime = now;
              if (meleeTarget.hp <= 0) {
                meleeTarget.alive = false;
                if (gameMode === "solo" && meleeTarget.id === playerData.id) {
                  endGame();
                  }
                }
              }
              boss.meleeHitDone = true;
            }

            if (boss.spriteAnimationFrame >= attackFrameCount) {
              boss.state = "walk";
              boss.attackMode = null;
              boss.attackTargetId = null;
              boss.meleeHitDone = false;
              boss.spriteAnimationFrame = 0;
            }
          } else {
            const walkFrameCount = (BOSS_SPRITE_CONFIG.FRAME_SEQUENCE.walk || []).length || BOSS_SPRITE_CONFIG.FRAMES.walk;
            boss.spriteAnimationFrame = (boss.spriteAnimationFrame + 1) % walkFrameCount;
          }
          boss.lastSpriteUpdate = now;
        }

        const targetData = getNearestAlivePlayer(boss.x, boss.y);
        if (targetData) {
          const target = targetData.player;
          const dx = target.x - boss.x;
          const dy = target.y - boss.y;
          const dist = targetData.dist;
          boss.facing = dx >= 0 ? 1 : -1;

          if (boss.state !== "attack" && dist > AI_CONFIG.BOSS_CHASE_STOP_RANGE) {
            const speed = AI_CONFIG.BOSS_MOVE_SPEED;
            boss.x += (dx / dist) * speed * dt;
            boss.y += (dy / dist) * speed * dt;
          }

          if (boss.state !== "attack" && now >= boss.nextShootTime) {
            boss.state = "attack";
            boss.attackTargetId = target.id;
            boss.meleeHitDone = false;
            boss.spriteAnimationFrame = 0;
            boss.lastSpriteUpdate = now;
            if (dist <= AI_CONFIG.BOSS_MELEE_RANGE) {
              boss.attackMode = "melee";
              boss.nextShootTime = now + AI_CONFIG.BOSS_MELEE_COOLDOWN;
            } else {
              boss.attackMode = "ranged";
              fireProjectile(boss.x, boss.y, target.x, target.y, false);
              boss.nextShootTime = now + AI_CONFIG.BOSS_RANGED_COOLDOWN;
            }
          }
        }

        boss.state = boss.state === "attack" ? boss.state : "walk";
      }
    }
  }

  if (gameState.enemies.length === 0 && !gameState.boss && waveData.started && !waveData.cleared) {
    spawnBoss();
  }

  gameState.projectiles = gameState.projectiles.filter((proj) => {
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;

    const inBounds = proj.x >= 0 && proj.x <= gameBoard.clientWidth && proj.y >= 0 && proj.y <= gameBoard.clientHeight;

    // Update bullet frame based on age if not hit
    if (proj.fromPlayer && proj.vx !== 0 && proj.vy !== 0) {
      const now = Date.now();
      const age = now - proj.createdAt;
      if (age < 50) {
        proj.frame = 0; // Just shot
      } else if (age > 200) {
        proj.frame = 2; // Traveling long
      } else {
        proj.frame = 1; // Traveling
      }
    }

    if (proj.fromPlayer) {
      for (const enemy of gameState.enemies) {
        if (proj.hitTime) break; // Bullet already hit something this frame

        if (distance(proj.x, proj.y, enemy.x, enemy.y) < 20) {
          enemy.hp -= 1;
          if (enemy.hp <= 0 && enemy.state !== "dead") {
            enemy.hp = 0;
            enemy.state = "dead";
            enemy.spriteAnimationRow = ENEMY_SPRITE_CONFIG.SPRITE_ROWS.death;
            enemy.spriteAnimationFrame = 0;
            enemy.lastSpriteUpdate = now;
            enemy.deathTime = now;
            
            const shooter = gameState.players.find(p => p.id === proj.shooterId);
            if (shooter) shooter.kills += 1;

            gameState.pickups.push({
              type: "ammo",
              x: enemy.x,
              y: enemy.y,
              spawnTime: now
            });
          }
          proj.frame = 3; // Set to frame 4 (hit frame)
          proj.vx = 0;
          proj.vy = 0;
          proj.hitTime = proj.hitTime || Date.now();
          break; // Stop checking other enemies for this bullet
        }
      }

      if (!proj.hitTime && gameState.boss && gameState.boss.state !== "dead" && distance(proj.x, proj.y, gameState.boss.x, gameState.boss.y) < 40) {
        gameState.boss.hp -= 1;
        if (gameState.boss.hp <= 0) {
          triggerBossDeath(now, proj.shooterId);
        }
        proj.frame = 3; // Set to frame 4 (hit frame)
        proj.vx = 0;
        proj.vy = 0;
        proj.hitTime = proj.hitTime || Date.now();
      }
    } else {
      gameState.players.forEach(p => {
        if (p.alive && distance(proj.x, proj.y, p.x, p.y) < 20) {
          p.hp -= 1;
          p.lastHurtTime = now;
          proj.vx = 0; proj.vy = 0;
          proj.hitTime = proj.hitTime || now;
          if (p.hp <= 0) {
            p.alive = false;
            if (gameMode === "solo" && p.id === playerData.id) {
              endGame();
            }
          }
        }
      });
    }

    const hitAlive = proj.hitTime && Date.now() - proj.hitTime < 120;
    return (inBounds && (proj.vx !== 0 || proj.vy !== 0)) || hitAlive;
  });

  gameState.pickups = gameState.pickups.filter((pickup) => {
    if (distance(playerData.x, playerData.y, pickup.x, pickup.y) < 30) {
      if (pickup.type === "ammo") {
        playerData.ammo += 15;
      } else if (pickup.type === "medkit" && playerData.hp < playerData.maxHp) {
        playerData.hp = playerData.maxHp;
      }
      return false;
    }

    return now - pickup.spawnTime < GAME_CONFIG.ITEM_DESPAWN_TIME;
  });
}

function endGame() {
  gameState.gameActive = false;
  gameState.gameEnded = true;
  showEndGameScreen();
}

function showEndGameScreen() {
  const topPlayers = [...leaderboardPlayers].sort((a, b) => b.kills - a.kills).slice(0, 3);

  podiumList.innerHTML = topPlayers
    .map(
      (player, index) => `
    <div class="podium-entry">
      <div class="podium-rank">${index === 0 ? "???? 1st" : index === 1 ? "???? 2nd" : "???? 3rd"}</div>
      <div class="podium-name">${player.name}</div>
      <div class="podium-kills">${player.kills} kills</div>
    </div>
  `
    )
    .join("");

  let countdown = 30;
  endGameTimer.textContent = `Auto-exit in ${countdown}s`;

  const timer = setInterval(() => {
    countdown -= 1;
    endGameTimer.textContent = `Auto-exit in ${countdown}s`;

    if (countdown <= 0) {
      clearInterval(timer);
      handleAction("back-to-menu");
    }
  }, 1000);

  showScreen("endGame");
}

function gameLoop(timestamp) {
  // Handle first frame where timestamp is undefined
  if (!timestamp) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (!lastFrameTime) lastFrameTime = timestamp;
  // Calculate dt relative to 60fps (16.66ms per frame)
  const dt = Math.min(6, (timestamp - lastFrameTime) / 16.66);
  lastFrameTime = timestamp;

  updateGameLogic(dt);
  updateGameDisplay();

  if (gameState && gameState.gameActive) {
    requestAnimationFrame(gameLoop);
  }
}

function startSoloGame() {
  gameMode = "solo";
  playerData.name = `Monafuku-${Math.floor(Math.random() * 9000) + 1000}`;

  leaderboardPlayers = [playerData];

  lastFrameTime = 0;
  showScreen("game");
  initializeGameState();
  gameLoop();
}

function startMultiplayerGame(arenaId, password) {
  gameMode = "multiplayer";
  playerData.name = `Monafuku-${Math.floor(Math.random() * 9000) + 1000}`;

  showScreen("waiting");
  waitingArenaId.textContent = arenaId;
  waitingPlayerName.textContent = playerData.name;

  joinMultisynqSession(arenaId, password, playerData.name);
}

function joinMultisynqSession(sessionId, password, playerName) {
  if (MULTISYNQ_API_KEY.includes("YOUR_")) {
    waitingRoomStatus.textContent = "Multisynq API key not configured. Running solo mode.";
    setTimeout(() => startSoloGame(), 2000);
    return;
  }

  Multisynq.Session.join({
    apiKey: MULTISYNQ_API_KEY,
    appId: APP_ID,
    session: sessionId,
    model: GarModel,
    view: GarView,
    name: playerName,
    password: password.trim() || DEFAULT_PASSWORD,
  })
    .then((session) => {
      currentSession = session;
      waitingRoomStatus.textContent = "Connected to arena. Waiting for game start...";
    })
    .catch((error) => {
      waitingRoomStatus.textContent = `Connection failed: ${error?.message || "Unknown error"}`;
      setTimeout(() => showScreen("menu"), 2000);
    });
}

function startBotGame() {
  const name = (botPlayerNameInput && botPlayerNameInput.value.trim()) || "Monafuku";
  gameMode = "bot";
  playerData.name = name;
  playerData.alive = true;
  playerData.kills = 0;
  playerData.hp = GAME_CONFIG.PLAYER_START_HP;
  playerData.ammo = GAME_CONFIG.PLAYER_START_AMMO;

  const botNames = ["Monafuku-Bot", "Iron-Idol", "Cyber-Roses", "Tactical-Rose"];
  const botName = botNames[Math.floor(Math.random() * botNames.length)];

  const bot = {
    id: "bot-" + Date.now(),
    name: botName,
    hp: GAME_CONFIG.PLAYER_START_HP * 2, // Give bot more HP for testing
    maxHp: GAME_CONFIG.PLAYER_START_HP * 2,
    x: 200, y: 200, kills: 0,
    weapon: "pistol", ammo: 100, alive: true,
    spriteAnimationFrame: 0, spriteAnimationRow: 0,
    lastShootTime: 0, lastSpriteUpdate: 0, facing: 1, lastMoveTime: Date.now()
  };

  gameState = { bot: bot }; // Pre-set bot so initializeGameState can pick it up
  showScreen("game");
  initializeGameState();
  
  lastFrameTime = 0;
  gameLoop();
}

function handleAction(action) {
  switch (action) {
    case "play":
      showScreen("play");
      break;
    case "play-solo":
      startSoloGame();
      break;
    case "play-bot":
      showScreen("botName");
      break;
    case "submit-bot-game":
      startBotGame();
      break;
    case "create-room":
      showScreen("createRoom");
      break;
    case "submit-create-room":
      const roomId = normalizeRoomValue(createRoomNameInput.value, `gar-${Date.now()}`);
      const password = createRoomPasswordInput.value || DEFAULT_PASSWORD;
      createRoomNameInput.value = "";
      createRoomPasswordInput.value = "";
      startMultiplayerGame(roomId, password);
      break;
    case "enter-room":
      showScreen("enterRoom");
      break;
    case "submit-enter-room":
      const arenaId = normalizeRoomValue(enterRoomNameInput.value, `gar-${Date.now()}`);
      const pw = enterRoomPasswordInput.value || DEFAULT_PASSWORD;
      enterRoomNameInput.value = "";
      enterRoomPasswordInput.value = "";
      startMultiplayerGame(arenaId, pw);
      break;
    case "back-to-menu":
      showScreen("menu");
      break;
    case "exit-game":
      if (gameState) {
        gameState.gameActive = false;
      }
      showScreen("menu");
      break;
    case "quit":
      window.location.href = "../../index.html";
      break;
  }
}

class GarModel extends Multisynq.Model {
  init() {
    this.players = [];
    this.subscribe("lobby", "updatePlayer", (data) => {
      const index = this.players.findIndex(p => p.id === data.id);
      if (index !== -1) {
        this.players[index] = data;
      } else {
        this.players.push(data);
      }
    });
  }
}
GarModel.register("GarModel");

class GarView extends Multisynq.View {
  constructor(model) {
    super(model);
  }
  update() {
    super.update();
    this.publish("lobby", "updatePlayer", playerData);
    leaderboardPlayers = this.model.players;
  }
}

let appInitialized = false;

function initializeApp() {
  if (appInitialized) return;
  appInitialized = true;

  showScreen("menu");

  document.addEventListener("click", (e) => {
    const clickTarget = e.target instanceof Element ? e.target : null;
    const actionTarget = clickTarget ? clickTarget.closest("[data-action]") : null;
    const action = actionTarget ? actionTarget.dataset.action : null;
    if (action) {
      e.preventDefault();
      handleAction(action);
    }
  });

  // Fallback listeners to ensure buttons work even if delegated click misses.
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const action = button.dataset.action;
      if (action) {
        handleAction(action);
      }
    });
  });

  gameBoard.addEventListener("click", (e) => {
    if (gameState && gameState.gameActive && playerData.alive && playerData.hp > 0) {
      const rect = gameBoard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      handleShoot(x, y);
    }
  });

  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    
    if (key === "w") keysPressed.w = true;
    if (key === "a") keysPressed.a = true;
    if (key === "s") keysPressed.s = true;
    if (key === "d") keysPressed.d = true;
    if (key === "arrowup") keysPressed.arrowup = true;
    if (key === "arrowdown") keysPressed.arrowdown = true;
    if (key === "arrowleft") keysPressed.arrowleft = true;
    if (key === "arrowright") keysPressed.arrowright = true;
  });

  document.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    
    if (key === "w") keysPressed.w = false;
    if (key === "a") keysPressed.a = false;
    if (key === "s") keysPressed.s = false;
    if (key === "d") keysPressed.d = false;
    if (key === "arrowup") keysPressed.arrowup = false;
    if (key === "arrowdown") keysPressed.arrowdown = false;
    if (key === "arrowleft") keysPressed.arrowleft = false;
    if (key === "arrowright") keysPressed.arrowright = false;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}