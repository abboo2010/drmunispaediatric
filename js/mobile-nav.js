/* Mobile bottom navigation bar (phones only; hidden by CSS above 640px) */
(function () {
  var I = function (p) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  var items = [
    { href: 'index.html',    label: 'Home',     icon: I('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>') },
    { href: 'about.html',    label: 'About',    icon: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>') },
    { href: 'services.html', label: 'Services', icon: I('<path d="M12 3v18M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="5"/>') },
    { href: 'contact.html',  label: 'Contact',  icon: I('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>') },
    { href: 'https://wa.me/60106696074', label: 'WhatsApp', wa: true, icon: '<svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.2.58 4.27 1.6 6.06L4 29l8.14-1.55a12.9 12.9 0 0 0 3.88.6c6.62 0 12.02-5.4 12.02-12.03C28.04 8.4 22.64 3 16.02 3Zm0 21.9c-1.85 0-3.6-.5-5.1-1.4l-.37-.22-3.86.74.77-3.77-.24-.38a9.87 9.87 0 0 1-1.53-5.35c0-5.47 4.46-9.93 9.94-9.93 5.47 0 9.93 4.46 9.93 9.93 0 5.48-4.46 9.94-9.94 9.94Zm5.44-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.24-.46-2.37-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg>' }
  ];
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page === '' || page.indexOf('.') < 0) page = 'index.html';
  var nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Main');
  nav.innerHTML = items.map(function (it) {
    var cur = it.href === page ? ' class="active" aria-current="page"' : '';
    var ext = it.wa ? ' target="_blank" rel="noopener"' : '';
    return '<a href="' + it.href + '"' + (it.wa ? ' class="wa"' : cur) + ext + '>' + it.icon + '<span>' + it.label + '</span></a>';
  }).join('');
  document.body.appendChild(nav);
  // keep the WhatsApp button in sync with the CMS-edited number
  document.addEventListener('cms:ready', function () {
    var wa = window.CMS_CLINIC && window.CMS_CLINIC.wa;
    if (wa) nav.querySelector('a[href^="https://wa.me/"]').href = 'https://wa.me/' + wa;
  });
})();
