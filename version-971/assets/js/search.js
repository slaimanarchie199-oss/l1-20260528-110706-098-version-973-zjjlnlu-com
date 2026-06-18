(function () {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function uniqueValues(records, key) {
    var values = [];
    records.forEach(function (record) {
      var value = record[key];
      if (value && values.indexOf(value) === -1) {
        values.push(value);
      }
    });
    return values.sort();
  }

  function fillSelect(select, values) {
    if (!select) {
      return;
    }
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function renderCard(record) {
    var tags = (record.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return "" +
      "<article class=\"movie-card\">" +
      "  <a class=\"card-cover\" href=\"" + escapeHtml(record.url) + "\">" +
      "    <img src=\"" + escapeHtml(record.cover) + "\" alt=\"" + escapeHtml(record.title) + "\" loading=\"lazy\">" +
      "    <span class=\"card-badge\">" + escapeHtml(record.year) + "</span>" +
      "    <span class=\"card-play\">▶</span>" +
      "  </a>" +
      "  <div class=\"card-body\">" +
      "    <div class=\"meta-row\"><span>" + escapeHtml(record.region) + "</span><span>" + escapeHtml(record.type) + "</span></div>" +
      "    <h3><a href=\"" + escapeHtml(record.url) + "\">" + escapeHtml(record.title) + "</a></h3>" +
      "    <p>" + escapeHtml(record.oneLine || record.summary) + "</p>" +
      "    <div class=\"tag-row\">" + tags + "</div>" +
      "  </div>" +
      "</article>";
  }

  function initSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root) {
      return;
    }

    var records = window.MOVIES_INDEX || [];
    var form = root.querySelector("[data-search-form]");
    var input = root.querySelector("[data-search-input]");
    var regionSelect = root.querySelector("[data-search-region]");
    var typeSelect = root.querySelector("[data-search-type]");
    var results = root.querySelector("[data-search-results]");
    var count = root.querySelector("[data-search-count]");

    fillSelect(regionSelect, uniqueValues(records, "region"));
    fillSelect(typeSelect, uniqueValues(records, "type"));

    input.value = getQueryParam("q");

    function apply() {
      var keyword = normalize(input.value);
      var region = normalize(regionSelect.value);
      var type = normalize(typeSelect.value);

      var filtered = records.filter(function (record) {
        var haystack = normalize([
          record.title,
          record.region,
          record.type,
          record.year,
          record.genre,
          (record.tags || []).join(" "),
          record.oneLine,
          record.summary
        ].join(" "));

        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesRegion = !region || normalize(record.region) === region;
        var matchesType = !type || normalize(record.type) === type;
        return matchesKeyword && matchesRegion && matchesType;
      });

      results.innerHTML = filtered.slice(0, 240).map(renderCard).join("");
      count.textContent = "找到 " + filtered.length + " 部内容" + (filtered.length > 240 ? "，当前显示前 240 部" : "");

      var url = new URL(window.location.href);
      if (keyword) {
        url.searchParams.set("q", input.value);
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState(null, "", url.toString());
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      apply();
    });

    [input, regionSelect, typeSelect].forEach(function (control) {
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    });

    apply();
  }

  if (document.readyState !== "loading") {
    initSearchPage();
  } else {
    document.addEventListener("DOMContentLoaded", initSearchPage);
  }
})();
