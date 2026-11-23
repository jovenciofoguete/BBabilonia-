/* checkout-cupao.js — BBabilônia (23/11/2026) · checkout.html
   1) O cliente vê um só valor: a taxa da plataforma já está dentro do preço dos produtos,
      por isso a linha "Taxa da plataforma: 0" deixa de aparecer (cartão e M-Pesa).
   2) Gateway sem divisas (cripto): aparece o preço total e, por baixo, "🎟️ Cupão BBabilônia −6%"
      (a taxa em vigor) e o valor a pagar sem a taxa. O servidor calcula (bb_carrinho_cupao, TAXA.sql).
   Não altera o resto do checkout. */
(function () {
  if (window.__bbCupao) return; window.__bbCupao = 1;
  var d = document;
  function $(i) { return d.getElementById(i); }
  function num(v) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }); }
  var TAXA0 = /<br\s*\/?>\s*Taxa da plataforma:\s*0(?:[.,]0+)?\s*[A-Za-z]*(?=\s*<)/i;
  function limpar(el) { if (el && TAXA0.test(el.innerHTML)) el.innerHTML = el.innerHTML.replace(TAXA0, ""); }
  new MutationObserver(function () { limpar($("taxas")); limpar($("bb-mpx")); }).observe(d.body, { childList: true, subtree: true, characterData: true });

  var css = d.createElement("style");
  css.textContent = "#bb-cupao{margin:12px 0 0;padding:12px;border-radius:12px;border:2px dashed #10b981;background:#052e1f;color:#d1fae5;font-size:14.5px;line-height:1.7}" +
    "#bb-cupao .c{color:#6ee7b7;font-weight:800}#bb-cupao .t{font-size:17px;font-weight:800;color:#fff}#bb-cupao s{opacity:.7}";
  d.head.appendChild(css);
  var CUP = null, pedido = false;
  function itens() { try { var c = JSON.parse(localStorage.getItem("carrinho") || "[]"); return Array.isArray(c) ? c.map(function (i) { return { id: i.id || i.produto_id || i.product_id, qtd: i.qtd || 1 }; }) : []; } catch (e) { return []; } }
  function metodo() { var r = d.querySelector("input[name=m]:checked"); return r ? r.value : ""; }
  async function buscar() {
    if (CUP || pedido || typeof sb === "undefined") return CUP;
    pedido = true;
    try { var r = await sb.rpc("bb_carrinho_cupao", { p_itens: itens() }); if (!r.error && r.data && !r.data.erro) CUP = r.data; } catch (e) {}
    pedido = false; return CUP;
  }
  async function mostrar() {
    var bx = $("bb-cupao");
    if (metodo() !== "cripto") { if (bx) bx.remove(); return; }
    var c = await buscar(); if (!c || metodo() !== "cripto") return;
    if (!bx) {
      bx = d.createElement("div"); bx.id = "bb-cupao";
      var op = d.querySelector(".op"); if (!op) return;
      op.insertAdjacentElement("afterend", bx);
    }
    var m = c.moeda || "MZN";
    bx.innerHTML = "Preço total: <s>" + num(c.total) + " " + m + "</s><br>" +
      '<span class="c">🎟️ Cupão BBabilônia −' + num(c.pct) + "%: −" + num(c.desconto) + " " + m + "</span><br>" +
      '<span class="t">A pagar pelo gateway sem divisas: ' + num(c.sem_taxa) + " " + m + "</span>";
  }
  d.addEventListener("change", function (e) { if (e.target && e.target.name === "m") mostrar(); });
  d.addEventListener("click", function () { setTimeout(mostrar, 0); });
  setTimeout(mostrar, 500);
})();
