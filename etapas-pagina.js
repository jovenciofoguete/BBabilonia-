/* etapas-pagina.js — BBabilônia (21/11/2026)
   Na página "Os meus pedidos" (pedidos.html), ao abrir uma encomenda mostra no topo as ETAPAS, uma a uma, com a
   etapa atual a laranja ("Em curso"). Em Moçambique incluem a cotação e o pagamento do transporte (o chat e os
   dados de pagamento continuam logo por baixo, no próprio pedido). Estrangeiros veem: pago, enviado, a caminho,
   chegou. Usa a função pedido_etapas_pref do Supabase e o avisos-pastas.js. */
(function () {
  if (window.__bbEtapasPag) return; window.__bbEtapasPag = 1;
  var d = document;
  function ligar() { try { if (window.sb && window.BBPastas) window.BBPastas.usar(window.sb); } catch (e) {} }
  function carregarModulo(ok) {
    if (window.BBPastas) { ligar(); return ok(); }
    var x = d.createElement("script"); x.src = "avisos-pastas.js?v=5"; x.onload = function () { ligar(); ok(); };
    (d.head || d.documentElement).appendChild(x);
  }
  var feito = "";
  function pintar() {
    var det = d.getElementById("det"); if (!det || det.classList.contains("hide")) { feito = ""; return; }
    var id = String(window.aberto || ""); if (!id) return;
    var cx = d.getElementById("bb-etapas");
    if (cx && cx.getAttribute("data-id") === id && det.contains(cx)) {
      if (feito === id + "|" + (cx.getAttribute("data-ok") || "")) return;
    }
    var b1 = det.querySelector(".box"); if (!b1) return;
    if (!cx || !det.contains(cx) || cx.getAttribute("data-id") !== id) {
      if (cx) cx.remove();
      cx = d.createElement("div"); cx.id = "bb-etapas"; cx.setAttribute("data-id", id);
      b1.insertAdjacentElement("afterend", cx);
      var barra = b1.querySelector(".linha"); if (barra) barra.style.display = "none"; /* as 4 bolinhas simples dão lugar às etapas completas */
    }
    var k = id.replace(/-/g, "").slice(0, 8).toUpperCase();
    carregarModulo(function () {
      var h = window.BBPastas.cartao(k, function () { feito = ""; pintar(); }, true);
      cx.innerHTML = h; cx.setAttribute("data-ok", /bbp-et/.test(h) ? "1" : "0");
      feito = id + "|" + cx.getAttribute("data-ok");
    });
  }
  new MutationObserver(function () { setTimeout(pintar, 50); }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  pintar();
})();
