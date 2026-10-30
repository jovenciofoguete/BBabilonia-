/* pedidos-prazo.js — B-Babilônia: prazo de entrega na página do cliente (pedidos.html).
   Mostra até quando é o prazo (30 dias depois do envio) e deixa prolongar 7, 15 ou 30 dias
   (até 60 dias a mais no total). No fim do prazo avisa: sem resposta em 3 dias, fica entregue.
   Não altera pedidos.html: só acrescenta por baixo do botão "Confirmei a receção". */
(function () {
  if (!window.sb) return;
  var MAX = 60, OPC = [7, 15, 30];
  function data(d) { try { return new Date(d).toLocaleDateString("pt-PT"); } catch (e) { return ""; } }

  var css = document.createElement("style");
  css.textContent = "#bb-prazo{margin-top:10px;font-size:14px;line-height:1.5}" +
    "#bb-prazo .pz{padding:10px 12px;border-radius:12px;background:#ecfeff;border:1px solid #a5f3fc;color:#155e75}" +
    "#bb-prazo .pz.fim{background:#fff1f2;border-color:#fecdd3;color:#9f1239}" +
    "#bb-prazo .op{display:flex;gap:8px;margin-top:8px}" +
    "#bb-prazo .op button{flex:1;min-width:0;padding:11px 4px;border-radius:12px;border:2px solid #0ea5e9;background:#fff;color:#0369a1;font:inherit;font-weight:800}" +
    "#bb-prazo .op button:disabled{opacity:.4}" +
    "#bb-prazo .t{margin-top:10px;font-weight:700}#bb-prazo .m{color:#e11d48;font-size:13.5px;margin-top:6px}";
  document.head.appendChild(css);

  function pedidoAberto() {
    try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; }
  }

  function desenhar() {
    var cf = document.getElementById("conf");
    if (!cf || document.getElementById("bb-prazo")) return;
    var p = pedidoAberto(); if (!p) return;
    var envio = p.shipped_at || p.enviado_em; if (!envio) return;
    var extra = Number(p.prazo_extra || 0), resta = MAX - extra;
    var fim = new Date(new Date(envio).getTime() + (30 + extra) * 864e5), agora = new Date();
    var acabou = fim <= agora;
    var limite = p.aviso_prazo_em ? new Date(new Date(p.aviso_prazo_em).getTime() + 3 * 864e5) : new Date(agora.getTime() + 3 * 864e5);

    // troca a frase antiga "30 dias depois do envio" pela regra certa
    var box = cf.parentNode, spans = box.querySelectorAll(".dl span");
    for (var i = 0; i < spans.length; i++) if (spans[i].textContent.indexOf("confirma-se sozinha") > -1) spans[i].textContent = "Só confirme depois de ter o produto na mão.";

    var h = '<div class="pz' + (acabou ? " fim" : "") + '">' + (acabou
      ? "⏰ <b>O prazo de entrega terminou.</b> Se ainda não recebeu, prolongue a espera ou abra uma disputa. Sem resposta, o pedido será marcado como entregue a <b>" + data(limite) + "</b>."
      : "📅 Prazo de entrega: até <b>" + data(fim) + "</b>" + (extra ? " (já prolongou " + extra + " dias)" : "") + ". Se não confirmar, no fim do prazo recebe um aviso e tem mais 3 dias para responder.") + "</div>";
    if (resta >= OPC[0]) {
      h += '<div class="t">Ainda não recebeu? Prolongar a espera:</div><div class="op">' +
        OPC.map(function (d) { return '<button type="button" data-pz="' + d + '"' + (d > resta ? " disabled" : "") + ">+" + d + " dias</button>"; }).join("") +
        '</div><div class="dl" style="margin-top:6px"><span>Pode prolongar até ' + MAX + " dias no total. Ainda pode: " + resta + " dias.</span></div>";
    } else {
      h += '<div class="dl" style="margin-top:8px"><span>Já prolongou o máximo (' + MAX + ' dias). Se não recebeu, abra uma disputa.</span></div>';
    }
    h += '<div class="m" id="bb-pzm"></div>';
    var d = document.createElement("div"); d.id = "bb-prazo"; d.innerHTML = h;
    cf.insertAdjacentElement("afterend", d);

    d.querySelectorAll("[data-pz]").forEach(function (b) {
      b.onclick = async function () {
        var dias = Number(b.getAttribute("data-pz"));
        if (!confirm("Prolongar a espera deste pedido em " + dias + " dias?")) return;
        d.querySelectorAll("[data-pz]").forEach(function (x) { x.disabled = true; });
        var r = await sb.rpc("prolongar_entrega", { p_pedido: String(p.id), p_dias: dias });
        if (r.error) { document.getElementById("bb-pzm").textContent = r.error.message; d.querySelectorAll("[data-pz]").forEach(function (x) { x.disabled = Number(x.getAttribute("data-pz")) > resta; }); return; }
        var o = await sb.from("orders").select("*").eq("id", p.id).limit(1);
        if (o.data && o.data[0]) { var i2 = window.pedidos.indexOf(p); if (i2 > -1) window.pedidos[i2] = o.data[0]; }
        else { p.prazo_extra = extra + dias; }
        window.abrirDet(p.id, false);
        desenhar();
        var n = document.getElementById("bb-pzm");
        if (n) { n.style.color = "#047857"; n.textContent = "✅ Prazo prolongado até " + data(r.data) + "."; }
      };
    });
  }

  new MutationObserver(desenhar).observe(document.body, { childList: true, subtree: true });
  desenhar();

  // revê os prazos vencidos; se algum pedido mudou, recarrega uma vez
  (async function () {
    try {
      var r = await sb.rpc("libertar_prazos_entrega");
      if (Number(r.data) > 0 && !sessionStorage.getItem("bb-lib")) { sessionStorage.setItem("bb-lib", "1"); location.reload(); return; }
      sessionStorage.removeItem("bb-lib");
    } catch (e) {}
  })();
})();
