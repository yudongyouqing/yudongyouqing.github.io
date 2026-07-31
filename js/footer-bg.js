(function () {
  var homeFooter = '/images/home-sunset.jpg';
  var aboutFooter = '/images/home-hero.jpg';

  function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/, '/');
  }

  function applyFooterBackground() {
    var footer = document.getElementById('footer');
    if (!footer) return;

    var pathname = normalizePath(window.location.pathname);
    var image = pathname === '/about/' ? aboutFooter : homeFooter;
    footer.style.backgroundImage = 'url(' + image + ')';
  }

  applyFooterBackground();
  document.addEventListener('pjax:complete', applyFooterBackground);
})();
