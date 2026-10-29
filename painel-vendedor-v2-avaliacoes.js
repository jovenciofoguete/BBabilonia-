/* painel-vendedor-v2-avaliacoes.js — B-Babilônia: Avaliações no painel do vendedor
   Acrescenta ao painel (sem mexer nos outros ficheiros): cartão "⭐ Avaliações" em Clientes e vendas,
   página com todas as avaliações dos produtos do vendedor e botão "Responder" (1 resposta por avaliação).
   A resposta passa pelos filtros anti-contactos e aparece aos clientes na página do produto. */
(function () {
  if (!window.PVsec || !window.PVpecas) return;
  var H = window.PVpecas, esc = H.esc, arr = H.arr, data = H.data;
  var X = null, AV = null, uid = null, erro = "", aCarregar = false, AB = "avf";
  var MARCA = '<div class="sec">Clientes e vendas</div><div class="grid">';

  /* filtros anti-contactos (os mesmos do chat) */
  ["filtro-contactos.js", "filtro-contactos-v2.js"].forEach(function (f) {
    if (document.querySelector('script[src^="' + f + '"]')) return;
    var s = document.createElement("script"); s.src = f; document.body.appendChild(s);
  });

  /* secção nova dentro do painel */
  var main = document.querySelector("main.conteudo");
  if (main && !document.getElementById("v-avaliacoes")) { var sec = document.createElement("section"); sec.id = "v-avaliacoes"; sec.className = "hide"; main.appendChild(sec); }
  var css = document.createElement("style");
  css.textContent = ".avs{color:#f59e0b;letter-spacing:1px}.avl{border-top:1px solid var(--li);padding:12px 0}.avl:first-of-type{border-top:0}" +
    ".avl .pr{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--su);margin-bottom:6px}.avl .pr img,.avl .pr .sf{width:34px;height:34px;border-radius:7px;object-fit:cover;background:#f3f3f3;flex:none}" +
    ".avl .l1{display:flex;justify-content:space-between;gap:8px;font-size:13px}.avl p{font-size:14px;margin:6px 0;white-space:pre-line}.avl .det{font-size:12px;color:var(--su)}" +
    ".avl .fs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.avl .fs img{width:64px;height:64px;object-fit:cover;border-radius:8px}" +
    ".avl .rsp{background:var(--cl);border-left:4px solid var(--r3);border-radius:10px;padding:8px 10px;margin-top:8px;font-size:13.5px}.avl .rsp b{color:var(--r2);font-size:12.5px}" +
    ".avbar{font-size:12px;flex:1}.avbar div{display:flex;align-items:center;gap:6px;margin:2px 0}.avbar i{flex:1;height:7px;border-radius:4px;background:#e5e7eb;overflow:hidden;display:block}.avbar i b{display:block;height:100%;background:#f59e0b}" +
    "textarea.cp{width:100%;border:1.5px solid #ddd;border-radius:10px;padding:11px;font:inherit;font-size:15px;margin:6px 0;resize:vertical}";
  document.head.appendChild(css);

  function est(v) { var s = ""; for (var i = 1; i <= 5; i++) s += v >= i - 0.25 ? "★" : "☆"; return s; }
  function porResp() { return (AV || []).filter(function (a) { return !a.resposta; }).length; }

  async function carregar() {
    if (aCarregar || !X || !X.S) return; aCarregar = true; erro = "";
    try { var r = await X.api("rpc/avaliacoes_do_fornecedor", "POST", {}); AV = Array.isArray(r) ? r : []; }
    catch (e) { AV = []; erro = /function|not find|404/i.test(e.message) ? "Falta correr o SQL das avaliações no Supabase." : e.message; }
    aCarregar = false; uid = X.S.user.id;
    var vis = document.querySelector("main > section:not(.hide)");
    if (vis && (vis.id === "v-avaliacoes" || (vis.id === "v-inicio" && porResp()))) X.desenhar();
  }

  /* apanhar a sessão e o resto do painel */
  var sync0 = PVsec.sync;
  PVsec.sync = function (x) { X = x; sync0(x); if (x.S && x.S.user && uid !== x.S.user.id && !aCarregar) { AV = null; carregar(); } };

  /* cartão no início */
  var ini = PVsec.V.inicio;
  PVsec.V.inicio = function () {
    var n = porResp();
    var c = '<a class="c" style="background:linear-gradient(135deg,#fbbf24,#d97706)" href="#avaliacoes"><span class="i">⭐</span><b>Avaliações</b><span>Ver e responder às avaliações dos clientes</span>' + (n ? '<i class="nb">' + n + "</i>" : "") + "</a>";
    return ini().replace(MARCA, MARCA + c);
  };

  /* página das avaliações */
  PVsec.V.avaliacoes = function () {
    var f = (X && X.filtro && X.filtro[AB]) || "todas";
    if (AV === null) return '<div class="cx"><h2>⭐ Avaliações</h2><p class="vazio">A carregar…</p></div>';
    if (erro) return '<div class="cx"><h2>⭐ Avaliações</h2><p class="msg">' + esc(erro) + "</p></div>";
    var L = AV, n = L.length, soma = 0, c = [0, 0, 0, 0, 0, 0];
    L.forEach(function (a) { var e = Math.max(1, Math.min(5, Number(a.estrelas) || 0)); soma += e; c[e]++; });
    var med = n ? soma / n : 0, pr = porResp();
    var lista = L.filter(function (a) { return f === "todas" || (f === "por" ? !a.resposta : f === "resp" ? !!a.resposta : Number(a.estrelas) <= 2); });
    var topo = '<div class="cx"><h2>⭐ Avaliações dos clientes</h2>' + (n ?
      '<div style="display:flex;gap:16px;align-items:center"><div><span class="grande">' + med.toFixed(1).replace(".", ",") + '</span><div class="avs">' + est(med) + '</div><div class="sub">' + n + (n === 1 ? " avaliação" : " avaliações") + "</div></div>" +
      '<div class="avbar">' + [5, 4, 3, 2, 1].map(function (s) { return "<div>" + s + "★<i><b style=\"width:" + Math.round(c[s] * 100 / n) + '%"></b></i>' + c[s] + "</div>"; }).join("") + "</div></div>" +
      (pr ? '<div class="aviso" style="margin:12px 0 0"><b>' + pr + (pr === 1 ? " avaliação por responder." : " avaliações por responder.") + "</b> Responder com educação aumenta a confiança dos clientes.</div>" : "")
      : '<p class="vazio">Ainda não tem avaliações. Os clientes avaliam depois de receber a encomenda.</p>') + "</div>";
    if (!n) return topo;
    var abas = '<div class="abas" data-f="' + AB + '">' + [["todas", "Todas (" + n + ")"], ["por", "Por responder (" + pr + ")"], ["resp", "Respondidas (" + (n - pr) + ")"], ["neg", "1 e 2 estrelas (" + (c[1] + c[2]) + ")"]].map(function (a) { return '<button data-a="' + a[0] + '" class="' + (f === a[0] ? "on" : "") + '">' + a[1] + "</button>"; }).join("") + "</div>";
    return topo + '<div class="cx">' + abas + (lista.map(function (a) {
      var fs = arr(a.fotos);
      return '<div class="avl"><div class="pr">' + (a.produto_foto ? '<img loading="lazy" alt="" src="' + esc(a.produto_foto) + '">' : '<span class="sf"></span>') + '<a href="produto-bbabilonia.html?id=' + encodeURIComponent(a.product_id) + '">' + esc(a.produto_nome || "Produto") + "</a></div>" +
        '<div class="l1"><span><span class="avs">' + est(Number(a.estrelas) || 0) + "</span> " + esc(a.nome || "Cliente") + '</span><span class="sub">' + data(a.created_at) + "</span></div>" +
        (a.detalhe ? '<div class="det">' + esc(a.detalhe) + "</div>" : "") + (a.comentario ? "<p>" + esc(a.comentario) + "</p>" : "") +
        (fs.length ? '<div class="fs">' + fs.map(function (u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener"><img loading="lazy" alt="" src="' + esc(u) + '"></a>'; }).join("") + "</div>" : "") +
        (a.resposta ? '<div class="rsp"><b>A sua resposta · ' + data(a.resposta_em) + "</b><div>" + esc(a.resposta) + "</div></div>" : '<button class="bt p" data-resp="' + esc(a.id) + '" style="margin-top:6px">💬 Responder</button>') + "</div>";
    }).join("") || '<p class="vazio">Nenhuma avaliação aqui.</p>') + "</div>";
  };

  /* responder */
  function responder(id) {
    var a = (AV || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!a) return;
    document.getElementById("modalCx").innerHTML = '<h2>💬 Responder à avaliação</h2><div class="sub"><span class="avs">' + est(Number(a.estrelas) || 0) + "</span> " + esc(a.nome || "Cliente") + "</div>" + (a.comentario ? '<p style="font-size:14px;margin:6px 0">' + esc(a.comentario) + "</p>" : "") +
      '<textarea class="cp" id="avTx" rows="4" maxlength="1000" placeholder="Escreva a sua resposta ao cliente"></textarea><p class="sub">A resposta aparece a todos os clientes na página do produto. Só pode responder 1 vez. Proibido contactos, links e redes sociais.</p>' +
      '<button class="bt p g" id="avEnv" style="margin-top:8px">Enviar</button><button class="bt g" id="avFec" style="margin-top:8px">Fechar</button><p class="msg" id="avMsg"></p>';
    document.getElementById("modal").classList.add("on");
    var tx = document.getElementById("avTx"), bt = document.getElementById("avEnv"), m = document.getElementById("avMsg");
    if (window.FiltroContactos && window.FiltroContactos.ligar) window.FiltroContactos.ligar(tx, bt, m);
    tx.focus();
    document.getElementById("avFec").onclick = function () { document.getElementById("modal").classList.remove("on"); };
    bt.onclick = async function () {
      var t = tx.value.trim(); m.className = "msg";
      if (t.length < 2) { m.textContent = "Escreva a resposta."; return; }
      if (window.FiltroContactos) { var r = window.FiltroContactos.verificar(t); if (!r.ok) { m.textContent = r.motivo; return; } }
      bt.disabled = true; bt.textContent = "A enviar…";
      try {
        await X.api("rpc/responder_avaliacao", "POST", { p_id: String(a.id), p_resposta: t });
        a.resposta = t; a.resposta_em = new Date().toISOString();
        document.getElementById("modal").classList.remove("on"); X.aviso("Resposta publicada."); X.desenhar();
      } catch (e) { m.textContent = e.message; bt.disabled = false; bt.textContent = "Enviar"; }
    };
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-resp]") : null;
    if (b) { e.preventDefault(); responder(b.getAttribute("data-resp")); }
  });
})();
