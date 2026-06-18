(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var panel = document.querySelector('.mobile-panel');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
      toggle.textContent = isOpen ? '☰' : '×';
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
    var prev = document.querySelector('.hero-prev');
    var next = document.querySelector('.hero-next');
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-target') || 0));
        start();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    start();
  }

  function loadHlsLibrary() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      var existing = document.querySelector('script[data-hls-loader="true"]');
      if (existing) {
        existing.addEventListener('load', function () {
          resolve(window.Hls);
        });
        existing.addEventListener('error', reject);
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;
      script.setAttribute('data-hls-loader', 'true');
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initPlayer() {
    var players = Array.prototype.slice.call(document.querySelectorAll('.video-player-card'));
    players.forEach(function (card) {
      var video = card.querySelector('.site-video');
      var button = card.querySelector('.play-action');
      if (!video) {
        return;
      }
      var stream = video.getAttribute('data-stream');
      var hlsInstance = null;

      function attachStream() {
        if (video.dataset.ready === 'true') {
          return Promise.resolve();
        }
        if (!stream) {
          return Promise.resolve();
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          video.dataset.ready = 'true';
          return Promise.resolve();
        }
        return loadHlsLibrary().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(stream);
            hlsInstance.attachMedia(video);
            video.dataset.ready = 'true';
          } else {
            video.src = stream;
            video.dataset.ready = 'true';
          }
        });
      }

      function playVideo() {
        attachStream().then(function () {
          var promise = video.play();
          if (promise && promise.catch) {
            promise.catch(function () {});
          }
        }).catch(function () {
          video.src = stream;
          var fallback = video.play();
          if (fallback && fallback.catch) {
            fallback.catch(function () {});
          }
        });
      }

      if (button) {
        button.addEventListener('click', playVideo);
      }
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        }
      });
      video.addEventListener('play', function () {
        card.classList.add('is-playing');
      });
      video.addEventListener('pause', function () {
        card.classList.remove('is-playing');
      });
      window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function initPageFilter() {
    var input = document.querySelector('.page-filter-input');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.page-movie-grid .movie-card, .all-rank-list .list-card'));
    if (!input || !cards.length) {
      return;
    }

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    input.addEventListener('input', function () {
      var query = normalize(input.value);
      cards.forEach(function (card) {
        var text = normalize(card.textContent);
        card.classList.toggle('hidden-card', query && text.indexOf(query) === -1);
      });
    });
  }

  function initSort() {
    var button = document.querySelector('.sort-toggle');
    var grid = document.querySelector('.page-movie-grid');
    if (!button || !grid) {
      return;
    }
    var descending = true;
    button.addEventListener('click', function () {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));
      cards.sort(function (a, b) {
        var ay = Number(a.getAttribute('data-year') || 0);
        var by = Number(b.getAttribute('data-year') || 0);
        return descending ? ay - by : by - ay;
      });
      cards.forEach(function (card) {
        grid.appendChild(card);
      });
      descending = !descending;
      button.textContent = descending ? '按年份排序' : '按年份倒序';
    });
  }

  function createSearchCard(movie) {
    return [
      '<article class="movie-card">',
      '  <a class="card-cover" href="' + movie.url + '">',
      '    <img src="' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="play-float">▶</span>',
      '    <span class="duration-badge">' + escapeHtml(movie.duration) + '</span>',
      '  </a>',
      '  <div class="card-body">',
      '    <a class="card-title" href="' + movie.url + '">' + escapeHtml(movie.title) + '</a>',
      '    <p class="card-desc">' + escapeHtml(movie.desc) + '</p>',
      '    <div class="card-meta">',
      '      <a href="' + movie.categoryUrl + '">' + escapeHtml(movie.category) + '</a>',
      '      <span>' + escapeHtml(movie.year) + '</span>',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '    </div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function initSearchPage() {
    var input = document.getElementById('searchInput');
    var results = document.getElementById('searchResults');
    var summary = document.getElementById('searchSummary');
    if (!input || !results || !summary || !window.siteSearchData) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    input.value = initialQuery;

    function normalize(value) {
      return String(value || '').toLowerCase().trim();
    }

    function render() {
      var query = normalize(input.value);
      if (!query) {
        results.innerHTML = '';
        summary.textContent = '输入关键词查看相关结果';
        return;
      }
      var terms = query.split(/\s+/).filter(Boolean);
      var matched = window.siteSearchData.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.desc,
          movie.category,
          movie.genre,
          movie.region,
          movie.year,
          movie.tags
        ].join(' '));
        return terms.every(function (term) {
          return haystack.indexOf(term) !== -1;
        });
      }).slice(0, 120);
      results.innerHTML = matched.map(createSearchCard).join('');
      summary.textContent = matched.length ? '已匹配到相关内容' : '未找到相关内容';
    }

    input.addEventListener('input', render);
    render();
  }

  function initSearchRedirects() {
    Array.prototype.slice.call(document.querySelectorAll('.search-redirect')).forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = form.querySelector('input[name="q"]');
        if (!input || !input.value.trim()) {
          event.preventDefault();
          window.location.href = './search.html';
        }
      });
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initPlayer();
    initPageFilter();
    initSort();
    initSearchPage();
    initSearchRedirects();
  });
})();
