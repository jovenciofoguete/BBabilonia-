/* importar-moeda.js — BBabilônia: na importação da loja a moeda é sempre fixa.
   Loja de Moçambique (MZ) -> Metical (MZN). Outro país -> Dólar (USD).
   Ignora a moeda escrita no ficheiro. Carregado pelo fabrica.html dentro do importar-loja-v7.html. */
(function () {
  if (window.__bbImpMoeda) return; window.__bbImpMoeda = 1;
  var SUPA = 'https://dsfoqoeawvjafypycldz.supabase.co', KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var cod = '';   // vazio até saber o país da loja

  function sessao() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          if (s && s.access_token && s.user) return s;
        }
      }
    } catch (e) {}
    return null;
  }
  function pais(s) {
    return fetch(SUPA + '/rest/v1/lojas?select=pais&dono_id=eq.' + encodeURIComponent(s.user.id) + '&limit=1', { headers: { apikey: KEY, Authorization: 'Bearer ' + s.access_token } })
      .then(function (r) { return r.ok ? r.json() : []; }).then(function (l) { return (l && l[0] && l[0].pais) || ''; }).catch(function () { return ''; });
  }

  /* o que se vê na lista de pré-visualização: "25.5 EUR · 2 cor(es)…" passa a mostrar a moeda fixa */
  function corrigirLista() {
    if (!cod) return;
    var l = document.getElementById('lista'); if (!l) return;
    l.querySelectorAll('small .ok').forEach(function (sp) {
      var n = sp.firstChild;
      if (n && n.nodeType === 3) {
        var novo = n.nodeValue.replace(/^(\s*[\d.,]+)\s+[A-Z]{3}(\s·)/, '$1 ' + cod + '$2');
        if (novo !== n.nodeValue) n.nodeValue = novo;
      }
    });
  }
  function ligarLista() {
    var l = document.getElementById('lista'); if (!l) return;
    new MutationObserver(corrigirLista).observe(l, { childList: true, subtree: true, characterData: true });
    corrigirLista();
  }

  /* o que se grava: força a moeda em cada produto importado */
  function ligarGravar() {
    if (!window.sb || window.sb.__bbMoeda) return;
    window.sb.__bbMoeda = 1;
    var de = window.sb.from.bind(window.sb);
    window.sb.from = function (t) {
      var q = de(t);
      if (t === 'products' && q.insert) {
        var oi = q.insert.bind(q);
        q.insert = function (row, o) {
          try { if (row && !Array.isArray(row)) row.currency = cod || 'MZN'; } catch (e) {}
          return oi(row, o);
        };
      }
      return q;
    };
  }

  var n = 0, t = setInterval(function () {
    var s = sessao();
    if (window.sb && s) {
      clearInterval(t);
      ligarGravar(); ligarLista();
      pais(s).then(function (p) { cod = p && p !== 'MZ' ? 'USD' : 'MZN'; corrigirLista(); });
    } else if (++n > 600) clearInterval(t);
  }, 1000);
})();
