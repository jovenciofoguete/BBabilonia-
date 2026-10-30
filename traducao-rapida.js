/* traducao-rapida.js — B-Babilônia: muda de idioma de uma só vez, sem ter de recarregar a página.
   Antes: cada pedido traduzia 50 textos um a um no servidor; às vezes passava o tempo limite e a tradução parava
   (era preciso puxar a página 1 a 3 vezes). Agora os pedidos a /api/traduzir vão para /api/traduzir-lote, que traduz
   tudo de uma vez, em vários pedidos ao mesmo tempo, e a resposta nunca falha. Um texto que não deu para traduzir
   fica marcado e volta a ser pedido sozinho (não fica em português guardado no telemóvel).
   Tem de carregar antes do painel-vendedor-v2-idioma.js. Não altera os outros ficheiros. */
(function () {
  if (window.__bbTradRapida) return; window.__bbTradRapida = 1;
  var LS = window.localStorage;
  function ler(k, d) { try { return JSON.parse(LS.getItem(k) || "") || d; } catch (e) { return d; } }
  function gravar(k, v) { try { LS.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* 1) limpa do telemóvel os textos que ficaram em português por falha antiga ou recente */
  var p = ler("bb_prefs", {}), lg = String(p.idioma || navigator.language || "pt").split("-")[0].toLowerCase();
  if (lg === "iw") lg = "he";
  if (lg === "pt" || lg === "zh") return; /* chinês já tem as suas traduções certas; fica como está */
  function limpar(l) {
    var F = "bb_trad_falhou_" + l, falhou = ler(F, {}), ks = Object.keys(falhou);
    var C = "bb_trad_" + l, cache = ler(C, null), mudou = false;
    if (cache) {
      ks.forEach(function (k) { if (cache[k] === k) { delete cache[k]; mudou = true; } });
      /* falhas antigas (antes deste ficheiro): textos guardados sem tradução — pede de novo uma vez */
      if (!LS.getItem("bb_trad_limpo_" + l)) {
        Object.keys(cache).forEach(function (k) { if (cache[k] === k) { delete cache[k]; mudou = true; } });
        try { LS.setItem("bb_trad_limpo_" + l, "1"); } catch (e) {}
      }
      if (mudou) gravar(C, cache);
    }
    if (ks.length) { try { LS.removeItem(F); } catch (e) {} }
  }
  limpar(lg);

  /* 2) pedidos rápidos */
  var orig = window.fetch.bind(window);
  var TAM = 12, PARALELO = 6;
  function lote(para, textos) {
    return orig("/api/traduzir-lote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ para: para, textos: textos }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && Array.isArray(j.textos) ? j.textos : textos.map(function () { return null; }); })
      .catch(function () { return textos.map(function () { return null; }); });
  }
  function velho(para, textos) { /* servidor antigo, para o pouco que faltar */
    return orig("/api/traduzir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ para: para, textos: textos }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && Array.isArray(j.textos) ? j.textos.map(function (s, i) { return s && s !== textos[i] ? s : null; }) : textos.map(function () { return null; }); })
      .catch(function () { return textos.map(function () { return null; }); });
  }
  async function traduzir(para, textos) {
    var saida = textos.map(function () { return null; });
    async function ronda(fn, tam) {
      var falta = []; saida.forEach(function (s, i) { if (s == null) falta.push(i); });
      if (!falta.length) return;
      var grupos = []; for (var i = 0; i < falta.length; i += tam) grupos.push(falta.slice(i, i + tam));
      var g = 0;
      async function trab() { while (g < grupos.length) { var idx = grupos[g++]; var r = await fn(para, idx.map(function (n) { return textos[n]; })); idx.forEach(function (n, k) { if (r[k] != null && String(r[k]).trim()) saida[n] = String(r[k]); }); } }
      var ts = []; for (var t = 0; t < Math.min(PARALELO, grupos.length); t++) ts.push(trab()); await Promise.all(ts);
    }
    await ronda(lote, TAM);
    await ronda(lote, 4);              // segunda tentativa, grupos pequenos
    await ronda(velho, 10);            // último recurso
    var F = "bb_trad_falhou_" + para, falhou = ler(F, {}), marcou = false;
    saida.forEach(function (s, i) { if (s == null) { saida[i] = textos[i]; falhou[textos[i]] = 1; marcou = true; } });
    if (marcou) { gravar(F, falhou); repetir(para); }
    return saida;
  }

  /* textos que falharam: volta a tentar daqui a pouco e mostra logo na página */
  var tRep = null, tentativas = 0;
  function repetir(para) {
    if (tRep || tentativas >= 4) return;
    tRep = setTimeout(async function () {
      tRep = null; tentativas++;
      var F = "bb_trad_falhou_" + para, falhou = ler(F, {}), ks = Object.keys(falhou).slice(0, 120);
      if (!ks.length) return;
      var r = await lote(para, ks), novos = {};
      ks.forEach(function (k, i) { if (r[i] != null && String(r[i]).trim() && r[i] !== k) { novos[k] = String(r[i]); delete falhou[k]; } });
      gravar(F, falhou);
      if (Object.keys(novos).length) aplicar(para, novos);
      if (Object.keys(falhou).length) repetir(para);
    }, 2500 * (tentativas + 1));
  }
  var FIX = {};
  function aplicar(para, novos) {
    Object.keys(novos).forEach(function (k) { FIX[k] = novos[k]; });
    var C = "bb_trad_" + para, cache = ler(C, {}); Object.keys(novos).forEach(function (k) { cache[k] = novos[k]; }); gravar(C, cache);
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n, lista = [];
    while ((n = w.nextNode())) { var t = n.nodeValue.trim(); if (novos[t]) lista.push([n, t]); }
    lista.forEach(function (x) { x[0].nodeValue = x[0].nodeValue.replace(x[1], novos[x[1]]); });
    ["placeholder", "title", "aria-label"].forEach(function (a) {
      document.querySelectorAll("[" + a + "]").forEach(function (e) { var v = (e.getAttribute(a) || "").trim(); if (novos[v]) e.setAttribute(a, novos[v]); });
    });
  }
  /* o painel guarda o seu próprio cache por cima: junta as correções para não voltarem ao português */
  try {
    var setOrig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (this === LS && typeof k === "string" && k.indexOf("bb_trad_") === 0 && k.indexOf("bb_trad_falhou_") !== 0 && k.indexOf("bb_trad_limpo_") !== 0 && Object.keys(FIX).length) {
        try { var o = JSON.parse(v); var mud = false; Object.keys(FIX).forEach(function (x) { if (o[x] === x || o[x] == null) { o[x] = FIX[x]; mud = true; } }); if (mud) v = JSON.stringify(o); } catch (e) {}
      }
      return setOrig.call(this, k, v);
    };
  } catch (e) {}

  window.fetch = function (url, opc) {
    try {
      var u = typeof url === "string" ? url : (url && url.url) || "";
      if (/\/api\/traduzir(\?|$)/.test(u.replace(location.origin, "")) && opc && opc.body) {
        var b = JSON.parse(opc.body);
        if (b && Array.isArray(b.textos) && b.para) {
          return traduzir(String(b.para), b.textos.map(String)).then(function (saida) {
            return new Response(JSON.stringify({ textos: saida }), { status: 200, headers: { "Content-Type": "application/json" } });
          });
        }
      }
    } catch (e) {}
    return orig(url, opc);
  };
})();
