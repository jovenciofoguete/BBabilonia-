/* sino-equipa.js — BBabilônia: avisos da EQUIPA (agentes em service.bbabilonia.com e dono em administrator.bbabilonia.com)
   (21/11/2026) SEM SINO. As notificações aparecem NA PRÓPRIA ENCOMENDA, dentro da área de trabalho:
   - quadro "Novos pedidos | Pedidos em processo" (encomendas-divisao.js) no topo da área de trabalho:
       service: atendimento.html (painel), atd-verificacoes.html e confirmar-produto.html · administrator: painel do dono (Início).
   - nada aparece no ecrã "Escolha a sua área" nem antes de entrar.
   - toque numa encomenda: os avisos dela ficam lidos e abre a página da encomenda (etapas e trabalho).
   - ao abrir a página de uma encomenda (…?pedido=XXXXXXXX) os avisos dessa encomenda ficam lidos.
   - Encomendas antigas: só depois de ENTREGUE ao cliente e passados 30 dias, por mês; passado 1 ano é eliminada (avisos_limpar()).
   - Avisos sem encomenda: botão "📋 Outros avisos" no fundo do quadro.
   Cada domínio só mostra os seus avisos (lados.js). Carregado pelo atd-sessao.js e pelo painel-admin-rececao.js. */
(function () {
  if (window.__bbSinoEq) return; window.__bbSinoEq = 1;
  var h = location.hostname;
  var AG = /^(service|atendimento)\./i.test(h), DONO = /^(admin|administrator)\./i.test(h);
  if (!AG && !DONO) return;
  var d = document, PG = (location.pathname.split("/").pop() || "").toLowerCase();
  var SOLO = (new URLSearchParams(location.search).get("pedido") || "").replace(/-/g, "").slice(0, 8).toUpperCase();
  var NA_BUSCA = /^confirmar-produto/.test(PG);
  function $(i) { return d.getElementById(i); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function quando(a) { var t = a.criado_em || a.created_at; try { return t ? new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } }
  function tempo(a) { return new Date(a.criado_em || a.created_at || 0).getTime() || 0; }
  function carregarScript(f, teste) { return new Promise(function (ok) { if (teste()) return ok(); var x = d.querySelector('script[src*="' + f + '"]'); if (!x) { x = d.createElement("script"); x.src = f + "?v=1"; (d.head || d.documentElement).appendChild(x); } x.addEventListener("load", ok); x.addEventListener("error", ok); setTimeout(ok, 5000); }); }
  function lados() { return carregarScript("lados.js", function () { return !!window.BBLado; }); }
  function divisao() { return carregarScript("encomendas-divisao.js", function () { return !!window.BBEnc; }); }
  /* este aviso é deste domínio? */
  function meu(a) {
    var L = window.BBLado; if (!L) return true;
    var lado = L.ladoDoHost(), p = L.pagina(a.link || ""), x = L.ladoDoAviso(a, {}, null);
    if (x === null || x === lado) return true;
    /* o dono também chefia os agentes: vê os avisos dos agentes, nunca os de cliente/fornecedor */
    return lado === "dono" && (x === "agente" || (L.listas && L.listas.SERVICO.indexOf(p) > -1));
  }
  /* de que encomenda é este aviso? "#5E2C7CC8" no texto, ou o id do pedido no link */
  function pedidoDe(a) {
    var s = (a.titulo || "") + " " + (a.texto || "");
    var m = /#([0-9a-f]{6,8})\b/i.exec(s) || /\bpedido\s+([0-9a-f]{8})\b/i.exec(s);
    if (m) return m[1].toUpperCase();
    m = /[?&](?:pedido|order|order_id|id|o)=([0-9a-f]{8})[0-9a-f-]*/i.exec(String(a.link || ""));
    return m ? m[1].toUpperCase() : "";
  }

  /* onde fica o quadro: só dentro da área de trabalho (nunca no "Escolha a sua área") */
  function alvo() {
    if (SOLO || d.body.classList.contains("bb-inicio") || d.body.classList.contains("solo")) return null;
    var x;
    if (AG && /^(atendimento(\.html)?)?$/.test(PG)) { x = $("painel"); return x && !x.classList.contains("hide") ? { pai: x, antes: x.firstChild } : null; }
    if (/^confirmar-produto/.test(PG)) { x = $("vApp"); return x && !x.classList.contains("hide") ? { pai: x, antes: x.firstChild } : null; }
    if (/^atd-verificacoes/.test(PG)) { x = d.querySelector("main"); var t = x && x.querySelector(".tabs"); return t ? { pai: x, antes: t } : null; }
    if (DONO && /^(painel-admin(\.html)?|index\.html)?$/.test(PG)) { var app = $("app"); x = $("t-inicio"); return x && app && !app.classList.contains("hide") ? { pai: x, antes: x.firstChild } : null; }
    return null;
  }

  var L = [], eu = null, ENT = {}, ultimoEnt = 0, vista = "quadro", mesSel = "";
  var FIM = { entregue: 1, liberado: 1, reembolsado: 1, entregue_ao_cliente: 1, concluido: 1, "concluído": 1, delivered: 1, completed: 1 };
  var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  async function sessao() { try { var r = await window.sb.auth.getSession(); return r && r.data && r.data.session; } catch (e) { return null; } }
  async function carregar() {
    var s = await sessao();
    if (!s) { L = []; pintar(); return; }
    eu = s.user.id;
    var r = null, cols = ["created_at", "criado_em", null];
    for (var k = 0; k < cols.length; k++) {
      var q = window.sb.from("avisos").select("*").eq("user_id", eu);
      r = await (cols[k] ? q.order(cols[k], { ascending: false }) : q).limit(300);
      if (!r.error) break;
    }
    if (!r || r.error) return;
    await lados();
    L = (r.data || []).filter(meu).sort(function (x, y) { return tempo(y) - tempo(x) || (y.id > x.id ? 1 : -1); });
    if (SOLO) { lerItens(L.filter(function (a) { return pedidoDe(a) === SOLO; })); return; }
    carregarEntregues();
    pintar();
  }
  async function carregarEntregues() {
    if (Date.now() - ultimoEnt < 300000) return;
    ultimoEnt = Date.now();
    try {
      var r = await window.sb.from("orders").select("id,escrow_status,status").limit(2000);
      if (r.error) r = await window.sb.from("orders").select("id,escrow_status").limit(2000);
      if (!r.error && r.data) { var n = {}; r.data.forEach(function (o) { var e = String(o.escrow_status || "").toLowerCase(), st = String(o.status || "").toLowerCase(); if (FIM[e] || FIM[st]) n[String(o.id).slice(0, 8).toUpperCase()] = 1; }); ENT = n; pintar(); }
    } catch (e) {}
  }
  function lerItens(itens) {
    var ids = itens.filter(function (a) { return a.lido !== true && a.id != null; }).map(function (a) { return a.id; });
    if (!ids.length || !eu) return Promise.resolve();
    itens.forEach(function (a) { a.lido = true; });
    return Promise.resolve(window.sb.from("avisos").update({ lido: true }).eq("user_id", eu).in("id", ids)).catch(function () {});
  }
  function grupos() {
    var mapa = {}, ordem = [], ano = Date.now() - 365 * 86400000, outros = { k: "", itens: [] };
    L.forEach(function (a) {
      if (tempo(a) && tempo(a) < ano) return;
      var k = pedidoDe(a);
      if (!k) { outros.itens.push(a); return; }
      if (!mapa[k]) { mapa[k] = { k: k, itens: [] }; ordem.push(mapa[k]); }
      mapa[k].itens.push(a);
    });
    var lim = Date.now() - 30 * 86400000, rec = [], velhas = [];
    ordem.forEach(function (p) { (ENT[p.k] && tempo(p.itens[0]) && tempo(p.itens[0]) < lim ? velhas : rec).push(p); });
    return { rec: rec, velhas: velhas, outros: outros };
  }
  function destino(k) { return (NA_BUSCA ? "confirmar-produto.html" : "atd-verificacoes.html") + "?pedido=" + encodeURIComponent(k); }
  function linhaAviso(a, i) {
    return '<button type="button" class="bbs-a' + (a.lido !== true ? " nv" : "") + '" data-bbs-i="' + i + '"><b>' + esc(a.titulo) + "</b>" + (a.texto ? "<span>" + esc(a.texto) + "</span>" : "") + "<small>" + esc(quando(a)) + (a.link ? " · <em>Abrir ›</em>" : "") + "</small></button>";
  }
  function css() {
    if ($("bbs-css")) return;
    var s = d.createElement("style"); s.id = "bbs-css";
    s.textContent = ".bbs-sub{background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 4px 14px #0f172a1a;margin:0 0 12px;padding:12px;font-family:system-ui,sans-serif}" +
      ".bbs-v{border:0;background:#f1f5f9;border-radius:20px;padding:9px 14px;font:700 14px system-ui,sans-serif;margin:0 0 8px;cursor:pointer}.bbs-t{font-weight:800;font-size:15px;margin:4px 2px 8px}" +
      ".bbs-a{display:block;width:100%;text-align:left;border:0;border-top:1px solid #e2e8f0;background:#fff;padding:11px 4px;font:inherit;color:inherit;cursor:pointer}.bbs-a.nv{background:#fff7ed}" +
      ".bbs-a b{display:block;font-size:14.5px}.bbs-a span{display:block;font-size:13.5px;color:#334155;margin-top:2px}.bbs-a small{display:block;font-size:12px;color:#64748b;margin-top:3px}.bbs-a em{font-style:normal;color:#2563eb;font-weight:700}" +
      ".bbs-m{display:flex;justify-content:space-between;width:100%;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;padding:12px;margin:0 0 8px;font:700 14.5px system-ui,sans-serif;cursor:pointer}";
    d.head.appendChild(s);
  }
  function chaveMes(p) { var t = new Date(tempo(p.itens[0])); return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2); }
  function nomeMes(c) { var x = c.split("-"); return MESES[Number(x[1]) - 1] + " " + x[0]; }

  function pintar() {
    var A = alvo(), el = $("bb-enc");
    if (!A) { if (el) el.remove(); return; }
    if (!window.BBEnc) { divisao().then(pintar); return; }
    css();
    if (!el || el.parentNode !== A.pai) { if (el) el.remove(); el = d.createElement("div"); el.id = "bb-enc"; A.pai.insertBefore(el, A.antes); }
    var G = grupos();
    if (vista === "outros") {
      el.className = "bbs-sub";
      el.innerHTML = '<button type="button" class="bbs-v" data-bbs-v="1">‹ Voltar</button><div class="bbs-t">📋 Outros avisos</div>' + (G.outros.itens.length ? G.outros.itens.slice(0, 100).map(function (a) { return linhaAviso(a, L.indexOf(a)); }).join("") : '<div class="bbe-vz">Sem avisos.</div>');
      return;
    }
    if (vista === "antigas" || vista === "mes") {
      el.className = "bbs-sub";
      var meses = {}, ordem = [];
      G.velhas.forEach(function (p) { var c = chaveMes(p); if (!meses[c]) { meses[c] = []; ordem.push(c); } meses[c].push(p); });
      if (vista === "mes") {
        var sub = d.createElement("div");
        el.innerHTML = '<button type="button" class="bbs-v" data-bbs-v="antigas">‹ Voltar</button><div class="bbs-t">🗓️ ' + esc(nomeMes(mesSel)) + "</div>";
        el.appendChild(sub);
        window.BBEnc.montar(sub, { id: "mes", sb: window.sb, grupos: meses[mesSel] || [], destino: destino, ler: lerItens });
        return;
      }
      el.innerHTML = '<button type="button" class="bbs-v" data-bbs-v="1">‹ Voltar</button><div class="bbs-t">🗂️ Encomendas antigas</div>' + (ordem.length ? ordem.map(function (c) {
        return '<button type="button" class="bbs-m" data-bbs-m="' + c + '"><span>🗓️ ' + esc(nomeMes(c)) + "</span><span>" + meses[c].length + (meses[c].length === 1 ? " encomenda" : " encomendas") + " ›</span></button>";
      }).join("") : '<div class="bbe-vz">Sem encomendas antigas.</div>') + '<div class="bbe-dc">Ficam guardadas 1 ano; depois são eliminadas.</div>';
      return;
    }
    window.BBEnc.montar(el, {
      id: "equipa", sb: window.sb, grupos: G.rec, destino: destino, ler: lerItens,
      antigas: G.velhas.length, abrirAntigas: function () { vista = "antigas"; pintar(); },
      outros: G.outros, abrirOutros: function () { vista = "outros"; pintar(); }
    });
  }
  d.addEventListener("click", function (e) {
    var el = $("bb-enc"); if (!el || !el.contains(e.target)) return;
    var x;
    if ((x = e.target.closest("[data-bbs-v]"))) { vista = x.getAttribute("data-bbs-v") === "antigas" ? "antigas" : "quadro"; pintar(); return; }
    if ((x = e.target.closest("[data-bbs-m]"))) { mesSel = x.getAttribute("data-bbs-m"); vista = "mes"; pintar(); return; }
    if ((x = e.target.closest("[data-bbs-i]"))) { var a = L[Number(x.getAttribute("data-bbs-i"))]; if (a) lerItens([a]).then(function () { if (a.link) location.href = a.link; else pintar(); }); }
  });

  var n = 0;
  (function arrancar() {
    if (!window.sb || !window.sb.auth || !window.sb.from || !d.body) { if (++n < 100) setTimeout(arrancar, 150); return; }
    try { var rp = window.sb.rpc && window.sb.rpc("avisos_limpar"); if (rp && rp.then) rp.then(function () {}, function () {}); } catch (e) {}
    divisao();
    carregar();
    setInterval(function () { if (!d.hidden) carregar(); }, 30000);
    d.addEventListener("visibilitychange", function () { if (!d.hidden) carregar(); });
    try { window.sb.auth.onAuthStateChange(function () { setTimeout(carregar, 400); }); } catch (e) {}
    /* a área de trabalho aparece depois de entrar (ou some ao voltar ao início): pôr/tirar o quadro */
    var t = null;
    new MutationObserver(function (ms) {
      if (ms.every(function (m) { var el = $("bb-enc"); return el && (el === m.target || el.contains(m.target)); })) return;
      clearTimeout(t); t = setTimeout(function () { var A = alvo(), el = $("bb-enc"); if (!!A !== !!el || (A && el && el.parentNode !== A.pai)) pintar(); }, 120);
    }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  })();
  window.BBSinoEquipa = { recarregar: carregar };
})();
