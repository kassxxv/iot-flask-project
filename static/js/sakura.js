(function () {
  const canvas = document.getElementById('sakura-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#f8bbd0', '#f48fb1', '#fce4ec', '#f06292', '#fdd0e0'];
  const COUNT  = 38;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(min, max) { return Math.random() * (max - min) + min; }

  // Petal shape: drawn as a soft oval rotated randomly
  class Petal {
    constructor() { this.reset(true); }

    reset(initial) {
      this.x    = rand(0, canvas.width);
      this.y    = initial ? rand(-canvas.height, canvas.height) : rand(-60, -10);
      this.r    = rand(5, 11);           // radius
      this.rot  = rand(0, Math.PI * 2); // rotation angle
      this.dRot = rand(-0.015, 0.015);  // rotation speed
      this.vx   = rand(-0.5, 0.5);      // horizontal drift
      this.vy   = rand(0.6, 1.4);       // fall speed
      this.sway = rand(0.3, 0.8);       // sway amplitude
      this.swayS= rand(0.008, 0.02);    // sway speed
      this.t    = rand(0, Math.PI * 2); // sway phase
      this.alpha= rand(0.35, 0.75);
      this.color= COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    update() {
      this.t   += this.swayS;
      this.x   += this.vx + Math.sin(this.t) * this.sway;
      this.y   += this.vy;
      this.rot += this.dRot;
      if (this.y > canvas.height + 20) this.reset(false);
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle   = this.color;
      ctx.beginPath();
      // 5-petal flower via ellipses
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 5) * i);
        ctx.scale(1, 0.5);
        ctx.beginPath();
        ctx.ellipse(0, -this.r * 0.8, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  const petals = Array.from({ length: COUNT }, () => new Petal());

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    petals.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(frame);
  }
  frame();
})();
