// scripts/inject-cube.js
hexo.extend.injector.register('body_begin', () => {
  return '<canvas id="splash-canvas" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;"></canvas>';
}, 'default');

hexo.extend.injector.register('body_end', () => {
  return `
<script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.128.0/build/three.module.js"
    }
  }
</script>
<script type="module" src="/js/cube.js" defer></script>
  `;
}, 'default');