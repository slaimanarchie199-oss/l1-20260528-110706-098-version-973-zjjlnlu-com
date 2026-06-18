import { H as Hls } from "./hls.js";

function updateStatus(shell, message) {
  var status = shell.querySelector("[data-player-status]");
  if (status) {
    status.textContent = message;
  }
}

function attachSource(video, sourceUrl) {
  if (Hls && Hls.isSupported()) {
    var hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });

    hls.loadSource(sourceUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, function (_event, data) {
      if (!data || !data.fatal) {
        return;
      }

      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        hls.startLoad();
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }

      hls.destroy();
    });
    return hls;
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = sourceUrl;
    return null;
  }

  throw new Error("当前浏览器不支持 HLS 播放。请使用最新版 Chrome、Edge、Safari 或 Firefox。 ");
}

function initPlayer(shell) {
  var video = shell.querySelector("video");
  var button = shell.querySelector(".player-start");
  var sourceUrl = shell.getAttribute("data-video-src");
  var poster = shell.getAttribute("data-poster");
  var hasLoaded = false;
  var hlsInstance = null;

  if (!video || !button || !sourceUrl) {
    return;
  }

  if (poster) {
    video.poster = poster;
  }

  button.addEventListener("click", function () {
    try {
      if (!hasLoaded) {
        updateStatus(shell, "正在加载高清播放线路...");
        hlsInstance = attachSource(video, sourceUrl);
        hasLoaded = true;
      }

      var playPromise = video.play();
      shell.classList.add("is-playing");
      updateStatus(shell, "已开始播放，可使用播放器控件调整进度、音量和全屏。 ");

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          shell.classList.remove("is-playing");
          updateStatus(shell, "播放源已加载，请再次点击播放或使用视频控件开始播放。 ");
        });
      }
    } catch (error) {
      shell.classList.remove("is-playing");
      updateStatus(shell, error.message || "播放器初始化失败，请稍后重试。 ");
    }
  });

  video.addEventListener("pause", function () {
    if (!video.ended) {
      shell.classList.remove("is-playing");
    }
  });

  video.addEventListener("play", function () {
    shell.classList.add("is-playing");
  });

  video.addEventListener("ended", function () {
    shell.classList.remove("is-playing");
  });

  window.addEventListener("beforeunload", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

document.querySelectorAll("[data-video-player]").forEach(initPlayer);
