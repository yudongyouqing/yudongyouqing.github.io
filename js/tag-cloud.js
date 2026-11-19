/* /tags/ 与 /categories/ 页 three.js 光影词云球 —— Linear 风格深色观星窗。
   数据：/tag-cloud.json、/category-cloud.json（scripts/tag-cloud-data.js 生成）。
   three.module.min.js 按需动态 import：只在标签/分类页加载，其余页面零成本。
   交互：空闲自转、拖拽惯性、hover 辉光放大、点击跳转；Swup 翻页自动重建；
   prefers-reduced-motion 时停自转。Butterfly / Redefine 双主题选择器。 */
(function () {
  var PAGES = [
    /* Butterfly */
    { list: '.page.type-tags .tag-cloud-list', json: '/tag-cloud.json' },
    { list: '.page.type-categories .category-lists', json: '/category-cloud.json' },
    /* Redefine */
    { list: '.tagcloud-content .tag-list', json: '/tag-cloud.json' },
    { list: '.category-list-content .all-category-list', json: '/category-cloud.json' }
  ];

  /* 球幕页不动全站主题状态（不强制 html.dark、不碰 localStorage）。
     画布本身自成一体的深空；导航栏用 yyq-orb-page 作用域内的纯视觉暗色 CSS 覆盖。 */
  function applyOrbState(isOrbPage) {
    if (isOrbPage) {
      document.body.classList.add('yyq-orb-page');
    } else {
      document.body.classList.remove('yyq-orb-page');
      /* 全屏球幕挂在 body 上，Swup 只换正文不带走它 —— 离开标签页必须手动拆除 */
      document.querySelectorAll('.yyq-tag-orb').forEach(function (p) { p.remove(); });
    }
  }

  function scan() {
    var isOrbPage = false;
    PAGES.forEach(function (cfg) {
      var list = document.querySelector(cfg.list);
      if (!list) return;
      isOrbPage = true;
      if (list.dataset.yyqOrb === '1') return;
      list.dataset.yyqOrb = '1';
      fetch(cfg.json)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.length) return;
          import('/js/three.module.min.js')
            .then(function (m) { buildOrb(list, data, m); })
            .catch(function () { list.dataset.yyqOrb = ''; });
        })
        .catch(function () { list.dataset.yyqOrb = ''; });
    });
    applyOrbState(isOrbPage);
  }

  var boundSwup = null;
  function bindSwup() {
    if (!window.swup || !window.swup.hooks || boundSwup === window.swup) return;
    boundSwup = window.swup;
    window.swup.hooks.on('page:view', scan);
  }
  window.addEventListener('redefine:swup:ready', bindSwup);
  bindSwup();
  scan();

  /* —— 词贴图：canvas 绘制文字 + 辉光 —— */
  function wordTexture(THREE, text, color, glow) {
    var font = '600 44px -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
    var measure = document.createElement('canvas').getContext('2d');
    measure.font = font;
    var tw = Math.ceil(measure.measureText(text).width);
    var pad = 44;
    var c = document.createElement('canvas');
    c.width = tw + pad * 2;
    c.height = 108;
    var ctx = c.getContext('2d');
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 26;
      ctx.fillStyle = color;
      ctx.fillText(text, c.width / 2, c.height / 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.94;
      ctx.fillText(text, c.width / 2, c.height / 2);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(text, c.width / 2, c.height / 2);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex: tex, aspect: c.width / c.height };
  }

  function buildOrb(list, data, THREE) {
    /* —— 全屏球幕：画布铺满视口（导航栏浮于其上），无边框无圆角 —— */
    var panel = document.createElement('div');
    panel.className = 'yyq-tag-orb';
    panel.style.cssText =
      'position:fixed;inset:0;z-index:50;overflow:hidden;' +
      'width:100vw;height:100vh;height:100dvh;' +
      'background:#0f1011;' +
      'background-image:radial-gradient(60% 50% at 18% 8%,rgba(124,119,255,.14),transparent 70%),' +
      'radial-gradient(55% 60% at 85% 90%,rgba(64,220,190,.10),transparent 70%);' +
      'touch-action:pan-y;cursor:grab;';
    document.body.appendChild(panel);
    list.style.display = 'none';

    var maxCount = data[0].count;
    var minCount = data[data.length - 1].count;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(panel.clientWidth, panel.clientHeight);
    panel.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;opacity:0;transition:opacity .6s ease;';

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(46, panel.clientWidth / panel.clientHeight, 0.1, 100);
    camera.position.z = 14.6;

    /* 背景星尘 */
    var starGeo = new THREE.BufferGeometry();
    var starPos = [];
    for (var s = 0; s < 130; s++) {
      var r = 9 + Math.random() * 9;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      starPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.055, transparent: true, opacity: 0.32, depthWrite: false
    }));
    scene.add(stars);

    /* 词精灵：黄金角球面分布 + 权重着色（Linear 紫 → 白 → 灰） */
    var sprites = [];
    var raycaster = new THREE.Raycaster();
    var pointer = new THREE.Vector2(-9, -9);

    data.forEach(function (d, i) {
      var t = maxCount === minCount ? 1 : (d.count - minCount) / (maxCount - minCount);
      var color = i === 0 ? '#a5a1ff' : t > 0.66 ? '#f2f3f5' : t > 0.33 ? '#b4b8c0' : '#6e7178';
      var glow = i === 0 || t > 0.66;
      var made = wordTexture(THREE, d.text, color, glow);
      var mat = new THREE.SpriteMaterial({ map: made.tex, transparent: true, depthWrite: false });
      var sp = new THREE.Sprite(mat);
      var base = 0.72 + Math.pow(d.count, 0.6) * 0.155;
      var w = base * 1.35;
      sp.scale.set(w * made.aspect, w, 1);

      var phi = Math.acos(1 - (2 * (i + 0.5)) / data.length);
      var theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      sp.userData = {
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi),
        link: d.link, baseScale: w, baseW: w * made.aspect
      };
      scene.add(sp);
      sprites.push(sp);
    });

    /* 交互：拖拽惯性 + hover + 点击 */
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var AUTO = reduce ? 0 : 0.0022;
    var velY = AUTO, velX = 0, tVelY = AUTO, tVelX = 0;
    var rotY = 0.6, rotX = -0.28;
    var dragging = false, moved = 0, lx = 0, ly = 0;
    var hovered = null;

    function toNDC(e) {
      var b = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - b.left) / b.width) * 2 - 1;
      pointer.y = -((e.clientY - b.top) / b.height) * 2 + 1;
    }
    panel.addEventListener('pointermove', function (e) {
      toNDC(e);
      if (dragging) {
        var dx = e.clientX - lx, dy = e.clientY - ly;
        moved += Math.abs(dx) + Math.abs(dy);
        velY = dx * 0.0042;
        velX = dy * 0.0028;
        lx = e.clientX; ly = e.clientY;
      } else {
        var b = panel.getBoundingClientRect();
        tVelY = AUTO + (((e.clientX - b.left) / b.width) * 2 - 1) * 0.007;
        tVelX = (((e.clientY - b.top) / b.height) * 2 - 1) * 0.005;
      }
    });
    panel.addEventListener('pointerleave', function () {
      if (!dragging) { tVelY = AUTO; tVelX = 0; }
      pointer.set(-9, -9);
    });
    panel.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      tVelY = AUTO; tVelX = 0;
      velY *= 0.55; velX *= 0.45;
    });
    panel.addEventListener('click', function () {
      if (moved > 6) { moved = 0; return; }
      if (hovered && hovered.userData.link) location.href = hovered.userData.link;
    });

    var faded = false;
    function frame() {
      if (!panel.isConnected) { renderer.dispose(); return; }
      if (!dragging) {
        velY += (tVelY - velY) * 0.06;
        velX += (tVelX - velX) * 0.06;
      }
      rotY += velY;
      rotX = Math.max(-0.85, Math.min(0.85, rotX + velX));

      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      var R = 5.1;

      for (var i = 0; i < sprites.length; i++) {
        var sp = sprites[i], u = sp.userData;
        var x1 = u.x * cosY + u.z * sinY;
        var z1 = -u.x * sinY + u.z * cosY;
        var y2 = u.y * cosX - z1 * sinX;
        var z2 = u.y * sinX + z1 * cosX;
        sp.position.set(x1 * R, y2 * R, z2 * R);
        var depth = (z2 + 1) / 2;
        var hoverScale = sp === hovered ? 1.16 : 1;
        sp.scale.set(u.baseW * hoverScale, u.baseScale * hoverScale, 1);
        sp.material.opacity = 0.3 + depth * 0.7;
        sp.material.depthTest = depth > 0.25;
      }

      raycaster.setFromCamera(pointer, camera);
      var hits = raycaster.intersectObjects(sprites, false);
      var nh = hits.length ? hits[0].object : null;
      if (nh !== hovered) {
        hovered = nh;
        panel.style.cursor = hovered ? 'pointer' : (dragging ? 'grabbing' : 'grab');
      }

      stars.rotation.y += 0.0004;
      renderer.render(scene, camera);
      if (!faded) { faded = true; renderer.domElement.style.opacity = '1'; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* 尺寸自适应 */
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (!panel.isConnected) return;
        renderer.setSize(panel.clientWidth, panel.clientHeight);
        camera.aspect = panel.clientWidth / panel.clientHeight;
        camera.updateProjectionMatrix();
      }, 200);
    });
  }
})();
