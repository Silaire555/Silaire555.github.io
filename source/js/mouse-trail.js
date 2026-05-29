(function() {
  // 创建全屏 canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'mouse-trail-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '10';
  document.body.appendChild(canvas);

  // 启用 SVG 滤镜（液态粘合效果）
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("style", "position:fixed; top:0; left:0; width:0; height:0; z-index:10001;");
  const defs = document.createElementNS(svgNS, "defs");
  const filter = document.createElementNS(svgNS, "filter");
  filter.setAttribute("id", "goo");
  const blur = document.createElementNS(svgNS, "feGaussianBlur");
  blur.setAttribute("in", "SourceGraphic");
  blur.setAttribute("stdDeviation", "8");
  const colorMatrix = document.createElementNS(svgNS, "feColorMatrix");
  colorMatrix.setAttribute("type", "matrix");
  colorMatrix.setAttribute("values", "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9");
  filter.appendChild(blur);
  filter.appendChild(colorMatrix);
  defs.appendChild(filter);
  svg.appendChild(defs);
  document.body.appendChild(svg);

  // 将 canvas 的滤镜指向 SVG 滤镜
  canvas.style.filter = "url(#goo)";

  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  // 粒子数组（圆点）
  let particles = [];
  const MAX_PARTICLES = 35;   // 越少越稀疏
  const PARTICLE_SIZE = 14;    // 圆点直径（像素）

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = PARTICLE_SIZE / 2;
      this.alpha = 1.0;
      this.life = 1.0;
    }
    update() {
      this.life -= 0.025;    // 消失速度
      this.alpha = this.life;
      return this.life > 0;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = '#e5e1e1';   // 纯蓝色
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function addParticle(x, y) {
    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }
    particles.push(new Particle(x, y));
  }

  function updateParticles() {
    particles = particles.filter(p => p.update());
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => p.draw());
    requestAnimationFrame(updateParticles);
  }
  updateParticles();

  // 鼠标移动时添加粒子
  let lastX = 0, lastY = 0;
  function onMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY;
    addParticle(x, y);
    lastX = x;
    lastY = y;
  }
  window.addEventListener('mousemove', onMouseMove);

  // 窗口大小自适应
  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });
})();