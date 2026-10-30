/* fornecedor-saldo-entrega.js — B-Babilônia: o vendedor não marca "entregue".
   Quem confirma a receção é o cliente, o dono da plataforma ou um agente.
   Prazo de 30 dias depois do envio; no fim o cliente é avisado e tem 3 dias; depois liberta sozinho.
   Não altera fornecedor-saldo.js: só troca o botão por um texto e atualiza o "Como funciona". */
(function () {
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var CHAVE = "sb-dsfoqoeawvjafypycldz-auth-token";
  var PRAZO = {}, pedidos = {};

  function token() { try { var s = JSON.parse(localStorage.getItem(CHAVE) || "null"); return s && s.access_token; } catch (e) { return null; } }
  function cab() { var t = token(); return { apikey: KEY, Authorization: "Bearer " + (t || KEY), "Content-Type": "application/json" }; }
  function data(d) { try { return new Date(d).toLocaleDateString("pt-PT"); } catch (e) { return ""; } }

  var css = document.createElement("style");
  css.textContent = "[data-ent]{display:none!important}.bb-esp{display:inline-block;margin-top:6px;font-size:12.5px;line-height:1.35;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:4px 8px}";
  document.head.appendChild(css);

  function texto(id) {
    var p = PRAZO[id];
    if (!p) return "⏳ Aguarda o cliente confirmar a receção";
    if (!p.envio) return "📦 Envie o pedido e registe o rastreio. O prazo de entrega (30 dias) começa no envio.";
    var fim = new Date(p.fim);
    if (fim > new Date()) return "⏳ Aguarda o cliente confirmar · prazo até " + data(fim) + (p.extra ? " (cliente prolongou " + p.extra + " dias)" : "");
    return "⏰ Prazo terminou: o cliente foi avisado. Sem resposta em 3 dias, o valor fica disponível.";
  }

  function trocar() {
    var bs = document.querySelectorAll("[data-ent]"), falta = [];
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i], id = b.getAttribute("data-ent"), cx = b.parentNode;
      var sp = cx.querySelector(".bb-esp");
      if (!sp) { sp = document.createElement("span"); sp.className = "bb-esp"; cx.appendChild(sp); }
      var tx = texto(id); if (sp.textContent !== tx) sp.textContent = tx;
      if (!(id in PRAZO) && !pedidos[id]) falta.push(id);
    }
    if (falta.length) buscar(falta);
  }

  async function buscar(ids) {
    ids.forEach(function (i) { pedidos[i] = 1; });
    try {
      var r = await fetch(SUPA + "/rest/v1/orders?select=id,shipped_at,enviado_em,prazo_extra&id=in.(" + ids.map(encodeURIComponent).join(",") + ")", { headers: cab() });
      if (!r.ok) return;
      (await r.json()).forEach(function (o) {
        var envio = o.shipped_at || o.enviado_em, extra = Number(o.prazo_extra || 0);
        PRAZO[o.id] = { envio: envio, extra: extra, fim: envio ? new Date(new Date(envio).getTime() + (30 + extra) * 864e5) : null };
      });
      trocar();
    } catch (e) {}
  }

  function comoFunciona() {
    var ps = document.querySelectorAll("#v-forn p.sub");
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].innerHTML.indexOf("Quando a encomenda é entregue") < 0) continue;
      ps[i].innerHTML = "1. Quando o cliente paga, o valor fica <b>retido</b>.<br>" +
        "2. Envie o pedido com fotos e número de rastreio. O cliente tem <b>30 dias</b> para receber; se ainda não recebeu, pode prolongar 7, 15 ou 30 dias.<br>" +
        "3. O valor passa a <b>disponível</b> quando o cliente confirma que recebeu (ou a BBabilônia confirma). Se o prazo acabar, o cliente é avisado e, sem resposta em 3 dias, o valor fica disponível automaticamente.<br>" +
        "4. Toque em <b>Pedir levantamento</b>. A BBabilônia verifica e transfere para a sua conta bancária confirmada (em USD por SWIFT; o seu banco converte para a moeda local).<br>" +
        "5. Pedidos com disputa aberta ficam bloqueados até a disputa terminar.";
    }
  }

  // corre a revisão dos prazos; se libertou algum pedido, recarrega uma vez para mostrar o saldo certo
  (async function () {
    try {
      var r = await fetch(SUPA + "/rest/v1/rpc/libertar_prazos_entrega", { method: "POST", headers: cab(), body: "{}" });
      var n = r.ok ? Number(await r.json()) : 0;
      if (n > 0 && !sessionStorage.getItem("bb-lib")) { sessionStorage.setItem("bb-lib", "1"); location.reload(); return; }
      sessionStorage.removeItem("bb-lib");
    } catch (e) {}
  })();

  new MutationObserver(function () { trocar(); comoFunciona(); }).observe(document.body, { childList: true, subtree: true });
  trocar(); comoFunciona();
})();
