/* painel-vendedor-v2-chat2.js — B-Babilônia: na sub-conta, "Mensagens" abre a mesma página de chat
   que o patrão usa (chat-novo2.html), em nome da loja. Ficheiro novo, não muda mais nada. */
(function () {
  function dono() { var F = window.PVF; return F && F.EQ && F.EQ.length && F.CH ? F.CH : null; }
  function abrir() { var d = dono(); if (!d) return false; location.href = "chat-novo2.html?dono=" + encodeURIComponent(d); return true; }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href="#fmsg"]') : null;
    if (a && dono()) { e.preventDefault(); e.stopPropagation(); abrir(); }
  }, true);
  function porHash() { if (location.hash !== "#fmsg") return; var n = 0; (function t() { if (abrir()) { try { history.replaceState(null, "", location.pathname + "#inicio"); } catch (x) {} return; } if (++n < 60) setTimeout(t, 200); })(); }
  window.addEventListener("hashchange", porHash); porHash();
})();
