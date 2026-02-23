// WorldLevel.js
// Includes HiddenSymbol + WorldLevel (so symbols always exist when WorldLevel constructs)

class HiddenSymbol {
  constructor(x, y, r = 10) {
    this.x = x;
    this.y = y;
    this.r = r;

    this.found = false;      // revealed when camera sees it
    this.collected = false;  // optional: when player interacts (E)
    this.pulseT = random(1000);
  }

  update(cam, player) {
    // Reveal when camera sees it
    if (!this.found && cam.worldPointInView(this.x, this.y, 30)) {
      this.found = true;

      // small “attention” moment (optional)
      if (cam.cueFocus) cam.cueFocus(this.x, this.y, 45, 1.07);
    }

    // Optional: collect when close + press E
    if (this.found && !this.collected) {
      const d = dist(player.x, player.y, this.x, this.y);
      if (d < this.r + player.r + 10) {
        if (keyIsDown(69)) { // E
          this.collected = true;
          if (cam.cueFocus) cam.cueFocus(this.x, this.y, 25, 1.09);
        }
      }
    }

    this.pulseT += 0.02;
  }

  draw() {
    if (!this.found) return;

    push();

    // soft pulse
    const pulse = 0.6 + 0.4 * sin(this.pulseT);
    const rr = this.r + pulse * 2;

    // glow ring
    noStroke();
    fill(0, 0, 0, this.collected ? 30 : 55);
    ellipse(this.x, this.y, rr * 2.6, rr * 2.6);

    // core
    fill(0, 0, 0, this.collected ? 90 : 140);
    ellipse(this.x, this.y, rr * 1.4, rr * 1.4);

    // tiny mark
    stroke(255, 220);
    strokeWeight(2);
    line(this.x - 4, this.y, this.x + 4, this.y);
    line(this.x, this.y - 4, this.x, this.y + 4);

    pop();
  }
}

class WorldLevel {
  constructor(levelJson) {
    this.name = levelJson.name ?? "Level";

    this.theme = Object.assign(
      { bg: "#F0F0F0", platform: "#C8C8C8", blob: "#1478FF" },
      levelJson.theme ?? {},
    );

    // Physics knobs
    this.gravity = levelJson.gravity ?? 0.65;
    this.jumpV = levelJson.jumpV ?? -11.0;

    // Camera knob (you can keep it, even if not used)
    this.camLerp = levelJson.camera?.lerp ?? 0.12;

    // World size + death line
    this.w = levelJson.world?.w ?? 2400;
    this.h = levelJson.world?.h ?? 360;
    this.deathY = levelJson.world?.deathY ?? this.h + 200;

    // Start
    this.start = Object.assign({ x: 80, y: 220, r: 26 }, levelJson.start ?? {});

    // Platforms
    this.platforms = (levelJson.platforms ?? []).map(
      (p) => new Platform(p.x, p.y, p.w, p.h),
    );

    // Symbols (discoverables)
    this.symbols = (levelJson.symbols ?? []).map(
      (s) => new HiddenSymbol(s.x, s.y, s.r ?? 10),
    );
  }

  drawWorld() {
    background(this.theme.bg);
    push();
    rectMode(CORNER);
    noStroke();
    fill(this.theme.platform);
    for (const p of this.platforms) rect(p.x, p.y, p.w, p.h);
    pop();
  }

  updateSymbols(cam, player) {
    for (const s of this.symbols) s.update(cam, player);
  }

  drawSymbols() {
    for (const s of this.symbols) s.draw();
  }

  collectedCount() {
    let n = 0;
    for (const s of this.symbols) if (s.collected) n++;
    return n;
  }
}