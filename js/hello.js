// The one-pager.
// Testimonials: the four cards sit fanned in a deck. Every 7 seconds, or on
// the arrow buttons, the front card slides out to the left, drops behind the
// others and settles at the back; a button press restarts the 7 seconds.
// Visitors who ask their system for reduced motion get a still deck that only
// the buttons change.
// Work mosaic: the pictures, and each video's still frame, load with the page.
// The videos are full quality (about 105 MB in all), so once the page has
// loaded they load two at a time from the top, ready by the time anyone
// scrolls to them; browsers set to save data load each one only as it comes
// near. Each plays while it's near the screen and pauses once it's well past.
// For reduced motion they stay on their still frame.
// Preview: clicking a tile opens it large, as the About page's Webflow
// lightbox does. The backdrop, the close cross or Esc closes it; a click on
// the picture itself doesn't.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var deck = document.querySelector(".hello-deck");
  if (deck) {
    var cards = deck.querySelectorAll(".hello-quote");
    var count = cards.length;
    var active = 0;
    var timer, hold, tuck;
    var place = function (phase) {
      cards.forEach(function (card, i) {
        var pos = (i - active + count) % count;
        card.dataset.pos = pos === count - 1 && phase !== "back" ? phase : pos;
      });
    };
    var go = function (step) {
      active = (active + step + count) % count;
      clearTimeout(hold);
      clearTimeout(tuck);
      place("out");
      hold = setTimeout(function () { place("hold"); }, 430);
      tuck = setTimeout(function () { place("back"); }, 450);
    };
    var start = function () {
      clearInterval(timer);
      if (!reduce) timer = setInterval(function () { go(1); }, 7000);
    };
    document.querySelectorAll("[data-deck-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        go(Number(button.dataset.deckStep));
        start();
      });
    });
    place("back");
    start();
  }

  var videos = document.querySelectorAll(".hello-tile > video");
  // Starts a video loading and calls `done` once it can play to the end, or
  // fails, or 15 seconds have passed, so one slow video never holds up the rest.
  var fetchVideo = function (video, done) {
    if (video.readyState >= 4) return done();
    var finish = function () {
      clearTimeout(wait);
      video.removeEventListener("canplaythrough", finish);
      video.removeEventListener("error", finish);
      done();
    };
    var wait = setTimeout(finish, 15000);
    video.addEventListener("canplaythrough", finish);
    video.addEventListener("error", finish);
    if (video.preload !== "auto") {
      video.preload = "auto";
      if (video.readyState === 0 && video.paused) video.load();
    }
  };
  var nearby = window.IntersectionObserver && new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) entry.target.pause();
      else if (!reduce) entry.target.play().catch(function () {});
    });
  }, { rootMargin: "100% 0px" });
  videos.forEach(function (video) {
    if (nearby) nearby.observe(video);
    else if (!reduce) video.play();
  });
  if (!(navigator.connection && navigator.connection.saveData)) {
    var queue = Array.prototype.slice.call(videos);
    var next = function () {
      var video = queue.shift();
      if (video) fetchVideo(video, next);
    };
    var begin = function () { next(); next(); };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin);
  }

  var box = document.querySelector(".hello-lightbox");
  if (box) {
    var closer = box.querySelector(".hello-lightbox-close");
    var media, opener, hiding;
    var open = function (tile) {
      var source = tile.querySelector("img, video");
      clearTimeout(hiding);
      if (media) media.remove();
      if (source.tagName === "VIDEO") {
        media = document.createElement("video");
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.poster = source.poster;
        media.src = source.currentSrc || source.src;
        media.currentTime = source.currentTime;
        if (!reduce) media.autoplay = true;
      } else {
        media = document.createElement("img");
        media.alt = source.alt;
        media.src = source.currentSrc || source.src;
      }
      media.className = "hello-lightbox-media";
      box.insertBefore(media, closer);
      opener = tile;
      box.hidden = false;
      void box.offsetWidth;
      box.classList.add("is-open");
      document.documentElement.classList.add("hello-noscroll");
      closer.focus();
    };
    var close = function () {
      if (box.hidden || !box.classList.contains("is-open")) return;
      box.classList.remove("is-open");
      document.documentElement.classList.remove("hello-noscroll");
      hiding = setTimeout(function () {
        box.hidden = true;
        if (media) media.remove();
        media = null;
      }, reduce ? 0 : 300);
      if (opener) opener.focus({ preventScroll: true });
    };
    document.querySelectorAll("a.hello-tile").forEach(function (tile) {
      tile.addEventListener("click", function (event) {
        event.preventDefault();
        open(tile);
      });
    });
    box.addEventListener("click", function (event) {
      if (event.target !== media) close();
    });
    document.addEventListener("keydown", function (event) {
      if (box.hidden) return;
      if (event.key === "Escape") close();
      else if (event.key === "Tab") {
        event.preventDefault();
        closer.focus();
      }
    });
  }
})();
