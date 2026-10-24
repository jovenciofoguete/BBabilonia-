/* Lupa DENTRO da lista "País da loja" (select id="pais") do loja-criar.html. */
(function () {
  function norm(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function iniciar() {
    var sel = document.getElementById('pais');
    if (!sel || sel.options.length < 3) return false;
    if (document.getElementById('pais-btn')) return true;

    var todos = [];
    function ler() {
      todos = Array.prototype.map.call(sel.options, function (o) {
        return { v: o.value, t: o.textContent };
      });
    }
    ler();

    var btn = document.createElement('div');
    btn.id = 'pais-btn';
    btn.setAttribute('role', 'button');
    btn.tabIndex = 0;
    btn.style.cssText = 'width:100%;padding:12px;border-radius:10px;border:1px solid #2c2c30;background:#1c1c1f;color:#f3f3f3;font:inherit;cursor:pointer;display:flex;justify-content:space-between;align-items:center';
    sel.parentNode.insertBefore(btn, sel);
    sel.style.display = 'none';

    function atualizarBtn() {
      var o = sel.options[sel.selectedIndex];
      btn.innerHTML = '<span></span><span>🔍</span>';
      btn.firstChild.textContent = (o && o.value) ? o.textContent : (todos[0] ? todos[0].t : '— Escolha o país —');
    }
    atualizarBtn();
    sel.addEventListener('change', atualizarBtn);

    var painel = document.createElement('div');
    painel.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:#111;color:#f3f3f3;flex-direction:column;font-family:system-ui,sans-serif';
    painel.innerHTML =
      '<div style="display:flex;gap:8px;padding:12px;border-bottom:1px solid #2c2c30">' +
      '<input id="pais-q" type="search" placeholder="🔍 Pesquisar o seu país…" autocomplete="off" style="flex:1;width:auto;padding:12px;border-radius:10px;border:1px solid #2c2c30;background:#1c1c1f;color:#f3f3f3;font-size:16px">' +
      '<button id="pais-x" type="button" style="padding:12px 16px;border-radius:10px;border:1px solid #2c2c30;background:#1c1c1f;color:#f3f3f3;font-size:16px">✕</button></div>' +
      '<div id="pais-l" style="flex:1;overflow:auto;-webkit-overflow-scrolling:touch"></div>';
    document.body.appendChild(painel);
    var q = painel.querySelector('#pais-q'), lista = painel.querySelector('#pais-l');

    function desenhar() {
      var t = norm(q.value), atual = sel.value;
      var achados = todos.filter(function (p) { return p.v && (t === '' || norm(p.t).indexOf(t) !== -1); });
      lista.innerHTML = '';
      if (!achados.length) {
        var n = document.createElement('div');
        n.style.cssText = 'padding:16px;color:#9a9aa2';
        n.textContent = 'Nenhum país encontrado';
        lista.appendChild(n);
        return;
      }
      achados.forEach(function (p) {
        var d = document.createElement('div');
        d.textContent = p.t;
        d.setAttribute('data-v', p.v);
        d.style.cssText = 'padding:16px 14px;border-bottom:1px solid #2c2c30;font-size:17px;cursor:pointer' + (p.v === atual ? ';color:#ff4d6a;font-weight:700' : '');
        lista.appendChild(d);
      });
    }

    function abrir() {
      ler();
      q.value = '';
      desenhar();
      painel.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(function () { q.focus(); }, 50);
    }
    function fechar() {
      painel.style.display = 'none';
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', abrir);
    painel.querySelector('#pais-x').addEventListener('click', fechar);
    q.addEventListener('input', desenhar);
    lista.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-v');
      if (v === null || v === undefined) return;
      sel.value = v;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      atualizarBtn();
      fechar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && painel.style.display === 'flex') fechar();
    });

    new MutationObserver(function () { ler(); atualizarBtn(); }).observe(sel, { childList: true });
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
