/* painel-vendedor-v2-zh.js — B-Babilônia: painel do vendedor sempre em chinês SIMPLIFICADO.
   Algumas traduções vinham em chinês tradicional (ex.: 產品 em vez de 产品). Este ficheiro converte tudo
   para simplificado: as traduções novas, as já guardadas no telemóvel e o texto que está no ecrã.
   O dicionário (OpenCC) está em 4 ficheiros: zh-dicionario-1.js … zh-dicionario-4.js, carregados daqui.
   Só funciona quando o idioma é chinês. Não altera o painel-vendedor-v2-idioma.js nem os outros ficheiros. */
(function () {
  if (window.__bbZhSimp) return; window.__bbZhSimp = 1;
  function prefs() { try { return JSON.parse(localStorage.getItem("bb_prefs") || "{}") || {}; } catch (e) { return {}; } }
  var L = String(prefs().idioma || navigator.language || "pt").split("-")[0].toLowerCase();
  if (L !== "zh") return;

  var PARTES = 4, MAPA = {}, carregadas = 0;
  var HAN = /[㐀-鿿豈-﫿]/;
  function juntar() {
    var l = window.BBZH || [];
    while (l.length) {
      var p = l.shift();
      if (!p || typeof p.T !== "string" || typeof p.S !== "string" || p.T.length !== p.S.length) continue; // parte mal copiada: ignora
      for (var i = 0; i < p.T.length; i++) MAPA[p.T.charAt(i)] = p.S.charAt(i);
    }
  }
  function simp(txt) {
    if (!txt || !HAN.test(txt)) return txt;
    var r = "", mudou = false;
    for (var j = 0; j < txt.length; j++) { var c = txt.charAt(j), n = MAPA[c]; if (n) { r += n; mudou = true; } else r += c; }
    return mudou ? r : txt;
  }
  window.BBSimplificado = simp;

  /* 1) traduções já guardadas no telemóvel (volta a limpar depois de cada gravação) */
  function limparCache() {
    try {
      var CH = "bb_trad_zh", g = JSON.parse(localStorage.getItem(CH) || "{}") || {}, alt = false;
      Object.keys(g).forEach(function (k) { var v = simp(g[k]); if (v !== g[k]) { g[k] = v; alt = true; } });
      if (alt) localStorage.setItem(CH, JSON.stringify(g));
    } catch (e) {}
  }
  window.addEventListener("pagehide", limparCache);
  document.addEventListener("visibilitychange", limparCache);

  /* 2) traduções novas: resposta do servidor convertida; textos que já estão em chinês não vão ao servidor */
  var f0 = window.fetch;
  if (f0) window.fetch = function (url, op) {
    var u = typeof url === "string" ? url : (url && url.url) || "";
    if (u.indexOf("/api/traduzir") < 0 || !op || typeof op.body !== "string") return f0.apply(this, arguments);
    var b; try { b = JSON.parse(op.body); } catch (e) { return f0.apply(this, arguments); }
    if (!b || !Array.isArray(b.textos)) return f0.apply(this, arguments);
    var fora = [], idx = [];
    b.textos.forEach(function (t, k) { if (!HAN.test(t)) { idx.push(k); fora.push(t); } });
    var saida = b.textos.map(function (t) { return simp(t); });
    setTimeout(limparCache, 400);
    function resposta() { setTimeout(limparCache, 300); return new Response(JSON.stringify({ textos: saida }), { status: 200, headers: { "Content-Type": "application/json" } }); }
    if (!fora.length) return Promise.resolve(resposta());
    var op2 = Object.assign({}, op, { body: JSON.stringify(Object.assign({}, b, { textos: fora })) });
    return f0.call(this, url, op2).then(function (r) {
      if (!r.ok) return r;
      return r.json().then(function (j) {
        if (!j || !Array.isArray(j.textos)) return resposta();
        idx.forEach(function (k, n) { saida[k] = simp(String(j.textos[n] == null ? b.textos[k] : j.textos[n])); });
        return resposta();
      });
    });
  };

  /* 3) texto que já está no ecrã ou que aparece depois */
  function no(n) { if (n.nodeType === 3) { var v = simp(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } }
  function atr(el) {
    ["placeholder", "title", "aria-label"].forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v) { var w = simp(v); if (w !== v) el.setAttribute(a, w); } });
  }
  function tudo(raiz) {
    if (!raiz) return;
    if (raiz.nodeType === 3) return no(raiz);
    if (raiz.nodeType !== 1 || raiz.tagName === "SCRIPT" || raiz.tagName === "STYLE") return;
    atr(raiz); raiz.querySelectorAll("[placeholder],[title],[aria-label]").forEach(atr);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { var p = n.parentNode; if (p && (p.tagName === "SCRIPT" || p.tagName === "STYLE")) continue; no(n); }
  }
  function titulo() { var d = simp(document.title); if (d !== document.title) document.title = d; }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === "characterData") no(m.target);
      else if (m.type === "attributes") atr(m.target);
      else m.addedNodes.forEach(tudo);
    });
    titulo();
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"] });

  /* carregar as 4 partes do dicionário; cada parte que chega converte logo o ecrã */
  function depois() { juntar(); tudo(document.body); titulo(); limparCache(); }
  for (var i = 1; i <= PARTES; i++) {
    var s = document.createElement("script");
    s.src = "zh-dicionario-" + i + ".js?v=1";
    s.onload = s.onerror = function () { carregadas++; depois(); };
    document.head.appendChild(s);
  }
})();
