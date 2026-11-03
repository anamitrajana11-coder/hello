// The one-pager.
// Testimonials: the four cards sit fanned in a deck. Every 7 seconds, or on
// the arrow buttons, the front card slides out to the left, drops behind the
// others and settles at the back; a button press restarts the 7 seconds.
// Visitors who ask their system for reduced motion get a still deck that only
// the buttons change.
// Work mosaic: the videos are light copies made for this page (about 7 MB in
// all), so they load as soon as the page opens and each shows its still frame
// until it plays. Each plays while it's near the screen and pauses once it's
// well past. For reduced motion they stay on their still frame.
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

  var videos = document.querySelectorAll("video.hello-tile");
  if (!reduce) {
    var nearby = window.IntersectionObserver && new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.play().catch(function () {});
        else entry.target.pause();
      });
    }, { rootMargin: "100% 0px" });
    videos.forEach(function (video) {
      if (nearby) nearby.observe(video);
      else video.play();
    });
  }
})();
