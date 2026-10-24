/* Lupa de pesquisa para "País da loja" (select id="pais") do loja-criar.html.
   Só ACRESCENTA uma caixa de pesquisa. Não altera nem apaga nada do que já funciona.
   v2: se a página refizer a lista de países, a lupa atualiza-se sozinha. */
(function () {
  function norm(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function iniciar() {
    var sel = document.getElementById('pais');
    if (!sel || sel.options.length < 3) return false;
    if (document.getElementById('busca-pais-loja')) return true;

    var todos = [], mexendo = false;
    function ler() {
      todos = Array.prototype.map.call(sel.options, function (o) {
        return { v: o.value, t: o.textContent };
      });
    }
    ler();

    var inp = document.createElement('input');
    inp.id = 'busca-pais-loja';
    inp.type = 'search';
    inp.placeholder = '🔍 Pesquisar o seu país…';
    inp.autocomplete = 'off';
    inp.style.marginBottom = '8px';
    sel.parentNode.insertBefore(inp, sel);

    function desenhar(lista, escolhido) {
      mexendo = true;
      sel.innerHTML = '';
      [todos[0]].concat(lista).forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.v;
        o.textContent = p.t;
        sel.appendChild(o);
      });
      sel.value = escolhido || '';
      setTimeout(function () { mexendo = false; }, 0);
    }

    inp.addEventListener('input', function () {
      var q = norm(inp.value), atual = sel.value;
      var achados = todos.filter(function (p) {
        return p.v && (q === '' || norm(p.t).indexOf(q) !== -1);
      });
      if (achados.length === 1 && q !== '') {
        desenhar(achados, achados[0].v);
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        desenhar(achados, achados.some(function (p) { return p.v === atual; }) ? atual : '');
      }
    });

    // se a própria página refizer a lista, volta a ler a lista completa
    new MutationObserver(function () {
      if (mexendo) return;
      if (sel.options.length > 2) { ler(); inp.value = ''; }
    }).observe(sel, { childList: true });

    return true;
  }

  function arrancar() {
    if (iniciar()) return;
    var n = 0, t = setInterval(function () {
      if (iniciar() || ++n > 40) clearInterval(t);
    }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
