/* pais-fornecedor.js — mostra a bandeira e o país do fornecedor ao lado do preço
   nos cartões da página inicial (não altera nada do index.html nem do inicio-v2.js) */
(function () {
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co";
  var KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var paisDe = null;          /* dono (supplier_id) -> código do país, ex.: "MZ" */
  var donoDe = {};            /* id do produto -> supplier_id (quando a lista global não existe) */
  var nomes = null;
  try { nomes = new Intl.DisplayNames(["pt"], { type: "region" }); } catch (e) {}

  var css = document.createElement("style");
  css.textContent =
    ".card .preco{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:6px}" +
    ".card .preco .pf{font-family:inherit;font-family:system-ui,sans-serif;font-weight:400;font-size:11px;color:var(--suave,#777);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}";
  document.head.appendChild(css);

  function bandeira(c) {
    if (!/^[A-Z]{2}$/.test(c)) return "";
    return String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1));
  }
  function nomePais(c) {
    try { return (nomes && nomes.of(c)) || c; } catch (e) { return c; }
  }
  function listaProdutos() {
    try { if (typeof produtos !== "undefined" && Array.isArray(produtos)) return produtos; } catch (e) {}
    return [];
  }
  function dono(id) {
    var l = listaProdutos();
    for (var i = 0; i < l.length; i++) if (String(l[i].id) === id) return l[i].supplier_id || null;
    return donoDe[id] || null;
  }

  function aplicar() {
    if (!paisDe) return;
    var cards = document.querySelectorAll("#grelha a.card");
    var faltam = [];
    cards.forEach(function (a) {
      var pr = a.querySelector(".preco");
      if (!pr || pr.querySelector(".pf")) return;
      var m = /[?&]id=([^&]+)/.exec(a.getAttribute("href") || "");
      if (!m) return;
      var id = decodeURIComponent(m[1]);
      var d = dono(id);
      if (!d && !(id in donoDe)) { faltam.push(id); return; }
      var c = d && paisDe[String(d)];
      if (!c) return;
      c = String(c).toUpperCase();
      var s = document.createElement("span");
      s.className = "pf";
      s.textContent = (bandeira(c) + " " + nomePais(c)).trim();
      s.title = "Fornecedor de " + nomePais(c);
      pr.appendChild(s);
    });
    if (faltam.length) buscarDonos(faltam);
  }

  var aBuscar = false;
  function buscarDonos(ids) {
    if (aBuscar) return; aBuscar = true;
    fetch(SB + "/rest/v1/products?select=id,supplier_id&id=in.(" + ids.map(encodeURIComponent).join(",") + ")",
      { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (l) {
        ids.forEach(function (i) { donoDe[i] = null; });
        (l || []).forEach(function (p) { donoDe[String(p.id)] = p.supplier_id || null; });
      })
      .catch(function () { ids.forEach(function (i) { donoDe[i] = null; }); })
      .then(function () { aBuscar = false; aplicar(); });
  }

  fetch(SB + "/rest/v1/rpc/paises_fornecedores", {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: "{}"
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (l) {
      paisDe = {};
      (l || []).forEach(function (x) { if (x.dono && x.pais) paisDe[String(x.dono)] = x.pais; });
      aplicar();
    })
    .catch(function () {});

  function observar() {
    var g = document.getElementById("grelha");
    if (!g) return setTimeout(observar, 300);
    new MutationObserver(aplicar).observe(g, { childList: true, subtree: true });
    aplicar();
  }
  observar();
})();
    
