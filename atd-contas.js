/* atd-contas.js — BBabilônia (23/11/2026) · atendimento (service.bbabilonia.com)
   Só para agentes SUPERIORES: botão "👥 Clientes e lojas" no painel do atendimento.
   Lá: 🔍 procurar pelo nome, email ou código; Bloquear, ⛔ Bloquear para sempre e 🗑️ Remover (depois do bloqueio para sempre).
   Seta ← e botão voltar do telemóvel: fecham a vista e voltam ao painel (um passo).
   O servidor confirma que é superior (contas_equipa_pode). Carregado pelo atd-sessao.js. */
(function () {
  if (window.__bbAtdContas) return; window.__bbAtdContas = 1;
  if (!/^(service|atendimento)\./i.test(location.hostname)) return;
  if (!/^\/(atendimento(\.html)?)?$/.test(location.pathname)) return;
  var d = document, PODE = null, ABERTA = false;
  function $(i) { return d.getElementById(i); }
  function painelVisivel() { var p = $("painel"); return !!p && !p.classList.contains("hide") && !d.body.classList.contains("bb-inicio"); }
  function botao() {
    var p = $("painel"), t = $("topo");
    if (!PODE || !painelVisivel() || !t || $("bb-ctb")) return;
    var a = d.createElement("a"); a.id = "bb-ctb"; a.className = "pedbt"; a.href = "#";
    a.style.background = "linear-gradient(90deg,#1e3a8a,#7c3aed)";
    a.innerHTML = "<span>👥 Clientes e lojas<small>Procurar pelo nome ou código · bloquear, bloquear para sempre e remover</small></span>";
    p.insertBefore(a, t);
  }
  function mostrarPainel(sim) {
    ["bb-ctb", "topo", "lista"].forEach(function (i) { var e = $(i); if (e) e.style.display = sim ? "" : "none"; });
    var tb = $("tabs"); if (tb) tb.style.display = sim ? "" : "none";
  }
  function abrir() {
    if (ABERTA) return; ABERTA = true; window.__bbVistaAberta = true;
    try { history.pushState({ bbContas: 1 }, "", location.href); } catch (e) {}
    mostrarPainel(false);
    var v = d.createElement("div"); v.id = "bb-ctv";
    v.innerHTML = '<button type="button" id="bb-ctv-v" style="border:0;background:#fff;border-radius:20px;padding:9px 14px;font:700 14px system-ui,sans-serif;margin:0 0 10px;box-shadow:0 2px 8px #0f172a14;color:#0f172a">← Voltar ao painel</button><div id="bb-ctv-c"></div>';
    $("painel").insertBefore(v, $("topo"));
    window.scrollTo(0, 0);
    var ir = function () { window.BBContas.montar($("bb-ctv-c"), window.sb); };
    if (window.BBContas) ir();
    else { var s = d.createElement("script"); s.src = "contas-equipa.js?v=1"; s.onload = ir; d.head.appendChild(s); }
  }
  function fechar() {
    if (!ABERTA) return; ABERTA = false; window.__bbVistaAberta = false;
    var v = $("bb-ctv"); if (v) v.remove();
    mostrarPainel(true); window.scrollTo(0, 0);
  }
  d.addEventListener("click", function (e) {
    var x = e.target.closest && e.target.closest("#bb-ctb,#bb-ctv-v"); if (!x) return;
    e.preventDefault();
    if (x.id === "bb-ctb") abrir(); else if (history.state && history.state.bbContas) history.back(); else fechar();
  });
  /* voltar do telemóvel: fecha a vista (o atd-sessao.js não salta para o início enquanto a vista está aberta) */
  window.addEventListener("popstate", function () { if (ABERTA) fechar(); });
  var n = 0;
  (function arrancar() {
    if (!window.sb || !window.sb.rpc || !$("painel")) { if (++n < 200) setTimeout(arrancar, 150); return; }
    var verificar = async function () {
      if (PODE !== null || !painelVisivel()) return;
      try { var r = await window.sb.rpc("contas_equipa_pode"); PODE = !r.error && r.data === true; } catch (e) { PODE = false; }
      botao();
    };
    new MutationObserver(function () { verificar(); botao(); }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    verificar();
  })();
})();
