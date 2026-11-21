/* pro-destaque.js — B-Babilônia: destaque dos fornecedores PRO.
   - página inicial (index.html): os produtos dos fornecedores PRO aparecem primeiro (também nas categorias e na pesquisa), com o selo 👑 PRO;
   - (21/11/2026) dentro de cada grupo a ordem é baralhada a cada vez que a página abre (como nas outras grandes plataformas);
   - (21/11/2026) "para si": a página inicial mostra primeiro o que o cliente mais pesquisa, abre e escolhe (lembra neste telemóvel/navegador, os interesses antigos vão perdendo peso);
   - página da loja (loja.html): selo 👑 PRO por baixo do nome da loja e nos produtos.
   A lista dos fornecedores PRO vem da função fornecedores_pro no Supabase. Não altera os outros ficheiros. */
(function () {
  if (window.__bbPro) return; window.__bbPro = 1;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var PRO = null;
  var pagina = location.pathname.split("/").pop() || "index.html";
  var css = document.createElement("style");
  css.textContent = ".bb-pro{position:absolute;right:6px;top:6px;z-index:2;background:linear-gradient(90deg,#f59e0b,#b45309);color:#fff;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:6px;box-shadow:0 2px 6px #0003}" +
    "#bb-pro-loja{display:inline-block;margin-top:6px;background:linear-gradient(90deg,#f59e0b,#b45309);color:#fff;border-radius:999px;padding:3px 11px;font-size:12.5px;font-weight:800}";
  document.head.appendChild(css);

  function lista() { try { if (typeof produtos !== "undefined" && Array.isArray(produtos)) return produtos; } catch (e) {} return null; }
  function donoDe(p) { return p ? String(p.supplier_id || p.user_id || p.fornecedor_id || p.owner_id || "") : ""; }
  function ehPro(p) { return !!(PRO && PRO[donoDe(p)]); }

  /* ordem baralhada: nova a cada abertura da página, igual durante a visita (pesquisar e mudar de categoria não troca tudo) */
  var SEMENTE = Math.random().toString(36).slice(2);
  function chave(p) { var s = SEMENTE + String(p.id), h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return h >>> 0; }

  /* página inicial: PRO primeiro; dentro de cada grupo, ordem baralhada */
  function ordenar() {
    var l = lista(); if (!l || !l.length) return;
    var k = new Map(); l.forEach(function (p) { k.set(p, chave(p)); });
    var sc = new Map(); l.forEach(function (p) { var v = 0; try { v = window.bbInteresse ? window.bbInteresse(p) : 0; } catch (e) {} sc.set(p, v); });
    l.sort(function (a, b) { return (ehPro(b) - ehPro(a)) || (sc.get(b) - sc.get(a)) || (k.get(a) - k.get(b)); });
  }
  function selos() {
    if (!PRO) return;
    var l = lista() || [], porId = {};
    l.forEach(function (p) { porId[String(p.id)] = p; });
    document.querySelectorAll('a.card[href*="id="]').forEach(function (a) {
      var id = decodeURIComponent((a.getAttribute("href").split("id=")[1] || "").split("&")[0]);
      var p = porId[id], pro = pagina === "loja.html" ? lojaPro() : ehPro(p);
      var fx = a.querySelector(".foto, .ft"); if (!fx) return;
      var s = fx.querySelector(".bb-pro");
      if (pro && !s) { s = document.createElement("span"); s.className = "bb-pro"; s.textContent = "👑 PRO"; fx.appendChild(s); }
      else if (!pro && s) s.remove();
    });
  }
  function lojaPro() { var f = new URLSearchParams(location.search).get("f") || ""; return !!(PRO && PRO[f]); }
  function seloLoja() {
    if (pagina !== "loja.html" || !PRO) return;
    var meta = document.getElementById("meta"), bts = document.getElementById("bts"), b = document.getElementById("bb-pro-loja");
    if (!lojaPro() || !meta || !bts || bts.hidden) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "bb-pro-loja"; b.textContent = "👑 Fornecedor PRO"; meta.insertAdjacentElement("afterend", b); }
  }

  if (pagina === "index.html" || pagina === "") {
    try {
      var antes = desenhar;
      desenhar = function () { ordenar(); return antes.apply(this, arguments); };
    } catch (e) {}
  }

  var t = null;
  function tudo() { clearTimeout(t); t = setTimeout(function () { selos(); seloLoja(); }, 30); }
  new MutationObserver(tudo).observe(document.body, { childList: true, subtree: true });

  fetch(SUPA + "/rest/v1/rpc/fornecedores_pro", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: "{}" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (ids) {
      PRO = {}; (ids || []).forEach(function (x) { var v = typeof x === "string" ? x : x && (x.fornecedores_pro || Object.values(x)[0]); if (v) PRO[String(v)] = 1; });
      var l = lista();
      if (l && l.length && Object.keys(PRO).length) { try { desenhar(); } catch (e) {} }
      tudo();
    }).catch(function () {});
})();
/* (07/11/2026) "⭐ Em destaque" na página inicial (destaques.js) e "Seguir"/"Denunciar" na página da loja (loja-extras.js) */
(function(){var pg=location.pathname.split("/").pop()||"index.html",f=pg==="loja.html"?"loja-extras.js":(pg==="index.html"?"destaques.js":"");if(!f||document.querySelector("script[src*=\""+f+"\"]"))return;var s=document.createElement("script");s.src=f+"?v=1";(document.head||document.documentElement).appendChild(s)})();

/* (21/11/2026) PARA SI: lembra o que o cliente pesquisa, abre e escolhe, e a página inicial mostra primeiro o mais parecido.
   Guarda só neste navegador (localStorage). Cada interesse perde metade do peso em 30 dias. */
(function () {
  var pg = location.pathname.split("/").pop() || "index.html";
  if (pg !== "index.html" || window.__bbPV) return; window.__bbPV = 1;
  var CH = "bb_interesses_v1", MAX = 60, MEIA = 30 * 864e5;
  var STOP = {}; "de da do das dos para com por que uma uns umas the and for com sem nos nas mais muito pra".split(" ").forEach(function (w) { STOP[w] = 1; });
  function sa(t) { return String(t == null ? "" : t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function pal(t) { return sa(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3 && !STOP[w]; }).map(function (w) { return w.length > 4 && w.slice(-1) === "s" ? w.slice(0, -1) : w; }); }
  function ler() { try { var o = JSON.parse(localStorage.getItem(CH) || "{}"); return o && typeof o === "object" ? o : {}; } catch (e) { return {}; } }
  function gravar(o) { try { localStorage.setItem(CH, JSON.stringify(o)); } catch (e) {} }
  function atual(a, agora) { return a[0] * Math.pow(0.5, (agora - a[1]) / MEIA); }
  function somar(tipo, chave, peso) {
    var o = ler(), agora = Date.now(); o.p = o.p || {}; o.c = o.c || {};
    var m = o[tipo], a = m[chave]; m[chave] = [(a ? atual(a, agora) : 0) + peso, agora];
    var ks = Object.keys(m); if (ks.length > MAX) { ks.sort(function (x, y) { return atual(m[x], agora) - atual(m[y], agora); }).slice(0, ks.length - MAX).forEach(function (k) { delete m[k]; }); }
    gravar(o); perfil = null;
  }
  var perfil = null, quando = 0;
  function montar() {
    var o = ler(), agora = Date.now(), pw = [], cs = {};
    Object.keys(o.p || {}).forEach(function (w) { var v = atual(o.p[w], agora); if (v > 0.05) pw.push([w, v]); });
    Object.keys(o.c || {}).forEach(function (c) { var v = atual(o.c[c], agora); if (v > 0.05) cs[c] = v; });
    return { pw: pw, cs: cs, vazio: !pw.length && !Object.keys(cs).length };
  }
  var cache = typeof WeakMap === "function" ? new WeakMap() : null;
  function texto(p) {
    var t = cache && cache.get(p); if (t != null) return t;
    var nome = p.name || p.nome || p.title || p.titulo || "", cam = "";
    try { cam = caminhoCat(p.category_id); } catch (e) {}
    t = sa(nome + " " + cam + " " + (p.description || p.descricao || "")); if (cache) cache.set(p, t); return t;
  }
  window.bbInteresse = function (p) {
    if (!perfil || Date.now() - quando > 500) { perfil = montar(); quando = Date.now(); }
    if (perfil.vazio) return 0;
    var t = texto(p), s = 0, i;
    for (i = 0; i < perfil.pw.length; i++) if (t.indexOf(perfil.pw[i][0]) >= 0) s += perfil.pw[i][1];
    var id = p.category_id, f = 1, n = 0, c;
    while (id != null && n < 4) { if (perfil.cs[id]) s += perfil.cs[id] * f; c = null; try { c = categorias.find(function (x) { return x.id === id; }); } catch (e) {} id = c ? c.parent_id : null; f /= 2; n++; }
    return Math.round(s * 10) / 10;
  };
  /* o que o cliente pesquisa (guarda quando pára de escrever) */
  var tq = null, q = document.getElementById("q");
  function guardarTermo() { var v = q && q.value.trim(); if (v && v.length >= 3) pal(v).forEach(function (w) { somar("p", w, 3); }); }
  if (q) {
    q.addEventListener("input", function () { clearTimeout(tq); tq = setTimeout(guardarTermo, 1500); });
    q.addEventListener("change", function () { clearTimeout(tq); guardarTermo(); });
  }
  /* o que abre */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a.card[href*="id="]'); if (!a) return;
    var id = decodeURIComponent((a.getAttribute("href").split("id=")[1] || "").split("&")[0]), p = null;
    try { p = produtos.find(function (x) { return String(x.id) === id; }); } catch (er) {}
    if (!p) return;
    pal(p.name || p.nome || p.title || p.titulo || "").forEach(function (w) { somar("p", w, 1); });
    if (p.category_id != null) somar("c", p.category_id, 2);
  }, true);
  /* o que escolhe nas categorias */
  try { var esc0 = escolher; escolher = function (id) { if (id != null) somar("c", id, 1.5); return esc0.apply(this, arguments); }; } catch (e) {}
})();
