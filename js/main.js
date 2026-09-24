

var CLINIC_WA = '60106696074';

function showWhatsAppFallback(form) {
  var old = form.parentElement.querySelector('.wa-fallback');
  if (old) old.remove();
  var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el && el.value ? el.value.trim() : ''; };
  var lines = ['Hello, I would like to request an appointment with Dr. Muniswaran.'];
  if (get('name')) lines.push('Parent/Guardian: ' + get('name'));
  if (get('phone')) lines.push('Phone: ' + get('phone'));
  if (get('child_age')) lines.push("Child's age: " + get('child_age'));
  if (get('message')) lines.push('Reason for visit: ' + get('message'));
  var url = 'https://wa.me/' + CLINIC_WA + '?text=' + encodeURIComponent(lines.join('\n'));
  var box = document.createElement('div');
  box.className = 'wa-fallback';
  box.setAttribute('role', 'alert');
  box.style.cssText = 'margin-top:16px;padding:16px;border-radius:14px;background:#eef6fb;border:1px solid #cfe2f1;text-align:center;font-size:14.5px;line-height:1.5;color:#0c2038';
  box.innerHTML = '<p style="margin:0 0 12px">We could not send your request online just now. Please send it to the clinic on WhatsApp instead \u2014 your details are already filled in.</p>' +
    '<a class="btn btn--primary" style="justify-content:center;width:100%" target="_blank" rel="noopener" href="' + url + '">Send via WhatsApp</a>' +
    '<p style="margin:12px 0 0;font-size:13px">Or call <a href="tel:+6088346616" style="color:inherit;text-decoration:underline">088-346616</a> / <a href="tel:+60885188888" style="color:inherit;text-decoration:underline">088-518 888</a></p>';
  form.insertAdjacentElement('afterend', box);
}

document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  document.querySelectorAll('form.ajax-form').forEach(function (form) {
    var card = form.closest('.form-card, .appointment-card') || form.parentElement;
    var head = card ? card.querySelector('.form-card-head') : null;
    var success = card ? card.querySelector('.form-success') : null;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var btn = form.querySelector('button[type=submit]');
      if (btn) btn.disabled = true;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.success) throw new Error('rejected');
          form.style.display = 'none';
          if (head) head.style.display = 'none';
          if (success) success.classList.add('show');
        })
        .catch(function () {
          showWhatsAppFallback(form);
        })
        .then(function () { if (btn) btn.disabled = false; });
    });

    var resetBtn = success ? success.querySelector('.form-success-reset') : null;
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        var fb = card && card.querySelector('.wa-fallback'); if (fb) fb.remove();
        form.style.display = '';
        if (head) head.style.display = '';
        if (success) success.classList.remove('show');
      });
    }
  });
});
