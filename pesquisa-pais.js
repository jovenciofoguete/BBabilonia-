/* BBabilônia – lupa de pesquisa para a lista de países (cliente e fornecedor) */
(function () {
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  var css = document.createElement('style');
  css.textContent =
    '.bbp-btn{width:100%;text-align:left;font:inherit;padding:11px;border:1px solid #ddd8cd;border-radius:8px;background:#fff;color:#1d1b18;cursor:pointer}' +
    '.bbp-btn:focus-visible{outline:3px solid #7fc4b2;outline-offset:1px}' +
    '#bbp-dlg{border:0;border-radius:12px;padding:14px;width:min(94vw,520px);height:80vh;max-height:80vh;font:16px/1.4 system-ui,sans-serif;color:#1d1b18}' +
    '#bbp-dlg::backdrop{background:rgba(0,0,0,.45)}' +
    '#bbp-dlg form{display:flex;flex-direction:column;height:100%;margin:0}' +
    '#bbp-q{width:100%;font:inherit;padding:12px;border:2px solid #0b5d4b;border-radius:8px;margin-bottom:8px;box-sizing:border-box}' +
    '#bbp-list{flex:1;overflow:auto;border:1px solid #ddd8cd;border-radius:8px}' +
    '.bbp-it{display:block;width:100%;text-align:left;font:inherit;border:0;border-bottom:1px solid #eee;background:#fff;color:#1d1b18;padding:13px 12px;cursor:pointer}' +
    '.bbp-it:active,.bbp-it:hover{background:#e3f3ee}' +
    '.bbp-it.on{font-weight:700;color:#0b5d4b}' +
    '.bbp-x{margin-top:8px;font:inherit;padding:11px;border:1px solid #0b5d4b;border-radius:8px;background:#fff;color:#0b5d4b;cursor:pointer}' +
    '.bbp-vz{padding:14px;color:#6b665e}';
  document.head.appendChild(css);

  var dlg = document.createElement('dialog');
  dlg.id = 'bbp-dlg';
  dlg.innerHTML = '<form method="dialog" onsubmit="return false"><input id="bbp-q" type="search" placeholder="🔍 Pesquisar país…" autocomplete="off"><div id="bbp-list"></div><button type="button" class="bbp-x">Fechar</button></form>';
  document.body.appendChild(dlg);
  var q = dlg.querySelector('#bbp-q'), list = dlg.querySelector('#bbp-list'), atual = null;
  dlg.querySelector('.bbp-x').onclick = function () { dlg.close(); };

  function desenhar() {
    var t = norm(q.value), h = '', n = 0;
    Array.prototype.forEach.call(atual.options, function (o, i) {
      if (!o.value) return;
      if (t && norm(o.text).indexOf(t) === -1) return;
      n++;
      h += '<button type="button" class="bbp-it' + (o.value === atual.value ? ' on' : '') + '" data-i="' + i + '">' + o.text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</button>';
    });
    list.innerHTML = n ? h : '<div class="bbp-vz">Nenhum país encontrado.</div>';
  }
  q.addEventListener('input', desenhar);
  list.addEventListener('click', function (e) {
    var b = e.target.closest('.bbp-it'); if (!b || !atual) return;
    atual.selectedIndex = +b.dataset.i;
    atual.dispatchEvent(new Event('change', { bubbles: true }));
    dlg.close();
  });

  function ligar(sel) {
    if (sel.dataset.bbp || sel.multiple) return;
    sel.dataset.bbp = '1';
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'bbp-btn';
    sel.style.display = 'none';
    sel.parentNode.insertBefore(btn, sel.nextSibling);
    var ult = null;
    function atualizar() {
      var o = sel.options[sel.selectedIndex];
      var t = (o && o.value) ? o.text : (sel.options.length > 1 ? '🔍 Pesquisar e escolher o país' : (o ? o.text : 'A carregar países…'));
      var chave = t + '|' + sel.options.length + '|' + sel.disabled;
      if (chave !== ult) { ult = chave; btn.textContent = t; btn.disabled = sel.options.length < 2; }
    }
    btn.onclick = function () {
      atual = sel; q.value = ''; desenhar(); dlg.showModal(); q.focus();
    };
    sel.addEventListener('change', atualizar);
    new MutationObserver(atualizar).observe(sel, { childList: true });
    setInterval(atualizar, 400);
    atualizar();
  }

  function procurar() {
    var sels = document.querySelectorAll('select#pais,select[name=pais],select[name=country],select#country,select[id*=pais],select.pesquisa-pais');
    Array.prototype.forEach.call(sels, ligar);
  }
  procurar();
  new MutationObserver(procurar).observe(document.body, { childList: true, subtree: true });
})();
