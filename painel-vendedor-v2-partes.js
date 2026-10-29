/* painel-vendedor-v2-partes.js — B-Babilônia: secções do painel do vendedor (parte 3 de 3) */
window.PVsec = (function () {
var $ = function (i) { return document.getElementById(i); };
var S = null, loja = null, docs = 0, aprovada = false, D = null, filtro = null, api, aviso, desenhar, DIA = 864e5;
var H = window.PVpecas, esc = H.esc, num = H.num, arr = H.arr, k = H.k, data = H.data, hora = H.hora, hoje = H.hoje, desde = H.desde, estadoLoja = H.estadoLoja, fotoDe = H.fotoDe, stockDe = H.stockDe, estPed = H.estPed, pago = H.pago, msgsNovas = H.msgsNovas, linhaSvg = H.linhaSvg, barrasSvg = H.barrasSvg, porDia = H.porDia, soma = H.soma, cresc = H.cresc, moeda = H.moeda, cabLoja = H.cabLoja, passos = H.passos, lnProd = H.lnProd, lnPed = H.lnPed, lnConv = H.lnConv, bloqueado = H.bloqueado, menu = H.menu;
function sync(x) { H.sync(x); S = x.S; loja = x.loja; docs = x.docs; aprovada = x.aprovada; D = x.D; filtro = x.filtro; api = x.api; aviso = x.aviso; desenhar = x.desenhar; }
/* ---------- secções ---------- */
var V = {};
V.inicio = function () {
  var c7 = porDia(D.peds.filter(pago), 7, "created_at", "total"), a7 = porDia(D.peds.filter(pago), 14, "created_at", "total").slice(0, 7), m = moeda();
  var v7 = D.vis.filter(function (x) { return new Date(x.created_at) > desde(7); }).length, v14 = D.vis.filter(function (x) { var t = new Date(x.created_at); return t > desde(14) && t <= desde(7); }).length;
  var p30 = D.peds.filter(function (p) { return pago(p) && new Date(p.created_at) > desde(30); }), cli = {}; p30.forEach(function (p) { cli[p.customer_id || p.customer_phone || p.customer_name] = 1; });
  var nh = function (l) { return l.filter(function (x) { return hoje(x.created_at); }).length; };
  return cabLoja() + (aprovada && D.prods.length ? "" : passos()) + menu() +
    '<div class="kpi"><a href="#produtos"><span class="t">📦 Produtos publicados</span><b>' + D.prods.filter(function (p) { return p.active !== false; }).length + '</b><span class="s">+' + nh(D.prods) + ' hoje</span></a>' +
    '<a href="#encomendas"><span class="t">🧾 Encomendas</span><b>' + D.peds.length + '</b><span class="s">+' + nh(D.peds) + ' hoje</span></a>' +
    '<a href="#mensagens"><span class="t">💬 Mensagens</span><b>' + D.convs.length + '</b><span class="s">+' + msgsNovas().length + ' novas</span></a>' +
    '<a href="#estatisticas"><span class="t">👁️ Visitas à loja</span><b>' + D.vis.length + '</b><span class="s">' + v7 + " nos últimos 7 dias " + cresc(v7, v14) + "</span></a></div>" +
    '<div class="g2"><div class="cx"><h2>Desempenho da loja <a href="#estatisticas">Ver detalhes ›</a></h2><div class="sub">Vendas (últimos 7 dias)</div><span class="grande">' + num(soma(c7), m) + "</span>" + cresc(soma(c7), soma(a7)) + linhaSvg(c7) + "</div>" +
    '<div class="cx"><h2>Visão geral de vendas <span class="sub" style="margin-left:auto">Últimos 30 dias</span></h2><div class="tres"><div><span>Total de vendas</span><b>' + num(p30.reduce(function (s, p) { return s + Number(p.total || 0); }, 0), m) + "</b></div><div><span>Nº de pedidos</span><b>" + p30.length + "</b></div><div><span>Clientes</span><b>" + Object.keys(cli).length + "</b></div></div>" + barrasSvg(porDia(D.peds.filter(pago), 30, "created_at", "total")) + "</div></div>" +
    '<div class="g2"><div class="cx"><h2>Produtos recentes <a href="#produtos">Ver todos ›</a></h2>' + (D.prods.slice(0, 5).map(function (p) { return lnProd(p, aprovada); }).join("") || '<p class="vazio">Ainda não publicou produtos.</p>') + "</div>" +
    '<div class="cx"><h2>Encomendas recentes <a href="#encomendas">Ver todas ›</a></h2>' + (D.peds.slice(0, 5).map(lnPed).join("") || '<p class="vazio">Ainda não recebeu encomendas.</p>') + "</div></div>" +
    '<div class="cx"><h2>Mensagens recentes <a href="#mensagens">Ver todas ›</a></h2>' + (D.convs.slice(0, 3).map(lnConv).join("") || '<p class="vazio">Ainda não tem mensagens de clientes.</p>') + "</div>";
};
V.produtos = function () {
  if (!aprovada) return bloqueado("Publicar e gerir produtos");
  var f = filtro.p || "todos", t = k(filtro.pt || ""), l = D.prods.filter(function (p) { return f === "todos" || (f === "pub" ? p.active !== false : f === "ocu" ? p.active === false : stockDe(p) <= 0); }).filter(function (p) { return !t || k(p.name).indexOf(t) > -1; });
  return '<div class="cx"><h2>Produtos <a class="bt p" href="registar-produto.html" style="color:#fff">+ Publicar produto</a></h2><input class="cp" id="pq" placeholder="Pesquisar nos meus produtos" value="' + esc(filtro.pt || "") + '">' +
    '<div class="abas" data-f="p">' + [["todos", "Todos"], ["pub", "Publicados"], ["ocu", "Ocultos"], ["sem", "Sem stock"]].map(function (a) { return '<button data-a="' + a[0] + '" class="' + (f === a[0] ? "on" : "") + '">' + a[1] + "</button>"; }).join("") + "</div>" +
    (l.map(function (p) { return lnProd(p, true); }).join("") || '<p class="vazio">Nenhum produto aqui.</p>') + '</div><div class="cx"><a class="bt g" href="detalhes-fornecedor.html">📝 Detalhes e opções obrigatórias dos produtos</a></div>';
};
V.encomendas = function () {
  if (!aprovada) return bloqueado("Encomendas");
  var f = filtro.e || "todos", l = D.peds.filter(function (p) { return f === "todos" || estPed(p)[2] === f; }), n = function (c) { return D.peds.filter(function (p) { return estPed(p)[2] === c; }).length; };
  return '<div class="cx"><h2>Encomendas</h2><div class="abas" data-f="e">' + [["todos", "Todas (" + D.peds.length + ")"], ["por", "Por enviar (" + n("por") + ")"], ["env", "Enviadas (" + n("env") + ")"], ["ent", "Entregues (" + n("ent") + ")"], ["pag", "Aguarda pagamento (" + n("pag") + ")"], ["can", "Canceladas (" + n("can") + ")"]].map(function (a) { return '<button data-a="' + a[0] + '" class="' + (f === a[0] ? "on" : "") + '">' + a[1] + "</button>"; }).join("") + "</div>" +
    (l.map(lnPed).join("") || '<p class="vazio">Nenhuma encomenda aqui.</p>') + '</div><div class="g2"><a class="bt g" href="fornecedor-envios.html">🚚 Por enviar e Enviados</a><a class="bt g" href="fornecedor-disputas.html">⚠️ Disputas e reembolsos</a><a class="bt g" href="fornecedor-saldo.html">✅ Entregues e saldo</a></div>';
};
V.mensagens = function () {
  return '<div class="cx"><h2>Mensagens <a class="bt p" href="chat-novo2.html" style="color:#fff">Abrir conversas</a></h2>' + (D.convs.map(lnConv).join("") || '<p class="vazio">Ainda não tem mensagens de clientes.</p>') + '</div><div class="cx"><a class="bt g" href="avisos.html">🔔 Avisos de pedidos, pagamentos e mensagens</a></div>';
};
V.loja = function () {
  var lk = location.origin + location.pathname.replace(/[^/]*$/, "") + "loja.html?f=" + S.user.id;
  return cabLoja() + passos() + '<div class="cx"><h2>Gerir a loja</h2><div class="g2"><a class="bt g" href="loja-criar.html">🏪 A minha loja e documentos</a><a class="bt g" href="loja-editar.html">⚙️ Editar a loja (entregas, envios, descrição)</a><a class="bt g" href="loja.html?f=' + encodeURIComponent(S.user.id) + '">🛍️ Ver a minha loja como os clientes</a><button class="bt g" data-copiar="' + esc(lk) + '">🔗 Copiar o link da minha loja</button></div></div>';
};
V.marketing = function () {
  if (!aprovada) return bloqueado("Marketing");
  var lk = location.origin + location.pathname.replace(/[^/]*$/, "") + "loja.html?f=" + S.user.id;
  return '<div class="cx"><h2>Marketing</h2><div class="g2"><a class="bt g" href="live.html">🎥 Fazer uma live e mostrar produtos em direto</a><button class="bt g" data-partilhar="' + esc(lk) + '">📣 Partilhar a minha loja</button></div></div>' +
    '<div class="cx"><h2>Partilhar um produto</h2>' + (D.prods.filter(function (p) { return p.active !== false; }).slice(0, 20).map(function (p) { var u = location.origin + location.pathname.replace(/[^/]*$/, "") + "produto-bbabilonia.html?id=" + p.id; return lnProd(p, false).replace('<a class="bt" href', '<button class="bt" data-partilhar="' + esc(u) + '">Partilhar</button><a class="bt" href'); }).join("") || '<p class="vazio">Publique produtos para os poder partilhar.</p>') + "</div>";
};
V.estatisticas = function () {
  if (!aprovada) return bloqueado("Estatísticas");
  var v30 = porDia(D.vis, 30, "created_at"), v7 = soma(v30.slice(-7)), p30 = D.peds.filter(function (p) { return new Date(p.created_at) > desde(30); }).length, cont = {};
  D.vis.forEach(function (x) { if (x.produto_id) cont[x.produto_id] = (cont[x.produto_id] || 0) + 1; });
  var top = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; }).slice(0, 5).map(function (id) { var p = D.prods.filter(function (x) { return String(x.id) === id; })[0]; return p ? lnProd(p, false).replace('<div class="ac">', '<div class="ac"><span class="sub">' + cont[id] + " visitas</span>") : ""; }).join("");
  return '<div class="kpi"><a><span class="t">👁️ Visitas (7 dias)</span><b>' + v7 + '</b></a><a><span class="t">👁️ Visitas (30 dias)</span><b>' + soma(v30) + '</b></a><a><span class="t">🧾 Pedidos (30 dias)</span><b>' + p30 + '</b></a><a><span class="t">🎯 Conversão</span><b>' + (soma(v30) ? Math.round(p30 / soma(v30) * 1000) / 10 : 0) + "%</b></a></div>" +
    '<div class="cx"><h2>Visitas à loja por dia <span class="sub" style="margin-left:auto">Últimos 30 dias</span></h2>' + barrasSvg(v30) + "</div>" +
    '<div class="cx"><h2>Produtos mais vistos</h2>' + (top || '<p class="vazio">Ainda não há visitas registadas aos produtos.</p>') + "</div>";
};
V.conta = function () {
  return '<div class="cx"><h2>A minha conta</h2><p class="sub">Email</p><p style="font-weight:700;margin-bottom:12px">' + esc(S.user.email) + '</p><label class="lb" for="np">Nova palavra-passe (mínimo 6)</label><input class="cp" id="np" type="password" autocomplete="new-password"><button class="bt p g" id="bPw">Mudar a palavra-passe</button><p class="msg" id="pwMsg"></p></div><div class="cx"><button class="bt g" id="bSair">Sair da conta</button></div>';
};
V.ajuda = function () {
  var Q = [["Como começo a vender?", "Crie a conta, crie a loja e envie os documentos. Depois de a BBabilônia aprovar, já pode publicar produtos."],
    ["Quanto tempo demora a aprovação?", "Verificamos os documentos o mais depressa possível. O estado aparece em Início e em Loja."],
    ["Quando recebo o dinheiro das vendas?", "O valor fica retido até o cliente receber a encomenda. Depois aparece em Entregues e saldo."],
    ["Como envio uma encomenda?", "Em Encomendas › Por enviar: ponha as fotos do pacote, o número de rastreamento e a transportadora, e marque como enviado."],
    ["Posso dar o meu contacto ao cliente?", "Não. Todas as conversas são dentro da BBabilônia. Mensagens com contactos, redes sociais ou links são bloqueadas."],
    ["O que fazer se o cliente abrir uma disputa?", "Responda em Disputas e reembolsos com fotos e explicações. A BBabilônia decide de forma justa."]];
  return '<div class="cx"><h2>Centro de ajuda</h2>' + Q.map(function (q) { return "<details><summary>" + esc(q[0]) + "</summary><p>" + esc(q[1]) + "</p></details>"; }).join("") + '</div><div class="cx"><a class="bt g" href="termos.html">📄 Termos de uso</a><a class="bt g" href="privacidade.html" style="margin-top:8px">🔒 Privacidade</a></div>';
};

/* ---------- editar produto ---------- */
function editar(id) {
  var p = D.prods.filter(function (x) { return String(x.id) === String(id); })[0]; if (!p) return;
  $("modalCx").innerHTML = '<h2>Editar produto</h2><label class="lb">Nome</label><input class="cp" id="eN" value="' + esc(p.name || "") + '"><label class="lb">Preço (' + esc(p.currency || "MZN") + ')</label><input class="cp" id="eP" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(p.price || 0) + '">' +
    '<label class="lb">Estado</label><select class="cp" id="eA"><option value="1"' + (p.active !== false ? " selected" : "") + '>Publicado (os clientes veem)</option><option value="0"' + (p.active === false ? " selected" : "") + '>Oculto (os clientes não veem)</option></select>' +
    '<button class="bt p g" id="eG">Guardar</button><a class="bt g" style="margin-top:8px" href="detalhes-fornecedor.html">Fotos, cores, tamanhos e detalhes</a><button class="bt g" id="eF" style="margin-top:8px">Fechar</button><p class="msg" id="eM"></p>';
  $("modal").classList.add("on");
  $("eF").onclick = function () { $("modal").classList.remove("on"); };
  $("eG").onclick = async function () {
    var n = $("eN").value.trim(), pr = Number($("eP").value), m = $("eM"); m.className = "msg";
    if (!n) { m.textContent = "Escreva o nome do produto."; return; }
    if (!(pr >= 0)) { m.textContent = "Escreva um preço válido."; return; }
    $("eG").disabled = true;
    try {
      var r = await api("products?id=eq." + encodeURIComponent(p.id) + "&supplier_id=eq." + S.user.id, "PATCH", { name: n, price: pr, active: $("eA").value === "1" });
      if (!r || !r.length) throw new Error("Não foi guardado: sem permissão para este produto.");
      Object.assign(p, r[0]); $("modal").classList.remove("on"); aviso("Produto guardado."); desenhar();
    } catch (e) { m.textContent = e.message; } finally { $("eG").disabled = false; }
  };
}

return { sync: sync, V: V, editar: editar, msgsNovas: msgsNovas };
})();
  
