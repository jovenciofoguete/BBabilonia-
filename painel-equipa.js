/* painel-equipa.js — BBabilônia (22/11/2026) · painel do dono (administrator.bbabilonia.com)
   Só acrescenta 3 cartões ao Início; não muda os outros.
   - 👥 Os meus agentes: todos os agentes de atendimento e de busca com foto, nome, telemóvel, província, cidade, bairro e documentos;
     cada um com "💬 Conversar" (chat individual).
   - 💬 Mensagens: todas as conversas individuais (agentes e fornecedores) → equipa-chat.html.
   - 🏪 Lojas na plataforma: quantas lojas há (por estado e por país) e a lista, cada uma com "💬 Conversar" com o fornecedor.
   Seta ← e botão voltar do telemóvel: voltam um passo de cada vez (lista ← vista ← Início).
   Ecrã firme: sem deslizar para os lados. Carregado pelo painel-admin-rececao.js. */
(function () {
  if (window.__bbPainelEquipa) return; window.__bbPainelEquipa = 1;
  if (!/^(admin|administrator)\./i.test(location.hostname)) return;
  var d = document;
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function dt(x) { try { return x ? new Date(x).toLocaleDateString("pt-PT") : "—"; } catch (e) { return "—"; } }
  function foto(u, em) { return u ? '<img src="' + esc(u) + '" alt="" loading="lazy">' : '<span class="sf">' + (em || "👤") + "</span>"; }
  function erro(e) { var t = String(e && e.message || e); return /function|find|relation|exist/i.test(t) ? "Falta correr o SQL novo no Supabase (PARTE A)." : t; }
  function equipa(l) { l = l || []; return l.indexOf("atendimento") > -1 && l.indexOf("verificacao") > -1 ? "🎧🛡️ Atendimento e busca" : l.indexOf("verificacao") > -1 ? "🛡️ Busca e verificação" : "🎧 Atendimento"; }
  var EST = { aprovada: ["✅ Aprovada", "v"], pendente: ["⏳ Pendente", ""], suspensa: ["⛔ Suspensa", "r"], rejeitada: ["❌ Rejeitada", "r"], fechada: ["Fechada", "r"] };
  var VISTA = "", AG = [], LJ = null, FA = "todos", FL = "todas";

  var css = d.createElement("style");
  css.textContent =
    "html,body{overflow-x:hidden;overscroll-behavior-x:none}" +
    "#pe-v{touch-action:pan-y}#pe-v .voltar{display:inline-block;border:0;background:#fff;border-radius:20px;padding:9px 14px;font:700 14px Arial,sans-serif;margin:0 0 10px;box-shadow:0 2px 8px #0f172a14;color:#0f172a}" +
    "#pe-v .pe-f{display:flex;gap:6px;margin:0 0 10px}#pe-v .pe-f button{flex:1;border:0;border-radius:12px;padding:10px 4px;font:800 13px Arial,sans-serif;background:#fff;color:#475569}#pe-v .pe-f button.on{background:#1e3a8a;color:#fff}" +
    "#pe-v .pe-a{display:flex;gap:12px;align-items:flex-start}#pe-v .pe-a img,#pe-v .pe-a .sf{width:64px;height:64px;border-radius:50%;object-fit:cover;background:#e2e8f0;flex:none;display:flex;align-items:center;justify-content:center;font-size:28px}" +
    "#pe-v .pe-a .t{flex:1;min-width:0}#pe-v .pe-a b{display:block;font-size:16px}#pe-v .pe-a small{display:block;font-size:12.5px;color:#64748b}" +
    "#pe-v .pe-d{background:#f8fafc;border-radius:12px;padding:10px;font-size:13.5px;margin-top:10px;line-height:1.6;word-break:break-word}#pe-v .pe-d a{color:#1d4ed8;font-weight:700}" +
    "#pe-v .pe-bi{display:block;width:100%;height:180px;object-fit:contain;border-radius:10px;background:#f1f5f9;margin-top:8px}" +
    "#pe-v .pe-c{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:10px;border:0;border-radius:12px;padding:12px;font:800 14.5px Arial,sans-serif;color:#fff;background:#2563eb;text-decoration:none}" +
    "#pe-v .pe-c i{font-style:normal;background:#dc2626;border-radius:10px;padding:0 7px;font-size:12px}" +
    "#pe-v .pe-n{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px}#pe-v .pe-n div{background:#fff;border-radius:14px;padding:12px;box-shadow:0 2px 8px #0f172a12;text-align:center}" +
    "#pe-v .pe-n b{display:block;font-size:26px;color:#1e3a8a}#pe-v .pe-n span{font-size:12.5px;color:#64748b}" +
    "#pe-v .pe-p{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}#pe-v .pe-p span{background:#fff;border-radius:20px;padding:5px 10px;font-size:12.5px;font-weight:700;box-shadow:0 1px 4px #0f172a14}" +
    "#pe-v input.pe-q{margin-bottom:10px}";
  d.head.appendChild(css);

  function cartoes() {
    var ini = $("t-inicio"); if (!ini || $("pe-c-ag")) return;
    var grids = ini.querySelectorAll(".grid");
    var gAg = null, gLj = grids[0] || null;
    Array.prototype.forEach.call(ini.querySelectorAll("h2"), function (h) { if (/agentes/i.test(h.textContent) && h.nextElementSibling && h.nextElementSibling.classList.contains("grid")) gAg = h.nextElementSibling; });
    if (gAg) gAg.insertAdjacentHTML("afterbegin",
      '<a id="pe-c-ag" class="c k7" href="#" data-pe="agentes"><span class="i">👥</span><b>Os meus agentes</b><span>Atendimento e busca: perfil completo, documentos e conversa</span><em id="pe-n-ag" class="hide"></em></a>' +
      '<a id="pe-c-msg" class="c k5" href="equipa-chat.html"><span class="i">💬</span><b>Mensagens</b><span>Conversas individuais com agentes e fornecedores</span><em id="pe-n-msg" class="hide"></em></a>');
    if (gLj) gLj.insertAdjacentHTML("beforeend",
      '<a id="pe-c-lj" class="c k3" href="#" data-pe="lojas"><span class="i">🏬</span><b>Lojas na plataforma</b><span id="pe-lj-sub">Quantas lojas há e conversar com cada fornecedor</span></a>');
    contar();
  }
  async function contar() {
    try {
      var r = await window.sb.rpc("equipa_chat_nao_lidos");
      var n = r.error ? 0 : Number(r.data || 0), e = $("pe-n-msg");
      if (e) { e.textContent = n; e.classList.toggle("hide", !n); }
    } catch (e) {}
    try {
      var l = await window.sb.rpc("dono_lojas_lista");
      if (!l.error && l.data) { LJ = l.data; var s = $("pe-lj-sub"); if (s) s.textContent = l.data.total + (l.data.total === 1 ? " loja na plataforma" : " lojas na plataforma"); }
    } catch (e) {}
  }

  /* ---------- vistas dentro do painel (com passos no histórico) ---------- */
  function contentor() {
    var v = $("pe-v");
    if (!v) { v = d.createElement("div"); v.id = "pe-v"; v.className = "hide"; var ini = $("t-inicio"); ini.parentNode.insertBefore(v, ini.nextSibling); }
    return v;
  }
  function esconderOutros(sim) {
    ["t-inicio", "t-produtos", "t-pedidos", "t-extra"].forEach(function (x) { var e = $(x); if (e && sim) e.classList.add("hide"); });
    if (!sim) { var i = $("t-inicio"); if (i) i.classList.remove("hide"); }
    var tb = $("tabs"); if (tb) tb.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", !sim && b.getAttribute("data-t") === "inicio"); });
  }
  function abrir(v, empurrar) {
    VISTA = v;
    if (empurrar) { try { history.pushState({ pe: v }, "", location.pathname + location.search + "#pe-" + v); } catch (e) {} }
    esconderOutros(true);
    var c = contentor(); c.classList.remove("hide"); window.scrollTo(0, 0);
    if (v === "agentes") agentes(); else lojas();
  }
  function fechar() {
    VISTA = ""; var c = $("pe-v"); if (c) { c.classList.add("hide"); c.innerHTML = ""; }
    esconderOutros(false); window.scrollTo(0, 0);
  }
  function voltar() { if (history.state && history.state.pe) history.back(); else { fechar(); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} } }
  window.addEventListener("popstate", function (e) {
    var v = e.state && e.state.pe;
    if (v) abrir(v, false); else if (VISTA) fechar();
  });

  /* ---------- 👥 Os meus agentes ---------- */
  async function agentes() {
    var c = contentor();
    c.innerHTML = '<button class="voltar" data-pe-v="1">← Voltar ao início</button><div class="box"><b>👥 Os meus agentes</b>' +
      '<div class="pe-f" style="margin-top:10px"><button data-pe-fa="todos">Todos</button><button data-pe-fa="atendimento">🎧 Atendimento</button><button data-pe-fa="verificacao">🛡️ Busca</button></div>' +
      '<input class="pe-q" id="pe-qa" placeholder="🔍 Procurar pelo nome"></div><div id="pe-la"><div class="vz">A carregar…</div></div>';
    var r = await window.sb.rpc("dono_agentes_lista");
    if (VISTA !== "agentes") return;
    if (r.error) { $("pe-la").innerHTML = '<div class="box vz">' + esc(erro(r.error)) + "</div>"; return; }
    AG = r.data || []; pintarAgentes();
    $("pe-qa").oninput = pintarAgentes;
  }
  function pintarAgentes() {
    var el = $("pe-la"); if (!el) return;
    var q = ($("pe-qa").value || "").trim().toLowerCase();
    d.querySelectorAll("[data-pe-fa]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-pe-fa") === FA); });
    var L = AG.filter(function (a) { return (FA === "todos" || (a.equipas || []).indexOf(FA) > -1) && (!q || String(a.nome || "").toLowerCase().indexOf(q) > -1); });
    el.innerHTML = L.length ? L.map(function (a) {
      var tel = String(a.telefone || "").replace(/[^\d+]/g, ""), n = Number(a.nao_lidos || 0);
      return '<div class="box"><div class="pe-a">' + foto(a.foto_url) + '<div class="t"><b>' + esc(a.nome) + "</b><small>" + esc(equipa(a.equipas)) + (a.ativo === false ? " · desligado" : "") + "</small><small>" + esc(a.email) + "</small></div></div>" +
        '<div class="pe-d">📞 ' + (tel ? '<a href="tel:' + esc(tel) + '">' + esc(a.telefone) + "</a>" : "não registado") +
        "<br>📍 Província: <b>" + esc(a.provincia || "—") + "</b> · Cidade: <b>" + esc(a.cidade || "—") + "</b><br>🏠 Bairro: <b>" + esc(a.bairro || "—") + "</b>" +
        "<br>🪪 Documento: <b>" + esc(a.bi_numero || "—") + "</b> · validade " + esc(a.bi_validade ? dt(a.bi_validade) : "—") + (a.nuit ? "<br>🧾 NUIT: <b>" + esc(a.nuit) + "</b>" : "") + "</div>" +
        (a.bi_url ? '<div data-pe-bi="' + esc(a.bi_url) + '" style="min-height:188px"></div>' : "") +
        '<a class="pe-c" href="equipa-chat.html?c=' + encodeURIComponent(a.conversa) + '">💬 Conversar' + (n ? "<i>" + n + "</i>" : "") + "</a></div>";
    }).join("") : '<div class="box vz">Nenhum agente.</div>';
    el.querySelectorAll("[data-pe-bi]").forEach(async function (bx) {
      var v = bx.getAttribute("data-pe-bi"), u = v;
      if (!/^https?:/i.test(v)) { try { var s = await window.sb.storage.from("identidades").createSignedUrl(v, 600); u = s.data && s.data.signedUrl || ""; } catch (e) { u = ""; } }
      bx.innerHTML = u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img class="pe-bi" src="' + esc(u) + '" alt="Documento"></a>' : '<div class="vz" style="padding:10px">(foto do documento não disponível)</div>';
    });
  }

  /* ---------- 🏬 Lojas na plataforma ---------- */
  async function lojas() {
    var c = contentor();
    c.innerHTML = '<button class="voltar" data-pe-v="1">← Voltar ao início</button><div id="pe-ln"><div class="box vz">A carregar…</div></div>';
    var r = await window.sb.rpc("dono_lojas_lista");
    if (VISTA !== "lojas") return;
    if (r.error) { $("pe-ln").innerHTML = '<div class="box vz">' + esc(erro(r.error)) + "</div>"; return; }
    LJ = r.data || { total: 0, por_estado: {}, por_pais: {}, lojas: [] };
    var pe = LJ.por_estado || {}, outras = LJ.total - (pe.aprovada || 0) - (pe.pendente || 0);
    $("pe-ln").innerHTML = '<div class="pe-n"><div><b>' + LJ.total + "</b><span>Lojas no total</span></div><div><b>" + (pe.aprovada || 0) + "</b><span>✅ Aprovadas</span></div>" +
      "<div><b>" + (pe.pendente || 0) + "</b><span>⏳ Por aprovar</span></div><div><b>" + Math.max(0, outras) + "</b><span>Suspensas, rejeitadas ou fechadas</span></div></div>" +
      '<div class="pe-p">' + Object.keys(LJ.por_pais || {}).sort().map(function (p) { return "<span>" + esc(p) + " · " + LJ.por_pais[p] + "</span>"; }).join("") + "</div>" +
      '<div class="box"><div class="pe-f"><button data-pe-fl="todas">Todas</button><button data-pe-fl="aprovada">✅ Aprovadas</button><button data-pe-fl="pendente">⏳ Por aprovar</button></div>' +
      '<input class="pe-q" id="pe-ql" placeholder="🔍 Procurar loja"></div><div id="pe-ll"></div>';
    $("pe-ql").oninput = pintarLojas; pintarLojas();
  }
  function pintarLojas() {
    var el = $("pe-ll"); if (!el || !LJ) return;
    var q = ($("pe-ql").value || "").trim().toLowerCase();
    d.querySelectorAll("[data-pe-fl]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-pe-fl") === FL); });
    var L = (LJ.lojas || []).filter(function (l) { return (FL === "todas" || l.estado === FL) && (!q || String(l.nome || "").toLowerCase().indexOf(q) > -1); });
    el.innerHTML = L.length ? L.slice(0, 300).map(function (l) {
      var e = EST[l.estado] || [l.estado || "—", ""], n = Number(l.nao_lidos || 0);
      return '<div class="box"><div class="pe-a"><span class="sf">🏪</span><div class="t"><b>' + esc(l.nome || "Loja") + '</b><small>' + esc([l.pais, l.provincia, l.distrito, l.bairro].filter(Boolean).join(" · ")) + "</small>" +
        '<span class="est ' + e[1] + '">' + esc(e[0]) + "</span>" + (l.criada ? "<small>Criada " + esc(dt(l.criada)) + "</small>" : "") + "</div></div>" +
        '<a class="pe-c" href="equipa-chat.html?c=' + encodeURIComponent(l.conversa) + '">💬 Conversar com o fornecedor' + (n ? "<i>" + n + "</i>" : "") + "</a></div>";
    }).join("") : '<div class="box vz">Nenhuma loja.</div>';
  }

  d.addEventListener("click", function (e) {
    var x = e.target.closest && e.target.closest("[data-pe],[data-pe-v],[data-pe-fa],[data-pe-fl]"); if (!x) return;
    if (x.hasAttribute("data-pe")) { e.preventDefault(); e.stopImmediatePropagation(); abrir(x.getAttribute("data-pe"), true); return; }
    if (x.hasAttribute("data-pe-v")) { e.preventDefault(); voltar(); return; }
    if (x.hasAttribute("data-pe-fa")) { FA = x.getAttribute("data-pe-fa"); pintarAgentes(); return; }
    if (x.hasAttribute("data-pe-fl")) { FL = x.getAttribute("data-pe-fl"); pintarLojas(); }
  }, true);
  /* tocar num separador (Início, Produtos, Pedidos) fecha a vista */
  d.addEventListener("click", function (e) { if (VISTA && e.target.closest && e.target.closest("#tabs button")) { VISTA = ""; var c = $("pe-v"); if (c) { c.classList.add("hide"); c.innerHTML = ""; } try { if (history.state && history.state.pe) history.replaceState(null, "", location.pathname + location.search); } catch (x) {} } }, true);

  var n = 0;
  (function arrancar() {
    var app = $("app");
    if (!window.sb || !window.sb.rpc || !$("t-inicio") || !app || app.classList.contains("hide")) { if (++n < 400) setTimeout(arrancar, 150); return; }
    cartoes();
    /* ao voltar de uma conversa, reabre a vista de onde veio (um passo de cada vez) */
    var m = /#pe-(agentes|lojas)$/.exec(location.hash);
    if (m) { try { if (!(history.state && history.state.pe)) history.replaceState({ pe: m[1] }, "", location.href); } catch (e) {} abrir(m[1], false); }
    setInterval(function () { if (!d.hidden) contar(); }, 30000);
  })();
})();
