/* chat-privado.js — BBabilônia (versão 2)
   Fotos do chat privadas. Carregado pelo chat-novo.html dentro do chat.html.
   - as fotos novas do chat vão para a pasta privada "chat-privado";
   - as fotos (novas, antigas e dos links de pagamento) são mostradas pelo fotos-privadas.js,
     com um link temporário só para quem pode abrir a conversa (cliente, vendedor, funcionários,
     agentes de atendimento e dono);
   - se a pasta privada falhar, a foto é enviada como antes: o chat nunca para. */
(function () {
  'use strict';
  if (window.__bbChatPrivado) return;
  window.__bbChatPrivado = 1;

  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var PUB = U + '/storage/v1/object/chat-imagens/';
  var PUB_VER = U + '/storage/v1/object/public/chat-imagens/';
  var PRIV = U + '/storage/v1/object/chat-privado/';
  var PRIV_VER = U + '/storage/v1/object/authenticated/chat-privado/';
  var MSGS = U + '/rest/v1/mensagens';

  var fetch0 = window.fetch.bind(window);
  var privados = {};   // fotos enviadas para a pasta privada nesta sessão

  function urlDe(r) { return typeof r === 'string' ? r : (r && r.url) || String(r || ''); }
  function metodo(r, o) { return String((o && o.method) || (r && typeof r === 'object' && r.method) || 'GET').toUpperCase(); }
  function nome(c) { var p = c.split('?')[0].split('/'); return p[p.length - 1] || ''; }

  window.fetch = async function (r, o) {
    var u = urlDe(r), m = metodo(r, o);

    // enviar foto do chat (as fotos "link-" dos links de pagamento ficam na pasta delas)
    if (m === 'POST' && u.indexOf(PUB) === 0 && nome(u).indexOf('link-') !== 0 && o && o.body) {
      var caminho = u.slice(PUB.length).split('?')[0];
      try {
        var rp = await fetch0(PRIV + caminho, o);
        if (rp.ok) { privados[caminho] = 1; return rp; }
      } catch (e) {}
      return fetch0(r, o);
    }

    // guardar a mensagem com o endereço da pasta privada
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

    return fetch0(r, o);
  };

  // mostrar as fotos privadas
  if (!document.querySelector('script[src*="fotos-privadas.js"]')) {
    var s = document.createElement('script');
    s.src = 'fotos-privadas.js?v=1';
    (document.head || document.documentElement).appendChild(s);
  }
})();
