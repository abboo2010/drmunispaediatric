/* Services page: show one service at a time, move left/right (swipe, arrows, tabs or keyboard). */
(function () {
  var box = document.querySelector('.sv-section .container');
  if (!box) return;
  var slides = [].slice.call(box.querySelectorAll(':scope > .os-block'));
  if (slides.length < 2) return;
  var chips = [].slice.call(document.querySelectorAll('.sv-jump a'));
  var mq = window.matchMedia('(max-width: 640px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var slider = document.createElement('div'); slider.className = 'sv-slider';
  var track = document.createElement('div'); track.className = 'sv-track';
  track.setAttribute('role', 'region'); track.setAttribute('aria-label', 'Our services — swipe or use the arrows to move between services');
  box.insertBefore(slider, slides[0]);
  slider.appendChild(track);
  slides.forEach(function (s) { track.appendChild(s); });

  var ctr = document.createElement('div'); ctr.className = 'sv-ctrl';
  ctr.innerHTML =
    '<button type="button" class="sv-arrow sv-prev" aria-label="Previous service"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg></button>' +
    '<div class="sv-count" aria-live="polite"></div>' +
    '<button type="button" class="sv-arrow sv-next" aria-label="Next service"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg></button>';
  slider.appendChild(ctr);
  var prev = ctr.querySelector('.sv-prev'), next = ctr.querySelector('.sv-next'), count = ctr.querySelector('.sv-count');
  var dots = slides.map(function (s, i) {
    var d = document.createElement('button'); d.type = 'button'; d.className = 'sv-dot';
    d.setAttribute('aria-label', 'Go to service ' + (i + 1)); d.onclick = function () { go(i); };
    count.appendChild(d); return d;
  });

  var cur = 0;
  function fit() { track.style.height = mq.matches ? slides[cur].offsetHeight + 'px' : ''; }
  function paint() {
    if (mq.matches) track.setAttribute('tabindex', '0'); else track.removeAttribute('tabindex');
    if (!mq.matches) {   // desktop / tablet: leave the page exactly as it was
      slides.forEach(function (s) { s.removeAttribute('inert'); });
      chips.forEach(function (c) { c.classList.remove('active'); });
      track.style.height = ''; return;
    }
    dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    chips.forEach(function (c, i) { c.classList.toggle('active', i === cur); });
    prev.disabled = cur === 0; next.disabled = cur === slides.length - 1;
    slides.forEach(function (s, i) { if (i === cur) s.removeAttribute('inert'); else s.setAttribute('inert', ''); });
    fit();
  }
  function go(i, instant) {
    if (!mq.matches) return;
    i = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: i * track.clientWidth, behavior: (reduce || instant) ? 'auto' : 'smooth' });
    cur = i; paint();
  }
  var t;
  track.addEventListener('scroll', function () {
    clearTimeout(t);
    if (!mq.matches) return;
    t = setTimeout(function () {
      var i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== cur) { cur = i; paint(); }
    }, 60);
  }, { passive: true });
  prev.onclick = function () { go(cur - 1); };
  next.onclick = function () { go(cur + 1); };
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
  });
  chips.forEach(function (c) {
    c.addEventListener('click', function (e) {
      var id = (c.getAttribute('href') || '').replace('#', '');
      if (!mq.matches) return;   // desktop keeps the normal anchor jump
      var i = slides.findIndex(function (s) { return s.id === id; });
      if (i < 0) return;
      e.preventDefault(); go(i);
      slider.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
  window.addEventListener('resize', function () { if (mq.matches) go(cur, true); else paint(); });
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(fit); slides.forEach(function (s) { ro.observe(s); }); }

  var h = location.hash.replace('#', '');
  var start = Math.max(0, slides.findIndex(function (s) { return s.id === h; }));
  paint(); if (mq.matches) go(start, true);
})();
