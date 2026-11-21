/* avisos-pastas.js — BBabilônia (21/11/2026)
   Organiza os avisos por ENCOMENDA, igual em todos os lados (cliente, fornecedor, agentes, dono).
   - Cada encomenda = uma pasta "📁 Pedido #XXXXXXXX" só com os avisos dessa encomenda.
   - Avisos sem encomenda: "📋 Outros avisos".
   - Só depois de ENTREGUE ao cliente (pedido com entrega confirmada) e passados 30 dias a encomenda vai para "🗂️ Encomendas antigas", organizada por mês.
   - Passado 1 ano deixa de aparecer (e é eliminada na base de dados por avisos_limpar()).
   Uso: BBPastas.render(elementoLista, avisos, function(aviso, indice){ return "<div class=av data-i=..>…</div>"; }, "texto vazio", depois)
   "depois" corre sempre que a lista é desenhada (para a página ligar os cliques dos avisos). Chame BBPastas.usar(sb) uma vez para saber quais as encomendas já entregues. */
(function () {
  if (window.BBPastas) return;
  var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function tempo(a) { var t = new Date(a.created_at || a.criado_em || 0).getTime(); return t || 0; }
  function quando(a) { var t = a.created_at || a.criado_em; try { return t ? new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } }
  function pedidoDe(a) {
    var s = (a.titulo || "") + " " + (a.texto || "");
    var m = /#([0-9a-f]{6,8})\b/i.exec(s) || /\bpedido\s+([0-9a-f]{8})\b/i.exec(s);
    if (m) return m[1].toUpperCase();
    m = /[?&](?:pedido|order|order_id|id|o)=([0-9a-f]{8})[0-9a-f-]*/i.exec(String(a.link || ""));
    return m ? m[1].toUpperCase() : "";
  }
  /* encomendas já entregues ao cliente (lidas da tabela orders; se não der para ler, nenhuma é arquivada — mais seguro) */
  var ENT = {}, IDS = {}, ET = {}, SB = null, ultimo = 0, esperar = false;
  var FIM = { entregue: 1, liberado: 1, reembolsado: 1, entregue_ao_cliente: 1, concluido: 1, "concluído": 1, delivered: 1, completed: 1 };
  function carregarEntregues(depois, forcar) {
    if (!SB || esperar || (!forcar && Date.now() - ultimo < 300000)) return;
    esperar = true;
    (async function () {
      try {
        var r = await SB.from("orders").select("id,escrow_status,status").limit(2000);
        if (r.error) r = await SB.from("orders").select("id,escrow_status").limit(2000);
        if (!r.error && r.data) {
          var n = {}; r.data.forEach(function (o) { IDS[String(o.id).slice(0, 8).toUpperCase()] = o.id; });
          r.data.forEach(function (o) { var e = String(o.escrow_status || "").toLowerCase(), st = String(o.status || "").toLowerCase(); if (FIM[e] || FIM[st]) n[String(o.id).slice(0, 8).toUpperCase()] = 1; });
          var mudou = Object.keys(n).length !== Object.keys(ENT).length || !ultimo; ENT = n; ultimo = Date.now();
          if (mudou && depois) depois();
        }
      } catch (e) {}
      esperar = false;
    })();
  }

  /* cartão da encomenda: foto, preço e etapas (função pedido_etapas no Supabase) */
  function dataC(t) { try { return t ? new Date(t).toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; } catch (e) { return ""; } }
  function dinh(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function cartao(k, depois) {
    css();
    if (!k) return "";
    var id = IDS[k], c = id ? ET[id] : undefined;
    if (c === false) return "";
    if (!c) {
      if (!id) { carregarEntregues(function () { if (depois) depois(); }, true); return '<div class="bbp-n">A carregar a encomenda…</div>'; }
      if (c === undefined && SB && !ET["_p" + id]) {
        ET["_p" + id] = 1;
        SB.rpc("pedido_etapas", { p_order: String(id) }).then(function (r) { ET[id] = r && !r.error && r.data ? r.data : false; delete ET["_p" + id]; if (depois) depois(); }, function () { ET[id] = false; delete ET["_p" + id]; });
      }
      return '<div class="bbp-n">A carregar a encomenda…</div>';
    }
    var prods = c.produtos; if (typeof prods === "string") { try { prods = JSON.parse(prods); } catch (e) { prods = []; } } if (!Array.isArray(prods)) prods = [];
    var h = '<div class="bbp-c">';
    h += prods.slice(0, 3).map(function (i) {
      var det = [i.cor, i.tamanho].filter(Boolean).join(" · ");
      return '<div class="bbp-i">' + (i.foto ? '<img src="' + esc(i.foto) + '" alt="">' : '<div class="sf"></div>') + '<div class="tx"><b>' + esc(i.nome || "Produto") + "</b><small>" + esc(det) + (det ? " · " : "") + "× " + esc(i.qtd || 1) + "</small>" + (i.preco ? '<span class="pr">' + dinh(i.preco, i.moeda || c.moeda) + "</span>" : "") + "</div></div>";
    }).join("") + (prods.length > 3 ? '<div class="bbp-n">+ ' + (prods.length - 3) + " produto(s)</div>" : "");
    h += '<div class="bbp-tot"><span>Total</span><b>' + dinh(c.total, c.moeda) + "</b></div>";
    if (c.cancelado) h += '<div class="bbp-av">Encomenda cancelada.</div>';
    else if (c.disputa) h += '<div class="bbp-av">⚠️ Há uma disputa nesta encomenda.</div>';
    var et = c.etapas || [], atual = -1;
    for (var q = 0; q < et.length; q++) { if (!et[q].d) { atual = q; break; } }
    h += '<div class="bbp-et">' + et.map(function (e, q) {
      var cl = e.d ? "ok" : q === atual && !c.cancelado ? "now" : "";
      var nota = e.n && (e.d || q === atual) ? "<small>" + esc(e.n) + "</small>" : "";
      return '<div class="bbp-s ' + cl + '"><i>' + (e.d ? "✓" : q === atual ? "●" : "") + '</i><div><b>' + esc(e.t) + "</b>" + (e.em ? "<small>" + esc(dataC(e.em)) + "</small>" : "") + nota + (q === atual && !c.cancelado ? '<small class="em">Em curso</small>' : "") + "</div></div>";
    }).join("") + "</div>";
    if (c.papel === "cliente") h += '<a class="bbp-l" href="pedidos.html?pedido=' + encodeURIComponent(c.id) + '">' + (c.mz && atual >= 3 && atual <= 4 ? "💳 Abrir a encomenda e pagar o transporte ›" : "Abrir a encomenda completa ›") + "</a>";
    return h + "</div>";
  }
  function grupos(L) {
    var mapa = {}, ordem = [], ano = Date.now() - 365 * 86400000;
    L.forEach(function (a) {
      if (tempo(a) && tempo(a) < ano) return;
      var k = pedidoDe(a);
      if (!mapa[k]) { mapa[k] = { k: k, itens: [] }; ordem.push(mapa[k]); }
      mapa[k].itens.push(a);
    });
    ordem.forEach(function (p) { p.itens.sort(function (x, y) { return tempo(y) - tempo(x); }); });
    ordem.sort(function (x, y) { return tempo(y.itens[0]) - tempo(x.itens[0]); });
    var lim = Date.now() - 30 * 86400000, rec = [], velhas = [];
    ordem.forEach(function (p) { (p.k && ENT[p.k] && tempo(p.itens[0]) && tempo(p.itens[0]) < lim ? velhas : rec).push(p); });
    return { rec: rec, velhas: velhas };
  }
  function chaveMes(p) { var t = new Date(tempo(p.itens[0])); return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2); }
  function nomeMes(c) { var x = c.split("-"); return MESES[Number(x[1]) - 1] + " " + x[0]; }
  function novos(p) { return p.itens.filter(function (a) { return a.lido !== true; }).length; }
  function pasta(p) {
    var nv = novos(p), u = p.itens[0];
    return '<button type="button" class="bbp-p' + (nv ? " novo" : "") + '" data-bbp-p="' + esc(p.k) + '"><span class="ic">' + (p.k ? "📁" : "📋") + '</span><span class="tx"><b>' + (p.k ? "Pedido #" + esc(p.k) : "Outros avisos") + "</b>" + (p.k ? "<span>" + esc(u.titulo) + "</span>" : "") +
      "<small>" + (p.k ? esc(quando(u)) + " · " : "") + p.itens.length + (p.itens.length === 1 ? " aviso" : " avisos") + "</small></span>" + (nv ? '<span class="nb">' + nv + "</span>" : '<span class="ct">›</span>') + "</button>";
  }
  function css() {
    if (document.getElementById("bbp-css")) return;
    var s = document.createElement("style"); s.id = "bbp-css";
    s.textContent = ".bbp-p{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid rgba(100,116,139,.28);border-radius:12px;background:rgba(100,116,139,.07);padding:12px;margin:0 0 8px;font:inherit;color:inherit;cursor:pointer;border-radius:12px}.bbp-p.novo{background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.55)}" +
      ".bbp-p .ic{font-size:26px}.bbp-p .tx{flex:1;min-width:0}.bbp-p b{display:block;font-size:15px}.bbp-p .tx>span{display:block;font-size:13px;opacity:.75;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bbp-p small{display:block;font-size:12px;opacity:.7;margin-top:2px}" +
      ".bbp-p .nb{min-width:24px;height:24px;border-radius:12px;background:#dc2626;color:#fff;font:800 12px system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:0 6px}.bbp-p .ct{opacity:.6;font-size:16px}" +
      ".bbp-v{border:0;background:rgba(100,116,139,.16);color:inherit;border-radius:20px;padding:9px 14px;font:700 14px system-ui,sans-serif;margin:0 0 6px;cursor:pointer;width:auto}.bbp-t{font-weight:800;font-size:15px;margin:6px 2px}.bbp-n{text-align:center;opacity:.65;padding:10px;font-size:13px}";
    s.textContent += ".bbp-c{border:1px solid rgba(100,116,139,.28);border-radius:14px;padding:12px;margin:0 0 12px}.bbp-i{display:flex;gap:10px;align-items:center;margin-bottom:8px}.bbp-i img,.bbp-i .sf{width:64px;height:64px;object-fit:cover;border-radius:10px;background:rgba(100,116,139,.2);flex:none}.bbp-i .tx{min-width:0}.bbp-i b{display:block;font-size:14.5px}.bbp-i small{display:block;font-size:12.5px;opacity:.7}.bbp-i .pr{font-weight:800;font-size:15px;color:#059669}" +
      ".bbp-tot{display:flex;justify-content:space-between;border-top:1px dashed rgba(100,116,139,.4);padding-top:8px;margin-top:4px;font-size:15px}.bbp-av{background:rgba(245,158,11,.16);border-radius:10px;padding:8px 10px;margin-top:8px;font-size:13.5px;font-weight:700}" +
      ".bbp-et{margin-top:12px}.bbp-s{display:flex;gap:10px;position:relative;padding-bottom:14px;opacity:.55}.bbp-s:last-child{padding-bottom:0}.bbp-s.ok,.bbp-s.now{opacity:1}.bbp-s i{flex:none;width:24px;height:24px;border-radius:50%;background:rgba(100,116,139,.25);color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:13px;font-weight:800;position:relative;z-index:1}" +
      ".bbp-s:not(:last-child)::before{content:'';position:absolute;left:11px;top:24px;bottom:0;width:2px;background:rgba(100,116,139,.3)}.bbp-s.ok i{background:#10b981}.bbp-s.ok:not(:last-child)::before{background:#10b981}.bbp-s.now i{background:#f59e0b;animation:bbpP 1.4s infinite}" +
      "@keyframes bbpP{0%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}100%{box-shadow:0 0 0 10px rgba(245,158,11,0)}}.bbp-s b{display:block;font-size:14px}.bbp-s small{display:block;font-size:12.5px;opacity:.75}.bbp-s small.em{color:#d97706;font-weight:800;opacity:1}" +
      ".bbp-l{display:block;text-align:center;margin-top:12px;padding:12px;border-radius:12px;background:linear-gradient(90deg,#10b981,#0ea5e9);color:#fff;font-weight:800;text-decoration:none;font-size:14px}";
    document.head.appendChild(s);
  }
  function render(el, L, linha, vazio, depois) {
    if (!el) return;
    css();
    el.__bbp = { L: L, linha: linha, vazio: vazio, depois: depois, vista: (el.__bbp && el.__bbp.vista) || { t: "raiz" } };
    if (!el.__bbpLigado) {
      el.__bbpLigado = 1;
      el.addEventListener("click", function (e) {
        var S = el.__bbp, x;
        if ((x = e.target.closest("[data-bbp-v]"))) { var al = x.getAttribute("data-bbp-v"); S.vista = al === "antigas" ? { t: "antigas" } : al === "mes" ? { t: "mes", mes: S.vista.mes } : { t: "raiz" }; desenhar(el); return; }
        if (e.target.closest("[data-bbp-a]")) { S.vista = { t: "antigas" }; desenhar(el); return; }
        if ((x = e.target.closest("[data-bbp-m]"))) { S.vista = { t: "mes", mes: x.getAttribute("data-bbp-m" ) }; desenhar(el); return; }
        if ((x = e.target.closest("[data-bbp-p]"))) { S.vista = { t: "pedido", k: x.getAttribute("data-bbp-p"), volta: S.vista.t === "mes" ? "mes" : "raiz", mes: S.vista.mes }; desenhar(el); return; }
      });
    }
    desenhar(el);
    carregarEntregues(function () { desenhar(el); });
  }
  function desenhar(el) {
    var S = el.__bbp, L = S.L, vista = S.vista, html = "";
    var voltar = function (alvo) { return '<button type="button" class="bbp-v" data-bbp-v="' + alvo + '">‹ Voltar</button>'; };
    if (!L.length) { el.innerHTML = '<div class="vazio">' + esc(S.vazio || "Ainda não tem avisos.") + "</div>"; if (S.depois) S.depois(); return; }
    var G = grupos(L), todas = G.rec.concat(G.velhas);
    if (vista.t === "pedido") {
      var p = todas.filter(function (x) { return x.k === vista.k; })[0];
      if (p) {
        el.innerHTML = voltar(vista.volta || "raiz") + '<div class="bbp-t">' + (p.k ? "📁 Pedido #" + esc(p.k) : "📋 Outros avisos") + "</div>" + (p.k ? cartao(p.k, function () { desenhar(el); }) + '<div class="bbp-t" style="font-size:14px">🔔 Avisos desta encomenda</div>' : "") + p.itens.slice(0, 100).map(function (a) { return S.linha(a, L.indexOf(a)); }).join("");
        if (S.depois) S.depois(); return;
      }
      S.vista = vista = { t: "raiz" };
    }
    if (vista.t === "antigas") {
      var meses = {}, ordem = [];
      G.velhas.forEach(function (p) { var c = chaveMes(p); if (!meses[c]) { meses[c] = []; ordem.push(c); } meses[c].push(p); });
      html = voltar("raiz") + '<div class="bbp-t">🗂️ Encomendas antigas</div>' + (ordem.length ? ordem.map(function (c) {
        return '<button type="button" class="bbp-p" data-bbp-m="' + c + '"><span class="ic">🗓️</span><span class="tx"><b>' + nomeMes(c) + "</b><small>" + meses[c].length + (meses[c].length === 1 ? " encomenda" : " encomendas") + '</small></span><span class="ct">›</span></button>';
      }).join("") : '<div class="bbp-n">Sem encomendas antigas.</div>') + '<div class="bbp-n">Ficam guardadas 1 ano; depois são eliminadas.</div>';
      el.innerHTML = html; if (S.depois) S.depois(); return;
    }
    if (vista.t === "mes") {
      el.innerHTML = voltar("antigas") + '<div class="bbp-t">🗓️ ' + nomeMes(vista.mes) + "</div>" + G.velhas.filter(function (p) { return chaveMes(p) === vista.mes; }).map(pasta).join("");
      if (S.depois) S.depois(); return;
    }
    html = G.rec.map(pasta).join("");
    if (G.velhas.length) html += '<button type="button" class="bbp-p" data-bbp-a="1"><span class="ic">🗂️</span><span class="tx"><b>Encomendas antigas</b><small>' + G.velhas.length + (G.velhas.length === 1 ? " encomenda" : " encomendas") + ' · por mês</small></span><span class="ct">›</span></button>';
    el.innerHTML = html || '<div class="vazio">' + esc(S.vazio || "Ainda não tem avisos.") + "</div>";
    if (S.depois) S.depois();
  }
  window.BBPastas = { render: render, pedidoDe: pedidoDe, cartao: cartao, usar: function (sb) { SB = sb; } };
})();
