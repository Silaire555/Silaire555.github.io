// 银河背景（透明、底层、Three.js实现）
(function() {
  // 创建 canvas，置于最底层，且不影响鼠标事件
  const canvas = document.createElement('canvas');
  canvas.id = 'galaxy-bg-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';          // 最底层（开屏立方体 9999，鼠标轨迹 10000）
  canvas.style.pointerEvents = 'none'; // 让鼠标事件穿透到上层
  document.body.insertBefore(canvas, document.body.firstChild); // 确保在最底下

  // 初始化 Three.js
  const scene = new THREE.Scene();
  // 场景透明（重要！）
  scene.background = null;

  // 正交相机（保证平面铺满屏幕）
  let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true }); // alpha: true 透明背景
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // 完全透明

  // ==================== 着色器代码（来自原版，适配 Three.js） ====================
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uFocal;
    uniform vec2 uRotation;
    uniform float uStarSpeed;
    uniform float uDensity;
    uniform float uHueShift;
    uniform float uSpeed;
    uniform vec2 uMouse;
    uniform float uGlowIntensity;
    uniform float uSaturation;
    uniform bool uMouseRepulsion;
    uniform float uTwinkleIntensity;
    uniform float uRotationSpeed;
    uniform float uRepulsionStrength;
    uniform float uMouseActiveFactor;
    uniform float uAutoCenterRepulsion;
    uniform float uScroll;
    uniform bool uTransparent;
    varying vec2 vUv;

    #define NUM_LAYER 4.0
    #define STAR_COLOR_CUTOFF 0.2
    #define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
    #define PERIOD 3.0

    float Hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float tri(float x) {
      return abs(fract(x) * 2.0 - 1.0);
    }
    float tris(float x) {
      float t = fract(x);
      return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
    }
    float trisn(float x) {
      float t = fract(x);
      return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    float Star(vec2 uv, float flare) {
      float d = length(uv);
      float m = (0.05 * uGlowIntensity) / d;
      float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
      m += rays * flare * uGlowIntensity;
      uv *= MAT45;
      rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
      m += rays * 0.3 * flare * uGlowIntensity;
      m *= smoothstep(1.0, 0.2, d);
      return m;
    }

    vec3 StarLayer(vec2 uv) {
      vec3 col = vec3(0.0);
      vec2 gv = fract(uv) - 0.5;
      vec2 id = floor(uv);
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 offset = vec2(float(x), float(y));
          vec2 si = id + offset;
          float seed = Hash21(si);
          float size = fract(seed * 345.32);
          float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
          float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;
          // 冷白色星星（偏蓝调白，干净高级）
          float red = 0.92;
          float grn = 0.97;
          float blu = 1.0;
          vec3 base = vec3(red, grn, blu);
          float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
          hue = fract(hue + uHueShift / 140.0);
          float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation + 0.4;
          float val = max(max(base.r, base.g), base.b);
          base = hsv2rgb(vec3(hue, sat, val));
          vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
          float star = Star(gv - offset - pad, flareSize);
          float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
          twinkle = mix(1.0, twinkle, uTwinkleIntensity);
          star *= twinkle;
          col += star * size * base;
        }
      }
      return col;
    }

    void main() {
      vec2 focalPx = uFocal * uResolution;
      vec2 uv = (vUv * uResolution - focalPx) / uResolution.y;
      uv.y += uScroll;
      uv.x += uScroll * 0.3;
      vec2 mouseNorm = uMouse - vec2(0.5);
      
      if (uAutoCenterRepulsion > 0.0) {
        vec2 centerUV = vec2(0.0, 0.0);
        float centerDist = length(uv - centerUV);
        vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
        uv += repulsion * 0.05;
      } else if (uMouseRepulsion) {
        vec2 mousePosUV = (uMouse * uResolution - focalPx) / uResolution.y;
        float mouseDist = length(uv - mousePosUV);
        vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
        uv += repulsion * 0.05 * uMouseActiveFactor;
      } else {
        vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
        uv += mouseOffset;
      }

      float autoRotAngle = uTime * uRotationSpeed;
      mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
      uv = autoRot * uv;
      uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

      vec3 col = vec3(0.0);
      for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
        float depth = fract(i + uStarSpeed * uSpeed);
        float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
        float fade = depth * smoothstep(1.0, 0.9, depth);
        col += StarLayer(uv * scale + i * 453.32) * fade;
      }

      if (uTransparent) {
        float alpha = length(col);
        alpha = smoothstep(0.0, 0.3, alpha);
        alpha = min(alpha, 1.0);
        gl_FragColor = vec4(col, alpha);
      } else {
        gl_FragColor = vec4(col, 1.0);
      }
    }
  `;

  // 几何体：一个平面覆盖 NDC 空间
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uFocal: { value: new THREE.Vector2(0.5, 0.5) },
      uRotation: { value: new THREE.Vector2(1.0, 0.0) },
      uStarSpeed: { value: 0.3 },
      uDensity: { value: 1.0 },
      uHueShift: { value: 140.0 },     // 蓝紫色银河
      uSpeed: { value: 0.5 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uGlowIntensity: { value: 0.3 },
      uSaturation: { value: 0.0 },
      uMouseRepulsion: { value: true },
      uTwinkleIntensity: { value: 0.3 },
      uRotationSpeed: { value: 0.05 },
      uRepulsionStrength: { value: 1.0 },
      uMouseActiveFactor: { value: 0.0 },
      uAutoCenterRepulsion: { value: 0.0 },
      uTransparent: { value: true },
      uScroll: { value: 0 }
    }
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // 鼠标交互数据（平滑）
  let targetMousePos = { x: 0.5, y: 0.5 };
  let smoothMousePos = { x: 0.5, y: 0.5 };
  let targetMouseActive = 0.0;
  let smoothMouseActive = 0.0;

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1.0 - (e.clientY - rect.top) / rect.height;
    targetMousePos = { x, y };
    targetMouseActive = 1.0;
  }
  function onMouseLeave() {
    targetMouseActive = 0.0;
  }
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);

  // 动画循环
  let startTime = performance.now();
  function animate() {
    const now = performance.now();
    const t = (now - startTime) / 1000;

    // 更新着色器时间
    material.uniforms.uTime.value = t;

    // 平滑鼠标位置
    const lerp = 0.05;
    smoothMousePos.x += (targetMousePos.x - smoothMousePos.x) * lerp;
    smoothMousePos.y += (targetMousePos.y - smoothMousePos.y) * lerp;
    smoothMouseActive += (targetMouseActive - smoothMouseActive) * lerp;

    material.uniforms.uMouse.value.set(smoothMousePos.x, smoothMousePos.y);
    material.uniforms.uMouseActiveFactor.value = smoothMouseActive;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // 窗口大小适配
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    material.uniforms.uResolution.value.set(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  // 可选：暴露参数以便调试（在控制台修改）
  window.galaxyUniforms = material.uniforms;
  let scrollY = 0;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    // 系数 0.002 控制移动幅度，正负控制方向（负值让背景向下滚动时向上移，产生视差）
    if (material) material.uniforms.uScroll.value = scrollY * 0.002;
  });
})();