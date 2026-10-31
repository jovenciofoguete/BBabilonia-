/* chat-imagens-privadas.js — BBabilônia
   As fotos do chat ficam numa pasta privada. Este ficheiro troca sozinho cada link antigo
   (.../object/public/chat-imagens/...) por um link temporário pedido a /api/chat-imagem.
   Não muda nada no resto da página. */
(function () {
  if (window.__bbChatImgPriv) return;
  window.__bbChatImgPriv = true;

  var MARCA = '/storage/v1/object/public/chat-imagens/';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';
  var cache = {};          // caminho -> { url, ate }
  var falta = {};          // caminhos à espera de link
  var tentativas = {};     // caminho -> nº de tentativas falhadas
  var timer = null, aPedir = false;

  function caminhoDe(u) {
    if (!u || typeof u !== 'string') return null;
    var i = u.indexOf(MARCA);
    if (i < 0) return null;
    var c = u.slice(i + MARCA.length).split('?')[0].split('#')[0];
    try { c = decodeURIComponent(c); } catch (e) {}
    return c || null;
  }

  function valido(c) { var x = cache[c]; return x && x.ate > Date.now() + 60000 ? x.url : null; }

  function trocar(el) {
    ['src', 'href'].forEach(function (at) {
      var v = el.getAttribute && el.getAttribute(at);
      var c = caminhoDe(v);
      if (!c) return;
      var u = valido(c);
      if (u) { el.setAttribute(at, u); }
      else if ((tentativas[c] || 0) < 3) { falta[c] = 1; agendar(); }
    });
  }

  function varrer(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    if (raiz.matches && raiz.matches('img,a')) trocar(raiz);
    var l = raiz.querySelectorAll('img[src*="' + MARCA + '"],a[href*="' + MARCA + '"]');
    for (var i = 0; i < l.length; i++) trocar(l[i]);
  }

  async function obterToken() {
    try { if (typeof window.token === 'function') { var t = await window.token(); if (t) return t; } } catch (e) {}
    try {
      if (window.sb && window.sb.auth) { var s = (await window.sb.auth.getSession()).data.session; if (s) return s.access_token; }
    } catch (e) {}
    try { var j = JSON.parse(localStorage.getItem(SK) || 'null'); return j && j.access_token; } catch (e) { return null; }
  }

  function agendar() { if (!timer) timer = setTimeout(pedir, 120); }

  async function pedir() {
    timer = null;
    if (aPedir) { agendar(); return; }
    var lista = Object.keys(falta).slice(0, 60);
    if (!lista.length) return;
    aPedir = true;
    lista.forEach(function (c) { delete falta[c]; });
    try {
      var t = await obterToken();
      if (!t) throw new Error('sem sessão');
      var r = await fetch('/api/chat-imagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
        body: JSON.stringify({ caminhos: lista })
      });
      var j = await r.json().catch(function () { return {}; });
      var urls = (j && j.urls) || {};
      var ate = Date.now() + ((j && j.validade) || 3600) * 1000;
      lista.forEach(function (c) {
        if (urls[c]) cache[c] = { url: urls[c], ate: ate };
        else tentativas[c] = (tentativas[c] || 0) + 1;
      });
    } catch (e) {
      lista.forEach(function (c) { tentativas[c] = (tentativas[c] || 0) + 1; });
    }
    aPedir = false;
    varrer(document.body);
    if (Object.keys(falta).length) agendar();
  }

  function iniciar() {
    varrer(document.body);
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'attributes') trocar(m.target);
        else for (var k = 0; k < m.addedNodes.length; k++) varrer(m.addedNodes[k]);
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] });
    // renova os links antes de expirarem (conversas abertas muito tempo)
    setInterval(function () {
      Object.keys(cache).forEach(function (c) { if (cache[c].ate < Date.now() + 5 * 60000) delete cache[c]; });
      tentativas = {};
    }, 10 * 60000);
  }

  if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
})();
