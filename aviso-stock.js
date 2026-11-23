/* aviso-stock.js — BBabilônia (23/11/2026)
   Carregado pelo carrinho.html. Não altera o resto do carrinho.
   1) Em cada produto do carrinho: botão "💬 Chat — consultar stock" que abre o chat da loja
      (com o filtro anti-contactos) já com o produto (foto, preço e link) no início da conversa.
   2) Ao tocar em "Finalizar compra": aviso vermelho com contagem de 7 segundos;
      o OK só fica ativo no fim da contagem; depois do OK segue para o pagamento. */
(function () {
  if (window.__bbAvisoStock) return; window.__bbAvisoStock = 1;
  var d = document;
  if (!d.getElementById("lista") || !d.getElementById("rodape") || typeof window.desenhar !== "function") return;
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var SEG = 7, VEND = {}, pedidos = {};

  var css = d.createElement("style");
  css.textContent =
    ".item{position:relative}" +
    ".bb-chat{flex:none;align-self:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:74px;padding:8px 4px;border:1.5px solid #0ea5e9;border-radius:10px;background:#f0f9ff;color:#0369a1;font:700 13px Arial,sans-serif;line-height:1.1;text-align:center}" +
    ".bb-chat i{font-style:normal;font-size:20px}" +
    ".bb-chat small{font:600 10.5px Arial,sans-serif;color:#0c4a6e}" +
    ".bb-chat:disabled{opacity:.5}" +
    "#bb-av{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:18px}" +
    "#bb-av .cx{width:100%;max-width:420px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px #0007;border:3px solid #dc2626}" +
    "#bb-av .tp{background:#dc2626;color:#fff;padding:12px 16px;font:800 18px Arial,sans-serif;display:flex;align-items:center;gap:8px}" +
    "#bb-av .tx{padding:16px;color:#7f1d1d;font:600 15.5px/1.45 Arial,sans-serif;background:#fef2f2}" +
    "#bb-av .tx b{color:#b91c1c}" +
    "#bb-av .bx{display:flex;align-items:center;gap:12px;padding:12px 16px 16px;background:#fef2f2}" +
    "#bb-av .ct{flex:none;width:52px;height:52px;border-radius:50%;border:4px solid #dc2626;color:#dc2626;display:flex;align-items:center;justify-content:center;font:800 22px Arial,sans-serif;background:#fff}" +
    "#bb-av .ok{flex:1;height:52px;border:0;border-radius:12px;background:#dc2626;color:#fff;font:800 18px Arial,sans-serif}" +
    "#bb-av .ok:disabled{background:#d1d5db;color:#6b7280}";
  d.head.appendChild(css);

  function lista() {
    try { if (typeof itens !== "undefined" && Array.isArray(itens)) return itens; } catch (e) {}
    try { var r = JSON.parse(localStorage.getItem("carrinho") || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  }
  function idI(i) { return (i && (i.id || i.produto_id || i.product_id)) || ""; }

  /* vendedor (fornecedor) de cada produto */
  function buscarVendedores(ids) {
    var falta = ids.filter(function (k) { return !(k in VEND) && !pedidos[k]; });
    if (!falta.length) return;
    falta.forEach(function (k) { pedidos[k] = 1; });
    fetch(SUPA + "/rest/v1/products?select=id,supplier_id&id=in.(" + falta.join(",") + ")", { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) { (a || []).forEach(function (p) { VEND[p.id] = p.supplier_id || ""; }); falta.forEach(function (k) { if (!(k in VEND)) VEND[k] = ""; }); })
      .catch(function () { falta.forEach(function (k) { delete pedidos[k]; }); });
  }

  function abrirChat(i, b) {
    var id = idI(i);
    if (!id) return;
    var v = VEND[id];
    if (v === undefined) { b.disabled = true; buscarVendedores([id]); setTimeout(function () { b.disabled = false; abrirChat(i, b); }, 900); return; }
    if (!v) { alert("Não foi possível encontrar o fornecedor deste produto."); return; }
    location.href = "chat-novo2.html?vendedor=" + encodeURIComponent(v) + "&produto=" + encodeURIComponent(id) +
      "&assunto=" + encodeURIComponent("Stock: " + (i.nome || i.name || "Produto")) + "&auto=1";
  }

  function poeBotoes() {
    var its = lista(), els = d.querySelectorAll("#lista .item");
    buscarVendedores(its.map(idI).filter(Boolean).filter(function (x, n, a) { return a.indexOf(x) === n; }));
    Array.prototype.forEach.call(els, function (el, n) {
      if (el.querySelector(".bb-chat") || !its[n]) return;
      var b = d.createElement("button"); b.type = "button"; b.className = "bb-chat";
      b.innerHTML = "<i>💬</i>Chat<small>consultar stock</small>";
      b.onclick = function () { abrirChat(its[n], b); };
      el.appendChild(b);
    });
  }
  var desenhar0 = window.desenhar;
  window.desenhar = function () { var r = desenhar0.apply(this, arguments); try { poeBotoes(); } catch (e) {} return r; };
  poeBotoes();

  /* aviso vermelho de 7 segundos antes de pagar */
  function aviso(seguir) {
    if (d.getElementById("bb-av")) return;
    var w = d.createElement("div"); w.id = "bb-av";
    w.innerHTML = '<div class="cx" role="alertdialog" aria-modal="true">' +
      '<div class="tp">⚠️ Atenção antes de pagar</div>' +
      '<div class="tx">Consulte primeiro com o fornecedor se este produto está em stock antes de pagar.<br><br>' +
      '<b>A BBabilônia não faz devoluções por falta de stock.</b><br><br>' +
      'Se pagar sem consultar e se não houver stock, será obrigado a escolher outro produto disponível na loja.</div>' +
      '<div class="bx"><div class="ct">' + SEG + '</div><button type="button" class="ok" disabled>OK</button></div></div>';
    d.body.appendChild(w);
    var ct = w.querySelector(".ct"), ok = w.querySelector(".ok"), n = SEG;
    var t = setInterval(function () {
      n--; ct.textContent = n > 0 ? n : "✓";
      if (n <= 0) { clearInterval(t); ok.disabled = false; ok.focus(); }
    }, 1000);
    ok.onclick = function () { if (ok.disabled) return; w.remove(); seguir(); };
  }
  d.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("#btn") : null;
    if (!b || b.disabled) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    aviso(function () { location.href = "finalizar.html"; });
  }, true);
})();
