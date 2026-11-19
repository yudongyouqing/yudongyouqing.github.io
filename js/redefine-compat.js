/* Keep article controls working across Redefine's Swup page replacements. */
(function () {
  if (window.yyqRedefineCompat) {
    window.yyqRedefineCompat();
    return;
  }

  var MODE_KEY = 'yyq-readmode';
  var SIZE_KEY = 'yyq-readmode-fs';
  var delta = 0;
  var article;
  var baseSize;
  var boundSwup;

  function save(key, value) {
    try { sessionStorage.setItem(key, value); } catch (error) {}
  }

  function applySize() {
    delta = Math.min(0.54, Math.max(-0.26, delta));
    if (delta === 0) {
      article.style.fontSize = '';
    } else {
      /* 基准懒测量：内联为空时取当前模式的原生字号 */
      if (!article.style.fontSize) {
        var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        baseSize = parseFloat(getComputedStyle(article).fontSize) / rem || baseSize;
      }
      article.style.fontSize = (baseSize + delta).toFixed(3) + 'rem';
    }
    save(SIZE_KEY, String(delta));
  }

  function button(label, title, onClick) {
    var element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.title = title;
    element.addEventListener('click', onClick);
    return element;
  }

  function syncArticle() {
    article = document.getElementById('article-container');
    document.querySelectorAll('.yyq-read-controls, .yyq-read-entry, .yyq-read-tool').forEach(function (element) {
      element.remove();
    });
    document.body.classList.remove('read-mode');
    if (!article) return;

    /* 每次进入文章都默认阅读模式；但用户退出过的文章（按路径记）例外 ——
       刷新或经导航回到这一篇时尊重退出，换新文章恢复默认进入。 */
    var offKey = 'yyq-readmode-off:' + location.pathname;
    var active = true;
    try {
      active = !sessionStorage.getItem(offKey);
      delta = parseFloat(sessionStorage.getItem(SIZE_KEY)) || 0;
    } catch (error) {}
    var controls = document.createElement('div');
    controls.className = 'yyq-read-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', '阅读设置');

    function setReadingMode(on) {
      document.body.classList.toggle('read-mode', on);
      try {
        if (on) sessionStorage.removeItem(offKey);
        else sessionStorage.setItem(offKey, '1');
      } catch (error) {}
      article.style.fontSize = '';
      var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      baseSize = parseFloat(getComputedStyle(article).fontSize) / rem || 1;
      applySize();
    }

    function enterReadingMode() {
      setReadingMode(true);
      exit.focus({ preventScroll: true });
    }

    /* 常驻书本按钮：挂在右下角可见工具列表（无需展开齿轮），阅读模式下整个工具栏隐藏 */
    var toolButton = null;
    var visibleTools = document.querySelector('.side-tools-container .visible-tools-list');
    if (visibleTools) {
      var item = document.createElement('li');
      item.className = 'yyq-read-tool';
      toolButton = document.createElement('button');
      toolButton.type = 'button';
      toolButton.className = 'right-bottom-tools flex justify-center items-center';
      toolButton.title = '阅读模式';
      toolButton.setAttribute('aria-label', '阅读模式');
      toolButton.innerHTML = '<i class="fas fa-book-open" aria-hidden="true"></i>';
      toolButton.addEventListener('click', enterReadingMode);
      item.appendChild(toolButton);
      visibleTools.prepend(item);

      /* 字号 A+/A−（我们自己的，齿轮旁常驻；主题自带的放大镜对已用 CSS 隐藏） */
      [['A+', '放大字号', 0.06], ['A−', '缩小字号', -0.06]].forEach(function (pair) {
        var li = document.createElement('li');
        li.className = 'yyq-read-tool';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'right-bottom-tools flex justify-center items-center';
        btn.title = pair[1];
        btn.setAttribute('aria-label', pair[1]);
        btn.textContent = pair[0];
        btn.addEventListener('click', function () { delta += pair[2]; applySize(); });
        li.appendChild(btn);
        item.insertAdjacentElement('afterend', li);
        item = li;
      });
    }

    var exit = button('退出阅读', '恢复普通文章排版', function () {
      setReadingMode(false);
      if (toolButton) toolButton.focus({ preventScroll: true });
    });
    controls.appendChild(exit);
    controls.appendChild(button('A+', '放大', function () { delta += 0.06; applySize(); }));
    controls.appendChild(button('A−', '缩小', function () { delta -= 0.06; applySize(); }));
    controls.appendChild(button('复位', '复位字号', function () { delta = 0; applySize(); }));
    controls.appendChild(button('明暗', '切换明暗', function () {
      var themeToggle = document.querySelector('.tool-dark-light-toggle');
      if (themeToggle) themeToggle.click();
    }));
    document.body.appendChild(controls);
    setReadingMode(active);
  }

  function bindSwup() {
    if (!window.swup || !window.swup.hooks || boundSwup === window.swup) return;
    boundSwup = window.swup;
    boundSwup.hooks.on('page:view', syncArticle);
    boundSwup.hooks.before('content:replace', function () {
      document.body.classList.remove('read-mode');
    });
  }

  window.yyqRedefineCompat = function () {
    syncArticle();
    bindSwup();
  };
  window.addEventListener('redefine:swup:ready', bindSwup);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.yyqRedefineCompat, { once: true });
  }
  window.yyqRedefineCompat();
})();
