/* acompanhamento.js — B-Babilônia (13/11/2026)
   Separador "🚚 Acompanhar" do pedido depois da verificação, até a entrega ser confirmada.
   - Busca e verificação (confirmar-produto.html): vê os pedidos que verificou; depois de recolher,
     tira a foto da entrega e toca em "🚚 Entreguei ao cliente".
   - Atendimento e dono (atd-verificacoes.html): veem todos e tocam em "✅ Confirmar entrega".
   Em cada pedido: quem verificou, quem confirmou no atendimento, recolha, entrega e confirmação. */
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

  function caixa(p, i, modo) {
    var fim = p.entrega_confirmada_em || p.cliente_confirmou_em, entregue = !!p.entregue_em, recolhido = p.estado === "recolhido";
    var est = fim ? ["✅ Entrega confirmada", "v"] : entregue ? ["🚚 Entregue · à espera de confirmação", "z"] : recolhido ? ["📦 Recolhido · a caminho do cliente", "a"] : ["✅ Confirmado · por recolher na loja", "a"];
    var h = '<div class="ac-c" data-ac="' + i + '"><div class="l1"><span>Pedido ' + esc(String(p.order_id).slice(0, 8).toUpperCase()) + " · " + din(p.total, p.moeda) + "</span><span>" + esc(dt(p.criado)) + "</span></div>" +
      '<span class="ac-est ' + est[1] + '">' + est[0] + "</span>" +
      '<div class="ac-cx">🧾 ' + itens(p.itens) + "</div>" +
      '<div class="ac-cx">🏪 <b>' + esc(p.loja_nome || "Loja") + "</b>" + (p.loja_local ? "<br>" + esc(p.loja_local) : "") + (p.loja_endereco ? "<br>📍 " + esc(p.loja_endereco) : "") + tel(p.loja_telefone).replace(" · ", "<br>") + "</div>" +
      '<div class="ac-cx">🙋 Cliente: <b>' + esc(p.cliente_nome || "—") + "</b>" + tel(p.cliente_telefone) + (p.cliente_endereco ? "<br>📍 " + esc(p.cliente_endereco) : "") + "</div>" +
      '<ul class="ac-tl">' +
      passo(true, false, "💳 Pago pelo cliente", p.pago_em || p.criado, "") +
      passo(!!p.verificado_em, false, "🛡️ Verificado na loja", p.verificado_em, pessoa(p.agente_nome, p.agente_email, p.agente_telefone), midia(p.fotos, p.videos)) +
      passo(!!p.decidido_em, false, "🎧 Confirmado pelo atendimento (iguais ao pedido)", p.decidido_em, pessoa(p.atendente_nome, p.atendente_email, p.atendente_telefone) + (p.motivo_atendimento ? "<br>Nota: " + esc(p.motivo_atendimento) : "")) +
      passo(!!p.libertado, false, "💰 Valor libertado ao fornecedor", "", p.erro_libertar ? "Não libertado: " + esc(p.erro_libertar) : "") +
      passo(recolhido, !recolhido, "📦 Recolhido na loja", p.recolhido_em, recolhido ? pessoa(p.agente_nome, p.agente_email, p.agente_telefone) : "") +
      passo(entregue, recolhido && !entregue, "🚚 Entregue ao cliente", p.entregue_em, entregue ? pessoa(p.entregue_nome, p.entregue_por, p.entregue_telefone) : "", midia(p.entrega_fotos)) +
      passo(!!fim, entregue && !fim, "✅ Entrega confirmada", fim, p.entrega_confirmada_em ? pessoa(p.confirmou_nome, p.entrega_confirmada_por, "") : p.cliente_confirmou_em ? "Pelo cliente" : "") +
      "</ul>";
    if (modo === "verificacao" && recolhido && !entregue)
      h += '<label class="ac-up">📷 Foto da entrega ao cliente<input type="file" accept="image/*" multiple></label><div class="ac-pv ac-md"></div>' +
        '<button class="ac-bt v" data-acx="entregar">🚚 Entreguei ao cliente</button><div class="ac-m"></div>';
    if (modo === "atendimento" && entregue && !fim)
      h += '<button class="ac-bt v" data-acx="confirmar">✅ Confirmar entrega</button><div class="ac-m"></div>';
    return h + "</div>";
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
    var L = r.data || [], FOT = {};
    el.innerHTML = L.length ? L.map(function (p, i) { return caixa(p, i, modo); }).join("") :
      '<div class="ac-c ac-vz">' + (modo === "verificacao" ? "Ainda não há pedidos seus para acompanhar." : "Não há pedidos em acompanhamento.") + "</div>";
    el.querySelectorAll("[data-ac]").forEach(function (c) {
      var i = +c.getAttribute("data-ac"), p = L[i], m = c.querySelector(".ac-m");
      c.addEventListener("change", function (e) {
        var inp = e.target; if (!inp || inp.type !== "file") return; e.stopPropagation();
        FOT[i] = (FOT[i] || []).concat(Array.prototype.slice.call(inp.files)); inp.value = "";
        c.querySelector(".ac-pv").innerHTML = FOT[i].map(function (f) { return '<img src="' + URL.createObjectURL(f) + '" alt="">'; }).join("");
      });
      c.addEventListener("click", async function (e) {
        var b = e.target.closest("[data-acx]"); if (!b) return; e.stopPropagation();
        m.className = "ac-m"; m.textContent = "";
        if (b.getAttribute("data-acx") === "entregar") {
          if (!(FOT[i] || []).length) { m.textContent = "Tire pelo menos uma foto da entrega ao cliente."; return; }
          if (!confirm("Confirmar que entregou o pedido " + String(p.order_id).slice(0, 8).toUpperCase() + " ao cliente?")) return;
          b.disabled = true; b.textContent = "A enviar fotos…";
          try {
            var urls = [];
            for (var k = 0; k < FOT[i].length; k++) urls.push(await enviarFoto(sb, p.order_id, FOT[i][k]));
            var x = await sb.rpc("verificacao_agente_entregue", { p_order: p.order_id, p_fotos: urls });
            if (x.error) throw new Error(x.error.message);
            m.className = "ac-m ok"; m.textContent = "🚚 Entrega marcada. O cliente e o atendimento foram avisados.";
            setTimeout(function () { carregar(sb, el, modo); }, 1500);
          } catch (er) { b.disabled = false; b.textContent = "🚚 Entreguei ao cliente"; m.textContent = er.message; }
        } else {
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
