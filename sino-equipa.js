/* sino-equipa.js — BBabilônia (21/11/2026): sino 🔔 dos avisos para a EQUIPA
   Agentes (service.bbabilonia.com) e dono (administrator.bbabilonia.com). Os avisos já eram guardados
   (nova compra, pagamentos por levantamento, provas do transporte, disputas…) mas estas páginas não tinham sino.
   - Usa a sessão da própria página (window.sb): no service a do agente (bb-atd), no administrator a do dono.
   - Cada domínio só mostra os seus avisos: no service os dos agentes; no administrator os do dono e das páginas
     dos agentes (o dono também os chefia). Nunca os de cliente/fornecedor. Os mais recentes primeiro.
   - NOVO 21/11: cada encomenda tem a sua PASTA (📁 Pedido #XXXX) com só os avisos dessa encomenda; toque na pasta
     para ver só esses avisos (‹ Voltar para regressar). Avisos sem encomenda ficam em "Outros avisos".
     Só depois de ENTREGUE ao cliente e passados 30 dias a encomenda vai para "🗂️ Encomendas antigas", organizada por mês; passado 1 ano é eliminada
     (a limpeza real na base de dados é feita por avisos_limpar(), ver SQL).
   - Toque num aviso: abre a página; ao abrir a lista ficam lidos.
   Carregado pelo atd-sessao.js (páginas dos agentes) e pelo painel-admin-rececao.js (painel do dono). */
(function () {
  if (window.__bbSinoEq) return; window.__bbSinoEq = 1;
  var h = location.hostname;
  var AG = /^(service|atendimento)\./i.test(h), DONO = /^(admin|administrator)\./i.test(h);
  if (!AG && !DONO) return;
  var d = document;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function quando(a) { var t = a.criado_em || a.created_at; try { return t ? new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } }
  function tempo(a) { return new Date(a.criado_em || a.created_at || 0).getTime() || 0; }
  function lados() { return new Promise(function (ok) { if (window.BBLado) return ok(); var x = d.querySelector('script[src*="lados.js"]'); if (!x) { x = d.createElement("script"); x.src = "lados.js?v=1"; (d.head || d.documentElement).appendChild(x); } x.addEventListener("load", ok); x.addEventListener("error", ok); setTimeout(ok, 4000); }); }
  /* este aviso é deste domínio? */
  function meu(a) {
    var L = window.BBLado; if (!L) return true;
    var lado = L.ladoDoHost(), p = L.pagina(a.link || ""), x = L.ladoDoAviso(a, {}, null);
    if (x === null || x === lado) return true;
    /* o dono também chefia os agentes (aprova entradas, casos sem resposta, compras…): vê os avisos dos agentes, nunca os de cliente/fornecedor */
    return lado === "dono" && (x === "agente" || (L.listas && L.listas.SERVICO.indexOf(p) > -1));
  }
  /* de que encomenda é este aviso? "#5E2C7CC8" no texto, ou o id do pedido no link */
  function pedidoDe(a) {
    var s = (a.titulo || "") + " " + (a.texto || "");
    var m = /#([0-9a-f]{6,8})\b/i.exec(s);
    if (m) return m[1].toUpperCase();
    var k = String(a.link || "");
    m = /[?&](?:pedido|order|order_id|id|o)=([0-9a-f]{8})[0-9a-f-]*/i.exec(k);
    return m ? m[1].toUpperCase() : "";
  }

  var css = d.createElement("style");
  css.textContent = "#bb-seq{position:fixed;right:14px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:9990;width:56px;height:56px;border-radius:50%;border:0;display:none;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;box-shadow:0 8px 20px #ea580c66;cursor:pointer}" +
    "#bb-seq svg{width:27px;height:27px}#bb-seq i{position:absolute;top:-4px;right:-4px;min-width:22px;height:22px;border-radius:11px;background:#dc2626;color:#fff;font:800 12px system-ui,sans-serif;font-style:normal;display:none;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff}" +
    "#bb-seq-f{position:fixed;inset:0;z-index:9995;background:#0f172a99;display:none;align-items:flex-end;justify-content:center;font-family:system-ui,sans-serif}" +
    "#bb-seq-j{background:#fff;color:#0f172a;width:100%;max-width:560px;max-height:85vh;overflow:auto;border-radius:18px 18px 0 0;padding:14px 14px 22px}" +
    "#bb-seq-j h3{margin:0 0 8px;font-size:17px;display:flex;align-items:center;justify-content:space-between}#bb-seq-j h3 button{border:0;background:#f1f5f9;border-radius:50%;width:36px;height:36px;font-size:20px}" +
    ".bb-seq-a{display:block;width:100%;text-align:left;border:0;border-top:1px solid #e2e8f0;background:#fff;padding:12px 4px;font:inherit;color:inherit;cursor:pointer}.bb-seq-a.novo{background:#fff7ed}" +
    ".bb-seq-a b{display:block;font-size:14.5px}.bb-seq-a span{display:block;font-size:13.5px;color:#334155;margin-top:2px}.bb-seq-a small{display:block;font-size:12px;color:#64748b;margin-top:3px}.bb-seq-a em{font-style:normal;color:#2563eb;font-weight:700}" +
    ".bb-seq-p{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;padding:12px;margin:0 0 8px;font:inherit;color:inherit;cursor:pointer}.bb-seq-p.novo{background:#fff7ed;border-color:#fdba74}" +
    ".bb-seq-p .ic{font-size:26px;width:56px;text-align:center}.bb-seq-p .ph{width:56px;height:56px;object-fit:cover;border-radius:10px;flex:none;background:#e2e8f0}.bb-seq-p .tx{flex:1;min-width:0}.bb-seq-p b{display:block;font-size:15px}.bb-seq-p span{display:block;font-size:13px;color:#475569;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bb-seq-p small{display:block;font-size:12px;color:#64748b;margin-top:2px}" +
    ".bb-seq-p .nb{min-width:24px;height:24px;border-radius:12px;background:#dc2626;color:#fff;font:800 12px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:0 6px}.bb-seq-p .ct{color:#64748b;font-size:12px}" +
    ".bb-seq-voltar{border:0;background:#f1f5f9;border-radius:20px;padding:9px 14px;font:600 14px system-ui,sans-serif;margin:0 0 6px;cursor:pointer}.bb-seq-t{font-weight:800;font-size:15px;margin:6px 2px}" +
    ".bb-seq-v{text-align:center;color:#64748b;padding:24px 8px;font-size:14px}";
  d.head.appendChild(css);
  var b = d.createElement("button"); b.id = "bb-seq"; b.type = "button"; b.setAttribute("aria-label", "Avisos");
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><i></i>';
  var f = d.createElement("div"); f.id = "bb-seq-f";
  f.innerHTML = '<div id="bb-seq-j" role="dialog" aria-label="Avisos"><h3>🔔 Avisos<button type="button" aria-label="Fechar">×</button></h3><div id="bb-seq-l"><div class="bb-seq-v">A carregar…</div></div></div>';

  var L = [], eu = null;
  async function sessao() { try { var r = await window.sb.auth.getSession(); return r && r.data && r.data.session; } catch (e) { return null; } }
  async function carregar() {
    var s = await sessao();
    if (!s) { b.style.display = "none"; return null; }
    eu = s.user.id; b.style.display = "flex";
    /* os mais recentes primeiro; a coluna da data pode chamar-se created_at ou criado_em: tenta as duas e, se nenhuma existir, lê sem ordem */
    var r = null, cols = ["created_at", "criado_em", null];
    for (var k = 0; k < cols.length; k++) {
      var q = window.sb.from("avisos").select("*").eq("user_id", eu);
      r = await (cols[k] ? q.order(cols[k], { ascending: false }) : q).limit(300);
      if (!r.error) break;
    }
    if (!r || r.error) return null;
    await lados();
    L = (r.data || []).filter(meu).sort(function (x, y) { return new Date(y.criado_em || y.created_at || 0) - new Date(x.criado_em || x.created_at || 0) || (y.id > x.id ? 1 : -1); });
    var n = L.filter(function (a) { return a.lido !== true; }).length, c = b.querySelector("i");
    c.textContent = n > 99 ? "99+" : n; c.style.display = n ? "flex" : "none";
    return L;
  }
  function linhaAviso(a, i) {
    return '<button type="button" class="bb-seq-a' + (a.lido !== true ? " novo" : "") + '" data-i="' + i + '"><b>' + esc(a.titulo) + "</b>" + (a.texto ? "<span>" + esc(a.texto) + "</span>" : "") +
      "<small>" + esc(quando(a)) + (a.link ? ' · <em>Abrir ›</em>' : "") + "</small></button>";
  }
  /* agrupa por encomenda. Recentes (até 30 dias) na lista; mais velhas vão para "Encomendas antigas" por mês; passado 1 ano desaparecem */
  var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  /* só vai para "Encomendas antigas" a encomenda já ENTREGUE ao cliente (lida da tabela orders; se não der para ler, nenhuma é arquivada) */
  var ENT = {}, ultimoEnt = 0, esperaEnt = false, FIM = { entregue: 1, liberado: 1, reembolsado: 1, entregue_ao_cliente: 1, concluido: 1, "concluído": 1, delivered: 1, completed: 1 };
  async function carregarEntregues() {
    if (esperaEnt || Date.now() - ultimoEnt < 300000 || !window.sb) return;
    esperaEnt = true;
    try {
      var r = await window.sb.from("orders").select("id,escrow_status,status").limit(2000);
      if (r.error) r = await window.sb.from("orders").select("id,escrow_status").limit(2000);
      if (!r.error && r.data) {
        var n = {};
        r.data.forEach(function (o) { var e = String(o.escrow_status || "").toLowerCase(), st = String(o.status || "").toLowerCase(); if (FIM[e] || FIM[st]) n[String(o.id).slice(0, 8).toUpperCase()] = 1; });
        var mudou = Object.keys(n).length !== Object.keys(ENT).length; ENT = n; ultimoEnt = Date.now();
        if (mudou && f.style.display === "flex") pintar();
      }
    } catch (e) {}
    esperaEnt = false;
  }
  function grupos() {
    var mapa = {}, ordem = [], ano = Date.now() - 365 * 86400000;
    L.forEach(function (a) {
      if (tempo(a) && tempo(a) < ano) return;
      var k = pedidoDe(a);
      if (!mapa[k]) { mapa[k] = { k: k, itens: [] }; ordem.push(mapa[k]); }
      mapa[k].itens.push(a);
    });
    ordem.sort(function (x, y) { return tempo(y.itens[0]) - tempo(x.itens[0]); });
    var lim = Date.now() - 30 * 86400000, rec = [], velhas = [];
    ordem.forEach(function (p) { (p.k && ENT[p.k] && tempo(p.itens[0]) && tempo(p.itens[0]) < lim ? velhas : rec).push(p); });
    return { rec: rec, velhas: velhas };
  }
  function chaveMes(p) { var t = new Date(tempo(p.itens[0])); return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2); }
  function nomeMes(c) { var x = c.split("-"); return MESES[Number(x[1]) - 1] + " " + x[0]; }
  function novos(p) { return p.itens.filter(function (a) { return a.lido !== true; }).length; }
  function mini(k) { return window.BBPastas && window.BBPastas.mini ? window.BBPastas.mini(k) : null; }
  function icone(k) { var m = mini(k); if (m && m.foto) return '<img class="ph" src="' + esc(m.foto) + '" alt="" onerror="this.outerHTML=\'<span class=ic>🛍️</span>\'">'; return '<span class="ic">' + (k ? "🛍️" : "📋") + "</span>"; }
  function trabalhar(p) { var av = p.itens.filter(function (a) { return a.link; })[0]; return av ? '<a class="bbp-l" style="margin:0 0 12px" href="' + esc(av.link) + '">🛠️ Tratar esta encomenda ›</a>' : ""; }
  function pasta(p, extra) {
    var nv = novos(p), u = p.itens[0];
    return '<button type="button" class="bb-seq-p' + (nv ? " novo" : "") + '" data-p="' + esc(p.k) + '">' + icone(p.k) + '<span class="tx"><b>' + (p.k ? "Pedido #" + esc(p.k) : "Outros avisos") + "</b>" + (p.k ? "<span>" + esc(mini(p.k) && mini(p.k).nome ? mini(p.k).nome + (mini(p.k).total ? " · " + Number(mini(p.k).total).toLocaleString("pt-PT") + " " + (mini(p.k).moeda || "") : "") : u.titulo) + "</span>" : "") + "<small>" + (p.k ? esc(quando(u)) + " · " : "") + p.itens.length + (p.itens.length === 1 ? " aviso" : " avisos") + "</small></span>" +
      (nv ? '<span class="nb">' + nv + "</span>" : '<span class="ct">›</span>') + "</button>";
  }
  var vista = { t: "raiz" }; /* raiz | antigas | mes (v.mes) | pedido (v.k, v.volta) */
  function pintar() {
    var l = d.getElementById("bb-seq-l");
    if (!L.length) { l.innerHTML = '<div class="bb-seq-v">Ainda não há avisos. 👍</div>'; return; }
    var G = grupos(), todas = G.rec.concat(G.velhas), html = "";
    var voltar = function (alvo) { return '<button type="button" class="bb-seq-voltar" data-v="' + alvo + '">‹ Voltar</button>'; };
    if (vista.t === "pedido") {
      var p = todas.filter(function (x) { return x.k === vista.k; })[0];
      if (p) {
        l.innerHTML = voltar(vista.volta || "raiz") + '<div class="bb-seq-t">' + (p.k ? "📁 Pedido #" + esc(p.k) : "📋 Outros avisos") + "</div>" + (p.k && window.BBPastas ? window.BBPastas.cartao(p.k, pintar) + trabalhar(p) + '<div class="bb-seq-t" style="font-size:14px">🔔 Avisos desta encomenda</div>' : "") + p.itens.slice(0, 100).map(function (a) { return linhaAviso(a, L.indexOf(a)); }).join("");
        return;
      }
      vista = { t: "raiz" };
    }
    if (vista.t === "antigas") {
      var meses = {}, ordem = [];
      G.velhas.forEach(function (p) { var c = chaveMes(p); if (!meses[c]) { meses[c] = []; ordem.push(c); } meses[c].push(p); });
      html = voltar("raiz") + '<div class="bb-seq-t">🗂️ Encomendas antigas</div>' + (ordem.length ? ordem.map(function (c) {
        var nv = meses[c].reduce(function (s, p) { return s + novos(p); }, 0);
        return '<button type="button" class="bb-seq-p" data-m="' + c + '"><span class="ic">🗓️</span><span class="tx"><b>' + nomeMes(c) + "</b><small>" + meses[c].length + (meses[c].length === 1 ? " encomenda" : " encomendas") + '</small></span><span class="ct">›</span></button>';
      }).join("") : '<div class="bb-seq-v">Sem encomendas antigas.</div>') + '<div class="bb-seq-v" style="padding:10px">Ficam guardadas 1 ano; depois são eliminadas.</div>';
      l.innerHTML = html; return;
    }
    if (vista.t === "mes") {
      l.innerHTML = voltar("antigas") + '<div class="bb-seq-t">🗓️ ' + nomeMes(vista.mes) + "</div>" + G.velhas.filter(function (p) { return chaveMes(p) === vista.mes; }).map(pasta).join("");
      return;
    }
    if (window.BBPastas && window.BBPastas.carregarMini) window.BBPastas.carregarMini(G.rec.map(function (p) { return p.k; }), pintar);
    html = G.rec.map(pasta).join("");
    if (G.velhas.length) html += '<button type="button" class="bb-seq-p" data-a="1"><span class="ic">🗂️</span><span class="tx"><b>Encomendas antigas</b><small>' + G.velhas.length + (G.velhas.length === 1 ? " encomenda" : " encomendas") + ' · por mês</small></span><span class="ct">›</span></button>';
    l.innerHTML = html || '<div class="bb-seq-v">Ainda não há avisos. 👍</div>';
  }
  /* marca como lidos só os avisos desta encomenda (ao abrir a pasta); o sino continua a mostrar as outras */
  function lerGrupo(itens) {
    var ids = itens.filter(function (a) { return a.lido !== true; }).map(function (a) { return a.id; });
    if (!ids.length) return Promise.resolve();
    itens.forEach(function (a) { a.lido = true; });
    var n = L.filter(function (a) { return a.lido !== true; }).length, c = b.querySelector("i"); c.textContent = n > 99 ? "99+" : n; c.style.display = n ? "flex" : "none";
    return Promise.race([Promise.resolve(window.sb.from("avisos").update({ lido: true }).eq("user_id", eu).in("id", ids)).catch(function () {}), new Promise(function (ok) { setTimeout(ok, 900); })]);
  }
  async function marcarLidos() {
    var ids = L.filter(function (a) { return a.lido !== true; }).map(function (a) { return a.id; });
    if (!ids.length) return;
    try { await window.sb.from("avisos").update({ lido: true }).eq("user_id", eu).in("id", ids); } catch (e) {}
    L.forEach(function (a) { a.lido = true; }); var c = b.querySelector("i"); c.style.display = "none";
  }
  b.onclick = async function () { vista = { t: "raiz" }; f.style.display = "flex"; pintar(); carregarEntregues(); await carregar(); pintar(); };
  f.addEventListener("click", function (e) {
    if (e.target === f || e.target.closest("h3 button")) { f.style.display = "none"; return; }
    var v = e.target.closest("[data-v]"); if (v) { var al = v.getAttribute("data-v"); vista = al === "antigas" ? { t: "antigas" } : al === "mes" ? { t: "mes", mes: vista.mes } : { t: "raiz" }; pintar(); return; }
    if (e.target.closest("[data-a]")) { vista = { t: "antigas" }; pintar(); return; }
    var mb = e.target.closest("[data-m]"); if (mb) { vista = { t: "mes", mes: mb.getAttribute("data-m") }; pintar(); return; }
    var pb = e.target.closest("[data-p]"); if (pb) {
      /* toque na pasta: abre logo a página onde se trata a encomenda (se tiver); sem página, mostra o cartão */
      var kp = pb.getAttribute("data-p"), gg = grupos(), pq = gg.rec.concat(gg.velhas).filter(function (x) { return x.k === kp; })[0], al2 = pq && pq.itens.filter(function (z) { return z.link; })[0];
      if (kp && al2) { f.style.display = "none"; var pgm = /(atd-verificacoes|confirmar-produto)/.exec(al2.link), dst = pgm ? pgm[1] + ".html?pedido=" + encodeURIComponent(kp) : al2.link; lerGrupo(pq.itens).then(function () { location.href = dst; }); return; }
      vista = { t: "pedido", k: pb.getAttribute("data-p"), volta: vista.t === "mes" ? "mes" : "raiz", mes: vista.mes }; if (pq) lerGrupo(pq.itens); pintar(); var j = d.getElementById("bb-seq-j"); if (j) j.scrollTop = 0; return; }
    var x = e.target.closest("[data-i]"); if (!x) return;
    var a = L[Number(x.getAttribute("data-i"))]; f.style.display = "none";
    if (a && a.link) lerGrupo([a]).then(function () { location.href = a.link; });
  });

  /* cartão da encomenda (foto, preço, etapas): carrega o avisos-pastas.js */
  function modulo() { if (window.BBPastas) { try { window.BBPastas.usar(window.sb); } catch (e) {} return; } var x = d.createElement("script"); x.src = "avisos-pastas.js?v=5"; x.onload = function () { try { window.BBPastas.usar(window.sb); } catch (e) {} }; (d.head || d.documentElement).appendChild(x); }
  var n = 0;
  (function arrancar() {
    if (!window.sb || !window.sb.auth || !window.sb.from || !d.body) { if (++n < 100) setTimeout(arrancar, 150); return; }
    d.body.appendChild(b); d.body.appendChild(f); modulo();
    try { var rp = window.sb.rpc && window.sb.rpc("avisos_limpar"); if (rp && rp.then) rp.then(function () {}, function () {}); } catch (e) {}
    carregar();
    setInterval(function () { if (!d.hidden) carregar(); }, 30000);
    d.addEventListener("visibilitychange", function () { if (!d.hidden) carregar(); });
    try { window.sb.auth.onAuthStateChange(function () { setTimeout(carregar, 400); }); } catch (e) {}
  })();
  window.BBSinoEquipa = { recarregar: carregar };
})();
