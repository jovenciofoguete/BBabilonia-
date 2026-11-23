/* painel-voltar.js — BBabilônia (23/11/2026) · painel do dono (administrator.bbabilonia.com)
   Seta e botão voltar do telemóvel, um passo de cada vez, sem sair do painel:
     Início → 📦 Produtos / 🧾 Pedidos / cartão (vista "← Voltar ao início") → 🚚 Tratar pedidos
   Voltar desfaz só o último passo. No Início, voltar sai do painel (como antes).
   A vista 🏬 Lojas já tem os seus passos (painel-equipa.js). Carregado pelo painel-admin-rececao.js. */
(function () {
  if (window.__bbPainelVoltar) return; window.__bbPainelVoltar = 1;
  if (!/^(admin|administrator)\./i.test(location.hostname)) return;
  var d = document;
  function $(i) { return d.getElementById(i); }
  function vis(id) { var e = $(id); return !!e && !e.classList.contains("hide") && e.style.display !== "none"; }
  /* em que ecrã está o painel */
  function ecra() {
    if (!vis("app")) return "";
    if (vis("pe-v")) return "pe";
    if (vis("t-extra")) return "extra";
    if (vis("t-produtos")) return "produtos";
    if (vis("t-pedidos")) return vis("bb-trat-l") ? "tratar" : "pedidos";
    return "inicio";
  }
  var cur = "", pilha = [], ignorar = 0, aRepor = false;
  /* repor um ecrã anterior */
  function repor(s) {
    aRepor = true;
    var agora = ecra();
    if (agora === "tratar" && s === "pedidos") { var bt = $("bb-trat-bt"); if (bt) bt.click(); }
    else if (typeof window.aba === "function") window.aba(s === "produtos" || s === "pedidos" || s === "tratar" ? (s === "tratar" ? "pedidos" : s) : "inicio");
    if (s === "tratar") { var b2 = $("bb-trat-bt"); if (b2 && !vis("bb-trat-l")) b2.click(); }
    setTimeout(function () { cur = ecra(); aRepor = false; }, 0);
  }
  function mudou() {
    var s = ecra(); if (!s || s === cur) return;
    var antes = cur; cur = s;
    if (aRepor || !antes || s === "pe" || antes === "pe") return;      /* a vista Lojas trata dos seus passos */
    if (s === "inicio") {                                               /* voltou ao Início pelo botão da página */
      if (pilha.length) { ignorar++; var n = pilha.length; pilha = []; try { history.go(-n); } catch (e) { ignorar--; } }
      return;
    }
    var i = pilha.lastIndexOf(s);
    if (i > -1 && pilha.length) {                                         /* voltou a um ecrã que já estava atrás (ex.: "← Voltar à lista de pedidos") */
      var k = pilha.length - i; pilha = pilha.slice(0, i); ignorar++; try { history.go(-k); } catch (e) { ignorar--; } return;
    }
    var nivel = { produtos: 1, pedidos: 1, extra: 1 };
    if (nivel[s] && (nivel[antes] || antes === "tratar") && pilha.length) {
      /* trocou de separador/vista ao mesmo nível: não acrescenta passo (voltar leva ao Início) */
      if (antes === "tratar") { pilha.pop(); ignorar++; try { history.go(-1); } catch (e) { ignorar--; } }
      return;
    }
    pilha.push(antes);
    try { history.pushState({ pv: pilha.length, s: s }, "", location.href); } catch (e) { pilha.pop(); }
  }
  window.addEventListener("popstate", function (e) {
    if (ignorar) { ignorar--; return; }
    if (cur === "pe" || (e.state && e.state.pe)) return;                 /* passos da vista Lojas */
    var alvo = pilha.length ? pilha.pop() : "inicio";
    if (cur === "inicio" && !pilha.length && !(e.state && e.state.pv)) return;
    repor(alvo);
  });
  var t = null;
  (function arrancar(n) {
    if (!$("app") || !$("t-inicio")) { if (n < 400) setTimeout(function () { arrancar(n + 1); }, 150); return; }
    cur = ecra();
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(mudou, 30); })
      .observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
  })(0);
})();
