/* atd-aviso-verif.js — BBabilônia
   (12/11/2026) Aviso aos agentes de atendimento quando há verificações de pedidos
   (fotos e vídeos dos agentes de verificação) à espera de confirmação "iguais ao pedido".
   (13/11/2026) Avisos de tudo o que está pendente em cada equipa (de 30 em 30 s):
   ATENDIMENTO (e dono em service.bbabilonia.com):
   - 💰 cliente carregou as provas do pagamento do transporte → "Resolver ›" abre
     Verificações › 🚚 Acompanhamento com esses pedidos no topo, marcados a amarelo
     (botões "✅ O dinheiro entrou" / "❌ Não entrou"). Qualquer agente pode resolver.
   BUSCA E VERIFICAÇÃO (confirmar-produto.html):
   - 🛡️ pedidos por verificar na loja → abre "Por verificar";
   - 📦 pedidos confirmados pelo atendimento, por recolher → abre "Recolher";
   - 🚚 transporte pago e confirmado, por entregar na transportadora → abre "🚚 Acompanhar"
     com esses pedidos no topo, marcados a amarelo (botão "📦 Enviado").
     O nº de rastreamento é opcional (em Moçambique as transportadoras não usam): só a foto do talão/pacote é obrigatória. */
(function () {
  if (window.__bbAtdVerif) return; window.__bbAtdVerif = 1;
  var SB = "https://dsfoqoeawvjafypycldz.supabase.co", K = "sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0";
  var naVerif = /atd-verificacoes(\.html)?$/.test(location.pathname);
  var naBusca = /confirmar-produto(\.html)?$/.test(location.pathname);
  var EQUIPA = null;

  function token() { try { var s = JSON.parse(sessionStorage.getItem("bb-atd") || "null"); return s && s.access_token; } catch (e) { return null; } }
  function rpc(nome, corpo) {
    var t = token(); if (!t) return Promise.resolve(null);
    return fetch(SB + "/rest/v1/rpc/" + nome, { method: "POST", headers: { apikey: K, Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: JSON.stringify(corpo || {}) })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  var css = document.createElement("style");
  css.textContent = ".bb-av{position:sticky;top:0;z-index:9998;display:flex;gap:10px;align-items:center;padding:11px 14px;color:#fff;font:700 14px/1.35 system-ui,sans-serif;text-decoration:none;cursor:pointer}" +
    ".bb-av span{flex:1}.bb-av b{background:#fff;border-radius:999px;padding:6px 12px;font-size:13px;white-space:nowrap}" +
    ".bb-av.az{background:#1d4ed8}.bb-av.az b{color:#1d4ed8}" +
    ".bb-av.la{background:#d97706;animation:bbPisca 1.6s ease-in-out 3}.bb-av.la b{color:#b45309}" +
    ".bb-av.vd{background:#047857}.bb-av.vd b{color:#047857}" +
    "@keyframes bbPisca{50%{background:#b45309}}" +
    ".bb-pend{outline:4px solid #f59e0b;outline-offset:-2px;background:#fffbeb!important}" +
    ".bb-pend-t{display:block;margin:0 0 8px;padding:8px 10px;border-radius:10px;background:#f59e0b;color:#fff;font:800 14px/1.35 system-ui,sans-serif}";
  document.head.appendChild(css);

  var ORDEM = ["bb-atd-envio", "bb-atd-verif", "bb-bv-env", "bb-bv-ver", "bb-bv-rec"];
  function faixa(id, cor, texto, botao, acao) {
    var a = document.getElementById(id);
    if (!texto) { if (a) a.remove(); return; }
    if (!a) {
      a = document.createElement("a"); a.id = id; a.className = "bb-av " + cor; a.innerHTML = "<span></span><b></b>";
      var antes = null, pos = ORDEM.indexOf(id);
      for (var i = pos + 1; i < ORDEM.length && !antes; i++) antes = document.getElementById(ORDEM[i]);
      if (!antes) { var ult = null; for (var j = pos - 1; j >= 0 && !ult; j--) ult = document.getElementById(ORDEM[j]); antes = ult ? ult.nextSibling : document.body.firstChild; }
      document.body.insertBefore(a, antes);
    }
    if (typeof acao === "string") { a.href = acao; a.onclick = null; }
    else { a.href = "#"; a.onclick = function (e) { e.preventDefault(); acao(); }; }
    a.querySelector("span").textContent = texto;
    a.querySelector("b").textContent = botao;
  }

  /* destacar e pôr no topo os cartões do Acompanhamento que esperam por esta pessoa */
  var ALVO = null, TXT = "";
  function arrumar() {
    var lista = document.getElementById("lista"); if (!lista || !ALVO) return;
    var cs = lista.querySelectorAll(".ac-c[data-ac]");
    Array.prototype.forEach.call(cs, function (c) {
      var pend = !!c.querySelector(ALVO);
      c.classList.toggle("bb-pend", pend);
      var t = c.querySelector(".bb-pend-t");
      if (pend && !t) { t = document.createElement("span"); t.className = "bb-pend-t"; t.textContent = TXT; c.insertBefore(t, c.firstChild); }
      if (!pend && t) t.remove();
    });
    if (naBusca) Array.prototype.forEach.call(lista.querySelectorAll('input[data-env="rastreio"]'), function (x) {
      var t2 = "Nº de rastreamento / guia (opcional)"; if (x.placeholder !== t2) x.placeholder = t2;
    });
    var pends = lista.querySelectorAll(".ac-c.bb-pend"), emOrdem = true, filhos = lista.children;
    for (var j = 0; j < pends.length; j++) if (filhos[j] !== pends[j]) { emOrdem = false; break; }
    if (!emOrdem) for (var i = pends.length - 1; i >= 0; i--) lista.insertBefore(pends[i], lista.firstChild);
    if (pends[0] && !lista.getAttribute("data-bb-rolou")) { lista.setAttribute("data-bb-rolou", "1"); try { pends[0].scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} }
  }
  function noAcomp() {
    if (naVerif) return new URLSearchParams(location.search).get("f") === "acompanhamento" || !!document.querySelector("#tA.on");
    if (naBusca) return !!document.querySelector("#t4.on");
    return false;
  }
  if (naVerif || naBusca) {
    ALVO = naVerif ? '[data-acx="pagok"]' : '[data-acx="enviado"]';
    TXT = naVerif ? "🔔 À espera da sua confirmação: veja as provas e toque em \"✅ O dinheiro entrou\" ou \"❌ Não entrou\"."
      : "🔔 Transporte pago e confirmado: entregue na transportadora, tire a foto do talão ou do pacote e toque em \"📦 Enviado\" (o nº de rastreamento é opcional).";
    var aArrumar = false;
    var obs = new MutationObserver(function () {
      if (aArrumar) return; aArrumar = true;
      setTimeout(function () { aArrumar = false; if (noAcomp()) arrumar(); }, 50);
    });
    var ligarObs = function () { var l = document.getElementById("lista"); if (l) obs.observe(l, { childList: true }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligarObs); else ligarObs();
  }
  function abrirAba(id) {
    var b = document.getElementById(id);
    if (b) { var l = document.getElementById("lista"); if (l) l.removeAttribute("data-bb-rolou"); b.click(); window.scrollTo(0, 0); }
  }

  /* estado do transporte dos pedidos em acompanhamento */
  function envios() {
    return rpc("verificacoes_acompanhamento").then(function (L) {
      if (!Array.isArray(L) || !L.length) return {};
      return rpc("envio_equipa_lista", { p_orders: L.map(function (p) { return p.order_id; }) }).then(function (E) { return E || {}; });
    });
  }
  function conta(E, estado) { var n = 0; for (var k in E) if (E[k] && E[k].estado === estado) n++; return n; }

  /* ATENDIMENTO */
  function verAtendimento() {
    if (!naVerif) rpc("verificacoes_pendentes").then(function (n) {
      n = Number(n) || 0;
      faixa("bb-atd-verif", "az", n ? "🛡️ " + n + (n === 1 ? " verificação de pedido à espera" : " verificações de pedidos à espera") + " da sua confirmação (fotos e vídeos do agente)." : "", "Ver ›", "atd-verificacoes.html");
    });
    envios().then(function (E) {
      var n = conta(E, "pago_cliente");
      if (naVerif && noAcomp()) { faixa("bb-atd-envio"); arrumar(); return; }
      faixa("bb-atd-envio", "la", n ? "💰 " + n + (n === 1 ? " cliente carregou as provas do pagamento do transporte" : " clientes carregaram as provas do pagamento do transporte") + ". Confirme se o dinheiro entrou." : "", "Resolver ›",
        naVerif ? function () { abrirAba("tA"); } : "atd-verificacoes.html?f=acompanhamento");
    });
  }

  /* BUSCA E VERIFICAÇÃO */
  function quantos(aba) { return rpc("verificacao_agente_lista", { p_aba: aba }).then(function (l) { return Array.isArray(l) ? l.length : 0; }); }
  function verBusca() {
    var aba = (document.querySelector(".tabs button.on") || {}).id || "";
    quantos("verificar").then(function (n) {
      faixa("bb-bv-ver", "vd", n && aba !== "t1" ? "🛡️ " + n + (n === 1 ? " pedido por verificar na loja." : " pedidos por verificar nas lojas.") : "", "Abrir ›", function () { abrirAba("t1"); });
    });
    quantos("recolher").then(function (n) {
      faixa("bb-bv-rec", "az", n && aba !== "t3" ? "📦 " + n + (n === 1 ? " pedido confirmado pelo atendimento, pronto para recolher." : " pedidos confirmados pelo atendimento, prontos para recolher.") : "", "Abrir ›", function () { abrirAba("t3"); });
    });
    envios().then(function (E) {
      var n = conta(E, "pago_confirmado");
      if (noAcomp()) { faixa("bb-bv-env"); arrumar(); return; }
      faixa("bb-bv-env", "la", n ? "🚚 " + n + (n === 1 ? " pedido com o transporte pago e confirmado: entregue na transportadora." : " pedidos com o transporte pago e confirmado: entregue na transportadora.") : "", "Resolver ›", function () { abrirAba("t4"); });
    });
  }

  function ver() {
    if (!token()) return;
    if (EQUIPA === null) { rpc("bb_equipa").then(function (e) { EQUIPA = typeof e === "string" ? e : ""; ver(); }); return; }
    if (naBusca) { if (document.getElementById("vApp") && !document.getElementById("vApp").classList.contains("hide")) verBusca(); return; }
    if (EQUIPA === "verificacao") return;
    verAtendimento();
  }
  function arrancar() {
    ver(); setTimeout(ver, 2500); setInterval(ver, 30000);
    /* ao mudar de separador, os avisos atualizam logo */
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".tabs button")) setTimeout(ver, 300); }, true);
  }
  if (document.body) arrancar(); else document.addEventListener("DOMContentLoaded", arrancar);
})();
