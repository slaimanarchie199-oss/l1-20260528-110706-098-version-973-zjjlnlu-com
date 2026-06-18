(function () {
  var panel = document.querySelector('[data-mobile-panel]');
  var toggle = document.querySelector('[data-menu-toggle]');

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showHero(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function startHero() {
      stopHero();
      timer = window.setInterval(function () {
        showHero(index + 1);
      }, 5000);
    }

    function stopHero() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showHero(index - 1);
        startHero();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showHero(index + 1);
        startHero();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showHero(Number(dot.getAttribute('data-hero-dot')) || 0);
        startHero();
      });
    });

    hero.addEventListener('mouseenter', stopHero);
    hero.addEventListener('mouseleave', startHero);
    showHero(0);
    startHero();
  }

  var searchInput = document.querySelector('[data-search-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-card]'));
  var emptyState = document.querySelector('[data-empty-state]');

  function applyFilter(value) {
    var query = String(value || '').trim().toLowerCase();
    var visible = 0;

    cards.forEach(function (card) {
      var text = String(card.getAttribute('data-text') || '').toLowerCase();
      var matched = !query || text.indexOf(query) !== -1;
      card.classList.toggle('is-hidden', !matched);

      if (matched) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle('is-visible', visible === 0);
    }
  }

  if (searchInput && cards.length) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';

    if (initial) {
      searchInput.value = initial;
      applyFilter(initial);
    }

    searchInput.addEventListener('input', function () {
      applyFilter(searchInput.value);
    });
  }

  var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

  players.forEach(function (player) {
    var video = player.querySelector('video');
    var cover = player.querySelector('.player-cover');
    var message = player.querySelector('[data-player-message]');
    var source = player.getAttribute('data-source');
    var hlsInstance = null;
    var attached = false;

    function showMessage(text) {
      if (!message) {
        return;
      }

      message.textContent = text;
      message.classList.add('is-visible');
    }

    function attachSource() {
      if (!video || !source || attached) {
        return;
      }

      attached = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);

        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showMessage('播放暂时不可用，请稍后重试');
          }
        });

        return;
      }

      video.src = source;
    }

    function playVideo() {
      attachSource();
      player.classList.add('is-started');

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          showMessage('点击视频画面即可继续播放');
        });
      }
    }

    if (cover && video) {
      cover.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('play', function () {
        player.classList.add('is-started');
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
})();
