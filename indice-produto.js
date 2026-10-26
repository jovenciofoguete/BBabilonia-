/* BBabilonia - ao abrir a pagina de um produto (?id=...), guarda as fotos dele
   no indice da pesquisa por imagem, se ainda faltarem. Ficheiro novo: nao mexe na pagina. */
(function () {
  if (window.__bbIndiceProduto) return; window.__bbIndiceProduto = true;
  var id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  var SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  function cab(extra) { var h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }; for (var k in extra) h[k] = extra[k]; return h; }

  function fotosDoProduto(p) {
    var urls = [];
    function andar(v, chave) {
      if (v == null) return;
      if (typeof v === 'string') {
        var s = v.trim();
        if ((s[0] === '[' || s[0] === '{') && s.length > 2) { try { andar(JSON.parse(s), chave); return; } catch (e) {} }
        if (/^https?:\/\//i.test(s) && !/video/i.test(chave || '') && !/\.(mp4|mov|webm|m4v|avi)(\?|$)/i.test(s)) {
          if (urls.indexOf(s) < 0) urls.push(s);
        }
        return;
      }
      if (Array.isArray(v)) { v.forEach(function (x) { andar(x, chave); }); return; }
      if (typeof v === 'object') { Object.keys(v).forEach(function (k) { andar(v[k], k); }); }
    }
    ['image_url', 'images', 'variants', 'opcoes'].forEach(function (k) { andar(p[k], k); });
    return urls;
  }

  function carregar(src) {
    return new Promise(function (ok, falha) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); }; im.onerror = function () { falha(new Error('imagem')); };
      im.src = src;
    });
  }

  /* A mesma impressao digital usada na pesquisa-rapida.html */
  function assinatura(im) {
    var w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
    var c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
    c.width = 9; c.height = 8; g.drawImage(im, 0, 0, w, h, 0, 0, 9, 8);
    var d = g.getImageData(0, 0, 9, 8).data, cinz = [], bits = '';
    for (var i = 0; i < 72; i++) cinz.push(d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114);
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) bits += cinz[y * 9 + x] > cinz[y * 9 + x + 1] ? '1' : '0';
    c.width = 32; c.height = 32; g.drawImage(im, 0, 0, w, h, 0, 0, 32, 32);
    var p = g.getImageData(0, 0, 32, 32).data, hist = new Array(64).fill(0);
    for (var k = 0; k < p.length; k += 4) hist[(p[k] >> 6) * 16 + (p[k + 1] >> 6) * 4 + (p[k + 2] >> 6)]++;
    hist = hist.map(function (n) { return Math.round(n / 1024 * 1000) / 1000; });
    return { d: bits, h: hist };
  }

  function iniciar() {
    Promise.all([
      fetch(SUPABASE_URL + '/rest/v1/products?select=*&id=eq.' + encodeURIComponent(id), { headers: cab() }).then(function (r) { return r.ok ? r.json() : []; }),
      fetch(SUPABASE_URL + '/rest/v1/imagem_hash?select=url&product_id=eq.' + encodeURIComponent(id), { headers: cab() }).then(function (r) { return r.ok ? r.json() : []; })
    ]).then(function (r) {
      if (!r[0].length) return;
      var feitas = {}; r[1].forEach(function (x) { feitas[x.url] = 1; });
      var falta = fotosDoProduto(r[0][0]).filter(function (u) { return !feitas[u]; });
      return Promise.all(falta.map(function (u) {
        return carregar(u).then(function (im) {
          var s = assinatura(im);
          return fetch(SUPABASE_URL + '/rest/v1/imagem_hash', {
            method: 'POST', headers: cab({ Prefer: 'return=minimal' }),
            body: JSON.stringify({ url: u, product_id: id, dhash: s.d, hist: s.h })
          });
        }).catch(function () {});
      }));
    }).catch(function () {});
  }
  setTimeout(iniciar, 1500);
})();
