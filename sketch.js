/*
Week 5 — Example 5: Side-Scroller Platformer with JSON Levels + Modular Camera

Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
Date: Feb. 12, 2026

Move: WASD/Arrows | Jump: Space

Learning goals:
- Build a side-scrolling platformer using modular game systems
- Load complete level definitions from external JSON (LevelLoader + levels.json)
- Separate responsibilities across classes (Player, Platform, Camera, World)
- Implement gravity, jumping, and collision with platforms
- Use a dedicated Camera2D class for smooth horizontal tracking
- Support multiple levels and easy tuning through data files
- Explore scalable project architecture for larger games
*/

const VIEW_W = 800;
const VIEW_H = 480;

let allLevelsData;
let levelIndex = 0;

let level;
let player;
let cam;

function preload() {
  allLevelsData = loadJSON("levels.json"); // levels.json beside index.html [web:122]
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  textSize(14);

  cam = new Camera2D(width, height);
  loadLevel(levelIndex);
}

function loadLevel(i) {
  level = LevelLoader.fromLevelsJson(allLevelsData, i);

  player = new BlobPlayer();
  player.spawnFromLevel(level);

  cam = new Camera2D(width, height);
  cam.cx = player.x;
  cam.cy = player.y;
  cam.update(player, level); // one update to clamp nicely
}

function draw() {
  // --- game state ---
  player.update(level);

  if (player.y - player.r > level.deathY) {
    loadLevel(levelIndex);
    return;
  }

  // NEW: meditative camera update
  cam.update(player, level);

  // NEW: symbols update (camera "discovers" them)
  level.updateSymbols(cam, player);

  // --- draw ---
  cam.begin();
  level.drawWorld();
  level.drawSymbols();         // draw symbols behind or above player (your choice)
  player.draw(level.theme.blob);
  cam.end();

  // HUD
  fill(0);
  noStroke();
  text(level.name + " (Week 5 — Meditative Camera)", 10, 18);
  text("A/D or ←/→ move • Space/W/↑ jump • E collect symbol", 10, 36);
  text("Symbols collected: " + level.collectedCount() + "/" + level.symbols.length, 10, 54);
}

function keyPressed() {
  if (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) {
    player.tryJump();
  }

  // Press E to collect (once)
  if (key === "e" || key === "E") {
    for (const s of level.symbols) {
      if (s.tryCollect(cam, player)) break; // collect at most one per press
    }
  }

  if (key === "r" || key === "R") loadLevel(levelIndex);
}
