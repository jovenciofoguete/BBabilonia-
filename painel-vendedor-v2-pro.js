/* painel-vendedor-v2-pro.js — B-Babilônia: Fornecedor PRO no painel do vendedor.
   PRO = mais vendas e mais visibilidade: os produtos aparecem primeiro na loja e na pesquisa, com o selo 👑 PRO.
   Taxa: 6% por cada venda concluída. Só pode ativar com a loja aprovada e pelo menos 10 vendas concluídas.
   Acrescenta o cartão "👑 Fornecedor PRO" e a página #pro. Não altera os outros ficheiros. */
(function () {
  if (!window.PVsec || !window.PVpecas) return;
  var H = window.PVpecas, esc = H.esc;
  var X = null, ST = null, uid = null, erro = "", aCarregar = false, aMudar = false;
  var MARCA = '<div class="sec">Clientes e vendas</div><div class="grid">';

  var main = document.querySelector("main.conteudo");
  if (main && !document.getElementById("v-pro")) { var sec = document.createElement("section"); sec.id = "v-pro"; sec.className = "hide"; main.appendChild(sec); }
  var css = document.createElement("style");
  css.textContent = ".prot{background:linear-gradient(135deg,#1e1b4b,#7c2d12 60%,#ca8a04);color:#fff;border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 6px 18px #0003}" +
    ".prot h2{font-size:21px;margin:0 0 4px;color:#fff}.prot p{font-size:14px;color:#fde68a;margin:0}" +
    ".prot .tx{display:inline-block;margin-top:12px;background:#fff;color:#7c2d12;border-radius:12px;padding:8px 12px;font-weight:800;font-size:15px}" +
    ".prob div{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--li);font-size:14px}.prob div:first-child{border-top:0}.prob i{font-style:normal;font-size:20px;flex:none}.prob small{display:block;color:var(--su);font-size:12.5px}" +
    ".probar{height:10px;border-radius:6px;background:#e5e7eb;overflow:hidden;margin:8px 0 4px}.probar b{display:block;height:100%;background:linear-gradient(90deg,#f59e0b,#ca8a04)}" +
    ".bt.pro{background:linear-gradient(90deg,#f59e0b,#b45309);color:#fff}.bt.pro:disabled{opacity:.5}";
  document.head.appendChild(css);

  function num(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + (m || ""); }
  function data(d) { try { return new Date(d).toLocaleDateString("pt-PT"); } catch (e) { return ""; } }

  async function carregar() {
    if (aCarregar || !X || !X.S) return; aCarregar = true; erro = "";
    try { ST = await X.api("rpc/estado_pro", "POST", {}); if (!ST || typeof ST !== "object") throw new Error("Sem dados."); }
    catch (e) { ST = null; erro = /function|not find|404|schema cache/i.test(e.message) ? "Falta correr o SQL do PRO no Supabase." : e.message; }
    aCarregar = false; uid = X.S.user.id;
    var vis = document.querySelector("main > section:not(.hide)");
    if (vis && (vis.id === "v-pro" || vis.id === "v-inicio")) X.desenhar();
  }
  var sync0 = PVsec.sync;
  PVsec.sync = function (x) { X = x; sync0(x); if (x.S && x.S.user && uid !== x.S.user.id && !aCarregar) { ST = null; carregar(); } };

  /* cartão no início */
  var ini = PVsec.V.inicio;
  PVsec.V.inicio = function () {
    var t = !ST ? "Mais vendas e mais visibilidade" : ST.pro ? "Ativo · produtos em destaque" : ST.vendas >= ST.minimo ? "Disponível: ative já" : "Faltam " + (ST.minimo - ST.vendas) + " vendas para ativar";
    var c = '<a class="c" style="background:linear-gradient(135deg,#f59e0b,#b45309)" href="#pro"><span class="i">👑</span><b>Fornecedor PRO</b><span>' + esc(t) + "</span>" + (ST && ST.pro ? '<i class="nb" style="background:#16a34a">ON</i>' : "") + "</a>";
    return ini().replace(MARCA, MARCA + c);
  };

  /* página do PRO */
  PVsec.V.pro = function () {
    var topo = '<div class="prot"><h2>👑 Fornecedor PRO</h2><p>Mais vendas e mais visibilidade para os seus produtos.</p><span class="tx">Taxa: 6% por cada venda concluída</span></div>';
    if (erro) return topo + '<div class="cx"><p class="msg">' + esc(erro) + "</p></div>";
    if (!ST) return topo + '<div class="cx"><p class="vazio">A carregar…</p></div>';
    var s = ST, falta = Math.max(0, s.minimo - s.vendas), pode = s.aprovada && falta === 0;
    var ben = '<div class="cx"><h2>O que ganha com o PRO</h2><div class="prob">' +
      "<div><i>🔝</i><span><b>Produtos primeiro</b><small>Os seus produtos aparecem antes dos outros na página inicial, nas categorias e na pesquisa.</small></span></div>" +
      "<div><i>👑</i><span><b>Selo PRO</b><small>O selo 👑 PRO aparece nos seus produtos e na sua loja: os clientes confiam mais.</small></span></div>" +
      "<div><i>📈</i><span><b>Mais vendas</b><small>Mais clientes veem os seus produtos, por isso recebe mais mensagens e pedidos.</small></span></div>" +
      "<div><i>💰</i><span><b>Só paga quando vende</b><small>Sem mensalidade. A taxa de 6% só é descontada das vendas concluídas (pedidos pagos enquanto o PRO está ativo). Pode desativar quando quiser.</small></span></div></div></div>";
    var est;
    if (s.pro) {
      var tp = s.taxas_pagas || {}, ks = Object.keys(tp);
      est = '<div class="cx"><h2>✅ O PRO está ativo</h2><p class="sub">Ativo desde ' + data(s.pro_desde) + ". Taxa: <b>6% por cada venda concluída</b>.</p>" +
        '<div class="tres" style="grid-template-columns:1fr 1fr"><div><span>Vendas PRO concluídas</span><b>' + s.vendas_pro + "</b></div><div><span>Taxas PRO pagas</span><b>" + (ks.length ? ks.map(function (m) { return esc(num(tp[m], m)); }).join("<br>") : "0") + "</b></div></div>" +
        '<button class="bt g" id="proDes" style="margin-top:10px">Desativar o PRO</button><p class="sub" style="margin-top:6px">Ao desativar, os pedidos já pagos com o PRO ativo continuam com a taxa de 6%. Os novos pedidos deixam de ter taxa.</p><p class="msg" id="proMsg"></p></div>';
    } else if (!s.tem_loja || !s.aprovada) {
      est = '<div class="cx"><h2>🔒 Ainda não disponível</h2><p class="sub">' + (s.tem_loja ? "A sua loja ainda não foi aprovada." : "Primeiro crie a sua loja.") + " O PRO fica disponível com a loja aprovada e 10 vendas concluídas.</p></div>";
    } else if (falta) {
      est = '<div class="cx"><h2>🔒 Faltam ' + falta + (falta === 1 ? " venda" : " vendas") + '</h2><p class="sub">O PRO fica disponível depois de <b>10 vendas concluídas</b> no plano básico.</p>' +
        '<div class="probar"><b style="width:' + Math.round(Math.min(1, s.vendas / s.minimo) * 100) + '%"></b></div><div class="sub">' + s.vendas + " de " + s.minimo + " vendas concluídas</div>" +
        '<button class="bt pro g" disabled style="margin-top:10px">👑 Ativar o PRO</button></div>';
    } else {
      est = '<div class="cx"><h2>🎉 Já pode ativar o PRO</h2><p class="sub">Tem ' + s.vendas + " vendas concluídas. Taxa: <b>6% por cada venda concluída</b>, descontada do valor que recebe.</p>" +
        '<label style="display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:10px 0"><input type="checkbox" id="proOk" style="width:20px;height:20px;flex:none;margin-top:1px"> Aceito pagar 6% de cada venda concluída enquanto o PRO estiver ativo.</label>' +
        '<button class="bt pro g" id="proAt" disabled>👑 Ativar o PRO</button><p class="msg" id="proMsg"></p></div>';
    }
    return topo + est + ben;
  };

  async function mudar(ativo) {
    if (aMudar) return; aMudar = true;
    var m = document.getElementById("proMsg"); if (m) { m.className = "msg"; m.textContent = "A guardar…"; }
    try {
      ST = await X.api("rpc/mudar_pro", "POST", { p_ativo: ativo });
      X.aviso(ativo ? "👑 PRO ativado. Os seus produtos já aparecem em destaque." : "PRO desativado.");
      X.desenhar();
    } catch (e) { if (m) m.textContent = e.message; }
    aMudar = false;
  }
  document.addEventListener("change", function (e) { if (e.target && e.target.id === "proOk") { var b = document.getElementById("proAt"); if (b) b.disabled = !e.target.checked; } });
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest("#proAt")) { e.preventDefault(); if (confirm("Ativar o PRO?\nTaxa: 6% por cada venda concluída.")) mudar(true); }
    else if (t.closest("#proDes")) { e.preventDefault(); if (confirm("Desativar o PRO?\nOs seus produtos deixam de aparecer em destaque.")) mudar(false); }
  });
})();
