/* imagem-rapida.js - BBabilonia
   Deixa a leitura de imagens mais rapida. Precisa do imagem-filtro.js carregado antes.
   Nao apaga nada: so troca a funcao verificar e reutiliza as regras do imagem-filtro.js.
   A leitura comeca logo que a imagem e escolhida (nao espera pelo botao Enviar).
   Le tambem texto chines (微信, 电话, ID WeChat, 抖音...) e aplica as regras de pedido de contacto/email
   do chat-traducao.js (window.BBPedeContacto) ao texto lido na imagem. */
(function () {
  'use strict';
  if (window.__bbRapida) return;
  window.__bbRapida = true;

  var JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  var TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var LINGUAS = 'eng+chi_sim';
  var MAXLADO = 1800;
  var workerP = null;
  var textoSuspeito = null;

  /* palavras chinesas de contacto e redes (o OCR põe espaços entre os caracteres: são tirados antes) */
  var CHINES = /微信|威信|薇信|微心|vx号|wx号|加微|加v|加我|v信|电话|手机|号码|联系|联络|客服|扫一扫|扫码|二维码|公众号|小程序|微博|抖音|快手|小红书|淘宝|闲鱼|拼多多|阿里|qq号|企鹅|群号|飞书|钉钉/i;

  function extra(texto) {
    texto = String(texto || '');
    var junto = texto.replace(/\s+/g, '');
    if (CHINES.test(junto)) return 'Não pode enviar contactos ou redes sociais.';
    if (typeof window.BBPedeContacto === 'function') {
      var linhas = texto.split(/\r?\n/);
      for (var i = 0; i < linhas.length; i++) {
        var l = linhas[i].trim();
        if (l.length < 3) continue;
        try { if (window.BBPedeContacto(l)) return 'Não pode enviar contactos (número, telefone, email).'; } catch (e) {}
      }
    }
    return '';
  }

  function carregar(src, pronto) {
    return new Promise(function (ok, erro) {
      if (pronto()) return ok();
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { if (pronto()) ok(); else erro(new Error('lib')); };
      s.onerror = function () { erro(new Error('lib')); };
      document.head.appendChild(s);
    });
  }

  function preparar() {
    if (!workerP) {
      workerP = carregar(TESS, function () { return typeof window.Tesseract !== 'undefined'; })
        .then(function () { return window.Tesseract.createWorker(LINGUAS); })
        .then(function (w) { try { localStorage.setItem('bb_ocr_ok', '1'); } catch (e) {} return w; })
        .catch(function (e) { workerP = null; throw e; });
    }
    return workerP;
  }

  function abrir(file) {
    return new Promise(function (ok, erro) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, m = Math.max(w, h);
        var alvo = m > MAXLADO ? MAXLADO : (m < 1000 ? 1500 : m);
        var e = alvo / m;
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * e));
        c.height = Math.max(1, Math.round(h * e));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c);
      };
      img.onerror = function () { URL.revokeObjectURL(url); erro(new Error('img')); };
      img.src = url;
    });
  }

  function realcar(c) {
    var o = document.createElement('canvas');
    o.width = c.width; o.height = c.height;
    var x = o.getContext('2d');
    x.drawImage(c, 0, 0);
    var im = x.getImageData(0, 0, o.width, o.height), d = im.data, min = 255, max = 0, i, g;
    for (i = 0; i < d.length; i += 4) {
      g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
      if (g < min) min = g;
      if (g > max) max = g;
    }
    var f = max > min ? 255 / (max - min) : 1;
    for (i = 0; i < d.length; i += 4) {
      g = (d[i] - min) * f;
      d[i] = d[i + 1] = d[i + 2] = g;
    }
    x.putImageData(im, 0, 0);
    return o;
  }

  async function temQR(c) {
    var detetorOk = false;
    if (window.BarcodeDetector) {
      try {
        var det = new window.BarcodeDetector({ formats: ['qr_code'] });
        var r = await det.detect(c);
        if (r && r.length) return true;
        detetorOk = true;
      } catch (e) {}
    }
    if (detetorOk) return false;
    await carregar(JSQR, function () { return typeof window.jsQR === 'function'; });
    var W = c.width, H = c.height, ctx = c.getContext('2d');
    var areas = [[0, 0, W, H], [0, 0, W >> 1, H >> 1], [W >> 1, 0, W - (W >> 1), H >> 1],
      [0, H >> 1, W >> 1, H - (H >> 1)], [W >> 1, H >> 1, W - (W >> 1), H - (H >> 1)]];
    for (var i = 0; i < areas.length; i++) {
      var a = areas[i], im = ctx.getImageData(a[0], a[1], a[2], a[3]);
      if (window.jsQR(im.data, im.width, im.height, { inversionAttempts: 'attemptBoth' })) return true;
    }
    var p = document.createElement('canvas');
    p.width = Math.max(1, W >> 1); p.height = Math.max(1, H >> 1);
    p.getContext('2d').drawImage(c, 0, 0, p.width, p.height);
    var im2 = p.getContext('2d').getImageData(0, 0, p.width, p.height);
    return !!window.jsQR(im2.data, im2.width, im2.height, { inversionAttempts: 'attemptBoth' });
  }

  async function lerTexto(c) {
    var w = await preparar();
    var r = await w.recognize(c);
    return (r && r.data && r.data.text) || '';
  }

  async function verificar(file, progresso) {
    progresso = progresso || function () {};
    try {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, motivo: 'Só são aceites imagens JPG, PNG ou WEBP.' };
      if (file.size > 5 * 1024 * 1024) return { ok: false, motivo: 'A imagem é maior que 5 MB.' };
      progresso('A abrir a imagem...');
      var c = await abrir(file);
      progresso('A ler a imagem...');
      var ocr = lerTexto(realcar(c));
      ocr.catch(function () {});
      if (await temQR(c)) return { ok: false, motivo: 'Imagem recusada: contém código QR.' };
      var t1 = await ocr;
      var m = textoSuspeito(t1);
      if (!m && t1.replace(/\s/g, '').length < 15) {
        progresso('A confirmar a leitura...');
        m = textoSuspeito(await lerTexto(c));
      }
      if (m) return { ok: false, motivo: 'Imagem recusada: contém contactos, links, redes sociais ou marca de água. (' + m + ')' };
      return { ok: true, motivo: '' };
    } catch (e) {
      return { ok: false, motivo: 'Não foi possível verificar a imagem. Verifique a internet e tente outra vez.' };
    }
  }

  var cache = {};
  function chave(f) { return f.name + '|' + f.size + '|' + f.lastModified; }
  function lerComCache(file) {
    if (!file || typeof file.name !== 'string') return verificar(file);
    var k = chave(file);
    if (!cache[k]) {
      cache[k] = verificar(file).then(function (r) {
        if (!r.ok && /^Não foi possível/.test(r.motivo)) delete cache[k];
        return r;
      });
    }
    return cache[k];
  }
  function verificarRapido(file, progresso) {
    if (progresso) { try { progresso('A ler a imagem...'); } catch (e) {} }
    return lerComCache(file);
  }

  var aviso = null, tAviso = null;
  function mostrar(texto) {
    if (!aviso || !aviso.isConnected) {
      aviso = document.createElement('div');
      aviso.style.cssText = 'display:none;position:fixed;left:8px;right:8px;z-index:99999;background:#fff;color:#c00;font-size:14px;padding:6px 10px;border-radius:8px';
      document.body.appendChild(aviso);
    }
    var inp = document.querySelector('input[placeholder^="Escreva"],textarea[placeholder^="Escreva"],input[placeholder*="ensagem"],textarea[placeholder*="ensagem"]');
    aviso.style.bottom = inp ? (window.innerHeight - inp.getBoundingClientRect().top + 6) + 'px' : '90px';
    aviso.textContent = texto;
    aviso.style.display = 'block';
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { if (aviso) aviso.style.display = 'none'; }, 6000);
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || t.type !== 'file' || !t.files) return;
    Array.prototype.forEach.call(t.files, function (f) {
      if (!f || !/^image\//.test(f.type)) return;
      lerComCache(f).then(function (r) {
        if (!r.ok && !/^Não foi possível/.test(r.motivo)) mostrar(r.motivo);
      }).catch(function () {});
    });
  }, true);

  function ligar() {
    var fi = window.FiltroImagem;
    if (!fi || typeof fi.textoSuspeito !== 'function') return false;
    var base = fi.textoSuspeito;
    textoSuspeito = function (t) { return base(t) || extra(t); };
    fi.verificar = verificarRapido;
    var antes = false;
    try { antes = localStorage.getItem('bb_ocr_ok') === '1'; } catch (e) {}
    if (antes) setTimeout(function () { preparar().catch(function () {}); }, 1500);
    return true;
  }

  if (!ligar()) {
    var n = 0, t = setInterval(function () { if (ligar() || ++n > 50) clearInterval(t); }, 200);
  }
})();
