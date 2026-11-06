/* chat-privado.js — BBabilônia
   Fotos do chat privadas: só o cliente, o fornecedor (e os funcionários dele com "Mensagens")
   dessa conversa conseguem abrir as fotos. Quem tiver o link e não for da conversa não vê nada.
   Carregado pelo chat-novo.html dentro do chat.html. Não altera nenhum outro ficheiro:
   - as fotos novas do chat vão para a pasta privada "chat-privado" (em vez da pública "chat-imagens");
   - ao mostrar, cada foto privada recebe um link temporário (1 hora) só para quem está na conversa;
   - fotos de links de pagamento continuam na pasta pública (a página de pagamento precisa delas);
     se o fornecedor escolher para o link uma foto privada do chat, é feita uma cópia pública só para o link;
   - se a pasta privada ainda não existir (SQL não corrido), o chat continua a enviar como antes. */
(function () {
  'use strict';
  if (window.__bbChatPrivado) return;
  window.__bbChatPrivado = 1;

  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';
  var PUB = U + '/storage/v1/object/chat-imagens/';
  var PUB_VER = U + '/storage/v1/object/public/chat-imagens/';
  var PRIV = U + '/storage/v1/object/chat-privado/';
  var PRIV_VER = U + '/storage/v1/object/authenticated/chat-privado/';
  var SIGN = U + '/storage/v1/object/sign/chat-privado/';
  var MSGS = U + '/rest/v1/mensagens';
  var LINKS = U + '/rest/v1/links_pagamento';

  var fetch0 = window.fetch.bind(window);
  var privados = {};      // caminhos enviados para a pasta privada nesta sessão
  var assinados = {};     // caminho -> { url, ate }
  var aPedir = {};        // caminho -> Promise

  async function tok() {
    try { if (typeof window.token === 'function') { var t = await window.token(); if (t) return t; } } catch (e) {}
    try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); return (s && s.access_token) || null; } catch (e) { return null; }
  }
  function urlDe(r) { return typeof r === 'string' ? r : (r && r.url) || String(r || ''); }
  function metodo(r, o) { return String((o && o.method) || (r && typeof r === 'object' && r.method) || 'GET').toUpperCase(); }
  function nome(caminho) { var p = caminho.split('?')[0].split('/'); return p[p.length - 1] || ''; }
  function caminhoPriv(u) {
    u = String(u || '');
    var i = u.indexOf(PRIV_VER);
    return i === 0 ? decodeURIComponent(u.slice(PRIV_VER.length).split('?')[0]) : '';
  }
  function aleatorio() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  /* ---------- 1) envio: fotos novas do chat vão para a pasta privada ---------- */
  window.fetch = async function (r, o) {
    var u = urlDe(r), m = metodo(r, o);

    // enviar foto do chat (não as fotos "link-" dos links de pagamento)
    if (m === 'POST' && u.indexOf(PUB) === 0 && nome(u).indexOf('link-') !== 0 && o && o.body) {
      var caminho = u.slice(PUB.length).split('?')[0];
      try {
        var rp = await fetch0(PRIV + caminho, o);
        if (rp.ok) { privados[caminho] = 1; return rp; }
      } catch (e) {}
      return fetch0(r, o); // pasta privada indisponível: envia como antes, o chat não para
    }

    // guardar a mensagem: troca o link público pelo privado (só das fotos enviadas para a pasta privada)
    if (m === 'POST' && u.indexOf(MSGS) === 0 && o && typeof o.body === 'string') {
      try {
        var b = JSON.parse(o.body), mudou = false;
        [].concat(b).forEach(function (x) {
          if (x && typeof x.anexo_url === 'string' && x.anexo_url.indexOf(PUB_VER) === 0) {
            var c = x.anexo_url.slice(PUB_VER.length).split('?')[0];
            if (privados[c]) { x.anexo_url = PRIV_VER + c; mudou = true; }
          }
        });
        if (mudou) o = Object.assign({}, o, { body: JSON.stringify(b) });
      } catch (e) {}
      return fetch0(r, o);
    }

    // criar link de pagamento: fotos privadas do chat ganham uma cópia pública só para o link
    if (m === 'POST' && u.indexOf(LINKS) === 0 && o && typeof o.body === 'string') {
      try {
        var L = JSON.parse(o.body);
        var lista = [].concat(L);
        for (var i = 0; i < lista.length; i++) {
          var x = lista[i];
          if (!x || !Array.isArray(x.fotos)) continue;
          for (var j = 0; j < x.fotos.length; j++) {
            var cp = caminhoPriv(x.fotos[j]);
            if (cp) x.fotos[j] = await copiaPublica(cp, x.conversa_id);
          }
        }
        o = Object.assign({}, o, { body: JSON.stringify(L) });
      } catch (e) {}
      return fetch0(r, o);
    }

    return fetch0(r, o);
  };

  async function copiaPublica(caminho, conversa) {
    var t = await tok();
    var h = { apikey: K, Authorization: 'Bearer ' + (t || K) };
    var g = await fetch0(PRIV_VER + caminho, { headers: h });
    if (!g.ok) throw new Error('Não foi possível usar esta foto do chat no link.');
    var blob = await g.blob();
    var ext = (nome(caminho).split('.').pop() || 'jpg').toLowerCase();
    var pasta = String(conversa || caminho.split('/')[0]);
    var novo = pasta + '/link-' + aleatorio() + '.' + ext;
    var up = await fetch0(PUB + novo, {
      method: 'POST',
      headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': blob.type || 'image/jpeg', 'x-upsert': 'false' },
      body: blob
    });
    if (!up.ok) throw new Error('Não foi possível usar esta foto do chat no link.');
    return PUB_VER + novo;
  }

  /* ---------- 2) mostrar: cada foto privada recebe um link temporário ---------- */
  function assinar(caminho) {
    var c = assinados[caminho];
    if (c && c.ate > Date.now()) return Promise.resolve(c.url);
    if (aPedir[caminho]) return aPedir[caminho];
    aPedir[caminho] = (async function () {
      var t = await tok();
      var res = await fetch0(SIGN + caminho.split('/').map(encodeURIComponent).join('/'), {
        method: 'POST',
        headers: { apikey: K, Authorization: 'Bearer ' + (t || K), 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 3600 })
      });
      var j = await res.json().catch(function () { return null; });
      if (!res.ok || !j || !(j.signedURL || j.signedUrl)) throw new Error('sem acesso');
      var s = j.signedURL || j.signedUrl;
      var url = /^https?:/.test(s) ? s : U + '/storage/v1' + (s.charAt(0) === '/' ? s : '/' + s);
      assinados[caminho] = { url: url, ate: Date.now() + 50 * 60 * 1000 };
      return url;
    })().finally(function () { delete aPedir[caminho]; });
    return aPedir[caminho];
  }

  var TRANSP = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  function tratar(el) {
    var attr = el.tagName === 'A' ? 'href' : 'src';
    var v = el.getAttribute(attr) || '';
    var c = caminhoPriv(v);
    if (!c) return;
    var pronto = assinados[c];
    if (pronto && pronto.ate > Date.now()) { el.setAttribute(attr, pronto.url); return; }
    if (attr === 'src') { el.setAttribute('data-priv', v); el.setAttribute(attr, TRANSP); el.style.minHeight = el.style.minHeight || '80px'; el.style.background = el.style.background || '#eee'; }
    assinar(c).then(function (url) {
      if (el.getAttribute(attr) === v || el.getAttribute('data-priv') === v) { el.setAttribute(attr, url); el.style.minHeight = ''; el.style.background = ''; }
    }, function () {
      if (attr === 'src') { el.alt = 'Foto privada'; el.title = 'Só as pessoas desta conversa podem ver esta foto.'; }
    });
  }
  function varrer(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    if (raiz.matches && raiz.matches('img[src*="/authenticated/chat-privado/"],a[href*="/authenticated/chat-privado/"]')) tratar(raiz);
    Array.prototype.forEach.call(raiz.querySelectorAll('img[src*="/authenticated/chat-privado/"],a[href*="/authenticated/chat-privado/"]'), tratar);
  }
  function iniciar() {
    varrer(document.body);
    new MutationObserver(function (lista) {
      lista.forEach(function (m) {
        if (m.type === 'attributes') varrer(m.target);
        else Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) varrer(n); });
      });
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] });
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);

  window.BBChatPrivado = { assinar: assinar, caminho: caminhoPriv };
})();
