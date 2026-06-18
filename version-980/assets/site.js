window.MovieSite = (function() {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
            return;
        }
        document.addEventListener("DOMContentLoaded", fn);
    }

    function initMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var panel = document.querySelector("[data-mobile-menu]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function() {
            panel.classList.toggle("is-open");
        });
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initSearchForms() {
        var forms = document.querySelectorAll("[data-search-form]");
        forms.forEach(function(form) {
            form.addEventListener("submit", function(event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var query = input ? input.value.trim() : "";
                var target = form.getAttribute("action") || "./search.html";
                window.location.href = target + (query ? "?q=" + encodeURIComponent(query) : "");
            });
        });
    }

    function initFilters() {
        var lists = document.querySelectorAll("[data-card-list]");
        lists.forEach(function(list) {
            var section = list.closest("section") || document;
            var input = section.querySelector("[data-filter-input]");
            var region = section.querySelector("[data-filter-region]");
            var type = section.querySelector("[data-filter-type]");
            var empty = section.querySelector("[data-empty-state]");
            var cards = Array.prototype.slice.call(list.querySelectorAll("[data-search-card]"));
            if (!cards.length) {
                return;
            }

            var queryInput = section.querySelector("[data-query-input]");
            if (queryInput) {
                var params = new URLSearchParams(window.location.search);
                var q = params.get("q");
                if (q) {
                    queryInput.value = q;
                }
            }

            function apply() {
                var keyword = normalize(input && input.value);
                var regionValue = normalize(region && region.value);
                var typeValue = normalize(type && type.value);
                var visible = 0;

                cards.forEach(function(card) {
                    var haystack = normalize([
                        card.dataset.title,
                        card.dataset.tags,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.year,
                        card.textContent
                    ].join(" "));
                    var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var okRegion = !regionValue || normalize(card.dataset.region) === regionValue;
                    var okType = !typeValue || normalize(card.dataset.type) === typeValue;
                    var ok = okKeyword && okRegion && okType;
                    card.hidden = !ok;
                    if (ok) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            [input, region, type].forEach(function(control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });

            apply();
        });
    }

    function setupPlayer(src) {
        var video = document.querySelector("[data-player-video]");
        var layer = document.querySelector("[data-player-layer]");
        if (!video || !src) {
            return;
        }
        var started = false;
        var hlsInstance = null;

        function attach() {
            if (started) {
                var replay = video.play();
                if (replay && replay.catch) {
                    replay.catch(function() {});
                }
                return;
            }
            started = true;
            if (layer) {
                layer.classList.add("is-hidden");
            }
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = src;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({ enableWorker: true });
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(video);
            } else {
                video.src = src;
            }
            video.controls = true;
            var playPromise = video.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function() {});
            }
        }

        if (layer) {
            layer.addEventListener("click", attach);
        }
        video.addEventListener("click", function() {
            if (!started) {
                attach();
            }
        });
        window.addEventListener("pagehide", function() {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function() {
        initMenu();
        initSearchForms();
        initFilters();
    });

    return {
        setupPlayer: setupPlayer
    };
})();
