/* BBabilônia · fotos-privadas.js (versão 3)
   Troca os links públicos das fotos do chat e dos links de pagamento (pastas chat-imagens e chat-privado)
   por links privados temporários, só para quem tem sessão iniciada e permissão:
   cliente, vendedor, funcionários do vendedor, agentes de atendimento e dono.
   Versão 2: lê também a sessão do atendimento (agentes), que fica guardada à parte.
   Versão 3 (correção da lentidão): este ficheiro corre 2 vezes no chat (na página e dentro do chat) e as duas
   cópias trocavam o link da mesma foto uma à outra sem parar (14 vezes em 8 segundos): a foto recomeçava a
   descarregar a cada troca e no 4G nunca acabava (só aparecia a parte de cima). Agora:
   - as duas cópias partilham os mesmos links (um só link por foto);
   - uma foto que já tem link privado nunca mais é trocada.
   Funciona também dentro dos iframes da mesma página (chat-novo2 → chat-novo → chat).
   Foto com contorno verde = já está a abrir pelo link privado. */
(function () {
  if (window.__bbFotosPrivadas) return;
  window.__bbFotosPrivadas = true;

  var U = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var K = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var SK = 'sb-dsfoqoeawvjafypycldz-auth-token';   // sessão da loja (cliente, vendedor, funcionário, dono)
  var SK_ATD = 'bb-atd';                            // sessão do atendimento (agentes) — sessionStorage
  var VALIDADE = 6 * 3600; // segundos
  var RE = /\/storage\/v1\/object\/(?:public|authenticated)\/(chat-imagens|chat-privado)\/([^?#]+)/;
  // links partilhados por todas as cópias deste ficheiro na mesma página (página + iframes)
  var cache = (function () {
    try { var t = window.top; return t.__bbFotosCache || (t.__bbFotosCache = {}); } catch (e) { return {}; }
  })(); // chave -> {url, ate} | {erro, ate} | {p: Promise}

  function tokenDe(txt) {
    try {
      var s = JSON.parse(txt || 'null');
      if (!s) return null;
      if (s.currentSession) s = s.currentSession;
      if (!s.access_token) return null;
      if (s.expires_at && s.expires_at * 1000 < Date.now()) return null; // expirado
      return s.access_token;
    } catch (e) { return null; }
  }
  function lerSessao(onde, chave) {
    try { return tokenDe(window[onde].getItem(chave)); } catch (e) { return null; }
  }
  function token() {
    // nas páginas do atendimento vale a sessão do agente; nas outras, a da loja
    return lerSessao('sessionStorage', SK_ATD) || lerSessao('localStorage', SK);
  }

  function assinar(bucket, caminho) {
    var chave = bucket + '/' + caminho;
    var c = cache[chave], agora = Date.now();
    if (c && c.p) return c.p;
    if (c && c.url && c.ate > agora) return Promise.resolve(c.url);
    if (c && c.erro && c.ate > agora) return Promise.resolve(null);
    var t = token();
    if (!t) return Promise.resolve(null);
    var p = fetch(U + '/storage/v1/object/sign/' + bucket + '/' + caminho, {
      method: 'POST',
      headers: { apikey: K, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: VALIDADE })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var s = j && (j.signedURL || j.signedUrl);
        if (!s) { cache[chave] = { erro: 1, ate: Date.now() + 20000 }; return null; }
        var url = /^https?:/.test(s) ? s : U + '/storage/v1' + (s.charAt(0) === '/' ? s : '/' + s);
        cache[chave] = { url: url, ate: Date.now() + (VALIDADE - 600) * 1000 };
        return url;
      })
      .catch(function () { cache[chave] = { erro: 1, ate: Date.now() + 20000 }; return null; });
    cache[chave] = { p: p };
    return p;
  }

  // a foto já está a abrir por um link privado desta mesma foto (e ainda válido)? então não se mexe
  function jaPrivado(atual, bucket, caminho) {
    return !!atual && atual.indexOf('/object/sign/' + bucket + '/' + caminho + '?') > -1;
  }

  function tratar(el, attr) {
    var orig = el.getAttribute('data-bb-orig') || el.getAttribute(attr);
    if (!orig) return;
    var m = orig.match(RE);
    if (!m) return;
    var atual = el.getAttribute(attr);
    if (el.getAttribute('data-bb-orig') && atual !== orig) {
      if (jaPrivado(atual, m[1], m[2])) return;   // versão 3: não volta a trocar
      var c = cache[m[1] + '/' + m[2]];
      if (c && c.url === atual && c.ate > Date.now()) return;
      if (c && c.p) return;
    }
    el.setAttribute('data-bb-orig', orig);
    assinar(m[1], m[2]).then(function (url) {
      if (!url) return;
      if ((el.getAttribute('data-bb-orig') || '') !== orig) return;
      var agora = el.getAttribute(attr);
      if (agora !== url && !jaPrivado(agora, m[1], m[2])) el.setAttribute(attr, url);
      if (el.tagName === 'IMG') { el.style.outline = '2px solid #10b981'; el.style.outlineOffset = '-2px'; }
    });
  }

  function varrer(doc) {
    try {
      var els = doc.querySelectorAll('img[src],a[href],iframe');
      for (var i = 0; i < els.length; i++) {
        var e = els[i];
        if (e.tagName === 'IFRAME') { try { if (e.contentDocument) varrer(e.contentDocument); } catch (x) {} continue; }
        if (e.tagName === 'IMG') {
          // se o src mudou para outra foto, esquecer a original antiga
          var o = e.getAttribute('data-bb-orig'), s = e.getAttribute('src');
          if (o && s && s !== o && RE.test(s)) e.removeAttribute('data-bb-orig');
          tratar(e, 'src');
        } else {
          var oa = e.getAttribute('data-bb-orig'), h = e.getAttribute('href');
          if (oa && h && h !== oa && RE.test(h)) e.removeAttribute('data-bb-orig');
          tratar(e, 'href');
        }
      }
    } catch (x) {}
  }

  function ciclo() { varrer(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ciclo); else ciclo();
  setInterval(ciclo, 1200);
  window.__bbFotosVarrer = ciclo;
})();
