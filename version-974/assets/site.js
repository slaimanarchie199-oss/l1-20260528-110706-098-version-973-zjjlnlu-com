(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function getQuery(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMobileMenu() {
    var button = document.querySelector('[data-menu-button]');
    var menu = document.querySelector('[data-mobile-nav]');
    if (!button || !menu) {
      return;
    }

    button.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
    var background = hero.querySelector('[data-hero-background]');
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
      thumbs.forEach(function (thumb, thumbIndex) {
        thumb.classList.toggle('active', thumbIndex === current);
      });
      if (background && slides[current]) {
        background.style.backgroundImage = "url('" + slides[current].getAttribute('data-hero-bg') + "')";
      }
    }

    function schedule() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        schedule();
      });
    });

    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener('mouseenter', function () {
        show(index);
        schedule();
      });
    });

    if (slides.length > 1) {
      schedule();
    }
  }

  function initPageFilters() {
    var input = document.querySelector('.page-filter-input');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
    var count = document.querySelector('[data-filter-count]');
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filter-chip]'));
    if (!input || cards.length === 0) {
      return;
    }

    function applyFilter(term) {
      var query = normalizeText(term == null ? input.value : term);
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalizeText([
          card.getAttribute('data-title'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-year'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-category')
        ].join(' '));
        var matched = query === '' || haystack.indexOf(query) !== -1;
        card.classList.toggle('is-hidden', !matched);
        if (matched) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = String(visible);
      }
    }

    input.addEventListener('input', function () {
      chips.forEach(function (chip) {
        chip.classList.remove('active');
      });
      applyFilter();
    });

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var term = chip.getAttribute('data-filter-chip') || '';
        input.value = term;
        chips.forEach(function (other) {
          other.classList.toggle('active', other === chip);
        });
        applyFilter(term);
      });
    });
  }

  function movieCardTemplate(movie) {
    return [
      '<article class="movie-card">',
      '  <a class="movie-card-link" href="' + movie.url + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
      '    <figure class="poster-frame">',
      '      <img src="./' + movie.image + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" decoding="async">',
      '      <figcaption class="poster-overlay"><span>立即观看</span></figcaption>',
      '      <span class="score-badge">' + movie.score + '</span>',
      '    </figure>',
      '    <div class="movie-card-body">',
      '      <h3>' + escapeHtml(movie.title) + '</h3>',
      '      <p>' + escapeHtml(movie.oneLine) + '</p>',
      '      <div class="movie-meta-line">',
      '        <span>' + escapeHtml(movie.year) + '</span>',
      '        <span>' + escapeHtml(movie.region) + '</span>',
      '        <span>' + escapeHtml(movie.type) + '</span>',
      '      </div>',
      '      <div class="movie-tags">',
      '        <span>' + escapeHtml(movie.category) + '</span>',
      '        <span>' + escapeHtml(movie.genre) + '</span>',
      '      </div>',
      '    </div>',
      '  </a>',
      '</article>'
    ].join('\n');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initSearchPage() {
    var results = document.querySelector('[data-search-results]');
    var counter = document.querySelector('[data-search-count]');
    var input = document.querySelector('#search-page-input');
    var data = window.MOVIE_SEARCH_INDEX || [];
    if (!results || !input || data.length === 0) {
      return;
    }

    var initialQuery = getQuery('q');
    if (initialQuery) {
      input.value = initialQuery;
    }

    function render(query) {
      var normalized = normalizeText(query);
      var matched = data.filter(function (movie) {
        var haystack = normalizeText([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.tags,
          movie.category,
          movie.oneLine
        ].join(' '));
        return normalized === '' || haystack.indexOf(normalized) !== -1;
      }).slice(0, 120);

      if (!normalized) {
        matched = data.slice(0, 48);
      }

      results.innerHTML = matched.map(movieCardTemplate).join('\n');
      if (counter) {
        counter.textContent = normalized
          ? '找到 ' + matched.length + ' 条相关结果，最多展示 120 条'
          : '展示推荐内容 ' + matched.length + ' 条';
      }
    }

    input.addEventListener('input', function () {
      render(input.value);
    });

    render(input.value);
  }

  function initPlayer() {
    var video = document.querySelector('#movie-player');
    var button = document.querySelector('[data-player-start]');
    if (!video || !button) {
      return;
    }

    var hlsInstance = null;
    var initialized = false;

    function playVideo() {
      var source = video.getAttribute('data-src');
      if (!source) {
        return;
      }

      button.classList.add('is-hidden');

      if (!initialized) {
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal && hlsInstance) {
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                hlsInstance.startLoad();
              } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                hlsInstance.recoverMediaError();
              } else {
                hlsInstance.destroy();
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().catch(function () {});
        } else {
          video.src = source;
          video.play().catch(function () {});
        }
        initialized = true;
      } else {
        video.play().catch(function () {});
      }
    }

    button.addEventListener('click', playVideo);
    video.addEventListener('play', function () {
      button.classList.add('is-hidden');
    });
  }

  ready(function () {
    initMobileMenu();
    initHero();
    initPageFilters();
    initSearchPage();
    initPlayer();
  });
})();
