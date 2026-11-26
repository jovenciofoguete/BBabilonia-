/* voltar-equipa.js — BBabilônia (26/11/2026) · agentes (service.bbabilonia.com)
   Seta e botão voltar do telemóvel um passo de cada vez dentro das páginas dos agentes:
   cada separador aberto é um passo. Voltar regressa ao separador anterior (e não sai logo de tudo).
   Só no primeiro ecrã da página o voltar faz o que fazia antes (volta à página anterior / ao início).
   Páginas: atendimento.html (Os meus casos, Fila, …), atd-verificacoes.html e confirmar-produto.html.
   A vista 👥 Clientes e lojas tem os seus passos (atd-contas.js). Carregado pelo atd-sessao.js. */
(function () {
  if (window.__bbVoltarEq) return; window.__bbVoltarEq = 1;
  if (!/^(service|atendimento)\./i.test(location.hostname)) return;
  var d = document;
  /* página de UMA encomenda (?pedido=): o sino-equipa.js já trata do voltar */
  if (/[?&]pedido=/.test(location.search)) return;
  var SEL = "#tabs button[data-t], main .tabs button, #vApp .tabs button";
  function chave(b) { return b.getAttribute("data-t") || b.getAttribute("data-aba") || b.id || ""; }
  function ativo() {
    var l = d.querySelectorAll(SEL);
    for (var i = 0; i < l.length; i++) if (l[i].classList.contains("on") && l[i].offsetParent !== null) return chave(l[i]);
    return "";
  }
  function botaoDe(k) {
    var l = d.querySelectorAll(SEL);
    for (var i = 0; i < l.length; i++) if (chave(l[i]) === k) return l[i];
    return null;
  }
  var pilha = [], aRepor = false;
  d.addEventListener("click", function (e) {
    if (aRepor) return;
    var b = e.target.closest && e.target.closest(SEL); if (!b) return;
    var antes = ativo(), k = chave(b);
    if (!antes || !k || antes === k) return;
    setTimeout(function () {
      if (ativo() !== k) return;
      pilha.push(antes);
      try { history.pushState({ bbTab: pilha.length }, "", location.href); } catch (x) { pilha.pop(); }
    }, 0);
  }, true);
  /* o atd-sessao.js (voltar ao início) pergunta primeiro se há um separador para desfazer */
  window.addEventListener("popstate", function (e) {
    if (e.__bbTab || window.__bbVistaAberta || !pilha.length) return;
    e.__bbTab = true;
    var k = pilha.pop(), b = botaoDe(k);
    if (!b) return;
    aRepor = true;
    try { b.click(); } finally { aRepor = false; }
    window.scrollTo(0, 0);
  });
  window.BBVoltarEq = { tem: function () { return pilha.length > 0; } };
})();
