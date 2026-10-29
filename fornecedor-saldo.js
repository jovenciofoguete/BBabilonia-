/* fornecedor-saldo.js — B-Babilônia: código da página fornecedor-saldo.html (saldo e levantamentos) */
(function () {
var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
var CHAVE = "sb-dsfoqoeawvjafypycldz-auth-token", ADMIN = "jovenciofoguete1904@gmail.com";
var $ = function (i) { return document.getElementById(i); };
var S = null, SAL = null, PEDS = [], ADM = [], aba = "pendente";
function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function k(x) { return String(x || "").toLowerCase(); }
function arr(x) { if (typeof x === "string") { try { x = JSON.parse(x); } catch (e) { x = []; } } return Array.isArray(x) ? x : []; }
function din(v, m) { return Number(v || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + (m || ""); }
function dt(d) { try { return d ? new Date(d).toLocaleDateString("pt-PT") : ""; } catch (e) { return ""; } }
function aviso(t) { var e = $("toast"); e.textContent = t; e.style.display = "block"; clearTimeout(e._t); e._t = setTimeout(function () { e.style.display = "none"; }, 3500); }
function mostrar(id) { ["carregar", "v-entrar", "v-forn", "v-admin"].forEach(function (x) { $(x).classList.toggle("hide", x !== id); }); }

/* ---------- sessão (a mesma do painel) ---------- */
function ler() { try { var s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s && s.access_token) return s; } catch (e) {} return null; }
function guardar(s) { if (s && !s.expires_at && s.expires_in) s.expires_at = Math.floor(Date.now() / 1000) + s.expires_in; localStorage.setItem(CHAVE, JSON.stringify(s)); return s; }
async function auth(c, corpo) {
  var r = await fetch(SUPA + "/auth/v1/" + c, { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  var j = await r.json().catch(function () { return {}; });
  if (!r.ok) throw new Error(j.msg || j.error_description || j.message || ("Erro " + r.status));
  return j;
}
async function valida() {
  var s = ler(); if (!s) return null;
  if (s.expires_at && s.expires_at - 60 < Date.now() / 1000 && s.refresh_token) { try { s = guardar(await auth("token?grant_type=refresh_token", { refresh_token: s.refresh_token })); } catch (e) { return null; } }
  return s;
}
async function api(c, metodo, corpo) {
  var r = await fetch(SUPA + "/rest/v1/" + c, { method: metodo || "GET", headers: { apikey: KEY, Authorization: "Bearer " + S.access_token, "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
  var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
  if (!r.ok) { var er = new Error((j && j.message) || ("Erro " + r.status)); er.status = r.status; throw er; }
  return j;
}
function falta(e) { return /saldo_fornecedor|pedir_levantamento|levantamentos_admin|tratar_levantamento|_bb_meus_pedidos/.test(e.message) && /function|find|exist/i.test(e.message); }

/* ---------- FORNECEDOR ---------- */
async function iniciarForn() {
  var r = await Promise.all([
    api("rpc/saldo_fornecedor", "POST", {}),
    api("rpc/pedidos_do_fornecedor", "POST", {}).catch(function () { return []; }),
    api("notifications?select=*&order=created_at.desc&limit=20").catch(function () { return []; })
  ]);
  SAL = r[0] || {}; PEDS = Array.isArray(r[1]) ? r[1] : []; desenharForn(r[2] || []); mostrar("v-forn");
}
function estConta() {
  var c = SAL.conta, l = SAL.loja;
  if (!l) return { ok: false, html: '<div class="aviso er">Primeiro crie a sua loja. <a href="loja-criar.html"><b>Criar loja ›</b></a></div>' };
  if (k(l.estado).indexOf("aprov") !== 0) return { ok: false, html: '<div class="aviso">A sua loja ainda está em análise. Pode pedir levantamentos depois de ser aprovada.</div>' };
  if (!c) return { ok: false, html: '<div class="aviso er">Para receber o dinheiro, registe a conta bancária. <a href="conta-bancaria.html"><b>Registar conta ›</b></a></div>' };
  if (c.estado === "rejeitada") return { ok: false, html: '<div class="aviso er">A sua conta bancária foi rejeitada' + (c.motivo ? ": " + esc(c.motivo) : "") + '. <a href="conta-bancaria.html"><b>Corrigir ›</b></a></div>' };
  if (c.estado !== "confirmada") return { ok: false, html: '<div class="aviso">A sua conta bancária está em verificação. Pode pedir levantamentos quando a BBabilônia a confirmar. <a href="conta-bancaria.html"><b>Ver conta ›</b></a></div>' };
  return { ok: true, html: '<div class="aviso ok">🏦 Recebe em: <b>' + esc(c.banco || "Banco") + "</b>" + (c.final ? " · conta terminada em <b>" + esc(c.final) + "</b>" : "") + ' · <a href="conta-bancaria.html">Mudar</a>' + (c.aceita_usd === false ? '<br><span class="sub">A sua conta não aceita USD: confirme com o seu banco como receber transferências internacionais.</span>' : "") + "</div>" };
}
function desenharForn(nots) {
  var st = estConta(), M = SAL.moedas || [];
  $("saldos").innerHTML = M.length ? M.map(function (m) {
    var pode = st.ok && Number(m.disponivel) > 0;
    return '<div class="moeda"><div class="disp">' + din(m.disponivel, m.moeda) + "<small>Disponível para levantar" + (m.n_disponivel ? " · " + m.n_disponivel + (m.n_disponivel == 1 ? " pedido entregue" : " pedidos entregues") : "") + "</small></div>" +
      '<div class="q4"><div><span>🔒 Retido (aguarda entrega)</span><b>' + din(m.retido, m.moeda) + '</b></div><div><span>⏳ Em levantamento</span><b>' + din(m.em_levantamento, m.moeda) + "</b></div>" +
      '<div><span>✅ Já recebido</span><b>' + din(m.recebido, m.moeda) + '</b></div><div><span>⚠️ Bloqueado por disputa</span><b>' + din(m.em_disputa, m.moeda) + "</b></div></div>" +
      '<button class="bt p" data-lev="' + esc(m.moeda) + '"' + (pode ? "" : " disabled") + ">🏦 Pedir levantamento de " + din(m.disponivel, m.moeda) + "</button></div>";
  }).join("") : '<p class="vazio">Ainda não tem vendas pagas. Quando o cliente pagar, o valor aparece aqui.</p>';
  $("contaCx").innerHTML = st.html;
  var L = SAL.levantamentos || [];
  $("levs").innerHTML = L.length ? L.map(function (l) {
    var b = l.estado === "pago" ? '<span class="bdg b-ok">Pago</span>' : l.estado === "rejeitado" ? '<span class="bdg b-er">Rejeitado</span>' : '<span class="bdg b-av">Em análise</span>';
    return '<div class="ln"><div class="sf">🏦</div><div class="t"><b>' + din(l.valor, l.moeda) + "</b><span>Pedido a " + dt(l.created_at) + " · " + l.n_pedidos + (l.n_pedidos == 1 ? " pedido" : " pedidos") + "</span>" +
      (l.estado === "pago" ? "<span>Pago a " + dt(l.tratado_em) + (l.referencia ? " · Ref.: " + esc(l.referencia) : "") + "</span>" : "") +
      (l.estado === "rejeitado" ? '<span style="color:#b91c1c">Motivo: ' + esc(l.motivo || "") + " (o valor voltou ao saldo disponível)</span>" : "") + "</div>" + b + "</div>";
  }).join("") : '<p class="vazio">Ainda não pediu levantamentos.</p>';
  var P = PEDS.filter(function (p) { return k(p.payment_status) === "pago"; }).sort(function (a, b) { return new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at); });
  $("peds").innerHTML = P.length ? P.slice(0, 100).map(function (p) {
    var e = k(p.escrow_status), it = arr(p.items), f = it[0] && it[0].foto, v = Number(p.supplier_amount || p.subtotal || p.total || 0);
    var b = /cancel/.test(k(p.status)) ? '<span class="bdg b-er">Cancelado</span>' : p.disputa_estado ? '<span class="bdg b-er">Disputa</span>' : e === "retido" ? '<span class="bdg b-av">Retido</span>' : /entregue|liberado/.test(e) ? '<span class="bdg b-ok">Entregue</span>' : '<span class="bdg b-cz">' + esc(p.escrow_status || "—") + "</span>";
    return '<div class="ln">' + (f ? '<img loading="lazy" alt="" src="' + esc(f) + '">' : '<div class="sf">🧾</div>') + '<div class="t"><b>#' + esc(String(p.id).slice(0, 8).toUpperCase()) + " · " + esc(p.customer_name || "Cliente") + "</b><span>" + din(v, p.currency) + " · " + dt(p.paid_at || p.created_at) + "</span>" +
      (e === "retido" && !p.disputa_estado ? '<span style="margin-top:6px"><button class="bt pq" data-ent="' + esc(p.id) + '">Marcar como entregue</button></span>' : "") + "</div>" + b + "</div>";
  }).join("") : '<p class="vazio">Sem pedidos pagos.</p>';
  $("nots").innerHTML = nots.length ? nots.map(function (n) { return '<div class="ln"><div class="sf">🔔</div><div class="t"><b>' + esc(n.title || "") + "</b><span>" + esc(n.message || "") + "</span><span>" + (n.created_at ? new Date(n.created_at).toLocaleString("pt-PT") : "") + "</span></div></div>"; }).join("") : '<p class="vazio">Sem notificações.</p>';
}
function pedir(moeda) {
  var m = (SAL.moedas || []).filter(function (x) { return x.moeda === moeda; })[0], c = SAL.conta || {}; if (!m) return;
  $("modalCx").innerHTML = '<h2>🏦 Pedir levantamento</h2><div class="dl"><b>Valor</b><span style="font-weight:800;color:#047857">' + din(m.disponivel, m.moeda) + "</span><b>Pedidos</b><span>" + m.n_disponivel + " entregues</span><b>Banco</b><span>" + esc(c.banco || "") + (c.final ? " · terminada em " + esc(c.final) : "") + "</span></div>" +
    '<div class="aviso az">A BBabilônia verifica o pedido e transfere em USD por SWIFT para a sua conta confirmada. O seu banco converte para a moeda local e pode cobrar taxas de receção.</div>' +
    '<button class="bt v" id="mOk">Confirmar levantamento</button><button class="bt" id="mNao">Cancelar</button><p class="msg" id="mMsg"></p>';
  $("modal").classList.add("on");
  $("mNao").onclick = function () { $("modal").classList.remove("on"); };
  $("mOk").onclick = async function () {
    var b = this; b.disabled = true; b.textContent = "A enviar…";
    try { var r = await api("rpc/pedir_levantamento", "POST", { p_moeda: moeda }); $("modal").classList.remove("on"); aviso("Pedido enviado: " + din(r.valor, r.moeda) + ". Avisamos quando for pago."); await iniciarForn(); }
    catch (e) { $("mMsg").textContent = e.message; b.disabled = false; b.textContent = "Confirmar levantamento"; }
  };
}

/* ---------- ADMIN ---------- */
async function iniciarAdmin() {
  $("tit").textContent = "Levantamentos dos fornecedores"; $("sub").textContent = "Confira a conta, faça a transferência e marque como pago.";
  $("voltar").href = "painel-admin.html";
  ADM = await api("rpc/levantamentos_admin", "POST", {}) || []; desenharAdmin(); mostrar("v-admin");
}
function linha(n, v) { return v || v === false ? "<b>" + esc(n) + "</b><span>" + esc(v === true ? "Sim" : v === false ? "Não" : v) + "</span>" : ""; }
function desenharAdmin() {
  var n = function (e) { return ADM.filter(function (l) { return l.estado === e; }).length; };
  document.querySelectorAll("#abas button").forEach(function (b) { var a = b.getAttribute("data-a"); b.classList.toggle("on", a === aba); b.textContent = { pendente: "Pendentes", pago: "Pagos", rejeitado: "Rejeitados" }[a] + " (" + n(a) + ")"; });
  var L = ADM.filter(function (l) { return l.estado === aba; });
  $("admLista").innerHTML = L.map(function (l) {
    var c = l.conta || {}, cod = c.codigos && typeof c.codigos === "object" ? Object.keys(c.codigos).map(function (x) { return linha(x.replace(/_/g, " "), c.codigos[x]); }).join("") : "";
    return '<div class="cx"><h2>' + esc(l.loja_nome || "Loja") + ' <span class="bdg ' + (c.aceita_usd === false ? "b-er" : "b-ok") + '">' + (c.aceita_usd === false ? "Não aceita USD" : "Aceita USD") + "</span></h2>" +
      '<div class="moeda"><div class="disp">' + din(l.valor, l.moeda) + "<small>Pedido a " + new Date(l.created_at).toLocaleString("pt-PT") + " · " + l.n_pedidos + " pedidos</small></div></div>" +
      '<div class="dl">' + linha("Titular", c.titular) + linha("Tipo", c.tipo_titular) + linha("Morada titular", c.morada_titular) + linha("Banco", c.banco) + linha("Morada banco", c.morada_banco) + linha("País banco", c.pais_banco) +
      linha("SWIFT/BIC", c.swift) + linha("IBAN", c.iban) + linha("Nº conta", c.numero_conta) + cod + linha("Moeda da conta", c.moeda) + linha("Intermediário", c.intermediario_banco) + linha("SWIFT interm.", c.intermediario_swift) + linha("Estado da conta", c.estado) + "</div>" +
      (l.estado === "pendente" ? '<button class="bt v" data-pago="' + l.id + '">✓ Já transferi — marcar como pago</button><button class="bt x" data-rej="' + l.id + '">✕ Rejeitar</button>' : "") +
      (l.referencia ? '<div class="sub">Referência: ' + esc(l.referencia) + " · " + dt(l.tratado_em) + "</div>" : "") + (l.motivo ? '<div class="sub">Motivo: ' + esc(l.motivo) + "</div>" : "") + "</div>";
  }).join("") || '<div class="cx vazio">Nenhum levantamento aqui.</div>';
}
$("abas").onclick = function (e) { var b = e.target.closest("button"); if (!b) return; aba = b.getAttribute("data-a"); desenharAdmin(); };

/* ---------- cliques ---------- */
document.addEventListener("click", async function (e) {
  var t = e.target.closest ? e.target.closest("button") : null; if (!t || t.disabled) return;
  if (t.hasAttribute("data-lev")) { pedir(t.getAttribute("data-lev")); return; }
  if (t.hasAttribute("data-ent")) {
    if (!confirm("Confirma que os produtos foram entregues ao cliente?")) return;
    t.disabled = true;
    try { await api("rpc/marcar_entregue", "POST", { p_id: t.getAttribute("data-ent") }); aviso("Marcado como entregue."); await iniciarForn(); } catch (er) { aviso(er.message); t.disabled = false; }
    return;
  }
  var id = t.getAttribute("data-pago") || t.getAttribute("data-rej");
  if (id) {
    var pg = t.hasAttribute("data-pago"), tx = prompt(pg ? "Referência da transferência SWIFT (o fornecedor vai ver):" : "Motivo da rejeição (o fornecedor vai ver):");
    if (!tx || !tx.trim()) return;
    t.disabled = true;
    try { await api("rpc/tratar_levantamento", "POST", { p_id: id, p_acao: pg ? "pago" : "rejeitar", p_texto: tx.trim() }); aviso(pg ? "Marcado como pago." : "Rejeitado. O valor voltou ao saldo do fornecedor."); await iniciarAdmin(); }
    catch (er) { aviso(er.message); t.disabled = false; }
  }
});

/* ---------- arranque ---------- */
async function iniciar() {
  mostrar("carregar");
  S = await valida();
  if (!S || !S.user) return mostrar("v-entrar");
  try { if (k(S.user.email) === ADMIN && !/[?&]vendedor/.test(location.search)) await iniciarAdmin(); else await iniciarForn(); }
  catch (er) {
    if (er.status === 401) { localStorage.removeItem(CHAVE); return mostrar("v-entrar"); }
    $("carregar").innerHTML = '<div class="aviso er">' + (falta(er) ? "Falta correr o SQL dos levantamentos no Supabase." : "Erro: " + esc(er.message)) + "</div>"; mostrar("carregar");
  }
}
$("bEntrar").onclick = async function () {
  var m = $("entMsg"); m.textContent = "";
  try { guardar(await auth("token?grant_type=password", { email: $("em").value.trim(), password: $("pw").value })); iniciar(); }
  catch (er) { m.textContent = /invalid/i.test(er.message) ? "Email ou palavra-passe errados." : er.message; }
};
iniciar();
})();
