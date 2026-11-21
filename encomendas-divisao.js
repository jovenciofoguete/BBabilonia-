/* encomendas-divisao.js — BBabilônia (21/11/2026)
   Encomendas divididas em duas abas, igual para agentes (busca e atendimento), dono e fornecedor:
     [ Novos pedidos ] [ Pedidos em processo ]
   - Novos pedidos: só as encomendas pagas em que ainda ninguém fez a primeira etapa.
   - Pedidos em processo: as que já foram atendidas e esperam a próxima etapa.
     Quando o agente abre um pedido novo e faz a primeira etapa, a encomenda passa sozinha para "em processo".
   - A notificação fica NA PRÓPRIA ENCOMENDA (número vermelho) e no CABEÇALHO de cada aba
     (ex.: o cliente pagou o transporte → número no cabeçalho de "Pedidos em processo").
   - Para ir aos pedidos em processo: arrastar o ecrã para a esquerda (ou tocar na aba). Para voltar: arrastar para a direita.
   Uso: BBEnc.montar(el, { sb, grupos:[{k:'5E2C7CC8', itens:[avisos…]}], destino:function(k){return url}, ler:function(itens){return Promise},
                          antigas:n, abrirAntigas:fn, outros:{itens:[…]}, abrirOutros:fn })  */
(function () {
  if (window.BBEnc) return;
  var ET = {}, PEND = {}, QUANDO = {}, ABA = {};
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
  function naoLidos(g) { return g.itens.filter(function (a) { return a.lido !== true; }); }
  function atual(E) { var et = (E && E.etapas) || []; for (var i = 0; i < et.length; i++) if (!et[i].d) return i; return et.length; }
  function feitas(E) { return ((E && E.etapas) || []).filter(function (e) { return e.d; }).length; }
  /* novo = só a etapa "Pago" feita (ninguém fez ainda a primeira etapa de trabalho) */
  function eNovo(E) { return !E.cancelado && feitas(E) <= 1; }

  function css() {
    if (document.getElementById("bbe-css")) return;
    var s = document.createElement("style"); s.id = "bbe-css";
    s.textContent =
      ".bbe{background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 4px 14px #0f172a1a;margin:0 0 12px;overflow:hidden;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;border:2px solid #1e3a8a}" +
      ".bbe-tb{display:flex;border-bottom:2px solid #1e3a8a}.bbe-tb button{flex:1;position:relative;border:0;background:#f8fafc;color:#475569;padding:14px 6px;font:800 14.5px system-ui,sans-serif;cursor:pointer}" +
      ".bbe-tb button+button{border-left:2px solid #1e3a8a}.bbe-tb button.on{background:#1e3a8a;color:#fff}" +
      ".bbe-tb i{min-width:22px;height:22px;border-radius:11px;background:#dc2626;color:#fff;font:800 12px system-ui,sans-serif;font-style:normal;display:none;align-items:center;justify-content:center;padding:0 6px;border:2px solid #fff;margin-left:6px;vertical-align:middle;box-sizing:border-box}" +
      ".bbe-tb i.v{display:inline-flex}.bbe-tb small{display:block;font-weight:600;font-size:11.5px;opacity:.8;margin-top:2px}" +
      ".bbe-vp{overflow:hidden;touch-action:pan-y;overscroll-behavior-x:none}html:has(.bbe){overscroll-behavior-x:none}.bbe-tr{display:flex;width:200%;transition:transform .28s ease}.bbe-pn{width:50%;padding:10px;max-height:62vh;overflow-y:auto;box-sizing:border-box;touch-action:pan-y;overscroll-behavior:contain}" +
      ".bbe-c{display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:10px;margin:0 0 8px;font:inherit;color:inherit;cursor:pointer;box-sizing:border-box}" +
      ".bbe-c.nv{background:#fff7ed;border-color:#fdba74}.bbe-c img,.bbe-c .sf{width:60px;height:60px;border-radius:10px;object-fit:cover;background:#e2e8f0;flex:none;display:flex;align-items:center;justify-content:center;font-size:24px}" +
      ".bbe-c .tx{flex:1;min-width:0}.bbe-c b{display:block;font-size:14.5px}.bbe-c .no{display:block;font-size:13px;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".bbe-c .pr{color:#059669;font-weight:800}.bbe-c small{display:block;font-size:12.5px;color:#64748b;margin-top:2px}.bbe-c small.av{color:#c2410c;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".bbe-c .nb{min-width:26px;height:26px;border-radius:13px;background:#dc2626;color:#fff;font:800 13px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:0 7px;flex:none}.bbe-c .ct{color:#94a3b8;font-size:20px;flex:none}" +
      ".bbe-vz{text-align:center;color:#64748b;padding:26px 8px;font-size:14px}.bbe-dc{text-align:center;color:#94a3b8;font-size:12px;padding:2px 0 8px}" +
      ".bbe-x{display:flex;gap:8px;padding:0 10px 10px}.bbe-x button{flex:1;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;border-radius:12px;padding:10px 6px;font:700 13px system-ui,sans-serif;cursor:pointer;position:relative}.bbe-x button i{font-style:normal;background:#dc2626;color:#fff;border-radius:10px;padding:0 6px;font-size:11.5px;margin-left:4px}";
    document.head.appendChild(s);
  }

  /* etapas de cada encomenda (pedido_etapas_pref); renova a cada 60 s */
  function carregarEtapas(sb, ks, depois) {
    var agora = Date.now();
    ks.filter(function (k) { return k && !PEND[k] && (!ET[k] || agora - (QUANDO[k] || 0) > 60000); }).slice(0, 40).forEach(function (k) {
      PEND[k] = 1;
      Promise.resolve(sb.rpc("pedido_etapas_pref", { p_pref: k })).then(function (r) {
        delete PEND[k]; QUANDO[k] = Date.now();
        var novo = r && !r.error && r.data ? r.data : (ET[k] || { erro: 1 });
        var mudou = JSON.stringify(novo) !== JSON.stringify(ET[k]); ET[k] = novo;
        if (mudou && depois) depois();
      }, function () { delete PEND[k]; QUANDO[k] = Date.now(); if (!ET[k]) { ET[k] = { erro: 1 }; if (depois) depois(); } });
    });
  }

  function cartao(g) {
    var E = ET[g.k] || {}, p0 = arr(E.produtos)[0] || {}, nl = naoLidos(g), et = E.etapas || [], i = atual(E);
    var etapa = E.erro ? "" : E.cancelado ? "❌ Cancelada" : !et.length ? "A carregar…" : i >= et.length ? "✅ Concluída" : "⏳ " + et[i].t;
    return '<button type="button" class="bbe-c' + (nl.length ? " nv" : "") + '" data-bbe-k="' + esc(g.k) + '">' +
      (p0.foto ? '<img src="' + esc(p0.foto) + '" alt="" loading="lazy">' : '<span class="sf">🛍️</span>') +
      '<span class="tx"><b>Pedido #' + esc(g.k) + "</b>" +
      (p0.nome || E.total ? '<span class="no">' + esc(p0.nome || "") + (E.total ? ' · <span class="pr">' + esc(din(E.total, E.moeda)) + "</span>" : "") + "</span>" : "") +
      (etapa ? "<small>" + esc(etapa) + "</small>" : "") +
      (nl.length ? '<small class="av">🔔 ' + esc(nl[0].titulo || "Novidade") + "</small>" : "") + "</span>" +
      (nl.length ? '<span class="nb">' + nl.length + "</span>" : '<span class="ct">›</span>') + "</button>";
  }

  function montar(el, o) {
    if (!el) return;
    css();
    var id = o.id || "geral";
    if (ABA[id] == null) ABA[id] = 0;
    var grupos = (o.grupos || []).filter(function (g) { return g.k; });
    carregarEtapas(o.sb, grupos.map(function (g) { return g.k; }), function () { if (el.isConnected) montar(el, o); });
    var novos = [], proc = [];
    grupos.forEach(function (g) {
      var E = ET[g.k];
      if (!E || E.erro) (naoLidos(g).length || !E ? novos : proc).push(g); /* ainda sem etapas: fica nos novos até saber */
      else (eNovo(E) ? novos : proc).push(g);
    });
    function soma(l) { return l.reduce(function (s, g) { return s + naoLidos(g).length; }, 0); }
    var nN = soma(novos), nP = soma(proc), oN = o.outros ? naoLidos(o.outros).length : 0;
    var h = '<div class="bbe-tb"><button type="button" data-bbe-t="0" class="' + (ABA[id] === 0 ? "on" : "") + '">🆕 Novos pedidos<i class="' + (nN ? "v" : "") + '">' + (nN > 99 ? "99+" : nN) + '</i><small>' + novos.length + (novos.length === 1 ? " encomenda" : " encomendas") + "</small></button>" +
      '<button type="button" data-bbe-t="1" class="' + (ABA[id] === 1 ? "on" : "") + '">⚙️ Pedidos em processo<i class="' + (nP ? "v" : "") + '">' + (nP > 99 ? "99+" : nP) + '</i><small>' + proc.length + (proc.length === 1 ? " encomenda" : " encomendas") + "</small></button></div>" +
      '<div class="bbe-vp"><div class="bbe-tr" style="transform:translateX(' + (ABA[id] ? "-50%" : "0") + ')">' +
      '<div class="bbe-pn">' + (novos.length ? novos.map(cartao).join("") : '<div class="bbe-vz">Não há pedidos novos. 👍</div>') + (proc.length ? '<div class="bbe-dc">Arraste para a esquerda ← para ver os pedidos em processo</div>' : "") + "</div>" +
      '<div class="bbe-pn">' + (proc.length ? proc.map(cartao).join("") : '<div class="bbe-vz">Não há pedidos em processo.</div>') + '<div class="bbe-dc">→ Arraste para a direita para voltar aos novos pedidos</div></div>' +
      "</div></div>";
    if (o.antigas || o.outros) h += '<div class="bbe-x">' + (o.antigas ? '<button type="button" data-bbe-a="1">🗂️ Encomendas antigas</button>' : "") + (o.outros && o.outros.itens.length ? '<button type="button" data-bbe-o="1">📋 Outros avisos' + (oN ? "<i>" + oN + "</i>" : "") + "</button>" : "") + "</div>";
    var sc = el.querySelectorAll(".bbe-pn"), st = [sc[0] ? sc[0].scrollTop : 0, sc[1] ? sc[1].scrollTop : 0];
    el.className = "bbe"; el.innerHTML = h;
    sc = el.querySelectorAll(".bbe-pn"); sc[0].scrollTop = st[0]; sc[1].scrollTop = st[1];
    el.__bbeO = o;
    if (el.__bbeL) return;
    el.__bbeL = 1;
    function irAba(n) { ABA[id] = n; var tr = el.querySelector(".bbe-tr"); if (tr) tr.style.transform = "translateX(" + (n ? "-50%" : "0") + ")"; el.querySelectorAll("[data-bbe-t]").forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-bbe-t") === n); }); }
    el.addEventListener("click", function (e) {
      var O = el.__bbeO, x;
      if ((x = e.target.closest("[data-bbe-t]"))) { irAba(+x.getAttribute("data-bbe-t")); return; }
      if (e.target.closest("[data-bbe-a]")) { if (O.abrirAntigas) O.abrirAntigas(); return; }
      if (e.target.closest("[data-bbe-o]")) { if (O.abrirOutros) O.abrirOutros(); return; }
      if ((x = e.target.closest("[data-bbe-k]"))) {
        if (el.__bbeArrastou) return;
        var k = x.getAttribute("data-bbe-k"), g = (O.grupos || []).filter(function (z) { return z.k === k; })[0], dst = O.destino ? O.destino(k, g) : "";
        x.disabled = true;
        Promise.race([Promise.resolve(O.ler && g ? O.ler(g.itens) : null).catch(function () {}), new Promise(function (ok) { setTimeout(ok, 900); })]).then(function () { if (dst) location.href = dst; else x.disabled = false; });
      }
    });
    /* arrastar: esquerda → pedidos em processo; direita → novos pedidos */
    var x0 = 0, y0 = 0, dx = 0, ativo = false, horiz = null;
    el.addEventListener("touchstart", function (e) { if (!e.target.closest(".bbe-vp")) return; var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; ativo = true; horiz = null; el.__bbeArrastou = false; }, { passive: true });
    el.addEventListener("touchmove", function (e) {
      if (!ativo) return; var t = e.touches[0]; dx = t.clientX - x0; var dy = t.clientY - y0;
      if (horiz === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) horiz = Math.abs(dx) > Math.abs(dy);
      if (!horiz) return;
      var tr = el.querySelector(".bbe-tr"), w = el.querySelector(".bbe-vp").offsetWidth || 1, base = ABA[id] ? -w : 0;
      tr.style.transition = "none"; tr.style.transform = "translateX(" + Math.max(-w, Math.min(0, base + dx)) + "px)";
    }, { passive: true });
    el.addEventListener("touchend", function () {
      if (!ativo) return; ativo = false; var tr = el.querySelector(".bbe-tr"); if (tr) tr.style.transition = "";
      if (horiz && Math.abs(dx) > 50) { el.__bbeArrastou = true; setTimeout(function () { el.__bbeArrastou = false; }, 350); irAba(dx < 0 ? 1 : 0); }
      else irAba(ABA[id]);
    });
  }
  window.BBEnc = { montar: montar, etapas: function (k) { return ET[k]; } };
})();
