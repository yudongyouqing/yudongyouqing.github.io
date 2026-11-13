/* /tags/ 页词云：wordcloud2.js 螺旋布局，字号/颜色随标签文章数，热词第一名琥珀色。
   点击词跳转对应标签页；暗色模式与窗口缩放自动重绘；无数据时回退为原生标签列表。 */
(function () {
  var data = window.__TAG_CLOUD__;
  var list = document.querySelector('.page.type-tags .tag-cloud-list');
  if (!data || !data.length || !list || typeof WordCloud === 'undefined') return;

  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var canvas = document.createElement('canvas');
  canvas.id = 'tag-wordcloud';
  list.parentNode.insertBefore(canvas, list);
  list.style.display = 'none';

  var maxCount = data[0].count;
  var minCount = data[data.length - 1].count;
  var linkOf = {};
  data.forEach(function (d) { linkOf[d.text] = d.link; });

  var hovered = null;

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function colorOf(item) {
    var text = item[0];
    var weight = item[1];
    var rank = data.findIndex(function (d) { return d.text === text; });
    var t = maxCount === minCount ? 1 : (weight - minCount) / (maxCount - minCount);
    if (isDark()) {
      if (rank === 0) return '#fbbf24';
      return t > 0.66 ? '#5eead4' : t > 0.33 ? '#2dd4bf' : '#7d8f8a';
    }
    if (rank === 0) return '#d97706';
    return t > 0.66 ? '#0f766e' : t > 0.33 ? '#2a8f85' : '#66736f';
  }

  function render() {
    var width = list.parentNode.clientWidth;
    var height = Math.max(300, Math.min(460, Math.round(width * 0.52)));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    WordCloud(canvas, {
      list: data.map(function (d) { return [d.text, d.count]; }),
      shape: 'circle',
      gridSize: Math.round(6 * dpr),
      weightFactor: function (w) {
        return (11 + Math.pow(w, 0.72) * 13) * dpr;
      },
      fontFamily: getComputedStyle(document.body).fontFamily,
      color: colorOf,
      rotateRatio: 0,
      backgroundColor: 'transparent',
      drawOutOfBound: false,
      shrinkToFit: true,
      hover: function (item) {
        hovered = item;
        canvas.style.cursor = item ? 'pointer' : 'default';
      }
    });
  }

  canvas.addEventListener('click', function () {
    if (hovered && linkOf[hovered[0]]) location.href = linkOf[hovered[0]];
  });

  render();

  var timer = null;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
  });

  if (window.MutationObserver) {
    new MutationObserver(function () { setTimeout(render, 50); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
})();
