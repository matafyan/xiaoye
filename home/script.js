// =============================================
// 小叶助手 - Landing Page Scripts
// =============================================

(function () {
  'use strict';

  // --- Toast ---
  function showToast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  // --- Nav scroll effect ---
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    if (y > 80 && y > lastScroll) {
      nav.style.transform = 'translateY(-100%)';
    } else {
      nav.style.transform = 'translateY(0)';
    }
    lastScroll = y;
  }, { passive: true });

  // --- FAQ: auto-close others ---
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (this.open) {
        document.querySelectorAll('.faq-item').forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  // --- Download button ---
  const btnDownload = document.getElementById('btn-download');
  if (btnDownload) {
    btnDownload.addEventListener('click', function () {
      showToast('🎉 感谢下载！如链接失效请前往 GitHub 仓库下载');
    });
  }

  // --- Smooth scroll for all anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Scroll reveal (simple) ---
  // Use classes instead of inline opacity, so content is visible to crawlers without JS
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.feature-card, .api-card, .step, .shortcut-card').forEach(function (el) {
    el.classList.add('scroll-reveal');
    observer.observe(el);
  });

  console.log('🦊 小叶助手 - 宣传页已就绪');
})();
