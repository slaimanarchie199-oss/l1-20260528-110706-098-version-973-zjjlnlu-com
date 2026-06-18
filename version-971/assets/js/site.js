(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function initMobileMenu() {
    var button = document.querySelector(".mobile-menu-button");
    var menu = document.getElementById("mobile-menu");
    if (!button || !menu) {
      return;
    }

    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      menu.hidden = expanded;
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }

    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    var prev = root.querySelector("[data-hero-prev]");
    var next = root.querySelector("[data-hero-next]");
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        show(Number(dot.getAttribute("data-hero-dot")) || 0);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function initCategoryFilter() {
    var scope = document.querySelector("[data-filter-scope]");
    if (!scope) {
      return;
    }

    var keywordInput = scope.querySelector("[data-filter-keyword]");
    var regionSelect = scope.querySelector("[data-filter-region]");
    var typeSelect = scope.querySelector("[data-filter-type]");
    var yearSelect = scope.querySelector("[data-filter-year]");
    var resetButton = scope.querySelector("[data-filter-reset]");
    var countLabel = scope.querySelector("[data-filter-count]");
    var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));

    function applyFilter() {
      var keyword = normalize(keywordInput && keywordInput.value);
      var region = normalize(regionSelect && regionSelect.value);
      var type = normalize(typeSelect && typeSelect.value);
      var year = normalize(yearSelect && yearSelect.value);
      var visibleCount = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-categories")
        ].join(" "));

        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesRegion = !region || normalize(card.getAttribute("data-region")) === region;
        var matchesType = !type || normalize(card.getAttribute("data-type")) === type;
        var matchesYear = !year || normalize(card.getAttribute("data-year")) === year;
        var visible = matchesKeyword && matchesRegion && matchesType && matchesYear;

        card.classList.toggle("is-hidden-by-filter", !visible);
        if (visible) {
          visibleCount += 1;
        }
      });

      if (countLabel) {
        countLabel.textContent = "显示 " + visibleCount + " 部内容";
      }
    }

    [keywordInput, regionSelect, typeSelect, yearSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        if (keywordInput) {
          keywordInput.value = "";
        }
        if (regionSelect) {
          regionSelect.value = "";
        }
        if (typeSelect) {
          typeSelect.value = "";
        }
        if (yearSelect) {
          yearSelect.value = "";
        }
        applyFilter();
      });
    }

    applyFilter();
  }

  ready(function () {
    initMobileMenu();
    initHero();
    initCategoryFilter();
  });
})();
