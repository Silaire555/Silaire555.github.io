// source/js/cube.js
import * as THREE from 'three';

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    // 获取 canvas
    const canvas = document.getElementById('splash-canvas');
    if (!canvas) return;

    // 场景、相机、渲染器
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 纯黑背景

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 白色立方体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 简单粒子（星星）
    const particleCount = 800;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // 分布在较大范围
      particlePositions[i*3] = (Math.random() - 0.5) * 200;
      particlePositions[i*3+1] = (Math.random() - 0.5) * 100;
      particlePositions[i*3+2] = (Math.random() - 0.5) * 100 - 50;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 光源：环境光 + 点光源
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // 动画循环：立方体旋转，粒子缓慢自转
    let time = 0;
    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.012;
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0003;
      renderer.render(scene, camera);
    }
    animate();

    // 窗口适配
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 开屏动画 2.5 秒后淡出移除（可选）
    setTimeout(() => {
      canvas.style.transition = 'opacity 0.5s ease';
      canvas.style.opacity = '0';
      setTimeout(() => canvas.remove(), 500);
    }, 2500);
  });
})();