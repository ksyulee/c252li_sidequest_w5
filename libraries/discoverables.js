class HiddenSymbol {
  constructor(x, y, r = 10) {
    this.x = x;
    this.y = y;
    this.r = r;

    this.found = false;     // revealed when camera sees it
    this.collected = false; // set true only when player presses E nearby
    this.pulseT = random(1000);
  }

  // Called once when player presses E (from keyPressed)
  tryCollect(cam, player) {
    if (!this.found || this.collected) return false;

    const d = dist(player.x, player.y, this.x, this.y);
    if (d < this.r + player.r + 10) {
      this.collected = true;
      if (cam && cam.cueFocus) cam.cueFocus(this.x, this.y, 25, 1.09);
      return true;
    }
    return false;
  }

  // Called every frame
  update(cam, player) {
    // reveal when camera sees it
    if (!this.found && cam.worldPointInView(this.x, this.y, 30)) {
      this.found = true;
      if (cam && cam.cueFocus) cam.cueFocus(this.x, this.y, 45, 1.07);
    }

    this.pulseT += 0.02;
  }

  draw() {
    if (!this.found) return;

    push();
    noStroke();

    const pulse = 0.6 + 0.4 * sin(this.pulseT);
    const rr = this.r + pulse * 2;

    fill(0, 0, 0, this.collected ? 30 : 55);
    ellipse(this.x, this.y, rr * 2.6, rr * 2.6);

    fill(0, 0, 0, this.collected ? 90 : 140);
    ellipse(this.x, this.y, rr * 1.4, rr * 1.4);

    stroke(255, 220);
    strokeWeight(2);
    line(this.x - 4, this.y, this.x + 4, this.y);
    line(this.x, this.y - 4, this.x, this.y + 4);

    pop();
  }
}