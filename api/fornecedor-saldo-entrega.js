/* fornecedor-saldo-entrega.js — B-Babilônia: o vendedor não marca "entregue".
   Quem confirma a receção é o cliente, o dono da plataforma ou um agente.
   Prazo de 30 dias depois do envio; no fim o cliente é avisado e tem 3 dias; depois liberta sozinho.
   (19/11/2026) Textos certos por país:
     - Moçambique: o fornecedor recebe por M-Pesa (não por banco/SWIFT) e vê "Meios para receber" no lugar da conta bancária.
     - Moçambique, Tanzânia e África do Sul: o produto é buscado por um agente da BBabilônia (o fornecedor não envia nem põe rastreio).
     - Outros países: igual a antes (conta bancária, SWIFT, envio com rastreio).
   (19/11/2026) Moçambique: o fornecedor NÃO pede levantamento. O dinheiro entra sozinho no M-Pesa quando o atendimento confirma o produto
     (pagar-fornecedor.js trata do pagamento).
   Não altera fornecedor-saldo.js: só troca o botão por um texto e atualiza os textos. */
(function () {
  var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var CHAVE = "sb-dsfoqoeawvjafypycldz-auth-token";
  var PRAZO = {}, pedidos = {};
  var PAIS = null, ESTADO = "", MEIOS = null;      /* null = ainda não sabemos */

  function sessao() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
  function token() { var s = sessao(); return s && s.access_token; }
  function cab() { var t = token(); return { apikey: KEY, Authorization: "Bearer " + (t || KEY), "Content-Type": "application/json" }; }
  function data(d) { try { return new Date(d).toLocaleDateString("pt-PT"); } catch (e) { return ""; } }
  function africa() { return PAIS === "MZ" || PAIS === "TZ" || PAIS === "ZA"; }

  var css = document.createElement("style");
  css.textContent = "[data-ent]{display:none!important}body[data-bbmz] [data-lev]{display:none!important}.bb-esp{display:inline-block;margin-top:6px;font-size:12.5px;line-height:1.35;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:4px 8px}";
  document.head.appendChild(css);

  function texto(id) {
    var p = PRAZO[id];
    if (africa() && (!p || !p.envio)) return "🚚 Um agente da BBabilônia vai buscar o produto à sua loja. Confirme o agente em «Por enviar e Enviados».";
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

  /* ---------- país da loja e meios de receber (só a leitura do que já existe) ---------- */
  async function conhecer() {
    var s = sessao(); if (!s || !s.user) return;
    try {
      var r = await fetch(SUPA + "/rest/v1/lojas?select=pais,estado&dono_id=eq." + encodeURIComponent(s.user.id) + "&limit=1", { headers: cab() });
      var l = r.ok ? await r.json() : [];
      if (!l || !l[0]) return;
      PAIS = String(l[0].pais || "").toUpperCase(); ESTADO = String(l[0].estado || "").toLowerCase();
    } catch (e) { return; }
    if (PAIS === "MZ") {
      try {
        var m = await fetch(SUPA + "/rest/v1/meios_recebimento?select=id&tipo=eq.mpesa&dono_id=eq." + encodeURIComponent(s.user.id), { headers: cab() });
        var j = m.ok ? await m.json() : [];
        MEIOS = Array.isArray(j) ? j.length : 0;
      } catch (e) { MEIOS = 0; }
    }
    if (PAIS === "MZ") document.body.setAttribute("data-bbmz", "1");
    comoFunciona(); contaMZ(); modalMZ(); trocar();
  }

  /* Moçambique: no lugar da conta bancária, o M-Pesa */
  function contaMZ() {
    if (PAIS !== "MZ" || MEIOS == null) return;
    var cx = document.getElementById("contaCx"); if (!cx) return;
    if (ESTADO.indexOf("aprov") !== 0) return;                  /* loja ainda em análise: fica o aviso de antes */
    var h = MEIOS > 0
      ? '<div class="aviso ok" data-bbmz="1">📱 O dinheiro das vendas entra <b>sozinho</b> no seu <b>M-Pesa</b> · <a href="meios-receber.html">Mudar</a></div>'
      : '<div class="aviso er" data-bbmz="1">Para receber o dinheiro, registe o seu M-Pesa. <a href="meios-receber.html"><b>Registar ›</b></a></div>';
    if (!cx.querySelector("[data-bbmz]")) cx.innerHTML = h;
  }
  function modalMZ() {
    var cx = document.getElementById("modalCx"); if (!cx || PAIS !== "MZ") return;
    var av = cx.querySelector(".aviso.az");
    if (av && /SWIFT/.test(av.textContent)) av.textContent = "A BBabilônia verifica o pedido e envia o valor para o seu M-Pesa.";
    cx.querySelectorAll(".dl b").forEach(function (b) {
      if (b.textContent === "Banco" && b.nextElementSibling) { b.textContent = "Receber em"; b.nextElementSibling.textContent = "M-Pesa"; }
    });
  }

  function comoFunciona() {
    if (PAIS == null) return;                                   /* ainda não sabemos o país: não trocar o texto */
    var ps = document.querySelectorAll("#v-forn p.sub");
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].innerHTML.indexOf("Quando a encomenda é entregue") < 0 && ps[i].innerHTML.indexOf("Quando o cliente paga, o valor fica") < 0) continue;
      if (ps[i].getAttribute("data-bbpais") === PAIS) continue;
      var passo2 = africa()
        ? "2. Um agente da BBabilônia vai à sua loja buscar o produto e leva-o à transportadora. O senhor <b>não envia nem regista rastreio</b>: só confirma o agente em «Por enviar e Enviados». O cliente tem <b>30 dias</b> para receber; se ainda não recebeu, pode prolongar 7, 15 ou 30 dias.<br>"
        : "2. Envie o pedido com fotos e número de rastreio. O cliente tem <b>30 dias</b> para receber; se ainda não recebeu, pode prolongar 7, 15 ou 30 dias.<br>";
      var passo4 = PAIS === "MZ"
        ? "4. <b>Não precisa de pedir nada.</b> Logo que o agente de busca confirma a coleta e o atendimento confirma o produto, o valor entra <b>sozinho</b> no seu <b>M-Pesa</b> (registe-o em «Meios para receber»).<br>"
        : "4. Toque em <b>Pedir levantamento</b>. A BBabilônia verifica e transfere para a sua conta bancária confirmada (em USD por SWIFT; o seu banco converte para a moeda local).<br>";
      ps[i].innerHTML = "1. Quando o cliente paga, o valor fica <b>retido</b>.<br>" + passo2 +
        (PAIS === "MZ" ? "3. Quando o atendimento confirma que o produto é igual ao pedido, o valor é <b>pago</b> ao seu M-Pesa.<br>" : "3. O valor passa a <b>disponível</b> quando o cliente confirma que recebeu (ou a BBabilônia confirma). Se o prazo acabar, o cliente é avisado e, sem resposta em 3 dias, o valor fica disponível automaticamente.<br>") +
        passo4 + "5. Pedidos com disputa aberta ficam bloqueados até a disputa terminar.";
      ps[i].setAttribute("data-bbpais", PAIS);
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

  var t = null;
  new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { trocar(); comoFunciona(); contaMZ(); modalMZ(); }, 30); }).observe(document.body, { childList: true, subtree: true });
  trocar(); conhecer();
})();
/* (19/11/2026) pagamento automático do fornecedor de Moçambique (pagar-fornecedor.js) */
(function(){if(document.querySelector("script[src*=\"pagar-fornecedor.js\"]"))return;var s=document.createElement("script");s.src="pagar-fornecedor.js?v=1";(document.head||document.documentElement).appendChild(s)})();
