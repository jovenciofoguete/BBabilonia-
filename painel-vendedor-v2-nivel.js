/* painel-vendedor-v2-nivel.js — B-Babilônia: Nível do fornecedor e Pedidos dos clientes no painel do vendedor.
   Acrescenta (sem mexer nos outros ficheiros) 2 cartões em "Clientes e vendas":
   🏅 Nível do fornecedor (nota, tempo de resposta, vendas, disputas, selo e o que falta para subir)
   📢 Pedidos dos clientes (publicacoes.html). Os números vêm da função nivel_fornecedor no Supabase. */
(function () {
  if (!window.PVsec || !window.PVpecas) return;
  var H = window.PVpecas, esc = H.esc;
  var X = null, NV = null, uid = null, erro = "", aCarregar = false;
  var MARCA = '<div class="sec">Clientes e vendas</div><div class="grid">';
  var NIV = [
    { ic: "🌱", nome: "Novo", cor: "#64748b" },
    { ic: "🥉", nome: "Bronze", cor: "#b45309", v: 1 },
    { ic: "🥈", nome: "Prata", cor: "#475569", v: 10, av: 0, nota: 4.0, h: 24, tx: 80 },
    { ic: "🥇", nome: "Ouro", cor: "#ca8a04", v: 50, av: 10, nota: 4.5, h: 12, tx: 90, d: 5 },
    { ic: "💎", nome: "Diamante", cor: "#0891b2", v: 200, av: 30, nota: 4.7, h: 6, tx: 95, d: 2, dias: 180 }
  ];
  window.NivelFornecedor = NIV;

  var main = document.querySelector("main.conteudo");
  if (main && !document.getElementById("v-nivel")) { var sec = document.createElement("section"); sec.id = "v-nivel"; sec.className = "hide"; main.appendChild(sec); }
  var css = document.createElement("style");
  css.textContent = ".nvt{display:flex;gap:14px;align-items:center}.nvt .ic{font-size:52px;line-height:1}.nvt b{font-size:22px;display:block}" +
    ".nvk{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}@media(min-width:700px){.nvk{grid-template-columns:repeat(4,1fr)}}" +
    ".nvk div{background:var(--cl);border-radius:12px;padding:10px}.nvk b{display:block;font-size:19px}.nvk span{font-size:12px;color:var(--su)}" +
    ".nvr{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-top:1px solid var(--li);font-size:14px}.nvr:first-of-type{border-top:0}.nvr i{font-style:normal;flex:none}" +
    ".nvr small{display:block;color:var(--su);font-size:12.5px}.nvbar{height:8px;border-radius:5px;background:#e5e7eb;overflow:hidden;margin-top:4px}.nvbar b{display:block;height:100%;background:#10b981}" +
    ".nvl{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--li);font-size:13.5px}.nvl:first-of-type{border-top:0}.nvl .ic{font-size:26px;flex:none}.nvl.on{font-weight:800}";
  document.head.appendChild(css);

  function n1(x) { return Number(x).toLocaleString("pt-PT", { maximumFractionDigits: 1 }); }
  function tempo(h) {
    if (h == null) return "—";
    if (h < 1) return "menos de 1 hora";
    if (h < 24) return "~" + Math.round(h) + (Math.round(h) === 1 ? " hora" : " horas");
    var d = Math.round(h / 24); return "~" + d + (d === 1 ? " dia" : " dias");
  }
  function requisitos(i, s) {
    var L = NIV[i], r = [];
    if (!L || i === 0) return r;
    r.push({ ok: s.vendas >= L.v, t: "Vendas concluídas", v: s.vendas + " de " + L.v, p: Math.min(1, s.vendas / L.v) });
    if (L.av) r.push({ ok: s.avaliacoes >= L.av, t: "Avaliações recebidas", v: s.avaliacoes + " de " + L.av, p: Math.min(1, s.avaliacoes / L.av) });
    if (L.nota) {
      var semNota = !L.av && s.avaliacoes < 3;
      r.push({ ok: semNota || (s.nota != null && s.nota >= L.nota), t: "Nota média", v: (s.nota != null ? n1(s.nota) : "sem nota") + " (mínimo " + n1(L.nota) + ")" + (semNota ? " · conta a partir de 3 avaliações" : "") });
    }
    if (L.h) r.push({ ok: s.tempo_resposta_h == null || s.tempo_resposta_h <= L.h, t: "Tempo de resposta no chat", v: tempo(s.tempo_resposta_h) + " (máximo " + L.h + " horas)" });
    if (L.tx) r.push({ ok: s.taxa_resposta == null || s.taxa_resposta >= L.tx, t: "Mensagens respondidas em 24 horas", v: (s.taxa_resposta == null ? "—" : s.taxa_resposta + "%") + " (mínimo " + L.tx + "%)" });
    if (L.d != null) r.push({ ok: s.taxa_disputas <= L.d, t: "Pedidos com disputa", v: n1(s.taxa_disputas) + "% (máximo " + L.d + "%)" });
    if (L.dias) r.push({ ok: s.dias_loja >= L.dias, t: "Tempo com a loja aberta", v: s.dias_loja + " de " + L.dias + " dias", p: Math.min(1, s.dias_loja / L.dias) });
    return r;
  }
  window.NivelFornecedor.requisitos = requisitos;

  async function carregar() {
    if (aCarregar || !X || !X.S) return; aCarregar = true; erro = "";
    try { NV = await X.api("rpc/nivel_fornecedor", "POST", {}); if (!NV || typeof NV !== "object") throw new Error("Sem dados."); }
    catch (e) { NV = null; erro = /function|not find|404|schema cache/i.test(e.message) ? "Falta correr o SQL do nível do fornecedor no Supabase." : e.message; }
    aCarregar = false; uid = X.S.user.id;
    var vis = document.querySelector("main > section:not(.hide)");
    if (vis && (vis.id === "v-nivel" || vis.id === "v-inicio")) X.desenhar();
  }

  var sync0 = PVsec.sync;
  PVsec.sync = function (x) { X = x; sync0(x); if (x.S && x.S.user && uid !== x.S.user.id && !aCarregar) { NV = null; carregar(); } };

  /* cartões no início */
  var ini = PVsec.V.inicio;
  PVsec.V.inicio = function () {
    var L = NV ? NIV[NV.nivel] || NIV[0] : null;
    var c1 = '<a class="c" style="background:linear-gradient(135deg,#14b8a6,#0f766e)" href="#nivel"><span class="i">' + (L ? L.ic : "🏅") + "</span><b>Nível do fornecedor</b><span>" +
      (L ? "Nível " + esc(L.nome) + (NV.nota != null ? " · ⭐ " + n1(NV.nota) : "") : "Nota, tempo de resposta e selo") + "</span></a>";
    var ok = X && X.aprovada;
    var c2 = '<a class="c' + (ok ? "" : " bloq") + '" style="background:linear-gradient(135deg,#22c55e,#15803d)" href="publicacoes.html"' + (ok ? "" : " data-bloq") + '><span class="i">📢</span><b>Pedidos dos clientes</b><span>O que os clientes procuram: responda e venda</span></a>';
    return ini().replace(MARCA, MARCA + c1 + c2);
  };

  /* página do nível */
  PVsec.V.nivel = function () {
    var cab = '<div class="cx"><h2>🏅 Nível do fornecedor</h2>';
    if (erro) return cab + '<p class="msg">' + esc(erro) + "</p></div>";
    if (!NV) return cab + '<p class="vazio">A carregar…</p></div>';
    var s = NV, i = Math.max(0, Math.min(4, Number(s.nivel) || 0)), L = NIV[i], prox = NIV[i + 1];
    var h = cab + '<div class="nvt"><span class="ic">' + L.ic + '</span><div><b style="color:' + L.cor + '">Fornecedor ' + esc(L.nome) + '</b><span class="sub">' +
      (i === 4 ? "O nível mais alto. Os clientes veem o selo 💎 na sua loja." : i === 0 ? "Conclua a primeira venda para ganhar o selo 🥉 Bronze." : "Os clientes veem este selo na sua loja.") + "</span></div></div>" +
      '<div class="nvk"><div><span>⭐ Nota média</span><b>' + (s.nota != null ? n1(s.nota) : "—") + "</b><span>" + s.avaliacoes + (s.avaliacoes === 1 ? " avaliação" : " avaliações") + "</span></div>" +
      "<div><span>⏱️ Tempo de resposta</span><b>" + tempo(s.tempo_resposta_h) + "</b><span>" + (s.taxa_resposta == null ? "sem mensagens (90 dias)" : s.taxa_resposta + "% respondidas em 24 h") + "</span></div>" +
      "<div><span>✅ Vendas concluídas</span><b>" + s.vendas + "</b><span>" + s.pagos + " pedidos pagos</span></div>" +
      "<div><span>⚠️ Disputas</span><b>" + n1(s.taxa_disputas) + "%</b><span>" + s.disputas + (s.disputas === 1 ? " pedido" : " pedidos") + "</span></div></div></div>";
    if (prox) {
      var rq = requisitos(i + 1, s), feitos = rq.filter(function (r) { return r.ok; }).length;
      h += '<div class="cx"><h2>Para chegar a ' + prox.ic + " " + esc(prox.nome) + ' <span class="sub" style="margin-left:auto">' + feitos + " de " + rq.length + "</span></h2>" +
        rq.map(function (r) { return '<div class="nvr"><i>' + (r.ok ? "✅" : "⬜") + '</i><div style="flex:1">' + esc(r.t) + "<small>" + esc(r.v) + "</small>" + (r.p != null && !r.ok ? '<div class="nvbar"><b style="width:' + Math.round(r.p * 100) + '%"></b></div>' : "") + "</div></div>"; }).join("") +
        '<p class="sub" style="margin-top:8px">O nível é recalculado sozinho sempre que abre o painel. O tempo de resposta conta as mensagens dos últimos 90 dias.</p></div>';
    }
    h += '<div class="cx"><h2>Todos os níveis</h2>' + NIV.map(function (n, j) {
      var t = j === 0 ? "Loja nova, ainda sem vendas concluídas" : j === 1 ? "Pelo menos 1 venda concluída" :
        n.v + "+ vendas · nota " + n1(n.nota) + "+ · responde em até " + n.h + " h" + (n.d != null ? " · disputas até " + n.d + "%" : "") + (n.dias ? " · loja com " + n.dias + "+ dias" : "");
      return '<div class="nvl' + (j === i ? " on" : "") + '"><span class="ic">' + n.ic + "</span><div>" + esc(n.nome) + (j === i ? " (o seu nível)" : "") + '<div class="sub">' + esc(t) + "</div></div></div>";
    }).join("") + "</div>" +
      '<div class="cx"><h2>Como subir de nível</h2><p class="sub">Responda depressa no chat (os funcionários também contam), envie a tempo com fotos e rastreio, descreva bem os produtos para evitar disputas e responda às avaliações com educação.</p></div>';
    return h;
  };
})();
