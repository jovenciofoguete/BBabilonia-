/* admin-levantamento.js — BBabilônia · painel do dono (administrator.bbabilonia.com)
   (23/11/2026) O cartão "💵 Levantamento Moçambique" saiu: todos os pagamentos da plataforma são automáticos.
   Fica só isto: o cartão 🏦 Levantamentos abre admin-saldos.html (domínio do dono), não fornecedor-saldo.html.
   Carregado pelo painel-admin-rececao.js. */
(function () {
  if (window.__bbAdmLev) return; window.__bbAdmLev = 1;
  function cartaoSaldos() {
    var l = document.querySelectorAll('a[href="fornecedor-saldo.html"],a[href="/fornecedor-saldo.html"]');
    for (var i = 0; i < l.length; i++) l[i].setAttribute("href", "admin-saldos.html");
  }
  cartaoSaldos(); new MutationObserver(cartaoSaldos).observe(document.documentElement, { childList: true, subtree: true });
})();
