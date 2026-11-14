/* lados.js — B-Babilônia: cada domínio só mostra o seu lado (07/11/2026).
   bbabilonia.com                → só o lado do CLIENTE (qualquer email é cliente comum)
   suppliers.bbabilonia.com      → só o lado do FORNECEDOR e dos funcionários dele
   administrator.bbabilonia.com  → só o lado do DONO
   service.bbabilonia.com        → só o lado dos AGENTES de atendimento
   13/11/2026: admin-agentes e admin-pins só no dono; meus-dados, confirmar-produto e atd-verificacoes nunca no cliente nem no fornecedor.
   14/11/2026: levantamento e pais só no cliente; admin-saldos (levantamentos dos fornecedores) só no dono;
               atd-levantamento (pagamentos por levantamento) nos agentes e no dono, nunca no cliente nem no fornecedor.
   Usado pelo ir-lado.html (páginas abertas no domínio errado) e pelos avisos (sino e páginas de avisos). */
(function () {
  if (window.BBLado) return;
  var VENDEDOR = ['painel-vendedor', 'painel-vendedor-v2', 'fornecedor', 'fornecedor-novo', 'fornecedor-v3', 'fornecedor-envios',
    'fornecedor-saldo', 'fornecedor-disputas', 'fornecedor-pedidos-clientes', 'registar-produto', 'detalhes-fornecedor', 'loja-criar',
    'loja-editar', 'conta-bancaria', 'avisos-vendedor', 'produto-vendedor', 'importar-loja-v7', 'gongyingshang', 'fabrica'];
  var DONO = ['painel-admin', 'admin-bbabilonia', 'admin-lojas', 'admin-disputas', 'admin-fotos', 'admin-pedidos', 'admin', 'gerar-formas', 'admin-agentes', 'admin-pins', 'admin-saldos'];
  var AGENTE = ['atendimento', 'agentes', 'respostas', 'conversas', 'meus-dados'];
  /* páginas das equipas de agentes que o dono também usa no seu domínio (13/11/2026) */
  var SERVICO = ['confirmar-produto', 'atd-verificacoes', 'atd-levantamento'];
  var CLIENTE = ['index', 'carrinho', 'checkout', 'finalizar', 'conta', 'moradas', 'moradas-v2', 'moradas-v3', 'minhas-moradas',
    'enderecos-entrega', 'pedidos', 'avisos', 'avaliar', 'minhas-disputas', 'pagamento-ok', 'pagar-link', 'pagar-link-v2',
    'pagar-link-seguro', 'produto-bbabilonia', 'produto-loja', 'produto2', 'produto-quadro', 'busca-imagem-v2', 'busca-imagem-v3',
    'pesquisa-imagem', 'pesquisa-imagem-v2', 'pesquisa-rapida', 'levantamento', 'pais'];
  /* páginas da loja que o fornecedor também usa no seu domínio (com regras próprias) */
  var LOJA_CLIENTE = ['loja', 'chat', 'chat-novo', 'chat-novo2', 'live', 'pedidos-publicos', 'publicacoes'];

  var DOM = { cliente: 'bbabilonia.com', vendedor: 'suppliers.bbabilonia.com', dono: 'administrator.bbabilonia.com', agente: 'service.bbabilonia.com' };

  function ladoDoHost(h) {
    h = String(h || location.hostname).toLowerCase();
    if (/^(suppliers|fornecedor|supplies)\./.test(h)) return 'vendedor';
    if (/^(administrator|admin)\./.test(h)) return 'dono';
    if (/^(service|atendimento)\./.test(h)) return 'agente';
    return 'cliente';
  }
  function tem(l, p) { return l.indexOf(p) > -1; }
  /* nome da página sem ".html" */
  function pagina(caminho) {
    var p = String(caminho || '').replace(/^https?:\/\/[^\/]+/i, '').split(/[?#]/)[0].split('/').pop() || 'index.html';
    return p.replace(/\.html$/i, '').toLowerCase();
  }
  /* páginas proibidas em cada domínio */
  function proibidas(lado) {
    if (lado === 'cliente') return VENDEDOR.concat(DONO, AGENTE, SERVICO);
    if (lado === 'vendedor') return CLIENTE.concat(DONO, AGENTE, SERVICO);
    if (lado === 'dono') return CLIENTE.concat(VENDEDOR, ['loja', 'chat', 'chat-novo', 'chat-novo2', 'live']);
    return CLIENTE.concat(VENDEDOR, DONO, LOJA_CLIENTE);       // agente
  }
  /* a que domínio pertence uma página (null = serve em qualquer lado) */
  function donoDaPagina(p) {
    if (tem(VENDEDOR, p)) return 'vendedor';
    if (tem(DONO, p)) return 'dono';
    if (tem(AGENTE, p) || tem(SERVICO, p)) return 'agente';
    if (tem(CLIENTE, p) || tem(LOJA_CLIENTE, p)) return 'cliente';
    return null;
  }

  /* ---------- avisos: cada lado só vê os seus ---------- */
  var U = 'https://dsfoqoeawvjafypycldz.supabase.co', K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';
  function sessao() { try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); if (s && s.currentSession) s = s.currentSession; return s && s.access_token ? s : null; } catch (e) { return null; } }
  function conversaDe(link) { var m = /[?&]conversa=([^&#]+)/.exec(String(link || '')); return m ? decodeURIComponent(m[1]) : null; }
  /* 'cliente' | 'vendedor' | 'dono' | 'agente' | null (serve aos dois) */
  function ladoDoAviso(a, convs, eu) {
    var link = String((a && a.link) || '');
    if (!link) return null;
    var p = pagina(link);
    if (p === 'pedidos-publicos' || p === 'publicacoes') return /[?&]p=/.test(link) ? 'vendedor' : (/#meus/.test(link) ? 'cliente' : null);
    if (p === 'chat' || p === 'chat-novo' || p === 'chat-novo2') {
      var c = convs && convs[conversaDe(link)];
      if (!c) return /[?&]dono=/.test(link) ? 'vendedor' : null;
      return c.cliente_id === eu ? 'cliente' : 'vendedor';
    }
    return donoDaPagina(p) === 'cliente' && p !== 'loja' ? 'cliente' : donoDaPagina(p);
  }
  /* devolve só os avisos do lado deste domínio */
  async function filtrar(lista, tokenOpc) {
    lista = lista || [];
    var lado = ladoDoHost(), s = sessao(), eu = s && s.user && s.user.id, tok = tokenOpc || (s && s.access_token);
    var ids = {}, convs = {};
    lista.forEach(function (a) { var c = conversaDe(a && a.link); if (c && /^[0-9a-f-]{8,}$/i.test(c)) ids[c] = 1; });
    var l = Object.keys(ids);
    if (l.length && tok) {
      try {
        var r = await fetch(U + '/rest/v1/conversas?select=id,cliente_id,vendedor_id&id=in.(' + l.join(',') + ')', { headers: { apikey: K, Authorization: 'Bearer ' + tok } });
        if (r.ok) (await r.json()).forEach(function (c) { convs[c.id] = c; });
      } catch (e) {}
    }
    return lista.filter(function (a) { var x = ladoDoAviso(a, convs, eu); return x === null || x === lado; });
  }

  window.BBLado = { ladoDoHost: ladoDoHost, pagina: pagina, proibidas: proibidas, donoDaPagina: donoDaPagina, dominio: DOM,
    ladoDoAviso: ladoDoAviso, filtrar: filtrar, listas: { VENDEDOR: VENDEDOR, DONO: DONO, AGENTE: AGENTE, SERVICO: SERVICO, CLIENTE: CLIENTE, LOJA_CLIENTE: LOJA_CLIENTE } };
})();
