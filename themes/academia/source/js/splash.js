// ============================================================
// 不规则恒星 + 星轨 + 粒子星星 + 鼠标波动 + 加速旋转 + 白屏结束
// ============================================================
(function() {
  window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('splash-canvas');
    if (!canvas) return;

    // --- 初始化场景、相机、渲染器 ---
    const scene = new THREE.Scene();
    // 背景：纯黑，微微蓝色（通过渐变背景或在远处加光晕实现更好，这里直接设置深蓝色）
    scene.background = new THREE.Color(0x01041a); // 极深蓝黑

    // 透视相机 (视角, 宽高比, 近平面, 远平面)
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- 可选：添加一点雾效，让远处粒子隐没
    scene.fog = new THREE.FogExp2(0x01041a, 0.02);

    // --------------------------------------------------------
    // 1. 中心不规则发光“石头”星球
    // --------------------------------------------------------
    // 创建几何体：细分较多的球体，然后随机扰动顶点半径
    const starGeometry = new THREE.SphereGeometry(1.0, 128, 128);
    const positions = starGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i+1];
      const z = positions[i+2];
      // 归一化方向
      let len = Math.hypot(x, y, z);
      if (len === 0) continue;
      // 不规则扰动：半径在 0.8 到 1.25 之间随机，并加入正弦波使表面有起伏感
      const noise = 0.85 + Math.sin(x * 4) * 0.08 + Math.cos(y * 5) * 0.08 + Math.sin(z * 4.5) * 0.08;
      const r = 1.0 + (Math.random() - 0.5) * 0.25 * noise;
      positions[i] = (x / len) * r;
      positions[i+1] = (y / len) * r;
      positions[i+2] = (z / len) * r;
    }
    starGeometry.computeVertexNormals(); // 更新法线以便光照正确

    const starMaterial = new THREE.MeshStandardMaterial({
      color: 0xffeedd,
      emissive: 0xffaa66,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      metalness: 0.7,
      flatShading: false
    });
    const coreStar = new THREE.Mesh(starGeometry, starMaterial);
    scene.add(coreStar);

    // 额外添加一个发光光晕效果（简单地加一个半透明稍大的球体）
    const glowGeometry = new THREE.SphereGeometry(1.15, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa88,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowSphere);

    // --------------------------------------------------------
    // 2. 星轨：多条不同半径、不同倾斜度的线条环
    // --------------------------------------------------------
    const orbitCount = 5;
    const orbits = [];       // 存储每个轨道的 { mesh, radius, originalPoints, speedFactor, rotationAngle }
    const orbitColors = [0x88aaff, 0x77ccff, 0x66ccff, 0x55bbff, 0x44aaff];
    const orbitRadii = [1.9, 2.5, 3.2, 3.9, 4.5];
    const orbitTilts = [0, 0.2, -0.15, 0.3, -0.2]; // 绕X轴倾斜弧度
    
    // 每个轨道的分段数
    const segments = 180;
    
    // 存储每个轨道原始顶点位置（用于鼠标波动）
    const orbitOriginalPoints = [];
    
    for (let i = 0; i < orbitCount; i++) {
      const radius = orbitRadii[i];
      const tilt = orbitTilts[i];
      const points = [];
      const originalPoints = [];
      
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        const y = 0;
        // 应用倾斜：绕X轴旋转矩阵
        const cosTilt = Math.cos(tilt);
        const sinTilt = Math.sin(tilt);
        const rotatedY = y * cosTilt - z * sinTilt;
        const rotatedZ = y * sinTilt + z * cosTilt;
        const rotatedX = x;
        points.push(new THREE.Vector3(rotatedX, rotatedY, rotatedZ));
        originalPoints.push(new THREE.Vector3(rotatedX, rotatedY, rotatedZ));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: orbitColors[i], linewidth: 1 }); // linewidth not supported everywhere, but color works
      const orbitLine = new THREE.LineLoop(geometry, material);
      scene.add(orbitLine);
      
      orbits.push({
        mesh: orbitLine,
        radius: radius,
        tilt: tilt,
        originalPoints: originalPoints,
        speedFactor: 0.8 + i * 0.2,   // 外圈稍快
        rotationAngle: 0,
        currentRotation: 0
      });
    }
    
    // 额外添加一些细小的星轨碎片粒子（围绕星轨的发光点）
    const dustParticleCount = 800;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustParticleCount * 3);
    for (let i = 0; i < dustParticleCount; i++) {
      const r = 2 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 1.5;
      dustPositions[i*3] = Math.cos(angle) * r;
      dustPositions[i*3+1] = yOffset;
      dustPositions[i*3+2] = Math.sin(angle) * r;
    }
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.05,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    const dustParticles = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustParticles);
    
    // --------------------------------------------------------
    // 3. 白色发光粒子（星星）背景
    // --------------------------------------------------------
    const starFieldCount = 1500;
    const starFieldGeo = new THREE.BufferGeometry();
    const starFieldPos = new Float32Array(starFieldCount * 3);
    for (let i = 0; i < starFieldCount; i++) {
      // 分布在较大的球形范围，但避免靠近中心
      const rad = 8 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starFieldPos[i*3] = rad * Math.sin(phi) * Math.cos(theta);
      starFieldPos[i*3+1] = rad * Math.sin(phi) * Math.sin(theta) * 0.6;
      starFieldPos[i*3+2] = rad * Math.cos(phi);
    }
    starFieldGeo.setAttribute('position', new THREE.BufferAttribute(starFieldPos, 3));
    const starFieldMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(starFieldGeo, starFieldMat);
    scene.add(starField);
    
    // --------------------------------------------------------
    // 4. 照明：照亮中心区域，产生中心亮、周围渐变暗的效果
    // --------------------------------------------------------
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x111122);
    scene.add(ambientLight);
    // 点光源从中心照亮
    const coreLight = new THREE.PointLight(0xffaa88, 1.5);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    // 辅助背光，增加立体感
    const backLight = new THREE.DirectionalLight(0x88aaff, 0.5);
    backLight.position.set(1, 2, 3);
    scene.add(backLight);
    
    // 可选：在相机附近加一点点光晕效果（简单模拟）
    
    // --------------------------------------------------------
    // 5. 鼠标交互：影响星轨波动
    // --------------------------------------------------------
    let mouseX = 0, mouseY = 0;
    let targetWaveStrength = 0;
    let currentWaveStrength = 0;
    
    window.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = (event.clientY / window.innerHeight) * 2 - 1;
      targetWaveStrength = Math.sqrt(mouseX*mouseX + mouseY*mouseY) * 0.5;
    });
    window.addEventListener('mouseleave', () => {
      targetWaveStrength = 0;
    });
    
    // 为每个轨道预先存储顶点数组引用，以便更新位置
    // 我们将在动画中动态更新星轨顶点位置：基于原始位置 + 鼠标驱动的径向偏移
    function updateOrbitWave() {
      // 平滑波动强度
      currentWaveStrength += (targetWaveStrength - currentWaveStrength) * 0.1;
      const strength = currentWaveStrength;
      
      for (let idx = 0; idx < orbits.length; idx++) {
        const orbit = orbits[idx];
        const positionsAttr = orbit.mesh.geometry.attributes.position;
        if (!positionsAttr) continue;
        const posArray = positionsAttr.array;
        const origPoints = orbit.originalPoints;
        const radius = orbit.radius;
        
        for (let i = 0; i <= segments; i++) {
          const orig = origPoints[i % origPoints.length];
          // 波动公式：根据角度，径向偏移，并受鼠标方向影响
          const angle = Math.atan2(orig.z, orig.x);
          const waveRad = Math.sin(angle * 3) * 0.05 * strength +
                          Math.cos(angle * 5) * 0.03 * strength;
          // 鼠标方向偏移：朝着鼠标点方向轻微拉伸
          const dirX = mouseX, dirY = mouseY;
          const influenceX = dirX * 0.08 * strength * Math.sin(angle);
          const influenceY = dirY * 0.05 * strength * Math.cos(angle);
          
          let newX = orig.x + waveRad * Math.cos(angle) + influenceX;
          let newZ = orig.z + waveRad * Math.sin(angle) + influenceY;
          let newY = orig.y;
          
          // 应用倾斜（保持原始倾斜）
          // 由于原始点已经倾斜，我们只需保持相对位置？实际上原始点已经是倾斜后的坐标，
          // 但波动不应该破坏倾斜，所以我们直接修改相对坐标系下的坐标。
          // 简单起见，保持新位置在原始倾斜坐标系中。
          posArray[i*3] = newX;
          posArray[i*3+1] = newY;
          posArray[i*3+2] = newZ;
        }
        positionsAttr.needsUpdate = true;
      }
    }
    
    // --------------------------------------------------------
    // 6. 整体动画：星轨加速旋转 + 白屏渐现
    // --------------------------------------------------------
    const ANIMATION_DURATION = 5000; // 总时长5秒（星轨加速直至白屏）
    const startTime = performance.now();
    
    // 初始旋转速度 (弧度/帧)
    let baseRotationSpeed = 0.002;
    let currentRotationSpeed = baseRotationSpeed;
    
    // 白屏覆盖层
    const whiteOverlay = document.createElement('div');
    whiteOverlay.style.position = 'fixed';
    whiteOverlay.style.top = '0';
    whiteOverlay.style.left = '0';
    whiteOverlay.style.width = '100%';
    whiteOverlay.style.height = '100%';
    whiteOverlay.style.backgroundColor = 'white';
    whiteOverlay.style.pointerEvents = 'none';
    whiteOverlay.style.zIndex = '10000';
    whiteOverlay.style.opacity = '0';
    whiteOverlay.style.transition = 'opacity 0.2s linear';
    document.body.appendChild(whiteOverlay);
    
    let sceneBrightness = 0;   // 用于控制额外光强
    let coreLightIntensity = 1.5;
    
    // 存储每个轨道的累积旋转角度
    for (let i = 0; i < orbits.length; i++) {
      orbits[i].currentRotation = 0;
    }
    
    // 预先为每条轨道的几何体创建旋转矩阵用的对象
    function rotateOrbit(orbit, angleRad) {
      // 为了性能，直接旋转整个轨道对象？不行，因为轨道是LineLoop，旋转其Mesh即可
      // 这里我们直接旋转每个轨道的mesh，因为LineLoop也是Object3D，可以设置旋转属性
      // 但注意：如果直接旋转mesh，原始顶点位置不需要改变，而且波动会叠加在旋转后的基础上。
      // 我们已用原始顶点+波动更新位置，且每个轨道单独旋转会与波动冲突。
      // 为了简化，不对轨道对象做旋转，而是在每帧重新计算所有顶点位置：基于原始位置旋转角度+波动。
      // 但性能较差。另一种方式：保持每个轨道独立旋转其mesh，波动时相对于世界坐标。
      // 我们采用更清晰的方式：每帧更新geometry顶点时，先计算旋转后的基准点，再叠加波动。
    }
    
    // 更高效的方案：我们不对轨道整体旋转mesh，而是维护一个累积角度，每帧重新生成顶点位置（旋转+波动）
    // 这样可以保证波动与旋转独立，并且可以加速旋转。但每帧重算所有顶点（~5*180 = 900点）完全可以接受。
    
    function rebuildOrbitsWithRotation(globalAngle) {
      for (let idx = 0; idx < orbits.length; idx++) {
        const orbit = orbits[idx];
        const radius = orbit.radius;
        const tilt = orbit.tilt;
        const origPoints = orbit.originalPoints; // 未旋转的原始点（但原始点已包含倾斜，我们需要无倾斜的圆环再旋转）
        // 实际上我们更简单: 重新根据半径和倾斜生成旋转后的点。
        const points = [];
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2 + globalAngle * orbit.speedFactor;
          const x0 = radius * Math.cos(angle);
          const z0 = radius * Math.sin(angle);
          let y0 = 0;
          // 倾斜变换 (绕X轴)
          const cosTilt = Math.cos(tilt);
          const sinTilt = Math.sin(tilt);
          let y = y0 * cosTilt - z0 * sinTilt;
          let z = y0 * sinTilt + z0 * cosTilt;
          let x = x0;
          points.push(new THREE.Vector3(x, y, z));
        }
        // 更新geometry
        const newGeo = new THREE.BufferGeometry().setFromPoints(points);
        orbit.mesh.geometry.dispose(); // 避免内存泄露
        orbit.mesh.geometry = newGeo;
        // 重新存储未波动的点用于波动（但波动我们单独处理，为了简单，先不做波动？或者波动重新实现）
        // 由于我们已经决定每帧全量更新，波动可以在此一并加上
      }
    }
    
    // 为了同时实现波动和旋转，我们每帧完全重新计算顶点：旋转 + 波动偏移
    function updateOrbits(globalAngle, waveStrength) {
      for (let idx = 0; idx < orbits.length; idx++) {
        const orbit = orbits[idx];
        const radius = orbit.radius;
        const tilt = orbit.tilt;
        const points = [];
        for (let i = 0; i <= segments; i++) {
          let angle = (i / segments) * Math.PI * 2 + globalAngle * orbit.speedFactor;
          let x0 = radius * Math.cos(angle);
          let z0 = radius * Math.sin(angle);
          let y0 = 0;
          // 倾斜
          const cosTilt = Math.cos(tilt);
          const sinTilt = Math.sin(tilt);
          let y = y0 * cosTilt - z0 * sinTilt;
          let z = y0 * sinTilt + z0 * cosTilt;
          let x = x0;
          
          // --- 鼠标波动（影响径向位置）---
          if (waveStrength > 0) {
            const r = Math.hypot(x, z);
            const angleDir = Math.atan2(z, x);
            // 沿着径向偏移，幅度取决于鼠标位置和角度
            const waveRad = Math.sin(angleDir * 4) * 0.06 * waveStrength +
                            Math.cos(angleDir * 6) * 0.04 * waveStrength;
            const radialOffset = waveRad;
            x += radialOffset * Math.cos(angleDir);
            z += radialOffset * Math.sin(angleDir);
            // 轻微Y轴波动
            y += Math.sin(angleDir * 5) * 0.04 * waveStrength * mouseY;
          }
          
          points.push(new THREE.Vector3(x, y, z));
        }
        const newGeo = new THREE.BufferGeometry().setFromPoints(points);
        if (orbit.mesh.geometry) orbit.mesh.geometry.dispose();
        orbit.mesh.geometry = newGeo;
      }
    }
    
    // --------------------------------------------------------
    // 动画循环
    // --------------------------------------------------------
    let animFrameId;
    let globalAngle = 0;
    
    function animate() {
      const now = performance.now();
      const elapsed = Math.min(ANIMATION_DURATION, now - startTime);
      const t = elapsed / ANIMATION_DURATION; // 0 -> 1
      
      // 1. 旋转速度：从 baseSpeed 线性增加到 endSpeed，最后急速
      const endSpeed = 0.025;
      let speed = baseRotationSpeed + (endSpeed - baseRotationSpeed) * Math.pow(t, 1.5);
      // 越转越快，在末期爆炸式加速
      if (t > 0.7) {
        speed *= (1 + (t-0.7)/0.3 * 2);
      }
      currentRotationSpeed = speed;
      globalAngle += currentRotationSpeed;
      
      // 2. 鼠标波动强度（随时间稍微减弱一点也可，但保留交互）
      const waveStrength = currentWaveStrength * (1 - t * 0.3);
      
      // 3. 更新星轨几何体（旋转+波动）
      updateOrbits(globalAngle, waveStrength);
      
      // 4. 让恒星光晕和粒子星星整体缓慢自转
      coreStar.rotation.y += 0.003;
      glowSphere.rotation.y -= 0.001;
      starField.rotation.y += 0.0005;
      starField.rotation.x += 0.0003;
      dustParticles.rotation.y += 0.001;
      
      // 5. 核心光源亮度增加（模拟变亮）
      coreLightIntensity = 1.5 + t * 2.5;
      coreLight.intensity = coreLightIntensity;
      
      // 6. 鼠标波动强度平滑更新
      currentWaveStrength += (targetWaveStrength - currentWaveStrength) * 0.1;
      
      // 7. 白屏效果：屏幕变亮 -> 覆盖层透明度增加，同时场景背景变白
      let whiteOpacity = 0;
      if (t > 0.8) {
        whiteOpacity = (t - 0.8) / 0.2;
        whiteOpacity = Math.min(1, whiteOpacity);
      }
      whiteOverlay.style.opacity = whiteOpacity;
      
      // 同时场景背景逐渐变白（但为了平滑，最后完全白屏时移除canvas）
      if (whiteOpacity > 0.99) {
        // 动画结束，移除所有元素
        cancelAnimationFrame(animFrameId);
        if (canvas && canvas.parentNode) canvas.remove();
        whiteOverlay.remove();
        document.body.classList.add('loaded');
        return;
      }
      
      // 轻微调整相机视角，令动态感更强
      camera.position.x += (mouseX * 0.2 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 0.15 + 2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    }
    
    // 启动动画
    animate();
    
    // 窗口自适应
    window.addEventListener('resize', onResize);
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // 防止内存泄漏，清理事件（可选）
    window.addEventListener('beforeunload', () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', onResize);
    });
  });
})();