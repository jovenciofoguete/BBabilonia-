/* pedido-solo.js — BBabilônia (21/11/2026)
   Página ÚNICA da encomenda para atendimento, busca e dono (atd-verificacoes.html?pedido=XXXXXXXX).
   Foto, nome e preço no topo; por baixo as ETAPAS; o trabalho (fotos do agente, Iguais/Diferentes,
   recolher, cotação e chat do transporte, confirmar pagamento, enviar, receção) abre DENTRO da etapa atual.
   Reaproveita as funções da própria página (novo, caixa, extras) e o acompanhamento.js. */
(function () {
  var P = new URLSearchParams(location.search).get("pedido"); if (!P) return;
  var K = P.replace(/-/g, "").slice(0, 8).toUpperCase();
  document.body.classList.add("solo");
  var BUSCA = typeof novo !== "function" && typeof respHtml === "function"; /* confirmar-produto.html (agentes de busca) */
  var st = document.createElement("style");
  st.textContent = ".solo .tabs{display:none}.solo .l1{display:none}" +
    ".sp-top{display:flex;gap:12px;align-items:center}.sp-top img,.sp-top .sf{width:84px;height:84px;border-radius:12px;object-fit:cover;background:#e2e8f0;flex:none}" +
    ".sp-top b{display:block;font-size:16px}.sp-top small{display:block;color:var(--suave)}.sp-pr{color:#059669;font-weight:800;font-size:18px;margin-top:4px}" +
    ".sp-av{background:#fef3c7;border-radius:10px;padding:8px 10px;margin-top:10px;font-size:13.5px;font-weight:700}" +
    ".sp-et{margin-top:4px}.sp-s{display:flex;gap:10px;position:relative;padding-bottom:14px}.sp-s:last-child{padding-bottom:0}.sp-s.wait{opacity:.5}" +
    ".sp-s i{flex:none;width:24px;height:24px;border-radius:50%;background:#cbd5e1;color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:13px;font-weight:800;position:relative;z-index:1}" +
    ".sp-s:not(:last-child):before{content:'';position:absolute;left:11px;top:24px;bottom:0;width:2px;background:#cbd5e1}.sp-s.ok i{background:#10b981}.sp-s.ok:not(:last-child):before{background:#10b981}.sp-s.now i{background:#f59e0b}" +
    ".sp-s .cc{flex:1;min-width:0}.sp-s b.t{display:block;font-size:14.5px}.sp-s small{display:block;font-size:12.5px;color:var(--suave)}.sp-s small.em{color:#d97706;font-weight:800}" +
    ".sp-ms{max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin:10px 0}.sp-b{max-width:86%;padding:9px 12px;border-radius:14px;font-size:14px;white-space:pre-wrap;word-break:break-word}.sp-b b{display:block;font-size:12.5px;color:#0f766e}.sp-b small{display:block;font-size:11.5px;color:#64748b}.sp-b.eu{align-self:flex-end;background:#dbeafe}.sp-b.ou{align-self:flex-start;background:#f1f5f9}.sp-sis{align-self:center;font-size:12.5px;background:#e2e8f0;border-radius:10px;padding:6px 10px}.sp-es{display:flex;gap:6px}.sp-es input{flex:1;min-width:0;padding:11px;border:2px solid #e2e8f0;border-radius:10px;font:inherit}.sp-es button{border:0;border-radius:10px;padding:0 16px;font-weight:800;background:#0ea5e9;color:#fff}.sp-w{border:2px solid #f59e0b;border-radius:14px;padding:10px;margin-top:8px;background:#fffbeb}.sp-w .box,.sp-w .ac-c{box-shadow:none;padding:0;margin:0;background:transparent}.sp-w h3,.sp-w h4{margin-top:12px}";
  document.head.appendChild(st);
  var h1 = document.querySelector(".bar h1"); if (h1) h1.textContent = "📁 Pedido #" + K;

  function casa(x) { return String(x.order_id || x.id || "").replace(/-/g, "").slice(0, 8).toUpperCase() === K; }
  function limpaCaixa(box) {
    box.querySelectorAll("h3").forEach(function (h) {
      if (/O que o cliente pediu/.test(h.textContent)) { var n = h.nextElementSibling; while (n && n.classList.contains("it")) { var t = n.nextElementSibling; n.remove(); n = t; } h.remove(); }
    });
  }
  function podaAcomp(tmp) {
    tmp.querySelectorAll(".ac-c").forEach(function (c) {
      var l1 = c.querySelector(".l1"), tx = l1 ? l1.textContent : "";
      if (tx.toUpperCase().indexOf(K) < 0) { c.remove(); return; }
      var cx = c.querySelectorAll(".ac-cx"); cx.forEach(function (x) { if (/^\s*🧾/.test(x.textContent)) x.remove(); });
      var l5 = c.querySelector(".ac-l5"); if (l5) l5.remove();
    });
  }
  async function solo() {
    var el = $("lista"); el.innerHTML = '<div class="vz">A carregar…</div>';
    var s = (await sb.auth.getSession()).data.session;
    if (!s && BUSCA) return;
    if (!s) { el.innerHTML = ADM ? '<div class="box vz">Entre primeiro no <a href="/">painel do dono</a> (neste mesmo navegador).</div>' : '<div class="box vz">Entre primeiro no <a href="atendimento.html">Atendimento</a>.</div>'; return; }
    if (!ADM && !BUSCA) { try { var pc = await sb.rpc("perfil_meu_completo"); if (!pc.error && pc.data === false) { location.replace("agente-perfil.html?obrigatorio=1&voltar=atd-verificacoes.html"); return; } } catch (x) {} }
    var E = null, er = "";
    try { var r = await sb.rpc("pedido_etapas_pref", { p_pref: K }); if (r.error) er = r.error.message; else E = r.data; } catch (e) { er = String(e); }
    if (!E) { el.innerHTML = '<div class="box vz">' + esc(er || "Não foi possível abrir a encomenda.") + "</div>"; return; }
    var nv = [], vf = [], tmp = null;
    if (BUSCA) {
      /* agente de busca: procura o pedido nas abas dele e guarda a aba para o caixa() desenhar o trabalho certo */
      var abas = ["verificar", "enviadas", "recolher"];
      for (var ai = 0; ai < abas.length && !vf.length; ai++) {
        try { var la = await sb.rpc("verificacao_agente_lista", { p_aba: abas[ai] }); if (la.error && /não foi aprovada/i.test(la.error.message)) { iniciar(); return; } vf = (la.data || []).filter(casa); if (vf.length) ABA = abas[ai]; } catch (e) {}
      }
      RESP = { pedidos: {}, agentes: [], eu: "", dono: false };
      if (vf.length) { try { var rr = await sb.rpc("verificacao_responsaveis", { p_orders: [vf[0].order_id] }); if (!rr.error && rr.data && rr.data.pedidos) RESP = rr.data; } catch (e) {} }
      L = vf;
    } else {
      try { var a = await sb.rpc("atendimento_novos_pedidos"); nv = (a.data || []).filter(casa); } catch (e) {}
      try { var b = await sb.rpc("verificacoes_atendimento", { p_todas: true }); vf = (b.data || []).filter(casa); } catch (e) {}
      await extras([(nv[0] || vf[0] || {}).order_id || E.id]);
      L = vf;
    }
    try { tmp = document.createElement("div"); await window.Acomp.carregar(sb, tmp, BUSCA ? "verificacao" : "atendimento"); podaAcomp(tmp); if (!tmp.querySelector(".ac-c")) tmp = null; } catch (e) { tmp = null; }
    var prods = arr(E.produtos), p0 = prods[0] || {};
    var et = E.etapas || [], atual = -1; for (var q = 0; q < et.length; q++) { if (!et[q].d) { atual = q; break; } }
    var h = '<div class="box"><div class="sp-top">' + (p0.foto ? '<img src="' + esc(p0.foto) + '" alt="">' : '<div class="sf"></div>') +
      '<div><b>' + esc(p0.nome || "Produto") + "</b><small>" + esc([p0.cor, p0.tamanho].filter(Boolean).join(" · ")) + (p0.qtd ? " × " + esc(p0.qtd) : "") + "</small>" +
      '<div class="sp-pr">' + din(E.total, E.moeda) + "</div></div></div>" + (prods.length > 1 ? '<small style="color:#64748b">+ ' + (prods.length - 1) + " produto(s)</small>" : "") +
      (E.cancelado ? '<div class="sp-av">Encomenda cancelada.</div>' : E.disputa ? '<div class="sp-av">⚠️ Há uma disputa nesta encomenda.</div>' : "") + "</div>";
    h += '<div class="box"><h3 style="margin-top:0">Etapas da encomenda</h3><div class="sp-et">' + et.map(function (e, i) {
      var cl = e.d ? "ok" : i === atual && !E.cancelado ? "now" : "wait";
      return '<div class="sp-s ' + cl + '"><i>' + (e.d ? "✓" : i === atual ? "●" : "") + '</i><div class="cc"><b class="t">' + esc(e.t) + "</b>" + (e.em ? "<small>" + esc(dt(e.em)) + "</small>" : "") +
        (e.n && (e.d || i === atual) ? "<small>" + esc(e.n) + "</small>" : "") + (i === atual && !E.cancelado ? '<small class="em">Em curso</small><div class="sp-w" id="sp-w"></div>' : "") + "</div></div>";
    }).join("") + "</div></div>";
    el.innerHTML = h;
    /* 💬 chat do pedido (Moçambique): cliente · agentes de busca · atendimento · dono. Depois da recolha o chat do acompanhamento (com a cotação do transporte) já vem dentro da etapa. */
    if (!tmp && (E.mz || /^MZ$/i.test(String(E.pais || "")))) {
      var cb = document.createElement("div"); cb.className = "box"; cb.innerHTML = '<h3 style="margin-top:0">💬 Chat do pedido</h3><small style="color:#64748b">Conversa com o cliente. Também vê quem é do atendimento e o dono.</small><div id="sp-ms" class="sp-ms"></div><div class="sp-es"><input id="sp-in" maxlength="1000" placeholder="Escreva ao cliente"><button type="button" id="sp-en">Enviar</button></div><div class="msg" id="sp-m"></div>';
      el.appendChild(cb);
      var pintaChat = async function () {
        var rr = await sb.rpc("envio_chat_ver", { p_order: E.id }), ms = $("sp-ms");
        if (rr.error) { ms.innerHTML = '<div class="sp-b ou">' + esc(rr.error.message) + "</div>"; return; }
        var Lm = rr.data || [];
        ms.innerHTML = Lm.length ? Lm.map(function (m) {
          if (m.tipo === "aviso") return '<div class="sp-sis">' + esc(m.texto) + "</div>";
          var eu = m.autor !== "cliente";
          return '<div class="sp-b ' + (eu ? "eu" : "ou") + '"><b>' + (eu ? esc(m.nome || "Equipa") : "Cliente") + "</b>" + esc(m.texto || "") + "<small>" + esc(dt(m.criado_em)) + "</small></div>";
        }).join("") : '<div class="sp-sis">Ainda não há mensagens.</div>';
        ms.scrollTop = ms.scrollHeight;
      };
      $("sp-en").onclick = async function () {
        var i = $("sp-in"), t = i.value.trim(); if (!t) return;
        $("sp-en").disabled = true; var q = await sb.rpc("envio_chat_enviar", { p_order: E.id, p_texto: t }); $("sp-en").disabled = false;
        if (q.error) { $("sp-m").textContent = q.error.message; return; }
        $("sp-m").textContent = ""; i.value = ""; pintaChat();
      };
      pintaChat();
    }
    var w = $("sp-w");
    if (w) {
      if (tmp) { w.appendChild(tmp); new MutationObserver(function () { podaAcomp(tmp); }).observe(tmp, { childList: true }); }
      else if (vf.length) { w.innerHTML = caixa(vf[0], 0); limpaCaixa(w); }
      else if (nv.length) { w.innerHTML = novo(nv[0]); limpaCaixa(w); }
      else w.innerHTML = '<div class="vz" style="padding:8px">Nada para fazer aqui agora. 👍</div>';
    }
  }
  window.carregar = carregar = solo;
  if (!BUSCA || !$("vApp").classList.contains("hide")) solo(); /* na busca arranca quando a página termina o login/aprovação e chama carregar() */
})();
