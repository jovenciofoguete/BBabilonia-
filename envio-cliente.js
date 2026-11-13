/* envio-cliente.js — B-Babilônia (13/11/2026)
   Página "Os meus pedidos" (pedidos.html), no detalhe do pedido pago:
   - depois de o agente recolher a mercadoria: "Mercadoria no processo de envio. Aguarde a cotação…";
   - chat do envio dentro do pedido, entre o cliente e o agente BBabilônia;
   - o agente manda no chat os dados de pagamento do transporte; o cliente vê-os no chat, com o texto
     "Pagar o valor de transporte e taxas através destes dados e carregar provas após pagamento.";
   - "Carregar provas de pagamento": foto do comprovativo e, por baixo, o texto da transferência.
   O produto paga-se dentro da plataforma; só o transporte é transferido fora.
   (13/11/2026) Correção: no modo escuro do telemóvel o texto do chat ficava branco sobre fundo branco (invisível);
   agora o chat e as caixas brancas têm sempre texto escuro.
   (13/11/2026) "O seu produto já foi coletado pela BBabilônia", taxa fixa de busca e embalagem (200 MT) e pagamento
   por levantamento no agente M-Pesa / e-Mola (número e nome do agente, com os passos).
   O agente nunca vai ao cliente: o cliente recebe pela transportadora (sem código de entrega). */
(function () {
  if (window.__bbEnvioCli || !window.sb) return; window.__bbEnvioCli = 1;
  var sb = window.sb, d = document;
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function quando(t) { try { return new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }

  var css = d.createElement("style");
  css.textContent =
    "#bb-envio h3{margin:0 0 8px}#bb-envio .av{padding:12px;border-radius:12px;font-size:14.5px;line-height:1.5;margin-bottom:8px}" +
    "#bb-envio .av.a{background:#fffbeb;border:1px solid #fde68a;color:#92400e}#bb-envio .av.z{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a}" +
    "#bb-envio .av.v{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}#bb-envio .av.r{background:#fff1f2;border:1px solid #fecdd3;color:#9f1239}" +
    "#bb-envio .nv{display:block;padding:10px 12px;border-radius:12px;background:#fef3c7;color:#92400e;font-weight:800;font-size:14.5px;margin-bottom:8px}" +
    "#bb-envio .bt{display:block;width:100%;border:0;border-radius:12px;padding:14px;margin-top:8px;font:inherit;font-size:16px;font-weight:800;color:#fff;background:linear-gradient(90deg,#16a34a,#0ea5e9)}" +
    "#bb-envio .bt.l{background:#fff;color:#0369a1;border:2px solid #bae6fd}#bb-envio .bt:disabled{opacity:.5}" +
    "#bb-envio .ch{margin-top:10px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;padding:10px}" +
    "#bb-envio .ms{max-height:420px;overflow:auto;display:flex;flex-direction:column;gap:8px}" +
    "#bb-envio .b{max-width:86%;padding:9px 12px;border-radius:14px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;word-break:break-word}" +
    "#bb-envio .b.eu{align-self:flex-end;background:#dcfce7;color:#14532d}#bb-envio .b.ou{align-self:flex-start;background:#fff;border:1px solid #e2e8f0}" +
    "#bb-envio .b small{display:block;font-size:11.5px;color:#64748b;margin-top:3px}#bb-envio .b .nm{font-weight:800;font-size:12.5px;color:#0369a1;display:block}" +
    "#bb-envio .sis{align-self:center;font-size:13px;color:#475569;background:#e2e8f0;border-radius:10px;padding:6px 10px;text-align:center}" +
    "#bb-envio .dp{align-self:stretch;background:#fff;border:2px solid #16a34a;border-radius:14px;padding:12px;font-size:14.5px}" +
    "#bb-envio .tt{display:flex;justify-content:space-between;padding:3px 0}#bb-envio .tt.g{font-weight:800;font-size:16px;border-top:1px solid #e2e8f0;margin-top:4px;padding-top:7px}" +
    "#bb-envio .nr{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;margin-top:7px}" +
    "#bb-envio .nr b{font-size:16.5px;letter-spacing:.5px}#bb-envio .nr button{border:0;border-radius:10px;padding:8px 10px;font:inherit;font-weight:800;font-size:13px;background:#e0f2fe;color:#0369a1}" +
    "#bb-envio .ins{margin-top:10px;font-weight:700;color:#065f46;font-size:14px;line-height:1.45}" +
    "#bb-envio .fts{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#bb-envio .fts img{width:78px;height:78px;object-fit:cover;border-radius:10px}" +
    "#bb-envio .es{display:flex;gap:6px;margin-top:10px}#bb-envio .es input{flex:1;min-width:0;padding:11px;border:2px solid #e2e8f0;border-radius:12px;font:inherit;font-size:15px}" +
    "#bb-envio .es button{border:0;border-radius:12px;padding:0 14px;font:inherit;font-weight:800;background:#0ea5e9;color:#fff}" +
    "#bb-envio .pv{margin-top:10px;border:2px solid #16a34a;border-radius:14px;padding:12px;background:#fff}#bb-envio .pv h4{margin:0 0 4px;font-size:15.5px}" +
    "#bb-envio .meios{display:flex;gap:8px;margin:8px 0 4px}#bb-envio .meios label{flex:1;text-align:center;padding:10px 4px;border:2px solid #e2e8f0;border-radius:12px;font-weight:800;font-size:14px}" +
    "#bb-envio .meios input{display:none}#bb-envio .meios label.on{border-color:#16a34a;background:#f0fdf4;color:#065f46}" +
    "#bb-envio .up{display:block;text-align:center;border:2px dashed #16a34a;border-radius:12px;padding:14px 6px;font-weight:800;font-size:15px;color:#065f46;background:#f0fdf4;margin-top:8px}" +
    "#bb-envio .up input{display:none}#bb-envio textarea{width:100%;box-sizing:border-box;min-height:86px;margin-top:8px;padding:10px;border:2px solid #e2e8f0;border-radius:12px;font:inherit;font-size:14.5px}" +
    "#bb-envio .m{color:#e11d48;font-size:14px;margin-top:8px;white-space:pre-line}#bb-envio .pq{font-size:13px;color:#64748b;margin-top:6px}" +
    /* modo escuro: o chat e as caixas brancas ficam sempre com texto escuro (antes o texto ficava branco e não se via) */
    "#bb-envio .ch,#bb-envio .dp,#bb-envio .pv,#bb-envio .nr,#bb-envio .b.ou{color:#0f172a}" +
    "#bb-envio .es input,#bb-envio textarea{background:#fff;color:#0f172a}#bb-envio .es input::placeholder,#bb-envio textarea::placeholder{color:#94a3b8}";
  d.head.appendChild(css);

  var aCarregar = null, EST = null, PED = null, aberto = false, relogio = null;
  function pedidoAberto() {
    try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; }
  }
  async function assinada(c) { try { var r = await sb.storage.from("provas-envio").createSignedUrl(c, 3600); return r.data && r.data.signedUrl; } catch (e) { return null; } }

  /* uma mensagem do chat */
  function msg(m, ultimoDados) {
    var t = esc(quando(m.criado_em));
    if (m.tipo === "aviso") return '<div class="sis">' + esc(m.texto) + "<br><small>" + t + "</small></div>";
    if (m.tipo === "dados_pagamento") {
      var x = m.dados || {}, c = EST && EST.cotacao, podeCarregar = m.id === ultimoDados && c && c.estado === "aguarda_pagamento";
      return '<div class="dp"><b>🚚 Dados de pagamento do transporte</b>' +
        '<div class="tt" style="margin-top:6px"><span>Envio (' + esc(x.transportadora || "transportadora") + ')</span><span>' + din(x.valor_envio, x.moeda) + "</span></div>" +
        '<div class="tt"><span>Taxa fixa de busca e embalagem</span><span>' + din(x.taxa_servico, x.moeda) + "</span></div>" +
        '<div class="tt g"><span>Total a pagar</span><span>' + din(x.total, x.moeda) + "</span></div>" +
        (x.mpesa_numero ? '<div class="nr"><span>🟥 Agente M-Pesa (levantamento)<br><b>' + esc(x.mpesa_numero) + '</b></span><button type="button" data-cp="' + esc(x.mpesa_numero) + '">Copiar</button></div>' +
          '<div class="pq">M-Pesa: abra o menu M-Pesa → <b>Levantar dinheiro</b> → <b>Agente</b> → escreva o número do agente acima, o valor total e o seu PIN.</div>' : "") +
        (x.emola_numero ? '<div class="nr"><span>🟧 Agente e-Mola (levantamento)<br><b>' + esc(x.emola_numero) + '</b></span><button type="button" data-cp="' + esc(x.emola_numero) + '">Copiar</button></div>' +
          '<div class="pq">e-Mola: abra o menu e-Mola → <b>Levantar dinheiro</b> → <b>Agente</b> → escreva o número do agente acima, o valor total e o seu PIN.</div>' : "") +
        '<div class="nr"><span>Nome do agente<br><b>' + esc(x.nome_recetor || "") + "</b></span></div>" +
        '<div class="ins">Pagar o valor de transporte e taxas através destes dados e carregar provas após pagamento.</div>' +
        (podeCarregar ? '<button class="bt" type="button" data-prov="1">📤 Carregar provas de pagamento</button>' : "") +
        "<small style=\"display:block;color:#64748b;margin-top:6px\">" + t + "</small></div>";
    }
    var eu = m.autor === "cliente";
    if (m.tipo === "provas") {
      var f = ((m.dados || {}).fotos || []);
      return '<div class="b eu"><b>📤 Provas de pagamento</b> (' + ((m.dados || {}).meio === "emola" ? "e-Mola" : "M-Pesa") + ')<div class="fts" data-fotos="' + esc(JSON.stringify(f)) + '"></div>' + esc(m.texto) + "<small>" + t + "</small></div>";
    }
    return '<div class="b ' + (eu ? "eu" : "ou") + '">' + (eu ? "" : '<span class="nm">' + esc(m.nome || "Agente BBabilônia") + "</span>") + esc(m.texto) + "<small>" + t + "</small></div>";
  }

  async function carregarChat() {
    var ms = $("bb-env-ms"); if (!ms || !PED) return;
    var r = await sb.rpc("envio_chat_ver", { p_order: String(PED.id) });
    if (r.error) { ms.innerHTML = '<div class="sis">' + esc(r.error.message) + "</div>"; return; }
    var L = r.data || [], ult = null;
    L.forEach(function (m) { if (m.tipo === "dados_pagamento") ult = m.id; });
    var abaixo = ms.scrollHeight - ms.scrollTop - ms.clientHeight < 40;
    ms.innerHTML = L.length ? L.map(function (m) { return msg(m, ult); }).join("") : '<div class="sis">Ainda não há mensagens. O agente BBabilônia vai mandar aqui os dados de pagamento do transporte.</div>';
    if (abaixo || !ms.getAttribute("data-v")) { ms.scrollTop = ms.scrollHeight; ms.setAttribute("data-v", "1"); }
    ms.querySelectorAll("[data-cp]").forEach(function (b) {
      b.onclick = function () { var t = b.getAttribute("data-cp"); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = "Copiado ✓"; }).catch(function () { prompt("Copie o número:", t); }); };
    });
    ms.querySelectorAll("[data-fotos]").forEach(async function (bx) {
      var l = []; try { l = JSON.parse(bx.getAttribute("data-fotos")) || []; } catch (e) {}
      for (var i = 0; i < l.length; i++) { var u = await assinada(l[i]); if (u) bx.insertAdjacentHTML("beforeend", '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="Comprovativo"></a>'); }
    });
    var bp = ms.querySelector("[data-prov]"); if (bp) bp.onclick = formProvas;
    var nv = $("bb-env-nv"); if (nv) nv.remove();
  }

  /* Carregar provas de pagamento: foto e, por baixo, o texto da transferência */
  function formProvas() {
    if ($("bb-env-pf")) { $("bb-env-pf").scrollIntoView({ block: "center" }); return; }
    var c = EST && EST.cotacao; if (!c) return;
    var box = d.createElement("div"); box.className = "pv"; box.id = "bb-env-pf";
    box.innerHTML = '<h4>📤 Carregar provas de pagamento</h4>' +
      '<div class="meios">' + (c.mpesa_numero ? '<label data-m="mpesa"><input type="radio" name="bbm">Paguei no agente M-Pesa</label>' : "") +
      (c.emola_numero ? '<label data-m="emola"><input type="radio" name="bbm">Paguei no agente e-Mola</label>' : "") + "</div>" +
      '<label class="up">📷 Foto do comprovativo da transferência<input type="file" accept="image/*" multiple id="bb-env-f"></label><div class="fts" id="bb-env-pv"></div>' +
      '<textarea id="bb-env-t" placeholder="Texto da transferência: cole aqui a mensagem (SMS) que recebeu do M-Pesa / e-Mola"></textarea>' +
      '<button class="bt" type="button" id="bb-env-ok">📤 Enviar provas ao agente</button><div class="m" id="bb-env-m"></div>';
    $("bb-env-ch").appendChild(box); box.scrollIntoView({ block: "center" });
    var FOT = [], meio = "", labs = box.querySelectorAll(".meios label");
    if (labs.length === 1) { meio = labs[0].getAttribute("data-m"); labs[0].classList.add("on"); }
    labs.forEach(function (l) { l.onclick = function () { meio = l.getAttribute("data-m"); labs.forEach(function (x) { x.classList.toggle("on", x === l); }); }; });
    $("bb-env-f").onchange = function () {
      FOT = FOT.concat(Array.prototype.slice.call(this.files)).slice(0, 4); this.value = "";
      $("bb-env-pv").innerHTML = FOT.map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join("");
    };
    $("bb-env-ok").onclick = async function () {
      var b = this, m = $("bb-env-m"), t = $("bb-env-t").value.trim(); m.textContent = "";
      if (!meio) { m.textContent = "Escolha se pagou por M-Pesa ou por e-Mola."; return; }
      if (!FOT.length) { m.textContent = "Carregue a foto do comprovativo da transferência."; return; }
      if (t.length < 10) { m.textContent = "Cole ou escreva o texto da transferência (a mensagem que recebeu por SMS)."; return; }
      b.disabled = true; b.textContent = "A carregar fotos…";
      try {
        var s = (await sb.auth.getSession()).data.session; if (!s) throw new Error("Entre de novo na sua conta.");
        var cam = [];
        for (var i = 0; i < FOT.length; i++) {
          var f = FOT[i], ext = ((f.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          var p = s.user.id + "/" + PED.id + "/" + Date.now() + "-" + i + "." + ext;
          var up = await sb.storage.from("provas-envio").upload(p, f, { contentType: f.type || undefined, upsert: false });
          if (up.error) throw new Error('Foto "' + (f.name || i + 1) + '": ' + up.error.message);
          cam.push(p);
        }
        b.textContent = "A enviar…";
        var x = await sb.rpc("envio_cliente_pagou", { p_order: String(PED.id), p_meio: meio, p_texto: t, p_fotos: cam });
        if (x.error) throw new Error(x.error.message);
        recarregar(true);
      } catch (er) { b.disabled = false; b.textContent = "📤 Enviar provas ao agente"; m.textContent = er.message; }
    };
  }

  function estadoHtml(e) {
    var c = e.cotacao;
    if (!c) return '<div class="av a">📦 <b>O seu produto já foi coletado pela BBabilônia.</b><br>Aguarde a cotação do envio e da taxa fixa de busca e embalagem de 200 MT. O agente BBabilônia manda os dados de pagamento no chat deste pedido e recebe um aviso 🔔.</div>';
    if (c.estado === "aguarda_pagamento") return c.recusa_motivo
      ? '<div class="av r">⚠️ <b>Pagamento não confirmado:</b> ' + esc(c.recusa_motivo) + "<br>Abra o chat e carregue as provas de novo.</div>"
      : '<div class="av z">💬 Recebeu os dados de pagamento do transporte no chat. Pague e carregue as provas.</div>';
    if (c.estado === "pago_cliente") return '<div class="av z">⏳ <b>Provas enviadas</b> ' + esc(quando(c.cliente_pagou_em)) + ". A BBabilônia está a confirmar se a transferência entrou.</div>";
    if (c.estado === "pago_confirmado") return '<div class="av v">✅ <b>Pagamento do transporte confirmado.</b> O agente vai entregar a mercadoria na transportadora.</div>';
    return "";
  }

  async function recarregar(abrirChat) {
    var bx = $("bb-envio"); if (bx) bx.remove(); clearInterval(relogio); relogio = null;
    if (abrirChat) aberto = true;
    await desenhar();
  }

  async function desenhar() {
    var det = $("det"); if (!det || det.classList.contains("hide") || $("bb-envio")) return;
    var p = pedidoAberto(); if (!p) return;
    if (aCarregar === String(p.id)) return; aCarregar = String(p.id);
    var r; try { r = await sb.rpc("envio_cliente_ver", { p_order: String(p.id) }); } catch (e) { aCarregar = null; return; }
    aCarregar = null;
    if (!r || r.error || !r.data) return;
    var e = r.data, c = e.cotacao;
    if ($("bb-envio") || String(window.aberto) !== String(p.id)) return;
    if (PED && String(PED.id) !== String(p.id)) aberto = false;
    PED = p; EST = e;
    if (!e.mensagens && (e.entregue || (!c && !e.recolhido) || (c && c.estado === "enviado"))) return;
    var h = "<h3>🚚 Envio da encomenda</h3>" + (e.entregue || (c && c.estado === "enviado") ? "" : estadoHtml(e)) +
      (e.novas ? '<span class="nv" id="bb-env-nv">📩 Tem ' + e.novas + (e.novas === 1 ? " mensagem nova" : " mensagens novas") + " sobre o envio</span>" : "") +
      '<button class="bt' + (e.novas ? "" : " l") + '" type="button" id="bb-env-abrir">💬 ' + (aberto ? "Fechar o chat" : "Abrir o chat do envio") + "</button>" +
      '<div class="ch" id="bb-env-ch"' + (aberto ? "" : ' style="display:none"') + '><div class="ms" id="bb-env-ms"><div class="sis">A carregar…</div></div>' +
      '<div class="es"><input id="bb-env-in" placeholder="Escreva uma mensagem" maxlength="1000"><button type="button" id="bb-env-env">Enviar</button></div><div class="m" id="bb-env-cm"></div></div>';
    var box = d.createElement("div"); box.className = "box"; box.id = "bb-envio"; box.innerHTML = h;
    var primeiro = det.querySelector(".box");
    if (primeiro) primeiro.insertAdjacentElement("afterend", box); else det.insertBefore(box, det.firstChild);
    $("bb-env-abrir").onclick = function () {
      aberto = !aberto; $("bb-env-ch").style.display = aberto ? "" : "none"; this.textContent = aberto ? "💬 Fechar o chat" : "💬 Abrir o chat do envio";
      this.classList.add("l");
      if (aberto) { carregarChat(); relogio = relogio || setInterval(function () { if (!d.hidden && $("bb-env-ms")) carregarChat(); }, 10000); }
      else { clearInterval(relogio); relogio = null; }
    };
    var enviar = async function () {
      var i = $("bb-env-in"), t = i.value.trim(), m = $("bb-env-cm"); m.textContent = ""; if (!t) return;
      $("bb-env-env").disabled = true;
      var x = await sb.rpc("envio_chat_enviar", { p_order: String(p.id), p_texto: t });
      $("bb-env-env").disabled = false;
      if (x.error) { m.textContent = x.error.message; return; }
      i.value = ""; carregarChat();
    };
    $("bb-env-env").onclick = enviar;
    $("bb-env-in").onkeydown = function (ev) { if (ev.key === "Enter") enviar(); };
    if (aberto) { carregarChat(); relogio = relogio || setInterval(function () { if (!d.hidden && $("bb-env-ms")) carregarChat(); }, 10000); }
  }

  new MutationObserver(function () { if (!$("bb-envio")) { clearInterval(relogio); relogio = null; desenhar(); } }).observe($("det") || d.body, { childList: true, attributes: true, attributeFilter: ["class"] });
  desenhar();
})();

/* 13/11/2026 — Pedido cancelado pela BBabilônia: o cliente vê o reembolso (por fazer / feito) no detalhe do pedido */
(function () {
  if (window.__bbReemb) return; window.__bbReemb = 1;
  var d = document;
  function $(i) { return d.getElementById(i); }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function desenhar() {
    var det = $("det"); if (!det || det.classList.contains("hide") || $("bb-reemb")) return;
    var p; try { var id = window.aberto; p = (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0]; } catch (e) {}
    if (!p || !/reembols/i.test(String(p.escrow_status || ""))) return;
    var feito = String(p.escrow_status) === "reembolsado";
    var box = d.createElement("div"); box.className = "box"; box.id = "bb-reemb";
    box.style.cssText = "background:#fff;color:#0f172a;border:2px solid " + (feito ? "#10b981" : "#f59e0b");
    box.innerHTML = "<h3>💸 " + (feito ? "Reembolso feito" : "Reembolso a caminho") + "</h3><div style=\"font-size:14.5px;line-height:1.5\">" +
      (feito ? "A BBabilônia devolveu <b>" + din(p.total, p.currency) + "</b>" + (p.reembolsado_em ? " em " + new Date(p.reembolsado_em).toLocaleDateString("pt-PT") : "") + "."
             : "Este pedido foi cancelado pela BBabilônia. Vamos devolver-lhe <b>" + din(p.total, p.currency) + "</b>. Recebe um aviso 🔔 quando o reembolso for feito.") + "</div>";
    var primeiro = det.querySelector(".box");
    if (primeiro) primeiro.insertAdjacentElement("afterend", box); else det.insertBefore(box, det.firstChild);
  }
  new MutationObserver(function () { if (!$("bb-reemb")) desenhar(); }).observe($("det") || d.body, { childList: true, attributes: true, attributeFilter: ["class"] });
  desenhar();
})();

/* 13/11/2026 — Encomenda a caminho e receção com fotos: quando levanta na transportadora (ou na estação BBabilônia),
   o cliente tira uma foto do produto e confirma. Os agentes de atendimento e de busca também podem confirmar por ele. */
(function () {
  if (window.__bbRec || !window.sb) return; window.__bbRec = 1;
  var sb = window.sb, d = document, aCarregar = null;
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function quando(t) { try { return new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  var css = d.createElement("style");
  css.textContent = "#bb-rec{background:#fff;color:#0f172a;border:2px solid #10b981}#bb-rec h3{margin:0 0 6px}#bb-rec .tx{font-size:14.5px;line-height:1.5;color:#334155}" +
    "#bb-rec .up{display:block;text-align:center;border:2px dashed #16a34a;border-radius:12px;padding:14px 6px;font-weight:800;font-size:15px;color:#065f46;background:#f0fdf4;margin-top:10px}#bb-rec .up input{display:none}" +
    "#bb-rec .fts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#bb-rec .fts img{width:78px;height:78px;object-fit:cover;border-radius:10px}" +
    "#bb-rec .bt{display:block;width:100%;border:0;border-radius:12px;padding:14px;margin-top:10px;font:inherit;font-size:16px;font-weight:800;color:#fff;background:linear-gradient(90deg,#16a34a,#0ea5e9)}#bb-rec .bt:disabled{opacity:.5}" +
    "#bb-rec .m{color:#e11d48;font-size:14px;margin-top:8px}" +
    "#bb-rec .est{display:flex;gap:6px;margin-top:10px}#bb-rec .est button{flex:1;border:2px solid #e2e8f0;background:#fff;border-radius:12px;padding:10px 0;font-size:24px;line-height:1}#bb-rec .est button.on{border-color:#f59e0b;background:#fffbeb}" +
    "#bb-rec textarea{width:100%;box-sizing:border-box;min-height:70px;margin-top:8px;padding:10px;border:2px solid #e2e8f0;border-radius:12px;font:inherit;font-size:14.5px;background:#fff;color:#0f172a}" +
    "#bb-rec .lb{font-weight:800;font-size:14.5px;margin-top:12px}";
  function estrelasHtml() { return '<div class="lb">⭐ Avalie a sua compra (obrigatório)</div><div class="est" id="bb-rec-e">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '">☆</button>'; }).join("") + '</div>' +
    '<textarea id="bb-rec-c" maxlength="1000" placeholder="Comentário sobre o produto (opcional)"></textarea>'; }
  function ligarEstrelas(cb) { var bs = d.querySelectorAll("#bb-rec-e button"); bs.forEach(function (b) { b.onclick = function () { var n = +b.getAttribute("data-n"); bs.forEach(function (x) { var k = +x.getAttribute("data-n"); x.textContent = k <= n ? "⭐" : "☆"; x.classList.toggle("on", k <= n); }); cb(n); }; }); }
  d.head.appendChild(css);
  function pedidoAberto() { try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; } }
  async function desenhar() {
    var det = $("det"); if (!det || det.classList.contains("hide") || $("bb-rec")) return;
    var p = pedidoAberto(); if (!p || /cancel/i.test(String(p.status || ""))) return;
    if (aCarregar === String(p.id)) return; aCarregar = String(p.id);
    var e, r; try { e = await sb.rpc("envio_cliente_ver", { p_order: String(p.id) }); r = await sb.rpc("rececoes_ver", { p_orders: [String(p.id)] }); } catch (x) { aCarregar = null; return; }
    aCarregar = null;
    if (!e || e.error || !e.data || !e.data.recolhido) return;            /* só pedidos tratados pelos agentes BBabilônia */
    if ($("bb-rec") || String(window.aberto) !== String(p.id)) return;
    var cf = $("conf"); if (cf) { cf.style.display = "none"; var dl = cf.parentNode.querySelector(".dl"); if (dl) dl.style.display = "none"; }
    var c = e.data.cotacao, rec = r && !r.error && r.data ? r.data[String(p.id)] : null, h;
    var avaliar = rec && !rec.avaliado_em;
    if (rec) h = "<h3>📍 Encomenda recebida</h3><div class=\"tx\">" + esc(quando(rec.em)) + " · " + (rec.local === "estacao" ? "estação BBabilônia" : "transportadora") +
      (rec.papel === "cliente" ? "" : " · registado pela BBabilônia") + "</div><div class=\"fts\" id=\"bb-rec-f\"></div>" +
      (avaliar ? estrelasHtml() + '<button class="bt" type="button" id="bb-rec-av">⭐ Enviar avaliação</button><div class="m" id="bb-rec-m"></div>'
               : rec.estrelas ? '<div class="tx" style="margin-top:8px">A sua avaliação: <b>' + "⭐".repeat(rec.estrelas) + "</b>" + (rec.comentario ? " · " + esc(rec.comentario) : "") + "</div>" : "");
    else if (c && c.estado === "enviado") h = "<h3>🚚 A sua encomenda está a caminho</h3><div class=\"tx\">Enviada pela transportadora <b>" + esc(c.transportadora || "") + "</b>" +
      (c.enviado_em ? " em " + esc(quando(c.enviado_em)) : "") + ". Quando a levantar, tire uma foto do produto e confirme aqui.</div>" +
      '<label class="up">📷 Foto do produto que recebeu<input type="file" accept="image/*" multiple id="bb-rec-i"></label><div class="fts" id="bb-rec-pv"></div>' +
      estrelasHtml() + '<button class="bt" type="button" id="bb-rec-ok">✅ Recebi a encomenda</button><div class="m" id="bb-rec-m"></div>';
    else return;
    var box = d.createElement("div"); box.className = "box"; box.id = "bb-rec"; box.innerHTML = h;
    var primeiro = det.querySelector(".box");
    if (primeiro) primeiro.insertAdjacentElement("afterend", box); else det.insertBefore(box, det.firstChild);
    d.querySelectorAll('a.avb[href^="avaliar.html"]').forEach(function (a) { a.parentNode.style.display = "none"; });
    var EST = 0; if (d.getElementById("bb-rec-e")) ligarEstrelas(function (n) { EST = n; });
    if (rec) {
      if (avaliar) $("bb-rec-av").onclick = async function () {
        var b = this, m = $("bb-rec-m"); m.textContent = "";
        if (!EST) { m.textContent = "Escolha de 1 a 5 estrelas."; return; }
        b.disabled = true;
        var x = await sb.rpc("rececao_avaliar", { p_order: String(p.id), p_estrelas: EST, p_comentario: $("bb-rec-c").value.trim() || null });
        if (x.error) { b.disabled = false; m.textContent = x.error.message; return; }
        location.reload();
      };
      (rec.fotos || []).forEach(async function (cam) { try { var u = await sb.storage.from("provas-envio").createSignedUrl(cam, 3600); if (u.data && u.data.signedUrl && $("bb-rec-f")) $("bb-rec-f").insertAdjacentHTML("beforeend", '<img src="' + esc(u.data.signedUrl) + '" alt="">'); } catch (x) {} });
      return;
    }
    var FOT = [];
    $("bb-rec-i").onchange = function () { FOT = FOT.concat(Array.prototype.slice.call(this.files)).slice(0, 6); this.value = ""; $("bb-rec-pv").innerHTML = FOT.map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join(""); };
    $("bb-rec-ok").onclick = async function () {
      var b = this, m = $("bb-rec-m"); m.textContent = "";
      if (!FOT.length) { m.textContent = "Tire pelo menos uma foto do produto que recebeu."; return; }
      if (!EST) { m.textContent = "Avalie a sua compra: escolha de 1 a 5 estrelas."; return; }
      if (!confirm("Confirma que já levantou a encomenda e está tudo certo?")) return;
      b.disabled = true; b.textContent = "A enviar fotos…";
      try {
        var s = (await sb.auth.getSession()).data.session; if (!s) throw new Error("Entre de novo na sua conta.");
        var cam = [];
        for (var i = 0; i < FOT.length; i++) {
          var f = FOT[i], ext = ((f.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          var pth = s.user.id + "/" + p.id + "/rececao-" + Date.now() + "-" + i + "." + ext;
          var up = await sb.storage.from("provas-envio").upload(pth, f, { contentType: f.type || undefined, upsert: false });
          if (up.error) throw new Error('Foto "' + (f.name || i + 1) + '": ' + up.error.message);
          cam.push(pth);
        }
        var x = await sb.rpc("rececao_confirmar", { p_order: String(p.id), p_fotos: cam, p_local: "transportadora", p_estrelas: EST, p_comentario: $("bb-rec-c").value.trim() || null });
        if (x.error) throw new Error(x.error.message);
        location.reload();
      } catch (er) { b.disabled = false; b.textContent = "✅ Recebi a encomenda"; m.textContent = er.message; }
    };
  }
  new MutationObserver(function () { if (!$("bb-rec")) desenhar(); }).observe($("det") || d.body, { childList: true, attributes: true, attributeFilter: ["class"] });
  desenhar();
})();

