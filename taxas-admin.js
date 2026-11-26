/* taxas-admin.js — BBabilônia (23/11/2026) · painel do dono (administrator.bbabilonia.com)
   Só acrescenta ao Início os cartões "💲 Taxas e planos" → admin-taxas.html, "🔢 Repor PIN" → admin-pins.html
   e (26/11/2026) "🏪 Verificar lojas" → atd-lojas.html
   (taxa no preço para Moçambique e internacional, mensalidade/anuidade das lojas e anuidade Pro).
   Carregado pelo painel-admin-rececao.js. Não muda os outros cartões. */
(function () {
  if (window.__bbTaxasAdmin) return; window.__bbTaxasAdmin = 1;
  if (!/^(admin|administrator)\./i.test(location.hostname)) return;
  var n = 0;
  (function pôr() {
    var ini = document.getElementById("t-inicio"), g = ini && ini.querySelector(".grid");
    if (!g) { if (++n < 400) setTimeout(pôr, 150); return; }
    if (document.getElementById("bb-c-taxas")) return;
    g.insertAdjacentHTML("afterbegin", '<a id="bb-c-taxas" class="c k2" href="admin-taxas.html"><span class="i">💲</span><b>Taxas e planos</b><span>Taxa no preço, mensalidade das lojas e anuidade Pro</span></a>' +
      '<a id="bb-c-pins" class="c k5" href="admin-pins.html"><span class="i">🔢</span><b>Repor PIN</b><span>Fornecedor ou agente que esqueceu o PIN pessoal</span></a>' +
      '<a id="bb-c-vlojas" class="c k1" href="atd-lojas.html"><span class="i">🏪</span><b>Verificar lojas</b><span>Conferir os documentos das lojas novas e recusar se houver algo errado</span></a>');
  })();
})();
