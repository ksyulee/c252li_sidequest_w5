class Camera2D {
  constructor(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;

    // top-left world coordinate of the view
    this.x = 0;
    this.y = 0;

    // internal camera "center" (for nicer math)
    this.cx = viewW / 2;
    this.cy = viewH / 2;

    // velocity for spring motion
    this.vx = 0;
    this.vy = 0;

    // presentation
    this.zoom = 1.0;
    this.zoomV = 0;

    // meditative knobs (tune)
    this.deadzoneX = 90;   // px around center before cam reacts
    this.deadzoneY = 70;
    this.lookAhead = 140;  // px
    this.maxLookAhead = 200;

    this.spring = 0.09;    // “pull” strength
    this.damping = 0.78;   // “calm” / friction

    // subtle drift/breathing
    this.t = random(1000);
    this.breatheAmp = 6;     // px
    this.breatheSpeed = 0.008;

    // moments: temporary focus/linger
    this.focusTimer = 0;
    this.focusX = 0;
    this.focusY = 0;
    this.focusZoom = 1.0;
  }

  // Call this when you want the camera to “notice” something
  cueFocus(x, y, holdFrames = 60, zoom = 1.06) {
    this.focusTimer = max(this.focusTimer, holdFrames);
    this.focusX = x;
    this.focusY = y;
    this.focusZoom = zoom;
  }

  // Critically: update camera using player + level (called every frame)
  update(player, level) {
    // Desired camera center
    let desiredCx = player.x;
    let desiredCy = player.y;

    // Look-ahead based on horizontal velocity
    const la = constrain(player.vx * 28, -this.maxLookAhead, this.maxLookAhead);
    desiredCx += la;

    // Deadzone: only move if player exits calm region
    const dx = desiredCx - this.cx;
    if (abs(dx) < this.deadzoneX) desiredCx = this.cx;

    const dy = desiredCy - this.cy;
    if (abs(dy) < this.deadzoneY) desiredCy = this.cy;

    // If focusing on a discovered symbol, blend target toward it
    if (this.focusTimer > 0) {
      const k = 0.55; // how strongly we bias attention to the focus point
      desiredCx = lerp(desiredCx, this.focusX, k);
      desiredCy = lerp(desiredCy, this.focusY, k);
      this.focusTimer--;
    }

    // Add breathing drift (very subtle)
    this.t += this.breatheSpeed;
    const driftX = (noise(this.t) - 0.5) * 2 * this.breatheAmp;
    const driftY = (noise(this.t + 999) - 0.5) * 2 * (this.breatheAmp * 0.7);

    desiredCx += driftX;
    desiredCy += driftY;

    // Spring-damper toward desired center
    const ax = (desiredCx - this.cx) * this.spring;
    const ay = (desiredCy - this.cy) * this.spring;

    this.vx = (this.vx + ax) * this.damping;
    this.vy = (this.vy + ay) * this.damping;

    this.cx += this.vx;
    this.cy += this.vy;

    // Zoom: calmer when slow, slightly wider when fast
    const speed = abs(player.vx) + abs(player.vy) * 0.2;
    let desiredZoom = map(constrain(speed, 0, 6), 0, 6, 1.08, 0.98);
    if (this.focusTimer > 0) desiredZoom = lerp(desiredZoom, this.focusZoom, 0.6);

    // Smooth zoom
    const zA = (desiredZoom - this.zoom) * 0.10;
    this.zoomV = (this.zoomV + zA) * 0.80;
    this.zoom += this.zoomV;

    // Convert center -> top-left (x,y)
    this.x = this.cx - this.viewW / 2;
    this.y = this.cy - this.viewH / 2;

    // Clamp to world
    this.clampToWorld(level.w, level.h);
  }

  clampToWorld(worldW, worldH) {
    // With zoom, visible area changes
    const visW = this.viewW / this.zoom;
    const visH = this.viewH / this.zoom;

    const maxX = max(0, worldW - visW);
    const maxY = max(0, worldH - visH);

    this.x = constrain(this.x, 0, maxX);
    this.y = constrain(this.y, 0, maxY);

    // keep center consistent with clamped x,y
    this.cx = this.x + visW / 2;
    this.cy = this.y + visH / 2;
  }

  // Use zoom + translation around the viewport center
  begin() {
    push();
    translate(this.viewW / 2, this.viewH / 2);
    scale(this.zoom);
    translate(-(this.x + (this.viewW / 2) / this.zoom), -(this.y + (this.viewH / 2) / this.zoom));
  }

  end() {
    pop();
  }

  // Helpful: is a world point inside the current view?
  worldPointInView(px, py, margin = 0) {
    const visW = this.viewW / this.zoom;
    const visH = this.viewH / this.zoom;
    return (
      px >= this.x - margin &&
      px <= this.x + visW + margin &&
      py >= this.y - margin &&
      py <= this.y + visH + margin
    );
  }
}