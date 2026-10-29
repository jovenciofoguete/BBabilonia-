/* painel-vendedor-v2-pecas.js — B-Babilônia: peças do painel do vendedor (parte 2 de 3) */
window.PVpecas = (function () {
var $ = function (i) { return document.getElementById(i); };
var S = null, loja = null, docs = 0, aprovada = false, D = null, filtro = null, api, aviso, desenhar, DIA = 864e5;
function sync(x) { S = x.S; loja = x.loja; docs = x.docs; aprovada = x.aprovada; D = x.D; filtro = x.filtro; api = x.api; aviso = x.aviso; desenhar = x.desenhar; }
function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function num(v, m) { return Number(v || 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + (m ? " " + m : ""); }
function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
function k(x) { return String(x || "").toLowerCase(); }
function data(d) { try { return new Date(d).toLocaleDateString("pt-PT"); } catch (e) { return ""; } }
function hora(d) { try { var x = new Date(d); return (Date.now() - x < DIA ? x.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) : x.toLocaleDateString("pt-PT")); } catch (e) { return ""; } }
function hoje(d) { return d && new Date(d).toDateString() === new Date().toDateString(); }
function desde(dias) { return Date.now() - dias * DIA; }

function estadoLoja() { return loja ? k(loja.estado) : ""; }
function fotoDe(p) { if (p.image_url) return p.image_url; var im = arr(p.images); if (!im.length && typeof p.images === "string" && /^http/.test(p.images)) im = [p.images]; var a = im[0]; return typeof a === "string" ? a : (a && (a.url || a.foto || a.src)) || ""; }
function stockDe(p) { if (Number(p.stock_total) > 0) return Number(p.stock_total); var v = arr(p.variants); if (v.length) return v.reduce(function (s, x) { return s + Number(x.stock || x.quantity || x.qtd || 0); }, 0); return Number(p.stock || 0); }
function estPed(p) {
  var s = k(p.status), e = k(p.escrow_status);
  if (/cancel/.test(s)) return ["Cancelado", "b-er", "can"];
  if (/entregue|delivered|conclu|recebid/.test(s) || /entregue|liberado/.test(e)) return ["Entregue", "b-ok", "ent"];
  if (/enviad|shipped|transito/.test(s)) return ["Enviado", "b-az", "env"];
  if (k(p.payment_status) !== "pago") return ["Aguarda pagamento", "b-cz", "pag"];
  return ["Por enviar", "b-av", "por"];
}
function pago(p) { return k(p.payment_status) === "pago" && estPed(p)[2] !== "can"; }
function msgsNovas() { return D.msgs.filter(function (m) { return m.remetente_id !== S.user.id && new Date(m.created_at) > desde(1); }); }

/* ---------- desenho: peças ---------- */
function linhaSvg(vals) {
  var w = 600, h = 140, mx = Math.max.apply(null, vals.concat([1])), n = vals.length, pts = vals.map(function (v, i) { return [Math.round(i * (w - 20) / Math.max(1, n - 1)) + 10, Math.round(h - 18 - v / mx * (h - 34))]; });
  var l = pts.map(function (p) { return p.join(","); }).join(" ");
  return '<svg class="gr" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none"><polygon fill="#ede9fe" points="10,' + (h - 18) + " " + l + " " + (w - 10) + "," + (h - 18) + '"/><polyline fill="none" stroke="#7c3aed" stroke-width="3" points="' + l + '"/>' + pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#7c3aed"/>'; }).join("") + "</svg>";
}
function barrasSvg(vals) {
  var w = 600, h = 140, mx = Math.max.apply(null, vals.concat([1])), bw = (w - 20) / vals.length;
  return '<svg class="gr" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none">' + vals.map(function (v, i) { var bh = Math.max(2, v / mx * (h - 24)); return '<rect x="' + (10 + i * bw + 2) + '" y="' + (h - 12 - bh) + '" width="' + Math.max(2, bw - 4) + '" height="' + bh + '" rx="3" fill="' + (v ? "#7c3aed" : "#e5e7eb") + '"/>'; }).join("") + "</svg>";
}
function porDia(lista, dias, campo, valor) {
  var out = []; for (var i = dias - 1; i >= 0; i--) { var d0 = new Date(); d0.setHours(0, 0, 0, 0); d0 = d0.getTime() - i * DIA; out.push(lista.filter(function (x) { var t = new Date(x[campo]).getTime(); return t >= d0 && t < d0 + DIA; }).reduce(function (s, x) { return s + (valor ? Number(x[valor] || 0) : 1); }, 0)); }
  return out;
}
function soma(a) { return a.reduce(function (s, x) { return s + x; }, 0); }
function cresc(a, b) { if (!b) return a ? '<span class="cres">novo</span>' : ""; var p = Math.round((a - b) / b * 100); return '<span class="cres' + (p < 0 ? " neg" : "") + '">' + (p >= 0 ? "+" : "") + p + "%</span>"; }
function moeda() { var c = {}; D.peds.forEach(function (p) { c[p.currency || "MZN"] = (c[p.currency || "MZN"] || 0) + 1; }); return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0] || "MZN"; }
function cabLoja() {
  var e = estadoLoja(), b = !loja ? '<span class="bdg b-cz">Sem loja</span>' : e.indexOf("aprov") === 0 ? '<span class="bdg b-ok">✔ Verificado</span>' : /rejeit|recus/.test(e) ? '<span class="bdg b-er">Rejeitada</span>' : /suspen/.test(e) ? '<span class="bdg b-er">Suspensa</span>' : '<span class="bdg b-av">Em análise</span>';
  var pais = ""; try { pais = loja && loja.pais ? new Intl.DisplayNames(["pt"], { type: "region" }).of(loja.pais) : ""; } catch (x) { pais = loja.pais; }
  return '<div class="cx loja1"><div class="ic">' + esc(((loja && loja.nome) || "?").charAt(0).toUpperCase()) + '</div><div style="min-width:0"><b>' + esc(loja ? loja.nome : "Ainda não tem loja") + "</b> " + b +
    '<div class="m">' + (loja ? "ID da loja: " + esc(loja.id) + (loja.tipo ? " · Tipo: " + esc(loja.tipo) : "") + (pais ? " · País: " + esc(pais) : "") : esc(S.user.email)) + "</div>" +
    '<div style="margin-top:4px"><a class="lk" href="' + (loja ? "loja-editar.html" : "loja-criar.html") + '">' + (loja ? "Editar perfil da loja" : "Criar a minha loja") + '</a><a class="lk" href="loja.html?f=' + encodeURIComponent(S.user.id) + '">Ver a minha loja</a></div></div></div>';
}
function passos() {
  var e = estadoLoja(), L = [["Criar conta", S.user.email, "feito"]];
  L.push(loja ? ["Criar a loja", loja.nome, "feito"] : ["Criar a loja", "Nome, país, entregas e envios", "agora", "Criar loja", "loja-criar.html"]);
  L.push(!loja ? ["Enviar documentos", "Identificação e documentos da empresa", ""] : docs ? ["Enviar documentos", docs + (docs === 1 ? " documento enviado" : " documentos enviados"), "feito"] : ["Enviar documentos", "Ainda não enviou documentos", "agora", "Enviar", "loja-criar.html"]);
  L.push(!loja ? ["Aprovação da BBabilônia", "Verificamos os documentos", ""] : e.indexOf("aprov") === 0 ? ["Loja aprovada", "Já pode publicar e vender", "feito"] : /rejeit|recus/.test(e) ? ["Loja rejeitada", loja.motivo || "Corrija os documentos e envie de novo", "erro", "Corrigir", "loja-criar.html"] : /suspen/.test(e) ? ["Loja suspensa", "Fale com o atendimento da BBabilônia", "erro"] : ["Em análise", "Avisamos quando a loja for aprovada", "agora"]);
  L.push(["Publicar produtos", "Fotos, vídeo, preço, stock e pedido mínimo", D.prods.length ? "feito" : "", aprovada ? "Publicar" : "", "registar-produto.html"]);
  return '<div class="cx"><h2>Começar a vender</h2>' + L.map(function (p, i) { return '<div class="ps ' + p[2] + '"><i>' + (p[2] === "feito" ? "✓" : p[2] === "erro" ? "!" : i + 1) + "</i><div><b>" + esc(p[0]) + "</b><span>" + esc(p[1]) + "</span></div>" + (p[3] ? '<a class="bt p" href="' + p[4] + '">' + esc(p[3]) + "</a>" : "") + "</div>"; }).join("") + "</div>";
}
function lnProd(p, edit) {
  var f = fotoDe(p), st = stockDe(p), pub = p.active !== false;
  return '<div class="ln">' + (f ? '<img loading="lazy" alt="" src="' + esc(f) + '">' : '<div class="sf">Sem foto</div>') + '<div class="t"><b>' + esc(p.name || "Produto") + "</b><span>" + num(p.price, p.currency || "MZN") + " · " + (st > 0 ? "Stock " + st : '<b style="display:inline;color:#b91c1c">Sem stock</b>') + "</span></div>" +
    '<div class="ac"><span class="bdg ' + (pub ? "b-ok" : "b-cz") + '">' + (pub ? "Publicado" : "Oculto") + "</span>" + (edit ? '<button class="bt" data-ed="' + esc(p.id) + '">Editar</button>' : "") + '<a class="bt" href="produto-bbabilonia.html?id=' + encodeURIComponent(p.id) + '">Ver</a></div></div>';
}
function lnPed(p) {
  var e = estPed(p), it = arr(p.items), f = it[0] && it[0].foto;
  return '<div class="ln">' + (f ? '<img loading="lazy" alt="" src="' + esc(f) + '">' : '<div class="sf">🧾</div>') + '<div class="t"><b>#' + esc(String(p.id).slice(0, 8).toUpperCase()) + " · " + esc(p.customer_name || "Cliente") + "</b><span>" + num(p.total, p.currency || "MZN") + " · " + data(p.created_at) + " · " + it.length + (it.length === 1 ? " artigo" : " artigos") + '</span></div><div class="ac"><span class="bdg ' + e[1] + '">' + e[0] + '</span><a class="bt" href="' + (e[2] === "por" ? "fornecedor-envios.html" : e[2] === "ent" ? "fornecedor-saldo.html" : "fornecedor-envios.html") + '">Ver</a></div></div>';
}
function lnConv(c) {
  var m = D.msgs.filter(function (x) { return x.conversa_id === c.id; })[0], nova = m && m.remetente_id !== S.user.id && new Date(m.created_at) > desde(1);
  var cor = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899"][String(c.cliente_id || c.id).charCodeAt(0) % 5];
  var txt = !m ? "Sem mensagens" : m.tipo === "imagem" ? "📷 Imagem" : m.tipo === "endereco" ? "📍 Endereço de entrega" : m.texto;
  return '<a class="ln" href="chat-novo2.html"><div class="av2" style="background:' + cor + '">' + esc((c.assunto || "C").charAt(0).toUpperCase()) + '</div><div class="t"><b>' + esc(c.assunto || "Conversa") + "</b><span>" + esc(txt) + '</span></div><div class="ac"><span class="sub">' + (m ? hora(m.created_at) : "") + "</span>" + (nova ? '<span class="bdg b-er">nova</span>' : "") + "</div></a>";
}
function bloqueado(nome) {
  return '<div class="cx bloq"><div class="i">🔒</div><b>' + esc(nome) + ' fica disponível depois de a loja ser aprovada</b><p>' + (loja ? "A sua loja está em análise. Avisamos quando for aprovada." : "Primeiro crie a sua loja e envie os documentos.") + "</p>" + (loja ? "" : '<a class="bt p" href="loja-criar.html">Criar a minha loja</a>') + "</div>" + passos();
}

/* ---------- menu de cartões coloridos ---------- */
function menu() {
  var f = S.user.id, nm = msgsNovas().length, npor = D.peds.filter(function (p) { return estPed(p)[2] === "por"; }).length;
  var C = [
    ["Produtos", [["c2", "📦", "Produtos", "Ver, editar, ocultar e pesquisar", "#produtos", 1], ["c2", "➕", "Publicar produto", "Fotos, cores, tamanhos, stock e vídeo", "registar-produto.html", 1], ["c3", "📝", "Detalhes do produto", "Especificações e opções obrigatórias", "detalhes-fornecedor.html", 1]]],
    ["Encomendas e dinheiro", [["c8", "🧾", "Encomendas", "Todas as encomendas e os estados", "#encomendas", 1, npor], ["c8", "🚚", "Por enviar e Enviados", "Fotos do pacote, rastreamento e marcar enviado", "fornecedor-envios.html", 1], ["c10", "⚠️", "Disputas e reembolsos", "Responder ao cliente e ver as decisões", "fornecedor-disputas.html", 1], ["c4", "✅", "Entregues e saldo", "Saldo retido, entregues e marcar como entregue", "fornecedor-saldo.html", 1]]],
    ["Clientes e vendas", [["c5", "💬", "Mensagens", "Conversas com os clientes", "#mensagens", 0, nm], ["c7", "🔔", "Avisos", "Pedidos, pagamentos e mensagens", "avisos.html", 0], ["c3", "📊", "Estatísticas", "Visitas, vendas e produtos mais vistos", "#estatisticas", 1], ["c11", "📣", "Marketing", "Lives e partilhar a loja e os produtos", "#marketing", 1]]],
    ["A minha loja", [["c1", "🏪", "A minha loja", "Criar a loja, documentos e estado", "#loja", 0], ["c9", "⚙️", "Editar a loja", "Países de entrega, meios de envio e descrição", "loja-editar.html", 1], ["c6", "🛍️", "Ver a minha loja", "Como os clientes veem a sua loja", "loja.html?f=" + encodeURIComponent(f), 0], ["c12", "👤", "Conta", "Email, palavra-passe e sair", "#conta", 0], ["c6", "🎧", "Centro de ajuda", "Perguntas frequentes e regras", "#ajuda", 0]]]
  ];
  return (aprovada ? "" : '<div class="aviso"><b>Dica:</b> só lojas <b>aprovadas</b> podem publicar produtos. Comece por "A minha loja".</div>') +
    C.map(function (g) { return '<div class="sec">' + g[0] + '</div><div class="grid">' + g[1].map(function (c) { var b = c[5] && !aprovada; return '<a class="c ' + c[0] + (b ? " bloq" : "") + '" href="' + c[4] + '"' + (b ? " data-bloq" : "") + '><span class="i">' + c[1] + "</span><b>" + c[2] + "</b><span>" + c[3] + "</span>" + (c[6] && !b ? '<i class="nb">' + c[6] + "</i>" : "") + "</a>"; }).join("") + "</div>"; }).join("");
}

return { sync: sync, esc: esc, num: num, arr: arr, k: k, data: data, hora: hora, hoje: hoje, desde: desde, estadoLoja: estadoLoja, fotoDe: fotoDe, stockDe: stockDe, estPed: estPed, pago: pago, msgsNovas: msgsNovas, linhaSvg: linhaSvg, barrasSvg: barrasSvg, porDia: porDia, soma: soma, cresc: cresc, moeda: moeda, cabLoja: cabLoja, passos: passos, lnProd: lnProd, lnPed: lnPed, lnConv: lnConv, bloqueado: bloqueado, menu: menu };
})();
                                                                       
