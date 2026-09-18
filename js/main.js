
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
      form.style.display = 'none';
      if (head) head.style.display = 'none';
      if (success) success.classList.add('show');
    });

    var resetBtn = success ? success.querySelector('.form-success-reset') : null;
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        form.style.display = '';
        if (head) head.style.display = '';
        if (success) success.classList.remove('show');
      });
    }
  });
});
