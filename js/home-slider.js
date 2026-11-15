/* Home page (phones only): show one service card at a time, swipe or use arrows to move left/right. */
(function () {
  var grid = document.querySelector('.hs-grid');
  if (!grid) return;
  var cards = [].slice.call(grid.querySelectorAll('.hs-card'));
  if (cards.length < 2) return;
  var mq = window.matchMedia('(max-width: 640px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  grid.setAttribute('role', 'region');
  grid.setAttribute('aria-label', 'Our services — swipe or use the arrows to move between services');
  var ctr = document.createElement('div'); ctr.className = 'sv-ctrl hs-ctrl';
  ctr.innerHTML =
    '<button type="button" class="sv-arrow sv-prev" aria-label="Previous service"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg></button>' +
    '<div class="sv-count" aria-live="polite"></div>' +
    '<button type="button" class="sv-arrow sv-next" aria-label="Next service"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg></button>';
  grid.insertAdjacentElement('afterend', ctr);
  var prev = ctr.querySelector('.sv-prev'), next = ctr.querySelector('.sv-next'), count = ctr.querySelector('.sv-count');
  var cur = 0;
  var dots = cards.map(function (c, i) {
    var d = document.createElement('button'); d.type = 'button'; d.className = 'sv-dot';
    d.setAttribute('aria-label', 'Go to service ' + (i + 1)); d.onclick = function () { go(i); };
    count.appendChild(d); return d;
  });

  function paint() {
    dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    prev.disabled = cur === 0; next.disabled = cur === cards.length - 1;
    if (mq.matches) cards.forEach(function (c, i) { if (i === cur) { c.removeAttribute('tabindex'); c.removeAttribute('aria-hidden'); } else { c.setAttribute('tabindex', '-1'); c.setAttribute('aria-hidden', 'true'); } });
    else cards.forEach(function (c) { c.removeAttribute('tabindex'); c.removeAttribute('aria-hidden'); });
  }
  function go(i, instant) {
    if (!mq.matches) return;
    i = Math.max(0, Math.min(cards.length - 1, i));
    grid.scrollTo({ left: cards[i].offsetLeft, behavior: (reduce || instant) ? 'auto' : 'smooth' });
    cur = i; paint();
  }
  var t;
  grid.addEventListener('scroll', function () {
    if (!mq.matches) return;
    clearTimeout(t);
    t = setTimeout(function () {
      var best = 0, d = 1e9;
      cards.forEach(function (c, i) { var x = Math.abs(c.offsetLeft - grid.scrollLeft); if (x < d) { d = x; best = i; } });
      if (best !== cur) { cur = best; paint(); }
    }, 60);
  }, { passive: true });
  prev.onclick = function () { go(cur - 1); };
  next.onclick = function () { go(cur + 1); };
  window.addEventListener('resize', function () { if (mq.matches) go(cur, true); else paint(); });
  paint();
})();
