// 注入开屏动画所需的 canvas 元素和 Three.js 库
hexo.extend.injector.register('body_begin', () => {
  return `<canvas id="splash-canvas" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: black;"></canvas>`;
}, 'default');

hexo.extend.injector.register('head_end', () => {
  return `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
      (function() {
        // 等待 canvas 元素出现
        function waitForCanvas(callback) {
          const canvas = document.getElementById('splash-canvas');
          if (canvas) {
            callback(canvas);
            return;
          }
          console.log('等待 canvas 元素...');
          setTimeout(() => waitForCanvas(callback), 50);
        }

        waitForCanvas((canvas) => {
          console.log('canvas 已找到，初始化动画');

          // 1. 场景
          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0x000000);

          // 2. 相机
          const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
          camera.position.set(0, 0, 3);
          camera.lookAt(0, 0, 0);

          // 3. 渲染器
          const renderer = new THREE.WebGLRenderer({ canvas });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setPixelRatio(window.devicePixelRatio);

          // 4. 白色立方体
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
          const cube = new THREE.Mesh(geometry, material);
          scene.add(cube);

          // 5. 光源（足够亮）
          const ambientLight = new THREE.AmbientLight(0x404040);
          scene.add(ambientLight);
          const light1 = new THREE.DirectionalLight(0xffffff, 1);
          light1.position.set(2, 2, 2);
          scene.add(light1);
          const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
          light2.position.set(-1, 1, -1);
          scene.add(light2);

          // 6. 粒子系统
          const particleCount = 300;
          const particlesGeometry = new THREE.BufferGeometry();
          const particlesPositions = new Float32Array(particleCount * 3);
          for (let i = 0; i < particleCount; i++) {
            particlesPositions[i*3] = (Math.random() - 0.5) * 30;
            particlesPositions[i*3+1] = (Math.random() - 0.5) * 20;
            particlesPositions[i*3+2] = (Math.random() - 0.5) * 20 - 15;
          }
          particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
          const particlesMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 });
          const particles = new THREE.Points(particlesGeometry, particlesMaterial);
          scene.add(particles);

          // 7. 动画循环
          function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.008;
            cube.rotation.y += 0.012;
            particles.rotation.y += 0.0005;
            particles.rotation.x += 0.0003;
            renderer.render(scene, camera);
          }
          animate();

          // 8. 窗口适配
          window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          });

          // 9. 可选：1.5秒后淡出移除
          setTimeout(() => {
            canvas.style.transition = 'opacity 0.5s ease';
            canvas.style.opacity = '0';
            setTimeout(() => {
              if (canvas && canvas.parentNode) canvas.remove();
              document.body.classList.add('loaded');
            }, 500);
          }, 1500);

          console.log('白色立方体 + 粒子动画已启动');
        });
      })();
    </script>
  `;
}, 'default');