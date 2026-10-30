/* pro-destaque.js — B-Babilônia: destaque dos fornecedores PRO.
   - página inicial (index.html): os produtos dos fornecedores PRO aparecem primeiro (também nas categorias e na pesquisa), com o selo 👑 PRO;
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

  /* página inicial: PRO primeiro, mantendo a ordem dentro de cada grupo */
  function ordenar() {
    var l = lista(); if (!PRO || !l || !l.length) return;
    var pos = new Map(); l.forEach(function (p, i) { pos.set(p, i); });
    l.sort(function (a, b) { return (ehPro(b) - ehPro(a)) || (pos.get(a) - pos.get(b)); });
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
