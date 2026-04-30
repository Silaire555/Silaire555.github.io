import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    // --- 创建全屏 canvas ---
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

    // --- 场景、相机、渲染器 ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030318);
    scene.fog = new THREE.FogExp2(0x030318, 0.008);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3.2);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- 暴露相机和场景到控制台（调试用）---
    window._debugCamera = camera;
    window._debugScene = scene;

    // --- 添加交互控制（方便调整相机位置）---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;      // 惯性效果
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true; // 避免平移时倾斜
    controls.target.set(0, 1.2, 0);
    controls.update();

    // --- 灯光 ---
    const ambientLight = new THREE.AmbientLight(0x333344);
    scene.add(ambientLight);
    const mainLight = new THREE.DirectionalLight(0xffeedd, 1);
    mainLight.position.set(1, 2, 1.5);
    scene.add(mainLight);
    const backLight = new THREE.PointLight(0xccaa88, 0.5);
    backLight.position.set(-0.5, 1, -1);
    scene.add(backLight);
    const fillLight = new THREE.PointLight(0x88aaff, 0.3);
    fillLight.position.set(0, -1, 0);
    scene.add(fillLight);

    // --- 加载模型 ---
    const loader = new GLTFLoader();
    const modelPath = '/models/Mita_material.glb';
    loader.load(modelPath,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        model.position.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        console.log('✅ 模型加载成功');
      },
      (xhr) => {
        console.log(`${Math.round(xhr.loaded / xhr.total * 100)}% loaded`);
      },
      (error) => {
        console.error('❌ 模型加载失败:', error);
      }
    );

    // --- 粒子星星 ---
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 6 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      starPos[i*3+2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.05, transparent: true, blending: THREE.AdditiveBlending });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 大星星
    const bigStarCount = 300;
    const bigStarGeo = new THREE.BufferGeometry();
    const bigStarPos = new Float32Array(bigStarCount * 3);
    for (let i = 0; i < bigStarCount; i++) {
      const r = 10 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bigStarPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
      bigStarPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      bigStarPos[i*3+2] = r * Math.cos(phi);
    }
    bigStarGeo.setAttribute('position', new THREE.BufferAttribute(bigStarPos, 3));
    const bigStarMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, blending: THREE.AdditiveBlending });
    const bigStars = new THREE.Points(bigStarGeo, bigStarMat);
    scene.add(bigStars);

    // --- 辅助调试面板（显示相机位置，可复制）---
    const infoDiv = document.createElement('div');
    infoDiv.style.position = 'fixed';
    infoDiv.style.bottom = '20px';
    infoDiv.style.left = '20px';
    infoDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
    infoDiv.style.color = '#0f0';
    infoDiv.style.padding = '8px 12px';
    infoDiv.style.fontSize = '12px';
    infoDiv.style.fontFamily = 'monospace';
    infoDiv.style.zIndex = '100000';
    infoDiv.style.borderRadius = '6px';
    document.body.appendChild(infoDiv);

    function updateInfo() {
      const pos = camera.position;
      const target = controls.target;
      infoDiv.innerHTML = `
        📷 相机位置: x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)}<br>
        🎯 看向点: x=${target.x.toFixed(2)}, y=${target.y.toFixed(2)}, z=${target.z.toFixed(2)}<br>
        <button id="copyCamPos" style="margin-top:4px;">📋 复制相机参数</button>
      `;
      const btn = document.getElementById('copyCamPos');
      if (btn) {
        btn.onclick = () => {
          const code = `camera.position.set(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)});\ncamera.lookAt(${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)});`;
          navigator.clipboard.writeText(code);
          alert('已复制到剪贴板！');
        };
      }
      requestAnimationFrame(updateInfo);
    }
    updateInfo();

    // --- 动画循环（相机位置完全由 OrbitControls 控制，不自动移动）---
    function animate() {
      requestAnimationFrame(animate);
      controls.update();   // 更新 OrbitControls（必须）
      renderer.render(scene, camera);
    }
    animate();

    // --- 窗口适配 ---
    window.addEventListener('resize', onWindowResize);
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // --- 开屏动画 3 秒后淡出移除（可选）---
    setTimeout(() => {
      canvas.style.transition = 'opacity 0.4s ease';
      canvas.style.opacity = '0';
      setTimeout(() => {
        if (canvas && canvas.parentNode) canvas.remove();
        document.body.classList.add('loaded');
      }, 500);
    }, 3000);

    console.log('✨ 调试环境已就绪，你可以用鼠标拖拽/缩放来调整相机位置');
  });
})();
