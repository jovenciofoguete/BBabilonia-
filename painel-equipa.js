/* painel-equipa.js — BBabilônia (22/11/2026) · painel do dono (administrator.bbabilonia.com)
   Só acrescenta cartões ao Início; não muda os outros.
   (23/11/2026) 🇲🇿 Destaques Moçambique e 🌍 Destaques internacionais (só ver; tudo pago e aprovado sozinho).
   (23/11/2026) "👥 Os meus agentes" saiu: os agentes ficam numa só pasta, 👥 Agentes (admin-agentes.html),
     com foto, nome, dados, documentos e "💬 Conversar".
   - 🚨 Denúncias: só as denúncias dos agentes → equipa-chat.html (as conversas com fornecedores abrem em 🏬 Lojas).
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
  var VISTA = "", LJ = null, FL = "todas", DS = null, DT = "produtos";

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
    var ini = $("t-inicio"); if (!ini || $("pe-c-msg")) return;
    var grids = ini.querySelectorAll(".grid");
    var gAg = null, gLj = grids[0] || null;
    Array.prototype.forEach.call(ini.querySelectorAll("h2"), function (h) { if (/agentes/i.test(h.textContent) && h.nextElementSibling && h.nextElementSibling.classList.contains("grid")) gAg = h.nextElementSibling; });
    if (gAg) gAg.insertAdjacentHTML("afterbegin",
      '<a id="pe-c-msg" class="c k5" href="equipa-chat.html"><span class="i">🚨</span><b>Denúncias</b><span>Denúncias dos agentes</span><em id="pe-n-msg" class="hide"></em></a>');
    if (gLj) gLj.insertAdjacentHTML("beforeend",
      '<a id="pe-c-lj" class="c k3" href="#" data-pe="lojas"><span class="i">🏬</span><b>Lojas na plataforma</b><span id="pe-lj-sub">Quantas lojas há e conversar com cada fornecedor</span><em id="pe-n-lj" class="hide"></em></a>' +
      '<a id="pe-c-dmz" class="c k6" href="#" data-pe="dmz"><span class="i">🇲🇿</span><b>Destaques Moçambique</b><span>Lojas gerais, serviços e aluguer de Moçambique · M-Pesa automático</span></a>' +
      '<a id="pe-c-dint" class="c k9" href="#" data-pe="dint"><span class="i">🌍</span><b>Destaques internacionais</b><span>Lojas e fornecedores fora de Moçambique · cartão em USD</span></a>');
    contar();
  }
  async function contar() {
    /* mensagens por ler: as denúncias dos agentes no cartão 🚨 Denúncias; as dos fornecedores no cartão 🏬 Lojas */
    try {
      var r = await window.sb.rpc("equipa_chat_lista");
      var na = 0, nf = 0;
      (r.error ? [] : (r.data || [])).forEach(function (x) { var k = Number(x.nao_lidos || 0); if (x.tipo === "fornecedor") nf += k; else if (x.tipo === "agente") na += k; });
      var e = $("pe-n-msg"); if (e) { e.textContent = na; e.classList.toggle("hide", !na); }
      var e2 = $("pe-n-lj"); if (e2) { e2.textContent = nf; e2.classList.toggle("hide", !nf); }
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
    var tb = $("tabs"); if (tb) tb.classList.toggle("hide", !!sim);
    if (tb) tb.querySelectorAll("button").forEach(function (b) { b.classList.toggle("on", !sim && b.getAttribute("data-t") === "inicio"); });
  }
  function abrir(v, empurrar) {
    VISTA = v;
    if (empurrar) { try { history.pushState({ pe: v }, "", location.pathname + location.search + "#pe-" + v); } catch (e) {} }
    esconderOutros(true);
    var c = contentor(); c.classList.remove("hide"); window.scrollTo(0, 0);
    if (v === "lojas") lojas(); else destaques(v);
  }
  function fechar() {
    VISTA = ""; var c = $("pe-v"); if (c) { c.classList.add("hide"); c.innerHTML = ""; }
    esconderOutros(false); window.scrollTo(0, 0);
  }
  function voltar() { if (history.state && history.state.pe) history.back(); else { fechar(); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} } }
  window.addEventListener("popstate", function (e) {
    var v = e.state && e.state.pe; if (["lojas", "dmz", "dint"].indexOf(v) < 0) v = "";
    if (v) abrir(v, false); else if (VISTA) fechar();
  });

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


  /* ---------- (23/11/2026) 🇲🇿 Destaques Moçambique · 🌍 Destaques internacionais (só ver: tudo é pago e aprovado sozinho) ---------- */
  var MEIO = { mpesa: "📱 M-Pesa", cartao: "💳 Cartão" };
  function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m === "MZN" ? "MT" : (m || "")); }
  async function destaques(v) {
    var c = contentor(), mz = v === "dmz";
    c.innerHTML = '<button class="voltar" data-pe-v="1">← Voltar ao início</button><div class="box"><b>' + (mz ? "🇲🇿 Destaques Moçambique" : "🌍 Destaques internacionais") + "</b>" +
      '<p style="font-size:13px;color:#64748b;margin:6px 0 10px">' + (mz
        ? "Lojas gerais, serviços e aluguer de Moçambique. Pagos por M-Pesa automático (número e PIN no telemóvel) e aprovados sozinhos."
        : "Lojas e fornecedores fora de Moçambique. Pagos por cartão em dólares (USD) e aprovados sozinhos.") + "</p>" +
      '<div class="pe-f"><button data-pe-dt="produtos">⭐ Lojas gerais</button><button data-pe-dt="servicos">⭐ Serviços e aluguer</button><button data-pe-dt="mensalidades">💵 Mensalidades</button></div></div>' +
      '<div id="pe-dl"><div class="box vz">A carregar…</div></div>';
    DS = null;
    var r = await window.sb.rpc("dono_destaques_painel", { p_zona: mz ? "mz" : "int" });
    if (VISTA !== v) return;
    if (r.error) { $("pe-dl").innerHTML = '<div class="box vz">' + esc(/function|find|exist/i.test(r.error.message) ? "Falta correr o SQL novo (PARTE C) no Supabase." : r.error.message) + "</div>"; return; }
    DS = r.data || {}; pintarDest();
  }
  function pintarDest() {
    var el = $("pe-dl"); if (!el || !DS) return;
    d.querySelectorAll("[data-pe-dt]").forEach(function (b) { var k = b.getAttribute("data-pe-dt"); b.classList.toggle("on", k === DT); });
    var L = DS[DT] || [];
    el.innerHTML = L.length ? '<div class="box">' + L.map(function (x) {
      var tit = DT === "produtos" ? esc(x.produto || "Produto") + (x.loja ? " · 🏪 " + esc(x.loja) : "")
        : DT === "servicos" ? esc(x.titulo || "Anúncio") + (x.provincia ? " · 📍 " + esc(x.provincia) : "")
        : esc(x.categoria || "Categoria") + (x.periodo === "ano" ? " · 🗓️ anual" : " · 📅 mensal");
      var ok = x.estado === "pago" || x.estado === "confirmado";
      return '<div style="padding:10px 0;border-top:1px solid #e2e8f0"><b style="display:block;font-size:14.5px">' + tit + "</b>" +
        '<small style="display:block;color:#64748b;font-size:12.5px;line-height:1.5">' + din(x.valor, x.moeda) + " · " + (MEIO[x.meio] || esc(x.meio || "")) +
        (x.dias ? " · " + x.dias + (x.dias === 1 ? " dia" : " dias") : "") + (x.pais ? " · 🌍 " + esc(x.pais) : "") + (x.conta ? " · " + esc(x.conta) : "") +
        "<br>" + (x.quando ? "Pago " + esc(dt(x.quando)) : "") + (x.ate ? " · ativo até " + esc(dt(x.ate)) : "") + "</small>" +
        '<span class="est ' + (ok ? "v" : "") + '">' + (ok ? "✅ Pago" : "⏳ " + esc(x.estado || "")) + "</span></div>";
    }).join("").replace('<div style="padding:10px 0;border-top:1px solid #e2e8f0">', '<div style="padding:4px 0 10px">') + "</div>"
      : '<div class="box vz">' + (DT === "mensalidades" ? "Ainda não há mensalidades pagas." : "Ainda não há destaques pagos.") + "</div>";
  }

  d.addEventListener("click", function (e) {
    var x = e.target.closest && e.target.closest("[data-pe],[data-pe-v],[data-pe-fl],[data-pe-dt]"); if (!x) return;
    if (x.hasAttribute("data-pe")) { e.preventDefault(); e.stopImmediatePropagation(); abrir(x.getAttribute("data-pe"), true); return; }
    if (x.hasAttribute("data-pe-v")) { e.preventDefault(); voltar(); return; }
    if (x.hasAttribute("data-pe-fl")) { FL = x.getAttribute("data-pe-fl"); pintarLojas(); return; }
    if (x.hasAttribute("data-pe-dt")) { DT = x.getAttribute("data-pe-dt"); pintarDest(); }
  }, true);
  /* tocar num separador (Início, Produtos, Pedidos) fecha a vista */
  d.addEventListener("click", function (e) { if (VISTA && e.target.closest && e.target.closest("#tabs button")) { VISTA = ""; var c = $("pe-v"); if (c) { c.classList.add("hide"); c.innerHTML = ""; } try { if (history.state && history.state.pe) history.replaceState(null, "", location.pathname + location.search); } catch (x) {} } }, true);

  var n = 0;
  (function arrancar() {
    var app = $("app");
    if (!window.sb || !window.sb.rpc || !$("t-inicio") || !app || app.classList.contains("hide")) { if (++n < 400) setTimeout(arrancar, 150); return; }
    cartoes();
    /* ao voltar de uma conversa, reabre a vista de onde veio (um passo de cada vez) */
    if (/#pe-agentes$/.test(location.hash)) { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
    var m = /#pe-(lojas|dmz|dint)$/.exec(location.hash);
    if (m) { try { if (!(history.state && history.state.pe)) history.replaceState({ pe: m[1] }, "", location.href); } catch (e) {} abrir(m[1], false); }
    setInterval(function () { if (!d.hidden) contar(); }, 30000);
  })();
})();
