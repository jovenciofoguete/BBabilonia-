/* admin-so-dominio.js — BBabilônia (21/11/2026): o painel do DONO nunca abre páginas de outro domínio.
   Pedido do dono: ninguém pode ter acesso ao domínio do outro (cliente, fornecedor, dono).
   - Tira do painel os cartões/links que levam ao lado do fornecedor ou do cliente (ex.: "Painel do vendedor", "Ver a loja", "ver loja", "Ver" produto).
   - Trava qualquer clique que tente sair para outro domínio da BBabilônia ou para uma página do cliente/fornecedor.
   Só atua no domínio do dono. Carregado pelo painel-admin-rececao.js. Não altera painel-admin.html. */
(function () {
  if (window.__bbSoDom) return; window.__bbSoDom = 1;
  if (!/^(admin|administrator)\./i.test(location.hostname)) return;
  var VENDEDOR = ['painel-vendedor', 'painel-vendedor-v2', 'fornecedor', 'fornecedor-novo', 'fornecedor-v3', 'fornecedor-envios', 'fornecedor-saldo', 'fornecedor-disputas', 'fornecedor-pedidos-clientes', 'registar-produto', 'detalhes-fornecedor', 'loja-criar', 'loja-editar', 'conta-bancaria', 'avisos-vendedor', 'produto-vendedor', 'importar-loja-v7', 'gongyingshang', 'fabrica', 'destaque-comprar'];
  var CLIENTE = ['index', 'carrinho', 'checkout', 'finalizar', 'conta', 'moradas', 'moradas-v2', 'moradas-v3', 'minhas-moradas', 'enderecos-entrega', 'pedidos', 'avisos', 'avaliar', 'minhas-disputas', 'pagamento-ok', 'pagar-link', 'pagar-link-v2', 'pagar-link-seguro', 'produto-bbabilonia', 'produto-loja', 'produto2', 'produto-quadro', 'busca-imagem-v2', 'busca-imagem-v3', 'pesquisa-imagem', 'pesquisa-imagem-v2', 'pesquisa-rapida', 'levantamento', 'pais', 'servicos', 'servicos-registar', 'loja', 'chat', 'chat-novo', 'chat-novo2', 'live'];
  function pag(p) { return String(p || '').split(/[?#]/)[0].split('/').pop().replace(/\.html$/i, '').toLowerCase() || 'index'; }
  function fora(a) {
    var h = a.getAttribute && a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return false;
    var u; try { u = new URL(h, location.href); } catch (e) { return false; }
    if (u.host !== location.host) return /(^|\.)bbabilonia\.com$/i.test(u.hostname) || /vercel\.app$/i.test(u.hostname);
    var p = pag(u.pathname);
    return VENDEDOR.indexOf(p) > -1 || CLIENTE.indexOf(p) > -1;
  }
  function limpar(raiz) {
    var l = (raiz || document).querySelectorAll ? (raiz || document).querySelectorAll('a[href]') : [];
    for (var i = 0; i < l.length; i++) {
      var a = l[i];
      if (/(^|\/)fornecedor-saldo\.html/i.test(a.getAttribute('href'))) { a.setAttribute('href', 'admin-saldos.html'); continue; }
      if (!fora(a)) continue;
      if (a.classList && a.classList.contains('c')) a.remove();
      else if (a.parentNode) { var s = document.createElement('span'); s.textContent = ''; a.parentNode.replaceChild(s, a); }
    }
  }
  /* trava de segurança: nenhum clique sai deste domínio */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (a && fora(a)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  limpar();
  new MutationObserver(function () { limpar(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
