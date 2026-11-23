/* taxa-preco.js — BBabilônia (23/11/2026): taxa da plataforma ao lado do preço, no lado do fornecedor.
   O fornecedor escreve o SEU preço (ex.: 1000) e vê logo "+6% → o cliente vê 1 060".
   Também em cada faixa do preço por quantidade. O servidor soma a taxa sozinho ao publicar/guardar (TAXA.sql).
   1) Registar produto (registar-produto.html → fornecedor-novo.html)
   2) Painel do vendedor › Editar: o campo Preço mostra o preço do fornecedor (sem a taxa), com a mesma linha.
   Não altera os outros ficheiros: só acrescenta. */
(function () {
  if (window.__bbTaxaPreco) return; window.__bbTaxaPreco = 1;
  var d = document, U = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var SK = "sb-dsfoqoeawvjafypycldz-auth-token", TAXA = null;
  function num(v) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }); }
  function vezes(v) { return Math.round(Number(v) * (1 + TAXA / 100) * 100) / 100; }
  function token() {
    try { var s = JSON.parse(localStorage.getItem(SK) || "null"); if (s && s.currentSession) s = s.currentSession; return s && s.access_token; } catch (e) { return null; }
  }
  var css = d.createElement("style");
  css.textContent = ".bb-tx{font:600 13px system-ui,Arial,sans-serif;color:#0f766e;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:8px 10px;margin:-4px 0 10px;line-height:1.45}" +
    ".bb-tx b{color:#065f46;font-size:14px}#bb-pq .pv{display:none!important}.bb-tx-pq{font-size:12.5px;color:#0f766e;margin-top:6px;line-height:1.5}";
  d.head.appendChild(css);

  async function lerTaxa() {
    if (TAXA !== null) return TAXA;
    try {
      var t = token();
      var r = await fetch(U + "/rest/v1/rpc/bb_minha_taxa", { method: "POST", headers: { apikey: K, Authorization: "Bearer " + (t || K), "Content-Type": "application/json" }, body: "{}" });
      var j = r.ok ? await r.json() : null;
      TAXA = typeof j === "number" ? j : Number(j) || 0;
    } catch (e) { TAXA = 0; }
    return TAXA;
  }
  function moedaDe() { var m = d.getElementById("moeda") || d.querySelector("select[name=moeda]"); return m && m.value ? " " + m.value : ""; }
  function linha(inp, depois, moeda) {
    var el = d.createElement("div"); el.className = "bb-tx";
    (depois || inp).insertAdjacentElement("afterend", el);
    function ver() {
      var v = Number(String(inp.value).replace(",", "."));
      el.innerHTML = v > 0 ? "➕ Taxa BBabilônia " + num(TAXA) + "% → o cliente vê: <b>" + num(vezes(v)) + (moeda ? moeda() : "") + "</b>"
        : "➕ Taxa BBabilônia " + num(TAXA) + "% é somada sozinha ao seu preço.";
    }
    inp.addEventListener("input", ver); d.addEventListener("change", ver); ver();
    return el;
  }
  /* faixas do preço por quantidade (#bb-pq do precos-qtd.js) */
  function faixas(box, precoBase) {
    if (!box || box.__bbTx) return; box.__bbTx = 1;
    var pv = d.createElement("div"); pv.className = "bb-tx-pq";
    var er = box.querySelector(".er"); (er || box).insertAdjacentElement("beforebegin", pv);
    function ver() {
      if (typeof box.ler !== "function") return;
      var r = box.ler(), bp = precoBase();
      if (r.erro || !r.faixas.length || !(bp > 0)) { pv.innerHTML = ""; return; }
      var l = [{ de: 1, ate: r.faixas[0].min - 1, p: bp }];
      r.faixas.forEach(function (x, i) { l.push({ de: x.min, ate: r.faixas[i + 1] ? r.faixas[i + 1].min - 1 : null, p: x.preco }); });
      pv.innerHTML = "O cliente vê (com a taxa de " + num(TAXA) + "%): " + l.map(function (x) {
        var t = x.ate == null ? x.de + "+ peças" : (x.de === x.ate ? x.de + (x.de === 1 ? " peça" : " peças") : x.de + "–" + x.ate + " peças");
        return "<b>" + t + "</b>: " + num(vezes(x.p));
      }).join(" · ");
    }
    box.addEventListener("input", ver); box.addEventListener("click", function () { setTimeout(ver, 0); });
    d.addEventListener("input", function (e) { if (e.target && e.target.id && /^(preco|eP)$/.test(e.target.id)) ver(); });
    ver();
  }

  /* ================= 2) PAINEL DO VENDEDOR (Editar) ================= */
  if (window.PVsec && typeof PVsec.editar === "function") {
    var X = null, tent = 0;
    (function ligar() {
      /* espera que o precos-qtd.js e o pedido-minimo.js liguem o Editar primeiro (este fica por fora) */
      if (!window.__bbPrecosQtd && ++tent < 60) { setTimeout(ligar, 200); return; }
      var sync0 = PVsec.sync;
      PVsec.sync = function (x) { X = x; return sync0 ? sync0.apply(this, arguments) : undefined; };
      var editar0 = PVsec.editar;
      PVsec.editar = function (id) {
        var p = X && X.D ? X.D.prods.filter(function (q) { return String(q.id) === String(id); })[0] : null;
        var guardado = null;
        if (p && p.preco_base != null) {
          /* o Editar mostra o preço do fornecedor (sem a taxa) e as faixas sem a taxa */
          guardado = { price: p.price, precos_qtd: p.precos_qtd };
          p.price = p.preco_base;
          if (p.precos_qtd_base !== undefined) p.precos_qtd = p.precos_qtd_base;
        }
        var r;
        try { r = editar0.apply(this, arguments); }
        finally { if (guardado) { p.price = guardado.price; p.precos_qtd = guardado.precos_qtd; } }
        var inp = d.getElementById("eP");
        if (inp && !d.getElementById("bb-tx-e")) {
          lerTaxa().then(function () {
            if (d.getElementById("bb-tx-e")) return;
            var el = linha(inp, null, function () { return p && p.currency ? " " + p.currency : ""; }); el.id = "bb-tx-e";
            var lb = inp.previousElementSibling; if (lb && lb.tagName === "LABEL" && !/sem a taxa/.test(lb.textContent)) lb.textContent = lb.textContent.replace(/\)$/, ") · o seu preço, sem a taxa");
            faixas(d.getElementById("bb-pq"), function () { return Number(String(inp.value).replace(",", ".")) || 0; });
          });
        }
        return r;
      };
    })();
    return;
  }

  /* ================= 1) REGISTAR PRODUTO ================= */
  var precoIn = d.getElementById("preco");
  if (precoIn && precoIn.tagName === "INPUT" && d.getElementById("sv")) {
    lerTaxa().then(function () {
      if (!d.getElementById("bb-tx-r")) { var el = linha(precoIn, null, moedaDe); el.id = "bb-tx-r"; }
      var n = 0;
      (function esperar() {
        var box = d.getElementById("bb-pq");
        if (!box) { if (++n < 100) setTimeout(esperar, 200); return; }
        faixas(box, function () { return Number(String(precoIn.value).replace(",", ".")) || 0; });
      })();
    });
  }
})();
