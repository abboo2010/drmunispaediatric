(function(){
  var SERVICES = [{"id": "general", "folder": "general-paediatric-surgery", "title": "General Paediatric Surgery", "items": [{"slug": "appendicitis", "title": "Appendicitis"}, {"slug": "inguinal-hernia", "title": "Inguinal hernia"}, {"slug": "undescended-testis-torsion", "title": "Undescended testis & torsion of the testis"}, {"slug": "lacerations", "title": "Repair of lacerations"}, {"slug": "burns", "title": "Burn injuries"}, {"slug": "hydrocoele", "title": "Hydrocoele"}, {"slug": "tongue-tie", "title": "Tongue tie"}, {"slug": "lumps-bumps", "title": "Lumps and bumps"}]}, {"id": "neonatal", "folder": "neonatal-surgery", "title": "Neonatal Surgery", "items": [{"slug": "tracheo-esophageal-fistula", "title": "Tracheo-esophageal fistula"}, {"slug": "diaphragmatic-hernia", "title": "Diaphragmatic hernia"}, {"slug": "intestinal-atresia", "title": "Duodenal and other intestinal atresia"}, {"slug": "anorectal-malformation", "title": "Anorectal malformation"}, {"slug": "hirschsprungs-disease", "title": "Hirschsprung's disease"}, {"slug": "malrotation", "title": "Malrotation"}, {"slug": "pyloric-stenosis", "title": "Pyloric stenosis"}, {"slug": "abdominal-wall-defects", "title": "Congenital abdominal wall defects (gastroschisis / omphalocele)"}]}, {"id": "urology", "folder": "paediatric-urology", "title": "Paediatric Urology", "items": [{"slug": "kidney-disorders", "title": "Disorders of the kidneys"}, {"slug": "ureter-disorders", "title": "Disorders of the ureter"}, {"slug": "bladder-disorders", "title": "Disorders of the bladder"}, {"slug": "urethra-disorders", "title": "Disorders of the urethra"}, {"slug": "genitalia-disorders", "title": "Disorders of the genitalia"}, {"slug": "kidney-tumours", "title": "Tumours of the kidney"}]}, {"id": "laparoscopy", "folder": "paediatric-laparoscopy", "title": "Paediatric Laparoscopy", "items": [{"slug": "laparoscopic-orchidopexy", "title": "Laparoscopic orchidopexy"}, {"slug": "laparoscopic-appendicectomy", "title": "Laparoscopic appendicectomy"}, {"slug": "laparoscopic-cholecystectomy", "title": "Laparoscopic cholecystectomy"}, {"slug": "thoracoscopic-diaphragmatic-hernia-repair", "title": "Thoracoscopic repair of diaphragmatic hernia"}, {"slug": "laparoscopic-hernia-repair", "title": "Laparoscopic hernia repair"}, {"slug": "laparoscopic-ovarian-surgery", "title": "Laparoscopic ovarian surgery"}, {"slug": "laparoscopic-hirschsprungs-pull-through", "title": "Laparoscopic Hirschsprung's pull-through surgery"}]}, {"id": "gynae", "folder": "paediatric-gynaecological-surgery", "title": "Paediatric Gynaecological Surgery", "items": [{"slug": "ovarian-pathology", "title": "Ovarian pathology"}, {"slug": "congenital-anomalies", "title": "Congenital anomalies"}, {"slug": "labial-adhesions", "title": "Labial adhesions"}]}];
  var MAX = 24;
  var root = document.getElementById('svcGallery');
  if (!root) return;
  var tabs = root.querySelector('.gl-tabs'), panels = root.querySelector('.gl-panels');
  var loaded = {};

  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  SERVICES.forEach(function(s, i){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'gl-tab'; b.id = 'tab-' + s.id; b.setAttribute('role','tab');
    b.setAttribute('aria-controls','panel-' + s.id); b.setAttribute('aria-selected','false');
    b.textContent = s.title; b.addEventListener('click', function(){ show(s.id, true); });
    tabs.insertBefore(b, tabs.querySelector('[data-clinic]'));
    var p = document.createElement('div');
    p.className = 'gl-panel'; p.id = 'panel-' + s.id; p.setAttribute('role','tabpanel'); p.setAttribute('aria-labelledby','tab-' + s.id); p.hidden = true;
    p.innerHTML = '<p class="gl-intro">Photographs for each condition and procedure under <strong>' + esc(s.title) + '</strong>. Select a photo to enlarge it.</p>' +
      s.items.map(function(it){
        return '<section class="gl-item" id="' + s.id + '-' + it.slug + '" data-service="' + s.id + '" data-slug="' + it.slug + '">' +
          '<header><h3>' + esc(it.title) + '</h3><span class="gl-count" aria-live="polite"></span></header>' +
          '<div class="gl-grid"></div></section>';
      }).join('') +
      '<p class="gl-note">Images are for information only. Every child is different and individual results vary.</p>';
    panels.insertBefore(p, panels.querySelector('[data-clinic-panel]'));
  });

  var clinicTab = tabs.querySelector('[data-clinic]');
  clinicTab.addEventListener('click', function(){ show('clinic', true); });

  function show(id, push){
    var all = SERVICES.map(function(s){return s.id;}).concat(['clinic']);
    all.forEach(function(x){
      var t = x === 'clinic' ? clinicTab : document.getElementById('tab-' + x);
      var pn = x === 'clinic' ? panels.querySelector('[data-clinic-panel]') : document.getElementById('panel-' + x);
      var on = x === id; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.classList.toggle('on', on); pn.hidden = !on;
    });
    if (push && history.replaceState) history.replaceState(null, '', '#' + id);
    if (id !== 'clinic' && !loaded[id]) { loaded[id] = true; loadService(id); }
  }

  function probe(path, n, cb){
    var out = [];
    (function next(i){
      if (i > MAX) return cb(out);
      var im = new Image();
      im.onload = function(){ out.push({src: path + i + '.jpg', w: im.naturalWidth}); next(i + 1); };
      im.onerror = function(){ cb(out); };
      im.src = path + i + '.jpg';
    })(1);
  }

  function loadService(id){
    var s = SERVICES.filter(function(x){return x.id === id;})[0];
    s.items.forEach(function(it){
      var sec = document.getElementById(id + '-' + it.slug), grid = sec.querySelector('.gl-grid'), cnt = sec.querySelector('.gl-count');
      var path = 'img/gallery/' + s.folder + '/' + it.slug + '/';
      probe(path, 1, function(list){
        fetch(path + 'captions.json').then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; }).then(function(caps){
          if (!list.length) {
            grid.innerHTML = '<div class="gl-empty"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-8 8"/></svg><span>Photos coming soon</span></div>';
            cnt.textContent = '';
            return;
          }
          cnt.textContent = list.length + (list.length === 1 ? ' photo' : ' photos');
          list.forEach(function(ph, idx){
            var cap = (caps && caps[String(idx + 1)]) || '';
            ph.cap = cap; ph.title = it.title;
            var b = document.createElement('button'); b.type = 'button'; b.className = 'gl-thumb';
            b.setAttribute('aria-label', 'Enlarge photo ' + (idx + 1) + ' of ' + it.title);
            var im = document.createElement('img'); im.src = ph.src; im.loading = 'lazy'; im.alt = it.title + ' photo ' + (idx + 1) + (cap ? ': ' + cap : '');
            b.appendChild(im); b.addEventListener('click', function(){ openBox(list, idx); }); grid.appendChild(b);
          });
        });
      });
    });
  }

  /* lightbox */
  var box = document.getElementById('glBox'), bImg = box.querySelector('img'), bCap = box.querySelector('.gl-cap'), cur = [], pos = 0;
  function paint(){
    var ph = cur[pos]; bImg.src = ph.src; bImg.alt = ph.title + ' photo ' + (pos + 1);
    bCap.textContent = ph.title + ' \u00b7 ' + (pos + 1) + ' / ' + cur.length + (ph.cap ? ' \u00b7 ' + ph.cap : '');
    box.querySelector('.gl-prev').hidden = box.querySelector('.gl-next').hidden = cur.length < 2;
  }
  function openBox(list, i){ cur = list; pos = i; paint(); if (box.showModal) box.showModal(); else box.setAttribute('open',''); }
  function step(d){ pos = (pos + d + cur.length) % cur.length; paint(); }
  box.querySelector('.gl-prev').addEventListener('click', function(){ step(-1); });
  box.querySelector('.gl-next').addEventListener('click', function(){ step(1); });
  box.querySelector('.gl-x').addEventListener('click', function(){ box.close(); });
  box.addEventListener('click', function(e){ if (e.target === box) box.close(); });
  box.addEventListener('keydown', function(e){ if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });

  var h = (location.hash || '').replace('#','').split('-')[0];
  var start = SERVICES.some(function(s){return s.id === h;}) || h === 'clinic' ? h : SERVICES[0].id;
  show(start, false);
  var deep = (location.hash || '').replace('#','');
  if (deep.indexOf('-') > 0) setTimeout(function(){ var el = document.getElementById(deep); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 700);
})();
