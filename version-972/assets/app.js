(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      var isOpen = !panel.hasAttribute("hidden");
      if (isOpen) {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      } else {
        panel.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
        toggle.textContent = "×";
      }
    });
  }

  function setupHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function bindSearchForms() {
    var forms = document.querySelectorAll("[data-search-form]");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (input && !input.value.trim()) {
          event.preventDefault();
          input.focus();
        }
      });
    });
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function cardHtml(movie) {
    return [
      '<article class="movie-card">',
      '<a class="poster-frame" href="' + movie.url + '" aria-label="观看' + escapeHtml(movie.title) + '">',
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" decoding="async">',
      '<span class="poster-shade"></span>',
      '<span class="play-badge">▶</span>',
      '<span class="year-badge">' + escapeHtml(movie.year) + '</span>',
      '</a>',
      '<div class="card-body">',
      '<h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p>' + escapeHtml(movie.oneLine) + '</p>',
      '<div class="card-meta">',
      '<a href="' + movie.categoryUrl + '">' + escapeHtml(movie.categoryName) + '</a>',
      '<span>' + escapeHtml(movie.region) + '</span>',
      '<span>' + escapeHtml(movie.type) + '</span>',
      '</div>',
      '</div>',
      '</article>'
    ].join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setupSearchPage() {
    var input = document.getElementById("searchInput");
    var results = document.getElementById("searchResults");
    var title = document.getElementById("searchTitle");
    var hint = document.getElementById("searchHint");
    var sort = document.getElementById("searchSort");
    var form = document.querySelector("[data-page-search]");
    var data = window.SEARCH_DATA || [];
    if (!input || !results || !data.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    input.value = initial;

    function score(movie, query) {
      var q = normalize(query);
      if (!q) {
        return 1;
      }
      var fields = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine, movie.summary].join(" ").toLowerCase();
      var value = 0;
      if (normalize(movie.title).indexOf(q) !== -1) {
        value += 12;
      }
      if (fields.indexOf(q) !== -1) {
        value += 4;
      }
      q.split(/\s+/).forEach(function (part) {
        if (part && fields.indexOf(part) !== -1) {
          value += 1;
        }
      });
      return value;
    }

    function render() {
      var query = input.value.trim();
      var selectedSort = sort ? sort.value : "relevance";
      var scored = data
        .map(function (movie) {
          return { movie: movie, score: score(movie, query) };
        })
        .filter(function (item) {
          return query ? item.score > 0 : item.movie.featured;
        });

      scored.sort(function (left, right) {
        if (selectedSort === "year") {
          return String(right.movie.year).localeCompare(String(left.movie.year), "zh-Hans-CN");
        }
        if (selectedSort === "title") {
          return String(left.movie.title).localeCompare(String(right.movie.title), "zh-Hans-CN");
        }
        return right.score - left.score;
      });

      var visible = scored.slice(0, 96).map(function (item) {
        return cardHtml(item.movie);
      });
      results.innerHTML = visible.length ? visible.join("") : '<div class="detail-card"><h2>未找到相关内容</h2><p>可尝试输入其他片名、地区、类型、年份或标签。</p></div>';
      if (title) {
        title.textContent = query ? "搜索结果" : "精选内容";
      }
      if (hint) {
        hint.textContent = query ? "当前关键词：" + query : "输入关键词后即可筛选片库内容。";
      }
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var url = new URL(window.location.href);
        if (input.value.trim()) {
          url.searchParams.set("q", input.value.trim());
        } else {
          url.searchParams.delete("q");
        }
        window.history.replaceState(null, "", url.toString());
        render();
      });
    }

    if (sort) {
      sort.addEventListener("change", render);
    }
    input.addEventListener("input", render);
    render();
  }

  window.initMoviePlayer = function (options) {
    var video = document.getElementById(options.elementId);
    var trigger = document.getElementById(options.triggerId);
    if (!video || !trigger || !options.source) {
      return;
    }
    var loaded = false;
    var hls = null;

    function hideCover() {
      trigger.classList.add("is-hidden");
      trigger.setAttribute("aria-hidden", "true");
    }

    function play() {
      var request = video.play();
      if (request && typeof request.catch === "function") {
        request.catch(function () {});
      }
    }

    function attach() {
      if (loaded) {
        hideCover();
        play();
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = options.source;
        video.load();
        hideCover();
        play();
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(options.source);
        });
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          hideCover();
          play();
        });
        hls.on(window.Hls.Events.ERROR, function (eventName, data) {
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
        hideCover();
        play();
        return;
      }
      video.src = options.source;
      video.load();
      hideCover();
      play();
    }

    trigger.addEventListener("click", attach);
    video.addEventListener("click", function () {
      if (video.paused) {
        attach();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    bindSearchForms();
    setupSearchPage();
  });
})();
