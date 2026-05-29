(function() {
  const words = ['✨', '⭐', '🎨', '💙', '✨', 'Love u'];
  window.addEventListener('click', (e) => {
    const span = document.createElement('span');
    span.textContent = words[Math.floor(Math.random() * words.length)];
    span.style.position = 'fixed';
    span.style.left = e.clientX + 'px';
    span.style.top = e.clientY + 'px';
    span.style.fontSize = '24px';
    span.style.pointerEvents = 'none';
    span.style.zIndex = '10001';
    span.style.opacity = '1';
    span.style.transition = 'all 1s ease-out';
    document.body.appendChild(span);
    requestAnimationFrame(() => {
      span.style.transform = 'translateY(-80px)';
      span.style.opacity = '0';
    });
    setTimeout(() => span.remove(), 1000);
  });
})();