/* painel-vendedor-v2-lado.js — B-Babilônia: o painel do vendedor só leva a páginas do vendedor.
   - "Avisos" → avisos-vendedor.html (não a página de avisos do cliente)
   - "Ver" produto → produto-vendedor.html (só ver, sem comprar/carrinho/chat)
   - links para partilhar/copiar (loja e produtos) → sempre https://bbabilonia.com (o lado do cliente)
   Ficheiro novo: não muda os outros ficheiros do painel. */
(function () {
  var LOJA = "https://bbabilonia.com/";
  function paraCliente(u) {
    var m = /([^\/?#]+\.html.*)$/i.exec(String(u || ""));
    return m ? LOJA + m[1] : u;
  }
  function corrigir() {
    document.querySelectorAll('a[href="avisos.html"]').forEach(function (a) { a.setAttribute("href", "avisos-vendedor.html"); });
    document.querySelectorAll('a[href^="produto-bbabilonia.html?id="]').forEach(function (a) {
      a.setAttribute("href", a.getAttribute("href").replace("produto-bbabilonia.html", "produto-vendedor.html"));
    });
    document.querySelectorAll("[data-copiar],[data-partilhar]").forEach(function (b) {
      ["data-copiar", "data-partilhar"].forEach(function (at) {
        var v = b.getAttribute(at);
        if (v && v.indexOf(LOJA) !== 0) b.setAttribute(at, paraCliente(v));
      });
    });
  }
  var t = null;
  function agendar() { clearTimeout(t); t = setTimeout(corrigir, 20); }
  function iniciar() { corrigir(); new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) iniciar(); else document.addEventListener("DOMContentLoaded", iniciar);
})();
