/* moq-cartao.js — B-Babilônia: nos cartões da página inicial, onde estavam as cores,
   mostra o MOQ (pedido mínimo) que o fornecedor definiu ao registar o produto, seguido de "Negociável".
   Coluna usada: products.pedido_minimo (a mesma do pedido-minimo.js). Não altera index.html. */
(function () {
  if (window.__bbMoqCartao) return; window.__bbMoqCartao = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co";
  var KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var minDe = {};            /* id do produto -> MOQ, quando a lista global não tem o produto */
  var aBuscar = false;

  var css = document.createElement("style");
  css.textContent =
    "#grelha .card .cores{display:none!important}" +
    "#grelha .card .moq{margin-top:3px;font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    "#grelha .card .moq b{font-weight:700;color:#222}" +
    "#grelha .card .moq i{font-style:normal;color:#0f9d58;font-weight:700}";
  document.head.appendChild(css);

  function moq(v) { var n = Math.floor(Number(v) || 1); return n > 1 ? n : 1; }
  function lista() {
    try { if (typeof produtos !== "undefined" && Array.isArray(produtos)) return produtos; } catch (e) {}
    return [];
  }
  function moqDe(id) {
    var l = lista();
    for (var i = 0; i < l.length; i++) if (String(l[i].id) === id) return moq(l[i].pedido_minimo || l[i].min_order || l[i].moq);
    return (id in minDe) ? minDe[id] : null;
  }

  function aplicar() {
    var cards = document.querySelectorAll("#grelha a.card"), faltam = [];
    cards.forEach(function (a) {
      var info = a.querySelector(".info");
      if (!info) return;
      var m = /[?&]id=([^&]+)/.exec(a.getAttribute("href") || "");
      if (!m) return;
      var id = decodeURIComponent(m[1]), n = moqDe(id);
      if (n === null) { faltam.push(id); return; }
      var el = info.querySelector(".moq");
      var html = "MOQ: <b>" + n + "</b> \u00b7 <i>Negoci\u00e1vel</i>";
      if (!el) {
        el = document.createElement("div"); el.className = "moq";
        var pr = info.querySelector(".preco");
        if (pr && pr.nextSibling) info.insertBefore(el, pr.nextSibling); else info.appendChild(el);
      }
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    if (faltam.length) buscar(faltam);
  }

  function buscar(ids) {
    if (aBuscar) return; aBuscar = true;
    fetch(SB + "/rest/v1/products?select=id,pedido_minimo&id=in.(" + ids.map(encodeURIComponent).join(",") + ")",
      { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (l) {
        ids.forEach(function (i) { minDe[i] = 1; });
        (l || []).forEach(function (p) { minDe[String(p.id)] = moq(p.pedido_minimo); });
      })
      .catch(function () { ids.forEach(function (i) { minDe[i] = 1; }); })
      .then(function () { aBuscar = false; aplicar(); });
  }

  function observar() {
    var g = document.getElementById("grelha");
    if (!g) return setTimeout(observar, 300);
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(aplicar, 30); }).observe(g, { childList: true, subtree: true });
    aplicar();
  }
  observar();
})();
    
