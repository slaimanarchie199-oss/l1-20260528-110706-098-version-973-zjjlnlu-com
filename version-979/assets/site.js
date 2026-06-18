(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
      return;
    }
    document.addEventListener('DOMContentLoaded', callback);
  }

  ready(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');
    if (menuButton && mobilePanel) {
      menuButton.addEventListener('click', function () {
        mobilePanel.classList.toggle('open');
      });
    }

    var hero = document.querySelector('[data-hero]');
    if (hero) {
      var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
      var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
      var index = 0;
      var showSlide = function (next) {
        index = (next + slides.length) % slides.length;
        slides.forEach(function (slide, i) {
          slide.classList.toggle('active', i === index);
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('active', i === index);
        });
      };
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          showSlide(i);
        });
      });
      if (slides.length > 1) {
        setInterval(function () {
          showSlide(index + 1);
        }, 5200);
      }
    }

    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]'));
    panels.forEach(function (panel) {
      var input = panel.querySelector('[data-filter-input]');
      var yearSelect = panel.querySelector('[data-year-select]');
      var typeSelect = panel.querySelector('[data-type-select]');
      var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
      var empty = document.querySelector('[data-empty-state]');
      var params = new URLSearchParams(window.location.search);
      var q = params.get('q') || '';
      if (input && q) {
        input.value = q;
      }
      if (yearSelect) {
        var years = Array.from(new Set(cards.map(function (card) {
          return card.getAttribute('data-year');
        }).filter(Boolean))).sort(function (a, b) {
          return Number(b) - Number(a);
        });
        years.forEach(function (year) {
          var option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          yearSelect.appendChild(option);
        });
      }
      if (typeSelect) {
        var types = Array.from(new Set(cards.map(function (card) {
          return card.getAttribute('data-type');
        }).filter(Boolean))).sort();
        types.forEach(function (type) {
          var option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          typeSelect.appendChild(option);
        });
      }
      var apply = function () {
        var keyword = input ? input.value.trim().toLowerCase() : '';
        var year = yearSelect ? yearSelect.value : '';
        var type = typeSelect ? typeSelect.value : '';
        var shown = 0;
        cards.forEach(function (card) {
          var search = (card.getAttribute('data-search') || '').toLowerCase();
          var okKeyword = !keyword || search.indexOf(keyword) !== -1;
          var okYear = !year || card.getAttribute('data-year') === year;
          var okType = !type || card.getAttribute('data-type') === type;
          var visible = okKeyword && okYear && okType;
          card.style.display = visible ? '' : 'none';
          if (visible) {
            shown += 1;
          }
        });
        if (empty) {
          empty.classList.toggle('show', shown === 0);
        }
      };
      if (input) {
        input.addEventListener('input', apply);
      }
      if (yearSelect) {
        yearSelect.addEventListener('change', apply);
      }
      if (typeSelect) {
        typeSelect.addEventListener('change', apply);
      }
      apply();
    });

    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
    players.forEach(function (player) {
      var video = player.querySelector('video');
      var button = player.querySelector('[data-player-button]');
      var stream = player.getAttribute('data-stream');
      var loaded = false;
      var start = function () {
        if (!video || !stream) {
          return;
        }
        player.classList.add('is-playing');
        if (!loaded) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = stream;
            loaded = true;
          } else if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(stream);
            hls.attachMedia(video);
            video._hls = hls;
            loaded = true;
          } else {
            video.src = stream;
            loaded = true;
          }
        }
        var playAction = video.play();
        if (playAction && typeof playAction.catch === 'function') {
          playAction.catch(function () {});
        }
      };
      if (button) {
        button.addEventListener('click', start);
      }
      if (video) {
        video.addEventListener('click', function () {
          if (!loaded || video.paused) {
            start();
          }
        });
      }
    });
  });
})();
