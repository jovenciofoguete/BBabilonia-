/* servicos-faixa.js — BBabilônia (14/11/2026)
   Na página inicial, na faixa onde está "Pague por cripto…", aparece primeiro o separador
   "🛠️ Aluguer, serviços e diversos", que abre servicos.html. Não altera o resto da página. */
(function () {
  if (window.__bbServFaixa) return; window.__bbServFaixa = 1;
  var css = document.createElement("style");
  css.textContent = ".faixa a.bb-serv{flex:1 0 auto;display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#ff6a00,#ff8c1a);color:#fff;border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:800;white-space:nowrap;text-decoration:none;box-shadow:0 2px 8px #ff6a0055}";
  document.head.appendChild(css);
  function porFaixa() {
    var f = document.querySelector(".faixa");
    if (!f) return false;
    if (!f.querySelector("a.bb-serv")) {
      var a = document.createElement("a");
      a.className = "bb-serv"; a.href = "servicos.html";
      a.innerHTML = "🛠️ Aluguer, serviços e diversos ›";
      f.insertBefore(a, f.firstChild);
    }
    return true;
  }
  if (!porFaixa()) document.addEventListener("DOMContentLoaded", porFaixa);
})();
