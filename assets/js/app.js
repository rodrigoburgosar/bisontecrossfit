/* Bisonte CrossFit - JS compartido por todas las paginas.
   1) Drawer del menu hamburguesa.
   2) Puntos de paginacion de los carruseles: solo actua si la pagina
      tiene .dots[data-for]; en el resto recorre una lista vacia y no
      hace nada, por eso el mismo archivo sirve para las 14 paginas.
   Se carga con defer, asi que corre con el DOM ya parseado. */
(function(){
  var menuIcon = document.getElementById('menuIcon');
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('drawerOverlay');
  var closeBtn = document.getElementById('drawerClose');

  function openDrawer(){
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuIcon.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  }
  function closeDrawer(){
    if(!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    menuIcon.setAttribute('aria-expanded', 'false');
    menuIcon.focus();
  }

  menuIcon.addEventListener('click', openDrawer);
  closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeDrawer();
  });
  drawer.addEventListener('keydown', function(e){
    if(e.key !== 'Tab') return;
    var focusables = drawer.querySelectorAll('button, a[href], summary');
    if(!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  });
  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', closeDrawer);
  });
})();

document.querySelectorAll('.dots[data-for]').forEach(function(dotsEl){
  var row = document.getElementById(dotsEl.dataset.for);
  if(!row) return;
  var cards = Array.from(row.children);
  if(!cards.length) return;

  cards.forEach(function(_, i){
    var dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.type = 'button';
    dot.setAttribute('aria-label', 'Ir a tarjeta ' + (i + 1));
    dot.addEventListener('click', function(){
      cards[i].scrollIntoView({behavior:'smooth', inline:'start', block:'nearest'});
    });
    dotsEl.appendChild(dot);
  });

  var dotEls = Array.from(dotsEl.children);
  var ticking = false;
  row.addEventListener('scroll', function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var rowRect = row.getBoundingClientRect();
      var center = rowRect.left + rowRect.width / 2;
      var closest = 0;
      var closestDist = Infinity;
      cards.forEach(function(card, i){
        var rect = card.getBoundingClientRect();
        var dist = Math.abs((rect.left + rect.width / 2) - center);
        if(dist < closestDist){ closestDist = dist; closest = i; }
      });
      dotEls.forEach(function(d, i){ d.classList.toggle('active', i === closest); });
      ticking = false;
    });
  }, {passive:true});
});
