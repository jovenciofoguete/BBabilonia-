/* painel-vendedor-v2.js — B-Babilônia: painel do vendedor (parte 1 de 2; a parte 2 é painel-vendedor-v2-partes.js) */
(function () {
var SUPA = "https://dsfoqoeawvjafypycldz.supabase.co", KEY = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
var CHAVE = "sb-dsfoqoeawvjafypycldz-auth-token", ADMIN = "jovenciofoguete1904@gmail.com";
var $ = function (i) { return document.getElementById(i); };
var S = null, loja = null, docs = 0, aprovada = false, D = { prods: [], peds: [], convs: [], msgs: [], vis: [] }, vista = "inicio", filtro = {};
var DIA = 864e5, BLOQ = { produtos: 1, encomendas: 1, marketing: 1, estatisticas: 1 };
function aviso(t) { var e = $("toast"); e.textContent = t; e.style.display = "block"; clearTimeout(e._t); e._t = setTimeout(function () { e.style.display = "none"; }, 3500); }
function k(x) { return String(x || "").toLowerCase(); }
function desde(dias) { return Date.now() - dias * DIA; }

/* ---------- sessão (a mesma das outras páginas) ---------- */
function ler() { try { var s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s && s.access_token) return s; } catch (e) {} return null; }
function guardar(s) { if (s && !s.expires_at && s.expires_in) s.expires_at = Math.floor(Date.now() / 1000) + s.expires_in; localStorage.setItem(CHAVE, JSON.stringify(s)); return s; }
async function auth(c, corpo, metodo) {
  var h = { apikey: KEY, "Content-Type": "application/json" }; if (metodo) h.Authorization = "Bearer " + S.access_token;
  var r = await fetch(SUPA + "/auth/v1/" + c, { method: metodo || "POST", headers: h, body: JSON.stringify(corpo) });
  var j = await r.json().catch(function () { return {}; });
  if (!r.ok) throw new Error(j.msg || j.error_description || j.message || ("Erro " + r.status));
  return j;
}
async function valida() {
  var s = ler(); if (!s) return null;
  if (s.expires_at && s.expires_at - 60 < Date.now() / 1000 && s.refresh_token) {
    try { s = guardar(await auth("token?grant_type=refresh_token", { refresh_token: s.refresh_token })); } catch (e) { return null; }
  }
  return s;
}
async function api(c, metodo, corpo) {
  var r = await fetch(SUPA + "/rest/v1/" + c, { method: metodo || "GET", headers: { apikey: KEY, Authorization: "Bearer " + S.access_token, "Content-Type": "application/json", Prefer: "return=representation" }, body: corpo ? JSON.stringify(corpo) : undefined });
  var t = await r.text(), j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
  if (!r.ok) { var er = new Error((j && j.message) || ("Erro " + r.status)); er.status = r.status; throw er; }
  return j;
}
function traduzir(m) {
  m = String(m || "");
  if (/invalid login|invalid_credentials/i.test(m)) return "Email ou palavra-passe errados.";
  if (/valid password|password should|at least 6/i.test(m)) return "Escreva uma palavra-passe com pelo menos 6 letras ou números.";
  if (/already registered|already exists/i.test(m)) return "Este email já tem conta. Toque em Entrar.";
  if (/not confirmed/i.test(m)) return "Confirme primeiro o seu email: abra o email que recebeu e toque no link.";
  if (/same.*password|different from the old/i.test(m)) return "A palavra-passe nova tem de ser diferente da antiga.";
  return m;
}

/* ---------- entrar ---------- */
async function entrar(criar) {
  var em = $("em").value.trim(), pw = $("pw").value, m = $("entMsg"); m.className = "msg"; m.textContent = "";
  if (!/^\S+@\S+\.\S+$/.test(em)) { m.textContent = "Escreva um email válido."; return; }
  if (pw.length < 6) { m.textContent = "Escreva uma palavra-passe com pelo menos 6 letras ou números."; return; }
  $("bEntrar").disabled = $("bCriar").disabled = true;
  try {
    if (criar) {
      var j = await auth("signup", { email: em, password: pw });
      if (!j.access_token) { m.className = "msg ok"; m.textContent = "Conta criada. Abra o email " + em + ", toque no link de confirmação e depois volte aqui e toque em Entrar."; return; }
      guardar(j);
    } else guardar(await auth("token?grant_type=password", { email: em, password: pw }));
    await iniciar();
  } catch (e) { m.textContent = traduzir(e.message); } finally { $("bEntrar").disabled = $("bCriar").disabled = false; }
}
function sair() { for (var i = localStorage.length - 1; i >= 0; i--) { var c = localStorage.key(i); if (/^sb-.*-auth-token$/.test(c)) localStorage.removeItem(c); } S = null; try { history.replaceState(null, "", location.pathname); } catch (e) {} mostrar("entrar"); }

function estadoLoja() { return loja ? k(loja.estado) : ""; }
async function carregar() {
  var uid = S.user.id, ps = [
    api("products?select=*&supplier_id=eq." + uid + "&order=created_at.desc&limit=1000").then(function (r) { D.prods = r || []; }).catch(function () { D.prods = []; }),
    api("rpc/pedidos_do_fornecedor", "POST", {}).then(function (r) { D.peds = (r || []).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }); }).catch(function () { D.peds = []; }),
    api("conversas?select=*&vendedor_id=eq." + uid + "&order=created_at.desc&limit=100").then(function (r) { D.convs = r || []; }).catch(function () { D.convs = []; }),
    api("visitas?select=created_at,produto_id&dono_id=eq." + uid + "&created_at=gte." + new Date(desde(60)).toISOString() + "&limit=20000").then(function (r) { D.vis = r || []; }).catch(function () { D.vis = []; })
  ];
  await Promise.all(ps);
  D.msgs = [];
  if (D.convs.length) {
    try { D.msgs = await api("mensagens?select=*&conversa_id=in.(" + D.convs.map(function (c) { return c.id; }).join(",") + ")&order=created_at.desc&limit=300"); } catch (e) { D.msgs = []; }
  }
}

/* ---------- navegação ---------- */
function mostrar(v) {
  document.querySelectorAll("main > section").forEach(function (s) { s.classList.add("hide"); });
  if (v === "entrar") { $("v-entrar").classList.remove("hide"); $("bSairTopo").classList.add("hide"); $("ola").textContent = "Gira a sua loja, produtos, pedidos e mensagens num só lugar."; return; }
  vista = PVsec.V[v] ? v : "inicio"; desenhar();
}
function liga() { PVsec.sync({ S: S, loja: loja, docs: docs, aprovada: aprovada, D: D, filtro: filtro, api: api, aviso: aviso, desenhar: desenhar }); }
function desenhar() {
  liga(); var V = PVsec.V;
  var el = $("v-" + vista); el.innerHTML = (vista === "inicio" ? "" : '<a class="voltar" href="#inicio">← Voltar ao painel</a>') + V[vista](); el.classList.remove("hide");
  window.scrollTo(0, 0);
}
document.addEventListener("click", function (e) {
  var t = e.target.closest ? e.target : null; if (!t) return;
  var bl = t.closest("[data-bloq]"); if (bl) { e.preventDefault(); aviso(loja ? "Disponível depois de a loja ser aprovada." : "Primeiro crie a sua loja."); return; }
  var ab = t.closest(".abas button"); if (ab) { filtro[ab.parentNode.getAttribute("data-f")] = ab.getAttribute("data-a"); desenhar(); return; }
  var ed = t.closest("[data-ed]"); if (ed) { liga(); PVsec.editar(ed.getAttribute("data-ed")); return; }
  var cp = t.closest("[data-copiar]"); if (cp) { var u = cp.getAttribute("data-copiar"); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { aviso("Link copiado."); }, function () { prompt("Copie o link:", u); }); return; }
  var pa = t.closest("[data-partilhar]"); if (pa) { var l = pa.getAttribute("data-partilhar"); if (navigator.share) navigator.share({ title: "B-Babilônia", url: l }).catch(function () {}); else (navigator.clipboard ? navigator.clipboard.writeText(l) : Promise.reject()).then(function () { aviso("Link copiado para partilhar."); }, function () { prompt("Copie o link:", l); }); return; }
  if (t.closest("#bSair")) { sair(); return; }
  if (t.closest("#bPw")) {
    var np = $("np").value, m = $("pwMsg"); m.className = "msg";
    if (np.length < 6) { m.textContent = "Escreva uma palavra-passe com pelo menos 6 letras ou números."; return; }
    auth("user", { password: np }, "PUT").then(function () { m.className = "msg ok"; m.textContent = "Palavra-passe mudada."; $("np").value = ""; }, function (er) { m.textContent = traduzir(er.message); });
  }
});
document.addEventListener("input", function (e) { if (e.target.id === "pq") { filtro.pt = e.target.value; var p = e.target.selectionStart; desenhar(); var q = $("pq"); q.focus(); try { q.setSelectionRange(p, p); } catch (x) {} } });
window.addEventListener("hashchange", function () { if (S) mostrar(location.hash.slice(1)); });
$("bSairTopo").onclick = function () { sair(); };
$("bEntrar").onclick = function () { entrar(false); };
$("bCriar").onclick = function () { entrar(true); };
$("pw").addEventListener("keydown", function (e) { if (e.key === "Enter") entrar(false); });

async function iniciar() {
  S = await valida();
  if (!S || !S.user) return mostrar("entrar");
  $("bSairTopo").classList.remove("hide"); $("ola").textContent = "Olá, " + S.user.email;
  loja = null; docs = 0;
  try { var r = await api("lojas?select=*&dono_id=eq." + S.user.id + "&limit=1"); loja = (r && r[0]) || null; }
  catch (e) { if (e.status === 401) { localStorage.removeItem(CHAVE); S = null; return mostrar("entrar"); } }
  if (loja) { try { docs = (await api("loja_documentos?select=id&loja_id=eq." + loja.id)).length; } catch (e) { docs = 0; } }
  aprovada = k(S.user.email) === ADMIN || (!!loja && estadoLoja().indexOf("aprov") === 0);
  await carregar();
  mostrar(location.hash.slice(1) || "inicio");
}
window.__painel = { recarregar: iniciar };
iniciar();
})();
  
