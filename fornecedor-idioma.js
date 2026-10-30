/* fornecedor-idioma.js — B-Babilônia: liga a tradução às páginas do fornecedor (publicar produto, envios, disputas,
   saldo, detalhes do produto, criar/editar loja, conta bancária). Usa o idioma escolhido no painel (bb_prefs).
   - qualquer idioma: tradução pelo servidor da BBabilônia (painel-vendedor-v2-idioma.js);
   - chinês: também chinês simplificado (painel-vendedor-v2-zh.js) e as traduções certas escritas à mão (fornecedor-termos.js).
   Basta 1 linha no fim de cada página. Não altera mais nada. */
(function () {
  if (window.__bbFornIdioma) return; window.__bbFornIdioma = 1;
  var l = "pt";
  try { l = String((JSON.parse(localStorage.getItem("bb_prefs") || "{}") || {}).idioma || navigator.language || "pt").split("-")[0].toLowerCase(); } catch (e) {}
  if (l === "pt") return;
  var L = ["painel-vendedor-v2-idioma.js?v=1"];
  if (l === "zh") L.push("painel-vendedor-v2-zh.js?v=1", "fornecedor-termos.js?v=1");
  L.forEach(function (src) { var s = document.createElement("script"); s.src = src; s.async = false; document.head.appendChild(s); });
})();
