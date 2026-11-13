/* 全站阅读模式增强（配套 custom.css 的 .am-fs-wrap 样式）：
   1. 跨刷新保持 —— sessionStorage 记住阅读模式状态，刷新自动重进
   2. 右上角控制组（仅阅读模式显示）：A+ / A− 字号缩放 + 明暗切换
   阅读模式下右下角工具栏按主题默认隐藏（那些按钮在阅读态均无用），
   暗色切换通过点击仍在 DOM 里的主题 #darkmode 按钮实现。 */
(function () {
  /* —— 跨刷新保持 —— */
  var KEY = 'yyq-readmode';
  function restore() {
    if (document.body.classList.contains('read-mode')) return;
    document.body.classList.add('read-mode');
    var exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'exit-readmode';
    exit.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    exit.addEventListener('click', function () {
      document.body.classList.remove('read-mode');
      exit.remove();
    });
    document.body.appendChild(exit);
  }
  try {
    if (sessionStorage.getItem(KEY) === '1') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restore);
      else restore();
    }
  } catch (e) { /* sessionStorage 不可用就跳过 */ }
  new MutationObserver(function () {
    try {
      if (document.body.classList.contains('read-mode')) sessionStorage.setItem(KEY, '1');
      else sessionStorage.removeItem(KEY);
    } catch (e) {}
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* —— 右上角控制组：字号缩放 + 明暗切换（仅文章页） —— */
  var container = document.getElementById('article-container');
  if (!container) return;

  var FS_KEY = 'yyq-readmode-fs';
  /* 基准取当前页正文的实际字号（各文章/各模式可不同），只存增量 */
  var base = parseFloat(getComputedStyle(container).fontSize) / 16 || 1;
  var delta = 0;
  try { delta = parseFloat(sessionStorage.getItem(FS_KEY)) || 0; } catch (e) {}

  function apply() {
    /* 钳制增量本身，避免累积越界后顶死在上/下限 */
    delta = Math.min(0.54, Math.max(-0.26, delta));
    container.style.fontSize = (base + delta).toFixed(3) + 'rem';
    try { sessionStorage.setItem(FS_KEY, String(delta)); } catch (e) {}
  }
  if (delta) apply();

  function mkBtn(html, title, handler) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'am-fs-btn';
    b.title = title;
    b.innerHTML = html;
    b.addEventListener('click', handler);
    return b;
  }

  var wrap = document.createElement('div');
  wrap.className = 'am-fs-wrap';
  wrap.appendChild(mkBtn('A+', '放大', function () { delta += 0.06; apply(); }));
  wrap.appendChild(mkBtn('A−', '缩小', function () { delta -= 0.06; apply(); }));
  wrap.appendChild(mkBtn('<i class="fas fa-adjust"></i>', '切换明暗', function () {
    var d = document.getElementById('darkmode');
    d && d.click();
  }));
  document.body.appendChild(wrap);
})();
