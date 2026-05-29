// 极简开屏动画：黑色背景 + 旋转白色立方体 + 白色粒子
(function() {
  // 确保 canvas 元素存在（如果注入器已经创建了，就直接获取；否则自己创建）
  let canvas = document.getElementById('splash-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'splash-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
  }

  // 1. 初始化场景、相机、渲染器
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // 黑底

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 3);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 2. 白色立方体
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // 3. 点光源（让立方体有立体感）
  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(2, 2, 2);
  scene.add(light);

  // 4. 粒子背景（2000个小白点随机分布）
  const particleCount = 2000;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlesPositions[i*3] = (Math.random() - 0.5) * 20;
    particlesPositions[i*3+1] = (Math.random() - 0.5) * 15;
    particlesPositions[i*3+2] = (Math.random() - 0.5) * 20 - 10;
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  const particlesMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // 5. 动画循环：立方体旋转 + 粒子缓慢自转
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    particles.rotation.y += 0.001;
    particles.rotation.x += 0.0005;
    renderer.render(scene, camera);
  }
  animate();

  // 6. 可选：2秒后淡出移除动画（如果不需要自动消失，可以注释掉下面这段）
   setTimeout(() => {
    canvas.style.transition = 'opacity 0.5s ease';
    canvas.style.opacity = '0';
    setTimeout(() => {
      if (canvas && canvas.parentNode) canvas.remove();
      document.body.classList.add('loaded');
    }, 500);
  }, 2000);

  console.log('开屏动画已启动（立方体+粒子）');
})();