(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length || !dots.length) {
      return;
    }
    var index = 0;
    var timer;

    function show(nextIndex) {
      index = nextIndex;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show((index + 1) % slides.length);
      }, 5600);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        play();
      });
    });
    play();
  }

  function setupFiltering() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-target]"));
    inputs.forEach(function (input) {
      var target = document.getElementById(input.getAttribute("data-filter-target"));
      if (!target) {
        return;
      }
      input.addEventListener("input", function () {
        var value = input.value.trim().toLowerCase();
        Array.prototype.slice.call(target.querySelectorAll("[data-movie-card]")).forEach(function (card) {
          var text = card.getAttribute("data-search") || card.textContent.toLowerCase();
          card.classList.toggle("is-filtered-out", value && text.indexOf(value) === -1);
        });
      });
    });
  }

  function setupSorting() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-sort-button]"));
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var group = button.closest("[data-sort-group]");
        var gridId = group ? group.getAttribute("data-sort-group") : "";
        var grid = document.getElementById(gridId);
        if (!grid) {
          return;
        }
        var mode = button.getAttribute("data-sort-button");
        Array.prototype.slice.call(group.querySelectorAll("[data-sort-button]")).forEach(function (item) {
          item.classList.toggle("is-active", item === button);
        });
        var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
        cards.sort(function (a, b) {
          if (mode === "views") {
            return Number(b.getAttribute("data-views") || 0) - Number(a.getAttribute("data-views") || 0);
          }
          if (mode === "year") {
            return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0);
          }
          return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0) || Number(b.getAttribute("data-views") || 0) - Number(a.getAttribute("data-views") || 0);
        });
        cards.forEach(function (card) {
          grid.appendChild(card);
        });
      });
    });
  }

  function getQuery() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("q") || "").trim();
  }

  function createSearchCard(item) {
    var article = document.createElement("article");
    article.className = "movie-card";

    var poster = document.createElement("a");
    poster.className = "poster-link";
    poster.href = item.href;

    var bg = document.createElement("span");
    bg.className = "poster-bg";

    var img = document.createElement("img");
    img.src = item.cover;
    img.alt = item.title;
    img.loading = "lazy";
    img.onerror = function () {
      img.style.opacity = "0";
    };

    var badge = document.createElement("span");
    badge.className = "card-badge";
    badge.textContent = item.type;

    var score = document.createElement("span");
    score.className = "card-score";
    score.textContent = item.score;

    poster.appendChild(bg);
    poster.appendChild(img);
    poster.appendChild(badge);
    poster.appendChild(score);

    var content = document.createElement("div");
    content.className = "card-content";

    var title = document.createElement("h2");
    var link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.title;
    title.appendChild(link);

    var desc = document.createElement("p");
    desc.textContent = item.description;

    var meta = document.createElement("div");
    meta.className = "card-meta";
    [item.year, item.region, item.genre].forEach(function (value) {
      var span = document.createElement("span");
      span.textContent = value;
      meta.appendChild(span);
    });

    content.appendChild(title);
    content.appendChild(desc);
    content.appendChild(meta);
    article.appendChild(poster);
    article.appendChild(content);
    return article;
  }

  window.initSearchPage = function () {
    var input = document.querySelector("[data-search-page-input]");
    var form = document.querySelector("[data-search-page-form]");
    var results = document.querySelector("[data-search-results]");
    var title = document.querySelector("[data-search-title]");
    if (!input || !results || !Array.isArray(window.SEARCH_ITEMS)) {
      return;
    }

    function render(query) {
      input.value = query;
      results.innerHTML = "";
      var normalized = query.toLowerCase();
      var matches = window.SEARCH_ITEMS.filter(function (item) {
        return !normalized || item.searchText.indexOf(normalized) !== -1;
      }).slice(0, 120);
      title.textContent = query ? "搜索结果：" + query : "推荐搜索";
      matches.forEach(function (item) {
        results.appendChild(createSearchCard(item));
      });
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = input.value.trim();
        var url = value ? "search.html?q=" + encodeURIComponent(value) : "search.html";
        window.history.pushState({}, "", url);
        render(value);
      });
    }

    window.addEventListener("popstate", function () {
      render(getQuery());
    });
    render(getQuery());
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupFiltering();
    setupSorting();
  });
})();
