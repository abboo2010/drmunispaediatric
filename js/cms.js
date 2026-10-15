// Loads the clinic's edits from Supabase and applies them on top of the page's built-in content.
// If Supabase is unreachable (or nothing has been edited), the page simply keeps its original text.
(function () {
  var C = window.CMS_CONFIG;
  if (!C || !C.url) return;
  var CACHE = 'cms_cache_v1';
  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';

  // ---- helpers -------------------------------------------------------------
  var ALLOWED = { A: ['href', 'target', 'rel'], STRONG: [], B: [], EM: [], I: [], BR: [], SPAN: [], SMALL: [], U: [] };
  function cleanNode(node, out) {
    Array.prototype.forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { out.appendChild(document.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/.test(n.tagName)) return; // never keep these, not even their text
      var allow = ALLOWED[n.tagName];
      if (!allow) { cleanNode(n, out); return; } // drop the tag, keep its text
      var c = document.createElement(n.tagName.toLowerCase());
      allow.forEach(function (a) {
        var v = n.getAttribute(a);
        if (v == null) return;
        if (a === 'class') return;
        if (a === 'href' && !/^(https?:|tel:|mailto:|#|[\w./-]+\.html)/i.test(v.trim())) return;
        c.setAttribute(a, v);
      });
      if (c.tagName === 'A' && c.getAttribute('target') === '_blank') c.setAttribute('rel', 'noopener');
      if (c.tagName === 'SPAN' && n.getAttribute('class') === 'hl') c.setAttribute('class', 'hl'); // the highlighted words in the home headline
      cleanNode(n, c);
      out.appendChild(c);
    });
    return out;
  }
  function sanitize(html) {
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    return cleanNode(doc.body.firstChild, document.createElement('div')).innerHTML;
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function waNumber(s) { var d = digits(s); if (!d) return ''; if (d.charAt(0) === '0') return '60' + d.slice(1); return d; }
  function telHref(s) { var d = waNumber(s); return d ? 'tel:+' + d : ''; }

  // ---- appliers ------------------------------------------------------------
  function applyText(map) {
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var v = map[el.getAttribute('data-cms')];
      if (v == null || v === '') return;
      if (el.hasAttribute('data-cms-html')) el.innerHTML = sanitize(String(v)); else el.textContent = String(v);
    });
    var t = map[PAGE + '.__title'], d = map[PAGE + '.__desc'];
    if (t) document.title = t;
    if (d) { var m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', d); }
  }

  function applyTicker(v) {
    if (!v || typeof v !== 'object') return;
    document.querySelectorAll('.ticker').forEach(function (tk) {
      if (v.enabled === false) { tk.parentNode.removeChild(tk); return; }
      if (v.text) tk.querySelectorAll('.ticker-item').forEach(function (it) { it.innerHTML = sanitize(String(v.text)); });
    });
  }

  function applyClinic(v) {
    if (!v || typeof v !== 'object') return;
    var phones = [v.phone1, v.phone2].filter(Boolean).join(' / ');
    var wa = waNumber(v.whatsapp), tel1 = telHref(v.phone1);
    window.CMS_CLINIC = { wa: wa, phones: [v.phone1, v.phone2].filter(Boolean), tel: tel1 };
    function setLink(box, text, href) {
      var a = box.querySelector('a');
      if (a) { a.textContent = text; if (href) a.setAttribute('href', href); } else box.textContent = text;
    }
    document.querySelectorAll('[data-clinic]').forEach(function (el) {
      var k = el.getAttribute('data-clinic');
      if (k === 'address' && v.address) el.textContent = v.address;
      else if (k === 'phones' && phones) setLink(el, phones, tel1);
      else if (k === 'whatsapp' && v.whatsapp) setLink(el, (el.getAttribute('data-clinic-prefix') || '') + v.whatsapp, wa ? 'https://wa.me/' + wa : '');
      else if (k === 'hours-list' && v.hours && v.hours.length) {
        el.innerHTML = '';
        v.hours.forEach(function (h) {
          var li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span');
          a.textContent = h.day || ''; b.textContent = h.time || ''; li.appendChild(a); li.appendChild(b); el.appendChild(li);
        });
      } else if (k === 'hours-line' && v.hours && v.hours.length) {
        el.textContent = v.hours.map(function (h) { return (h.day || '') + ': ' + (h.time || ''); }).join(' · ');
      }
    });
    if (tel1) document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.setAttribute('href', tel1); });
    if (wa) {
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) { a.setAttribute('href', 'https://wa.me/' + wa); });
      document.querySelectorAll('.wa-float').forEach(function (a) { if (v.whatsapp) a.setAttribute('title', 'WhatsApp: ' + v.whatsapp); });
    }
  }

  function applyServices(v) {
    if (!v || !v.sections) return;
    window.CMS_SERVICES = v;
    if (typeof window.renderServices === 'function') window.renderServices(v);
  }

  function apply(rows) {
    var map = {};
    (rows || []).forEach(function (r) { map[r.key] = r.value; });
    try { applyText(map); } catch (e) { console.warn('CMS text', e); }
    try { applyTicker(map.ticker); } catch (e) { console.warn('CMS ticker', e); }
    try { applyClinic(map.clinic); } catch (e) { console.warn('CMS clinic', e); }
    try { if (PAGE === 'services') applyServices(map.services); } catch (e) { console.warn('CMS services', e); }
  }

  // ---- run: cached copy first (instant), then refresh from Supabase --------
  function run() {
    try { var cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); if (cached) apply(cached); } catch (e) {}
    fetch(C.url + '/rest/v1/site_content?select=key,value', { headers: { apikey: C.anonKey, Authorization: 'Bearer ' + C.anonKey } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        try { localStorage.setItem(CACHE, JSON.stringify(rows)); } catch (e) {}
        apply(rows);
      })
      .catch(function (e) { console.warn('CMS: using built-in content', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
