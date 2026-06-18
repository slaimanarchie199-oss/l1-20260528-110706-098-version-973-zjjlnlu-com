(function () {
  'use strict';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initMobileMenu() {
    var button = $('[data-menu-toggle]');
    var panel = $('[data-mobile-panel]');
    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
      button.textContent = panel.classList.contains('is-open') ? '×' : '☰';
    });
  }

  function initHero() {
    var hero = $('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = $all('[data-hero-slide]', hero);
    var dots = $all('[data-hero-dot]', hero);
    var prev = $('[data-hero-prev]', hero);
    var next = $('[data-hero-next]', hero);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
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

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

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

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function initCategoryFilter() {
    var filter = $('[data-card-filter]');
    if (!filter) {
      return;
    }

    var cards = $all('[data-movie-card]');
    var input = $('[data-filter-input]');
    var typeSelect = $('[data-filter-type]');
    var sortButtons = $all('[data-sort]');
    var count = $('[data-filter-count]');
    var grid = $('[data-card-grid]');

    function apply() {
      var keyword = normalize(input ? input.value : '');
      var type = normalize(typeSelect ? typeSelect.value : '');
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.dataset.title,
          card.dataset.year,
          card.dataset.category,
          card.dataset.region,
          card.dataset.type
        ].join(' '));
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchType = !type || normalize(card.dataset.type) === type;
        var isVisible = matchKeyword && matchType;
        card.classList.toggle('hide-card', !isVisible);
        if (isVisible) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = '当前显示 ' + visible + ' 部作品';
      }
    }

    function sortCards(mode) {
      if (!grid) {
        return;
      }
      var sorted = cards.slice().sort(function (a, b) {
        if (mode === 'year') {
          return normalize(b.dataset.year).localeCompare(normalize(a.dataset.year), 'zh-Hans-CN');
        }
        return normalize(a.dataset.title).localeCompare(normalize(b.dataset.title), 'zh-Hans-CN');
      });
      sorted.forEach(function (card) {
        grid.appendChild(card);
      });
    }

    if (input) {
      input.addEventListener('input', apply);
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', apply);
    }
    sortButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        sortButtons.forEach(function (other) {
          other.classList.remove('is-active');
        });
        button.classList.add('is-active');
        sortCards(button.dataset.sort);
        apply();
      });
    });
    apply();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        existing.addEventListener('load', resolve);
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initPlayers() {
    var players = $all('[data-hls-player]');
    if (!players.length) {
      return;
    }

    var hlsCdn = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';

    players.forEach(function (wrap) {
      var video = $('video', wrap);
      var button = $('[data-play-button]', wrap);
      if (!video || !button) {
        return;
      }

      var source = video.dataset.src;
      var started = false;

      function startPlayer() {
        if (!source || started) {
          if (video.paused) {
            video.play().catch(function () {});
          }
          return;
        }
        started = true;
        button.classList.add('is-hidden');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().catch(function () {});
          return;
        }

        loadScript(hlsCdn).then(function () {
          if (window.Hls && window.Hls.isSupported()) {
            var hls = new window.Hls({
              enableWorker: true,
              lowLatencyMode: false
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().catch(function () {});
            });
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (!data || !data.fatal) {
                return;
              }
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                hls.destroy();
              }
            });
          } else {
            video.src = source;
            video.play().catch(function () {});
          }
        }).catch(function () {
          video.src = source;
          video.play().catch(function () {});
        });
      }

      button.addEventListener('click', startPlayer);
      video.addEventListener('click', startPlayer);
      video.addEventListener('play', function () {
        button.classList.add('is-hidden');
      });
    });
  }

  function createCard(movie) {
    var article = document.createElement('article');
    article.className = 'movie-card';
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    article.innerHTML = '' +
      '<a class="poster-link" href="' + movie.detail + '" aria-label="观看' + escapeHtml(movie.title) + '">' +
      '  <img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.classList.add(\'is-missing\')">' +
      '  <span class="poster-glow"></span>' +
      '  <span class="play-mark">▶</span>' +
      '  <span class="type-pill">' + escapeHtml(movie.type) + '</span>' +
      '  <span class="year-pill">' + escapeHtml(movie.year) + '</span>' +
      '</a>' +
      '<div class="card-body">' +
      '  <div class="meta-row"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.category) + '</span></div>' +
      '  <h3><a href="' + movie.detail + '">' + escapeHtml(movie.title) + '</a></h3>' +
      '  <p>' + escapeHtml(movie.oneLine) + '</p>' +
      '  <div class="tag-row">' + tags + '</div>' +
      '</div>';
    return article;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[character];
    });
  }

  function initSearchPage() {
    var root = $('[data-search-page]');
    if (!root || !window.MOVIE_SEARCH_DATA) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';
    var input = $('[data-search-input]', root);
    var typeSelect = $('[data-search-type]', root);
    var regionSelect = $('[data-search-region]', root);
    var results = $('[data-search-results]', root);
    var count = $('[data-search-count]', root);
    var form = $('[data-search-form]', root);

    if (input) {
      input.value = q;
    }

    function populateOptions(select, values) {
      if (!select) {
        return;
      }
      values.forEach(function (value) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    var types = Array.from(new Set(window.MOVIE_SEARCH_DATA.map(function (item) { return item.type; }))).filter(Boolean).sort();
    var regions = Array.from(new Set(window.MOVIE_SEARCH_DATA.map(function (item) { return item.region; }))).filter(Boolean).sort();
    populateOptions(typeSelect, types);
    populateOptions(regionSelect, regions);

    function runSearch() {
      var keyword = normalize(input ? input.value : '');
      var type = typeSelect ? typeSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var items = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        var haystack = normalize([
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          movie.oneLine,
          (movie.tags || []).join(' ')
        ].join(' '));
        var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchType = !type || movie.type === type;
        var matchRegion = !region || movie.region === region;
        return matchKeyword && matchType && matchRegion;
      }).slice(0, 240);

      if (count) {
        count.textContent = '找到 ' + items.length + ' 部作品' + (items.length === 240 ? '（最多显示前 240 部）' : '');
      }
      if (!results) {
        return;
      }
      results.innerHTML = '';
      if (!items.length) {
        results.innerHTML = '<div class="empty-state">没有找到匹配的作品，请更换关键词或筛选条件。</div>';
        return;
      }
      items.forEach(function (movie) {
        results.appendChild(createCard(movie));
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var params = new URLSearchParams();
        if (input && input.value.trim()) {
          params.set('q', input.value.trim());
        }
        var query = params.toString();
        var nextUrl = window.location.pathname + (query ? '?' + query : '');
        window.history.replaceState({}, '', nextUrl);
        runSearch();
      });
    }
    [input, typeSelect, regionSelect].forEach(function (control) {
      if (control) {
        control.addEventListener('input', runSearch);
        control.addEventListener('change', runSearch);
      }
    });
    runSearch();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initHero();
    initCategoryFilter();
    initPlayers();
    initSearchPage();
  });
})();
