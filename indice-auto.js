/* BBabilonia - guarda no indice da pesquisa por imagem as fotos de cada produto
   logo que o fornecedor publica ou altera um produto. Ficheiro novo: nao mexe no registo. */
(function () {
  if (window.__bbIndiceAuto) return; window.__bbIndiceAuto = true;
  var SUPABASE_URL = 'https://dsfoqoeawvjafypycldz.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_BN4NiVcDab9CqdTY_odgDA_uUOhjja0';
  var aCorrer = false, deNovo = false, espera = null;

  function cab(extra) { var h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }; for (var k in extra) h[k] = extra[k]; return h; }
  var fetchOriginal = window.fetch.bind(window);

  function lerTudo(caminho) {
    var todos = [], passo = 1000;
    function pagina(ini) {
      return fetchOriginal(SUPABASE_URL + '/rest/v1/' + caminho, { headers: cab({ Range: ini + '-' + (ini + passo - 1), 'Range-Unit': 'items' }) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (l) { todos = todos.concat(l || []); return l && l.length === passo ? pagina(ini + passo) : todos; });
    }
    return pagina(0);
  }

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

  function aviso(t) {
    try {
      var a = document.createElement('div'); a.textContent = t;
      a.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:99999;background:#0a8f5a;color:#fff;padding:10px 16px;border-radius:20px;font:600 13px Arial,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);max-width:90%;text-align:center';
      document.body.appendChild(a); setTimeout(function () { a.remove(); }, 3500);
    } catch (e) {}
  }

  /* Produtos a verificar: todos (ao abrir) ou so os mais recentes (depois de gravar e a cada 15 s) */
  function lerProdutos(tudo) {
    if (tudo) return lerTudo('products?select=*');
    return fetchOriginal(SUPABASE_URL + '/rest/v1/products?select=*&order=created_at.desc&limit=30', { headers: cab() })
      .then(function (r) { return r.ok ? r.json() : lerTudo('products?select=*'); });
  }

  function jaGuardadas(urls) {
    var feitas = {}, grupos = [];
    for (var i = 0; i < urls.length; i += 20) grupos.push(urls.slice(i, i + 20));
    return Promise.all(grupos.map(function (g) {
      var lista = g.map(function (u) { return '"' + u.replace(/"/g, '\\"') + '"'; }).join(',');
      return fetchOriginal(SUPABASE_URL + '/rest/v1/imagem_hash?select=url&url=in.(' + encodeURIComponent(lista) + ')', { headers: cab() })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (l) { l.forEach(function (x) { feitas[x.url] = 1; }); });
    })).then(function () { return feitas; });
  }

  var pedidoTudo = false;
  function indexar() {
    if (aCorrer) { deNovo = true; return; }
    aCorrer = true;
    var tudo = pedidoTudo; pedidoTudo = false;
    lerProdutos(tudo).then(function (produtos) {
      var todas = [];
      produtos.forEach(function (p) { fotosDoProduto(p).forEach(function (u) { todas.push({ id: p.id, u: u }); }); });
      return jaGuardadas(todas.map(function (t) { return t.u; })).then(function (feitas) {
        return todas.filter(function (t) { return !feitas[t.u]; });
      });
    }).then(function (falta) {
      var idx = 0, guardadas = 0;
      function proxima() {
        if (idx >= falta.length) return Promise.resolve();
        var t = falta[idx++];
        return carregar(t.u).then(function (im) {
          var s = assinatura(im);
          return fetchOriginal(SUPABASE_URL + '/rest/v1/imagem_hash', {
            method: 'POST', headers: cab({ Prefer: 'return=minimal' }),
            body: JSON.stringify({ url: t.u, product_id: t.id, dhash: s.d, hist: s.h })
          }).then(function (resp) { if (resp.ok) guardadas++; });
        }).catch(function () {}).then(proxima);
      }
      var filas = []; for (var n = 0; n < 4; n++) filas.push(proxima());
      return Promise.all(filas).then(function () {
        if (guardadas) aviso('✓ ' + guardadas + (guardadas === 1 ? ' foto pronta' : ' fotos prontas') + ' para a pesquisa por imagem');
      });
    }).catch(function () {}).then(function () {
      aCorrer = false;
      if (deNovo) { deNovo = false; agendar(1000); }
    });
  }

  function agendar(ms) { clearTimeout(espera); espera = setTimeout(indexar, ms); }

  /* Vigia quando a pagina grava um produto (criar ou alterar) e indexa logo a seguir */
  window.fetch = function (entrada, opcoes) {
    var url = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '';
    var metodo = ((opcoes && opcoes.method) || (entrada && entrada.method) || 'GET').toUpperCase();
    var pr = fetchOriginal(entrada, opcoes);
    if (/\/rest\/v1\/products(\?|$)/.test(url) && metodo !== 'GET') {
      pr.then(function (r) { if (r && r.ok) agendar(800); }).catch(function () {});
    }
    return pr;
  };

  /* Ao abrir a pagina guarda todas as fotos que tenham ficado de fora */
  pedidoTudo = true; agendar(2500);
  /* Enquanto a pagina esta aberta, verifica os produtos recentes a cada 15 segundos */
  setInterval(function () { if (!document.hidden) indexar(); }, 15000);
})();
