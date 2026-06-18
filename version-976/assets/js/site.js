(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupNavigation() {
    var button = document.querySelector(".menu-toggle");
    var menu = document.querySelector("#nav-menu");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function setupHero() {
    var hero = document.querySelector(".hero");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }
    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        stop();
        show(i);
        start();
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        stop();
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        stop();
        show(current + 1);
        start();
      });
    }
    show(0);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll(".filter-panel"));
    panels.forEach(function (panel) {
      var id = panel.getAttribute("data-target");
      var grid = document.getElementById(id);
      if (!grid) {
        return;
      }
      var input = panel.querySelector(".filter-input");
      var year = panel.querySelector(".filter-year");
      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
      var empty = document.querySelector("[data-empty-for='" + id + "']");
      function apply() {
        var term = input ? input.value.trim().toLowerCase() : "";
        var selectedYear = year ? year.value : "";
        var visible = 0;
        cards.forEach(function (card) {
          var text = card.getAttribute("data-search") || "";
          var cardYear = card.getAttribute("data-year") || "";
          var matchTerm = !term || text.indexOf(term) !== -1;
          var matchYear = !selectedYear || cardYear === selectedYear;
          var show = matchTerm && matchYear;
          card.style.display = show ? "" : "none";
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      if (year) {
        year.addEventListener("change", apply);
      }
      var params = new URLSearchParams(window.location.search);
      var query = params.get("q");
      if (query && input) {
        input.value = query;
      }
      apply();
    });
  }

  window.initMoviePlayer = function (url) {
    var shell = document.querySelector(".player-shell");
    var video = document.getElementById("movie-video");
    var cover = document.querySelector(".player-cover");
    if (!shell || !video || !url) {
      return;
    }
    var attached = false;
    var hlsInstance = null;
    function attach() {
      if (attached) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
      } else {
        video.src = url;
      }
      attached = true;
    }
    function play() {
      attach();
      shell.classList.add("is-playing");
      video.controls = true;
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }
    if (cover) {
      cover.addEventListener("click", function (event) {
        event.preventDefault();
        play();
      });
    }
    var inlineButton = document.querySelector(".play-inline");
    if (inlineButton) {
      inlineButton.addEventListener("click", function (event) {
        event.preventDefault();
        play();
      });
    }
    shell.addEventListener("click", function (event) {
      if (event.target === video && !attached) {
        play();
      }
    });
    window.addEventListener("pagehide", function () {
      if (hlsInstance && typeof hlsInstance.destroy === "function") {
        hlsInstance.destroy();
      }
    });
  };

  ready(function () {
    setupNavigation();
    setupHero();
    setupFilters();
  });
})();
