/* tamanhos-stock.js — BBabilônia
   Tamanhos com stock por cor. Sem stock (0) = o tamanho não aparece ao cliente.
   Formato guardado em products.variants: [{cor, tamanho, stock}, ...] */
(function () {
  var ROUPA = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  var CALCADO = [];
  for (var n = 20; n <= 48; n++) CALCADO.push(String(n));

  var estado = { el: null, tipo: 'roupa', cores: [], stock: {} };

  function lista() { return estado.tipo === 'calcado' ? CALCADO : ROUPA; }

  function css() {
    if (document.getElementById('ts-css')) return;
    var s = document.createElement('style');
    s.id = 'ts-css';
    s.textContent =
      '.ts-box{font-family:system-ui,sans-serif}' +
      '.ts-tipo{display:flex;gap:8px;margin-bottom:12px}' +
      '.ts-tipo button{flex:1;padding:10px;border:1px solid #bbb;border-radius:8px;background:#fff;font-size:15px}' +
      '.ts-tipo button.on{background:#111;color:#fff;border-color:#111}' +
      '.ts-cor{border:1px solid #ddd;border-radius:10px;padding:10px;margin-bottom:12px}' +
      '.ts-cor h4{margin:0 0 8px;font-size:16px}' +
      '.ts-grade{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
      '.ts-item label{display:block;font-size:13px;font-weight:600;margin-bottom:2px}' +
      '.ts-item input{width:100%;box-sizing:border-box;padding:8px;font-size:16px;border:1px solid #bbb;border-radius:6px}' +
      '.ts-nota{font-size:13px;color:#666;margin:0 0 10px}';
    document.head.appendChild(s);
  }

  function desenhar() {
    var el = estado.el;
    if (!el) return;
    css();
    var h = '<div class="ts-box">' +
      '<div class="ts-tipo">' +
      '<button type="button" data-tipo="roupa" class="' + (estado.tipo === 'roupa' ? 'on' : '') + '">Roupa (XS–5XL)</button>' +
      '<button type="button" data-tipo="calcado" class="' + (estado.tipo === 'calcado' ? 'on' : '') + '">Calçado</button>' +
      '</div><p class="ts-nota">Escreve o stock de cada tamanho. Tamanho com 0 ou vazio não aparece ao cliente.</p>';
    if (!estado.cores.length) {
      h += '<p class="ts-nota">Adiciona primeiro as cores (com foto) para registar os tamanhos.</p>';
    }
    estado.cores.forEach(function (cor, i) {
      h += '<div class="ts-cor"><h4>' + esc(cor) + '</h4><div class="ts-grade">';
      lista().forEach(function (t) {
        var v = (estado.stock[cor] && estado.stock[cor][t]) || '';
        h += '<div class="ts-item"><label>' + esc(t) + '</label>' +
          '<input type="number" min="0" inputmode="numeric" data-cor="' + i + '" data-t="' + esc(t) + '" value="' + v + '"></div>';
      });
      h += '</div></div>';
    });
    h += '</div>';
    el.innerHTML = h;

    Array.prototype.forEach.call(el.querySelectorAll('.ts-tipo button'), function (b) {
      b.onclick = function () { estado.tipo = b.getAttribute('data-tipo'); desenhar(); };
    });
    Array.prototype.forEach.call(el.querySelectorAll('input[data-cor]'), function (inp) {
      inp.oninput = function () {
        var cor = estado.cores[Number(inp.getAttribute('data-cor'))];
        var t = inp.getAttribute('data-t');
        estado.stock[cor] = estado.stock[cor] || {};
        estado.stock[cor][t] = Math.max(0, parseInt(inp.value, 10) || 0);
      };
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function carregar(variants) {
    estado.stock = {};
    (variants || []).forEach(function (v) {
      var cor = v.cor || v.color;
      var t = String(v.tamanho || v.size || '');
      var q = Number(v.stock != null ? v.stock : v.quantity) || 0;
      if (!cor || !t) return;
      estado.stock[cor] = estado.stock[cor] || {};
      estado.stock[cor][t] = q;
      if (CALCADO.indexOf(t) > -1 && ROUPA.indexOf(t) === -1) estado.tipo = 'calcado';
    });
  }

  window.TamanhosStock = {
    ROUPA: ROUPA,
    CALCADO: CALCADO,

    /* FORNECEDOR: mostra o editor. opcoes = {cores:['Branco','Preto'], variants:[...], tipo:'roupa'|'calcado'} */
    montar: function (elemento, opcoes) {
      opcoes = opcoes || {};
      estado.el = typeof elemento === 'string' ? document.querySelector(elemento) : elemento;
      estado.cores = (opcoes.cores || []).slice();
      if (opcoes.tipo) estado.tipo = opcoes.tipo;
      carregar(opcoes.variants);
      desenhar();
    },

    /* FORNECEDOR: chama quando as cores mudarem */
    definirCores: function (cores) {
      estado.cores = (cores || []).slice();
      desenhar();
    },

    /* FORNECEDOR: devolve o que vai para products.variants (só tamanhos com stock > 0) */
    obter: function () {
      var out = [];
      estado.cores.forEach(function (cor) {
        lista().forEach(function (t) {
          var q = estado.stock[cor] && estado.stock[cor][t];
          if (q > 0) out.push({ cor: cor, tamanho: t, stock: q });
        });
      });
      return out;
    },

    /* CLIENTE: tamanhos com stock numa cor, do menor ao maior */
    disponiveis: function (variants, cor) {
      var ordem = ROUPA.concat(CALCADO);
      return (variants || [])
        .filter(function (v) {
          return (v.cor || v.color) === cor && (Number(v.stock != null ? v.stock : v.quantity) || 0) > 0;
        })
        .map(function (v) { return { tamanho: String(v.tamanho || v.size), stock: Number(v.stock != null ? v.stock : v.quantity) }; })
        .sort(function (a, b) { return ordem.indexOf(a.tamanho) - ordem.indexOf(b.tamanho); });
    },

    /* CLIENTE: stock de uma cor + tamanho */
    stockDe: function (variants, cor, tamanho) {
      var r = (variants || []).filter(function (v) {
        return (v.cor || v.color) === cor && String(v.tamanho || v.size) === String(tamanho);
      })[0];
      return r ? (Number(r.stock != null ? r.stock : r.quantity) || 0) : 0;
    },

    /* CLIENTE: só deixa ir ao carrinho/pagamento se houver stock */
    podeAdicionar: function (variants, cor, tamanho, qtd) {
      return qtd > 0 && qtd <= this.stockDe(variants, cor, tamanho);
    }
  };
})();
