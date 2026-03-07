(function () {
  var btn = document.getElementById('hamburgerBtn');
  var drawer = document.getElementById('navDrawer');
  var overlay = document.getElementById('navOverlay');

  if (!btn || !drawer || !overlay) return;

  function open() {
    drawer.classList.add('open');
    overlay.classList.add('open');
  }

  function close() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
  }

  btn.addEventListener('click', function () {
    drawer.classList.contains('open') ? close() : open();
  });

  overlay.addEventListener('click', close);
})();
