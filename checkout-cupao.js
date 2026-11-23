/* checkout-cupao.js — BBabilônia (23/11/2026) · checkout.html
   1) A linha "Taxa da plataforma: 0" deixa de aparecer (cartão e M-Pesa).
   2) Gateway sem divisas (cripto). Exemplo: fornecedor 1000, taxa no preço 6%, taxa da plataforma 5%, rede USDT BNB 1% + 0,6 USD:
        Preço total: 1060 (riscado)
        🎟️ Cupão BBabilônia −6%: −60          (tira a taxa somada ao preço)
        Taxa da plataforma (5% de 1000): +50    (como no cartão e no M-Pesa)
        Taxa da rede USDT (BNB): 1% + 0,6 USD   (tabela taxas_cripto, com o câmbio do dia)
        A pagar: 1000 + 50 + taxa da rede
      A rede escolhe-se dentro da caixa e passa sozinha para a lista "Moeda cripto e rede" do passo seguinte.
   O servidor calcula o preço sem a taxa e a taxa da plataforma (bb_carrinho_cupao). */
(function () {
  if (window.__bbCupao) return; window.__bbCupao = 1;
  var d = document;
  function $(i) { return d.getElementById(i); }
  function num(v) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var TAXA0 = /<br\s*\/?>\s*Taxa da plataforma:\s*0(?:[.,]0+)?\s*[A-Za-z]*(?=\s*<)/i;
  function limpar(el) { if (el && TAXA0.test(el.innerHTML)) el.innerHTML = el.innerHTML.replace(TAXA0, ""); }
  new MutationObserver(function () { limpar($("taxas")); limpar($("bb-mpx")); }).observe(d.body, { childList: true, subtree: true, characterData: true });

  var css = d.createElement("style");
  css.textContent = "#bb-cupao{margin:12px 0 0;padding:12px;border-radius:12px;border:2px dashed #10b981;background:#052e1f;color:#d1fae5;font-size:14.5px;line-height:1.7}" +
    "#bb-cupao .c{color:#6ee7b7;font-weight:800}#bb-cupao .t{font-size:17px;font-weight:800;color:#fff}#bb-cupao s{opacity:.7}" +
    "#bb-cupao select{width:100%;margin:6px 0 4px;padding:10px;border-radius:8px;border:1px solid #10b981;background:#0b3d2a;color:#fff;font-size:15px}";
  d.head.appendChild(css);
  var CUP = null, pedido = false, REDES = null, USD = null, REDE = "";
  function itens() { try { var c = JSON.parse(localStorage.getItem("carrinho") || "[]"); return Array.isArray(c) ? c.map(function (i) { return { id: i.id || i.produto_id || i.product_id, qtd: i.qtd || 1 }; }) : []; } catch (e) { return []; } }
  function metodo() { var r = d.querySelector("input[name=m]:checked"); return r ? r.value : ""; }
  async function buscar() {
    if (CUP || pedido || typeof sb === "undefined") return CUP;
    pedido = true;
    try {
      var r = await sb.rpc("bb_carrinho_cupao", { p_itens: itens() }); if (!r.error && r.data && !r.data.erro) CUP = r.data;
      if (!REDES) { var q = await sb.from("taxas_cripto").select("codigo,nome,destino,percentual,fixo_usd").eq("ativo", true).order("nome"); REDES = (q && q.data) || []; }
      if (USD === null) {   /* câmbio do dia (quantas unidades da moeda por 1 USD) */
        try { var x = await fetch("https://open.er-api.com/v6/latest/USD"); var j = await x.json(); USD = (j && j.rates) || {}; } catch (e) { USD = {}; }
      }
    } catch (e) {}
    pedido = false; return CUP;
  }
  function porUsd(m) { m = String(m || "MZN").toUpperCase(); if (m === "USD") return 1; return Number(USD && USD[m]) || (m === "MZN" ? 64 : 1); }
  function conta(c) {
    var m = c.moeda || "MZN", sub = Number(c.a_pagar != null ? c.a_pagar : c.sem_taxa) || 0;
    var r = (REDES || []).filter(function (x) { return x.codigo === REDE; })[0] || (REDES || [])[0] || null;
    var pct = r ? Number(r.percentual) || 0 : 0, fixo = r ? Number(r.fixo_usd) || 0 : 0;
    var rede = Math.round((sub * pct / 100 + fixo * porUsd(m)) * 100) / 100;
    return { m: m, sub: sub, r: r, pct: pct, fixo: fixo, rede: rede, total: Math.ceil(sub + rede) };
  }
  function html(c) {
    var k = conta(c), m = k.m;
    return "Preço total: <s>" + num(c.total) + " " + m + "</s><br>" +
      '<span class="c">🎟️ Cupão BBabilônia −' + num(c.pct) + "%: −" + num(c.desconto) + " " + m + "</span><br>" +
      (c.taxa_pagamento != null ? "Taxa da plataforma (" + num(c.pct_pagamento) + "% de " + num(c.sem_taxa) + "): +" + num(c.taxa_pagamento) + " " + m + "<br>" : "") +
      (REDES && REDES.length ? '<select class="bb-rede">' + REDES.map(function (x) {
        return '<option value="' + esc(x.codigo) + '"' + (k.r && x.codigo === k.r.codigo ? " selected" : "") + ">" + esc(x.nome) + " · " + num(x.percentual) + "% + " + num(x.fixo_usd) + " USD</option>";
      }).join("") + "</select>" : "") +
      (k.r ? "Taxa da rede " + esc(k.r.nome) + " (" + num(k.pct) + "% + " + num(k.fixo) + " USD): +" + num(k.rede) + " " + m + "<br>" : "") +
      '<span class="t">A pagar pelo gateway sem divisas: ' + num(k.total) + " " + m + "</span>";
  }
  function caixa(id, depois) {
    var bx = $(id);
    if (!bx && depois) { bx = d.createElement("div"); bx.id = id; depois.insertAdjacentElement("afterend", bx); }
    return bx;
  }
  async function mostrar() {
    var b1 = $("bb-cupao");
    if (metodo() !== "cripto") { if (b1) b1.remove(); var b2 = $("bb-cupao2"); if (b2) b2.remove(); return; }
    var c = await buscar(); if (!c || metodo() !== "cripto") return;
    var mc = $("mc");
    if (mc && REDE && mc.value !== REDE && Array.prototype.some.call(mc.options, function (o) { return o.value === REDE; })) { mc.value = REDE; mc.dispatchEvent(new Event("change", { bubbles: true })); }
    else if (mc && mc.value && !REDE) REDE = mc.value;
    var dados = $("dados"), pag = $("pag");
    if (dados && !dados.hidden) { var bx = caixa("bb-cupao", d.querySelector(".op")); por(bx, html(c)); }
    if (pag && !pag.hidden && $("cripto-sel") && !$("cripto-sel").hidden) por(caixa("bb-cupao2", $("cripto-sel")), html(c));
  }
  function por(el, h) { if (el && el.__h !== h) { el.innerHTML = h; el.__h = h; } }   /* só redesenha se mudou (não fecha a lista aberta) */
  /* a caixa do passo seguinte usa o mesmo aspeto */
  var css2 = d.createElement("style"); css2.textContent = css.textContent.replace(/#bb-cupao/g, "#bb-cupao2"); d.head.appendChild(css2);
  d.addEventListener("change", function (e) {
    var t = e.target; if (!t) return;
    if (t.classList && t.classList.contains("bb-rede")) {
      REDE = t.value; var mc = $("mc");
      if (mc && Array.prototype.some.call(mc.options, function (o) { return o.value === REDE; })) { mc.value = REDE; mc.dispatchEvent(new Event("change", { bubbles: true })); }
      mostrar(); return;
    }
    if (t.id === "mc") { REDE = t.value; mostrar(); return; }
    if (t.name === "m") mostrar();
  });
  d.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest("select")) return; setTimeout(mostrar, 0); });
  setInterval(function () { if (metodo() === "cripto") mostrar(); }, 1500);
  setTimeout(mostrar, 500);
})();
