function setupMoviePlayer(sourceUrl) {
  var video = document.getElementById("moviePlayer");
  var button = document.getElementById("playButton");
  if (!video || !button || !sourceUrl) {
    return;
  }

  var isReady = false;
  var hlsInstance = null;

  function bindStream() {
    if (isReady) {
      return;
    }
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
    } else if (window.Hls && Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(sourceUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = sourceUrl;
    }
    isReady = true;
  }

  function startPlayback() {
    bindStream();
    button.classList.add("is-hidden");
    video.controls = true;
    var playTask = video.play();
    if (playTask && typeof playTask.catch === "function") {
      playTask.catch(function () {
        button.classList.remove("is-hidden");
      });
    }
  }

  bindStream();

  button.addEventListener("click", function (event) {
    event.preventDefault();
    startPlayback();
  });

  video.addEventListener("click", function () {
    if (video.paused) {
      startPlayback();
    }
  });

  video.addEventListener("play", function () {
    button.classList.add("is-hidden");
  });

  window.addEventListener("beforeunload", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
