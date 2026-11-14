/* endereco-privado.js — BBabilônia (14/11/2026)
   Encomendas de fornecedores de Moçambique: o endereço de entrega fica guardado à parte (PARTE 14) e no pedido
   aparece "🔒 Endereço guardado pela BBabilônia (#código)…". Nesta página (cliente do pedido ou dono) o aviso é
   trocado pelo endereço verdadeiro. No domínio dos fornecedores não faz nada (e o servidor também não lhes dá o endereço).
   Carregado pelo pedidos.html (cliente) e pelo painel-admin-rececao.js (dono). */
(function () {
  if (window.__bbEndPriv) return; window.__bbEndPriv = 1;
  if (/^(suppliers|supplies|fornecedor)\./i.test(location.hostname)) return;
  var RE = /🔒 Endereço guardado pela BBabilônia \(#([0-9A-F]{8})\)[^\n]*?na loja\./g;
  var mapa = {}, pedidos = {}, aPedir = false, espera = null;

  function nos() {
    var l = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) if (n.nodeValue.indexOf("🔒 Endereço guardado pela BBabilônia") > -1) l.push(n);
    return l;
  }
  function trocar() {
    nos().forEach(function (n) {
      var t = n.nodeValue.replace(RE, function (tudo, c) { return mapa[c] ? mapa[c] : tudo; });
      if (t !== n.nodeValue) n.nodeValue = t;
    });
  }
  async function rever() {
    if (!window.sb || !window.sb.rpc || aPedir) return;
    var falta = [];
    nos().forEach(function (n) { n.nodeValue.replace(RE, function (x, c) { if (!(c in mapa) && !pedidos[c]) falta.push(c); return x; }); });
    trocar();
    if (!falta.length) return;
    aPedir = true;
    falta.forEach(function (c) { pedidos[c] = 1; });
    try {
      var r = await window.sb.rpc("bb_enderecos_privados", { p_codigos: falta });
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
