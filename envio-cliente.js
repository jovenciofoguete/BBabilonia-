/* envio-cliente.js — B-Babilônia (13/11/2026; 15/11/2026: botão "Confirmei a receção" e "prolongar" voltam; estado "Coletado")
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
   O agente nunca vai ao cliente: o cliente recebe pela transportadora (sem código de entrega).
   (19/11/2026) v2 — pedidos de lojas de Moçambique, Tanzânia e África do Sul (envio tratado pelo agente de busca BBabilônia):
   - linha dos 5 passos: 1 Produto pago · 2 Coletado (com o nome e a foto do agente) · 3 Pagamento de transporte (kg, medidas, valor, taxa, total)
     · 4 Transporte pago, enviado · 5 Recebido (avaliação) / Não recebido / Disputa;
   - "enviado / a caminho" só aparece depois de o cliente pagar o transporte e a BBabilônia entregar na transportadora;
     o "enviado" que o fornecedor marca ao entregar ao agente já não aparece ao cliente como "a caminho".
   Os outros países seguem o envio normal (nada muda). */
(function () {
  if (window.__bbEnvioCli || !window.sb) return; window.__bbEnvioCli = 1;
  var sb = window.sb, d = document;
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function quando(t) { try { return new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function med(x) { return x && Number(x.peso_kg) > 0 ? esc(x.peso_kg) + " kg · " + esc(x.comprimento_cm) + " × " + esc(x.largura_cm) + " × " + esc(x.altura_cm) + " cm" : ""; }

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
    /* linha dos 5 passos (v2) */
    "#bb-envio .l5{list-style:none;padding:0;margin:0 0 10px}#bb-envio .l5 li{position:relative;padding:0 0 12px 34px;font-size:14.5px;line-height:1.45}" +
    "#bb-envio .l5 li:before{content:'';position:absolute;left:11px;top:24px;bottom:0;width:2px;background:#e2e8f0}#bb-envio .l5 li:last-child:before{display:none}" +
    "#bb-envio .l5 .p{position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:#e2e8f0;color:#fff;font-size:13px;font-weight:900;text-align:center;line-height:24px}" +
    "#bb-envio .l5 li.ok .p{background:#16a34a}#bb-envio .l5 li.ag .p{background:#f59e0b}#bb-envio .l5 li.no{color:#94a3b8}#bb-envio .l5 .t{font-weight:800;display:block}" +
    "#bb-envio .l5 small{display:block;color:#475569;font-size:13px;margin-top:2px}#bb-envio .l5 li.no small{color:#94a3b8}" +
    "#bb-envio .ag-c{display:flex;align-items:center;gap:10px;margin-top:6px;padding:8px;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;color:#14532d}" +
    "#bb-envio .ag-c img{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#e2e8f0}" +
    /* modo escuro: o chat e as caixas brancas ficam sempre com texto escuro (antes o texto ficava branco e não se via) */
    "#bb-envio .ch,#bb-envio .dp,#bb-envio .pv,#bb-envio .nr,#bb-envio .b.ou{color:#0f172a}" +
    "#bb-envio .tt span:last-child{white-space:nowrap;margin-left:10px;text-align:right}#bb-envio .ms{max-height:68vh}#det{padding-bottom:96px}" +
    "#bb-envio .pm{border:2px solid #e11d48;border-radius:14px;padding:12px;background:#fff;color:#0f172a;margin-bottom:10px}#bb-envio .pm label{display:block;font-weight:800;font-size:14px;margin:8px 0 4px}" +
    "#bb-envio .pm input{width:100%;box-sizing:border-box;padding:12px;border:2px solid #e2e8f0;border-radius:10px;font:inherit;font-size:17px;background:#fff;color:#0f172a}#bb-envio .pm .bt{background:#e11d48}" +
    "#bb-envio .pm .pin{margin-top:10px;padding:10px;border-radius:10px;background:#fef3c7;color:#92400e;font-weight:700;font-size:14px}#bb-envio .pm .ok{margin-top:10px;color:#047857;font-weight:800;font-size:14.5px}" +
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
      return '<div class="dp"><b>🚚 Pagamento do transporte</b>' +
        (med(x) ? '<div class="tt" style="margin-top:6px"><span>📦 Pacote</span><span>' + med(x) + "</span></div>" : "") +
        '<div class="tt" style="margin-top:6px"><span>Transporte (' + esc(x.transportadora || "transportadora") + ')</span><span>' + din(x.valor_envio, x.moeda) + "</span></div>" +
        '<div class="tt"><span>Taxa de serviço (busca e embalagem)</span><span>' + din(x.taxa_servico, x.moeda) + "</span></div>" +
        '<div class="tt g"><span>Total a pagar</span><span>' + din(x.total, x.moeda) + "</span></div>" +
        (x.mpesa_numero ? '<div class="nr" style="display:block"><span>🟥 <b>Agente M-Pesa</b></span>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px"><span>Código do agente: <b>' + esc(x.mpesa_numero) + '</b></span><button type="button" data-cp="' + esc(x.mpesa_numero) + '">Copiar</button></div>' +
          '<div style="margin-top:4px">Nome do agente: <b>' + esc(x.nome_recetor || "") + '</b></div></div>' +
          '<div class="pq">M-Pesa: abra o menu M-Pesa → <b>Levantar dinheiro</b> → <b>Agente</b> → escreva o código do agente acima, o valor total e o seu PIN.</div>' : "") +
        (x.emola_numero ? '<div class="nr" style="display:block"><span>🟧 <b>Agente e-Mola</b></span>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px"><span>Código do agente: <b>' + esc(x.emola_numero) + '</b></span><button type="button" data-cp="' + esc(x.emola_numero) + '">Copiar</button></div>' +
          '<div style="margin-top:4px">Nome do agente: <b>' + esc(x.nome_recetor || "") + '</b></div></div>' +
          '<div class="pq">e-Mola: abra o menu e-Mola → <b>Levantar dinheiro</b> → <b>Agente</b> → escreva o código do agente acima, o valor total e o seu PIN.</div>' : "") +
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
    ms.innerHTML = L.length ? L.map(function (m) { return msg(m, ult); }).join("") : '<div class="sis">Ainda não há mensagens. O agente BBabilônia vai mandar aqui o pagamento do transporte.</div>';
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
    if (!c) return '<div class="av a">📦 <b>A BBabilônia coletou o seu produto.</b><br>Aguarde a cotação do valor de transporte e o pagamento do transporte (taxa de serviço de 200 MT). O agente BBabilônia manda os dados de pagamento no chat deste pedido e recebe um aviso 🔔.</div>';
    if (c.estado === "aguarda_pagamento") return c.recusa_motivo
      ? '<div class="av r">⚠️ <b>Pagamento não confirmado:</b> ' + esc(c.recusa_motivo) + "<br>Abra o chat e carregue as provas de novo.</div>"
      : '<div class="av z">💬 Recebeu o pagamento do transporte no chat. Pague e carregue as provas.</div>';
    if (c.estado === "pago_cliente") return '<div class="av z">⏳ <b>Provas enviadas</b> ' + esc(quando(c.cliente_pagou_em)) + ". A BBabilônia está a confirmar se a transferência entrou.</div>";
    if (c.estado === "pago_confirmado") return '<div class="av v">✅ <b>Transporte pago.</b> O agente vai entregar a mercadoria na transportadora.</div>';
    return "";
  }

  /* 19/11/2026 — a linha dos 5 passos (só pedidos de Moçambique, Tanzânia e África do Sul) */
  function linha5(e, p) {
    var c = e.cotacao, rec = !!e.recolhido, pagoT = !!(c && (c.estado === "pago_confirmado" || c.estado === "enviado")), env = !!(c && c.estado === "enviado");
    var fim = /(recebid|delivered|conclu)/i.test(String((p && p.status) || ""));
    var ag = e.agente ? '<div class="ag-c">' + (e.agente.foto_url ? '<img src="' + esc(e.agente.foto_url) + '" alt="">' : "") + "<div>Agente BBabilônia<br><b>" + esc(e.agente.nome) + "</b></div></div>" : "";
    function li(ok, agora, tit, txt) { return '<li class="' + (ok ? "ok" : agora ? "ag" : "no") + '"><span class="p">' + (ok ? "✓" : agora ? "…" : "") + '</span><span class="t">' + tit + "</span><small>" + txt + "</small></li>"; }
    return '<ul class="l5">' +
      li(true, false, "1 · PRODUTO PAGO", "Aguarde a resposta da BBabilônia.") +
      li(rec, !rec, "2 · A BBABILÔNIA COLETOU O SEU PRODUTO", rec ? "Aguarde a cotação do valor de transporte." + ag : "A BBabilônia está a tratar do seu pedido." + ag) +
      li(pagoT, rec && !pagoT, "3 · PAGAMENTO DE TRANSPORTE", c ? (med(c) ? "📦 " + med(c) + "<br>" : "") + "Transporte " + din(c.valor_envio, c.moeda) + " · taxa de serviço " + din(c.taxa_servico, c.moeda) + "<br><b>Total: " + din(c.total, c.moeda) + "</b>" +
        (c.estado === "aguarda_pagamento" ? "<br>👉 Abra o chat abaixo para pagar e carregar as provas." : c.estado === "pago_cliente" ? "<br>⏳ A confirmar o seu pagamento." : "") : "Kg, tamanhos, valor de transporte e taxa de serviço (200 MT) aparecem aqui quando a cotação estiver pronta.") +
      li(env, pagoT && !env, "4 · TRANSPORTE PAGO", env ? "A BBabilônia enviou o seu pedido" + (c.transportadora ? " (" + esc(c.transportadora) + ")" : "") + (c.rastreio ? ". Rastreamento: <b>" + esc(c.rastreio) + "</b>" : "") + ". Aguarde a receção." : pagoT ? "Transporte pago. A BBabilônia vai entregar o pedido na transportadora." : "Depois de pagar o transporte, a BBabilônia envia o seu pedido.") +
      li(fim, env && !fim, "5 · RECEBIDO", fim ? "Recebido. Obrigado pela avaliação!" : "Ao levantar a encomenda: <b>Recebido</b> (com foto e avaliação) · <b>Não recebido</b> · <b>Abrir disputa</b>.") +
      "</ul>";
  }

  /* 19/11/2026 — SÓ MOÇAMBIQUE: pagar o transporte por M-Pesa como o produto: o cliente toca em Pagar e confirma o PIN no telemóvel */
  function pagarHtml(c, p) {
    var tot = Number(c.valor_envio || 0) + Number(c.taxa_servico || 0);
    return '<div class="pm" id="bb-pm"><b>💳 Pagar o transporte</b>' +
      '<div class="tt" style="margin-top:6px"><span>Transporte (' + esc(c.transportadora || "transportadora") + ')</span><span>' + din(c.valor_envio, c.moeda) + "</span></div>" +
      '<div class="tt"><span>Taxa de serviço</span><span>' + din(c.taxa_servico, c.moeda) + "</span></div>" +
      '<div class="tt g" id="bb-pm-tot"><span>Total a pagar</span><span>' + din(tot, c.moeda) + "</span></div>" +
      '<label for="bb-pm-t">Número M-Pesa</label><input id="bb-pm-t" type="tel" inputmode="tel" maxlength="18" placeholder="84 123 4567" value="' + esc(String((p && p.customer_phone) || "").replace(/[^\d+ ]/g, "")) + '">' +
      '<button class="bt" type="button" id="bb-pm-b">📱 Pagar ' + din(tot, c.moeda) + " com M-Pesa</button><div id=\"bb-pm-e\"></div>" +
      '<div class="pq">Toque em Pagar e escreva o PIN do M-Pesa no seu telemóvel. Não precisa de enviar provas.<br>Se não conseguir pagar assim, abra o chat, pague no agente com os dados e carregue as provas.</div></div>';
  }
  function ligarPagar(p) {
    var b = $("bb-pm-b"); if (!b) return;
    var t = $("bb-pm-t"), er = $("bb-pm-e"), tm;
    async function api(corpo) {
      var s = (await sb.auth.getSession()).data.session; if (!s) return { erro: "Entre de novo na sua conta." };
      var r = await fetch("/api/mpesa-transporte", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.access_token }, body: JSON.stringify(corpo) });
      try { return await r.json(); } catch (x) { return { erro: "O pagamento M-Pesa não respondeu. Tente outra vez." }; }
    }
    function cotar() {
      if (String(t.value).replace(/\D/g, "").length < 9) return;
      api({ order_id: String(p.id), telefone: t.value, acao: "cotar" }).then(function (j) {
        if (j && !j.erro && $("bb-pm-b") && !b.disabled) { $("bb-pm-tot").lastChild.textContent = din(j.total, j.moeda); b.textContent = "📱 Pagar " + din(j.total, j.moeda) + " com M-Pesa"; }
      });
    }
    t.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(cotar, 500); });
    b.onclick = async function () {
      er.className = ""; er.innerHTML = "";
      if (String(t.value).replace(/\D/g, "").length < 9) { er.innerHTML = '<div class="m">Escreva o número M-Pesa completo.</div>'; return; }
      b.disabled = true;
      er.innerHTML = '<div class="pin">📲 Veja o seu telemóvel e escreva o PIN do M-Pesa para confirmar. Não feche esta página.</div>';
      var j = await api({ order_id: String(p.id), telefone: t.value });
      if (j && j.ok) { er.innerHTML = '<div class="ok">✅ Transporte pago (' + esc(din(j.total, j.moeda)) + "). A BBabilônia vai entregar o seu pedido na transportadora.</div>"; setTimeout(function () { location.reload(); }, 1800); return; }
      er.innerHTML = '<div class="m">' + esc((j && j.erro) || "Não foi possível concluir o pagamento.") + "</div>"; b.disabled = false;
    };
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
    if (/cancel/i.test(String(p.status || "")) && !e.mensagens) return;
    if (!e.afr && !e.recolhido && !e.mensagens && (e.entregue || (!c && !e.recolhido) || (c && c.estado === "enviado"))) return;
    var comChat = !!(e.mensagens || e.recolhido || c);
    var h = "<h3>🚚 " + ((e.afr || e.recolhido) ? "Acompanhamento do pedido" : "Envio da encomenda") + "</h3>" + ((e.afr || e.recolhido) ? linha5(e, p) : "") +
      (!(e.afr || e.recolhido) && !(e.entregue || (c && c.estado === "enviado")) ? estadoHtml(e) : "") +
      (c && c.estado === "aguarda_pagamento" && String(p.cliente_pais || "").toUpperCase() === "MZ" ? pagarHtml(c, p) : "") +
      (e.novas ? '<span class="nv" id="bb-env-nv">📩 Tem ' + e.novas + (e.novas === 1 ? " mensagem nova" : " mensagens novas") + " sobre o envio</span>" : "") +
      (comChat ? '<button class="bt' + (e.novas ? "" : " l") + '" type="button" id="bb-env-abrir">💬 ' + (aberto ? "Fechar o chat" : "Abrir o chat do envio") + "</button>" +
      '<div class="ch" id="bb-env-ch"' + (aberto ? "" : ' style="display:none"') + '><div class="ms" id="bb-env-ms"><div class="sis">A carregar…</div></div>' +
      '<div class="es"><input id="bb-env-in" placeholder="Escreva uma mensagem" maxlength="1000"><button type="button" id="bb-env-env">Enviar</button></div><div class="m" id="bb-env-cm"></div></div>' : "");
    var box = d.createElement("div"); box.className = "box"; box.id = "bb-envio"; box.innerHTML = h;
    var primeiro = det.querySelector(".box");
    if (primeiro) primeiro.insertAdjacentElement("afterend", box); else det.insertBefore(box, det.firstChild);
    if ($("bb-rec")) $("bb-rec").insertAdjacentElement("beforebegin", box);   /* o acompanhamento fica sempre por cima da receção */
    ligarPagar(p);
    if (!comChat) return;
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
    var c = e.data.cotacao, rec = r && !r.error && r.data ? r.data[String(p.id)] : null, h;
    var avaliar = rec && !rec.avaliado_em;
    if (rec) h = "<h3>📍 Encomenda recebida</h3><div class=\"tx\">" + esc(quando(rec.em)) + " · " + (rec.local === "estacao" ? "estação BBabilônia" : "transportadora") +
      (rec.papel === "cliente" ? "" : " · registado pela BBabilônia") + "</div><div class=\"fts\" id=\"bb-rec-f\"></div>" +
      (avaliar ? estrelasHtml() + '<button class="bt" type="button" id="bb-rec-av">⭐ Enviar avaliação</button><div class="m" id="bb-rec-m"></div>'
               : rec.estrelas ? '<div class="tx" style="margin-top:8px">A sua avaliação: <b>' + "⭐".repeat(rec.estrelas) + "</b>" + (rec.comentario ? " · " + esc(rec.comentario) : "") + "</div>" : "");
    else if (c && c.estado === "enviado") h = "<h3>🚚 Enviado pela BBabilônia — aguarde a receção</h3><div class=\"tx\">Enviada pela transportadora <b>" + esc(c.transportadora || "") + "</b>" +
      (c.enviado_em ? " em " + esc(quando(c.enviado_em)) : "") + ". Quando a levantar, tire uma foto do produto e confirme aqui.</div>" +
      '<label class="up">📷 Foto do produto que recebeu<input type="file" accept="image/*" multiple id="bb-rec-i"></label><div class="fts" id="bb-rec-pv"></div>' +
      estrelasHtml() + '<button class="bt" type="button" id="bb-rec-ok">✅ Recebi a encomenda</button><div class="m" id="bb-rec-m"></div>';
    else return;
    /* (15/11/2026) só aqui, quando aparece a caixa com fotos, é que o botão simples "Confirmei a receção" sai;
       o prazo e o "prolongar a espera" (pedidos-prazo.js) e o "Não recebi" ficam sempre */
    if (!rec) { var cf = $("conf"); if (cf) cf.style.display = "none"; var cdl = $("cdl"); if (cdl) cdl.style.display = "none"; }
    var box = d.createElement("div"); box.className = "box"; box.id = "bb-rec"; box.innerHTML = h;
    var primeiro = det.querySelector(".box");
    if (primeiro) primeiro.insertAdjacentElement("afterend", box); else det.insertBefore(box, det.firstChild);
    if ($("bb-envio")) $("bb-envio").insertAdjacentElement("afterend", box);
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


/* 19/11/2026 — Estado certo para o cliente nos pedidos de Moçambique, Tanzânia e África do Sul:
   o fornecedor marca "enviado" quando entrega ao agente BBabilônia, mas para o cliente o pedido NÃO está "a caminho":
   fica "Pago" (à espera da BBabilônia) e depois "Coletado pela BBabilônia" até o transporte estar pago e o agente entregar
   na transportadora. Muda a etiqueta, o passo e tira a caixa "Envio" (transportadora do fornecedor) no detalhe e na lista. */
(function () {
  if (window.__bbColetado || !window.sb) return; window.__bbColetado = 1;
  var sb = window.sb, d = document, CACHE = {}, PEND = {};
  function $(i) { return d.getElementById(i); }
  function porEnviar(e) { return !!(e && (e.afr || e.recolhido) && !e.entregue && !(e.cotacao && e.cotacao.estado === "enviado")); }
  function ver(id) {
    if (id in CACHE) return Promise.resolve(CACHE[id]);
    if (PEND[id]) return PEND[id];
    PEND[id] = sb.rpc("envio_cliente_ver", { p_order: String(id) }).then(function (r) { CACHE[id] = r && !r.error ? r.data : null; delete PEND[id]; return CACHE[id]; },
      function () { delete PEND[id]; return null; });
    return PEND[id];
  }
  function etq(e) { return '<span class="est ok">Pago</span><span class="est">' + (e.recolhido ? "📦 Coletado pela BBabilônia" : "⏳ A BBabilônia está a tratar") + "</span>"; }
  function pedidoAberto() { try { var id = window.aberto; return (window.pedidos || []).filter(function (x) { return String(x.id) === String(id); })[0] || null; } catch (e) { return null; } }
  function aCaminho(el) { return el && /A caminho|A aguardar envio/.test(el.textContent || ""); }
  async function detalhe() {
    var det = $("det"); if (!det || det.classList.contains("hide") || det.getAttribute("data-col") === String(window.aberto)) return;
    var p = pedidoAberto(); if (!p) return;
    var b1 = det.querySelector(".box"); if (!b1 || !aCaminho(b1)) return;
    var id = String(p.id), e = await ver(id);
    if (String(window.aberto) !== id || !porEnviar(e)) return;
    det.setAttribute("data-col", id);
    var b = det.querySelector(".box"); if (!b) return;
    var ets = b.querySelectorAll(".est"), alvo = null;
    ets.forEach(function (x) { if (/A caminho|A aguardar envio/.test(x.textContent)) alvo = x; });
    if (alvo) { if (/A aguardar envio/.test(alvo.textContent) && alvo.previousElementSibling) alvo.previousElementSibling.remove(); alvo.outerHTML = etq(e); }
    var ps = b.querySelectorAll(".passo"); if (ps[1]) { if (e.recolhido) { ps[1].classList.add("on"); ps[1].innerHTML = "<b>✓</b>Coletado"; } else { ps[1].classList.remove("on"); ps[1].innerHTML = "Coletado"; } }
    det.querySelectorAll(".box h3").forEach(function (h) { if (h.textContent.trim() === "🚚 Envio") h.parentNode.remove(); });
    /* a receção só se confirma quando a BBabilônia enviar (🚚 A caminho), com foto. O prazo e o "prolongar" ficam. */
    var cf = $("conf");
    if (cf) {
      cf.disabled = true; cf.style.opacity = ".55"; cf.textContent = "✅ Confirmei a receção";
      if (!$("bb-conf-nota")) cf.insertAdjacentHTML("afterend", '<div id="bb-conf-nota" style="font-size:13.5px;color:#64748b;margin-top:6px;line-height:1.45">🔒 Disponível quando a BBabilônia entregar a encomenda na transportadora (passo 4). Aí confirma com a foto do produto.</div>');
      var cdl = $("cdl"); if (cdl) cdl.style.display = "none";
    }
  }
  async function listaFix() {
    var l = $("lista"); if (!l || l.classList.contains("hide")) return;
    l.querySelectorAll("button.ped[data-id]").forEach(function (bt) {
      if (bt.getAttribute("data-col")) return;
      if (!/A caminho|A aguardar envio/.test(bt.textContent)) return;
      bt.setAttribute("data-col", "1");
      var id = bt.getAttribute("data-id");
      ver(id).then(function (e) {
        if (!porEnviar(e) || !bt.isConnected) return;
        var alvo = null; bt.querySelectorAll(".est").forEach(function (x) { if (/A caminho|A aguardar envio/.test(x.textContent)) alvo = x; });
        if (!alvo) return;
        if (/A aguardar envio/.test(alvo.textContent) && alvo.previousElementSibling && /Pago/.test(alvo.previousElementSibling.textContent)) alvo.previousElementSibling.remove();
        alvo.outerHTML = etq(e);
      });
    });
  }
  function tudo() { var det = $("det"); if (det && det.getAttribute("data-col") && det.getAttribute("data-col") !== String(window.aberto)) det.removeAttribute("data-col");
    if (det && det.querySelector(".box") && aCaminho(det.querySelector(".box"))) det.removeAttribute("data-col");
    detalhe(); listaFix(); }
  new MutationObserver(tudo).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  tudo();
})();


/* 19/11/2026 — pedidos tratados pela BBabilônia: o cliente vê "Enviado" (só depois do transporte pago e entregue à transportadora)
   e os 5 passos novos; a linha antiga de 4 passos (Pago · A caminho · Recebido · Avaliado) sai, porque mostrava "Avaliado ✓" sem avaliação. */
(function () {
  if (window.__bbEnviado || !window.sb) return; window.__bbEnviado = 1;
  var sb = window.sb, d = document, CACHE = {}, PEND = {};
  function $(i) { return d.getElementById(i); }
  function ver(id) {
    if (id in CACHE) return Promise.resolve(CACHE[id]);
    if (PEND[id]) return PEND[id];
    PEND[id] = sb.rpc("envio_cliente_ver", { p_order: String(id) }).then(function (r) { CACHE[id] = r && !r.error ? r.data : null; delete PEND[id]; return CACHE[id]; }, function () { delete PEND[id]; return null; });
    return PEND[id];
  }
  function nosso(e) { return !!(e && (e.afr || e.recolhido)); }
  function enviadoOk(e) { return !!(e && e.cotacao && e.cotacao.estado === "enviado"); }
  function troca(el) { if (el && /A caminho/.test(el.textContent)) el.textContent = "🚚 Enviado"; }
  async function detalhe() {
    var det = $("det"); if (!det || det.classList.contains("hide")) return;
    var p; try { p = (window.pedidos || []).filter(function (x) { return String(x.id) === String(window.aberto); })[0]; } catch (x) {}
    if (!p) return;
    var id = String(p.id), e = await ver(id);
    if (String(window.aberto) !== id || !nosso(e)) return;
    var b = det.querySelector(".box"); if (!b) return;
    var l = b.querySelector(".linha"); if (l) l.style.display = "none";
    if (enviadoOk(e) && !e.entregue) b.querySelectorAll(".est").forEach(troca);
  }
  function lista() {
    var l = $("lista"); if (!l || l.classList.contains("hide")) return;
    l.querySelectorAll("button.ped[data-id]").forEach(function (bt) {
      if (!/A caminho/.test(bt.textContent)) return;
      ver(bt.getAttribute("data-id")).then(function (e) { if (nosso(e) && enviadoOk(e) && !e.entregue && bt.isConnected) bt.querySelectorAll(".est").forEach(troca); });
    });
  }
  new MutationObserver(function () { detalhe(); lista(); }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  detalhe(); lista();
})();


/* 19/11/2026 — Pedidos tratados pela BBabilônia: o fornecedor marca "enviado" ao entregar o produto ao agente, e o pedido ficava com o estado
   "enviado" na base de dados. Para o cliente isso ainda NÃO é "a caminho". Aqui o estado do pedido, só no ecrã do cliente, passa a "pago" até o
   transporte estar pago e a BBabilônia entregar na transportadora. Assim a etiqueta, os separadores (A caminho / Pendentes de envio), o botão
   "Confirmei a receção" e o passo "A caminho" ficam todos certos de uma vez. Nada muda na base de dados. */
(function () {
  if (window.__bbNorm || !window.sb) return; window.__bbNorm = 1;
  var sb = window.sb, feito = {}, n = 0, ocupado = false;
  function enviadoSt(p) { return /enviad|shipped|transito/.test(String((p && p.status) || "").toLowerCase()) && !/entregue|liberado/.test(String((p && p.escrow_status) || "").toLowerCase()); }
  async function normalizar() {
    var P = window.pedidos || []; if (!P.length || ocupado) return false;
    var alvo = P.filter(function (p) { return enviadoSt(p) && !feito[p.id] && !/cancel/i.test(String(p.status)); });
    for (var i = 0; i < P.length; i++) if (!alvo.length || alvo.indexOf(P[i]) < 0) feito[P[i].id] = feito[P[i].id] || 0;
    if (!alvo.length) return true;
    ocupado = true; var mudou = false;
    await Promise.all(alvo.map(async function (p) {
      feito[p.id] = 1;
      try {
        var r = await sb.rpc("envio_cliente_ver", { p_order: String(p.id) }), e = r && !r.error ? r.data : null;
        if (e && (e.afr || e.recolhido) && !e.entregue && !(e.cotacao && e.cotacao.estado === "enviado")) { p.status_na_base = p.status; p.status = "pago"; p.avaliado = false; mudou = true; }
      } catch (x) {}
    }));
    ocupado = false;
    if (mudou) { try { if (window.aberto) window.abrirDet(window.aberto, false); else window.lista(); } catch (x) {} }
    return true;
  }
  var t = setInterval(async function () { n++; if (n > 80) { clearInterval(t); return; } if ((window.pedidos || []).length && await normalizar()) clearInterval(t); }, 250);
})();
