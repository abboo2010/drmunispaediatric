/* App install feature: registers the service worker and offers "Install app"
   in any browser that supports it, with step-by-step help where it doesn't. */
(function () {
  'use strict';
  var DISMISS_KEY = 'pwaInstallDismissed', DISMISS_DAYS = 14;
  var deferred = null, banner = null;

  function store(get, k, v) { try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } }
  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  var isFirefox = /firefox|fxios/i.test(ua);
  var isSafariMac = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua) && !isIOS;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
  if (standalone) return;                                   // already running as an installed app

  function recentlyDismissed() {
    var t = parseInt(store(true, DISMISS_KEY), 10);
    return t && (Date.now() - t) < DISMISS_DAYS * 864e5;
  }

  function steps() {
    if (isIOS) return 'Tap the <b>Share</b> button <span class="pwa-ico">&#x2B06;&#xFE0E;</span> in your browser, then choose <b>Add to Home Screen</b>.';
    if (isSafariMac) return 'In the menu bar choose <b>File &rsaquo; Add to Dock</b>.';
    if (isAndroid && isFirefox) return 'Open the Firefox menu <b>&#8942;</b> and tap <b>Install</b>.';
    if (isFirefox) return 'Firefox on desktop can&rsquo;t install web apps. Open this site in Chrome or Edge and choose <b>Install</b>, or bookmark this page.';
    return 'Open your browser menu <b>&#8942;</b> and choose <b>Install app</b> (or <b>Add to Home screen</b>).';
  }

  function build(mode) {                                     // mode: 'prompt' (one-tap) or 'howto'
    if (banner) banner.remove();
    banner = document.createElement('div');
    banner.className = 'pwa-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Install app');
    banner.innerHTML =
      '<img src="/img/icons/icon-192.png" alt="" width="44" height="44">' +
      '<div class="pwa-text"><strong>Install our app</strong>' +
      '<span>' + (mode === 'prompt' ? 'Quick access to services, clinic details and appointment requests from your home screen.' : steps()) + '</span></div>' +
      (mode === 'prompt' ? '<button type="button" class="pwa-install btn btn--primary">Install</button>' : '') +
      '<button type="button" class="pwa-close" aria-label="Close">&times;</button>';
    document.body.appendChild(banner);
    requestAnimationFrame(function () { banner.classList.add('show'); });
    banner.querySelector('.pwa-close').onclick = function () { store(false, DISMISS_KEY, Date.now()); hide(); };
    var b = banner.querySelector('.pwa-install');
    if (b) b.onclick = doInstall;
  }
  function hide() { if (banner) { banner.classList.remove('show'); var x = banner; setTimeout(function () { x.remove(); }, 300); banner = null; } }

  function doInstall() {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; hide(); });
  }

  window.addEventListener('beforeinstallprompt', function (e) {   // Chrome, Edge, Samsung Internet, Opera, Android browsers
    e.preventDefault();
    deferred = e;
    document.documentElement.classList.add('pwa-can-install');
    if (!recentlyDismissed()) setTimeout(function () { if (deferred) build('prompt'); }, 4000);
  });
  window.addEventListener('appinstalled', function () { deferred = null; hide(); document.documentElement.classList.remove('pwa-can-install'); });

  // Browsers with no install event (iOS Safari/Chrome, Safari macOS, Firefox): show instructions once, politely.
  if ((isIOS || isSafariMac || isFirefox) && !recentlyDismissed()) {
    setTimeout(function () { if (!deferred && !banner) build('howto'); }, 6000);
  }

  // Always-available "Install app" link in the footer
  document.addEventListener('DOMContentLoaded', function () {
    var fb = document.querySelector('.footer-bottom');
    if (!fb) return;
    var a = document.createElement('a');
    a.href = '#install'; a.className = 'pwa-footer-link'; a.textContent = 'Install app';
    a.addEventListener('click', function (e) { e.preventDefault(); if (deferred) doInstall(); else build('howto'); });
    fb.appendChild(a);
  });
})();
