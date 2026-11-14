/* endereco-privado.js — BBabilônia (14/11/2026)
   Encomendas de fornecedores de Moçambique: o endereço e o contacto do cliente ficam guardados à parte
   (PARTE 14 e 15, loja e cliente de Moçambique). No pedido aparece "🔒 Contacto guardado pela BBabilônia (#código)" e
   "🔒 Endereço guardado pela BBabilônia (#código)…".
   Nesta página (cliente do pedido ou dono) os avisos são trocados pelos dados verdadeiros.
   No domínio dos fornecedores não faz nada (e o servidor também não lhes dá os dados).
   Carregado pelo pedidos.html (cliente) e pelo painel-admin-rececao.js (dono). */
(function () {
  if (window.__bbEndPriv) return; window.__bbEndPriv = 1;
  if (/^(suppliers|supplies|fornecedor)\./i.test(location.hostname)) return;
  var RE_END = /🔒 Endereço guardado pela BBabilônia \(#([0-9A-F]{8})\)[^\n]*?na loja\./g;
  var RE_TEL = /🔒 Contacto guardado pela BBabilônia \(#([0-9A-F]{8})\)/g;
  var MARCA = /🔒 (Endereço|Contacto) guardado pela BBabilônia/;
  var mapa = {}, pedidos = {}, aPedir = false, espera = null;

  function nos() {
    var l = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) if (MARCA.test(n.nodeValue)) l.push(n);
    return l;
  }
  function codigos(t, l) {
    t.replace(RE_END, function (x, c) { l.push(c); return x; });
    t.replace(RE_TEL, function (x, c) { l.push(c); return x; });
  }
  function trocar() {
    nos().forEach(function (n) {
      var t = n.nodeValue
        .replace(RE_END, function (tudo, c) { return mapa[c] && mapa[c].endereco ? mapa[c].endereco : tudo; })
        .replace(RE_TEL, function (tudo, c) { return mapa[c] && mapa[c].telefone ? mapa[c].telefone : tudo; });
      if (t !== n.nodeValue) n.nodeValue = t;
    });
  }
  async function rever() {
    if (!window.sb || !window.sb.rpc || aPedir) return;
    var todos = [], falta = [];
    nos().forEach(function (n) { codigos(n.nodeValue, todos); });
    todos.forEach(function (c) { if (!(c in mapa) && !pedidos[c] && falta.indexOf(c) < 0) falta.push(c); });
    trocar();
    if (!falta.length) return;
    aPedir = true;
    falta.forEach(function (c) { pedidos[c] = 1; });
    try {
      var r = await window.sb.rpc("bb_dados_privados", { p_codigos: falta });
      var d = (r && r.data) || {};
      falta.forEach(function (c) { mapa[c] = d[c] || null; });
    } catch (e) { falta.forEach(function (c) { delete pedidos[c]; }); }
    aPedir = false;
    trocar();
  }
  function agendar() { clearTimeout(espera); espera = setTimeout(rever, 250); }
  function arrancar() {
    new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true, characterData: true });
    agendar();
    try { if (window.sb && window.sb.auth) window.sb.auth.onAuthStateChange(function () { mapa = {}; pedidos = {}; agendar(); }); } catch (e) {}
  }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();
