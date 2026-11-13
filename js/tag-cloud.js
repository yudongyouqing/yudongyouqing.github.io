/* /tags/ 与 /categories/ 页 3D 旋转词云球（共用引擎）。
   数据：/tag-cloud.json、/category-cloud.json（由 scripts/tag-cloud-data.js 生成）。
   条目按文章数定字号与颜色，黄金角均匀分布在球面。
   空闲慢速自转；鼠标在球上滑动时按水平偏移加速/反向，垂直偏移控制俯仰；
   可拖拽（带惯性），点击跳转（拖动后抑制误点击）。
   颜色走 CSS 变量（custom.css），暗色模式自动适配；prefers-reduced-motion 时停自转。 */
(function () {
  var PAGES = [
    { list: '.page.type-tags .tag-cloud-list', json: '/tag-cloud.json', boost: 0 },
    { list: '.page.type-categories .category-lists', json: '/category-cloud.json', boost: 3 }
  ];

  PAGES.forEach(function (cfg) {
    var list = document.querySelector(cfg.list);
    if (!list) return;
    fetch(cfg.json)
      .then(function (r) { return r.json(); })
      .then(function (data) { if (data && data.length) buildSphere(data, list, cfg.boost); })
      .catch(function () { /* 数据拉不到就保留原生列表 */ });
  });

  function buildSphere(data, list, boost) {
    var maxCount = data[0].count;
    var minCount = data[data.length - 1].count;

    var wrap = document.createElement('div');
    wrap.id = 'tag-sphere';
    list.parentNode.insertBefore(wrap, list);
    list.style.display = 'none';

    var items = data.map(function (d, i) {
      var a = document.createElement('a');
      a.href = d.link;
      a.textContent = d.text;
      var t = maxCount === minCount ? 1 : (d.count - minCount) / (maxCount - minCount);
      a.className = i === 0 ? 'ts-top' : t > 0.66 ? 'ts-hot' : t > 0.33 ? 'ts-mid' : 'ts-low';
      a.style.fontSize = Math.round(13 + Math.pow(d.count, 0.72) * 6.5 + boost) + 'px';
      wrap.appendChild(a);

      // 黄金角球面均匀分布
      var phi = Math.acos(1 - (2 * (i + 0.5)) / data.length);
      var theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      return {
        a: a,
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi)
      };
    });

    var reduceMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var AUTO = reduceMotion ? 0 : 0.0032; // 空闲自转（弧度/帧）
    var velY = AUTO, velX = 0;
    var targetVelY = AUTO, targetVelX = 0;
    var rotY = 0, rotX = -0.28;
    var dragging = false, moved = 0, lastX = 0, lastY = 0;

    function steer(x, y) {
      var rect = wrap.getBoundingClientRect();
      var dx = (x - (rect.left + rect.width / 2)) / (rect.width / 2);
      var dy = (y - (rect.top + rect.height / 2)) / (rect.height / 2);
      targetVelY = AUTO + dx * 0.012;
      targetVelX = dy * 0.008;
    }

    wrap.addEventListener('pointermove', function (e) {
      if (dragging) {
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        moved += Math.abs(dx) + Math.abs(dy);
        velY = dx * 0.0045;
        velX = dy * 0.003;
        lastX = e.clientX;
        lastY = e.clientY;
      } else {
        steer(e.clientX, e.clientY);
      }
    });

    wrap.addEventListener('pointerdown', function (e) {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      targetVelY = AUTO;
      targetVelX = 0;
      // 松手惯性：保留当前速度的一部分，之后逐帧向 AUTO 衰减
      velY *= 0.6;
      velX *= 0.5;
    });

    wrap.addEventListener('pointerleave', function () {
      if (!dragging) {
        targetVelY = AUTO;
        targetVelX = 0;
      }
    });

    // 拖动距离超过阈值时拦截点击，避免松手误跳转
    wrap.addEventListener('click', function (e) {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
        moved = 0;
      }
    }, true);

    function frame() {
      if (!dragging) {
        velY += (targetVelY - velY) * 0.06;
        velX += (targetVelX - velX) * 0.06;
      }
      rotY += velY;
      rotX = Math.max(-0.9, Math.min(0.9, rotX + velX));

      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      var rect = wrap.getBoundingClientRect();
      var cx = rect.width / 2;
      var cy = rect.height / 2;
      var R = Math.min(cx, cy) * 0.86;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var x1 = it.x * cosY + it.z * sinY;      // 绕 Y 轴
        var z1 = -it.x * sinY + it.z * cosY;
        var y2 = it.y * cosX - z1 * sinX;        // 绕 X 轴
        var z2 = it.y * sinX + z1 * cosX;

        var depth = (z2 + 1) / 2;                // 0 最后面 .. 1 最前面
        it.a.style.transform = 'translate(-50%,-50%) translate(' + (cx + x1 * R).toFixed(1)
          + 'px,' + (cy + y2 * R * 0.92).toFixed(1) + 'px) scale(' + (0.62 + depth * 0.55).toFixed(3) + ')';
        it.a.style.opacity = (0.35 + depth * 0.65).toFixed(2);
        it.a.style.zIndex = Math.round(depth * 100);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
