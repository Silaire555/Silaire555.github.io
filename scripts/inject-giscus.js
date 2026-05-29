hexo.extend.injector.register('body_end', () => {
  return `<div class="giscus" style="margin-top: 2rem;"></div>
  <script src="https://giscus.app/client.js"
        data-repo="Silaire555/Silaire555.github.io"
        data-repo-id="R_kgDOSP06Bw"
        data-category="General"
        data-category-id="DIC_kwDOSP06B84C-BcS"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="dark_protanopia"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>`;
}, 'default');