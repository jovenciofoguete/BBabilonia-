/* tamanhos-lote.js — B-Babilônia
   Registar produto: tamanhos e quantidades como nas grandes plataformas (Shopify, AliExpress, Amazon).
   1) O fornecedor toca nos tamanhos que tem (ou "Marcar todos").
   2) Aparece uma linha por tamanho, em cada cor, com a quantidade, − e +.
   3) "Aplicar a todos": escreve a quantidade uma vez e todos os tamanhos ficam com ela.
   Guarda igual ao anterior em products.variants: [{cor, tamanho, stock}].
   Não mexe nas categorias nem nos detalhes: só troca a caixa "Tamanhos e stock por cor". */
(function () {
  if (window.__bbTamLote) return; window.__bbTamLote = 1;
  var d = document;
  function $(i) { return d.getElementById(i); }

  /* espera o categorias-registo.js terminar (cria #reg-campos e o TamanhosStock dele) */
  var espera = setInterval(function () {
    if ($('reg-campos') && $('ts') && $('sv') && window.BB_TAMANHOS && window.TamanhosStock) {
      clearInterval(espera); iniciar();
    }
  }, 200);
  setTimeout(function () { clearInterval(espera); }, 60000);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function iniciar() {
    var ts = $('ts');
    var E = { tipos: ['unico'], tipo: 'unico', cores: [], marc: {}, extra: {}, stock: {} };

    var css = d.createElement('style');
    css.textContent =
      '#ts .tl-tipo{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}' +
      '#ts .tl-tipo button{flex:1;padding:10px;border-radius:8px;font-size:14px}' +
      '#ts .on{background:var(--ac,#ff4d6a)!important;border-color:var(--ac,#ff4d6a)!important;color:#fff!important}' +
      '#ts .tl-pas{font-weight:700;margin:14px 0 8px;font-size:15px}' +
      '#ts .tl-chips{display:flex;flex-wrap:wrap;gap:8px}' +
      '#ts .tl-chip{min-width:54px;padding:9px 12px;border-radius:20px;font-size:14px}' +
      '#ts .tl-linha{display:flex;gap:8px;margin-top:10px}#ts .tl-linha input{flex:1;padding:9px}#ts .tl-linha button{padding:9px 12px;font-size:14px}' +
      '#ts .tl-lote{display:flex;flex-wrap:wrap;gap:8px;background:var(--card,#1c1c1f);border:1px dashed var(--ac,#ff4d6a);border-radius:10px;padding:10px;margin-bottom:12px}' +
      '#ts .tl-lote input{flex:1 1 110px;padding:10px}#ts .tl-lote select{flex:1 1 130px;padding:10px}' +
      '#ts .tl-lote button{flex:1 1 100%;background:var(--ac,#ff4d6a);border-color:var(--ac,#ff4d6a);color:#fff;font-weight:600}' +
      '#ts .tl-cor{border:1px solid var(--line,#2c2c30);background:var(--card,#1c1c1f);border-radius:10px;padding:10px;margin-bottom:12px}' +
      '#ts .tl-cab{display:flex;align-items:center;gap:10px;margin-bottom:8px}#ts .tl-cab img{width:42px;height:42px;object-fit:cover;border-radius:8px}' +
      '#ts .tl-cab b{flex:1;font-size:16px}#ts .tl-sub{color:var(--mut,#9a9aa2);font-size:13px}' +
      '#ts .tl-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line,#2c2c30)}' +
      '#ts .tl-row:first-of-type{border-top:0}' +
      '#ts .tl-t{flex:1;font-weight:600;font-size:15px}' +
      '#ts .tl-row button{width:42px;height:42px;padding:0;font-size:20px;border-radius:8px}' +
      '#ts .tl-row input{width:80px;text-align:center;padding:9px 4px;font-size:16px}' +
      '#ts .tl-total{font-weight:700;font-size:16px;text-align:right;margin:4px 0 6px}' +
      '#ts .tl-nota{color:var(--mut,#9a9aa2);font-size:13px;margin:6px 0}';
    d.head.appendChild(css);

    function base() { var b = window.BB_TAMANHOS[E.tipo]; return b ? b.l : ['']; }
    function lista() { return base().concat(E.extra[E.tipo] || []); }
    function unico() { return E.tipo === 'unico'; }
    function marcados() {
      if (unico()) return [''];
      var m = E.marc[E.tipo] || [];
      return lista().filter(function (t) { return m.indexOf(t) > -1; });
    }
    function coresUsadas() { return E.cores.length ? E.cores : ['Única']; }
    function fotoDe(cor) {
      try { var c = cores.filter(function (x) { return x.nome && x.nome.trim() === cor; })[0]; return c ? c.prev : ''; } catch (e) { return ''; }
    }
    function qt(cor, t) { return (E.stock[cor] && E.stock[cor][t]) || 0; }
    function poe(cor, t, v) { E.stock[cor] = E.stock[cor] || {}; E.stock[cor][t] = Math.max(0, parseInt(v, 10) || 0); }
    function pecas(n) { return n + (n === 1 ? ' peça' : ' peças'); }

    function desenhar() {
      var h = '', cs = coresUsadas(), mk = marcados();
      if (E.tipos.length > 1) {
        h += '<div class="tl-tipo">' + E.tipos.map(function (t) {
          return '<button type="button" data-tipo="' + t + '" class="' + (t === E.tipo ? 'on' : '') + '">' + esc(window.BB_TAMANHOS[t].nome) + '</button>';
        }).join('') + '</div>';
      }
      if (!unico()) {
        h += '<div class="tl-pas">1. Toque nos tamanhos que tem</div><div class="tl-chips">' +
          lista().map(function (t) {
            return '<button type="button" class="tl-chip' + (mk.indexOf(t) > -1 ? ' on' : '') + '" data-tam="' + esc(t) + '">' + esc(t) + '</button>';
          }).join('') + '</div>' +
          '<div class="tl-linha"><button type="button" data-acao="todos">Marcar todos</button><button type="button" data-acao="limpar">Limpar</button></div>' +
          '<div class="tl-linha"><input id="tl-novo" placeholder="Outro tamanho (ex.: 6XL)"><button type="button" data-acao="novo">+ Tamanho</button></div>';
      }
      if (!mk.length) {
        h += '<p class="tl-nota">Toque nos tamanhos acima para escrever a quantidade de cada um.</p>';
      } else {
        h += '<div class="tl-pas">' + (unico() ? 'Quantidade em stock' : '2. Quantidade de cada tamanho') + '</div>';
        if (mk.length * cs.length > 1) {
          h += '<div class="tl-lote"><input id="tl-qt" type="number" min="0" inputmode="numeric" placeholder="Quantidade">' +
            (cs.length > 1 ? '<select id="tl-onde"><option value="">Todas as cores</option>' +
              cs.map(function (c, i) { return '<option value="' + i + '">Só ' + esc(c) + '</option>'; }).join('') + '</select>' : '') +
            '<button type="button" data-acao="aplicar">Aplicar a todos</button></div>';
        }
        cs.forEach(function (cor, i) {
          var f = fotoDe(cor);
          h += '<div class="tl-cor">';
          if (cor !== 'Única') h += '<div class="tl-cab">' + (f ? '<img src="' + esc(f) + '" alt="">' : '') + '<b>' + esc(cor) + '</b><span class="tl-sub" data-sub="' + i + '"></span></div>';
          mk.forEach(function (t) {
            var v = qt(cor, t);
            h += '<div class="tl-row"><span class="tl-t">' + esc(t || 'Quantidade') + '</span>' +
              '<button type="button" data-m="-1" data-c="' + i + '" data-t="' + esc(t) + '">−</button>' +
              '<input type="number" min="0" inputmode="numeric" placeholder="0" data-c="' + i + '" data-t="' + esc(t) + '" value="' + (v || '') + '">' +
              '<button type="button" data-m="1" data-c="' + i + '" data-t="' + esc(t) + '">+</button></div>';
          });
          h += '</div>';
        });
        h += '<div class="tl-total" id="tl-total"></div><p class="tl-nota">Tamanho com 0 ou vazio não aparece ao cliente.</p>';
      }
      ts.innerHTML = h;
      totais();
    }

    function totais() {
      var cs = coresUsadas(), mk = marcados(), tot = 0;
      cs.forEach(function (cor, i) {
        var s = 0; mk.forEach(function (t) { s += qt(cor, t); }); tot += s;
        var el = ts.querySelector('[data-sub="' + i + '"]'); if (el) el.textContent = pecas(s);
      });
      var t = $('tl-total'); if (t) t.textContent = 'Total: ' + pecas(tot);
    }

    function inputDe(c, t) {
      var l = ts.querySelectorAll('input[data-c]');
      for (var i = 0; i < l.length; i++) if (l[i].getAttribute('data-c') === c && l[i].getAttribute('data-t') === t) return l[i];
      return null;
    }

    ts.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b || !ts.contains(b)) return;
      var cs = coresUsadas();
      if (b.hasAttribute('data-tipo')) { E.tipo = b.getAttribute('data-tipo'); return desenhar(); }
      if (b.hasAttribute('data-tam')) {
        var t = b.getAttribute('data-tam'), m = E.marc[E.tipo] = E.marc[E.tipo] || [], k = m.indexOf(t);
        if (k > -1) m.splice(k, 1); else m.push(t);
        return desenhar();
      }
      if (b.hasAttribute('data-m')) {
        var c = b.getAttribute('data-c'), tt = b.getAttribute('data-t'), cor = cs[Number(c)];
        poe(cor, tt, qt(cor, tt) + Number(b.getAttribute('data-m')));
        var inp = inputDe(c, tt); if (inp) inp.value = qt(cor, tt) || '';
        return totais();
      }
      var a = b.getAttribute('data-acao');
      if (a === 'todos') { E.marc[E.tipo] = lista().slice(); return desenhar(); }
      if (a === 'limpar') { E.marc[E.tipo] = []; return desenhar(); }
      if (a === 'novo') {
        var v = ($('tl-novo').value || '').trim().toUpperCase(); if (!v) return;
        var ex = E.extra[E.tipo] = E.extra[E.tipo] || [];
        if (lista().indexOf(v) < 0) ex.push(v);
        var mm = E.marc[E.tipo] = E.marc[E.tipo] || []; if (mm.indexOf(v) < 0) mm.push(v);
        return desenhar();
      }
      if (a === 'aplicar') {
        var q = $('tl-qt').value;
        if (q === '' || !(parseInt(q, 10) >= 0)) { $('tl-qt').focus(); return; }
        var onde = $('tl-onde') ? $('tl-onde').value : '';
        cs.forEach(function (cor, i) {
          if (onde !== '' && String(i) !== onde) return;
          marcados().forEach(function (t) { poe(cor, t, q); });
        });
        return desenhar();
      }
    });

    ts.addEventListener('input', function (e) {
      var inp = e.target;
      if (!inp.hasAttribute || !inp.hasAttribute('data-c')) return;
      poe(coresUsadas()[Number(inp.getAttribute('data-c'))], inp.getAttribute('data-t'), inp.value);
      totais();
    });

    window.TamanhosStock = {
      montar: function () { desenhar(); },
      definirCores: function (c) {
        c = (c || []).slice();
        if (c.join('\n') === E.cores.join('\n') && ts.innerHTML) return;   // nada mudou: não redesenha (mantém o teclado aberto)
        E.cores = c; desenhar();
      },
      definirTipos: function (t) {
        t = (t || []).filter(function (x) { return window.BB_TAMANHOS[x]; });
        E.tipos = t.length ? t : ['unico'];
        if (E.tipos.indexOf(E.tipo) < 0) E.tipo = E.tipos[0];
        desenhar();
      },
      obter: function () {
        var out = [];
        coresUsadas().forEach(function (cor) {
          marcados().forEach(function (t) { var q = qt(cor, t); if (q > 0) out.push({ cor: cor, tamanho: t, stock: q }); });
        });
        return out;
      }
    };

    /* cores e categoria que já estavam escolhidas */
    try { E.cores = cores.filter(function (c) { return c.ok && c.nome.trim(); }).map(function (c) { return c.nome.trim(); }); } catch (e) {}
    desenhar();
    var cat = $('cat');
    if (cat && cat.value && typeof registoPerfil === 'function' && typeof sb !== 'undefined') {
      sb.from('categories').select('id,name,parent_id').limit(5000).then(function (r) {
        var m = {}; (r.data || []).forEach(function (c) { m[c.id] = c; });
        var o = [], n = 0, c = m[cat.value]; while (c && n++ < 6) { o.unshift(c.name); c = m[c.parent_id]; }
        if (o.length) window.TamanhosStock.definirTipos(registoPerfil(o.join(' > ')).tam);
      });
    }

    /* antes de publicar: tamanhos marcados têm de ter quantidade */
    var sv = $('sv'), sv0 = sv.onclick;
    sv.onclick = function (e) {
      var msg = $('m');
      try { if (typeof refreshTs === 'function') refreshTs(); } catch (x) {}
      if (cat && cat.value) {
        var mk = marcados(), cs = coresUsadas();
        if (!mk.length) { msg.textContent = 'Toque nos tamanhos que tem e escreva a quantidade de cada um.'; ts.scrollIntoView({ block: 'center' }); return; }
        if (!unico()) {
          var falta = mk.filter(function (t) { return cs.every(function (c) { return !qt(c, t); }); });
          if (falta.length) { msg.textContent = 'Escreva a quantidade de: ' + falta.join(', ') + ' (ou desmarque esse tamanho).'; ts.scrollIntoView({ block: 'center' }); return; }
        }
        if (!window.TamanhosStock.obter().length) { msg.textContent = 'Escreva a quantidade em stock.'; ts.scrollIntoView({ block: 'center' }); return; }
      }
      return sv0 ? sv0.call(this, e) : undefined;
    };
  }
})();
