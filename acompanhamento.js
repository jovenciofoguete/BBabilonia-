/* acompanhamento.js — B-Babilônia (13/11/2026)
   Separador "🚚 Acompanhar" do pedido depois da verificação, até a entrega ser confirmada.
   - Busca e verificação (confirmar-produto.html): vê os pedidos que verificou; depois de recolher,
     tira a foto da entrega e toca em "🚚 Entreguei ao cliente".
   - Atendimento e dono (atd-verificacoes.html): veem todos e tocam em "✅ Confirmar entrega".
   Em cada pedido: quem verificou, quem confirmou no atendimento, recolha, entrega e confirmação.
   13/11/2026 — Envio pela transportadora (quando o cliente não é entregue em mão):
   - o agente abre o 💬 chat do pedido e toca em "Enviar dados de pagamento do transporte" (transportadora, valor,
     taxa); o número M-Pesa/e-Mola e o nome do recetor vão sozinhos (escritos pelo dono em 👥 Agentes);
   - o cliente transfere fora da plataforma e carrega as provas (foto + texto); o atendimento confirma;
   - o agente de busca marca "📦 Enviado" com a foto do talão e o nº de rastreamento.
   13/11/2026 — ✋ Pegar pedido: todos os agentes de busca veem todos os pedidos; só quem pegou trabalha no pedido
   (verificar, recolher, cotar e marcar enviado). O dono pode passar a outro agente ou devolver à lista. O atendimento vê quem está com cada pedido.
   13/11/2026 — "📨 Compartilhar dados de pagamento de envio"; taxa fixa de busca e embalagem (200 MT, das definições do dono).
   13/11/2026 — O agente de busca só recolhe na loja e entrega na transportadora (nunca vai ao cliente):
   saem "a caminho do cliente", "Entreguei ao cliente", o código e a entrega falhada.
   13/11/2026 — Depois de entregue na transportadora o pedido fica "🚚 A caminho"; a receção ("📍 Recebido pelo cliente")
   é confirmada com fotos do produto pelo cliente, por um agente de atendimento, por um agente de busca (estação BBabilônia
   ou transportadora) ou pelo dono. */
(function () {
  if (window.Acomp) return;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
  function dt(t) { var d = new Date(t); return t && !isNaN(d) ? d.toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function tel(t) { var n = String(t || "").replace(/[^\d+]/g, ""); return n ? ' · 📞 <a href="tel:' + esc(n) + '">' + esc(t) + "</a>" : ""; }
  function pessoa(nome, email, telefone) { return email || nome ? "<b>" + esc(nome || email) + "</b>" + (nome && email ? " · " + esc(email) : "") + tel(telefone) : ""; }

  var css = document.createElement("style");
  css.textContent = ".ac-c{background:#fff;border-radius:16px;padding:14px;box-shadow:0 4px 14px #0001;margin-bottom:12px}" +
    ".ac-c .l1{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:#64748b}" +
    ".ac-c h4{font-size:15px;margin:10px 0 6px}.ac-est{display:inline-block;font-size:12.5px;font-weight:800;padding:3px 10px;border-radius:20px;margin-top:6px}" +
    ".ac-est.a{background:#fef3c7;color:#92400e}.ac-est.v{background:#d1fae5;color:#065f46}.ac-est.z{background:#dbeafe;color:#1e40af}" +
    ".ac-cx{background:#f8fafc;border-radius:12px;padding:10px;font-size:14px;line-height:1.5;margin-top:8px}.ac-cx a{color:#1d4ed8;font-weight:700}" +
    ".ac-tl{list-style:none;padding:0;margin:10px 0 0}.ac-tl li{position:relative;padding:0 0 12px 30px;font-size:14px;line-height:1.45}" +
    ".ac-tl li:before{content:'';position:absolute;left:10px;top:20px;bottom:0;width:2px;background:#e2e8f0}.ac-tl li:last-child:before{display:none}" +
    ".ac-tl .p{position:absolute;left:0;top:0;width:22px;height:22px;border-radius:50%;background:#e2e8f0;color:#fff;font-size:12px;font-weight:900;text-align:center;line-height:22px}" +
    ".ac-tl li.ok .p{background:#10b981}.ac-tl li.ag .p{background:#f59e0b}.ac-tl li .t{font-weight:800}.ac-tl li.no{color:#94a3b8}.ac-tl small{display:block;color:#64748b;font-size:12.5px}" +
    ".ac-md{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.ac-md img{width:74px;height:74px;object-fit:cover;border-radius:10px}.ac-md video{width:100%;max-height:240px;border-radius:10px;background:#000}" +
    ".ac-up{display:block;text-align:center;border:2px dashed #10b981;border-radius:12px;padding:12px 6px;font-weight:800;font-size:14px;color:#065f46;background:#f0fdf4;margin-top:10px}.ac-up input{display:none}" +
    ".ac-bt{display:block;width:100%;border:0;border-radius:12px;padding:13px;font:inherit;font-size:15px;font-weight:800;color:#fff;margin-top:10px;background:#2563eb}.ac-bt.v{background:#10b981}.ac-bt:disabled{opacity:.45}" +
    ".ac-env{margin-top:10px;border:2px solid #bfdbfe;border-radius:14px;padding:12px;background:#f8fbff}.ac-env h5{margin:0 0 6px;font-size:15px}" +
    ".ac-env input{width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:2px solid #e2e8f0;border-radius:10px;font:inherit;font-size:15px}" +
    ".ac-env .ac-lb{font-size:12.5px;color:#475569;margin-top:8px;font-weight:700}.ac-env .ac-pg{font-size:13.5px;background:#eef2ff;border-radius:10px;padding:8px 10px;margin-top:8px;line-height:1.5}" +
    ".ac-env .ac-dois{display:flex;gap:8px}.ac-env .ac-dois .ac-bt{flex:1}.ac-bt.r{background:#ef4444}.ac-env .ac-tx{font-size:13.5px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:8px;margin-top:6px;white-space:pre-line}" +
    ".ac-ch{margin-top:10px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:10px}.ac-ms{max-height:380px;overflow:auto;display:flex;flex-direction:column;gap:8px}" +
    ".ac-b{max-width:86%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word}.ac-b.eu{align-self:flex-end;background:#dbeafe;color:#1e3a8a}" +
    ".ac-b.ou{align-self:flex-start;background:#f1f5f9}.ac-b small{display:block;font-size:11.5px;color:#64748b;margin-top:3px}.ac-b .nm{display:block;font-weight:800;font-size:12.5px;color:#0f766e}" +
    ".ac-sis{align-self:center;font-size:12.5px;color:#475569;background:#e2e8f0;border-radius:10px;padding:6px 10px;text-align:center}" +
    ".ac-dp{align-self:stretch;border:2px solid #16a34a;border-radius:12px;padding:10px;font-size:14px;background:#f0fdf4}" +
    ".ac-es{display:flex;gap:6px;margin-top:8px}.ac-es input{flex:1;min-width:0;margin:0!important}.ac-es button{border:0;border-radius:10px;padding:0 14px;font:inherit;font-weight:800;background:#0ea5e9;color:#fff}" +
    ".ac-df{margin-top:8px;border:2px solid #16a34a;border-radius:12px;padding:10px;background:#f0fdf4}" +
    ".ac-rs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;padding:10px;border-radius:12px;font-size:14px;font-weight:700}.ac-rs.livre{background:#fff7ed;color:#9a3412}.ac-rs.meu{background:#ecfdf5;color:#065f46}.ac-rs.outro{background:#f1f5f9;color:#334155}" +
    ".ac-rs button{border:0;border-radius:10px;padding:9px 12px;font:inherit;font-size:13.5px;font-weight:800;color:#fff;background:#ea580c}.ac-rs button.l{background:#fff;color:#065f46;border:2px solid #a7f3d0}.ac-rs select{flex:1;min-width:150px;padding:9px;border:2px solid #e2e8f0;border-radius:10px;font:inherit;font-size:13.5px;background:#fff}" +
    ".ac-m{font-size:14px;margin-top:8px;color:#dc2626;white-space:pre-line}.ac-m.ok{color:#059669}.ac-vz{text-align:center;color:#64748b;padding:30px 10px}";
  document.head.appendChild(css);

  function itens(l) {
    return arr(l).map(function (i) { return "• " + esc(i.nome || i.descricao || i.name || "Produto") + (i.cor || i.tamanho ? " (" + esc([i.cor, i.tamanho].filter(Boolean).join(" · ")) + ")" : "") + " × " + esc(i.qtd || i.quantidade || 1); }).join("<br>") || "Sem itens";
  }
  function midia(f, v) {
    return (arr(f).length ? '<div class="ac-md">' + arr(f).map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img loading="lazy" src="' + esc(u) + '" alt=""></a>'; }).join("") + "</div>" : "") +
      (arr(v).length ? '<div class="ac-md">' + arr(v).map(function (u) { return '<video controls playsinline preload="metadata" src="' + esc(u) + '"></video>'; }).join("") + "</div>" : "");
  }
  function passo(feito, agora, titulo, quando, quem, extra) {
    return '<li class="' + (feito ? "ok" : agora ? "ag" : "no") + '"><span class="p">' + (feito ? "✓" : agora ? "…" : "") + '</span><span class="t">' + titulo + "</span>" +
      (quando ? "<small>" + esc(dt(quando)) + "</small>" : "") + (quem ? "<small>" + quem + "</small>" : "") + (extra || "") + "</li>";
  }

  function respBloco(p, modo, R) {
    var r = (R.pedidos || {})[String(p.order_id)], h;
    if (modo !== "verificacao") return '<div class="ac-rs outro">👤 ' + (r ? "Com: " + esc(r.nome || r.email) : "Nenhum agente de busca pegou este pedido") + "</div>";
    if (!r) h = '<div class="ac-rs livre">🟠 Ninguém pegou este pedido' + (R.dono ? "" : '<button data-acx="pegar">✋ Pegar pedido</button>') + "</div>";
    else if (r.email === R.eu) h = '<div class="ac-rs meu">👤 Este pedido está consigo<button class="l" data-acx="devolver">↩️ Devolver à lista</button></div>';
    else h = '<div class="ac-rs outro">👤 Com: ' + esc(r.nome || r.email) + "</div>";
    if (R.dono) h += '<div class="ac-rs outro">👑 <select data-atr><option value="">Passar a outro agente…</option>' +
      (R.agentes || []).map(function (a) { return '<option value="' + esc(a.email) + '">' + esc(a.nome) + "</option>"; }).join("") + '<option value="__livre">↩️ Devolver à lista</option></select></div>';
    return h;
  }
  function caixa(p, i, modo, env, def, ent, R) {
    ent = ent || {}; R = R || {};
    var rp = (R.pedidos || {})[String(p.order_id)], mexe = modo !== "verificacao" || !!R.dono || !!(rp && rp.email === R.eu);
    var fim = p.entrega_confirmada_em || p.cliente_confirmou_em, entregue = !!p.entregue_em, recolhido = p.estado === "recolhido";
    var enviado = !!(env && env.estado === "enviado");
    var rec = (R.rec || {})[String(p.order_id)];
    var est = fim ? ["📍 Recebido pelo cliente", "v"] : enviado ? ["🚚 A caminho · na transportadora" + (env.transportadora ? " (" + esc(env.transportadora) + ")" : ""), "z"] : env ? ["🚚 Envio pela transportadora · " + ({ aguarda_pagamento: "à espera do pagamento", pago_cliente: "provas para confirmar", pago_confirmado: "pago · por enviar" })[env.estado], "a"] : fim ? ["✅ Entrega confirmada", "v"] : entregue ? ["🚚 Entregue · à espera de confirmação", "z"] : recolhido ? ["📦 Recolhido · à espera da cotação do envio", "a"] : ["✅ Confirmado · por recolher na loja", "a"];
    var h = '<div class="ac-c" data-ac="' + i + '"><div class="l1"><span>Pedido ' + esc(String(p.order_id).slice(0, 8).toUpperCase()) + " · " + din(p.total, p.moeda) + "</span><span>" + esc(dt(p.criado)) + "</span></div>" +
      '<span class="ac-est ' + est[1] + '">' + est[0] + "</span>" + (fim ? "" : respBloco(p, modo, R)) +
      '<div class="ac-cx">🧾 ' + itens(p.itens) + "</div>" +
      '<div class="ac-cx">🏪 <b>' + esc(p.loja_nome || "Loja") + "</b>" + (p.loja_local ? "<br>" + esc(p.loja_local) : "") + (p.loja_endereco ? "<br>📍 " + esc(p.loja_endereco) : "") + tel(p.loja_telefone).replace(" · ", "<br>") + "</div>" +
      '<div class="ac-cx">🙋 Cliente: <b>' + esc(p.cliente_nome || "—") + "</b>" + tel(p.cliente_telefone) + (p.cliente_endereco ? "<br>📍 " + esc(p.cliente_endereco) : "") + "</div>" +
      '<ul class="ac-tl">' +
      passo(true, false, "💳 Pago pelo cliente", p.pago_em || p.criado, "") +
      passo(!!p.verificado_em, false, "🛡️ Verificado na loja", p.verificado_em, pessoa(p.agente_nome, p.agente_email, p.agente_telefone), midia(p.fotos, p.videos)) +
      passo(!!p.decidido_em, false, "🎧 Confirmado pelo atendimento (iguais ao pedido)", p.decidido_em, pessoa(p.atendente_nome, p.atendente_email, p.atendente_telefone) + (p.motivo_atendimento ? "<br>Nota: " + esc(p.motivo_atendimento) : "")) +
      passo(!!p.libertado, false, "💰 Valor libertado ao fornecedor", "", p.erro_libertar ? "Não libertado: " + esc(p.erro_libertar) : "") +
      passo(recolhido, !recolhido, "📦 Recolhido na loja", p.recolhido_em, recolhido ? pessoa(p.agente_nome, p.agente_email, p.agente_telefone) : "") +
      (env || !entregue ? passo(enviado, recolhido && !enviado, "🚚 Entregue na transportadora · a caminho do cliente" + (env && env.transportadora ? " (" + esc(env.transportadora) + ")" : ""), env && env.enviado_em, enviado ? (env.rastreio ? "Nº de rastreamento: <b>" + esc(env.rastreio) + "</b>" : "") : "", enviado ? midia(env.fotos) : "") :
      passo(entregue, recolhido && !entregue, "🚚 Entregue ao cliente", p.entregue_em, entregue ? pessoa(p.entregue_nome, p.entregue_por, p.entregue_telefone) : "", midia(p.entrega_fotos))) +
      passo(!!fim, (entregue || enviado) && !fim, "📍 Recebido pelo cliente" + (rec ? (rec.local === "estacao" ? " (estação BBabilônia)" : " (transportadora)") : ""), fim,
        rec ? "Confirmado por: <b>" + esc(rec.papel === "cliente" ? "o próprio cliente" : (rec.nome || rec.por)) + "</b>" : p.entrega_confirmada_em ? pessoa(p.confirmou_nome, p.entrega_confirmada_por, "") : p.cliente_confirmou_em ? "Pelo cliente" : "",
        rec ? '<div class="ac-md" data-provas="' + esc(JSON.stringify(arr(rec.fotos))) + '"></div>' + (rec.estrelas ? "<small>Avaliação do cliente: " + "⭐".repeat(rec.estrelas) + (rec.comentario ? " · " + esc(rec.comentario) : "") + "</small>" : "<small>⏳ À espera da avaliação do cliente</small>") : "") +
      "</ul>";
    if (recolhido && !entregue) h += envioHtml(env, def, mexe ? modo : "ver");
    /* 14/11/2026 — para todos (agente de busca, atendimento e dono): a receção é a última a confirmar — só depois de partilhar os dados, o cliente pagar o transporte,
       o atendimento confirmar o pagamento e a encomenda ser entregue na transportadora (🚚 A caminho) */
    if (recolhido && !fim && !entregue && enviado) h += rececaoHtml(enviado);
    /* 13/11/2026 — confirmado pelo atendimento mas ainda não recolhido: o agente marca aqui "Já recolhi" e logo aparece o botão dos dados de pagamento */
    if (modo === "verificacao" && mexe && !recolhido && p.decidido_em) h += '<div class="ac-pg">📦 Ainda falta recolher na loja. Quando tiver os produtos consigo, toque em <b>"Já recolhi"</b>. Logo a seguir aparece no 💬 chat o botão <b>"📨 Compartilhar dados de pagamento de envio"</b>.</div><button class="ac-bt v" data-acx="recolhi">📦 Já recolhi os produtos</button>';
    h += chatBloco(env, def, mexe && recolhido && !entregue && (!env || env.estado === "aguarda_pagamento"));
    if ((p.cliente_recebeu || p.cliente_confirmou_em) && p.avaliado_fotos && !p.disputa) h += '<button class="ac-bt r" data-acx="apagar">🗑️ Apagar da minha lista</button>';
    else if (entregue || enviado) h += '<div class="ac-pg" style="margin-top:10px">🗑️ Pode apagar este pedido da sua lista depois de o cliente confirmar que recebeu e avaliar com fotos.</div>';
    if (p.disputa) h += '<a class="ac-bt" style="background:#ea580c;text-align:center;text-decoration:none;box-sizing:border-box" href="disputa.html?pedido=' + encodeURIComponent(p.order_id) + '&como=admin">⚠️ Disputa aberta pelo cliente · ver e responder</a>';
    if (R.dono) h += '<button class="ac-bt" style="background:#475569" data-acx="apagardono">🗑️ Apagar pedido (só o dono)</button>';
    if (!(modo === "atendimento" && entregue && !fim) && h.indexOf('data-acx="') > -1) h += '<div class="ac-m"></div>';
    if (modo === "atendimento" && entregue && !fim)
      h += '<button class="ac-bt v" data-acx="confirmar">✅ Confirmar entrega</button><div class="ac-m"></div>';
    return h + "</div>";
  }

  /* 📍 receção: qualquer agente (atendimento ou busca) ou o dono confirma com fotos quando o cliente levanta a encomenda */
  function rececaoHtml(enviado) {
    return '<div class="ac-env" style="border-color:#a7f3d0;background:#f0fdf4"><h5>📍 O cliente levantou a encomenda?</h5>' +
      '<select data-env="local" style="width:100%;box-sizing:border-box;margin-top:6px;padding:11px;border:2px solid #e2e8f0;border-radius:10px;font:inherit;font-size:15px;background:#fff">' +
      (enviado ? '<option value="transportadora">Na transportadora</option><option value="estacao">Na estação BBabilônia</option>' : '<option value="estacao">Na estação BBabilônia</option>') + '</select>' +
      '<label class="ac-up">📷 Foto do produto entregue ao cliente<input type="file" accept="image/*" multiple data-rc="1"></label><div class="ac-pv ac-rcv ac-md"></div>' +
      '<button class="ac-bt v" data-acx="rececao">✅ Confirmar receção</button></div>';
  }

  /* 💬 chat com o cliente: em todos os pedidos; os dados de pagamento só depois de recolher e antes de entregar */
  function chatBloco(env, def, podeDados) {
    def = def || {};
    var h = "";
    h += '<button class="ac-bt" style="background:#0ea5e9" data-acx="chat">💬 Chat com o cliente</button>' +
      '<div class="ac-ch" data-chat style="display:none"><div class="ac-ms"><div class="ac-sis">A carregar…</div></div>' +
      (podeDados ? (!def.nome_recetor ? '<div class="ac-pg">⚠️ O dono ainda não escreveu os dados de pagamento do transporte.</div>' :
        '<button class="ac-bt v" data-acx="dados">📨 Compartilhar dados de pagamento de envio</button>' +
        '<div class="ac-df" data-df style="display:none"><input data-env="transp" placeholder="Transportadora (ex.: Nhamaz, Etrago…)" value="' + esc(env ? env.transportadora : "") + '">' +
        '<input data-env="valor" type="number" inputmode="decimal" min="0" step="any" placeholder="Valor do transporte cobrado pela transportadora" value="' + esc(env ? env.valor_envio : "") + '">' +
        '<div class="ac-lb">Taxa fixa de busca e embalagem</div><input data-env="taxa" type="number" readonly style="background:#f1f5f9" value="' + esc(def.taxa_servico != null ? def.taxa_servico : 200) + '">' +
        '<div class="ac-lb">O número do agente M-Pesa / e-Mola para levantamento e o nome do agente vão sozinhos na mensagem.</div>' +
        '<button class="ac-bt v" data-acx="cotar">📨 Enviar</button></div>') : "") +
      '<div class="ac-es"><input data-chatin placeholder="Escreva ao cliente" maxlength="1000"><button type="button" data-acx="chatenv">Enviar</button></div></div>';
    return h;
  }
  function envioHtml(env, def, modo) {
    def = def || {};
    var h = '<div class="ac-env"><h5>🚚 Envio pela transportadora</h5>';
    var podeDados = !env || env.estado === "aguarda_pagamento";
    if (!env) h += '<div class="ac-pg">Depois de a transportadora dizer o preço, abra o 💬 chat e toque em "📨 Compartilhar dados de pagamento de envio".</div>';
    else if (env.estado === "aguarda_pagamento") h += '<div class="ac-pg">⏳ Dados de pagamento enviados no chat: <b>' + din(env.total, env.moeda) + "</b> (" + esc(env.transportadora || "") + ")." +
      (env.recusa_motivo ? "<br>⚠️ Pagamento recusado: " + esc(env.recusa_motivo) : "<br>À espera que o cliente pague e carregue as provas.") + "</div>";
    if (podeDados) return h + "</div>";
    if (env.estado === "pago_cliente") {
      h += '<div class="ac-pg">💰 O cliente carregou as provas da transferência (' + (env.cliente_meio === "emola" ? "e-Mola" : "M-Pesa") + ") de <b>" + din(env.total, env.moeda) + "</b> · " + esc(dt(env.cliente_pagou_em)) + "</div>" +
        '<div class="ac-md" data-provas="' + esc(JSON.stringify(arr(env.cliente_fotos))) + '"></div>' +
        (env.cliente_ref ? '<div class="ac-tx">' + esc(env.cliente_ref) + "</div>" : "");
      if (modo === "atendimento") h += '<div class="ac-dois"><button class="ac-bt v" data-acx="pagok">✅ O dinheiro entrou</button><button class="ac-bt r" data-acx="pagno">❌ Não entrou</button></div>';
      else h += '<div class="ac-pg">⏳ À espera que o atendimento confirme o pagamento.</div>';
    } else if (env.estado === "pago_confirmado") {
      h += '<div class="ac-pg">✅ Pagamento do envio confirmado (' + din(env.total, env.moeda) + "). " + (modo === "verificacao" ? "Entregue a mercadoria na transportadora:" : "À espera que o agente de busca envie.") + "</div>";
      if (modo === "verificacao")
        h += '<input data-env="rastreio" placeholder="Nº de rastreamento / guia da transportadora">' +
          '<label class="ac-up">📷 Foto do talão da transportadora ou do pacote<input type="file" accept="image/*" multiple></label><div class="ac-pv ac-md"></div>' +
          '<button class="ac-bt v" data-acx="enviado">📦 Enviado</button>';
    } else return "";
    return h + "</div>";
  }

  function chatMsg(m) {
    var t = esc(dt(m.criado_em));
    if (m.tipo === "aviso") return '<div class="ac-sis">' + esc(m.texto) + "<br>" + t + "</div>";
    if (m.tipo === "dados_pagamento") {
      var x = m.dados || {};
      return '<div class="ac-dp"><b>📨 Dados de pagamento do transporte enviados</b><br>' + esc(x.transportadora || "") + ": " + din(x.valor_envio, x.moeda) + " + busca e embalagem " + din(x.taxa_servico, x.moeda) +
        " = <b>" + din(x.total, x.moeda) + "</b><br><small>" + (m.nome ? esc(m.nome) + " · " : "") + t + "</small></div>";
    }
    if (m.tipo === "provas") return '<div class="ac-b ou"><span class="nm">Cliente</span><b>📤 Provas de pagamento</b> (' + ((m.dados || {}).meio === "emola" ? "e-Mola" : "M-Pesa") + ')' +
      '<div class="ac-md" data-provas="' + esc(JSON.stringify((m.dados || {}).fotos || [])) + '"></div>' + esc(m.texto) + "<small>" + t + "</small></div>";
    var eu = m.autor !== "cliente";
    return '<div class="ac-b ' + (eu ? "eu" : "ou") + '"><span class="nm">' + (eu ? esc(m.nome || "Agente") : "Cliente") + "</span>" + esc(m.texto) + "<small>" + t + "</small></div>";
  }
  async function provasImg(sb, raiz) {
    raiz.querySelectorAll("[data-provas]").forEach(async function (bx) {
      if (bx.getAttribute("data-ok")) return; bx.setAttribute("data-ok", "1");
      var l = []; try { l = JSON.parse(bx.getAttribute("data-provas")) || []; } catch (e) {}
      for (var k = 0; k < l.length; k++) {
        try { var u = await sb.storage.from("provas-envio").createSignedUrl(l[k], 3600);
          if (u.data && u.data.signedUrl) bx.insertAdjacentHTML("beforeend", '<a href="' + esc(u.data.signedUrl) + '" target="_blank" rel="noopener"><img src="' + esc(u.data.signedUrl) + '" alt="Comprovativo"></a>'); } catch (e) {}
      }
    });
  }
  async function carregarChat(sb, ch, pid) {
    var ms = ch.querySelector(".ac-ms"), r = await sb.rpc("envio_chat_ver", { p_order: pid });
    if (r.error) { ms.innerHTML = '<div class="ac-sis">' + esc(r.error.message) + "</div>"; return; }
    var L = r.data || [];
    ms.innerHTML = L.length ? L.map(chatMsg).join("") : '<div class="ac-sis">Ainda não há mensagens.</div>';
    ms.scrollTop = ms.scrollHeight; provasImg(sb, ms);
  }

  async function enviarFoto(sb, pid, file) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    var caminho = pid + "/entrega-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    var r = await sb.storage.from("verificacoes").upload(caminho, file, { contentType: file.type || undefined, upsert: false });
    if (r.error) throw new Error('"' + file.name + '": ' + r.error.message);
    return sb.storage.from("verificacoes").getPublicUrl(caminho).data.publicUrl;
  }

  async function carregar(sb, el, modo) {
    el.innerHTML = '<div class="ac-vz">A carregar…</div>';
    var r = await sb.rpc("verificacoes_acompanhamento");
    if (r.error) { el.innerHTML = '<div class="ac-c ac-vz">' + esc(/function|exist|find/i.test(r.error.message) ? "Falta correr o SQL novo no Supabase." : r.error.message) + "</div>"; return; }
    var L = r.data || [], FOT = {}, RFOT = {}, URLS = {}, ENV = {}, DEF = {}, ENT = {}, RS = {};
    try { var e2 = await sb.rpc("envio_definicoes_ver"); if (!e2.error && e2.data) DEF = e2.data; } catch (e) {}
    if (L.length) {
      try { var e1 = await sb.rpc("envio_equipa_lista", { p_orders: L.map(function (p) { return p.order_id; }) }); if (!e1.error && e1.data) ENV = e1.data; } catch (e) {}
      try { var e4 = await sb.rpc("verificacao_responsaveis", { p_orders: L.map(function (p) { return p.order_id; }) }); if (!e4.error && e4.data) RS = e4.data; } catch (e) {}
      try { var e5 = await sb.rpc("rececoes_ver", { p_orders: L.map(function (p) { return p.order_id; }) }); if (!e5.error && e5.data) RS.rec = e5.data; } catch (e) {}
    }
    el.innerHTML = (L.length ? L.map(function (p, i) { return caixa(p, i, modo, ENV[String(p.order_id)], DEF, ENT[String(p.order_id)], RS); }).join("") :
      '<div class="ac-c ac-vz">' + (modo === "verificacao" ? "Ainda não há pedidos seus para acompanhar." : "Não há pedidos em acompanhamento.") + "</div>");
    provasImg(sb, el);
    el.querySelectorAll("[data-ac]").forEach(function (c) {
      var i = +c.getAttribute("data-ac"), p = L[i], m = c.querySelector(".ac-m");
      c.addEventListener("change", async function (e) {
        var sel = e.target.closest && e.target.closest("[data-atr]");
        if (sel) {
          e.stopPropagation(); if (!sel.value) return;
          var para = sel.value === "__livre" ? "" : sel.value;
          if (!confirm(para ? "Passar o pedido " + String(p.order_id).slice(0, 8).toUpperCase() + " para " + sel.options[sel.selectedIndex].text + "?" : "Devolver este pedido à lista (fica livre para qualquer agente)?")) { sel.value = ""; return; }
          var qa1 = await sb.rpc("verificacao_atribuir", { p_order: p.order_id, p_email: para });
          if (qa1.error) { m.className = "ac-m"; m.textContent = qa1.error.message; sel.value = ""; return; }
          m.className = "ac-m ok"; m.textContent = para ? "👤 Pedido passado." : "↩️ Pedido devolvido à lista.";
          setTimeout(function () { carregar(sb, el, modo); }, 1000);
          return;
        }
        var inp = e.target; if (!inp || inp.type !== "file") return; e.stopPropagation();
        if (inp.getAttribute("data-rc")) {
          RFOT[i] = (RFOT[i] || []).concat(Array.prototype.slice.call(inp.files)); inp.value = "";
          c.querySelector(".ac-rcv").innerHTML = RFOT[i].map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join("");
          return;
        }
        FOT[i] = (FOT[i] || []).concat(Array.prototype.slice.call(inp.files)); inp.value = ""; URLS[i] = null;
        c.querySelector(".ac-pv").innerHTML = FOT[i].map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join("");
      });
      c.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-acx]"); if (!b) return; e.stopPropagation();
        m.className = "ac-m"; m.textContent = "";
        var acx = b.getAttribute("data-acx"), ok = function (t) { m.className = "ac-m ok"; m.textContent = t; setTimeout(function () { carregar(sb, el, modo); }, 1500); };
        var campo = function (n) { var x = c.querySelector('[data-env="' + n + '"]'); return x ? x.value.trim() : ""; };
        if (acx === "chat") {
          var ch = c.querySelector("[data-chat]"), abre = ch.style.display === "none";
          ch.style.display = abre ? "" : "none"; b.textContent = abre ? "💬 Fechar o chat" : "💬 Chat com o cliente";
          if (abre) carregarChat(sb, ch, p.order_id);
          return;
        }
        if (acx === "apagar") {
          if (!confirm("Apagar o pedido " + String(p.order_id).slice(0, 8).toUpperCase() + " da sua lista? O pedido continua guardado na plataforma.")) return;
          b.disabled = true;
          var qa = await sb.rpc("acomp_apagar", { p_order: p.order_id });
          if (qa.error) { b.disabled = false; m.textContent = qa.error.message; return; }
          c.remove();
          return;
        }
        if (acx === "rececao") {
          if (!(RFOT[i] || []).length) { m.textContent = "Tire pelo menos uma foto do produto entregue ao cliente."; return; }
          var lc = campo("local");
          if (!confirm("Confirmar que o cliente levantou a encomenda do pedido " + String(p.order_id).slice(0, 8).toUpperCase() + (lc === "estacao" ? " na estação BBabilônia?" : " na transportadora?"))) return;
          b.disabled = true; b.textContent = "A enviar fotos…";
          try {
            var ses = (await sb.auth.getSession()).data.session; if (!ses) throw new Error("Entre de novo na sua conta.");
            var cams = [];
            for (var y = 0; y < RFOT[i].length; y++) {
              var ff = RFOT[i][y], ex = ((ff.name || "").split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
              var cm = ses.user.id + "/" + p.order_id + "/rececao-" + Date.now() + "-" + y + "." + ex;
              var up = await sb.storage.from("provas-envio").upload(cm, ff, { contentType: ff.type || undefined, upsert: false });
              if (up.error) throw new Error('"' + (ff.name || y + 1) + '": ' + up.error.message);
              cams.push(cm);
            }
            var qr = await sb.rpc("rececao_confirmar", { p_order: p.order_id, p_fotos: cams, p_local: lc });
            if (qr.error) throw new Error(qr.error.message);
            ok("📍 Receção confirmada. O cliente e o atendimento foram avisados.");
          } catch (er) { b.disabled = false; b.textContent = "✅ Confirmar receção"; m.textContent = er.message; }
          return;
        }
        if (acx === "apagardono") {
          if (!confirm("APAGAR o pedido " + String(p.order_id).slice(0, 8).toUpperCase() + " e tudo o que está ligado a ele?\nNão dá para desfazer.")) return;
          b.disabled = true;
          var qx = await sb.rpc("dono_apagar_pedido", { p_order: p.order_id });
          if (qx.error) { b.disabled = false; m.textContent = qx.error.message; return; }
          c.remove();
          return;
        }
        if (acx === "pegar" || acx === "devolver") {
          if (acx === "devolver" && !confirm("Devolver este pedido à lista? Outro agente poderá pegá-lo.")) return;
          b.disabled = true;
          var qp = acx === "pegar" ? await sb.rpc("verificacao_pegar", { p_order: p.order_id }) : await sb.rpc("verificacao_atribuir", { p_order: p.order_id, p_email: "" });
          if (qp.error) { b.disabled = false; m.textContent = qp.error.message; return; }
          ok(acx === "pegar" ? "✋ O pedido agora é seu. Só você pode trabalhar nele." : "↩️ Pedido devolvido à lista.");
          return;
        }
        if (acx === "recolhi") {
          if (!confirm("Confirmar que já recolheu os produtos deste pedido na loja?")) return;
          b.disabled = true;
          var qr = await sb.rpc("verificacao_agente_recolhido", { p_order: p.order_id });
          if (qr.error) { b.disabled = false; m.textContent = qr.error.message; return; }
          ok("📦 Marcado como recolhido. Agora abra o 💬 chat e toque em \"📨 Compartilhar dados de pagamento de envio\".");
          return;
        }
        if (acx === "dados") { var df = c.querySelector("[data-df]"); df.style.display = df.style.display === "none" ? "" : "none"; return; }
        if (acx === "chatenv") {
          var inp = c.querySelector("[data-chatin]"), tx0 = inp.value.trim(); if (!tx0) return;
          b.disabled = true; var q0 = await sb.rpc("envio_chat_enviar", { p_order: p.order_id, p_texto: tx0 }); b.disabled = false;
          if (q0.error) { m.textContent = q0.error.message; return; }
          inp.value = ""; carregarChat(sb, c.querySelector("[data-chat]"), p.order_id);
          return;
        }
        if (acx === "cotar") {
          var tr = campo("transp"), vl = Number(campo("valor").replace(",", ".")), tx = Number((campo("taxa") || "0").replace(",", "."));
          if (!tr) { m.textContent = "Escreva o nome da transportadora."; return; }
          if (!(vl > 0)) { m.textContent = "Escreva o valor do envio cobrado pela transportadora."; return; }
          if (!(tx >= 0)) { m.textContent = "A taxa de serviço não pode ser negativa."; return; }
          if (!confirm("Enviar ao cliente no chat: transporte " + din(vl, p.moeda) + " + busca e embalagem " + din(tx, p.moeda) + " = " + din(vl + tx, p.moeda) + "?")) return;
          b.disabled = true;
          var q1 = await sb.rpc("envio_cotar", { p_order: p.order_id, p_transportadora: tr, p_valor: vl, p_taxa: tx });
          if (q1.error) { b.disabled = false; m.textContent = q1.error.message; return; }
          ok("📨 Dados de pagamento enviados no chat. O cliente foi avisado.");
          return;
        }
        if (acx === "pagok" || acx === "pagno") {
          var mot = null;
          if (acx === "pagno") { mot = prompt("Motivo (o cliente vai ver):", "O dinheiro não entrou na conta."); if (!mot) return; }
          else if (!confirm("Confirma que o dinheiro do envio entrou na conta?")) return;
          b.disabled = true;
          var q2 = await sb.rpc("envio_confirmar_pagamento", { p_order: p.order_id, p_ok: acx === "pagok", p_motivo: mot });
          if (q2.error) { b.disabled = false; m.textContent = q2.error.message; return; }
          ok(acx === "pagok" ? "✅ Pagamento confirmado. O agente de busca já pode enviar." : "O cliente foi avisado para carregar as provas de novo.");
          return;
        }
        if (acx === "enviado") {
          if (!(FOT[i] || []).length) { m.textContent = "Tire pelo menos uma foto do talão da transportadora ou do pacote."; return; }
          if (!confirm("Confirmar que entregou o pedido " + String(p.order_id).slice(0, 8).toUpperCase() + " na transportadora?")) return;
          b.disabled = true; b.textContent = "A enviar fotos…";
          try {
            var us = [];
            for (var z = 0; z < FOT[i].length; z++) us.push(await enviarFoto(sb, p.order_id, FOT[i][z]));
            var q3 = await sb.rpc("envio_marcar_enviado", { p_order: p.order_id, p_rastreio: campo("rastreio"), p_fotos: us });
            if (q3.error) throw new Error(q3.error.message);
            ok("📦 Enviado. O cliente recebeu o aviso com o número de rastreamento.");
          } catch (er) { b.disabled = false; b.textContent = "📦 Enviado"; m.textContent = er.message; }
          return;
        }
        if (acx === "confirmar") {
          if (!confirm("Confirmar que o pedido " + String(p.order_id).slice(0, 8).toUpperCase() + " foi entregue ao cliente?")) return;
          b.disabled = true;
          var y = await sb.rpc("verificacao_confirmar_entrega", { p_order: p.order_id });
          if (y.error) { b.disabled = false; m.textContent = y.error.message; return; }
          m.className = "ac-m ok"; m.textContent = "✅ Entrega confirmada.";
          setTimeout(function () { carregar(sb, el, modo); }, 1500);
        }
      });
    });
  }
  window.Acomp = { carregar: carregar };
})();
