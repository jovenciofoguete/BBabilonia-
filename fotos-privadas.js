/* fotos-privadas.js — BBabilônia
   As pastas das fotos do chat ("chat-imagens" e "chat-privado") são privadas.
   Este ficheiro troca sozinho, em qualquer página onde estiver ligado, cada foto dessas pastas
   por um link temporário (1 hora). Só recebe o link quem pode abrir a conversa da foto:
   o cliente, o vendedor (e os funcionários dele), os agentes de atendimento e o dono.
   Se não conseguir o link (ex.: a pasta ainda é pública), deixa a foto como estava.
   Não muda mais nada na página. */
(function () {
  'use strict';
  if (window.__bbFotosPriv) return;
  window.__bbFotosPriv = 1;

  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';
  var PASTAS = [
    { b: 'chat-imagens', marca: '/storage/v1/object/public/chat-imagens/' },
    { b: 'chat-privado', marca: '/storage/v1/object/authenticated/chat-privado/' }
  ];
  var VALIDADE = 3600, MARGEM = 10 * 60 * 1000, MAX_TENT = 4;
  var ESPERA = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var SEL = PASTAS.map(function (p) { return 'img[src*="' + p.marca + '"],a[href*="' + p.marca + '"],img[data-bbfp]'; }).join(',');

  var cache = {};      // "bucket|caminho" -> { url, ate }
  var falta = {};      // "bucket|caminho" -> 1
  var tent = {};       // "bucket|caminho" -> nº de tentativas falhadas
  var esperam = [];    // [{ el, at, orig, k }]
  var timer = null, aPedir = false;

  function ler(u) {
    u = String(u || '');
    for (var i = 0; i < PASTAS.length; i++) {
      var j = u.indexOf(PASTAS[i].marca);
      if (j > -1) {
        var c = u.slice(j + PASTAS[i].marca.length).split('?')[0].split('#')[0];
        try { c = decodeURIComponent(c); } catch (e) {}
        if (c) return { b: PASTAS[i].b, c: c, k: PASTAS[i].b + '|' + c };
      }
    }
    return null;
  }
  function valido(k) { var x = cache[k]; return x && x.ate > Date.now() ? x.url : null; }

  function trocar(el) {
    if (!el || !el.getAttribute) return;
    var at = el.tagName === 'A' ? 'href' : 'src';
    var orig = el.getAttribute(at) || '';
    if (at === 'src' && orig === ESPERA) orig = el.getAttribute('data-bbfp') || '';
    var f = ler(orig);
    if (!f) return;
    var u = valido(f.k);
    if (u) { el.setAttribute(at, u); el.removeAttribute('data-bbfp'); limparEspera(el); return; }
    if ((tent[f.k] || 0) >= MAX_TENT) return;
    if (el.__bbfpK === f.k + '@' + at && esperam.some(function (x) { return x.el === el; })) return;
    el.__bbfpK = f.k + '@' + at;
    if (at === 'src' && el.getAttribute('data-bbfp') !== orig) {
      el.setAttribute('data-bbfp', orig);
      el.setAttribute('src', ESPERA);
      if (!el.style.background) { el.style.background = '#e5e7eb'; el.__bbfpFundo = 1; }
    }
    esperam.push({ el: el, at: at, orig: orig, k: f.k });
    falta[f.k] = f;
    agendar(150);
  }
  function limparEspera(el) { if (el.__bbfpFundo) { el.style.background = ''; el.__bbfpFundo = 0; } }

  function varrer(raiz) {
    if (!raiz || raiz.nodeType !== 1) return;
    if (raiz.matches && raiz.matches(SEL)) trocar(raiz);
    if (raiz.querySelectorAll) { var l = raiz.querySelectorAll(SEL); for (var i = 0; i < l.length; i++) trocar(l[i]); }
  }

  function jwtValido(t) {
    try {
      var p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !p.exp || p.exp * 1000 > Date.now() + 20000;
    } catch (e) { return !!t; }
  }
  function deStorage(st, chave) {
    try { var j = JSON.parse(st.getItem(chave) || 'null'); var t = j && (j.access_token || (j.currentSession && j.currentSession.access_token)); return t && jwtValido(t) ? t : null; } catch (e) { return null; }
  }
  async function token() {
    try { if (typeof window.token === 'function') { var a = await window.token(); if (a && jwtValido(a)) return a; } } catch (e) {}
    try {
      if (window.sb && window.sb.auth && window.sb.auth.getSession) {
        var s = (await window.sb.auth.getSession()).data.session;
        if (s && s.access_token && jwtValido(s.access_token)) return s.access_token;
      }
    } catch (e) {}
    return deStorage(window.sessionStorage, 'bb-atd') || deStorage(window.localStorage, SK);
  }

  function agendar(ms) { clearTimeout(timer); timer = setTimeout(pedir, ms); }

  async function pedir() {
    if (aPedir) return agendar(300);
    var chaves = Object.keys(falta);
    if (!chaves.length) return;
    aPedir = true;
    var lote = {}; chaves.slice(0, 100).forEach(function (k) { var f = falta[k]; delete falta[k]; (lote[f.b] = lote[f.b] || []).push(f.c); });
    var t = await token();
    var falhou = false;
    for (var b in lote) {
      if (!t) { falhou = true; lote[b].forEach(function (c) { marcarFalha(b + '|' + c); }); continue; }
      try {
        var r = await fetch(U + '/storage/v1/object/sign/' + b, {
          method: 'POST',
          headers: { apikey: K, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
          body: JSON.stringify({ expiresIn: VALIDADE, paths: lote[b] })
        });
        var lista = r.ok ? await r.json() : [];
        var vistos = {};
        (Array.isArray(lista) ? lista : []).forEach(function (x) {
          var s = x && (x.signedURL || x.signedUrl);
          if (x && x.path && s && !x.error) {
            vistos[x.path] = 1;
            cache[b + '|' + x.path] = { url: /^https?:/.test(s) ? s : U + '/storage/v1' + (s.charAt(0) === '/' ? s : '/' + s), ate: Date.now() + VALIDADE * 1000 - MARGEM };
          }
        });
        lote[b].forEach(function (c) { if (!vistos[c]) { falhou = true; marcarFalha(b + '|' + c); } });
      } catch (e) { falhou = true; lote[b].forEach(function (c) { marcarFalha(b + '|' + c); }); }
    }
    aPedir = false;
    aplicar();
    if (Object.keys(falta).length) agendar(50);
    else if (falhou) agendar(4000);
  }

  function marcarFalha(k) {
    tent[k] = (tent[k] || 0) + 1;
    if (tent[k] < MAX_TENT) { var p = k.indexOf('|'); falta[k] = { b: k.slice(0, p), c: k.slice(p + 1), k: k }; }
  }

  function aplicar() {
    var resto = [];
    esperam.forEach(function (x) {
      var el = x.el;
      if (!el.isConnected) return;
      var atual = el.getAttribute(x.at);
      if (x.at === 'src' && atual !== ESPERA) return;            // a página já trocou a foto
      if (x.at === 'href' && atual !== x.orig) return;
      var u = valido(x.k);
      if (u) { el.setAttribute(x.at, u); el.removeAttribute('data-bbfp'); limparEspera(el); return; }
      if ((tent[x.k] || 0) >= MAX_TENT) {                       // sem link: volta a pôr o link original
        if (x.at === 'src') { el.removeAttribute('data-bbfp'); el.setAttribute('src', x.orig); limparEspera(el); }
        return;
      }
      resto.push(x);
    });
    esperam = resto;
  }

  function iniciar() {
    varrer(document.body);
    new MutationObserver(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        var m = lista[i];
        if (m.type === 'attributes') varrer(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) varrer(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] });
    // renova os links antes de expirarem (páginas abertas muito tempo)
    setInterval(function () {
      var agora = Date.now();
      Object.keys(cache).forEach(function (k) { if (cache[k].ate <= agora) delete cache[k]; });
    }, 60000);
  }
  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);

  window.BBFotosPrivadas = { ler: ler, token: token };
})();
