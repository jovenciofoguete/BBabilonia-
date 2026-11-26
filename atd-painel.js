/* atd-painel.js — BBabilônia (26/11/2026) · atendimento (service.bbabilonia.com/atendimento.html)
   O painel do atendimento em painéis, como no painel do dono: ecrã branco, cada painel com contorno laranja.
   Pedidos: 🆕 Novos pedidos · ⚙️ Pedidos em processo · ✅ Confirmar receção de um pedido
   Clientes: 🔎 Procurar cliente, pedido ou loja · ⚖️ Casos dos clientes · 💬 Conversas · 👥 Clientes e lojas (superiores) · 🏪 Verificar lojas · 📚 Respostas
   Equipa: 🧑‍💼 Agentes · 🔄 Atualizar · 🚪 Sair
   Cada painel abre a sua vista com "← Voltar ao painel". A seta ← do cabeçalho e o botão voltar do telemóvel
   voltam etapa por etapa (vista → painel; separadores dos casos um a um, voltar-equipa.js).
   Ao voltar de uma encomenda aberta, a lista de onde veio abre de novo. Carregado pelo atd-sessao.js. */
(function () {
  if (window.__bbPainelAtd) return; window.__bbPainelAtd = 1;
  if (!/^(service|atendimento)\./i.test(location.hostname)) return;
  if (!/^\/(atendimento(\.html)?)?$/.test(location.pathname)) return;
  var d = document, V = "";
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var VISTAS = { novos: "🆕 Novos pedidos", proc: "⚙️ Pedidos em processo", rec: "✅ Confirmar receção de um pedido", busca: "🔎 Procurar cliente, pedido ou loja", casos: "⚖️ Casos dos clientes" };
  var ALTURA = false;

  /* ---------- aspeto: branco, painéis com contorno laranja ---------- */
  var css = d.createElement("style"); css.id = "bbp-css";
  var L = "#f97316";
  css.textContent =
    ":root{--fundo:#fff!important;--papel:#fff!important;--texto:#0f172a!important;--suave:#64748b!important;--linha:#e2e8f0!important}" +
    "html,body{background:#fff!important;color:#0f172a!important}" +
    ".bar{background:#fff!important;color:#0f172a!important;box-shadow:none!important;border-bottom:2px solid " + L + "}" +
    ".bar .eu{opacity:1!important}.bar .eu small,.bar .eu span{color:#64748b}" +
    "#bb-ini{background:#fff!important;color:" + L + "!important;border:2px solid " + L + "!important;line-height:36px!important}" +
    ".tabs button{background:#fff!important;color:#0f172a!important;border:2px solid " + L + "!important}.tabs button.on{background:#fff7ed!important;color:#c2410c!important}" +
    ".box{box-shadow:none!important;border:2px solid " + L + "}" +
    "#bb-enc{border:2.5px solid " + L + "!important;box-shadow:none!important}" +
    "#bbp-g h2{font-size:14px;color:#64748b;margin:6px 2px 8px;font-weight:800}#bbp-g h2:not(:first-child){margin-top:16px}" +
    "#bbp-g .gr{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media (min-width:760px){#bbp-g .gr{grid-template-columns:1fr 1fr 1fr}}" +
    ".bbp-c{position:relative;display:block;text-align:left;width:100%;border:2.5px solid " + L + ";border-radius:18px;padding:14px 12px;min-height:104px;background:#fff;color:#0f172a;text-decoration:none;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".bbp-c:active{background:#fff7ed}.bbp-c.l{grid-column:1/-1;min-height:auto}" +
    ".bbp-c .i{font-size:26px;display:block;margin-bottom:6px}.bbp-c b{display:block;font-size:15px;margin-bottom:3px}.bbp-c span.s{font-size:12px;color:#475569;display:block;line-height:1.3}" +
    ".bbp-c em,.bbp-c .bbs-n{position:absolute!important;top:8px!important;right:8px!important;left:auto!important;font-style:normal;background:#ef4444;color:#fff;border-radius:12px;padding:2px 8px;font-size:12px;font-weight:800}" +
    "#bbp-v{display:none;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px}" +
    "#bbp-v button{border:2px solid " + L + ";background:#fff;color:#c2410c;border-radius:20px;padding:8px 14px;font:800 14px system-ui,sans-serif}" +
    "#bbp-v b{font-size:17px}#bbp-v small{color:#64748b;font-weight:600;font-size:13px}" +
    /* o que aparece em cada ecrã */
    "body.bbp-on #topo,body.bbp-on #lista,body.bbp-on #bb-rec,body.bbp-on #bb-enc,body.bbp-on #bb-ctb,body.bbp-on #bbx-proc,body.bbp-on #tabs{display:none!important}" +
    "body.bbp-on.bbp-x #bbp-g{display:none!important}body.bbp-on.bbp-x #bbp-v{display:flex}" +
    "body.bbp-on[data-bbp=casos] #lista{display:grid!important}body.bbp-on[data-bbp=casos] #tabs{display:flex!important}" +
    "body.bbp-on[data-bbp=rec] #bb-rec{display:block!important}body.bbp-on[data-bbp=busca] #bbx-proc{display:block!important}" +
    "body.bbp-on[data-bbp=novos] #bb-enc,body.bbp-on[data-bbp=proc] #bb-enc{display:block!important}" +
    "body.bbp-on[data-bbp=novos] #bb-enc .bbe-tb,body.bbp-on[data-bbp=proc] #bb-enc .bbe-tb,body.bbp-on[data-bbp=novos] #bb-enc .bbe-dc,body.bbp-on[data-bbp=proc] #bb-enc .bbe-dc{display:none!important}" +
    "#painel:has(#bb-ctv) #bbp-g,#painel:has(#bb-ctv) #bbp-v{display:none!important}";
  d.head.appendChild(css);

  function painelVisivel() { var p = $("painel"); return !!p && !p.classList.contains("hide") && !d.body.classList.contains("bb-inicio"); }
  function num(t) { var n = parseInt(String(t || "").replace(/\D/g, ""), 10); return isNaN(n) ? 0 : n; }
  function abaBoard(n) { var b = d.querySelector('#bb-enc [data-bbe-t="' + n + '"]'); return b; }
  function contaBoard(n) { var b = abaBoard(n); if (!b) return { av: 0, enc: "" }; var i = b.querySelector("i"), s = b.querySelector("small"); return { av: num(i && i.textContent), enc: s ? s.textContent : "" }; }
  function contaCasos() { var t = 0; ["meus", "fila", "entradas", "ajuda"].forEach(function (k) { var i = d.querySelector('#tabs button[data-t="' + k + '"] i'); if (i) t += num(i.textContent); }); return t; }
  function linkTopo(p) { return d.querySelector('#topo a[href^="' + p + '"]'); }
  function em(n) { return n ? "<em>" + (n > 99 ? "99+" : n) + "</em>" : ""; }
  function cartao(o) {
    var dentro = '<span class="i">' + o.i + "</span><b>" + esc(o.t) + "</b>" + (o.s ? '<span class="s">' + esc(o.s) + "</span>" : "") + em(o.n);
    var cl = "bbp-c" + (o.l ? " l" : "");
    if (o.href) return '<a class="' + cl + '" href="' + o.href + '">' + dentro + "</a>";
    return '<button type="button" class="' + cl + '" data-bbp-a="' + o.a + '">' + dentro + "</button>";
  }
  var ultimo = "";
  function desenhar() {
    if (!painelVisivel()) { d.body.classList.remove("bbp-on"); return; }
    d.body.classList.add("bbp-on");
    var p = $("painel"), g = $("bbp-g"), v = $("bbp-v");
    if (!g) { g = d.createElement("div"); g.id = "bbp-g"; p.insertBefore(g, p.firstChild); }
    if (!v) {
      v = d.createElement("div"); v.id = "bbp-v";
      v.innerHTML = '<button type="button" id="bbp-volta">← Voltar ao painel</button><b id="bbp-tit"></b>';
      p.insertBefore(v, g.nextSibling);
    }
    if (g !== p.firstChild) p.insertBefore(g, p.firstChild);
    if (v.previousSibling !== g) p.insertBefore(v, g.nextSibling);
    var bN = contaBoard(0), bP = contaBoard(1);
    var h = "<h2>Pedidos</h2><div class=\"gr\">" +
      cartao({ a: "novos", i: "🆕", t: "Novos pedidos", s: bN.enc || "Encomendas que ainda não começaram", n: bN.av }) +
      cartao({ a: "proc", i: "⚙️", t: "Pedidos em processo", s: bP.enc || "Encomendas já em andamento, etapa por etapa", n: bP.av }) +
      ($("bb-rec") ? cartao({ a: "rec", i: "✅", t: "Confirmar receção de um pedido", s: "Quando o cliente já recebeu: o valor fica para o vendedor", l: 1 }) : "") +
      "</div><h2>Clientes</h2><div class=\"gr\">" +
      ($("bbx-proc") ? cartao({ a: "busca", i: "🔎", t: "Procurar cliente, pedido ou loja", s: "Pelo número do pedido, email, telefone ou nome", l: 1 }) : "") +
      cartao({ a: "casos", i: "⚖️", t: "Casos dos clientes", s: "Os meus casos, Fila, Todos em aberto e Fechados", n: contaCasos() }) +
      (linkTopo("conversas") ? cartao({ href: "conversas.html", i: "💬", t: "Conversas", s: "Mensagens com clientes e fornecedores" }) : "") +
      ($("bb-ctb") ? cartao({ a: "contas", i: "👥", t: "Clientes e lojas", s: "Procurar, bloquear e remover" }) : "") +
      cartao({ href: "atd-lojas.html", i: "🏪", t: "Verificar lojas", s: "Conferir os documentos das lojas novas" }) +
      (linkTopo("respostas") ? cartao({ href: "respostas.html", i: "📚", t: "Respostas", s: "Respostas prontas" }) : "") +
      "</div><h2>Equipa</h2><div class=\"gr\">" +
      (linkTopo("agentes") ? cartao({ href: "agentes.html", i: "🧑‍💼", t: "Agentes", s: "A equipa do atendimento" }) : "") +
      ($("atu") ? cartao({ a: "atu", i: "🔄", t: "Atualizar", s: "Carregar de novo" }) : "") +
      ($("sair2") ? cartao({ a: "sair", i: "🚪", t: "Sair", l: !linkTopo("agentes") ? 0 : 1 }) : "") + "</div>";
    if (h !== ultimo) { ultimo = h; g.innerHTML = h; }
    if (V) {
      var tit = VISTAS[V] || "", sub = V === "novos" ? bN.enc : V === "proc" ? bP.enc : "";
      var th = esc(tit) + (sub ? " <small>· " + esc(sub) + "</small>" : "");
      var te = $("bbp-tit"); if (te && te.innerHTML !== th) te.innerHTML = th;
      /* a vista dos novos/processo mostra só a sua lista */
      if (V === "novos" || V === "proc") { var bt = abaBoard(V === "novos" ? 0 : 1); if (bt && (ALTURA || !bt.classList.contains("on"))) { ALTURA = false; bt.click(); } }
    }
  }

  /* ---------- vistas e passos (seta e botão voltar do telemóvel) ---------- */
  function marcar(v) {
    V = v; d.body.setAttribute("data-bbp", v); d.body.classList.toggle("bbp-x", !!v);
    try { if (v) sessionStorage.setItem("bbp-v", v); else sessionStorage.removeItem("bbp-v"); } catch (e) {}
  }
  function abrir(v, semPasso) {
    if (!VISTAS[v]) return;
    marcar(v); ALTURA = true;
    if (!semPasso) { try { history.pushState({ bbpV: v }, "", location.href); } catch (e) {} }
    window.scrollTo(0, 0); desenhar();
  }
  function fechar() { if (!V) return; marcar(""); window.scrollTo(0, 0); desenhar(); }
  window.BBPainelAtd = { aberta: function () { return !!V; } };
  /* a página troca o endereço (separadores dos casos) sem perder a vista guardada no passo */
  var rs = history.replaceState;
  history.replaceState = function (st, t, u) {
    try { var a = history.state; if (a && typeof a === "object") { st = Object.assign({}, a, st && typeof st === "object" ? st : {}); } } catch (e) {}
    return rs.call(history, st, t, u);
  };
  d.addEventListener("click", function (e) {
    var x = e.target.closest && e.target.closest("[data-bbp-a], #bbp-volta"); if (!x) return;
    e.preventDefault();
    if (x.id === "bbp-volta") {
      var n = window.BBVoltarEq && window.BBVoltarEq.limpar ? window.BBVoltarEq.limpar() : 0;
      if (history.state && history.state.bbpV) { try { history.go(-(n + 1)); } catch (z) { fechar(); } } else fechar();
      return;
    }
    var a = x.getAttribute("data-bbp-a");
    if (a === "contas") { var c = $("bb-ctb"); if (c) c.click(); return; }
    if (a === "atu") { var u = $("atu"); if (u) u.click(); return; }
    if (a === "sair") { var s = $("sair2"); if (s) s.click(); return; }
    abrir(a);
  });
  window.addEventListener("popstate", function (e) {
    if (e.__bbTab || !V) return;
    if (window.BBVoltarEq && window.BBVoltarEq.tem()) return;        /* primeiro desfaz os separadores dos casos */
    e.__bbTab = true; fechar();
  });
  /* nas listas dos novos/processo não se arrasta para a outra lista */
  ["touchstart", "touchmove", "touchend"].forEach(function (t) {
    d.addEventListener(t, function (e) { if ((V === "novos" || V === "proc") && e.target.closest && e.target.closest("#bb-enc .bbe-vp")) e.stopPropagation(); }, { capture: true, passive: true });
  });

  /* ao voltar de uma encomenda aberta a partir de uma lista, a lista abre de novo */
  var est = window.__bbEstadoInicial !== undefined ? window.__bbEstadoInicial : history.state;
  var reabrir = est && est.bbpV ? est.bbpV : "";

  var t = null, n = 0;
  (function arrancar() {
    if (!d.body || !$("painel")) { if (++n < 400) setTimeout(arrancar, 100); return; }
    new MutationObserver(function (ms) {
      if (ms.every(function (m) { var g = $("bbp-g"); return g && (g === m.target || g.contains(m.target)); })) return;
      clearTimeout(t); t = setTimeout(function () {
        desenhar();
        if (reabrir && painelVisivel()) { var r = reabrir; reabrir = ""; abrir(r, true); }
      }, 60);
    }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    desenhar();
  })();
})();
