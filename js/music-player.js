(function () {
  function initMusicPlayer() {
    if (document.getElementById('global-music-player')) return;

    var audio = document.getElementById('global-music-player-audio');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'global-music-player-audio';
      audio.preload = 'metadata';
      audio.loop = true;
      audio.src = '/music/zhuimeng-chizixin-gala.flac';
      document.body.appendChild(audio);
    }
 
    var widget = document.createElement('div');
    widget.id = 'global-music-player';
    widget.className = 'music-player';

    var cover = document.createElement('button');
    cover.type = 'button';
    cover.className = 'music-player-cover';
    cover.setAttribute('aria-label', '播放或暂停歌曲');

    var image = document.createElement('img');
    image.src = '/music/zhuimeng-chizixin-gala.jpg';
    image.alt = '追梦赤子心 - GALA';
    cover.appendChild(image);

    var toggle = document.createElement('span');
    toggle.className = 'music-player-toggle';
    toggle.setAttribute('aria-hidden', 'true');
    cover.appendChild(toggle);

    widget.appendChild(cover);
    document.body.appendChild(widget);

    function setState() {
      var playing = !audio.paused;
      widget.classList.toggle('is-playing', playing);
      toggle.innerHTML = playing
        ? '<i class="fas fa-pause"></i>'
        : '<i class="fas fa-play"></i>';
    }

    function togglePlayback() {
      if (audio.paused) {
        audio.play().catch(function () {
          setState();
        });
      } else {
        audio.pause();
      }
    }

    cover.addEventListener('click', togglePlayback);
    audio.addEventListener('play', setState);
    audio.addEventListener('pause', setState);
    audio.addEventListener('ended', setState);

    setState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPlayer);
  } else {
    initMusicPlayer();
  }

  document.addEventListener('pjax:complete', initMusicPlayer);
})();
