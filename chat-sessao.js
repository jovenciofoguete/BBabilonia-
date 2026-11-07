/* chat-sessao.js — B-Babilônia: as conversas do chat já não "desaparecem" quando se sai um pouco.
   Problema: ao voltar ao chat (telemóvel bloqueado, outra app, internet a voltar), a renovação da
   sessão falhava e o chat pedia as conversas sem sessão -> vinha a lista vazia ("Ainda não tem conversas").
   Agora: renova a sessão com novas tentativas, aproveita a sessão renovada por outra página da loja,
   nunca pede dados sem sessão (nunca mostra a lista vazia por engano) e, ao voltar ao chat, recarrega
   as conversas. Não apaga nada: só substitui as funções token() e api() do chat.html.
   (07/11/2026) Lados por domínio: em bbabilonia.com qualquer conta só vê as conversas em que é CLIENTE;
   em suppliers.bbabilonia.com só as conversas da loja (fornecedor e funcionários).
   Painéis do dono (administrator) e do atendimento (service): não aparece nenhuma conversa pessoal
   (nem de cliente nem de fornecedor), mesmo com o mesmo email.
   (07/11/2026 v2) Corrigido: no telemóvel a primeira lista (pedida pelo chat.html antes deste ficheiro
   abrir) chegava depois e voltava a mostrar "Você é o cliente" no domínio do fornecedor. Agora nenhuma
   conversa do outro lado aparece, chegue a lista quando chegar; e uma conversa do outro lado aberta
   por engano é fechada de imediato. */
(function () {
  'use strict';
  if (window.__bbSessao) return;
  window.__bbSessao = 1;

  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';

  var H = location.hostname.toLowerCase();
  var LADO_VEND = /^(suppliers|fornecedor|supplies)\./.test(H);
  var LADO_STAFF = /^(administrator|admin|service|atendimento)\./.test(H);   // dono e agentes de atendimento
  var LADO_CLI = !LADO_VEND && !LADO_STAFF;
  var ORX = /or=\(cliente_id\.eq\.([^,()]+),vendedor_id\.eq\.([^,()]+)\)/;
  function topo(url) { try { window.top.location.replace(url); } catch (e) { location.replace(url); } }
  function euReal() { var s = ler(); return s && s.user && s.user.id; }
  /* no domínio do fornecedor, "falar com o fornecedor" (como cliente) abre na loja bbabilonia.com */
  if (LADO_VEND && new URLSearchParams(location.search).get('vendedor')) {
    topo('https://bbabilonia.com/chat-novo2.html' + location.search);
  }
  function ladoDaLista(path) {
    if (!ORX.test(path)) return path;
    if (LADO_CLI) { var r = euReal(); return r ? path.replace(ORX, 'cliente_id=eq.' + r) : path; }
    if (LADO_VEND) return path.replace(ORX, function (m, a, b) { return 'vendedor_id=eq.' + b; });
    if (LADO_STAFF) return path.replace(ORX, 'id=is.null');   // painel do dono/atendimento: nada pessoal (nem cliente nem fornecedor)
    return path;
  }
  /* esta conversa pertence ao lado deste domínio? */
  function doMeuLado(c) {
    var r = euReal();
    if (!c || !r) return true;
    if (LADO_VEND) return c.cliente_id !== r;          // no fornecedor nunca aparece conversa em que sou cliente
    if (LADO_CLI) return c.cliente_id === r;           // na loja só as conversas em que sou cliente
    if (LADO_STAFF) return c.cliente_id !== r && c.vendedor_id !== r;   // dono/agentes: só conversas de outros (atendimento)
    return true;
  }
  /* conversa aberta pelo id (link/aviso): se for do outro lado, abre no domínio certo */
  function conversaDoOutroLado(path, j) {
    if (!/^conversas\?select=\*&id=eq\./.test(path) || !j || !j.length) return false;
    var c = j[0], r = euReal(), q = '?conversa=' + encodeURIComponent(c.id);
    if (LADO_CLI && c.cliente_id !== r) {
      if (c.vendedor_id === r) { topo('https://suppliers.bbabilonia.com/chat-novo2.html' + q); return true; }
      return 'esconder';
    }
    if (LADO_VEND && c.cliente_id === r) { topo('https://bbabilonia.com/chat-novo2.html' + q); return true; }
    if (LADO_STAFF && c.cliente_id === r) { topo('https://bbabilonia.com/chat-novo2.html' + q); return true; }
    if (LADO_STAFF && c.vendedor_id === r) { topo('https://suppliers.bbabilonia.com/chat-novo2.html' + q); return true; }
    return false;
  }

  function ler() { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { return null; } }
  function valido(s) { return !!(s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now() + 30000)); }
  function espera(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function gravar(j, antiga) {
    var s = {
      access_token: j.access_token, refresh_token: j.refresh_token || (antiga && antiga.refresh_token),
      token_type: j.token_type || 'bearer', expires_in: j.expires_in,
      expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600),
      user: j.user || (antiga && antiga.user)
    };
    try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  /* renova a sessão: até 4 tentativas; nunca apaga a sessão guardada */
  async function renovar() {
    for (var i = 0; i < 4; i++) {
      var s = ler();
      if (!s || !s.refresh_token) return null;
      if (valido(s)) return s.access_token;            // outra página da loja já renovou
      try {
        var r = await fetch(U + '/auth/v1/token?grant_type=refresh_token', {
          method: 'POST', headers: { apikey: K, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: s.refresh_token })
        });
        var j = null; try { j = await r.json(); } catch (e) {}
        if (r.ok && j && j.access_token) return gravar(j, s).access_token;
        if (r.status >= 400 && r.status < 500) {
          // pode ter sido outra página a renovar ao mesmo tempo: espera e volta a ler
          await espera(1200);
          var b = ler();
          if (valido(b)) return b.access_token;
          if (b && b.refresh_token !== s.refresh_token) continue;   // há um token novo: tenta com ele
          if (i >= 1) return null;                                   // sessão terminou mesmo
          continue;
        }
      } catch (e) { /* sem internet: tenta outra vez */ }
      await espera(1500 * (i + 1));
    }
    var c = ler();
    return valido(c) ? c.access_token : undefined;     // undefined = sem internet (não é fim de sessão)
  }

  var aRenovar = null;
  window.token = async function () {
    var s = ler();
    if (!s || !s.access_token) return null;
    if (valido(s)) return s.access_token;
    if (!aRenovar) aRenovar = renovar().then(function (t) { aRenovar = null; return t; }, function () { aRenovar = null; return undefined; });
    return aRenovar;
  };

  function semSessao() {
    if (typeof window.mostrar !== 'function') return;
    window.mostrar('login');
    var e = document.getElementById('lerro');
    if (e) e.textContent = 'A sua sessão terminou. Entre outra vez para ver as conversas.';
  }

  /* ids das conversas que este domínio pode mostrar (null = ainda não chegou a lista filtrada) */
  var permitidas = null;

  window.api = async function (path, metodo, corpo) {
    metodo = metodo || 'GET';
    var eLista = metodo === 'GET' && ORX.test(path);
    if (metodo === 'GET') path = ladoDaLista(path);
    var t = await window.token();
    if (t === undefined) throw new Error('Sem ligação à internet. As conversas continuam guardadas.');
    if (!t) { semSessao(); throw new Error('A sua sessão terminou. Entre outra vez.'); }
    for (var i = 0; i < 3; i++) {
      var r;
      try {
        r = await fetch(U + '/rest/v1/' + path, {
          method: metodo,
          headers: { apikey: K, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', Prefer: 'return=representation' },
          body: corpo ? JSON.stringify(corpo) : undefined
        });
      } catch (e) {
        if (metodo !== 'GET' || i === 2) throw new Error('Sem ligação à internet. Tente outra vez.');
        await espera(1500);
        continue;
      }
      var txt = await r.text(), j = null;
      try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
      if (r.status === 401 && i < 2) {
        // sessão recusada pelo servidor: força a renovação e repete (o pedido não foi feito)
        var s = ler();
        if (s) { s.expires_at = 1; try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {} }
        t = await window.token();
        if (t === undefined) throw new Error('Sem ligação à internet. As conversas continuam guardadas.');
        if (!t) { semSessao(); throw new Error('A sua sessão terminou. Entre outra vez.'); }
        continue;
      }
      if (!r.ok) throw new Error((j && j.message) || ('Erro ' + r.status));
      if (metodo === 'GET') {
        var o = conversaDoOutroLado(path, j);
        if (o === true) return new Promise(function () {});     // a mudar de domínio
        if (o === 'esconder') return [];
        if (eLista && Array.isArray(j)) {
          j = j.filter(doMeuLado);
          var p = {}; j.forEach(function (c) { p[c.id] = 1; }); permitidas = p;
          setTimeout(marcarLista, 0);
        }
      }
      return j;
    }
    throw new Error('Não foi possível carregar. Tente outra vez.');
  };

  /* ---- lista: só aparecem as conversas deste lado, mesmo que uma lista antiga chegue atrasada ---- */
  var pediuLista = false;
  function marcarLista() {
    var l = document.getElementById('lista');
    if (!l) return;
    var itens = l.querySelectorAll('.item');
    if (!permitidas) {
      // chegou a lista do chat.html sem filtro: pede a lista certa (os itens ficam escondidos até lá)
      if (itens.length && !pediuLista && typeof window.listar === 'function') {
        pediuLista = true;
        window.listar().catch(function () { pediuLista = false; });
      }
      return;
    }
    var ficou = 0;
    Array.prototype.forEach.call(itens, function (el) {
      if (permitidas[el.getAttribute('data-id')]) { if (!el.hasAttribute('data-bb-ok')) el.setAttribute('data-bb-ok', '1'); ficou++; }
      else el.parentNode.removeChild(el);
    });
    if (itens.length && !ficou && !l.querySelector('.vazio')) {
      var v = document.createElement('p'); v.className = 'vazio'; v.textContent = 'Ainda não tem conversas.'; l.appendChild(v);
    }
  }
  if (LADO_VEND || LADO_CLI || LADO_STAFF) {
    var css = document.createElement('style');
    css.textContent = '#lista .item:not([data-bb-ok]){display:none!important}';
    (document.head || document.documentElement).appendChild(css);
    (function vigiaLista() {
      var l = document.getElementById('lista');
      if (!l) { setTimeout(vigiaLista, 100); return; }
      new MutationObserver(marcarLista).observe(l, { childList: true, subtree: true });
      marcarLista();
    })();
    /* ---- conversa aberta: se for do outro lado, fecha logo (sem esperar pela internet) ---- */
    setInterval(function () {
      try {
        if (window.vista !== 'chat' || !window.conv || doMeuLado(window.conv)) return;
        var c = window.conv, r = euReal(), q = '?conversa=' + encodeURIComponent(c.id);
        window.conv = null;
        var m = document.getElementById('msgs'); if (m) m.innerHTML = '';
        if (c.cliente_id === r && !LADO_CLI) topo('https://bbabilonia.com/chat-novo2.html' + q);
        else if (c.vendedor_id === r) topo('https://suppliers.bbabilonia.com/chat-novo2.html' + q);
        else if (typeof window.listar === 'function') window.listar().catch(function () {});
      } catch (e) {}
    }, 250);
  }

  /* o chat já abriu antes deste ficheiro: volta a mostrar a lista / confirma a conversa com as regras do domínio */
  function aplicarLado() {
    try {
      if (window.vista === 'lista' && typeof window.listar === 'function') window.listar().catch(function () {});
      else if (window.vista === 'chat' && window.conv) {
        window.api('conversas?select=*&id=eq.' + encodeURIComponent(window.conv.id)).then(function (j) {
          if (!j.length && typeof window.listar === 'function') window.listar().catch(function () {});
        }, function () {});
      }
    } catch (e) {}
  }
  setTimeout(aplicarLado, 50); setTimeout(aplicarLado, 1500);

  /* ao voltar ao chat: recarrega a lista ou a conversa aberta */
  var ultimaVolta = 0;
  function voltou() {
    if (document.visibilityState === 'hidden') return;
    if (Date.now() - ultimaVolta < 3000) return;
    ultimaVolta = Date.now();
    try {
      if (window.vista === 'lista' && typeof window.listar === 'function') window.listar().catch(function () {});
      else if (window.vista === 'chat' && window.conv && typeof window.carregar === 'function') window.carregar(false).catch(function () {});
      else if (window.vista === 'login' && valido(ler()) && typeof window.iniciar === 'function') window.iniciar();
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', voltou);
  window.addEventListener('pageshow', voltou);
  window.addEventListener('online', voltou);
  try { window.parent.addEventListener('pageshow', voltou); window.parent.document.addEventListener('visibilitychange', voltou); } catch (e) {}
})();
