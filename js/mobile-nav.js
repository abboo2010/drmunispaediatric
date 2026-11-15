/* Mobile bottom navigation bar (phones only; hidden by CSS above 640px) */
(function () {
  var I = function (p) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var items = [
    { href: 'index.html',    label: 'Home',     icon: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>') },
    { href: 'about.html',    label: 'About',    icon: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>') },
    { href: 'services.html', label: 'Services', icon: I('<path d="M12 3v18M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="5"/>') },
    { href: 'contact.html',  label: 'Contact',  icon: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>') },
    { href: 'tel:+6088346616', label: 'Call',   icon: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>'), call: true }
  ];
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page === '' || page.indexOf('.') < 0) page = 'index.html';
  var nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main');
  nav.innerHTML = items.map(function (it) {
    var cur = it.href === page ? ' class="active" aria-current="page"' : '';
    return '<a href="' + it.href + '"' + cur + '>' + it.icon + '<span>' + it.label + '</span></a>';
  }).join('');
  document.body.appendChild(nav);
  // keep the Call button in sync with CMS-edited phone numbers
  document.addEventListener('cms:ready', function () {
    var p = window.CMS_CLINIC && window.CMS_CLINIC.phones && window.CMS_CLINIC.phones[0];
    if (!p) return;
    var d = p.replace(/\D/g, ''); if (d.charAt(0) === '0') d = '60' + d.slice(1);
    nav.querySelector('a[href^="tel:"]').href = 'tel:+' + d;
  });
})();
