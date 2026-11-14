/* painel-admin-apagar.js — B-Babilônia (14/11/2026): separador 🧾 Pedidos do painel do dono, ligado ao fluxo dos agentes.
   - 🗑️ Apagar pedido em cada pedido (dono_apagar_pedido, só o dono).
   - Estados certos: "🚚 A caminho" (não "Enviado") e "📍 Recebido" (não "Entregue"); cancelados mostram o reembolso.
   - Em cada pedido, em que passo está: agente que pegou, confirmação do atendimento, recolha, pagamento do envio, a caminho, receção e avaliação.
   - "Mudar o estado" já não deixa saltar o fluxo: sem "Enviado"/"Entregue" (marca o agente; a receção é com fotos e avaliação)
     e sem "Cancelado" à mão — no lugar há "💸 Cancelar e reembolsar" (verificacao_cancelar_reembolsar, avisa o cliente).
   - Botão "🚚 Ver acompanhamento completo" (fotos, chat com o cliente, provas do pagamento).
   Não altera painel-admin.html: só acrescenta. */
(function () {
  if (window.__bbApagarPed || !window.sb) return; window.__bbApagarPed = 1;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function k(x) { return String(x || "").toLowerCase(); }
  function lista() { try { return window.pedidos || pedidos || []; } catch (e) { return []; } }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }

  var css = document.createElement("style");
  css.textContent = ".bb-apg{margin-top:10px}.bb-apg button{display:block;width:100%;padding:11px;border:0;border-radius:12px;font:inherit;font-size:14px;font-weight:800;color:#fff;background:#475569}" +
    ".bb-apg button:disabled{opacity:.5}.bb-apg small{display:block;margin-top:6px;color:#dc2626;font-size:13px;font-weight:700}" +
    ".bb-fl{margin-top:8px;background:#f8fafc;border-radius:10px;padding:8px 10px;font-size:13.5px;line-height:1.5;color:#334155}" +
    ".bb-fx{margin-top:10px;display:flex;flex-direction:column;gap:8px}.bb-fx a,.bb-fx button{display:block;width:100%;box-sizing:border-box;text-align:center;text-decoration:none;padding:11px;border:0;border-radius:12px;font:inherit;font-size:14px;font-weight:800;color:#fff;background:#2563eb}" +
    ".bb-fx button{background:#ea580c}.bb-fx button:disabled{opacity:.5}.bb-fx small{color:#dc2626;font-size:13px;font-weight:700}";
  document.head.appendChild(css);

  /* ---------- estados certos ---------- */
  try {
    ROT.enviado = "🚚 A caminho"; ROT.recebido = "📍 Recebidos";
    var etqOrig = window.etiqueta;
    window.etiqueta = function (p) {
      var s = k(p.status), e = k(p.escrow_status);
      if (p.disputa_estado) return etqOrig(p);
      if (/cancel/.test(s)) return '<span class="est r">Cancelado</span>' + (/reembolsado/.test(e) ? '<span class="est v">💸 Reembolsado</span>' : /reembolso/.test(e) ? '<span class="est">💸 Reembolso por fazer</span>' : "");
      if (/recebid|entregue|delivered|conclu/.test(s)) return '<span class="est v">📍 Recebido</span>' + (p.avaliado ? '<span class="est v">⭐ Avaliado</span>' : '<span class="est">⭐ Por avaliar</span>');
      if (/enviad|shipped|transito/.test(s)) return '<span class="est a">🚚 A caminho</span>';
      return etqOrig(p);
    };
    if (lista().length && document.querySelector("#olista [data-o]")) try { pintarPedidos(); } catch (e) {}
  } catch (e) {}

  /* ---------- em que passo está cada pedido (dados dos agentes) ---------- */
  var FL = { chave: "", acomp: {}, env: {}, resp: {}, rec: {}, ok: false };
  async function carregarFluxo() {
    var ids = lista().map(function (p) { return p.id; }), chave = ids.join(",");
    if (!ids.length || chave === FL.chave) return; FL.chave = chave;
    var n = { acomp: {}, env: {}, resp: {}, rec: {} };
    try { var a = await sb.rpc("verificacoes_acompanhamento"); (a.data || []).forEach(function (x) { n.acomp[String(x.order_id)] = x; }); } catch (e) {}
    try { var b = await sb.rpc("envio_equipa_lista", { p_orders: ids }); if (b.data) n.env = b.data; } catch (e) {}
    try { var c = await sb.rpc("verificacao_responsaveis", { p_orders: ids }); if (c.data && c.data.pedidos) n.resp = c.data.pedidos; } catch (e) {}
    try { var d = await sb.rpc("rececoes_ver", { p_orders: ids }); if (d.data) n.rec = d.data; } catch (e) {}
    FL.acomp = n.acomp; FL.env = n.env; FL.resp = n.resp; FL.rec = n.rec; FL.ok = true;
    document.querySelectorAll("#olista .bb-fl, #olista .bb-fx").forEach(function (x) { x.remove(); });
    pintar();
  }
  function passo(p) {
    var id = String(p.id), s = k(p.status), env = FL.env[id], ac = FL.acomp[id], r = FL.resp[id], rc = FL.rec[id];
    if (/cancel/.test(s) || !FL.ok) return "";
    if (rc) return "📍 Recebido pelo cliente (" + (rc.local === "estacao" ? "estação BBabilônia" : "transportadora") + ") · confirmado por " + esc(rc.papel === "cliente" ? "o próprio cliente" : (rc.nome || rc.por)) +
      (rc.estrelas ? " · " + "⭐".repeat(rc.estrelas) : " · ⏳ à espera da avaliação do cliente");
    if (env) {
      var t = env.transportadora ? " (" + esc(env.transportadora) + ")" : "";
      if (env.estado === "enviado") return "🚚 A caminho · entregue na transportadora" + t + " · à espera da receção";
      if (env.estado === "pago_confirmado") return "✅ Envio pago e confirmado pelo atendimento · o agente vai entregar na transportadora" + t;
      if (env.estado === "pago_cliente") return "💰 O cliente carregou as provas do pagamento do envio · à espera do atendimento";
      if (env.estado === "aguarda_pagamento") return "📨 Dados de pagamento do envio enviados ao cliente (" + din(env.total != null ? env.total : Number(env.valor_envio || 0) + Number(env.taxa_servico || 0), env.moeda) + ") · à espera do pagamento";
    }
    if (ac) return ac.estado === "recolhido" ? "📦 Recolhido na loja" + (r ? " por " + esc(r.nome || r.email) : "") + " · à espera dos dados de pagamento do envio" :
      "✅ Confirmado pelo atendimento (iguais ao pedido)" + (r ? " · " + esc(r.nome || r.email) + " vai recolher na loja" : "");
    if (/pago|paid/.test(k(p.payment_status)) || /pago/.test(s)) return r ? "👤 Com " + esc(r.nome || r.email) + " · verificação na loja / à espera do atendimento" : "✋ Nenhum agente de busca pegou este pedido";
    return "";
  }
  function podeCancelar(p) {
    var id = String(p.id), s = k(p.status), ac = FL.acomp[id];
    return FL.ok && !/cancel|recebid|entregue|enviad/.test(s) && /pago|paid/.test(k(p.payment_status) + " " + s) && !(ac && ac.estado === "recolhido") && !FL.env[id] && !p.disputa_estado;
  }

  /* ---------- desenhar ---------- */
  function pintar() {
    var caixas = document.querySelectorAll("#olista [data-o]");
    for (var i = 0; i < caixas.length; i++) {
      var c = caixas[i], id = c.getAttribute("data-o"), p = lista().filter(function (x) { return String(x.id) === id; })[0];
      if (!p) continue;
      var it = c.querySelector(".it");
      if (FL.ok && !c.querySelector(".bb-fl")) { var t = passo(p); if (t) { var f = document.createElement("div"); f.className = "bb-fl"; f.innerHTML = t; if (it) it.insertAdjacentElement("afterend", f); else c.appendChild(f); } }
      var sel = c.querySelector("[data-s]");
      if (sel && !sel.getAttribute("data-bb")) {
        sel.setAttribute("data-bb", "1");
        ["enviado", "entregue", "cancelado"].forEach(function (v) { var o = sel.querySelector('option[value="' + v + '"]'); if (o) o.remove(); });
      }
      if (sel && !c.querySelector(".bb-fx")) {
        var x = document.createElement("div"); x.className = "bb-fx";
        x.innerHTML = '<a href="atd-verificacoes.html?f=acompanhamento">🚚 Ver acompanhamento completo (fotos, chat, provas)</a>' +
          (podeCancelar(p) ? '<button type="button" data-cx>💸 Cancelar e reembolsar</button>' : "") + "<small></small>";
        var m = c.querySelector("[data-m]"); if (m) m.insertAdjacentElement("afterend", x); else c.appendChild(x);
        ligarCx(x, p);
      }
      if (!c.querySelector(".bb-apg")) {
        var d = document.createElement("div"); d.className = "bb-apg";
        d.innerHTML = '<button type="button">🗑️ Apagar pedido</button><small></small>';
        c.appendChild(d);
        ligar(d, id);
      }
    }
    carregarFluxo();
  }
  function ligarCx(x, p) {
    var b = x.querySelector("[data-cx]"), er = x.querySelector("small"); if (!b) return;
    b.onclick = async function () {
      var mot = prompt("Motivo do cancelamento (o cliente vai ver):", "Produto não disponível na loja.");
      if (!mot) return;
      if (!confirm("Cancelar o pedido " + String(p.id).slice(0, 8).toUpperCase() + " e reembolsar o cliente?")) return;
      b.disabled = true; er.textContent = "";
      var r = await sb.rpc("verificacao_cancelar_reembolsar", { p_order: p.id, p_motivo: mot });
      if (r.error) { b.disabled = false; er.textContent = r.error.message; return; }
      p.status = "cancelado"; p.escrow_status = "reembolso_pendente";
      try { pintarPedidos(); } catch (e) { b.textContent = "💸 Cancelado"; }
    };
  }
  function ligar(d, id) {
    var b = d.querySelector("button"), er = d.querySelector("small");
    b.onclick = async function () {
      if (!confirm("APAGAR o pedido " + String(id).slice(0, 8).toUpperCase() + " e tudo o que está ligado a ele (verificação, chat, envio, disputa)?\nNão dá para desfazer.")) return;
      b.disabled = true; er.textContent = "";
      var r = await sb.rpc("dono_apagar_pedido", { p_order: id });
      if (r.error) { b.disabled = false; er.textContent = r.error.message; return; }
      var l = lista();
      for (var j = l.length - 1; j >= 0; j--) if (String(l[j].id) === String(id)) l.splice(j, 1);
      try { pintarPedidos(); } catch (e) { var c = d.closest("[data-o]"); if (c) c.remove(); }
    };
  }
  new MutationObserver(pintar).observe(document.body, { childList: true, subtree: true });
  pintar();
})();
